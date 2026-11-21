import ComingSoon from '../components/ComingSoon.jsx'
import MockDataNotice from '../components/MockDataNotice.jsx'

// Placeholder. Will use services/assistantService.js (askAssistant).
// `selectedSpecies` comes from App.jsx, so it can be chosen on another screen.
export default function AssistantScreen({ selectedSpecies, onClearSpecies }) {
  return (
    <>
      <section className="screen-intro">
        <h1>Bird assistant</h1>
        <p className="lead">
          Ask about species, habitats, behaviour, seasonal occurrence and conservation.
        </p>
      </section>

      <section className="card selected-species" aria-live="polite">
        <h2 className="card-title">Selected species</h2>
        {selectedSpecies ? (
          <div className="selected-species-row">
            <p>
              <strong>{selectedSpecies.commonName}</strong>{' '}
              <em>({selectedSpecies.scientificName})</em>
            </p>
            <button type="button" className="button button-secondary" onClick={onClearSpecies}>
              Clear
            </button>
          </div>
        ) : (
          <p>
            None yet. Pick one with <em>Ask the assistant</em> on the <a href="#/">Home</a> or{' '}
            <a href="#/identify">Identify</a> screen.
          </p>
        )}
      </section>

      <ComingSoon
        items={[
          'Type a question about the selected species, or any bird',
          'Get answers about habitats, behaviour, seasons and conservation',
        ]}
      />

      <MockDataNotice>
        The assistant isn't connected yet, so answers here will be placeholder text.
      </MockDataNotice>
    </>
  )
}
