// ------------------------------------------------------------
// Assistant service
// CURRENTLY: returns placeholder text. Nothing is sent anywhere.
// LATER: connect a real assistant. Any API key must stay on a
// server, never in this frontend code (everything in src/ is public).
// ------------------------------------------------------------

// question: the user's text
// species: the selected species object, or null
// Returns { isMock, answer }
export async function askAssistant({ question, species }) {
  const about = species ? ` about the ${species.commonName}` : ''
  return {
    isMock: true,
    answer:
      `Placeholder answer: the assistant isn't connected yet, so your question${about} ` +
      `("${question}") hasn't been answered.`,
  }
}
