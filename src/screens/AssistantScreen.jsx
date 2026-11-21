import { useEffect, useId, useRef, useState } from 'react'
import AssistantGuide from '../components/AssistantGuide.jsx'
import ChatMessage from '../components/ChatMessage.jsx'
import { askAssistant, getAssistantInfo, isSpeciesSupported } from '../services/assistantService.js'

// Suggested questions before the chat starts, and when a bird has just been chosen.
const STARTERS = [
  'Which birds do you know?',
  'Tell me about the Black-faced Spoonbill',
  'Where can I see the Pied Avocet?',
  'What does the Asian Koel eat?',
]
const ABOUT_THE_CHOSEN_BIRD = ['Tell me about it', 'Where can I see it?', 'When is it in Hong Kong?', 'What does it eat?']

let nextMessageId = 1

// Bird assistant: a simple rule-based chatbot (see services/assistantService.js).
// The chat itself lives in App.jsx (messages), so it survives moving between screens.
// selectedSpecies is the bird being discussed; it can come from another screen.
export default function AssistantScreen({ selectedSpecies, onSelectSpecies, messages, onMessagesChange }) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [speciesCount, setSpeciesCount] = useState(null)
  const [support, setSupport] = useState(null) // { scientificName, supported } for the selected bird
  const logRef = useRef(null) // the scrollable chat window

  useEffect(() => {
    let ignore = false
    getAssistantInfo().then(
      (info) => {
        if (!ignore) setSpeciesCount(info.speciesCount)
      },
      () => {}, // the chat itself reports loading problems
    )
    return () => {
      ignore = true
    }
  }, [])

  // Is the bird chosen on another screen one the assistant knows?
  useEffect(() => {
    if (!selectedSpecies) return
    let ignore = false
    isSpeciesSupported(selectedSpecies).then(
      (supported) => {
        if (!ignore) setSupport({ scientificName: selectedSpecies.scientificName, supported })
      },
      () => {},
    )
    return () => {
      ignore = true
    }
  }, [selectedSpecies])

  // Scroll inside the chat window (never the whole page) so the latest question
  // sits at the top: its answer, even a long one, then reads from the start.
  useEffect(() => {
    const log = logRef.current
    if (!log) return
    const questions = log.querySelectorAll('.chat-user')
    const lastQuestion = questions[questions.length - 1]
    log.scrollTop = lastQuestion ? lastQuestion.offsetTop - 8 : 0
  }, [messages.length, busy])

  // Empties the chat and forgets the bird being discussed.
  function handleClearChat() {
    onMessagesChange([])
    onSelectSpecies(null)
    setDraft('')
  }

  const selectedSupported =
    selectedSpecies && support?.scientificName === selectedSpecies.scientificName ? support.supported : null

  async function send(text) {
    const question = text.trim()
    if (!question || busy) return
    setBusy(true)
    setDraft('')
    onMessagesChange((previous) => [...previous, { id: nextMessageId++, from: 'user', text: question }])
    try {
      const reply = await askAssistant({ question, species: selectedSpecies })
      onMessagesChange((previous) => [...previous, { id: nextMessageId++, from: 'bot', reply }])
      // Remember the bird this answer was about, for follow-ups like "what does it eat?".
      if (reply.species && reply.species.scientificName !== selectedSpecies?.scientificName) {
        onSelectSpecies(reply.species)
      }
    } catch (error) {
      const reply = {
        kind: 'error',
        title: null,
        sections: [{ heading: null, paragraphs: [`Sorry, something went wrong: ${error.message}`] }],
        notes: [],
        suggestions: [],
      }
      onMessagesChange((previous) => [...previous, { id: nextMessageId++, from: 'bot', reply }])
    } finally {
      setBusy(false)
    }
  }

  // Suggested questions: from the last answer, or for a bird just chosen on another screen
  // (questions about "it" if the assistant knows that bird, otherwise the starters).
  const lastReply = [...messages].reverse().find((m) => m.from === 'bot')?.reply
  let suggestions = lastReply?.suggestions ?? STARTERS
  if (selectedSpecies && lastReply?.species?.scientificName !== selectedSpecies.scientificName) {
    if (selectedSupported === true) suggestions = ABOUT_THE_CHOSEN_BIRD
    if (selectedSupported === false) suggestions = STARTERS
  }

  return (
    <>
      <section className="screen-intro">
        <h1>Bird assistant</h1>
        <p className="lead">
          Ask about Hong Kong birds: what they look like, where they live, when and where to see them, what
          they eat and how they&apos;re doing.
        </p>
      </section>

      <section className="card selected-species" aria-live="polite">
        <h2 className="card-title">Talking about</h2>
        {selectedSpecies ? (
          <>
            <div className="selected-species-row">
              <p>
                <strong>{selectedSpecies.commonName}</strong> <em>({selectedSpecies.scientificName})</em>
              </p>
              <button type="button" className="button button-secondary" onClick={() => onSelectSpecies(null)}>
                Clear
              </button>
            </div>
            {selectedSupported === false && (
              <p className="results-meta">
                The assistant doesn&apos;t cover this bird yet. This chatbot currently only supports{' '}
                {speciesCount ?? 'a limited number of'} species of bird, and we expect to expand in the near
                future.
              </p>
            )}
          </>
        ) : (
          <p>
            No bird chosen yet. Name one in your question, or tap <em>Ask the assistant</em> on the{' '}
            <a href="#/">Home</a>, <a href="#/plan">Plan a trip</a> or <a href="#/identify">Identify</a> screen.
          </p>
        )}
      </section>

      <section className="card chat" aria-labelledby={`${id}-chat-heading`}>
        <div className="chat-header">
          <h2 id={`${id}-chat-heading`} className="card-title">
            Chat
          </h2>
          <button
            type="button"
            className="button button-secondary button-small"
            disabled={busy || (messages.length === 0 && !selectedSpecies)}
            onClick={handleClearChat}
          >
            Clear chat
          </button>
        </div>
        {/* A fixed-height window that scrolls inside. tabIndex lets keyboard users scroll it. */}
        <ol className="chat-log" role="log" aria-live="polite" aria-label="Chat messages" tabIndex={0} ref={logRef}>
          {messages.length === 0 && (
            <li className="chat-message chat-bot">
              <p className="chat-bubble">
                Hello! I can answer questions about {speciesCount ?? 'many'} Hong Kong birds. Try one of the
                questions below, or type your own.
              </p>
            </li>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {busy && (
            <li className="chat-message chat-bot">
              <p className="chat-bubble chat-typing">Thinking…</p>
            </li>
          )}
        </ol>

        <div className="chat-suggestions" role="group" aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="button button-secondary button-small"
              disabled={busy}
              onClick={() => send(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault()
            send(draft)
          }}
        >
          <label htmlFor={`${id}-question`} className="visually-hidden">
            Your question
          </label>
          <input
            id={`${id}-question`}
            type="text"
            value={draft}
            maxLength={300}
            autoComplete="off"
            enterKeyHint="send"
            placeholder="Ask about a bird…"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className="button button-primary" disabled={busy || !draft.trim()}>
            Send
          </button>
        </form>
      </section>

      <AssistantGuide speciesCount={speciesCount} />
    </>
  )
}
