// One question with an answer that opens and closes.
// Uses the browser's built-in <details> element, so it works with the
// keyboard and screen readers without any extra code.
//   question: the question text
//   children: the answer (any content)
//   open:     start opened (optional)
export default function QAItem({ question, open = false, children }) {
  return (
    <details className="qa-item" open={open}>
      <summary className="qa-question">{question}</summary>
      <div className="qa-answer">{children}</div>
    </details>
  )
}
