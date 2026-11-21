import ConfidenceIndicator from './ConfidenceIndicator.jsx'
import PredictionCard from './PredictionCard.jsx'

function placeName(place) {
  return place.nameZh ? `${place.nameEn} · ${place.nameZh}` : place.nameEn
}

// Results for "Where can I see it?" (from findPlacesForBird in the trip planner service).
// Props: result, headingRef (for scrolling to the results), onAskAboutSpecies
export default function PlacesForBirdResults({ result, headingRef, onAskAboutSpecies }) {
  const hours = result.visitMinutes / 60

  return (
    <section className="planner-results" aria-labelledby="bird-results-heading">
      <h2 id="bird-results-heading" className="section-title" tabIndex={-1} ref={headingRef}>
        Best places and times
      </h2>
      <p className="results-summary">
        For the <strong>{result.species.commonName}</strong> <em>({result.species.scientificName})</em>
      </p>
      <p className="results-meta">
        Each suggestion is a {hours}-hour visit to one of 98 hotspots. They're sorted by chance of
        recording, with a small penalty for less reliable predictions.
      </p>
      <p className="results-meta">
        <strong>Weather used:</strong> {result.weather}
        {result.weatherLowersReliability && ' This lowers reliability by one level for every result.'}
      </p>
      {result.weatherSummary && <p className="weather-summary">{result.weatherSummary}</p>}
      <button
        type="button"
        className="button button-secondary"
        onClick={() => onAskAboutSpecies(result.species)}
      >
        Ask the assistant about this bird
      </button>

      <h3 className="subsection-title">Top places</h3>
      <p className="results-meta">Each place is shown once, at its best day and time.</p>
      <ol className="match-list">
        {result.suggestions.map((option, index) => (
          <li key={option.place.id}>
            <PredictionCard
              tag={`#${index + 1}`}
              heading={option.place.nameEn}
              subheading={option.place.nameZh}
              details={`${option.dateLabel} · ${option.start}–${option.end}`}
              chance={option.chance}
              label={option.label}
              reliability={option.reliability}
              reasons={option.reasons}
            />
          </li>
        ))}
      </ol>

      {result.bestPerDay.length > 0 && (
        <>
          <h3 className="subsection-title">Best option each day</h3>
          {result.weatherLowersReliability && (
            <p className="results-meta">
              {result.weatherIsChosen
                ? 'Your weather is used for every day'
                : 'Without live forecasts every day uses the same typical weather'}
              , so the days differ only slightly (by season). Pick whichever day suits you.
            </p>
          )}
          <ol className="place-list">
            {result.bestPerDay.map((option) => (
              <li key={option.date} className="card place-row">
                <p className="place-row-name">
                  <strong>{option.dateLabel}</strong> · {option.start}–{option.end}
                </p>
                <p>{placeName(option.place)}</p>
                <ConfidenceIndicator value={option.chance} label="Chance of recording" />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
