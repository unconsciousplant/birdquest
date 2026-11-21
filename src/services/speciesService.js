import { MOCK_SPECIES } from '../mock-data/species.js'

// ------------------------------------------------------------
// Species service: the list of species the app knows about.
// CURRENTLY: returns mock data.
// LATER: could load a checked dataset. Keep the same return shape.
// ------------------------------------------------------------

// Returns { isMock, species: [...] }
export async function listSpecies() {
  return {
    isMock: true,
    species: MOCK_SPECIES,
  }
}

// Returns { isMock, species } where species is null if the id is unknown.
export async function getSpeciesById(id) {
  return {
    isMock: true,
    species: MOCK_SPECIES.find((s) => s.id === id) ?? null,
  }
}
