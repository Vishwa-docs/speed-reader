# Future Plans

This file tracks ideas for work that should happen after the current V1 release. Nothing below is implemented yet.

## Product Direction

- Add persistent storage for reading progress, highlights, playback speed, and focus-audio preferences so sessions survive refreshes and browser restarts.
- Create a small local library view for stored books and documents, including recent items, last-opened position, and quick resume.
- Support richer import flows for longer reading sessions, such as multiple documents per library, better metadata extraction, and duplicate detection.

## Reading Experience

- Add bookmarks with short notes so saved points can become study references instead of only location markers.
- Introduce session history and reading statistics like total minutes read, average speed, completion progress, and streaks.
- Offer alternate pacing modes for different material, including comprehension mode, exam-prep mode, and chapter review mode.
- Add a clean chapter navigator for PDFs and structured documents so readers can jump without losing their place.

## Document Intelligence

- Improve PDF understanding with stronger heading detection, caption grouping, footnote handling, and smarter filtering of non-reading artifacts.
- Add OCR support for scanned PDFs and image-heavy documents so more books can be imported successfully.
- Preserve useful figure and diagram references by surfacing nearby explanatory text when visual content is skipped.

## Storage And Sync

- Move from basic browser-only persistence to a more robust local database layer for larger libraries and long-term saved highlights.
- Add export and import for highlights, bookmarks, and reading history so users can back up or move their data.
- Explore optional account-based sync in a future version, but keep the local-first mode intact as the default.

## Audio And Focus

- Expand focus audio with more stations, ambient loops, and optional offline sound packs.
- Add per-document audio settings so a user can keep different focus presets for different kinds of reading.
- Consider a lightweight focus timer with break intervals for longer study sessions.

## Platform And Polish

- Package the app as a desktop-friendly offline experience with better local file handling and persistent storage guarantees.
- Add a first-run guide that explains ORP/pivot reading, hotkeys, and how to use highlights without breaking flow.
- Add accessibility refinements such as stronger keyboard navigation, adjustable contrast, larger control targets, and screen-size-aware layouts.
