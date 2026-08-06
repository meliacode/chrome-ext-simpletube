# SimpleTube agent instructions

## Project

- SimpleTube is a plain-JavaScript Chrome extension using Manifest V3.
- It filters YouTube videos and sections and organizes subscriptions into user-defined categories.
- The extension is local-only: it has no backend, analytics, telemetry, or external API integration.
- Files under `src/` are loaded directly by Chrome; there is no compilation step.

## Repository layout

- `src/manifest.json`: MV3 permissions, service worker, options page, and YouTube content-script registration.
- `src/background.js`: storage defaults and install/update behavior.
- `src/options.html`, `src/options.js`, `src/options.css`, `src/styles.css`: settings and category management.
- `src/content.js`, `src/content.css`: watched, Shorts, expandable-section, duration, and view-count filters.
- `src/contentCategorize.js`, `src/contentCategorize.css`: subscription assignment and category filters.
- `README.md`, `CHANGELOG.md`, and `PUBLISHING.md`: behavior, release history, and packaging procedure.

## Development workflow

- Install locked dependencies with `npm ci`.
- Run all static checks with `npm run lint`.
- Apply configured ESLint and Prettier fixes with `npm run lint:fix` when appropriate.
- Use `node --check src/<file>.js` for a focused JavaScript syntax check.
- Load `src/` as an unpacked extension from `chrome://extensions/`; reload the extension and refresh YouTube after changes.
- Build a store archive with `npm run package` only when packaging or release verification is relevant.

## Chrome extension guardrails

- Keep the extension on Manifest V3.
- Ask before adding or broadening `permissions`, `host_permissions`, or content-script match patterns.
- Preserve the Content Security Policy; do not add remote executable code, `eval`, or equivalent mechanisms.
- Do not add network calls, analytics, telemetry, or collection of browsing data unless explicitly requested.
- Treat the background service worker as ephemeral; persist required state in Chrome storage rather than globals.
- Keep injected DOM and CSS names narrowly scoped to avoid collisions with the host page.
- Do not edit generated archives or `src/simpletube-src.crx` unless the task is specifically about a release artifact.

## Application rules

- Use `chrome.storage.sync` and keep storage keys and defaults aligned across `background.js`, `options.js`, and both content scripts.
- Do not reset existing users' settings during extension updates.
- Prefer CSS class toggles over inline visual styles; retain the existing `sptcl-`, `sptcl-js-`, and `sptid-` prefixes.
- Treat YouTube as a single-page application. Make repeated rendering idempotent and avoid duplicate controls or stale classes.
- Preserve the debounced `MutationObserver` approach; do not reintroduce interval polling.
- Scope selectors carefully and safely no-op when YouTube markup does not contain an expected element.
- Normalize channel identifiers consistently before category assignment lookup.
- When adding an option, update its install default, options control and persistence, content behavior, and related CSS together.
- When adding a range filter, validate the range and clear the opposite fade/hide class on every run.

## Validation and release hygiene

- Run `npm run lint` after code or documentation changes covered by the formatter.
- Manually test the affected YouTube surfaces, SPA navigation, dynamic content injection, option persistence, and absence of duplicate UI.
- For category changes, test both the subscriptions page and the channels management page.
- For releases, keep `package.json` and `src/manifest.json` on the same semantic version and update `CHANGELOG.md`.
- The package must contain the contents of `src/`, not a parent `src` directory.
- Keep changes focused and avoid unrelated refactors.
