// ------------------------------------------------------------
// Builds public/classifier/species.json: the classifier's 373 species,
// in the model's output order, with English names.
//
// - Scientific and (simplified) Chinese names come from the classifier's
//   species_list.csv (Bird-Classification, MIT licence).
// - English names: the trip planner's names for its 60 species (so both
//   features use the same names); the rest are looked up ONCE from
//   iNaturalist's public API using the taxon IDs in the CSV. Only those
//   IDs are sent. The website itself never contacts iNaturalist.
//
// Usage (from the project folder; needs an internet connection):
//   node scripts/build-classifier-species.mjs path/to/species_list.csv
// ------------------------------------------------------------
import { readFileSync, writeFileSync } from 'node:fs'

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: node scripts/build-classifier-species.mjs path/to/species_list.csv')
  process.exit(1)
}

// Minimal CSV reader (handles quoted fields).
function parseCsv(text) {
  const rows = []
  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    const fields = []
    let field = ''
    let quoted = false
    for (const char of line) {
      if (char === '"') quoted = !quoted
      else if (char === ',' && !quoted) {
        fields.push(field)
        field = ''
      } else field += char
    }
    fields.push(field)
    rows.push(fields)
  }
  const [header, ...data] = rows
  return data.map((fields) => Object.fromEntries(header.map((name, i) => [name, fields[i]])))
}

const rows = parseCsv(readFileSync(csvPath, 'utf8'))

// The source list has "?" in place of 8 rare Chinese characters (lost in the
// author's file encoding). Correct names, written as escapes so they can't be lost again:
// 䴕 = 䴕, 䴙䴘 = 䴙䴘, 䳭 = 䳭, 䴓 = 䴓
const CHINESE_NAME_FIXES = {
  'Jynx torquilla': '蚁䴕', // 蚁䴕
  'Podiceps cristatus': '凤头䴙䴘', // 凤头䴙䴘
  'Podiceps nigricollis': '黑颈䴙䴘', // 黑颈䴙䴘
  'Saxicola ferreus': '灰林䳭', // 灰林䳭
  'Saxicola stejnegeri': '东亚石䳭', // 东亚石䳭
  'Sitta europaea': '普通䴓', // 普通䴓
  'Sitta villosa': '黑头䴓', // 黑头䴓
  'Tachybaptus ruficollis': '小䴙䴘', // 小䴙䴘
}
for (const row of rows) {
  if (CHINESE_NAME_FIXES[row.scientific_name]) row.common_name = CHINESE_NAME_FIXES[row.scientific_name]
  if (row.common_name.includes('?')) throw new Error(`Damaged Chinese name for ${row.scientific_name}: ${row.common_name}`)
}

// The model numbers its outputs in alphabetical order of scientific name
// (PyTorch ImageFolder), which is the CSV's order. Refuse to continue otherwise.
const names = rows.map((row) => row.scientific_name)
const sorted = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
if (names.some((name, i) => name !== sorted[i])) {
  throw new Error('species_list.csv is not in sorted order, so it may not match the model outputs.')
}

const tripModel = JSON.parse(readFileSync('public/model/birdquest_model.json', 'utf8'))
const tripNames = new Map(tripModel.species.map((s) => [s.sci, s.common]))

// iNaturalist: up to 30 taxa per request; pause between requests to be polite.
const inatNames = new Map()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
for (let i = 0; i < rows.length; i += 30) {
  const ids = rows.slice(i, i + 30).map((row) => row.taxon_id)
  const response = await fetch(`https://api.inaturalist.org/v1/taxa/${ids.join(',')}?locale=en`, {
    headers: { 'User-Agent': 'BirdQuest student prototype (one-time species name lookup)' },
  })
  if (!response.ok) throw new Error(`iNaturalist request failed: HTTP ${response.status}`)
  const { results } = await response.json()
  for (const taxon of results) inatNames.set(String(taxon.id), { common: taxon.preferred_common_name, current: taxon.name })
  await sleep(1100)
}

let fromTrip = 0
let fromInat = 0
const missing = []
const renamed = []
const species = rows.map((row) => {
  const inat = inatNames.get(row.taxon_id)
  let commonName = tripNames.get(row.scientific_name) ?? null
  if (commonName) fromTrip++
  else if (inat?.common) {
    commonName = inat.common
    fromInat++
  } else missing.push(row.scientific_name)
  if (inat?.current && inat.current !== row.scientific_name) renamed.push(`${row.scientific_name} -> ${inat.current}`)
  return {
    // Same id format as the trip planner, so a species means the same thing everywhere.
    id: `sp_${row.scientific_name.replaceAll(' ', '_')}`,
    scientificName: row.scientific_name,
    commonName,
    chineseName: row.common_name, // simplified Chinese, as in the source list
    inaturalistTaxonId: Number(row.taxon_id),
    inTripPlanner: tripNames.has(row.scientific_name),
  }
})

writeFileSync('public/classifier/species.json', JSON.stringify(species, null, 1))
console.log(`Wrote public/classifier/species.json: ${species.length} species`)
console.log(`English names: ${fromTrip} from the trip planner, ${fromInat} from iNaturalist, ${missing.length} missing`)
if (missing.length) console.log('  missing (scientific name will be shown):', missing.join('; '))
if (renamed.length) console.log(`iNaturalist now uses a different scientific name for ${renamed.length} (model labels kept as trained):\n  ${renamed.join('\n  ')}`)
