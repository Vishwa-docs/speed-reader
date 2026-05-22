# Security Policy

## Reporting a vulnerability

If you've found a security issue, please **open a GitHub issue** with the label `security` and a brief description. Avoid posting exploit details in the public issue — write "details available on request" and a maintainer will follow up.

Because the app is a static, local-first browser bundle with no backend and no user accounts, the realistic threat surface is:

- XSS via crafted input (txt / PDF content rendered into the DOM)
- Vulnerabilities in `pdfjs-dist`, `react`, or `react-dom`
- Issues in the dev-server / build toolchain affecting contributors

## Supported versions

Only the latest release on `main` receives fixes.
