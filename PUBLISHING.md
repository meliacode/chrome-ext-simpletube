# Publishing to Chrome Web Store

Step-by-step guide for building and releasing a new version of SimpleTube on the Chrome Web Store.

---

## 1. Pre-requisites

Before building the package, make sure the following are done:

### Update the version

Bump the version in **two** places:

- `src/manifest.json` — `"version"` field (Chrome reads this)
- `package.json` — `"version"` field (keeps package metadata in sync)

Both must match. Follow [semantic versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

### Update the changelog

Add a new version entry to `CHANGELOG.md` with all notable changes, following the existing format.
Update also the `README.md` file to ensure new feature is documented.

### Run lint

Ensure there are no lint or formatting issues before building:

```bash
npm run lint
```

Fix any reported issues with `npm run lint:fix` before proceeding.

### Commit and push

Commit all pending changes and push to the main branch:

```bash
git add .
git commit -m "chore: release v<version>"
git push origin main
```

---

## 2. Tag the release

Create an annotated Git tag matching the version, then push it:

```bash
git tag v<version>
git push origin v<version>
```

Example for version `0.9.0`:

```bash
git tag v0.9.0
git push origin v0.9.0
```

---

## 3. Build the zip package

Run the package script to create a zip from the `src/` directory:

```bash
npm run package
```

This will:

- Read the version from `src/manifest.json` automatically
- Create a `simpletube-v<version>.zip` in the project root
- Exclude `.crx` files and `.DS_Store` from the archive

> **Note**: The zip contains the raw contents of `src/` (not the folder itself), which is the format required by the Chrome Web Store.

Verify the output file exists and contains the expected files:

```bash
unzip -l simpletube-v<version>.zip
```

Expected contents:

```
background.js
content.css
content.js
contentCategorize.css
contentCategorize.js
icons/
manifest.json
options.css
options.html
options.js
styles.css
```

---

## 4. Upload to the Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Select the **SimpleTube** listing.
3. Click **Package** → **Upload new package**.
4. Upload the generated `simpletube-v<version>.zip`.
5. Fill in the **Store listing** changes if needed (description, screenshots).
6. Add release notes in the **What's new** field (use the CHANGELOG entry as a reference).
7. Click **Submit for review**.

> Review by Google typically takes a few days. You will receive an email once the extension is published or if changes are requested.

---

## Summary checklist

- [ ] Version updated in `src/manifest.json`
- [ ] Version updated in `package.json`
- [ ] `CHANGELOG.md` updated with new version entry
- [ ] `npm run lint` passes with no errors
- [ ] All changes committed and pushed to `main`
- [ ] Git tag created and pushed (`git tag v<version> && git push origin v<version>`)
- [ ] Zip built with `npm run package`
- [ ] Zip contents verified
- [ ] Zip uploaded to the Chrome Web Store Developer Dashboard
- [ ] Release notes added
- [ ] Submitted for review
