# SimpleTube — YouTube Filters & Subscriptions Manager

SimpleTube is a Chrome extension for reducing noise on YouTube. Filter videos by duration or views, hide selected feed sections, and organize channel subscriptions into categories for easier navigation.

## Features

- Hide watched videos on supported YouTube pages.
- Hide Shorts shelves while keeping YouTube's Shorts navigation available.
- Hide expandable recommendation sections on the Subscriptions page.
- Fade or hide videos outside a configurable duration range.
- Fade or hide videos outside a configurable view-count range.
- Create, rename, and delete custom subscription categories.
- Assign subscribed channels to categories from their profiles or the channels management page.
- Filter the Subscriptions page by assigned category and the channels management page by category or unassigned status.
- Remove a channel's category assignment when a confirmed unsubscribe is detected on its profile.
- Show category filters on the Subscriptions page only when they contain at least one assigned channel.
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
5. On a subscribed channel's profile, use the category selector beside the subscription button to assign or change its category. The selector is shown when the subscription state can be identified.
6. On YouTube's **Subscriptions** page, select a category to filter videos. Open **Manage** to assign categories to channels and filter the channel list, including unassigned channels.

Selecting **Category** clears an assignment. If you unsubscribe on a channel profile, SimpleTube removes its assignment when it detects the confirmed change in YouTube's subscription control. The selector and automatic removal depend on supported YouTube markup. Deleting a category also removes its channel assignments; resetting filter options keeps categories and assignments.

Unrecognized duration or view-count formats are left unchanged. Category filters persist while YouTube dynamically loads content and reset when the page is reloaded.

## How it works

- Settings and category assignments are stored with `chrome.storage.sync`.
- Missing settings are initialized without overwriting existing preferences. The options page opens automatically on first installation.
- Content scripts inspect supported YouTube surfaces and apply the configured filters locally.
- Visual changes use extension-prefixed CSS classes rather than repeated inline style writes.
- Debounced mutation observers process content added by YouTube's single-page application without interval polling.
- `contentCategorize.js` manages channel assignment controls and subscription category filters separately from the general video filters in `content.js`.
- Extension interface strings use Chrome's localization system; English messages are in `src/_locales/en/messages.json`.

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
