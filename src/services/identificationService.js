import { MOCK_SPECIES } from '../mock-data/species.js'

// ------------------------------------------------------------
// Identification service
// CURRENTLY: returns mock matches. The photo is not looked at, so
// every confidence is null, not a made-up number.
// LATER: load our Teachable Machine image classifier here, run it
// on the image, and return its real confidences in the same shape
// with isMock set to false. Model files must not contain secrets.
// ------------------------------------------------------------

// imageFile: a File from an <input type="file">.
// The leading _ means "not used yet"; remove it once the model is connected.
// Returns { isMock, matches: [{ rank, species, confidence }] }
//   confidence: a number from 0 to 1 from the model, or null while mocked.
// The mock always returns the same three species, whatever the photo.
export async function identifyBird(_imageFile) {
  return {
    isMock: true,
    matches: MOCK_SPECIES.slice(0, 3).map((species, index) => ({
      rank: index + 1,
      species,
      confidence: null,
    })),
  }
}
