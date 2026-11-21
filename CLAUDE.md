# CLAUDE.md: BirdQuest

Guidance for Claude (and any other contributor) working in this repository.

## Project goals

BirdQuest is a university-project prototype for Hong Kong birdwatchers. Full brief: `docs/project_brief.md`.

Three features:
1. **Trip planning**: inputs are location, date, time range and an optional target species. Outputs are ranked species, suggested observation spots, and clearly explained scores or confidence indicators. **Built with the real BirdQuest occurrence model** (`docs/model/`). It answers "What can I see?" (place + time → birds) and "Where can I see it?" (bird + dates → places and times).
2. **Bird identification**: upload and preview a photo, then show ranked species matches. The Teachable Machine image classifier will be connected later.
3. **Bird assistant**: answers questions about species, habitats, behaviour, seasonal occurrence and conservation. It can be asked about a species selected on another screen.

**Current milestone:** a working, mobile-responsive interface with clearly labelled mock data and replaceable services. Trip planning uses the real model; identification and the assistant are still mock.

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
- No personal information or student IDs anywhere in the repo. Those go in `private/`, which Git ignores and code must never import.
- Don't connect external APIs or deploy anything unless the owner asks.

## The owner is a beginner

- Explain changes in plain language and say which files changed.
- Prefer simple, readable code over clever code. Add short comments where the *why* isn't obvious.
- Ask before adding any npm dependency. Current dependencies: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `oxlint`. Nothing else.

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
npm run build      # production build into dist/
npm run check      # lint + build: run this before saying work is finished
npm run preview    # serve the built dist/ at http://localhost:4173
```

## Environment notes

- Node.js 20.19+ is required (the owner's machine has v26).
- Git is installed; the repo is on branch `main`. Only commit when the owner asks. Before any commit, run `git status` and confirm nothing from `private/`, no `.env` files and no personal information is included.
- The disk is nearly full, so avoid adding large files or dependencies.
- The model only covers 60 species and 98 hotspots, and has no tide data. In the browser, a 7-day "Where can I see it?" search takes about 1 second; keep `MAX_SEARCH_DAYS` at 7 unless the calculation moves off the main thread.
