import ConfidenceIndicator from './ConfidenceIndicator.jsx'

const LABEL_TEXT = { likely: 'Likely', possible: 'Possible', unlikely: 'Unlikely' }
const RELIABILITY_TEXT = { high: 'High', medium: 'Medium', low: 'Low' }

// One model prediction (a species or a place) with its chance of being recorded.
// Props:
//   heading      main text, e.g. a species or place name
//   subheading   optional second line (scientific name, Chinese name)
//   tag          optional small label above the heading, e.g. "#1"
//   details      optional line, e.g. "Best start: 07:30"
//   chance       0 to 1
//   label        'likely' | 'possible' | 'unlikely'
//   reliability  'high' | 'medium' | 'low'
//   reasons      plain-English reasons the reliability was lowered
//   onAsk        optional: shows an "Ask the assistant" button
export default function PredictionCard({
  heading,
  subheading,
  tag,
  details,
  chance,
  label,
  reliability,
  reasons = [],
  onAsk,
}) {
  return (
    <article className="card prediction-card">
      <div className="prediction-card-top">
        <div>
          {tag && <p className="species-rank">{tag}</p>}
          <h3 className="prediction-heading">{heading}</h3>
          {subheading && <p className="prediction-subheading">{subheading}</p>}
        </div>
        <span className={`likelihood likelihood-${label}`}>{LABEL_TEXT[label] ?? label}</span>
      </div>

      {details && <p className="prediction-details">{details}</p>}

      <ConfidenceIndicator value={chance} label="Chance of recording" />

      <p className="reliability">
        <span className="confidence-label">Reliability:</span> {RELIABILITY_TEXT[reliability] ?? reliability}
      </p>
      {reasons.length > 0 && (
        <ul className="reliability-reasons">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {onAsk && (
        <button type="button" className="button button-secondary" onClick={onAsk}>
          Ask the assistant
        </button>
      )}
    </article>
  )
}
