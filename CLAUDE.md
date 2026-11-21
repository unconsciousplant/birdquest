# CLAUDE.md: BirdQuest

Guidance for Claude (and any other contributor) working in this repository.

## Project goals

BirdQuest is a university-project prototype for Hong Kong birdwatchers. Full brief: `docs/project_brief.md`.

Three features:
1. **Trip planning**: inputs are location, date, time range and an optional target species. Outputs are ranked species, suggested observation spots, and clearly explained scores or confidence indicators. **Built with the real BirdQuest occurrence model** (`docs/model/`). It answers "What can I see?" (place + time → birds) and "Where can I see it?" (bird + dates → places and times).
2. **Bird identification**: upload and preview a photo, then show ranked species matches. **Built with the open-source Bird-Classification model** (Zhang Jun, MIT licence; `docs/classifier/`): 373 common species in China, top 3 matches, running in the browser with `onnxruntime-web`. This replaced the brief's original Teachable Machine plan, and the service interface stays swappable.
3. **Bird assistant**: answers questions about species, habitats, behaviour, seasonal occurrence and conservation. It can be asked about a species selected on another screen. **Built as a rule-based chatbot** (`docs/assistant/`): 61 species (the trip planner's 60 plus the Black-faced Spoonbill), with keyword intents and English, Latin and Chinese names.

**Current milestone:** a working, mobile-responsive interface with replaceable services. All three features use real data; only the Home screen's "Sample species" list is mock.

## Hard rules (from the brief)

- No login, payments or database.
- **Never invent model accuracy or performance claims.** Mock results use `score: null` / `confidence: null`, never made-up numbers.
- **Never present mock outputs as real predictions.** Any screen that shows service output must show `<MockDataNotice />` while `isMock` is true.
- No API keys or secrets in frontend code. Everything in `src/` ends up public in the browser.
- **Photos stay in the browser.** The Identify screen previews photos with a temporary in-browser address (`URL.createObjectURL`). Don't upload photos anywhere without asking the owner first.
- Show every 0–1 score, chance or confidence with `<ConfidenceIndicator />` (set its `label`, e.g. "Chance of recording"), along with a plain explanation of what the number means (it is not accuracy). Model predictions use `<PredictionCard />`, which adds likely/possible/unlikely and reliability; `<PredictionGuide />` explains them.
- **The model file is public.** Anything in `public/` can be downloaded by anyone. The hand-over `birdquest_model.json` contains 19 private eBird locations (homes, balconies, exact coordinates), so never copy it into `public/` directly. Always run `node scripts/prepare-model.mjs <file>`, which removes them and refuses to write if any remain.
- **Live weather is off.** `USE_LIVE_WEATHER` in `src/services/tripPlannerService.js` controls calls to Open-Meteo (an external API). Only turn it on if the owner asks, and then add an Open-Meteo credit to the site.
- **Chosen weather is a what-if.** The weather picker (`<WeatherPicker />`, "Set it myself (demo)") feeds the model's 10 weather inputs. Results must say they're a what-if, not a forecast, and they keep the one-level reliability reduction (`lead_days: 99` in `toModelWeather`). `WEATHER_CONTROLS` is ordered by measured effect (`scripts/weather-effects.mjs` → `docs/model/weather-effects.md`), and its ranges stay within about 3 SD of the training data. Don't widen them without re-checking.
- **The photo identifier must stay faithful to its source.**
  - Keep `public/classifier/LICENSE.txt` and the on-page credit (MIT licence requirement).
  - Photos must be prepared exactly as in training: `photoResize.js` reproduces Pillow's resizing byte for byte. Never swap it for canvas resizing, which shifted confidences by up to 7.6 points in testing.
  - `species.json` is in the model's output order (alphabetical scientific names); never re-sort or filter it.
  - Only quote accuracy as the authors' own figures (62% top-1 and 75% top-3 on their test photos), never as BirdQuest's.
  - The runtime's `.wasm` must load from this site (`wasmPaths`), never a CDN.
- **The assistant must never make up facts.**
  - Seasons, best places and IUCN status come only from `src/knowledge/speciesData.json` (built by `scripts/build-assistant-data.mjs`).
  - Hand-written text in `src/knowledge/speciesText.js` stays short and limited to well-established facts, with seasonal and status claims left to the data. Threatened statuses were checked against BirdLife; recheck any status before changing it.
  - For birds it doesn't cover, it must say: "This chatbot currently only supports N species of bird, and we expect to expand in the near future." Use the real count (`assistant.count`), never a hard-coded number.
  - Run `npm test` after changing its rules or knowledge.
- No personal information or student IDs anywhere in the repo. Those go in `private/`, which Git ignores and code must never import. **One exception:** team members' names, on the Q&A page (`src/content/team.js`), shown only with each person's agreement. Never add student IDs, emails, phone numbers or other contact details.
- Don't connect external APIs or deploy anything unless the owner asks.

## The owner is a beginner

- Explain changes in plain language and say which files changed.
- Prefer simple, readable code over clever code. Add short comments where the *why* isn't obvious.
- Ask before adding any npm dependency. Current dependencies: `react`, `react-dom`, `onnxruntime-web` (runs the photo identifier), `vite`, `@vitejs/plugin-react`, `oxlint`. Nothing else.

## Architecture

| Folder | Holds | Rules |
|---|---|---|
| `src/screens/` | One component per page (`XxxScreen.jsx`) | Get data only via `services/`. |
| `src/components/` | Reusable UI pieces | No data fetching; receive data via props. |
| `src/mock-data/` | Sample data | Each file starts with a MOCK DATA header. Only services import it. |
| `src/services/` | `xxxService.js` | `async` functions; return plain objects that include `isMock`. Turn technical model output into plain English here. |
| `src/vendor/` | Code copied in from elsewhere (`birdquest-predictor.js`) | Don't edit by hand; replace the whole file from a new hand-over. Only services import it. |
| `public/model/` | The website copy of the prediction model | Made only by `scripts/prepare-model.mjs`. |
| `docs/model/` | Model evaluation report and hand-over notes (Chinese) | Reference for what the model can and can't do. |
| `public/classifier/` | Photo identifier: ONNX model, `species.json`, MIT `LICENSE.txt` | Made by `scripts/convert-classifier.py` and `scripts/build-classifier-species.mjs`; see `docs/classifier/README.md`. |
| `src/knowledge/` | The assistant's facts: `speciesData.json` (generated) and `speciesText.js` (hand-written) | Only `assistantService.js` loads them. See `docs/assistant/README.md`. |
| `src/content/team.js` | Team name and members, shown on the Q&A page | Names only (see the personal-information rule above). |
| `src/screens/QAScreen.jsx` | The Q&A page: how each part works, its limitations and key findings | Every figure comes from `docs/`; update the page when those documents change. |
| `src/services/assistantEngine.js` | The assistant's rules (pure logic, no fetching) | Tested by `scripts/test-assistant.mjs` (`npm test`). Add a test for every new rule. |
| `src/navigation.js` | Screen list + `useCurrentRoute()` | Add a screen here **and** in the `switch` in `App.jsx`. |
| `src/App.jsx` | Layout + state shared across screens | Shared state (e.g. `selectedSpecies`) lives here and is passed down as props. |

**Replacing a service:** keep the function name, arguments and return shape the same. Change only the inside, then set `isMock: false`. Screens shouldn't need to change.

## Coding conventions

- JavaScript (no TypeScript), ES modules, React function components and hooks.
- File names: components `PascalCase.jsx`; other modules `camelCase.js`; folders `kebab-case`.
- Include the `.jsx` / `.js` extension in imports.
- One component per file, exported as `export default function Name() {}`.
- Event-handler props are named `onSomething` (e.g. `onAskAboutSpecies`).
- Styling: plain CSS in `src/styles.css`, using the colour variables in `:root`. Mobile-first: base styles for phones, `@media (min-width: 720px)` for wider screens. Class names are lowercase-hyphenated.
- Accessibility basics: real `<button>` and `<a>` elements, labels on form inputs, visible focus outlines, `alt` text on images, tap targets at least 44px.
- Text style: sentence case for headings and buttons ("Plan a trip", not "Plan A Trip").

## Commands

```bash
npm install        # install packages
npm run dev        # dev server at http://localhost:5173
npm run lint       # oxlint
npm test           # the assistant's 50 sample questions
npm run build      # production build into dist/
npm run check      # lint + test + build: run this before saying work is finished
npm run preview    # serve the built dist/ at http://localhost:4173
```

## Environment notes

- Node.js 20.19+ is required (the owner's machine has v26).
- Git is installed; the repo is on branch `main`. Only commit when the owner asks. Before any commit, run `git status` and confirm nothing from `private/`, no `.env` files and no personal information is included.
- The disk is nearly full, so avoid adding large files or dependencies.
- The model only covers 60 species and 98 hotspots, and has no tide data. In the browser, a 7-day "Where can I see it?" search takes about 1 second; keep `MAX_SEARCH_DAYS` at 7 unless the calculation moves off the main thread.
- The photo identifier downloads about 60 MB on first use (47 MB model + 15 MB WebAssembly), then takes about 0.3 s per photo. Its runtime is loaded only from the identification service (dynamic import), so other screens stay light.
- Re-converting the identifier needs a temporary Python environment (PyTorch 2.2.2 is the last version for Intel Macs). Upgrade pip inside it first, or it tries to compile packages from source. Delete the environment afterwards, because the disk is tight.
