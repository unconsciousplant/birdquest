import ComingSoon from '../components/ComingSoon.jsx'
import MockDataNotice from '../components/MockDataNotice.jsx'

// Placeholder. Will use services/tripPlannerService.js (planTrip).
export default function TripPlannerScreen() {
  return (
    <>
      <section className="screen-intro">
        <h1>Plan a trip</h1>
        <p className="lead">Find out which birds you might see, and where, before you go.</p>
      </section>

      <ComingSoon
        items={[
          'Choose a location, date and time range',
          'Optionally pick a target species',
          'See a ranked list of species you might find',
          'See suggested observation spots',
          'Read a plain explanation of every score or confidence indicator',
        ]}
      />

      <MockDataNotice>
        Until a planning model is connected, results here will be sample data with no scores.
      </MockDataNotice>
    </>
  )
}
