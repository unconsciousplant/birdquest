import { useEffect, useState } from 'react'
import MockDataNotice from '../components/MockDataNotice.jsx'
import SpeciesCard from '../components/SpeciesCard.jsx'
import { listSpecies } from '../services/speciesService.js'

const FEATURES = [
  {
    hash: '#/plan',
    title: 'Plan a trip',
    text: 'See which birds you might find at a place and time, or where and when to look for a particular bird.',
  },
  {
    hash: '#/identify',
    title: 'Identify a bird',
    text: 'Upload a photo and see which species it might be.',
  },
  {
    hash: '#/assistant',
    title: 'Ask the assistant',
    text: 'Questions about species, habitats, behaviour, seasons and conservation.',
  },
]

export default function HomeScreen({ onAskAboutSpecies }) {
  // null while loading; then the object returned by the service.
  const [speciesResult, setSpeciesResult] = useState(null)

  useEffect(() => {
    let ignore = false // stops a late result updating a screen we've left
    listSpecies().then((result) => {
      if (!ignore) setSpeciesResult(result)
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <>
      <section className="screen-intro">
        <h1>BirdQuest</h1>
        <p className="lead">
          Plan birdwatching trips in Hong Kong, identify birds from photos, and learn about
          species.
        </p>
        <p className="prototype-note">
          University project prototype. Trip planning and photo identification use trained models,
          and the assistant answers from checked facts about 61 Hong Kong species.
        </p>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="section-title">
          What you can do
        </h2>
        <div className="grid">
          {FEATURES.map((feature) => (
            <a key={feature.hash} className="card card-link" href={feature.hash}>
              <h3 className="card-title">{feature.title}</h3>
              <p>{feature.text}</p>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="species-heading">
        <h2 id="species-heading" className="section-title">
          Sample species
        </h2>
        {speciesResult === null ? (
          <p>Loading…</p>
        ) : (
          <>
            {speciesResult.isMock && (
              <MockDataNotice>
                Sample list for building the interface. Check facts against a trusted source
                before relying on them.
              </MockDataNotice>
            )}
            <div className="grid">
              {speciesResult.species.map((species) => (
                <SpeciesCard key={species.id} species={species} onAsk={onAskAboutSpecies} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
