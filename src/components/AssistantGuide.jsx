// Plain-language notes about the bird assistant: how it works, what it
// covers, where its facts come from, and privacy.
//   speciesCount: how many species it covers (null while loading)
export default function AssistantGuide({ speciesCount }) {
  const covered = speciesCount ? `${speciesCount} Hong Kong species` : 'Hong Kong species'
  return (
    <section className="card prediction-guide" aria-labelledby="assistant-guide-heading">
      <h2 id="assistant-guide-heading" className="card-title">
        About the assistant
      </h2>
      <dl className="guide-list">
        <div>
          <dt>How it works</dt>
          <dd>
            A simple rule-based chatbot, not an AI. It looks for a bird&apos;s name and keywords in your
            question, then answers from a fixed set of facts. Bird names work in English, Latin or Chinese
            (simplified or traditional).
          </dd>
        </div>
        <div>
          <dt>What it covers</dt>
          <dd>
            {covered}: the 60 in our trip planner plus the Black-faced Spoonbill. For each one
            it can describe the bird, its habitat, food and behaviour, when and where to see it in Hong Kong,
            its conservation status and its names. It answers one bird at a time.
          </dd>
        </div>
        <div>
          <dt>Where the facts come from</dt>
          <dd>
            Descriptions are general notes written for BirdQuest, so check a field guide for detail. Seasons
            come from complete eBird checklists from Hong Kong (October 2025 to September 2026), and the best
            places from our trip planner model. Conservation status is the IUCN Red List, mostly via
            iNaturalist, with threatened species checked against BirdLife International.
          </dd>
        </div>
        <div>
          <dt>Privacy</dt>
          <dd>
            It runs on your device. Your questions aren&apos;t sent anywhere or saved, and the chat is cleared
            when you reload the page.
          </dd>
        </div>
      </dl>
    </section>
  )
}
