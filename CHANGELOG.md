# Changelog

## Versions

v0.11.0:

- **feat**: content - enhance video item, duration, and metadata selectors to better detect videos on YouTube search surfaces.
- **feat**: contentcategorize css - improve category UI consistency and theming with centralized light/dark CSS variables.

v0.10.1:

- **fix**: contentcategorize - update channel name link selector for improved channel detection accuracy on YouTube pages.
- **chore**: content/options - refactor extension class names with consistent `sptcl-js-` prefixes and centralize options DOM/storage constants for more maintainable handling.
- **chore**: repo - update Copilot project instructions and add an options prompt template under `.github/prompts`.

v0.10.0:

- **feat**: options/content - add configurable video views filter with min/max range and fade/hide mode.
- **feat**: content - apply views filtering across major YouTube surfaces including home, subscriptions, channels, search, and watch recommendations.
- **docs**: update README with views filter behavior and parsing notes.
- **ui**: improve options page descriptions, labels, and help text for clarity on feature behavior and outcomes.

v0.9.0:

- **feat**: Hide expanded recommendation sections on subscriptions page (sections with id="dismissible").
- **feat**: Smart category filtering - only show categories with at least one assigned channel on subscriptions page.
- **fix**: Improve category dropdown styling for better contrast on Windows with YouTube-like appearance (use primary text and badge chip background variables with proper fallbacks).

v0.8.0:

- **feat**: options/content - let user choose between fade or hide for videos length filter.
- **performance**: replace interval polling with a debounced mutationobserver for content scripts to reduce cpu usage and layout thrashing.
- **performance**: move visual changes to css classes and stop writing display/opacity inline styles from scripts.

v0.7.1:

- **fix**: manifest - remove unused permissions

v0.7.0:

- **feat**: options/contentCategories - set and use an id for category filtering instead of the name
- **feat**: options - allow user to rename category name and update all references
- **feat**: options - update save to be on change and not on save button click
- **fix**: options - ensure alert message is now fixed to the top right corner
- **fix**: contentCategories - update channel/subscription page selector to correct DOM container
- **fix**: contentCategories - update constant naming
- **chore**: refactor comments and functions name

v0.6.0:

- **chore**: adding linting and code formating rules
- **chore**: setup files for github (CONTRIBUTING, issue templates, etc)
- **chore**: move extension files into src folder

v0.5.0:

- **feat**: contentcategorize - add observer to reapply filter on new video loaded for subscriptions.
- **feat**: contentcategorize - reduce repetition on filtering logic.
- **feat**: contentcategorize - add filters on channel page.
- **feat**: contentcategorize - create function for reusable features.

v0.4.0:

- **fix**: options - optimize options page display.
- **fix**: options - sort category on save action to ensure consistency.
- **fix**: rename DOM class and ID to have an extension prefix.

v0.3.0:

- **feat**: contentcategorize - add handlers to filter videos on the subscription page based on clicked filter.
- **feat**: contentcategorize - add filter container and buttons without handlers to subscriptions page.
- **fix**: options - limit length for category name.
- **feat**: contentcategorize - add dropdown to assign category to subscriptions management page.
- **feat**: options - allow user to remove category.
- **feat**: options - add option to create categories for subscriptions and enable these categories as filters.
- **chore**: add extension icons.

v0.2.0:

- **feat**: options - allow reset settings to default.
- **feat**: content - hide shorts section and watched videos when option is checked.
- **feat**: options - add option to hide shorts section and watched videos.

v0.1.0:

- **chore**: update background to avoid overriding options on update.
- **feat**: options - add styles to the options page.
- **feat**: content - fade video based on video length filter.
- **feat**: options - create video length filter.
