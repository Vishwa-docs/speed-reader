# Speed Reader

A keyboard-driven, local-first speed reader for `.txt` and PDF files. Words flash one at a time with a coloured pivot letter, so your eyes stay still and your brain does the moving.

**[Try the live demo →](https://vishwa-docs.github.io/speed-reader/)** *(enable GitHub Pages in repo settings once after first push)*

---
# Demo


https://github.com/user-attachments/assets/7c241703-e1a1-4801-9e4d-6cd33e03210a



---

## What it is

Traditional reading moves your eyes left-to-right across a line. Rapid Serial Visual Presentation (RSVP) flips that: the words come to you, one at a time, fixed in place. Each word is also aligned around an **Optimal Recognition Point** — the single letter your eye naturally fixates on — drawn in a different colour. Combined, you can comfortably read at 400–800 WPM with practice.

Speed Reader is a small single-page app that does this in your browser. Drop in a text file or a PDF, pick a speed, hit space. Everything stays local: there is no account, no server, no upload.

## Features

- Reads `.txt` files and text-based PDFs (extraction via `pdfjs-dist`)
- Adjustable speed: 150–1200 WPM, with one-tap presets at 300 / 500 / 700 / 900
- Structural pauses on punctuation, paragraph breaks, and headings so meaning still lands
- Highlights & bookmarks with surrounding context, stored in IndexedDB
- **Export highlights to Markdown** — one click, lives next to your notes
- **Auto-resume** — re-open the same file and pick up where you left off
- **In-app help** — press `?` for the hotkey cheat-sheet and a primer on ORP
- Optional focus audio: three ambient stations streamed from [SomaFM](https://somafm.com/)
- Keyboard-first; the mouse is optional
- Local-only — no telemetry, no accounts, no upload of your documents

## Hotkeys

| Key | Action |
|-----|--------|
| `Space` | Play / pause |
| `←` / `→` | Step backward / forward |
| `H` | Highlight current position |
| `B` | Toggle highlights panel |
| `M` | Toggle focus-audio panel |
| `?` | Open help / hotkey cheat-sheet |
| `Esc` | Close any open panel |

## Quick start

### Hosted demo
Just open the [live demo](https://vishwa-docs.github.io/speed-reader/). Drop in a file. Done.

### Run locally (Node 20+)
```bash
git clone https://github.com/Vishwa-docs/speed-reader.git
cd speed-reader
npm install
npm run dev
# open http://localhost:5173
```

### Run with Docker
```bash
docker build -t speed-reader .
docker run --rm -p 8080:80 speed-reader
# open http://localhost:8080
```

The image is a tiny multi-stage build: Vite builds the bundle, then nginx (Alpine) serves the static output. Final image is ~50 MB.

### macOS double-click launcher
On a Mac, `Launch Speed Reader.command` will `npm install` if needed and start the dev server on `http://127.0.0.1:3000`. You may need to right-click → Open the first time so Gatekeeper allows it.

## How it works

- **`src/lib/readerCore.ts`** — turns text into a stream of tokens, computes per-token pause multipliers (commas, sentence ends, paragraph breaks), and picks the ORP pivot letter.
- **`src/lib/fileParser.ts`** — extracts text from `.txt` and PDF inputs and infers structure (headings, paragraphs).
- **`src/lib/highlightsDb.ts`** — IndexedDB wrapper with a `localStorage` fallback, so highlights survive across sessions even in restricted browsers.
- **`src/components/ReaderLane.tsx`** — the fixed-pivot display surface.

## Privacy

Your documents never leave the browser. The app does not talk to any backend. The only outbound network request the app *can* make is to SomaFM's public stream URLs, and only if you turn focus audio on.

## Roadmap

See [`FUTURE_PLANS.md`](./FUTURE_PLANS.md). Notable items on deck:

- E-reader / Apple Books / Kindle integration for syncing reading position and highlights
- Lightweight book-tracking (currently progress lives in IndexedDB; long-term reading lists / progress will move toward a structured local store)
- OCR for scanned PDFs
- Optional export/import of highlights so you can back them up as text

## Contributing

PRs welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md). The codebase is small, strict TypeScript, and runs `vitest` for tests.

## Publishing checklist (for first-time deployers)

1. Push to `main`. CI runs typecheck + tests + build.
2. In your repo: **Settings → Pages → Source → GitHub Actions**. The included `deploy.yml` will publish on every push to `main`.
3. The published URL is `https://<owner>.github.io/speed-reader/`. The build automatically rewrites asset paths using the repo name.

## License

[MIT](./LICENSE) © Speed Reader Contributors
