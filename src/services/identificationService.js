// URL of the runtime's WebAssembly file, served from this site (never a CDN).
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'
import { resizeLikePillow } from './photoResize.js'

// ------------------------------------------------------------
// Identification service: identifies a bird photo with the
// Bird-Classification model by Zhang Jun (MIT licence): 373 common
// bird species in China, trained on iNaturalist photos.
// See docs/classifier/README.md.
//
// The model runs entirely in the browser (onnxruntime-web).
// The photo is never uploaded.
// ------------------------------------------------------------

// Files in public/classifier/ (made by scripts/convert-classifier.py and
// scripts/build-classifier-species.mjs).
const MODEL_URL = `${import.meta.env.BASE_URL}classifier/bird-classifier-v1base.onnx`
const SPECIES_URL = `${import.meta.env.BASE_URL}classifier/species.json`

// Photo preparation: must match what the model's authors used (torchvision):
// shorter side resized to 256 px, centre 224 × 224 crop, ImageNet colour normalisation.
const RESIZE_SHORT_SIDE = 256
const INPUT_SIZE = 224
const MEAN = [0.485, 0.456, 0.406]
const STD = [0.229, 0.224, 0.225]

// Photos bigger than this are first scaled down by the browser, to limit memory use.
const MAX_PIXELS = 24_000_000

let identifierPromise = null

// Loads the runtime, the model (about 47 MB) and the species list once, then reuses them.
// onStatus (optional) is told about progress: see identifyBird().
function loadIdentifier(onStatus) {
  if (!identifierPromise) {
    identifierPromise = (async () => {
      // Imported only when needed, so other screens stay light.
      const ort = await import('onnxruntime-web/wasm')
      ort.env.wasm.wasmPaths = { wasm: wasmUrl }
      // Several threads need special server headers ("cross-origin isolation"); otherwise use one.
      ort.env.wasm.numThreads = globalThis.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1

      const [modelBytes, species] = await Promise.all([
        downloadWithProgress(MODEL_URL, onStatus),
        fetch(SPECIES_URL).then((response) => {
          if (!response.ok) throw new Error(`Could not load the species list (HTTP ${response.status}).`)
          return response.json()
        }),
      ])
      onStatus?.({ stage: 'starting' })
      const session = await ort.InferenceSession.create(modelBytes, { executionProviders: ['wasm'] })
      return { ort, session, species }
    })().catch((error) => {
      identifierPromise = null // allow a retry
      throw error
    })
  }
  return identifierPromise
}

async function downloadWithProgress(url, onStatus) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not download the bird identifier (HTTP ${response.status}).`)
  if (!onStatus || !response.body) return new Uint8Array(await response.arrayBuffer())

  const total = Number(response.headers.get('Content-Length')) || 0
  const reader = response.body.getReader()
  const chunks = []
  let received = 0
  let reportedMegabytes = -1
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    // Report each whole megabyte, not every small chunk.
    const megabytes = Math.floor(received / 1e6)
    if (megabytes !== reportedMegabytes) {
      reportedMegabytes = megabytes
      onStatus({ stage: 'downloading', received, total })
    }
  }
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

// Python's round() rounds halves to the nearest even number (2.5 -> 2); torchvision uses it for cropping.
function roundHalfToEven(x) {
  const floor = Math.floor(x)
  if (x - floor === 0.5) return floor % 2 === 0 ? floor : floor + 1
  return Math.round(x)
}

async function decodePhoto(file) {
  try {
    // Apply the photo's rotation information (EXIF), as photo apps do.
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return createImageBitmap(file) // browsers that don't know that option
  }
}

// Reads the photo's pixels at full size (RGBA), via a canvas.
function readPixels(bitmap) {
  let { width, height } = bitmap
  // Very large photos: let the browser scale them down first, to limit memory use.
  if (width * height > MAX_PIXELS) {
    const factor = Math.sqrt(MAX_PIXELS / (width * height))
    width = Math.floor(width * factor)
    height = Math.floor(height * factor)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(bitmap, 0, 0, width, height)
  return { pixels: context.getImageData(0, 0, width, height).data, width, height }
}

// Turns a photo into the model's input: 1 × 3 × 224 × 224 numbers.
async function photoToTensor(ort, file) {
  const bitmap = await decodePhoto(file)
  let photo
  try {
    photo = readPixels(bitmap)
  } finally {
    bitmap.close()
  }
  const { pixels, width, height } = photo

  // Shorter side to 256 px; the longer side keeps the proportions (rounded down, like torchvision).
  const [resizedWidth, resizedHeight] =
    width <= height
      ? [RESIZE_SHORT_SIDE, Math.floor((RESIZE_SHORT_SIDE * height) / width)]
      : [Math.floor((RESIZE_SHORT_SIDE * width) / height), RESIZE_SHORT_SIDE]
  const resized = resizeLikePillow(pixels, width, height, resizedWidth, resizedHeight) // RGB

  // Centre crop: the model only sees this middle square.
  const left = roundHalfToEven((resizedWidth - INPUT_SIZE) / 2)
  const top = roundHalfToEven((resizedHeight - INPUT_SIZE) / 2)

  const pixelCount = INPUT_SIZE * INPUT_SIZE
  const input = new Float32Array(3 * pixelCount)
  for (let y = 0; y < INPUT_SIZE; y++) {
    for (let x = 0; x < INPUT_SIZE; x++) {
      const source = ((top + y) * resizedWidth + (left + x)) * 3
      const target = y * INPUT_SIZE + x
      for (let channel = 0; channel < 3; channel++) {
        input[channel * pixelCount + target] = (resized[source + channel] / 255 - MEAN[channel]) / STD[channel]
      }
    }
  }
  return new ort.Tensor('float32', input, [1, 3, INPUT_SIZE, INPUT_SIZE])
}

// Turns the model's raw scores into confidences that add up to 1 (softmax).
function softmax(scores) {
  const max = Math.max(...scores)
  const exps = scores.map((score) => Math.exp(score - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((value) => value / sum)
}

function speciesFrom(entry) {
  return {
    id: entry.id,
    commonName: entry.commonName ?? entry.scientificName,
    scientificName: entry.scientificName,
    chineseName: entry.chineseName,
    inTripPlanner: entry.inTripPlanner,
  }
}

// imageFile: a File from an <input type="file">.
// options.onStatus (optional): called with what's happening, for a progress message:
//   { stage: 'downloading', received, total }  first use only (bytes of the model)
//   { stage: 'starting' }                      first use only (preparing the model)
//   { stage: 'identifying' }
// Returns { isMock, speciesCount, matches: [{ rank, species, confidence }] }
//   confidence: the model's softmax score, 0 to 1 (not a measure of accuracy).
export async function identifyBird(imageFile, { onStatus } = {}) {
  const { ort, session, species } = await loadIdentifier(onStatus)
  onStatus?.({ stage: 'identifying' })
  // The model runs on the main thread, so let the browser show the message first.
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))
  const input = await photoToTensor(ort, imageFile)
  const output = await session.run({ image: input })
  const confidences = softmax(Array.from(output.logits.data))

  // The model has 384 outputs but only 373 species; the extra outputs are unused, so skip them.
  const top3 = species
    .map((_, index) => index)
    .sort((a, b) => confidences[b] - confidences[a])
    .slice(0, 3)

  return {
    isMock: false,
    speciesCount: species.length,
    matches: top3.map((index, position) => ({
      rank: position + 1,
      species: speciesFrom(species[index]),
      confidence: confidences[index],
    })),
  }
}
