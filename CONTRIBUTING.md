# Contributing

Thanks for considering a contribution. The project is small and aims to stay that way.

## Dev setup

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # run the vitest suite once
npm run test:watch
npm run typecheck
npm run build     # tsc -b && vite build
```

Node 20+ is recommended.

## Code style

- TypeScript strict mode is on; no `any` without a clear reason.
- React function components + hooks only.
- No new runtime dependencies without discussion in an issue first. The runtime today is `react`, `react-dom`, and `pdfjs-dist` — anything beyond that is a meaningful surface-area increase.
- Tests live next to the code they exercise (`foo.ts` ↔ `foo.test.ts`).
- Keep files small. If a module is doing two unrelated things, split it.

## PR guidance

1. Open an issue first for anything non-trivial so the design can be discussed before code is written.
2. One logical change per PR.
3. Run `npm test` and `npm run build` locally before pushing.
4. Describe the user-visible behaviour change in the PR body, not just the implementation.

## What we tend to say no to

- Telemetry or analytics of any kind.
- Required account / login flows.
- Network calls that send user document content anywhere.
- Heavy UI dependencies (component libraries, animation runtimes) — the app stays small and dependency-light on purpose.
