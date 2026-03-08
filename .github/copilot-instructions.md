# Copilot instructions for SimpleTube (Chrome extension)

## Purpose

- Help AI coding agents make safe, effective edits in this repository by documenting the important architecture, file hotspots, storage keys, and developer workflows.

## High-level architecture

- `manifest.json` (MV3) wires these components:
    - `background.js` — service worker that sets storage defaults on install and opens the options page.
    - `content.js` — runs on all YouTube pages; implements global filters (hide shorts, hide watched, fade/hide by length).
    - `contentCategorize.js` — runs on subscriptions/channel pages; provides UI to assign categories and filter subscriptions; uses MutationObserver and periodic re-apply.
    - `options.html` / `options.js` — options UI that reads/writes `chrome.storage.sync` keys.

## Important storage keys (shared contract)

- doHideShorts (bool)
- doHideWatched (bool)
- doFadeByLength (bool)
- videoLengthMode (string) — 'fade' | 'hide' (controls whether out-of-range videos are faded or hidden)
- videoLengthMin / videoLengthMax (numbers)
- doCategorizeSubscription (bool)
- categories (array of {id, name})
- channelCategoryAssigned (object mapping channelName -> categoryId)

## Project-specific conventions

- Always use `chrome.storage.sync.get([...], callback)` and operate inside its callback; files assume values exist in that callback scope.
- UI visibility is managed with `element.style.display` and `element.style.opacity`; when switching modes, ensure both properties are correctly reset (avoid stale styles causing flicker).
- Content scripts use `setInterval(..., 3000)` to re-apply filters. Edits that change timing or mutation handling may introduce flicker; minimize changes to scheduling.
- `contentCategorize.js` prefers not to warn when dropdowns are absent for new blocks; use `warnMissingSelector(selector, context)` for real missing cases.

## Integration & testing notes

- To run locally: load the extension unpacked in Chrome using the `src/` directory (chrome://extensions → Developer mode → Load unpacked).
- After edits to content scripts or options, reload the extension and refresh YouTube pages.
- Quick syntax check: `node --check src/<file>.js` — this detects parse errors but will not run in a browser context because `chrome` is not defined.

## Common change patterns (examples)

- Adding a new settings key:
    1. Add default in `background.js` on install.
    2. Expose UI in `options.html` and wire save/load in `options.js` with `chrome.storage.sync.get/set`.
    3. Read the key in `content.js` / `contentCategorize.js` and apply behavior idempotently.

## Files you will read first

- `src/manifest.json` — confirm permissions and content script entries.
- `src/background.js` — see install defaults.
- `src/options.html` & `src/options.js` — options UI wiring.
- `src/content.js` & `src/contentCategorize.js` — runtime logic and DOM selectors.

If unsure, ask the maintainer before

- Changing `manifest.json` (permissions or manifest_version)
- Adding network calls or external dependencies

If you update this file, keep it short and reference the exact file paths changed.
