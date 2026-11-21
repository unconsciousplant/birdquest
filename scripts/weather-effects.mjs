// ------------------------------------------------------------
// Measures how much each weather attribute changes the model's predictions.
// Used to order the weather controls on the Plan a trip screen.
//
// Method: keep all weather at the month's typical values, move ONE attribute
// from low (training mean - 2 SD) to high (mean + 2 SD), and record how much
// every species' chance of recording changes, at all 98 hotspots, on
// 15 Jan / Apr / Jul / Oct, for a 2-hour visit starting at 07:00.
// Wind direction compares the 8 compass points instead.
//
// Usage (from the project folder): node scripts/weather-effects.mjs
// Re-run after retraining and update docs/model/weather-effects.md.
// ------------------------------------------------------------
import { readFileSync } from 'node:fs'
import { BirdQuestPredictor, WEATHER_FIELDS } from '../src/vendor/birdquest-predictor.js'

const model = JSON.parse(readFileSync(new URL('../public/model/birdquest_model.json', import.meta.url), 'utf8'))
const predictor = new BirdQuestPredictor(model, { fetchFn: null })
const scaler = model.numeric_scaler
const climate = model.weather_climatology_by_month
const dates = ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15']

// Physical limits so "mean ± 2 SD" stays possible (no negative rain, etc.).
const limits = {
  rainfall_mm: [0, Infinity],
  rain_3d_sum_mm: [0, Infinity],
  rh_mean_pct: [0, 100],
  cloud_pct: [0, 100],
  sunshine_hr: [0, 13],
  wind_speed_kmh: [0, Infinity],
}
const clamp = (field, value) =>
  Math.min(limits[field]?.[1] ?? Infinity, Math.max(limits[field]?.[0] ?? -Infinity, value))

function typicalWeather(date) {
  const month = Number(date.slice(5, 7))
  return Object.fromEntries(WEATHER_FIELDS.map((field) => [field, climate[field][month - 1]]))
}

function predictEverywhere(date, weather) {
  return model.locations.map((location) => predictor.predictRow(predictor.buildRow(location, date, 420, 120, weather)))
}

function summarize(changes) {
  changes.sort((a, b) => a - b)
  return {
    average: changes.reduce((a, b) => a + b, 0) / changes.length,
    p95: changes[Math.floor(changes.length * 0.95)],
    max: changes[changes.length - 1],
  }
}

const results = []

for (const field of WEATHER_FIELDS.filter((f) => !f.startsWith('wind_dir'))) {
  const low = clamp(field, scaler[field].mean - 2 * scaler[field].std)
  const high = clamp(field, scaler[field].mean + 2 * scaler[field].std)
  const changes = []
  for (const date of dates) {
    const a = predictEverywhere(date, { ...typicalWeather(date), [field]: low })
    const b = predictEverywhere(date, { ...typicalWeather(date), [field]: high })
    a.forEach((row, i) => row.forEach((p, j) => changes.push(Math.abs(b[i][j] - p))))
  }
  results.push({ name: field, tested: `${low.toFixed(1)} to ${high.toFixed(1)}`, ...summarize(changes) })
}

{
  const changes = []
  for (const date of dates) {
    const byDirection = [0, 45, 90, 135, 180, 225, 270, 315].map((degrees) => {
      const radians = (degrees * Math.PI) / 180
      return predictEverywhere(date, { ...typicalWeather(date), wind_dir_sin: Math.sin(radians), wind_dir_cos: Math.cos(radians) })
    })
    byDirection[0].forEach((row, i) =>
      row.forEach((_, j) => {
        const values = byDirection.map((grid) => grid[i][j])
        changes.push(Math.max(...values) - Math.min(...values))
      }),
    )
  }
  results.push({ name: 'wind direction', tested: '8 compass points', ...summarize(changes) })
}

results.sort((a, b) => b.average - a.average)
console.log('| Weather input | Range tested | Average change | 95th percentile | Largest change |')
console.log('|---|---|---|---|---|')
for (const r of results) {
  const points = (x) => `${(x * 100).toFixed(1)} points`
  console.log(`| ${r.name} | ${r.tested} | ${points(r.average)} | ${points(r.p95)} | ${points(r.max)} |`)
}
