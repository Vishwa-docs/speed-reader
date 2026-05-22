# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 1.1.0 — Quality-of-life features

- **Auto-resume**: re-opening the same document picks up at your last position (per-document, stored in `localStorage`).
- **Export highlights to Markdown**: one-click `.md` download from the highlights panel, sorted by position with context.
- **In-app help overlay**: press `?` for an ORP primer and the full hotkey cheat-sheet.

## 1.0.0 — Initial public release

- Browser-based ORP / pivot speed reader for `.txt` and PDF files
- 150–1200 WPM with presets and structural-pause weighting
- Highlights and bookmarks with surrounding context (IndexedDB + localStorage fallback)
- Optional SomaFM focus-audio panel (Groove Salad, Groove Salad Classic, Drone Zone)
- Keyboard-first controls (Space, ←/→, H, B, M, Esc)
- macOS `Launch Speed Reader.command` double-click launcher
- Multi-stage Dockerfile (Vite build → nginx:alpine)
- GitHub Actions CI + automatic GitHub Pages deploy
- MIT licensed
