# Publishing SimpleTube to the Chrome Web Store

## Prepare a release

1. Choose the next semantic version (`MAJOR.MINOR.PATCH`) and update it in both places:

    - `src/manifest.json` — Chrome reads this version.
    - `package.json` — project release metadata; it must match the manifest.

2. Add a dated entry for the version to `CHANGELOG.md` and update `README.md` if the feature set changed.
3. Install dependencies (if needed) and validate the source:

    ```bash
    npm ci
    npm run lint
    ```

    Fix any reported issues with `npm run lint:fix` before proceeding.

4. Build and inspect the extension archive:

    ```bash
    npm run package
    unzip -l dist/releases/simpletube-v<version>.zip
    ```

The archive contains the files inside `src/`, including `manifest.json`, service worker, content assets, options assets, and `icons/`. Do not zip the containing `src/` directory itself.

## Release

1. Commit the release changes and push the branch.
2. Create and push an annotated tag matching the manifest version:

    ```bash
    git tag -a v<version> -m "SimpleTube v<version>"
    git push origin v<version>
    ```

3. In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
    1. Select the **SimpleTube** listing
    2. Click **Package** → **Upload new package**.
    3. Upload `dist/releases/simpletube-v<version>.zip`.
4. Update the store description and privacy disclosure if the extension's behavior or permissions changed
5. Add the corresponding changelog notes to **What's new**
6. Submit the release for review.

> Review by Google typically takes a few days. You will receive an email once the extension is published or if changes are requested.

## Release checklist

- [ ] `package.json` and `src/manifest.json` have the same version.
- [ ] `CHANGELOG.md` includes the version and release notes.
- [ ] `README.md` reflects the current feature set.
- [ ] `npm run lint` passes.
- [ ] `dist/releases/simpletube-v<version>.zip` was built and inspected.
- [ ] Store screenshots are 1280×800 and the small promotional image is 440×280.
- [ ] Release commit and `v<version>` tag are pushed.
- [ ] The archive and release notes are submitted in the Chrome Web Store dashboard.
