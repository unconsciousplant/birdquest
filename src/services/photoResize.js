// ------------------------------------------------------------
// Photo resizing that matches Pillow (the Python imaging library):
// "bilinear" resampling with antialiasing, using Pillow's 8-bit
// fixed-point maths. Based on Pillow's src/libImaging/Resample.c.
//
// Why: the bird identifier was trained and tested on photos resized by
// Pillow (torchvision's Resize). The browser's own canvas resizing gives
// slightly different pixels, which moved the model's confidences by up to
// about 8 percentage points in testing. Used by identificationService.js.
// ------------------------------------------------------------

const PRECISION_BITS = 32 - 8 - 2 // 22, as in Pillow
const HALF = 1 << (PRECISION_BITS - 1) // for rounding
const MAX_SUM = 1 << (PRECISION_BITS + 8)

// The bilinear ("triangle") filter; it reaches 1 pixel either side.
function bilinearFilter(x) {
  const distance = Math.abs(x)
  return distance < 1 ? 1 - distance : 0
}

// For each output pixel along one axis: which input pixels it uses, and
// their weights as fixed-point integers (same steps as Pillow's precompute_coeffs).
function coefficients(inSize, outSize) {
  const scale = inSize / outSize
  const filterScale = Math.max(scale, 1) // widen the filter when shrinking (antialiasing)
  const support = 1 * filterScale
  const size = Math.ceil(support) * 2 + 1
  const inverseFilterScale = 1 / filterScale
  const bounds = new Int32Array(outSize * 2)
  const weights = new Int32Array(outSize * size)

  for (let out = 0; out < outSize; out++) {
    const center = (out + 0.5) * scale
    const first = Math.max(Math.trunc(center - support + 0.5), 0)
    const last = Math.min(Math.trunc(center + support + 0.5), inSize)
    const count = last - first

    const raw = new Float64Array(count)
    let total = 0
    for (let i = 0; i < count; i++) {
      raw[i] = bilinearFilter((i + first - center + 0.5) * inverseFilterScale)
      total += raw[i]
    }
    for (let i = 0; i < count; i++) {
      const weight = total !== 0 ? raw[i] / total : raw[i]
      // Pillow rounds weights to fixed point (away from zero).
      weights[out * size + i] =
        weight < 0 ? Math.trunc(-0.5 + weight * (1 << PRECISION_BITS)) : Math.trunc(0.5 + weight * (1 << PRECISION_BITS))
    }
    bounds[out * 2] = first
    bounds[out * 2 + 1] = count
  }
  return { bounds, weights, size }
}

// Fixed-point sum -> 0..255, as Pillow's clip8.
function clip8(sum) {
  if (sum >= MAX_SUM) return 255
  if (sum <= 0) return 0
  return sum >> PRECISION_BITS
}

// rgba: pixels from canvas getImageData (width × height × 4).
// Returns RGB pixels (outWidth × outHeight × 3), resized like
// Pillow's image.resize((outWidth, outHeight), Image.BILINEAR).
export function resizeLikePillow(rgba, width, height, outWidth, outHeight) {
  const horizontal = coefficients(width, outWidth)
  const vertical = coefficients(height, outHeight)

  // Pass 1: resize each row (width -> outWidth). Pillow keeps 8-bit values between passes.
  const rows = new Uint8Array(outWidth * height * 3)
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * 4
    for (let x = 0; x < outWidth; x++) {
      const first = horizontal.bounds[x * 2]
      const count = horizontal.bounds[x * 2 + 1]
      const k = x * horizontal.size
      let r = HALF
      let g = HALF
      let b = HALF
      for (let i = 0; i < count; i++) {
        const weight = horizontal.weights[k + i]
        const p = rowStart + (first + i) * 4
        r += rgba[p] * weight
        g += rgba[p + 1] * weight
        b += rgba[p + 2] * weight
      }
      const o = (y * outWidth + x) * 3
      rows[o] = clip8(r)
      rows[o + 1] = clip8(g)
      rows[o + 2] = clip8(b)
    }
  }

  // Pass 2: resize each column (height -> outHeight).
  const output = new Uint8Array(outWidth * outHeight * 3)
  for (let y = 0; y < outHeight; y++) {
    const first = vertical.bounds[y * 2]
    const count = vertical.bounds[y * 2 + 1]
    const k = y * vertical.size
    for (let x = 0; x < outWidth; x++) {
      let r = HALF
      let g = HALF
      let b = HALF
      for (let i = 0; i < count; i++) {
        const weight = vertical.weights[k + i]
        const p = ((first + i) * outWidth + x) * 3
        r += rows[p] * weight
        g += rows[p + 1] * weight
        b += rows[p + 2] * weight
      }
      const o = (y * outWidth + x) * 3
      output[o] = clip8(r)
      output[o + 1] = clip8(g)
      output[o + 2] = clip8(b)
    }
  }
  return output
}
