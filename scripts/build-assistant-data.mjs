// ------------------------------------------------------------
// Builds src/knowledge/speciesData.json: the data-backed facts the
// assistant (chatbot) uses for its supported species.
//
// Supported species = the trip planner's 60 species + Black-faced Spoonbill.
// For each one:
//   - names: from public/classifier/species.json (English, scientific, Chinese)
//   - monthly reporting rates: from the trip planner model (share of eBird
//     checklists that recorded it, Oct 2025 – Sep 2026, training days)
//   - best places: the trip planner model's highest chances at the 98 hotspots,
//     in the species' best month, for a 2-hour visit from 07:00, typical weather
//   - IUCN Red List status (global): from iNaturalist's public API, which mainly
//     lists threatened species; for the rest, from Wikidata (property P141).
//     One-time lookups: only taxon IDs / scientific names are sent, and the
//     website itself never contacts these services.
//
// Usage (from the project folder; needs an internet connection):
//   node scripts/build-assistant-data.mjs
// ------------------------------------------------------------
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { BirdQuestPredictor } from '../src/vendor/birdquest-predictor.js'

const EXTRA_SPECIES = ['Platalea minor'] // supported, but not in the trip planner model

const model = JSON.parse(readFileSync('public/model/birdquest_model.json', 'utf8'))
const classifierSpecies = JSON.parse(readFileSync('public/classifier/species.json', 'utf8'))
const bySci = new Map(classifierSpecies.map((s) => [s.scientificName, s]))
const predictor = new BirdQuestPredictor(model, { fetchFn: null })

const supported = [...model.species.map((s) => s.sci), ...EXTRA_SPECIES]
for (const sci of supported) {
  if (!bySci.has(sci)) throw new Error(`${sci} is missing from public/classifier/species.json`)
}

const IUCN_CATEGORIES = {
  LC: 'Least Concern',
  NT: 'Near Threatened',
  VU: 'Vulnerable',
  EN: 'Endangered',
  CR: 'Critically Endangered',
  DD: 'Data Deficient',
}
const userAgent = { 'User-Agent': 'BirdQuest student prototype (one-time species data lookup)' }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 1) iNaturalist: global IUCN entries (no place). Usually only threatened species have one.
const fromInat = new Map() // scientific name -> category name
const ids = supported.map((sci) => bySci.get(sci).inaturalistTaxonId)
for (let i = 0; i < ids.length; i += 30) {
  const chunk = ids.slice(i, i + 30)
  const response = await fetch(`https://api.inaturalist.org/v1/taxa/${chunk.join(',')}?locale=en`, { headers: userAgent })
  if (!response.ok) throw new Error(`iNaturalist request failed: HTTP ${response.status}`)
  for (const taxon of (await response.json()).results) {
    const global = (taxon.conservation_statuses ?? []).find(
      (s) => s.authority === 'IUCN Red List' && !s.place && !s.place_id,
    )
    const category = global && IUCN_CATEGORIES[String(global.status).toUpperCase()]
    const sci = supported.find((name) => bySci.get(name).inaturalistTaxonId === taxon.id)
    if (category && sci) fromInat.set(sci, category)
  }
  await sleep(1100)
}

// 2) Wikidata: IUCN conservation status (P141) by scientific name (P225).
const fromWikidata = new Map() // scientific name -> Set of category names
{
  const values = supported.map((sci) => JSON.stringify(sci)).join(' ')
  const query = `SELECT ?name ?statusLabel WHERE { VALUES ?name { ${values} } ?item wdt:P225 ?name ; wdt:P141 ?status . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`
  const response = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, {
    headers: { ...userAgent, Accept: 'application/sparql-results+json' },
  })
  if (!response.ok) throw new Error(`Wikidata request failed: HTTP ${response.status}`)
  for (const row of (await response.json()).results.bindings) {
    const name = row.name.value
    // Wikidata writes e.g. "Least concern"; use the official spelling.
    const label = Object.values(IUCN_CATEGORIES).find((c) => c.toLowerCase() === row.statusLabel.value.toLowerCase())
    if (!label) continue
    if (!fromWikidata.has(name)) fromWikidata.set(name, new Set())
    fromWikidata.get(name).add(label)
  }
}

