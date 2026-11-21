# CLAUDE.md: BirdQuest

Guidance for Claude (and any other contributor) working in this repository.

## Project goals

BirdQuest is a university-project prototype for Hong Kong birdwatchers. Full brief: `docs/project_brief.md`.

Three features:
1. **Trip planning**: inputs are location, date, time range and an optional target species. Outputs are ranked species, suggested observation spots, and clearly explained scores or confidence indicators.
2. **Bird identification**: upload and preview a photo, then show ranked species matches. The Teachable Machine image classifier will be connected later.
3. **Bird assistant**: answers questions about species, habitats, behaviour, seasonal occurrence and conservation. It can be asked about a species selected on another screen.

**Current milestone:** a working, mobile-responsive interface with clearly labelled mock data and replaceable services.

## Hard rules (from the brief)

- No login, payments or database.
- **Never invent model accuracy or performance claims.** Mock results use `score: null` / `confidence: null`, never made-up numbers.
- **Never present mock outputs as real predictions.** Any screen that shows service output must show `<MockDataNotice />` while `isMock` is true.
- No API keys or secrets in frontend code. Everything in `src/` ends up public in the browser.
- **Photos stay in the browser.** The Identify screen previews photos with a temporary in-browser address (`URL.createObjectURL`). Don't upload photos anywhere without asking the owner first.
- Show every score or confidence with `<ConfidenceIndicator />`, along with a plain explanation of what the number means (it is not accuracy).
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
| `src/services/` | `xxxService.js` | `async` functions; return plain objects that include `isMock`. |
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
