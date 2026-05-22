import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

function waiterSuggestionsDevApi(env = {}) {
  return {
    name: 'waiter-suggestions-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/waiter-suggestions', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const body = await readJsonBody(req)
          const { createWaiterSuggestions } = await import('./api/waiter-suggestions.js')
          const result = await createWaiterSuggestions(body, {
            ...process.env,
            ...env,
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (error) {
          res.statusCode = error.statusCode || 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'waiter_suggestions_failed',
            message: error.message,
          }))
        }
      })
    },
  }
}

function readLocalCouchPassword() {
  const username = 'admin'
  const localIniPaths = [
    '/opt/homebrew/etc/couchdb/local.ini',
    '/opt/homebrew/Cellar/couchdb/3.5.2/etc/local.ini',
    '/usr/local/etc/couchdb/local.ini',
  ]

  for (const localIniPath of localIniPaths) {
    if (!fs.existsSync(localIniPath)) continue

    let inAdmins = false
    let password = ''

    for (const rawLine of fs.readFileSync(localIniPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()

      if (!line || line.startsWith(';')) continue

      if (line.startsWith('[')) {
        inAdmins = line === '[admins]'
        continue
      }

      if (!inAdmins || !line.startsWith(`${username} = `)) continue

      const value = line.slice(`${username} = `.length).trim()
      if (value && !value.startsWith('-pbkdf2:')) {
        password = value
      }
    }

    if (password) return { username, password }
  }

  return null
}

function buildBasicAuth(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

function localBoImageMiddleware(couchAuth, couchBaseUrl = 'http://127.0.0.1:5984') {
  return {
    name: 'local-bo-image-middleware',
    configureServer(server) {
      server.middlewares.use('/bo', async (req, res, next) => {
        const match = req.url?.match(/^\/([^/?#]+)\/products\/([0-9]+)(?:[?#].*)?$/)

        if (!match) {
          next()
          return
        }

        const [, dbName, productUid] = match
        const docId = `${dbName}/products/${productUid}`
        const headers = couchAuth ? { Authorization: couchAuth } : {}

        try {
          const docResponse = await fetch(`${couchBaseUrl}/bo/${encodeURIComponent(docId)}`, {
            headers: {
              Accept: 'application/json',
              ...headers,
            },
          })

          if (!docResponse.ok) {
            res.statusCode = docResponse.status
            res.setHeader('Content-Type', 'application/json')
            res.end(await docResponse.text())
            return
          }

          const doc = await docResponse.json()
          const attachments = Object.keys(doc._attachments || {})
          const attachmentName = attachments[0]

          if (!attachmentName) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'not_found', reason: 'missing_attachment' }))
            return
          }

          const attachmentResponse = await fetch(
            `${couchBaseUrl}/bo/${encodeURIComponent(docId)}/${encodeURIComponent(attachmentName)}`,
            { headers },
          )

          res.statusCode = attachmentResponse.status
          attachmentResponse.headers.forEach((value, key) => {
            if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
              res.setHeader(key, value)
            }
          })

          const buffer = Buffer.from(await attachmentResponse.arrayBuffer())
          res.end(buffer)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'bo_image_failed', message: error.message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const couchBaseUrl = env.VITE_COUCH_BASE_URL || 'http://127.0.0.1:5984'
  const couchAuth = env.VITE_COUCH_AUTH
    ? `Basic ${Buffer.from(env.VITE_COUCH_AUTH).toString('base64')}`
    : (() => {
        const localAuth = readLocalCouchPassword()
        return localAuth ? buildBasicAuth(localAuth.username, localAuth.password) : ''
      })()

  return {
    logLevel: 'error',
    plugins: [localBoImageMiddleware(couchAuth, couchBaseUrl), waiterSuggestionsDevApi(env), react()],
    build: {
      sourcemap: true,
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // ✅ ADD THIS (IMPORTANT)
    server: {
      proxy: {
        '/couch': {
          target: couchBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/couch/, ''),
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq) => {
              if (couchAuth) {
                proxyReq.setHeader('Authorization', couchAuth)
              }
            })
          },
        },
        '/bo': {
          target: env.VITE_BO_BASE_URL || couchBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bo/, '/bo'),
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq) => {
              if (couchAuth) {
                proxyReq.setHeader('Authorization', couchAuth)
              }
            })
          },
        },
      },
    },

    ssr: {
      noExternal: [],
    },
  }
})
