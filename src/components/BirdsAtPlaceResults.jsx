import ConfidenceIndicator from './ConfidenceIndicator.jsx'
import PredictionCard from './PredictionCard.jsx'

function placeName(place) {
  return place.nameZh ? `${place.nameEn} · ${place.nameZh}` : place.nameEn
}

// Results for "What can I see?" (from predictBirdsAt in the trip planner service).
// Props: result, headingRef (for scrolling to the results), onAskAboutSpecies
export default function BirdsAtPlaceResults({ result, headingRef, onAskAboutSpecies }) {
  const longVisit = result.visitMinutes > 120

  return (
    <section className="planner-results" aria-labelledby="place-results-heading">
      <h2 id="place-results-heading" className="section-title" tabIndex={-1} ref={headingRef}>
        Birds you might see
      </h2>
      <p className="results-summary">
        <strong>{placeName(result.place)}</strong> · {result.dateLabel} · {result.start}–{result.end}
      </p>
      <p className="results-meta">
        On average, a visit like this records about <strong>{Math.round(result.expectedSpeciesCount)}</strong>{' '}
        of the 60 species the model covers.
      </p>
      <p className="results-meta">
        <strong>Weather used:</strong> {result.weather}
        {result.weatherLowersReliability && ' This lowers reliability by one level for every result.'}
      </p>
      <p className="weather-summary">{result.weatherSummary}</p>

      {result.targetSpecies && (
        <>
          <h3 className="subsection-title">Your target bird</h3>
          <PredictionCard
            tag={`Ranked ${result.targetSpecies.rank} of 60`}
            heading={result.targetSpecies.species.commonName}
            subheading={result.targetSpecies.species.scientificName}
            chance={result.targetSpecies.chance}
            label={result.targetSpecies.label}
            reliability={result.targetSpecies.reliability}
            reasons={result.targetSpecies.reasons}
            onAsk={() => onAskAboutSpecies(result.targetSpecies.species)}
          />
        </>
      )}

      <h3 className="subsection-title">Most likely birds</h3>
      <ol className="match-list">
        {result.rankedSpecies.map((item) => (
          <li key={item.species.id}>
            <PredictionCard
              tag={`#${item.rank}`}
              heading={item.species.commonName}
              subheading={item.species.scientificName}
              details={longVisit ? `Best 2-hour start: ${item.bestStart}` : null}
              chance={item.chance}
              label={item.label}
              reliability={item.reliability}
              reasons={item.reasons}
              onAsk={() => onAskAboutSpecies(item.species)}
            />
          </li>
        ))}
      </ol>

      <h3 className="subsection-title">Other places at the same time</h3>
      <p className="results-meta">
        {result.otherPlacesMetric === 'chance'
          ? `Chance of recording the ${result.targetSpecies.species.commonName} at other hotspots on the same date and time.`
          : 'Hotspots where a visit on the same date and time records the most species, on average.'}
      </p>
      <ol className="place-list">
        {result.otherPlaces.map((spot) => (
          <li key={spot.place.id} className="card place-row">
            <p className="place-row-name">{placeName(spot.place)}</p>
            {result.otherPlacesMetric === 'chance' ? (
              <ConfidenceIndicator value={spot.value} label="Chance of recording" />
            ) : (
              <p className="place-row-value">About {Math.round(spot.value)} species</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
