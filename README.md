# BirdQuest

A university-project prototype that helps Hong Kong birdwatchers plan trips, identify birds from photographs, and learn about species.

> **Prototype status:** the **Plan a trip** screen uses our trained bird occurrence model (see [docs/model/](docs/model/)). **Identify** and the **Assistant** still show mock (sample) data. Predictions are estimates, not guarantees.

The full project brief is in [docs/project_brief.md](docs/project_brief.md).

---

## What you need

- **Node.js 20.19 or newer** (or 22.12+). Check with:

  ```bash
  node --version
  ```

  If it's older, install the **LTS** version from <https://nodejs.org> (macOS Installer, .pkg).
- npm, which is installed together with Node.js.

## First-time setup

Open a terminal in this folder (`birdquest/`), then install the packages:

```bash
npm install
```

This creates a `node_modules/` folder. Git ignores it, and you can always rebuild it with `npm install`.

## Preview the website (development mode)

```bash
npm run dev
```

The terminal will print a local address, usually <http://localhost:5173/>. Open it in your browser.

- The page reloads automatically when you save a file in `src/`.
- To see the phone layout, open your browser's developer tools and turn on the device toolbar, or just make the window narrow.
- To stop the server, click in the terminal and press **Ctrl + C**.

### Preview on your phone (optional)

If your phone and computer are on the same Wi-Fi:

```bash
npm run dev -- --host
```

Then open the **Network** address it prints (e.g. `http://192.168.x.x:5173/`) on your phone. Anyone on the same network can open it while it runs, so stop it when you're done.

## Checks

| Command | What it does |
|---|---|
| `npm run lint` | Checks the code for common mistakes (uses [oxlint](https://oxc.rs/docs/guide/usage/linter.html)). |
| `npm run build` | Builds the final website into `dist/`. If this fails, something is broken. |
| `npm run check` | Runs both of the above. Run it before you share or commit changes. |

To try the built version (the same files you would eventually host):

```bash
npm run build
```

```bash
npm run preview
```

Then open <http://localhost:4173/>.

## Project structure

```
birdquest/
├── docs/                  Project documents that are safe to share (brief, notes)
│   └── model/             The prediction model's evaluation report and hand-over notes
├── private/               Ignored by Git: personal documents, IDs, etc.
├── public/                Static files copied as-is (favicon)
│   └── model/             The prediction model, made by scripts/prepare-model.mjs
├── scripts/
│   ├── prepare-model.mjs  Prepares a new model file for the website (removes private locations)
│   └── weather-effects.mjs  Measures how much each weather input changes predictions
├── index.html             The HTML page Vite serves
└── src/
    ├── main.jsx           Starts React
    ├── App.jsx            Navigation shell; holds state shared between screens
    ├── navigation.js      List of screens and the hash-based navigation
    ├── styles.css         All styles (mobile-first)
    ├── screens/           One component per page
    ├── components/        Pieces reused across screens
    ├── mock-data/         Sample data, clearly marked as mock
    ├── services/          The only code screens use to get data
    └── vendor/            Code copied in unchanged (the model's predictor)
```

### How data flows

```
screen  ──calls──▶  service  ──reads──▶  mock-data   (today)
                              ──calls──▶  real model / API  (later)
```

Screens never import from `mock-data/` directly. Each service returns an object with `isMock: true` while it uses sample data. The trip planner service already uses the real model, so it returns `isMock: false`. To connect something real later (for example the Teachable Machine classifier in `services/identificationService.js`), change only the inside of that service, keep its return shape, and set `isMock: false`.

### Navigation

The site uses the end of the address for navigation: `#/`, `#/plan`, `#/identify`, `#/assistant`. The browser back button works and no extra library is needed. The screen list lives in `src/navigation.js`.

## The prediction model (Plan a trip)

The **Plan a trip** screen answers two questions with the BirdQuest occurrence model:

- **What can I see?** Choose a place, date and time (and optionally a target bird). You get the most likely birds, each with its chance of being recorded, plus other hotspots at the same time.
- **Where can I see it?** Choose a bird and up to 7 days. You get the best places and 2-hour visit times.

How it works:

- The model runs **in the browser**. About 850 KB loads the first time you open Plan a trip, and nothing is uploaded.
- It covers 60 common species and 98 public eBird hotspots, trained on complete eBird checklists from Hong Kong (October 2025 to September 2026). Data: eBird, Cornell Lab of Ornithology.
- Tides aren't included, and there's only one year of data. See [docs/model/evaluation-report.md](docs/model/evaluation-report.md) for the full evaluation (in Chinese).

### Live weather forecasts (off)

Without forecasts, the model uses typical weather for the month, and every prediction's reliability is one level lower. To use real forecasts, set `USE_LIVE_WEATHER = true` in `src/services/tripPlannerService.js`. The browser will then contact [Open-Meteo](https://open-meteo.com/), an external weather service that's free and needs no key. If you do, add an Open-Meteo credit to the site, because their data licence requires it.

### Setting the weather yourself (for demonstrations)

Both questions have a **Weather** section. Leave it on **Typical for the month**, or choose **Set it myself (demo)** to adjust the 10 weather inputs the model uses: temperature, wind direction, wind speed, sunshine, humidity, temperature change since yesterday, cloud cover, pressure change since yesterday, and rain over 3 days and today. Quick settings fill in *Sunny*, *Rainy* or *Cold northerly winds* on top of the month's typical weather.

The controls are listed from biggest to smallest effect on the predictions. See [docs/model/weather-effects.md](docs/model/weather-effects.md) for the measurements and some good examples to demonstrate. Results with chosen weather are a what-if, not a forecast, and the site says so.

### Updating the model after retraining

The original model file also contains 19 private eBird locations (people's homes and balconies), so **never copy it straight into `public/`**. Run the preparation script instead. It removes them and checks that nothing private is left:

```bash
node scripts/prepare-model.mjs path/to/new/birdquest_model.json
```

If the predictor code changed too, replace `src/vendor/birdquest-predictor.js` with the new version and keep the comment at the top. Then re-measure the weather effects and update `docs/model/weather-effects.md` (and, if the order changed, the order of `WEATHER_CONTROLS` in `src/services/tripPlannerService.js`):

```bash
node scripts/weather-effects.mjs
```

## Not included yet

- The photo classifier (Teachable Machine) and the assistant aren't connected
- Live weather forecasts are off (see above)
- No login, payments or database
- Not deployed anywhere

## Git

This folder is a Git repository on the `main` branch. `.gitignore` keeps `node_modules/`, `dist/`, `.env` files, keys, `private/`, logs, `.DS_Store` and Claude Code's personal settings out of Git.

### One-time setup: your name and email

Git stamps every commit with a name and an email, and anyone who can see the repository can read them. If you'll put this project on GitHub, consider using GitHub's private "noreply" email (GitHub → Settings → Emails) instead of your personal one.

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Saving your work (a commit)

```bash
git status
```

Check the list first: nothing from `private/`, no `.env` files and no personal information should appear. Then:

```bash
git add .
git commit -m "Describe what you changed"
```
