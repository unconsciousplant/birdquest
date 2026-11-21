// Shows one species.
// Optional props:
//   rank      shows a "Match 1" label (used for identification results)
//   children  extra content, such as a confidence indicator
//   onAsk     shows an "Ask the assistant" button
export default function SpeciesCard({ species, rank, onAsk, children }) {
  return (
    <article className="card species-card">
      {rank !== undefined && <p className="species-rank">Match {rank}</p>}
      <h3 className="species-name">{species.commonName}</h3>
      <p className="species-scientific">{species.scientificName}</p>
      <dl className="species-facts">
        <div>
          <dt>Habitat</dt>
          <dd>{species.habitat}</dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>{species.season}</dd>
        </div>
      </dl>
      {children}
      {onAsk && (
        <button type="button" className="button button-secondary" onClick={() => onAsk(species)}>
          Ask the assistant
        </button>
      )}
    </article>
  )
}
