# Contributing

## Getting started

1. Fork the repository and create a branch for your change.
2. Install the locked development dependencies:

    ```bash
    npm ci
    ```

3. Load `src/` through `chrome://extensions/` with Developer mode enabled. Reload the extension and refresh YouTube after each change to content scripts or styles.

## Before opening a pull request

Run the full local check:

```bash
npm run lint
```

For changes that affect the release archive, keep `package.json` and `src/manifest.json` on the same version, and add release-facing changes to `CHANGELOG.md`.

Follow the repository's ESLint and Prettier configuration. The CI workflow uses Node.js 22, `npm ci`, a critical-vulnerability audit, and `npm run lint`.

Submit a pull request with a clear description and the relevant testing notes, using the pull request template. Use issues to discuss bugs and features; include reproduction steps for bugs and expected behavior for feature requests.
