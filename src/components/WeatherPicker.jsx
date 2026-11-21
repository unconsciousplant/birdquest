import { useId, useState } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Wind direction choices, in degrees the wind comes FROM (0 = from the north).
const DIRECTIONS = [
  { label: 'North (N)', degrees: 0 },
  { label: 'North-east (NE)', degrees: 45 },
  { label: 'East (E)', degrees: 90 },
  { label: 'South-east (SE)', degrees: 135 },
  { label: 'South (S)', degrees: 180 },
  { label: 'South-west (SW)', degrees: 225 },
  { label: 'West (W)', degrees: 270 },
  { label: 'North-west (NW)', degrees: 315 },
]

function formatValue(value, step) {
  return Number.isInteger(step) ? String(Math.round(value)) : (Math.round(value * 10) / 10).toFixed(1)
}

// Choose between typical weather for the month and weather set by hand
// (for demonstrations: see how weather changes the predictions).
// Props:
//   controls        weather controls from the trip planner service
//   presets         quick settings: { id, label, apply(typicalWeather) }
//   typicalByMonth  typical weather for each month (index 0 = January)
//   month           month of the chosen date, 1–12
//   note            optional extra hint, e.g. "Used for every day."
//   onChange        called with the chosen weather, or null for typical weather
export default function WeatherPicker({ controls, presets, typicalByMonth, month, note, onChange }) {
  const id = useId()
  const [values, setValues] = useState(null) // null = typical weather for the month
  const typical = typicalByMonth[month - 1]
  const monthName = MONTH_NAMES[month - 1]
  const typicalWind =
    typical.windDirectionLabel === 'variable directions' ? 'variable' : `mostly from ${typical.windDirectionLabel}`

  function update(next) {
    setValues(next)
    onChange(next)
  }

  function handleSlider(key, number) {
    const next = { ...values, [key]: number }
    // The 3-day total includes today, so it can't be less than today's rain.
    if (key === 'rainToday' && next.rainLast3Days < number) next.rainLast3Days = number
    if (key === 'rainLast3Days' && number < next.rainToday) next.rainToday = number
    update(next)
  }

  return (
    <fieldset className="weather-picker">
      <legend>Weather</legend>
      <div className="choice-row">
        <label className="choice">
          <input type="radio" name={`${id}-mode`} checked={values === null} onChange={() => update(null)} />
          Typical for {monthName}
        </label>
        <label className="choice">
          <input
            type="radio"
            name={`${id}-mode`}
            checked={values !== null}
            onChange={() => update({ ...typical })}
          />
          Set it myself (demo)
        </label>
      </div>

      {values !== null && (
        <div className="weather-controls">
          <div className="preset-row" role="group" aria-label="Quick weather settings">
            <button type="button" className="button button-secondary button-small" onClick={() => update({ ...typical })}>
              Typical {monthName}
            </button>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="button button-secondary button-small"
                onClick={() => update(preset.apply(typical))}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="field-hint">
            Listed from biggest to smallest effect on the predictions. Daily values, as measured at
            the Hong Kong Observatory.{note ? ` ${note}` : ''}
          </p>

          {controls.map((control) =>
            control.type === 'direction' ? (
              <div className="field" key={control.key}>
                <label htmlFor={`${id}-${control.key}`}>{control.label}</label>
                <select
                  id={`${id}-${control.key}`}
                  value={values.windDirection === null ? 'typical' : String(values.windDirection)}
                  onChange={(e) =>
                    update({ ...values, windDirection: e.target.value === 'typical' ? null : Number(e.target.value) })
                  }
                >
                  <option value="typical">Typical ({typicalWind})</option>
                  {DIRECTIONS.map((direction) => (
                    <option key={direction.degrees} value={direction.degrees}>
                      {direction.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field slider-field" key={control.key}>
                <label htmlFor={`${id}-${control.key}`} className="slider-label">
                  <span>{control.label}</span>
                  <output htmlFor={`${id}-${control.key}`}>
                    {formatValue(values[control.key], control.step)} {control.unit}
                  </output>
                </label>
                <input
                  id={`${id}-${control.key}`}
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={values[control.key]}
                  aria-valuetext={`${formatValue(values[control.key], control.step)} ${control.unit}`}
                  onChange={(e) => handleSlider(control.key, Number(e.target.value))}
                />
                {control.hint && <p className="field-hint">{control.hint}</p>}
              </div>
            ),
          )}
        </div>
      )}
    </fieldset>
  )
}
