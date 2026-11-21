// Plain-language explanation of the trip planner's numbers and their limits.
//   usesLiveWeather: whether live weather forecasts are switched on
export default function PredictionGuide({ usesLiveWeather }) {
  return (
    <section className="card prediction-guide" aria-labelledby="guide-heading">
      <h2 id="guide-heading" className="card-title">
        How to read these predictions
      </h2>
      <dl className="guide-list">
        <div>
          <dt>Chance of recording</dt>
          <dd>
            How likely birdwatchers are to record the species on a visit like yours. It isn't a
            guarantee: a bird can be there and still be missed. It also isn't a measure of the
            model's accuracy.
          </dd>
        </div>
        <div>
          <dt>Likely, possible, unlikely</dt>
          <dd>
            <strong>Likely</strong> means the chance is above a cut-off set for each species when the
            model was tested. <strong>Possible</strong> means it's above half of that cut-off.
          </dd>
        </div>
        <div>
          <dt>Reliability</dt>
          <dd>
            How much to trust the number. It drops when the weather isn't a short-range forecast,
            when the species was harder to predict in testing, or when a place has no past
            checklists for that time of year.
          </dd>
        </div>
        <div>
          <dt>Weather</dt>
          <dd>
            {usesLiveWeather
              ? 'Forecasts are used for the next 16 days; later dates use typical weather for the month.'
              : "Live forecasts aren't connected yet, so predictions use typical weather for the month. That's why reliability is never higher than medium."}{' '}
            For demonstrations, choose <strong>Set it myself</strong> under Weather to see how
            temperature, wind, sun and rain change the results. Those results are a what-if, not a
            forecast.
          </dd>
        </div>
        <div>
          <dt>What's not covered</dt>
          <dd>
            Only 60 common species and 98 public eBird hotspots are included, so rarer birds such as
            the Black-faced Spoonbill aren't. Tides aren't considered, and they matter a lot for
            waterbirds at Mai Po and Deep Bay.
          </dd>
        </div>
        <div>
          <dt>Where the data comes from</dt>
          <dd>
            Complete eBird checklists from Hong Kong, October 2025 to September 2026 (eBird, Cornell
            Lab of Ornithology).
          </dd>
        </div>
      </dl>
    </section>
  )
}
