import { useEffect, useRef, useState } from 'react'
import ComingSoon from '../components/ComingSoon.jsx'
import ConfidenceIndicator from '../components/ConfidenceIndicator.jsx'
import MockDataNotice from '../components/MockDataNotice.jsx'
import PhotoPicker from '../components/PhotoPicker.jsx'
import SpeciesCard from '../components/SpeciesCard.jsx'
import { identifyBird } from '../services/identificationService.js'

// Identify a bird: choose a photo, preview it, then see ranked matches.
// Matches come from services/identificationService.js.
export default function IdentifyScreen({ onAskAboutSpecies }) {
  // { file, previewUrl } once a photo is chosen, otherwise null.
  // previewUrl is a temporary in-browser address so <img> can show the photo.
  const [photo, setPhoto] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [result, setResult] = useState(null) // what the service returned
  const resultsHeadingRef = useRef(null)

  // Release the temporary address when the photo changes or the user leaves this screen.
  useEffect(() => {
    if (!photo) return
    return () => URL.revokeObjectURL(photo.previewUrl)
  }, [photo])

  // When matches appear, scroll them to the top of the screen (on phones they're
  // below the photo) and move keyboard/screen-reader focus to their heading.
  useEffect(() => {
    const heading = resultsHeadingRef.current
    if (status === 'done' && heading) {
      heading.scrollIntoView({ block: 'start' })
      heading.focus({ preventScroll: true })
    }
  }, [status])

  function handleSelectFile(file) {
    setResult(null)
    setStatus('idle')
    if (!file.type.startsWith('image/')) {
      setPhoto(null)
      setPhotoError("That file isn't an image. Choose a JPG or PNG photo.")
      return
    }
    setPhotoError(null)
    setPhoto({ file, previewUrl: URL.createObjectURL(file) })
  }

  function handlePreviewError() {
    setPhoto(null)
    setPhotoError("This browser can't show that type of image. Try a JPG or PNG photo.")
  }

  async function handleFindMatches() {
    setStatus('loading')
    try {
      const identification = await identifyBird(photo.file)
      setResult(identification)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'

  return (
    <>
      <section className="screen-intro">
        <h1>Identify a bird</h1>
        <p className="lead">Choose a bird photo to see which species it might be.</p>
        <p className="prototype-note">
          Your photo stays on your device. BirdQuest doesn't upload it anywhere.
        </p>
      </section>

      <section className="card photo-card" aria-labelledby="photo-heading">
        <h2 id="photo-heading" className="card-title">
          Your photo
        </h2>
        <PhotoPicker
          previewUrl={photo ? photo.previewUrl : null}
          disabled={isLoading}
          onSelectFile={handleSelectFile}
          onPreviewError={handlePreviewError}
        />
        {photoError && (
          <p className="error-message" role="alert">
            {photoError}
          </p>
        )}
        {photo && (
          <button
            type="button"
            className="button button-primary"
            disabled={isLoading}
            onClick={handleFindMatches}
          >
            {isLoading ? 'Finding matches…' : 'Find matches'}
          </button>
        )}
      </section>

      {status === 'error' && (
        <p className="error-message" role="alert">
          Something went wrong while finding matches. Please try again.
        </p>
      )}

      {status === 'done' && result && (
        <section aria-labelledby="matches-heading">
          <h2
            id="matches-heading"
            className="section-title"
            tabIndex={-1}
            ref={resultsHeadingRef}
          >
            Possible matches
          </h2>
          {result.isMock && (
            <MockDataNotice>
              These matches are sample data. The image classifier isn't connected yet, so they
              don't come from your photo.
            </MockDataNotice>
          )}
          <p className="confidence-about">
            <strong>About confidence:</strong> it shows how strongly the model favours a species
            compared with the other species it was trained on. It isn't a measure of the
            model's accuracy, and a confident match can still be wrong.
          </p>
          <ol className="match-list">
            {result.matches.map((match) => (
              <li key={match.species.id}>
                <SpeciesCard species={match.species} rank={match.rank} onAsk={onAskAboutSpecies}>
                  <ConfidenceIndicator value={match.confidence} />
                </SpeciesCard>
              </li>
            ))}
          </ol>
        </section>
      )}

      <ComingSoon
        items={['Connect our Teachable Machine image classifier, so matches come from your photo']}
      />
    </>
  )
}
