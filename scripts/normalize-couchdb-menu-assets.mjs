import { authHeaders } from './couchdb-local-auth.mjs'

const couchBaseUrl = (process.env.COUCHDB_URL || 'http://127.0.0.1:5984').replace(/\/+$/g, '')
const menuDb = process.env.MENU_DB || 'menu_iloilo_giuseppe_ph'
const menuDoc = process.env.MENU_DOC || 'menu:current'
const imageDb = process.env.MENU_IMAGE_DB || 'pp'

async function couchRequest(path, options = {}) {
  const response = await fetch(`${couchBaseUrl}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return { response, body: await response.json() }
  }

  return { response, body: Buffer.from(await response.arrayBuffer()) }
}

function walkProducts(groups, callback) {
  for (const group of groups || []) {
    for (const product of Object.values(group.products || {})) {
      callback(product)
    }
    walkProducts(group.children || [], callback)
  }
}

async function normalizeMenuImageUrls() {
  const { response, body: doc } = await couchRequest(`/${encodeURIComponent(menuDb)}/${encodeURIComponent(menuDoc)}`)
  if (!response.ok) throw new Error(`Menu document read failed: HTTP ${response.status}`)

  let changed = false

  for (const category of Object.values(doc.content || {})) {
    walkProducts(category.groups || [], (product) => {
      const uid = product.prices?.[0]?.uid
      if (!uid) return

      const image = `/bo/${imageDb}/products/${uid}`
      if (product.image !== image) {
        product.image = image
        changed = true
      }
    })
  }

  if (!changed) return false

  const saved = await couchRequest(`/${encodeURIComponent(menuDb)}/${encodeURIComponent(menuDoc)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!saved.response.ok) {
    throw new Error(`Menu document write failed: HTTP ${saved.response.status} ${JSON.stringify(saved.body)}`)
  }

  return true
}

async function normalizeBoImageAttachments() {
  const docs = await couchRequest('/bo/_all_docs?include_docs=true')
  if (!docs.response.ok) throw new Error(`BO docs read failed: HTTP ${docs.response.status}`)

  let changed = 0

  for (const row of docs.body.rows || []) {
    if (!String(row.id || '').startsWith(`${imageDb}/products/`)) continue

    const attachments = Object.keys(row.doc?._attachments || {})
    if (attachments.includes('image') || attachments.length === 0) continue

    const sourceAttachment = attachments[0]
    const source = await couchRequest(`/bo/${encodeURIComponent(row.id)}/${encodeURIComponent(sourceAttachment)}`)
    if (!source.response.ok) continue

    const contentType = source.response.headers.get('content-type') || 'application/octet-stream'
    const uploaded = await couchRequest(
      `/bo/${encodeURIComponent(row.id)}/image?rev=${encodeURIComponent(row.doc._rev)}`,
      {
        method: 'PUT',
        body: source.body,
        headers: {
          'Content-Type': contentType,
        },
      },
    )

    if (!uploaded.response.ok) {
      throw new Error(`BO image normalize failed for ${row.id}: HTTP ${uploaded.response.status}`)
    }

    changed += 1
  }

  return changed
}

const menuChanged = await normalizeMenuImageUrls()
const imageDocsChanged = await normalizeBoImageAttachments()

console.log(JSON.stringify({
  ok: true,
  menuChanged,
  imageDocsChanged,
}, null, 2))
