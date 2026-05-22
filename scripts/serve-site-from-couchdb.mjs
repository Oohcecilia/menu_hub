import http from 'node:http'
import path from 'node:path'
import { authHeaders } from './couchdb-local-auth.mjs'

const couchBaseUrl = (process.env.COUCHDB_URL || 'http://127.0.0.1:5984').replace(/\/+$/g, '')
const siteDb = process.env.MENU_SITE_DB || 'site_iloilo_giuseppe_ph'
const siteDoc = process.env.MENU_SITE_DOC || 'site:current'
const port = Number(process.env.MENU_SITE_PORT || 5174)

const cacheableAsset = /^\/assets\//
const passthroughPrefixes = ['/assets/', '/config.json', '/_redirects']

function attachmentUrl(pathname) {
  const cleanPath = pathname.replace(/^\/+/, '') || 'index.html'
  return `${couchBaseUrl}/${encodeURIComponent(siteDb)}/${encodeURIComponent(siteDoc)}/${cleanPath.split('/').map(encodeURIComponent).join('/')}`
}

async function fetchAttachment(pathname) {
  return fetch(attachmentUrl(pathname), {
    headers: authHeaders(),
  })
}

async function proxyCouch(pathname) {
  return fetch(`${couchBaseUrl}${pathname.replace(/^\/couch/, '')}`, {
    headers: authHeaders(),
  })
}

async function proxyBoProductImage(pathname) {
  const match = pathname.match(/^\/bo\/([^/?#]+)\/products\/([0-9]+)(?:[?#].*)?$/)

  if (!match) {
    return fetch(`${couchBaseUrl}${pathname}`, {
      headers: authHeaders(),
    })
  }

  const [, dbName, productUid] = match
  const docId = `${dbName}/products/${productUid}`
  const docResponse = await fetch(`${couchBaseUrl}/bo/${encodeURIComponent(docId)}`, {
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  })

  if (!docResponse.ok) return docResponse

  const doc = await docResponse.json()
  const attachmentName = Object.keys(doc._attachments || {})[0]

  if (!attachmentName) {
    return new Response(JSON.stringify({ error: 'not_found', reason: 'missing_attachment' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return fetch(`${couchBaseUrl}/bo/${encodeURIComponent(docId)}/${encodeURIComponent(attachmentName)}`, {
    headers: authHeaders(),
  })
}

function sendResponse(res, response, body) {
  const headers = {}
  response.headers.forEach((value, key) => {
    if (!['content-encoding', 'content-length', 'content-security-policy', 'transfer-encoding'].includes(key.toLowerCase())) {
      headers[key] = value
    }
  })

  res.writeHead(response.status, headers)
  res.end(body)
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`)

    if (url.pathname.startsWith('/couch/')) {
      const response = await proxyCouch(url.pathname + url.search)
      sendResponse(res, response, Buffer.from(await response.arrayBuffer()))
      return
    }

    if (url.pathname.startsWith('/bo/')) {
      const response = await proxyBoProductImage(url.pathname + url.search)
      sendResponse(res, response, Buffer.from(await response.arrayBuffer()))
      return
    }

    const shouldPassThrough = passthroughPrefixes.some((prefix) => url.pathname.startsWith(prefix))
    const requestedPath = shouldPassThrough ? url.pathname : '/index.html'
    const response = await fetchAttachment(requestedPath)

    if (!response.ok) {
      res.writeHead(response.status, { 'Content-Type': 'application/json' })
      res.end(await response.text())
      return
    }

    const headers = {}
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'content-security-policy', 'transfer-encoding'].includes(key.toLowerCase())) {
        headers[key] = value
      }
    })

    headers['Cache-Control'] = cacheableAsset.test(requestedPath)
      ? 'public, max-age=31536000, immutable'
      : 'no-store'

    res.writeHead(response.status, headers)
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'couch_site_failed', message: error.message }))
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Menu site from local CouchDB: http://127.0.0.1:${port}/`)
  console.log(`Database: ${siteDb}, document: ${siteDoc}`)
})
