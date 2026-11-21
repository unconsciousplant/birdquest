// One chat message: the person's question, or the assistant's reply.
// A reply has an optional title, sections ({ heading, paragraphs, items })
// and notes about where the information comes from.
export default function ChatMessage({ message }) {
  if (message.from === 'user') {
    return (
      <li className="chat-message chat-user">
        <p className="chat-bubble">
          <span className="visually-hidden">You: </span>
          {message.text}
        </p>
      </li>
    )
  }

  const { reply } = message
  return (
    <li className="chat-message chat-bot">
      <div className="chat-bubble">
        <span className="visually-hidden">Assistant: </span>
        {reply.title && <p className="chat-title">{reply.title}</p>}
        {reply.sections.map((section, index) => (
          <div key={index} className="chat-section">
            {section.heading && <p className="chat-heading">{section.heading}</p>}
            {section.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {section.items && (
              <ul className="chat-items">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {reply.notes.length > 0 && <p className="chat-note">{reply.notes.join(' ')}</p>}
      </div>
    </li>
  )
}
