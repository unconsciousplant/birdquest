import { BirdQuestPredictor } from '../vendor/birdquest-predictor.js'

// ------------------------------------------------------------
// Trip planner service: real predictions from the BirdQuest
// occurrence model (see docs/model/). Two questions:
//   predictBirdsAt()     place + date + time  -> which birds
//   findPlacesForBird()  bird + dates         -> where and when
// The model runs entirely in the browser. Nothing is uploaded.
// ------------------------------------------------------------

// Made by scripts/prepare-model.mjs (private locations removed).
const MODEL_URL = `${import.meta.env.BASE_URL}model/birdquest_model.json`

// Live weather forecasts come from Open-Meteo, an external service, so they're
// OFF until the project owner approves. While off, the model uses typical
// weather for the month, or weather the user sets for a demonstration.
const USE_LIVE_WEATHER = false

// Longest date range for findPlacesForBird (each day takes ~0.1 s to calculate).
export const MAX_SEARCH_DAYS = 7

// ---------- Weather the user can set (for demonstrations) ----------
// Each control is one weather input of the model, listed from biggest to
// smallest average effect on the predictions (measured with
// scripts/weather-effects.mjs; results in docs/model/weather-effects.md).
// Values are daily figures on the Hong Kong Observatory scale the model was
// trained on. Ranges stay within about 3 standard deviations of the training
// data, so the model isn't asked about weather it has rarely seen.
const WEATHER_CONTROLS = [
  { key: 'temperature', field: 'temp_mean_c', label: 'Average temperature', unit: '°C', min: 10, max: 32, step: 0.5 },
  { key: 'windDirection', type: 'direction', label: 'Wind from' },
  {
    key: 'windSpeed',
    field: 'wind_speed_kmh',
    label: 'Average wind speed',
    unit: 'km/h',
    min: 0,
    max: 18,
    step: 0.5,
    hint: 'Measured at the Hong Kong Observatory, a sheltered city site, so it reads lower than open-country wind.',
  },
  { key: 'sunshine', field: 'sunshine_hr', label: 'Sunshine', unit: 'hours', min: 0, max: 12, step: 0.5 },
  { key: 'humidity', field: 'rh_mean_pct', label: 'Humidity', unit: '%', min: 45, max: 100, step: 1 },
  {
    key: 'temperatureChange',
    field: 'temp_mean_change_1d',
    label: 'Temperature change since yesterday',
    unit: '°C',
    min: -4,
    max: 4,
    step: 0.5,
  },
  { key: 'cloud', field: 'cloud_pct', label: 'Cloud cover', unit: '%', min: 0, max: 100, step: 5 },
  {
    key: 'pressureChange',
    field: 'pressure_change_1d',
    label: 'Air pressure change since yesterday',
    unit: 'hPa',
    min: -5,
    max: 5,
    step: 0.5,
  },
  {
    key: 'rainLast3Days',
    field: 'rain_3d_sum_mm',
    label: 'Rain over 3 days (today and the 2 days before)',
    unit: 'mm',
    min: 0,
    max: 110,
    step: 1,
  },
  { key: 'rainToday', field: 'rainfall_mm', label: 'Rain today', unit: 'mm', min: 0, max: 40, step: 1 },
]

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] // every 45°

// Quick settings, applied on top of the month's typical weather.
const WEATHER_PRESETS = [
  {
    id: 'sunny',
    label: 'Sunny',
    apply: (typical) => ({
      ...typical,
      cloud: 20,
      sunshine: 9,
      rainToday: 0,
      rainLast3Days: 0,
      humidity: Math.max(45, Math.round(typical.humidity - 10)),
    }),
  },
  {
    id: 'rainy',
    label: 'Rainy',
    apply: (typical) => ({ ...typical, cloud: 95, sunshine: 0, rainToday: 25, rainLast3Days: 50, humidity: 92 }),
  },
  {
    id: 'cold-front',
    label: 'Cold northerly winds',
    apply: (typical) => ({
      ...typical,
      temperature: Math.max(10, typical.temperature - 4),
      temperatureChange: -4,
      pressureChange: 4,
      windDirection: 0,
      windSpeed: 14,
      humidity: 60,
      cloud: 40,
    }),
  },
]

