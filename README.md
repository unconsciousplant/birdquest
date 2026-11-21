# BirdQuest

A university-project prototype that helps Hong Kong birdwatchers plan trips, identify birds from photographs, and learn about species.

> **Prototype status:** everything the site shows is **mock (sample) data**. No model is connected yet, so nothing on the site is a real prediction.

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
├── private/               Ignored by Git: personal documents, IDs, etc.
├── public/                Static files copied as-is (favicon)
├── index.html             The HTML page Vite serves
└── src/
    ├── main.jsx           Starts React
    ├── App.jsx            Navigation shell; holds state shared between screens
    ├── navigation.js      List of screens and the hash-based navigation
    ├── styles.css         All styles (mobile-first)
    ├── screens/           One component per page
    ├── components/        Pieces reused across screens
    ├── mock-data/         Sample data, clearly marked as mock
    └── services/          The only code screens use to get data
```

### How data flows

```
screen  ──calls──▶  service  ──reads──▶  mock-data   (today)
                              ──calls──▶  real model / API  (later)
```

Screens never import from `mock-data/` directly. Each service returns an object with `isMock: true` while it uses sample data. To connect something real later (for example the Teachable Machine classifier in `services/identificationService.js`), change only the inside of that service, keep its return shape, and set `isMock: false`.

### Navigation

The site uses the end of the address for navigation: `#/`, `#/plan`, `#/identify`, `#/assistant`. The browser back button works and no extra library is needed. The screen list lives in `src/navigation.js`.

## Not included yet

- No external APIs, model or assistant connected
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
