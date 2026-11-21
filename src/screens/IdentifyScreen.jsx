import { useEffect, useRef, useState } from 'react'
import ConfidenceIndicator from '../components/ConfidenceIndicator.jsx'
import IdentifierGuide from '../components/IdentifierGuide.jsx'
import MockDataNotice from '../components/MockDataNotice.jsx'
import PhotoPicker from '../components/PhotoPicker.jsx'
import SpeciesCard from '../components/SpeciesCard.jsx'
import { identifyBird } from '../services/identificationService.js'

// Text for the progress message while matches are being found.
function loadingMessage(detail) {
  if (detail?.stage === 'downloading') {
    const megabytes = (bytes) => Math.round(bytes / 1e6)
    const amount = detail.total
      ? `${megabytes(detail.received)} of ${megabytes(detail.total)} MB`
      : `${megabytes(detail.received)} MB`
    return `Downloading the identifier (first time only): ${amount}…`
  }
  if (detail?.stage === 'starting') return 'Starting the identifier…'
  return 'Identifying…'
}

// Identify a bird: choose a photo, preview it, then see ranked matches.
// Matches come from services/identificationService.js.
export default function IdentifyScreen({ onAskAboutSpecies }) {
  // { file, previewUrl } once a photo is chosen, otherwise null.
  // previewUrl is a temporary in-browser address so <img> can show the photo.
  const [photo, setPhoto] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [statusDetail, setStatusDetail] = useState(null) // progress while loading
  const [errorMessage, setErrorMessage] = useState(null)
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
    setStatusDetail(null)
    try {
      const identification = await identifyBird(photo.file, { onStatus: setStatusDetail })
      setResult(identification)
      setStatus('done')
    } catch (error) {
      setErrorMessage(error.message)
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'
  const topConfidence = result?.matches[0]?.confidence ?? 0

  return (
    <>
      <section className="screen-intro">
        <h1>Identify a bird</h1>
        <p className="lead">Choose a bird photo to see which species it might be.</p>
        <p className="prototype-note">
          Your photo stays on your device. BirdQuest doesn&apos;t upload it anywhere.
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
        <p className="field-hint">Tip: the identifier looks at the middle of the photo, so keep the bird centred.</p>
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
        {isLoading && <p role="status">{loadingMessage(statusDetail)}</p>}
      </section>

      {status === 'error' && (
        <p className="error-message" role="alert">
          Something went wrong while finding matches: {errorMessage} Please try again.
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
              These matches are sample data. The image classifier isn&apos;t connected, so they
              don&apos;t come from your photo.
            </MockDataNotice>
          )}
          {topConfidence < 0.5 && (
            <p className="results-meta low-confidence">
              The identifier isn&apos;t sure about this photo: no match is above 50%. Treat these as
              suggestions and check them in a field guide.
            </p>
          )}
          <p className="confidence-about">
            <strong>About confidence:</strong> it shows how strongly the model favours a species
            compared with the other {result.speciesCount - 1} it knows. It isn&apos;t a measure of
            the model&apos;s accuracy, and a confident match can still be wrong.
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

      <IdentifierGuide />
    </>
  )
}
