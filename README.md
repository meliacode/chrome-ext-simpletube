# SimpleTube - YouTube Filters & Subscriptions Manager

This Chrome extension allows users to filter YouTube content by video length and number of views, manage the visibility of watched videos, hide the Shorts section, and organize channel subscriptions into categories for easier navigation and filtering.

## Features

- **Hide Watched Videos**: Hide videos you have already watched on supported pages, helping you focus on unwatched content.
- **Hide Shorts Shelves**: Remove Shorts rows and shelves from supported feeds. (The Shorts link in YouTube's own navigation remains accessible.)
- **Hide Expandable Sections**: Hide expanded recommendation blocks on subscriptions pages to reduce clutter and make lists easier to scan.
- **Video Length Filter**: Set a minimum and maximum video duration (in minutes). Videos outside your range can be faded (dimmed) or hidden completely.
- **Video Views Filter**: Set a preferred views range. Videos outside your range can be faded (dimmed) or hidden completely.
- **Subscription Categories**: Organize subscribed channels into custom categories. Create category names in the options page, assign channels on the subscriptions/channels listing page, and filter your subscriptions page by category. Only categories with assigned channels appear in filters, and filters persist when YouTube dynamically loads content.

## Installation

> Go to Chrome's extension website and search for 'SimpleTube' extension.

1. Install the extension from the Chrome Web Store.
2. Click on the extension icon in the Chrome toolbar and select **Options** to configure your preferences.

    ![SimpleTube Icon](src/icons/icon32.png)

3. Configure your preferences for video length, Shorts, watched videos, and subscription categories.
4. Enjoy a more focused and organized YouTube experience!

### Usage

Once installed and configured, the extension automatically applies your selected filters on YouTube.

**General Options:**

- Hide watched videos from feed lists to focus on new content.
- Hide Shorts shelves from your feeds (Shorts navigation link remains available).
- Hide expandable recommendation blocks on subscriptions pages.

**Video Length Filter:**

- Set minimum and maximum duration (in minutes).
- Choose action for out-of-range videos: Fade (dimmed) or Hide (removed from view).

**Video Views Filter:**

- Set minimum and maximum view counts.
- Choose action for out-of-range videos: Fade (dimmed) or Hide (removed from view).
- View text is parsed from YouTube metadata labels (e.g., `1,234 views`, `12K views`, `3.4M views`).
- Unrecognized formats are left unchanged.

**Subscription Categories:**

- Create custom category names in the options page.
- Assign subscribed channels to categories on the subscriptions/channels listing page.
- Filter your subscriptions page by category.
- Only categories with at least one assigned channel appear in the filter tabs.
- Filters persist when YouTube dynamically loads new content (reset on page reload).

### Implementation details (performance):

- Visual changes are applied via CSS classes so scripts avoid frequent inline style writes.
- Content scripts use a debounced MutationObserver instead of tight polling, which lowers CPU usage and reduces UI jank when YouTube dynamically injects content.

## Directory Structure

```bash
- chrome-ext-simpletube/src/
  - manifest.json         # Defines the configuration for the Chrome extension, including permissions and entry points.
  - background.js         # Sets default settings when the extension is installed.
  - options.html          # The user interface for configuring the extension settings.
  - options.js            # Handles saving and loading settings from the options page.
  - content.js            # Applies the filters on YouTube pages.
  - contentCategorize.js  # Handles categorizing channels and filtering subscriptions.
  ...
```

## Local Development

If you want to modify or contribute to this extension:

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd chrome-ext-simpletube
    ```

2. Load the extension in Chrome:
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable **Developer mode** in the top right corner.
    - Click **Load unpacked** and select the `chrome-ext-simpletube/src` folder.

3. Make changes to the appropriate files (`manifest.json`, `background.js`, `options.html`, `options.js`, `content.js`, `contentCategorize.js`).
4. Reload the extension on the Chrome Extensions page to apply the changes.
5. (Re)configure the extension _(on reload, some settings are reinitialized)_:
    - Click on the extension icon in the Chrome toolbar.
    - Select **Options** to open the settings page.
    - Configure your preferences for video length, Shorts, watched videos, and subscription categories.

## License

This project is licensed under the MIT License.
