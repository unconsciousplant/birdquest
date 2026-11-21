import { useId, useState } from 'react'
import WeatherPicker from './WeatherPicker.jsx'

function daysBetween(fromDate, toDate) {
  return Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86400000)
}

// Form for "Where can I see it?": a bird and a range of dates.
// Props:
//   species             list from the trip planner service
//   minDate, maxDate    "YYYY-MM-DD"
//   maxDays             longest allowed date range
//   weatherSettings     { controls, presets, typicalByMonth } for the weather picker
//   disabled            true while calculating
//   onSubmit            called with { speciesId, dateFrom, dateTo, weather }
export default function BirdSearchForm({
  species,
  minDate,
  maxDate,
  maxDays,
  weatherSettings,
  disabled,
  onSubmit,
}) {
  const id = useId()
  const [speciesId, setSpeciesId] = useState('')
  const [dateFrom, setDateFrom] = useState(minDate)
  const [dateTo, setDateTo] = useState(minDate)
  const [weather, setWeather] = useState(null) // null = typical weather for the month
  const [error, setError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    if (!speciesId) return setError('Choose a bird.')
    if (!dateFrom || !dateTo) return setError('Choose the dates you could go.')
    const days = daysBetween(dateFrom, dateTo) + 1
    if (days < 1) return setError('The last date must be on or after the first date.')
    if (days > maxDays) return setError(`Choose ${maxDays} days or fewer.`)
    setError(null)
    onSubmit({ speciesId, dateFrom, dateTo, weather })
  }

  return (
    <form className="card planner-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-bird`}>Bird</label>
        <select id={`${id}-bird`} value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
          <option value="">Choose a bird…</option>
          {species.map((bird) => (
            <option key={bird.id} value={bird.id}>
              {bird.commonName} ({bird.scientificName})
            </option>
          ))}
        </select>
        <p className="field-hint">The model covers 60 common Hong Kong species.</p>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-from`}>First date</label>
          <input
            id={`${id}-from`}
            type="date"
            value={dateFrom}
            min={minDate}
            max={maxDate}
            onChange={(e) => {
              setDateFrom(e.target.value)
              // Keep the range valid when the first date moves past the last one.
              if (e.target.value > dateTo) setDateTo(e.target.value)
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-to`}>Last date</label>
          <input
            id={`${id}-to`}
            type="date"
            value={dateTo}
            min={dateFrom}
            max={maxDate}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
      <p className="field-hint">Up to {maxDays} days. Each suggestion is a 2-hour visit.</p>

      <WeatherPicker
        {...weatherSettings}
        month={Number((dateFrom || minDate).slice(5, 7))}
        note="The weather you set is used for every day."
        onChange={setWeather}
      />

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="button button-primary" disabled={disabled}>
        {disabled ? 'Calculating…' : 'Find places and times'}
      </button>
    </form>
  )
}
