// Shows the model's confidence for one match.
//   value: a number from 0 to 1, or null when no model is connected.
// What the number means is explained once, above the list of matches.
export default function ConfidenceIndicator({ value }) {
  if (value === null || value === undefined) {
    return (
      <p className="confidence">
        <span className="confidence-label">Confidence:</span> not available (no model connected
        yet)
      </p>
    )
  }

  const percent = Math.min(100, Math.max(0, Math.round(value * 100)))

  // Rounding 0.999 up to "100%" would suggest certainty the model doesn't have.
  let text = `${percent}%`
  if (percent === 100 && value < 1) text = '>99%'
  if (percent === 0 && value > 0) text = '<1%'

  return (
    <div className="confidence">
      <p>
        <span className="confidence-label">Confidence:</span> {text}
      </p>
      {/* Visual bar only; the percentage above is what screen readers read. */}
      <div className="confidence-bar" aria-hidden="true">
        <div className="confidence-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
