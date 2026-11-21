// Shows a model's number for one result as a percentage and a bar.
//   value: a number from 0 to 1, or null when no model is connected.
//   label: what the number is, e.g. "Confidence" or "Chance of recording".
// What the number means is explained once, near the list of results.
export default function ConfidenceIndicator({ value, label = 'Confidence' }) {
  if (value === null || value === undefined) {
    return (
      <p className="confidence">
        <span className="confidence-label">{label}:</span> not available (no model connected yet)
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
        <span className="confidence-label">{label}:</span> {text}
      </p>
      {/* Visual bar only; the percentage above is what screen readers read. */}
      <div className="confidence-bar" aria-hidden="true">
        <div className="confidence-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
