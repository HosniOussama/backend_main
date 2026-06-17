/**
 * One-time migration: rename French request-type (form) titles to English.
 * Run from backend_main: node scripts/migrate-request-type-names-to-en.js
 *
 * Requires MONGO_URI in .env (same as the Nest app).
 */

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

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

loadEnvFile(path.join(__dirname, '..', '.env'))

const NAME_MAP = {
  'formulaire-de demande de relevé de note': 'Transcript request form',
  'formulaire-de demande de releve de note': 'Transcript request form',
  "nom d'élève avec date": 'Student name with date',
  "nom d'eleve avec date": 'Student name with date',
  'formulaire-attestation dinscrit': 'Enrollment certificate form',
  "formulaire-attestation d'inscrit": 'Enrollment certificate form',
  'formulaire demande de stage': 'Internship request form',
  'Nom et prenom': 'First and last name',
  'Nom et prénom': 'First and last name'
}

async function main() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is not set in backend_main/.env')
    process.exit(1)
  }

  await mongoose.connect(uri, { dbName: 'docPlus' })
  const collection = mongoose.connection.collection('requesttypes')

  let updated = 0
  for (const [from, to] of Object.entries(NAME_MAP)) {
    const result = await collection.updateMany({ name: from }, { $set: { name: to } })
    if (result.modifiedCount > 0) {
      console.log(`"${from}" -> "${to}" (${result.modifiedCount})`)
      updated += result.modifiedCount
    }
  }

  const withPrefix = await collection.find({ name: { $regex: /^formulaire-/i } }).toArray()
  for (const doc of withPrefix) {
    const newName = 'form-' + doc.name.slice('formulaire-'.length)
    await collection.updateOne({ _id: doc._id }, { $set: { name: newName } })
    console.log(`"${doc.name}" -> "${newName}"`)
    updated += 1
  }

  console.log(`Done. ${updated} document(s) updated.`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
