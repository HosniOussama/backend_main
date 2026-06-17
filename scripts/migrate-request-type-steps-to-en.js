/**
 * Renames legacy French step titles in request-type form definitions (Étape 1 → Step 1).
 * Run from backend_main: npm run migrate:form-steps-en
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

const ETAPE_STEP_PATTERN = /^[éeÉE]tape\s*(\d+)\s*$/i

function normalizeStepName(name, index) {
  if (!name || typeof name !== 'string') return `Step ${index + 1}`

  const trimmed = name.trim()
  const match = trimmed.match(ETAPE_STEP_PATTERN)
  if (match) return `Step ${match[1]}`

  return trimmed
}

function normalizeStepsJson(stepsRaw) {
  let steps = []
  try {
    steps = typeof stepsRaw === 'string' ? JSON.parse(stepsRaw) : stepsRaw
  } catch {
    return { changed: false, value: stepsRaw }
  }

  if (!Array.isArray(steps)) {
    return { changed: false, value: stepsRaw }
  }

  let changed = false
  const normalized = steps.map((step, index) => {
    const newName = normalizeStepName(step.name, index)
    if (step.name !== newName) changed = true

    return { ...step, name: newName }
  })

  return {
    changed,
    value: JSON.stringify(normalized)
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
  const collection = mongoose.connection.collection('requesttypes')

  const docs = await collection.find({}).toArray()
  let updated = 0

  for (const doc of docs) {
    if (!doc.steps) continue

    const { changed, value } = normalizeStepsJson(doc.steps)
    if (changed) {
      await collection.updateOne({ _id: doc._id }, { $set: { steps: value } })
      console.log(`Updated form "${doc.name}"`)
      updated += 1
    }
  }

  console.log(`Done. ${updated} form(s) updated.`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
