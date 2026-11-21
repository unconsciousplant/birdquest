// Shows one species.
// Optional species fields: chineseName, habitat, season (shown when present).
// Optional props:
//   rank      shows a "Match 1" label (used for identification results)
//   children  extra content, such as a confidence indicator
//   onAsk     shows an "Ask the assistant" button
export default function SpeciesCard({ species, rank, onAsk, children }) {
  const hasFacts = Boolean(species.habitat || species.season)

  return (
    <article className="card species-card">
      {rank !== undefined && <p className="species-rank">Match {rank}</p>}
      <h3 className="species-name">{species.commonName}</h3>
      <p className="species-scientific">{species.scientificName}</p>
      {species.chineseName && (
        <p className="species-chinese" lang="zh-Hans">
          {species.chineseName}
        </p>
      )}
      {hasFacts && (
        <dl className="species-facts">
          {species.habitat && (
            <div>
              <dt>Habitat</dt>
              <dd>{species.habitat}</dd>
            </div>
          )}
          {species.season && (
            <div>
              <dt>When</dt>
              <dd>{species.season}</dd>
            </div>
          )}
        </dl>
      )}
      {children}
      {onAsk && (
        <button type="button" className="button button-secondary" onClick={() => onAsk(species)}>
          Ask the assistant
        </button>
      )}
    </article>
  )
}
