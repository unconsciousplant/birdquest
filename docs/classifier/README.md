# Bird identifier (Identify screen)

The **Identify** screen uses an image classifier from the open-source project **Bird-Classification** by Zhang Jun:

- Source: <https://github.com/Firefly-ZJ/Bird-Classification> (branch `main`, commit `6c09017`, 30 Oct 2025)
- Licence: **MIT**, Copyright (c) 2025 Zhang Jun. The licence text is in [`public/classifier/LICENSE.txt`](../../public/classifier/LICENSE.txt) and must stay with the model.
- Model: ConvNeXt-style network, "v1 base" (12 million parameters), **373 common bird species in China**, trained on about 220,000 iNaturalist photos (China, plus other Asian countries in 2024).

All 60 species in the trip planner are among the 373, as is the Black-faced Spoonbill.

## Files in this project

| File | What it is |
|---|---|
| `public/classifier/bird-classifier-v1base.onnx` | The model converted to ONNX so it runs in the browser (47.1 MB, SHA-256 `eb3a80d5…382c`) |
| `public/classifier/species.json` | The 373 species **in the model's output order**: scientific, English and Chinese names, iNaturalist taxon ID, whether the trip planner covers it |
| `public/classifier/LICENSE.txt` | The model's MIT licence |
| `src/services/identificationService.js` | Loads the model with `onnxruntime-web`, prepares the photo, returns the top 3 matches |
| `src/services/photoResize.js` | Resizes photos exactly as Pillow does (see "Photo preparation") |
| `scripts/convert-classifier.py` | Converts the PyTorch weights to ONNX and checks the result |
| `scripts/build-classifier-species.mjs` | Builds `species.json`, including English names |

## How it works

1. The first time someone identifies a photo, the browser downloads the model (47 MB) and the ONNX runtime's WebAssembly file (about 15 MB, 4 MB compressed). The browser keeps them for later visits.
2. The photo is prepared like the authors' code: shorter side resized to 256 px, centre 224 × 224 crop, ImageNet colour normalisation.
3. The model outputs 384 scores, which are turned into confidences (softmax). Only the first 373 outputs are species; the other 11 are unused and skipped.
4. The top 3 species are shown with their confidence.

Everything runs on the user's device. The photo is never uploaded, and no outside server is contacted.

### Photo preparation must match Pillow

The model was trained and tested on photos resized by Pillow (via torchvision). The browser's own canvas resizing produces slightly different pixels. In testing, that moved confidences by up to 7.6 percentage points and changed the third match on one photo. `photoResize.js` reproduces Pillow's bilinear resizing, including its fixed-point rounding. It was checked byte for byte against Pillow on 13 image and size combinations. **Don't replace it with canvas resizing.**

## Checks done (22 Nov 2026)

| Photo (from the repository) | True species (iNaturalist record) | PyTorch original | This website |
|---|---|---|---|
| Magpie (`Ps_245167185.png`) | Oriental Magpie *Pica serica* | Oriental Magpie 74.45%, Black-rumped Magpie 2.44%, Azure-winged Magpie 0.59% | 74.46%, 2.44%, 0.59% (same order) |
| Owl (`Bb_228195316.png`) | Eurasian Eagle-Owl *Bubo bubo* | **Long-eared Owl** 52.21%, Eurasian Eagle-Owl 7.68%, Short-eared Owl 2.49% | 52.21%, 7.68%, 2.48% (same order) |
| Dove (the README example) | Spotted Dove *Spilopelia chinensis* | Spotted Dove 91.44%, Dunlin 0.05%, Northern Shoveler 0.05% | 91.44%, 0.05%, 0.05% (same order) |

- PyTorch and the converted ONNX model differ by at most 0.0002 in raw scores, with identical top 3.
- The dove result matches the authors' own app (91.68% on the original photo, with the same second and third species), which confirms the species order.
- The owl is a real mistake by the model: the right species comes second. That's a useful honest example for demonstrations.

## Accuracy

The authors report, on their own test photos (20% of their iNaturalist dataset), **62.16% top-1** and **74.87% top-3** accuracy for this model. BirdQuest has **not** measured accuracy on Hong Kong photos, so the site only quotes these figures as the authors' own.

## Limitations

- It only knows these 373 species. For any other bird it still returns 3 matches, and they'll all be wrong.
- It only looks at the centre square of the photo.
- Confidence is the model's own score. It's not calibrated, and it's not a measure of accuracy.
- Chinese names are **simplified** characters (mainland usage), as in the source list. Hong Kong names in traditional characters sometimes differ.
- English names come from iNaturalist, except for the 60 trip-planner species, which use the planner's names. They may differ from other naming systems (Clements, IOC or the Hong Kong Bird Watching Society list).
- The training photos come from iNaturalist under various Creative Commons licences, some non-commercial. That's fine for a university project, but check before any commercial use.

## Updating or redoing the conversion

1. Download `species_list.csv`, `_BirdNet.py` and `trained/model_v1base.pth` from the repository. The `.pth` file is stored with Git LFS: download it from `https://media.githubusercontent.com/media/Firefly-ZJ/Bird-Classification/main/trained/model_v1base.pth` and check its SHA-256 against the repository's LFS pointer.
2. Make a temporary Python environment with `torch`, `numpy`, `pillow`, `onnx` and `onnxruntime`. On this Intel Mac with Python 3.9 we used torch 2.2.2, numpy 1.26.4, pillow 11.0.0, onnx 1.17.0 and onnxruntime 1.16.3. Upgrade pip inside the environment first: the old pip that comes with Python 3.9.0 can't see packages built for newer macOS and tries to compile them from source.
3. Convert and check:

   ```bash
   python scripts/convert-classifier.py --repo path/to/Bird-Classification --weights path/to/model_v1base.pth --out public/classifier/bird-classifier-v1base.onnx --check photo1.png photo2.png
   ```

4. Rebuild the species list (needs internet; contacts iNaturalist once):

   ```bash
   node scripts/build-classifier-species.mjs path/to/species_list.csv
   ```

5. Run `npm run check`, then identify the repository's sample photos on the site and compare with the table above.
