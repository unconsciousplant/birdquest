import { useId, useState } from 'react'
import WeatherPicker from './WeatherPicker.jsx'

const MAX_VISIT_MINUTES = 300 // the model was trained on visits of up to 5 hours

function minutesOf(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Form for "What can I see?": place, date, time range and an optional target bird.
// Props:
//   locations, species   lists from the trip planner service
//   minDate, maxDate     "YYYY-MM-DD"
//   weatherSettings      { controls, presets, typicalByMonth } for the weather picker
//   disabled             true while calculating
//   onSubmit             called with { locationId, date, start, end, targetSpeciesId, weather }
export default function PlaceSearchForm({
  locations,
  species,
  minDate,
  maxDate,
  weatherSettings,
  disabled,
  onSubmit,
}) {
  const id = useId()
  const [locationId, setLocationId] = useState('')
  const [date, setDate] = useState(minDate)
  const [start, setStart] = useState('07:00')
  const [end, setEnd] = useState('10:00')
  const [targetSpeciesId, setTargetSpeciesId] = useState('')
  const [weather, setWeather] = useState(null) // null = typical weather for the month
  const [error, setError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    const visitMinutes = minutesOf(end) - minutesOf(start)
    if (!locationId) return setError('Choose a place.')
    if (!date) return setError('Choose a date.')
    if (visitMinutes <= 0) return setError('The end time must be after the start time.')
    if (visitMinutes > MAX_VISIT_MINUTES) return setError('Choose a visit of 5 hours or less.')
    setError(null)
    onSubmit({ locationId, date, start, end, targetSpeciesId: targetSpeciesId || null, weather })
  }

  return (
    <form className="card planner-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-place`}>Place</label>
        <select id={`${id}-place`} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Choose a place…</option>
          {locations.map((place) => (
            <option key={place.id} value={place.id}>
              {place.nameZh ? `${place.nameEn} · ${place.nameZh}` : place.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${id}-date`}>Date</label>
        <input
          id={`${id}-date`}
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-start`}>From</label>
          <input id={`${id}-start`} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-end`}>To</label>
          <input id={`${id}-end`} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-target`}>
          Target bird <span className="field-optional">(optional)</span>
        </label>
        <select id={`${id}-target`} value={targetSpeciesId} onChange={(e) => setTargetSpeciesId(e.target.value)}>
          <option value="">Any bird</option>
          {species.map((bird) => (
            <option key={bird.id} value={bird.id}>
              {bird.commonName}
            </option>
          ))}
        </select>
      </div>

      <WeatherPicker
        {...weatherSettings}
        month={Number((date || minDate).slice(5, 7))}
        onChange={setWeather}
      />

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="button button-primary" disabled={disabled}>
        {disabled ? 'Calculating…' : 'Show likely birds'}
      </button>
    </form>
  )
}