// Checked by hand (22 Nov 2026) where neither source had a status.
// Asian Tit, Amur Stonechat and Eastern Cattle-Egret are left without one: bird lists
// define these species differently, and no global status exists under these names.
const CHECKED_BY_HAND = {
  'Pericrocotus speciosus': { category: 'Least Concern', source: 'Wikipedia (citing IUCN)' },
}

// Combine: prefer iNaturalist (IUCN's own data); report any disagreement.
const iucn = new Map()
const disagreements = []
for (const sci of supported) {
  const inat = fromInat.get(sci)
  const wiki = [...(fromWikidata.get(sci) ?? [])]
  if (CHECKED_BY_HAND[sci]) {
    iucn.set(sci, CHECKED_BY_HAND[sci])
  } else if (inat) {
    iucn.set(sci, { category: inat, source: 'iNaturalist' })
    if (wiki.length && !wiki.includes(inat)) disagreements.push(`${sci}: iNaturalist ${inat}, Wikidata ${wiki.join('/')}`)
  } else if (wiki.length === 1 && Object.values(IUCN_CATEGORIES).includes(wiki[0])) {
    iucn.set(sci, { category: wiki[0], source: 'Wikidata' })
  } else if (wiki.length > 1) {
    disagreements.push(`${sci}: Wikidata has several values (${wiki.join(', ')}), left out`)
  }
}

// Best places from the trip planner model.
const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
async function bestPlaces(column, rates) {
  const speciesIndex = model.species.findIndex((s) => s.column === column)
  const bestMonth = rates.indexOf(Math.max(...rates)) // 0-based
  const date = `2026-${months[bestMonth]}-15`
  const weather = await predictor.weatherFor(date) // typical weather for that month
  const bySite = new Map()
  for (const location of model.locations) {
    const chance = predictor.predictRow(predictor.buildRow(location, date, 7 * 60, 120, weather))[speciesIndex]
    // "Mai Po Nature Reserve--Southern Mudflat Hide" and "Mai Po Nature Reserve" are one site.
    const site = location.name_en.split('--')[0].trim()
    if (!bySite.has(site) || chance > bySite.get(site).chance) {
      bySite.set(site, { name: location.name_en, nameZh: location.name_zh !== location.name_en ? location.name_zh : null, chance })
    }
  }
  return {
    month: bestMonth + 1,
    places: [...bySite.values()]
      .sort((a, b) => b.chance - a.chance)
      .slice(0, 3)
      .map((p) => ({ ...p, chance: Math.round(p.chance * 1000) / 1000 })),
  }
}

const output = []
for (const sci of supported) {
  const names = bySci.get(sci)
  const column = `sp_${sci.replaceAll(' ', '_')}`
  const rates = model.monthly_baseline[column] ?? null
  output.push({
    id: column,
    scientificName: sci,
    commonName: names.commonName,
    chineseName: names.chineseName,
    inaturalistTaxonId: names.inaturalistTaxonId,
    inTripPlanner: Boolean(rates),
    // Share of checklists (0–1) that recorded the species, January to December.
    monthlyRates: rates ? rates.map((r) => Math.round(r * 1000) / 1000) : null,
    best: rates ? await bestPlaces(column, rates) : null,
    // Global IUCN Red List category, e.g. { category: 'Least Concern', source: 'Wikidata' }, or null.
    iucn: iucn.get(sci) ?? null,
  })
}

mkdirSync('src/knowledge', { recursive: true })
writeFileSync('src/knowledge/speciesData.json', JSON.stringify(output, null, 1))
console.log(`Wrote src/knowledge/speciesData.json: ${output.length} species`)
const counts = {}
for (const s of output) {
  const key = s.iucn ? `${s.iucn.category} (${s.iucn.source})` : 'no status found'
  counts[key] = (counts[key] ?? 0) + 1
}
console.log('IUCN statuses:', Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' | '))
if (disagreements.length) console.log('Check these:\n  ' + disagreements.join('\n  '))
