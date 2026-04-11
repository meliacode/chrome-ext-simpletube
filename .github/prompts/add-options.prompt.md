---
name: add-options
description: Add a new SimpleTube option end-to-end (defaults, options UI, storage wiring, and runtime behavior)
agent: agent
---

Add a new option to this Chrome extension.

## Inputs

- Option name: ${input:optionName}
- Storage key: ${input:storageKey}
- Type: ${input:optionType} (boolean | select | range)
- Default value: ${input:defaultValue}
- Options page section: ${input:optionsSection}
- Runtime target file: ${input:runtimeTarget} (content.js | contentCategorize.js)
- Behavior summary: ${input:behaviorSummary}

## Required implementation

1. Update defaults in `src/background.js`.
2. Add/update UI controls in `src/options.html`.
3. Wire save/load and validation in `src/options.js`.
4. Apply behavior in `${input:runtimeTarget}` using idempotent logic.
5. Add CSS classes in `src/content.css` or `src/contentCategorize.css` when visual state is needed.
6. Keep naming consistent with existing prefixes (`sptid-`, `sptcl-`, `spt-`).
7. Use `chrome.storage.sync.get([...], callback)` and keep logic inside callback scope.
8. If behavior has mutually exclusive states, always remove stale opposite class/state.

## Validation

- Run `npm run lint`.
- If needed, run `node --check src/options.js` and `node --check src/${input:runtimeTarget}`.
- Confirm manually in YouTube pages:
    - option saves and reloads correctly
    - option reset behavior is correct
    - no duplicate UI injected
    - no stale classes on repeated DOM updates

## Output format

- Brief summary of what changed.
- File-by-file list of edits.
- Any assumptions or follow-up checks.
