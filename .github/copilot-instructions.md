# Copilot instructions for SimpleTube (Chrome extension)

## Purpose of this repository

- Build and maintain a Chrome MV3 extension that reduces YouTube noise.
- Core features:
    - hide watched videos
    - hide Shorts shelves
    - hide expandable sections on subscriptions page
    - filter videos by length and by views (fade or hide)
    - manage subscription categories (assign + filter)
- Keep behavior local-only in browser. No external API calls.

## High-level architecture

- `src/manifest.json`
    - MV3 manifest.
    - injects `content.js` + `content.css` on YouTube.
    - injects `contentCategorize.js` + `contentCategorize.css` on YouTube (`document_idle`).
    - registers `background.js` service worker.
    - declares `options.html` as options page.
- `src/background.js`
    - sets storage defaults on install.
    - opens options page on install and version update.
- `src/options.html` + `src/options.js`
    - options UI.
    - writes/reads `chrome.storage.sync`.
    - handles reset and category CRUD.
- `src/content.js`
    - global filters on YouTube feed-like surfaces.
    - uses CSS classes for hide/fade behavior.
    - reruns through debounced `MutationObserver` (not interval polling).
- `src/contentCategorize.js`
    - category dropdown on channels page.
    - category filter tabs on channels/subscriptions pages.
    - re-applies filters on dynamic page changes via `MutationObserver`.

## Files to read first

- `src/manifest.json` (entry points, permissions, run timing)
- `src/background.js` (defaults and migration impact)
- `src/options.html` (UI controls and IDs)
- `src/options.js` (storage contract and event wiring)
- `src/content.js` (global filtering logic)
- `src/contentCategorize.js` (category assignment/filtering logic)

## Main files to know

- `src/content.css` (hide/fade utility classes used by `content.js`)
- `src/contentCategorize.css` (category UI styles in YouTube DOM)
- `README.md` (feature behavior and development flow)
- `CHANGELOG.md` (versioned feature history)
- `CONTRIBUTING.md` (PR expectations)
- `PUBLISHING.md` (release checklist and packaging)
- `eslint.config.js`, `.editorconfig`, `.prettierrc.json` (style + lint rules)

## Important storage keys and defaults

- General
    - `doHideShorts`: `false`
    - `doHideWatched`: `false`
    - `doHideExpandableSections`: `false`
- Video length filter
    - `doFadeByLength`: `true`
    - `videoLengthMode`: `'fade' | 'hide'` (default `'fade'`)
    - `videoLengthMin`: `0`
    - `videoLengthMax`: `30`
- Video views filter
    - `doFilterByViews`: `false`
    - `videoViewsMode`: `'fade' | 'hide'` (default `'fade'`)
    - `videoViewsMin`: `0`
    - `videoViewsMax`: `1000000`
- Subscription categories
    - `doCategorizeSubscription`: `true`
    - `categories`: `Array<{ id: string, name: string }>`
    - `channelCategoryAssigned`: `Record<string, string>` (`channelName -> categoryId`)

## Rules and code conventions

- Storage
    - Use `chrome.storage.sync.get([...], callback)` and keep dependent logic inside the callback.
    - Keep key names and defaults aligned between `background.js`, `options.js`, and content scripts.
- Rendering and DOM behavior
    - Prefer CSS class toggles (`classList.add/remove`) over inline style writes.
    - Keep filtering idempotent: rerunning must not duplicate controls or stack stale classes.
    - Content scripts rely on debounced `MutationObserver`; avoid reintroducing `setInterval` polling.
    - In `contentCategorize.js`, missing dropdowns on new blocks are expected; use `warnMissingSelector()` only for real missing selectors.
- Naming and style
    - Keep selector/constants uppercase when they are true constants.
    - Keep extension CSS class/id prefixes (`spt-`, `sptcl-`, `sptid-`) for collision safety.
    - Follow lint/format rules: 4-space JS indentation, semicolons, single quotes, LF line endings.

## Common patterns (examples)

- Add a new option end-to-end
    1. Add default key/value in `src/background.js` install block.
    2. Add control markup in `src/options.html` with consistent `sptid-` ID naming.
    3. In `src/options.js`, wire event handler, save to storage, and load key in `DOMContentLoaded`.
    4. Apply behavior in `src/content.js` and/or `src/contentCategorize.js`.
    5. Add/adjust CSS class in `src/content.css` or `src/contentCategorize.css` when visual state is needed.

- Add a new range filter (similar to length/views)
    1. Add enable toggle + min/max + mode keys.
    2. In options script, validate `min < max` before save.
    3. In content script, compute value per video and apply `'fade'` or `'hide'` classes.
    4. Remove opposite class each run to prevent stale UI state.

- Add category-related behavior
    1. Keep category IDs as stable values.
    2. Normalize channel identifier consistently before storage lookup.
    3. Ensure re-render paths avoid duplicate filter containers/dropdowns.

## Integration and testing rules

- Local integration
    - Load unpacked extension from `src/` in `chrome://extensions` (Developer mode).
    - Reload extension after edits to scripts, HTML, or manifest.
    - Refresh active YouTube tabs to apply new content scripts.
- Automated checks
    - Install deps: `npm install`
    - Lint + format check: `npm run lint`
    - Auto-fix when needed: `npm run lint:fix`
    - Optional syntax check per file: `node --check src/<file>.js`
- Manual validation focus
    - Home/subscriptions/channels/search/watch recommendations for global filters.
    - Dynamic content injection behavior (no duplicate UI, no stale classes).
    - Category assignment persistence and subscriptions filter accuracy.
- Release hygiene
    - Keep version in sync: `src/manifest.json` and `package.json`.
    - Update `CHANGELOG.md` and relevant `README.md` sections for user-visible changes.

## Guardrails for agents

- Ask before changing `src/manifest.json` permissions or execution scope.
- Do not add network calls or third-party telemetry.
- Keep changes focused; avoid broad refactors unless requested.
