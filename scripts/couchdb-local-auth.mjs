import fs from 'node:fs'

export function readLocalCouchAuth() {
  const envUser = process.env.COUCHDB_USER || ''
  const envPassword = process.env.COUCHDB_PASSWORD || ''

  if (envUser) {
    return { username: envUser, password: envPassword }
  }

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

      if (!inAdmins || !line.startsWith('admin = ')) continue

      const value = line.slice('admin = '.length).trim()
      if (value && !value.startsWith('-pbkdf2:')) {
        password = value
      }
    }

    if (password) {
      return { username: 'admin', password }
    }
  }

  return null
}

export function authHeaders() {
  const auth = readLocalCouchAuth()
  if (!auth) return {}

  return {
    Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
  }
}
