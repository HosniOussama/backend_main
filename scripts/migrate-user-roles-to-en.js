/**
 * Migrates user roles to ADMIN / OFFICER / STUDENT.
 * Run from backend_main: npm run migrate:user-roles-en
 */

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const ROLE_MAP = {
  DEMANDEUR: 'STUDENT',
  VALIDATEUR: 'OFFICER',
  REQUESTER: 'STUDENT',
  VALIDATOR: 'OFFICER',
  ADMIN: 'ADMIN',
  OFFICER: 'OFFICER',
  STUDENT: 'STUDENT'
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

async function main() {
  loadEnvFile(path.join(__dirname, '..', '.env'))

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is not set in backend_main/.env')
    process.exit(1)
  }

  await mongoose.connect(uri, { dbName: 'docPlus' })
  const collection = mongoose.connection.collection('users')

  let updated = 0
  for (const [from, to] of Object.entries(ROLE_MAP)) {
    if (from === to) continue

    const result = await collection.updateMany({ role: from }, { $set: { role: to } })
    if (result.modifiedCount > 0) {
      console.log(`${from} -> ${to}: ${result.modifiedCount} user(s)`)
      updated += result.modifiedCount
    }
  }

  console.log(`Done. ${updated} user(s) updated.`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
