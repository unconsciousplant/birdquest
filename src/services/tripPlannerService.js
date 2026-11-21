import { MOCK_SPECIES } from '../mock-data/species.js'
import { MOCK_SPOTS } from '../mock-data/spots.js'

// ------------------------------------------------------------
// Trip planner service
// CURRENTLY: returns mock results. No model is connected, so the
// order means nothing and every score is null, not a made-up number.
// LATER: call the real planning model here. Keep the same return
// shape and set isMock to false.
// ------------------------------------------------------------

const NO_MODEL_EXPLANATION =
  'No planning model is connected yet. This is sample data in a fixed order, not a prediction.'

// request: { location, date, startTime, endTime, targetSpeciesId (optional) }
// Returns {
//   isMock, request,
//   rankedSpecies: [{ rank, species, score, scoreExplanation }],
//   suggestedSpots: [{ spot, reason }],
// }
export async function planTrip(request) {
  return {
    isMock: true,
    request,
    rankedSpecies: MOCK_SPECIES.slice(0, 3).map((species, index) => ({
      rank: index + 1,
      species,
      score: null,
      scoreExplanation: NO_MODEL_EXPLANATION,
    })),
    suggestedSpots: MOCK_SPOTS.slice(0, 2).map((spot) => ({
      spot,
      reason: 'Sample suggestion, not based on your inputs.',
    })),
  }
}
