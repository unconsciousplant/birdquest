import { createAssistant } from './assistantEngine.js'

// ------------------------------------------------------------
// Assistant service: a simple rule-based chatbot about Hong Kong birds.
// It recognises a bird's name and keywords in the question (see
// assistantEngine.js) and answers from fixed knowledge files:
//   - src/knowledge/speciesData.json: names, monthly eBird reporting rates,
//     best places from the trip model, IUCN Red List status
//     (made by scripts/build-assistant-data.mjs)
//   - src/knowledge/speciesText.js: short descriptions written for BirdQuest
// Nothing is sent anywhere: it all runs in the browser.
// ------------------------------------------------------------

// The identifier's species list: used to recognise birds the assistant
// doesn't cover yet, so it can say so instead of guessing.
const OTHER_BIRDS_URL = `${import.meta.env.BASE_URL}classifier/species.json`

let assistantPromise = null

// Loads the knowledge files once (only when the assistant is first used).
function loadAssistant() {
  if (!assistantPromise) {
    assistantPromise = Promise.all([
      import('../knowledge/speciesData.json'),
      import('../knowledge/speciesText.js'),
      fetch(OTHER_BIRDS_URL)
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => []), // still works without it; just recognises fewer unsupported birds
    ])
      .then(([data, text, otherBirds]) =>
        createAssistant({ speciesData: data.default, speciesText: text.SPECIES_TEXT, otherBirds }),
      )
      .catch((error) => {
        assistantPromise = null // allow a retry
        throw error
      })
  }
  return assistantPromise
}

// question: what the person typed
// species:  the bird being discussed (chosen on another screen or earlier in
//           the chat), used for questions like "where can I see it?"
// Returns { isMock, kind, species, title, sections: [{ heading, paragraphs, items }], notes, suggestions }
//   kind:    'answer' | 'unsupported' | 'clarify' | 'list' | 'help' | 'greeting' | 'thanks' | 'bye'
//            | 'planner' | 'which-bird' | 'fallback'
//   species: the bird the answer is about (null if none), so the screen can remember it
export async function askAssistant({ question, species = null }) {
  const assistant = await loadAssistant()
  return assistant.ask(question, species)
}

// Returns { isMock, speciesCount }
export async function getAssistantInfo() {
  const assistant = await loadAssistant()
  return { isMock: false, speciesCount: assistant.count }
}

// Whether the assistant covers a species chosen elsewhere (any object with a scientificName).
export async function isSpeciesSupported(species) {
  const assistant = await loadAssistant()
  return assistant.isSupported(species)
}
