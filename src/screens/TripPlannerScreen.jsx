import { useEffect, useRef, useState } from 'react'
import BirdSearchForm from '../components/BirdSearchForm.jsx'
import BirdsAtPlaceResults from '../components/BirdsAtPlaceResults.jsx'
import PlaceSearchForm from '../components/PlaceSearchForm.jsx'
import PlacesForBirdResults from '../components/PlacesForBirdResults.jsx'
import PredictionGuide from '../components/PredictionGuide.jsx'
import {
  MAX_SEARCH_DAYS,
  findPlacesForBird,
  getPlannerOptions,
  predictBirdsAt,
} from '../services/tripPlannerService.js'

// The two questions the planner can answer.
const MODES = [
  { id: 'place', title: 'What can I see?', hint: 'Choose a place and time' },
  { id: 'bird', title: 'Where can I see it?', hint: 'Choose a bird' },
]

const EMPTY_SEARCH = { status: 'idle', result: null, error: null } // status: idle | loading | done | error

function oneYearLater(isoDate) {
  const [year, month, day] = isoDate.split('-')
  return `${Number(year) + 1}-${month}-${day}`
}

export default function TripPlannerScreen({ onAskAboutSpecies }) {
  const [options, setOptions] = useState(null) // places and birds for the forms
  const [optionsError, setOptionsError] = useState(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [mode, setMode] = useState('place')
  // Each question keeps its own results, so switching back and forth loses nothing.
  const [placeSearch, setPlaceSearch] = useState(EMPTY_SEARCH)
  const [birdSearch, setBirdSearch] = useState(EMPTY_SEARCH)
  const [scrollRequest, setScrollRequest] = useState(0)
  const resultsHeadingRef = useRef(null)

  // Load the model and the lists for the forms.
  useEffect(() => {
    let ignore = false
    getPlannerOptions().then(
      (data) => {
        if (!ignore) setOptions(data)
      },
      (error) => {
        if (!ignore) setOptionsError(error.message)
      },
    )
    return () => {
      ignore = true
    }
  }, [loadAttempt])

  // After new results arrive, bring them to the top of the screen and focus their heading.
  useEffect(() => {
    const heading = resultsHeadingRef.current
    if (scrollRequest > 0 && heading) {
      heading.scrollIntoView({ block: 'start' })
      heading.focus({ preventScroll: true })
    }
  }, [scrollRequest])

  function handleRetry() {
    setOptionsError(null)
    setLoadAttempt((n) => n + 1)
  }

  async function runSearch(setSearch, search) {
    setSearch({ status: 'loading', result: null, error: null })
    try {
      const result = await search()
      setSearch({ status: 'done', result, error: null })
      setScrollRequest((n) => n + 1)
    } catch (error) {
      setSearch({ status: 'error', result: null, error: error.message })
    }
  }

  const currentSearch = mode === 'place' ? placeSearch : birdSearch
  const weatherSettings = options && {
    controls: options.weatherControls,
    presets: options.weatherPresets,
    typicalByMonth: options.typicalWeather,
  }

  return (
    <>
      <section className="screen-intro">
        <h1>Plan a trip</h1>
        <p className="lead">Find out which birds you might see, and where and when to look.</p>
        <p className="prototype-note">
          Predictions come from the BirdQuest model and are calculated on your device. They're
          estimates, not guarantees.
        </p>
      </section>

      {optionsError && (
        <div className="error-message" role="alert">
          <p>{optionsError}</p>
          <button type="button" className="button button-secondary" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}

      {!options && !optionsError && <p role="status">Loading the prediction model…</p>}

      {options && (
        <>
          <div className="mode-switch" role="group" aria-label="What do you want to plan?">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className="mode-button"
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
              >
                <span className="mode-title">{m.title}</span>
                <span className="mode-hint">{m.hint}</span>
              </button>
            ))}
          </div>

          {/* Both forms stay mounted (just hidden) so what you typed is kept. */}
          <div hidden={mode !== 'place'}>
            <PlaceSearchForm
              locations={options.locations}
              species={options.species}
              minDate={options.today}
              maxDate={oneYearLater(options.today)}
              weatherSettings={weatherSettings}
              disabled={placeSearch.status === 'loading'}
              onSubmit={(request) => runSearch(setPlaceSearch, () => predictBirdsAt(request))}
            />
          </div>
          <div hidden={mode !== 'bird'}>
            <BirdSearchForm
              species={options.species}
              minDate={options.today}
              maxDate={oneYearLater(options.today)}
              maxDays={MAX_SEARCH_DAYS}
              weatherSettings={weatherSettings}
              disabled={birdSearch.status === 'loading'}
              onSubmit={(request) => runSearch(setBirdSearch, () => findPlacesForBird(request))}
            />
          </div>

          {currentSearch.status === 'loading' && <p role="status">Calculating…</p>}
          {currentSearch.status === 'error' && (
            <p className="error-message" role="alert">
              Something went wrong: {currentSearch.error}
            </p>
          )}

          {mode === 'place' && placeSearch.status === 'done' && (
            <BirdsAtPlaceResults
              result={placeSearch.result}
              headingRef={resultsHeadingRef}
              onAskAboutSpecies={onAskAboutSpecies}
            />
          )}
          {mode === 'bird' && birdSearch.status === 'done' && (
            <PlacesForBirdResults
              result={birdSearch.result}
              headingRef={resultsHeadingRef}
              onAskAboutSpecies={onAskAboutSpecies}
            />
          )}

          <PredictionGuide usesLiveWeather={options.usesLiveWeather} />
        </>
      )}
    </>
  )
}
