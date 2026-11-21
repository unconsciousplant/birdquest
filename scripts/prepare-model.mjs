// ------------------------------------------------------------
// Makes the website's copy of the prediction model.
//
// The model file from the hand-over also lists 19 eBird "personal"
// locations (people's balconies, homes, streets) with names and exact
// coordinates. The website must never publish those, so this script:
//   1. removes every non-hotspot location, and
//   2. renames their model features to anonymous names
//      (personal_01, personal_02, ...). The feature ORDER is kept, so the
//      model's weights still line up and hotspot predictions don't change.
//
// Usage (from the project folder):
//   node scripts/prepare-model.mjs path/to/birdquest_model.json
// Output: public/model/birdquest_model.json
// ------------------------------------------------------------
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const inputPath = process.argv[2]
const outputPath = 'public/model/birdquest_model.json'

if (!inputPath) {
  console.error('Usage: node scripts/prepare-model.mjs path/to/birdquest_model.json')
  process.exit(1)
}

const model = JSON.parse(readFileSync(inputPath, 'utf8'))
const removed = model.locations.filter((loc) => loc.locality_type !== 'hotspot')

// Old locality id -> anonymous name
const anonymousIds = new Map(
  removed.map((loc, index) => [loc.locality_id, `personal_${String(index + 1).padStart(2, '0')}`]),
)

model.locations = model.locations.filter((loc) => loc.locality_type === 'hotspot')

const prefix = 'cat_locality_id__'
model.feature_order = model.feature_order.map((feature) => {
  const id = feature.startsWith(prefix) ? feature.slice(prefix.length) : null
  return id && anonymousIds.has(id) ? prefix + anonymousIds.get(id) : feature
})

const output = JSON.stringify(model)

// Safety check: no removed location's id, name or exact coordinates may remain.
// (Coordinates are compared exactly; a substring check would wrongly match
// public hotspots whose numbers happen to start with the same digits.)
for (const loc of removed) {
  const found = [loc.locality_id, JSON.stringify(loc.name_en), JSON.stringify(loc.name_zh)].filter(
    (text) => output.includes(text),
  )
  if (model.locations.some((kept) => kept.lat === loc.lat && kept.lon === loc.lon)) {
    found.push('coordinates')
  }
  if (found.length > 0) {
    throw new Error(`Private location data still present (${found.join(', ')}). Nothing was written.`)
  }
}

mkdirSync('public/model', { recursive: true })
writeFileSync(outputPath, output)

console.log(`Kept ${model.locations.length} public hotspots, removed ${removed.length} personal locations.`)
console.log(`Wrote ${outputPath} (${(output.length / 1024).toFixed(0)} KB)`)