let predictorPromise = null

// Loads the model once (about 850 KB), then reuses it.
function loadPredictor() {
  if (!predictorPromise) {
    predictorPromise = fetch(MODEL_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load the prediction model (HTTP ${response.status}).`)
        return response.json()
      })
      .then(
        (model) =>
          new BirdQuestPredictor(model, {
            // Wrapped in an arrow function on purpose: browsers refuse to run a
            // bare `fetch` that's been stored on an object ("Illegal invocation").
            fetchFn: USE_LIVE_WEATHER ? (url) => fetch(url) : null,
          }),
      )
      .catch((error) => {
        predictorPromise = null // allow a retry
        throw error
      })
  }
  return predictorPromise
}

// The model runs on the main thread, so let the browser show "Calculating…" first.
function letBrowserPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))
}

// ---------- small helpers that turn model output into plain objects ----------

function speciesFrom(modelSpecies) {
  return { id: modelSpecies.column, commonName: modelSpecies.common, scientificName: modelSpecies.sci }
}

function placeFrom(location) {
  return {
    id: location.locality_id,
    nameEn: location.name_en,
    // Many hotspots have no Chinese name; the model then repeats the English one.
    nameZh: location.name_zh && location.name_zh !== location.name_en ? location.name_zh : null,
  }
}

const CHOSEN_WEATHER_SOURCE = 'chosen by user'

function weatherLowersReliability(weatherSource) {
  // Typical and chosen weather are not forecasts for the date, so the model
  // lowers reliability one level for both.
  return String(weatherSource).startsWith('climatology') || weatherSource === CHOSEN_WEATHER_SOURCE
}

function describeWeather(weatherSource) {
  if (weatherSource === CHOSEN_WEATHER_SOURCE) {
    return 'The weather you set. This is a what-if, not a forecast for that date.'
  }
  if (String(weatherSource).startsWith('climatology')) {
    return USE_LIVE_WEATHER
      ? 'Typical weather for the month (no forecast available for this date).'
      : 'Typical weather for the month (live forecasts are not connected).'
  }
  return 'Weather forecast from Open-Meteo.'
}

function compassPoint(sin, cos) {
  // Averaged directions (typical weather) can be weak; call those variable.
  if (Math.hypot(sin, cos) < 0.25) return 'variable directions'
  const degrees = ((Math.atan2(sin, cos) * 180) / Math.PI + 360) % 360
  return COMPASS_POINTS[Math.round(degrees / 45) % 8]
}

// One line describing the weather values the model used.
function summarizeWeather(w) {
  const one = (x) => Math.round(x * 10) / 10
  const parts = [
    `${one(w.temp_mean_c)} °C`,
    `wind ${one(w.wind_speed_kmh)} km/h from ${compassPoint(w.wind_dir_sin, w.wind_dir_cos)}`,
    `sunshine ${one(w.sunshine_hr)} h`,
    `humidity ${Math.round(w.rh_mean_pct)}%`,
    `cloud ${Math.round(w.cloud_pct)}%`,
    `rain ${one(w.rainfall_mm)} mm today, ${one(w.rain_3d_sum_mm)} mm over 3 days`,
  ]
  if (Math.abs(w.temp_mean_change_1d) >= 0.5) parts.push(`${w.temp_mean_change_1d > 0 ? '+' : ''}${one(w.temp_mean_change_1d)} °C since yesterday`)
  if (Math.abs(w.pressure_change_1d) >= 0.5) parts.push(`pressure ${w.pressure_change_1d > 0 ? '+' : ''}${one(w.pressure_change_1d)} hPa since yesterday`)
  return parts.join(' · ')
}

// Turns the model's technical reasons into plain English.
// The weather reason is left out here because it's shown once for all results.
function explainReasons(reasons) {
  return reasons
    .filter((reason) => !reason.startsWith('weather is'))
    .map((reason) => {
      if (reason.startsWith('model is less reliable')) {
        return 'This species was harder for the model to predict in testing.'
      }
      if (reason.startsWith('no training checklists')) {
        return 'No past checklists from this place at this time of year, so this is an estimate.'
      }
      if (reason.startsWith('nearest modelled hotspot')) {
        return 'The nearest place the model knows is more than 3 km away.'
      }
      return reason
    })
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function monthOf(isoDate) {
  return Number(isoDate.slice(5, 7))
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function daysBetween(fromDate, toDate) {
  return Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86400000)
}

function minutesBetween(startTime, endTime) {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
  return toMinutes(endTime) - toMinutes(startTime)
}

// Typical weather for each month, in the same shape the weather controls use.
// windDirection null means "typical for the month" (a mix of directions).
function typicalWeatherByMonth(predictor) {
  const climate = predictor.m.weather_climatology_by_month
  return Array.from({ length: 12 }, (_, i) => {
    const typical = { windDirection: null }
    for (const control of WEATHER_CONTROLS) {
      if (control.field) typical[control.key] = climate[control.field][i]
    }
    typical.windDirectionLabel = compassPoint(climate.wind_dir_sin[i], climate.wind_dir_cos[i])
    return typical
  })
}

// Converts weather from the controls into the model's own input fields.
function toModelWeather(predictor, chosen, isoDate) {
  const climate = predictor.m.weather_climatology_by_month
  const month = monthOf(isoDate)
  const weather = {}
  for (const control of WEATHER_CONTROLS) {
    if (control.field) weather[control.field] = chosen[control.key]
  }
  if (chosen.windDirection === null) {
    weather.wind_dir_sin = climate.wind_dir_sin[month - 1]
    weather.wind_dir_cos = climate.wind_dir_cos[month - 1]
  } else {
    const radians = (chosen.windDirection * Math.PI) / 180
    weather.wind_dir_sin = Math.sin(radians)
    weather.wind_dir_cos = Math.cos(radians)
  }
  weather.source = CHOSEN_WEATHER_SOURCE
  // Chosen weather isn't a forecast for the date. A lead time over 7 days makes
  // the model lower reliability one level, the same as for typical weather.
  weather.lead_days = 99
  return weather
}

// ---------- public functions ----------

// Lists and settings for the forms.
// Returns { isMock, today, usesLiveWeather, locations, species,
//           weatherControls, weatherPresets, typicalWeather (12 months) }
export async function getPlannerOptions() {
  const predictor = await loadPredictor()
  const byName = (a, b) => a.localeCompare(b)
  return {
    isMock: false,
    today: predictor.today, // today's date in Hong Kong, "YYYY-MM-DD"
    usesLiveWeather: USE_LIVE_WEATHER,
    locations: predictor.m.locations
      .filter((location) => location.locality_type === 'hotspot')
      .map(placeFrom)
      .sort((a, b) => byName(a.nameEn, b.nameEn)),
    species: predictor.m.species.map(speciesFrom).sort((a, b) => byName(a.commonName, b.commonName)),
    weatherControls: WEATHER_CONTROLS,
    weatherPresets: WEATHER_PRESETS,
    typicalWeather: typicalWeatherByMonth(predictor),
  }
}

// Question 1: "I'm going to this place at this time. What might I see?"
// request: { locationId, date: "YYYY-MM-DD", start: "HH:MM", end: "HH:MM",
//            targetSpeciesId (optional), weather (optional: values from the weather controls) }
export async function predictBirdsAt({ locationId, date, start, end, targetSpeciesId = null, weather = null }) {
  const predictor = await loadPredictor()
  await letBrowserPaint()

  const result = await predictor.predictSpecies({
    location: locationId,
    date,
    start,
    end,
    targetSpecies: targetSpeciesId || null,
    topK: 20,
    weather: weather ? toModelWeather(predictor, weather, date) : null,
  })
  const speciesBySci = new Map(predictor.m.species.map((s) => [s.sci, speciesFrom(s)]))
  const weatherSource = result.weather_used.source

  const toPrediction = (item) => ({
    chance: item.probability,
    label: item.label, // 'likely' | 'possible' | 'unlikely'
    reliability: item.level, // 'high' | 'medium' | 'low'
    reasons: explainReasons(item.reasons),
  })

  let targetSpecies = null
  if (result.target_species) {
    const modelSpecies = predictor.m.species.find((s) => s.column === targetSpeciesId)
    targetSpecies = {
      species: speciesFrom(modelSpecies),
      rank: result.target_species.rank,
      ...toPrediction(result.target_species),
    }
  }

  return {
    isMock: false,
    place: placeFrom(result.location),
    dateLabel: formatDate(date),
    start,
    end,
    visitMinutes: minutesBetween(start, end),
    weather: describeWeather(weatherSource),
    weatherSummary: summarizeWeather(result.weather_used),
    weatherLowersReliability: weatherLowersReliability(weatherSource),
    expectedSpeciesCount: result.expected_species_count,
    targetSpecies,
    rankedSpecies: result.ranked_species.map((item, index) => ({
      rank: index + 1,
      species: speciesBySci.get(item.species_sci),
      bestStart: item.best_start,
      ...toPrediction(item),
    })),
    // Other hotspots at the same time: chance for the target species,
    // or the expected number of species when no target was chosen.
    otherPlaces: result.prediction_map
      .filter((spot) => spot.locality_id !== result.location.locality_id)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((spot) => ({ place: placeFrom(spot), value: spot.value, metric: spot.metric })),
    otherPlacesMetric: targetSpecies ? 'chance' : 'expectedSpecies',
  }
}

// Question 2: "I want to see this bird. Where and when should I go?"
// request: { speciesId, dateFrom: "YYYY-MM-DD", dateTo: "YYYY-MM-DD",
//            weather (optional: values from the weather controls, used for every day) }
export async function findPlacesForBird({ speciesId, dateFrom, dateTo, weather = null }) {
  if (daysBetween(dateFrom, dateTo) < 0) throw new Error('The end date is before the start date.')
  if (daysBetween(dateFrom, dateTo) + 1 > MAX_SEARCH_DAYS) {
    throw new Error(`Choose ${MAX_SEARCH_DAYS} days or fewer.`)
  }

  const predictor = await loadPredictor()
  await letBrowserPaint()

  const dayCount = daysBetween(dateFrom, dateTo) + 1
  const weatherByDate = {}
  if (weather) {
    for (let i = 0; i < dayCount; i++) {
      const date = addDays(dateFrom, i)
      weatherByDate[date] = toModelWeather(predictor, weather, date)
    }
  }

  // The predictor keeps one entry per place PER DAY, so with several days the
  // top 10 can be one place repeated. Ask for enough entries (10 per day) to
  // then keep each place once, at its best day and time.
  const result = await predictor.recommend({
    species: speciesId,
    dates: { from: dateFrom, to: dateTo },
    topN: 10 * dayCount,
    weatherByDate,
  })
  const seenPlaces = new Set()
  const topPlaces = result.recommendations.filter((item) => {
    if (seenPlaces.has(item.location.locality_id)) return false
    seenPlaces.add(item.location.locality_id)
    return true
  })
  const modelSpecies = predictor.m.species.find((s) => s.column === speciesId)

  const toSuggestion = (item) => ({
    date: item.date,
    dateLabel: formatDate(item.date),
    start: item.start,
    end: item.end,
    place: placeFrom(item.location),
    chance: item.probability,
    label: item.label,
    reliability: item.level,
    reasons: explainReasons(item.reasons),
  })

  const weatherSource = result.recommendations[0]?.weather_source ?? 'climatology'

  return {
    isMock: false,
    species: speciesFrom(modelSpecies),
    visitMinutes: predictor.m.defaults.duration_min,
    weather: describeWeather(weatherSource),
    // Chosen weather is the same every day, so it can be summarised once.
    weatherSummary: weather ? summarizeWeather(weatherByDate[dateFrom]) : null,
    weatherIsChosen: Boolean(weather),
    weatherLowersReliability: weatherLowersReliability(weatherSource),
    suggestions: topPlaces.slice(0, 10).map(toSuggestion), // 10 different places
    // One best option per day, in date order (only useful for several days).
    bestPerDay:
      dateFrom === dateTo
        ? []
        : result.best_per_date.map(toSuggestion).sort((a, b) => a.date.localeCompare(b.date)),
  }
}
