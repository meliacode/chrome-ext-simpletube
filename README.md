# SimpleTube — YouTube Filters & Subscriptions Manager

SimpleTube is a Chrome extension for reducing noise on YouTube. Filter videos by duration or views, hide selected feed sections, and organize channel subscriptions into categories for easier navigation.

## Features

- Hide watched videos on supported YouTube pages.
- Hide Shorts shelves while keeping YouTube's Shorts navigation available.
- Hide expandable recommendation sections on the Subscriptions page.
- Fade or hide videos outside a configurable duration range.
- Fade or hide videos outside a configurable view-count range.
- Create, rename, and delete custom subscription categories.
- Assign subscribed channels to categories and filter the Subscriptions page by category.
- Show category filters only when they contain at least one assigned channel.
- Reapply filters as YouTube dynamically loads content.
- Keep all processing in the browser with no analytics or external service.

## Installation

Install SimpleTube from the Chrome Web Store, then open the extension's **Options** page from Chrome's extensions menu to configure your filters and categories.

For a local build, follow the development instructions below.

## Usage

1. Open SimpleTube's **Options** page.
2. Configure whether watched videos, Shorts shelves, or expandable sections should be hidden.
3. Set optional minimum and maximum video duration or view-count filters, then choose whether out-of-range videos should fade or be hidden.
4. Create subscription categories when needed.
5. Visit YouTube's subscriptions or channels management pages to assign channels and filter subscriptions by category.

Unrecognized duration or view-count formats are left unchanged. Category filters persist while YouTube dynamically loads content and reset when the page is reloaded.

## How it works

- Settings and category assignments are stored with `chrome.storage.sync`.
- Content scripts inspect supported YouTube surfaces and apply the configured filters locally.
- Visual changes use extension-prefixed CSS classes rather than repeated inline style writes.
- Debounced mutation observers process content added by YouTube's single-page application without interval polling.
- `contentCategorize.js` manages channel assignment controls and subscription category filters separately from the general video filters in `content.js`.

## Local development

1. Clone the repository and enter it:

    ```bash
    git clone <repository-url>
    cd chrome-ext-simpletube
    ```

2. Install the locked development dependencies:

    ```bash
    npm ci
    ```

3. In Chrome, open `chrome://extensions/`, enable **Developer mode**, choose **Load unpacked**, and select the `src/` folder.
4. Make changes, then reload the extension from `chrome://extensions/` and refresh the affected YouTube page.
5. Run the checks and create a store-ready archive when needed:

    ```bash
    npm run lint
    npm run package
    ```

The package command creates `dist/releases/simpletube-v<version>.zip`. The archive contains the contents of `src/`, which is the layout required by the Chrome Web Store.

## Project structure

```text
src/
├── manifest.json          # Manifest V3 configuration and YouTube content-script matches
├── background.js          # Initializes storage defaults and install/update behavior
├── i18n.js                # Shared Chrome i18n helpers for extension pages and content scripts
├── content.js             # Applies general video and section filters
├── content.css            # Styles general filter states
├── contentCategorize.js   # Injects category assignment and subscription filters
├── contentCategorize.css  # Styles category controls
├── _locales/              # English extension interface strings
├── options.html           # Options-page markup
├── options.js             # Settings and category management
├── options.css            # Options-page component styles
└── styles.css             # Shared options-page styles
```

## Privacy

SimpleTube does not collect or transmit personal data. Preferences and category assignments are processed in the browser and may be synchronized by Chrome according to the user's Chrome Sync settings. See [PRIVACY_POLICIES.md](PRIVACY_POLICIES.md) for details.

## License

This project is licensed under the MIT License.
