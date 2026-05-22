import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { authHeaders } from './couchdb-local-auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

const couchBaseUrl = (process.env.COUCHDB_URL || 'http://127.0.0.1:5984').replace(/\/+$/g, '')
const siteDb = process.env.MENU_SITE_DB || 'site_iloilo_giuseppe_ph'
const siteDoc = process.env.MENU_SITE_DOC || 'site:current'

const mimeByExt = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

async function couchRequest(method, urlPath, { body, headers = {} } = {}) {
  const res = await fetch(`${couchBaseUrl}${urlPath}`, {
    method,
    headers: {
      ...authHeaders(),
      ...headers,
    },
    body,
  })

  const text = await res.text()
  let json = null

  try {
    json = text ? JSON.parse(text) : null
  } catch {}

  return { res, text, json }
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

async function ensureDb() {
  const dbPath = `/${encodeURIComponent(siteDb)}`
  const existing = await couchRequest('GET', dbPath)

  if (existing.res.ok) return
  if (existing.res.status !== 404) {
    throw new Error(`CouchDB database check failed: HTTP ${existing.res.status} ${existing.text}`)
  }

  const created = await couchRequest('PUT', dbPath)
  if (!created.res.ok && created.res.status !== 412) {
    throw new Error(`CouchDB database create failed: HTTP ${created.res.status} ${created.text}`)
  }
}

function canBeAttachment(relativePath) {
  return !relativePath.split('/').some((part) => part.startsWith('_'))
}

async function readReservedFiles(files) {
  const reservedFiles = {}

  for (const filePath of files) {
    const relativePath = path.relative(distDir, filePath).split(path.sep).join('/')
    if (canBeAttachment(relativePath)) continue

    reservedFiles[relativePath] = {
      content_type: mimeByExt[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      content: await fs.readFile(filePath, 'utf8'),
    }
  }

  return reservedFiles
}

async function replaceSiteDoc(files, reservedFiles) {
  const docPath = `/${encodeURIComponent(siteDb)}/${encodeURIComponent(siteDoc)}`
  const existing = await couchRequest('GET', docPath)

  if (existing.res.ok && existing.json?._rev) {
    const deleted = await couchRequest('DELETE', `${docPath}?rev=${encodeURIComponent(existing.json._rev)}`)
    if (!deleted.res.ok && deleted.res.status !== 404) {
      throw new Error(`CouchDB old site delete failed: HTTP ${deleted.res.status} ${deleted.text}`)
    }
  } else if (existing.res.status !== 404) {
    throw new Error(`CouchDB site doc check failed: HTTP ${existing.res.status} ${existing.text}`)
  }

  const created = await couchRequest('PUT', docPath, {
    body: JSON.stringify({
      _id: siteDoc,
      type: 'menu_site',
      updated_at: new Date().toISOString(),
      file_count: files.length,
      reserved_files: reservedFiles,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!created.res.ok || !created.json?.rev) {
    throw new Error(`CouchDB site doc create failed: HTTP ${created.res.status} ${created.text}`)
  }

  return created.json.rev
}

async function uploadAttachments(files, rev) {
  let currentRev = rev

  for (const filePath of files) {
    const relativePath = path.relative(distDir, filePath).split(path.sep).join('/')
    if (!canBeAttachment(relativePath)) continue

    const body = await fs.readFile(filePath)
    const contentType = mimeByExt[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
    const attachmentPath = [
      '',
      encodeURIComponent(siteDb),
      encodeURIComponent(siteDoc),
      relativePath.split('/').map(encodeURIComponent).join('/'),
    ].join('/')

    const uploaded = await couchRequest('PUT', `${attachmentPath}?rev=${encodeURIComponent(currentRev)}`, {
      body,
      headers: {
        'Content-Type': contentType,
      },
    })

    if (!uploaded.res.ok || !uploaded.json?.rev) {
      throw new Error(`Attachment upload failed for ${relativePath}: HTTP ${uploaded.res.status} ${uploaded.text}`)
    }

    currentRev = uploaded.json.rev
  }

  return currentRev
}

async function main() {
  await fs.access(path.join(distDir, 'index.html'))
  const files = await listFiles(distDir)
  const reservedFiles = await readReservedFiles(files)

  await ensureDb()
  const rev = await replaceSiteDoc(files, reservedFiles)
  const finalRev = await uploadAttachments(files, rev)

  console.log(JSON.stringify({
    ok: true,
    couchBaseUrl,
    db: siteDb,
    doc: siteDoc,
    files: files.length,
    reservedFiles: Object.keys(reservedFiles),
    rev: finalRev,
    indexUrl: `${couchBaseUrl}/${encodeURIComponent(siteDb)}/${encodeURIComponent(siteDoc)}/index.html`,
  }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
