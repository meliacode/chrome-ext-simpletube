/**
 * Chrome Extension Options Page Script
 * Will run on the options page of the Chrome extension.
 */

/**
 * Constants
 */

const DOM_ID_HIDE_SHORTS = 'sptid-do-hide-shorts';
const DOM_ID_HIDE_WATCHED = 'sptid-do-hide-watched';
const DOM_ID_HIDE_SUBSCRIPTIONS_EXPANDABLE = 'sptid-do-hide-subscriptions-expandable-sections';
const DOM_ID_FADE_BY_LENGTH = 'sptid-do-fade-by-length';
const DOM_ID_VIDEO_LENGTH_GROUP = 'sptid-video-length-group';
const DOM_ID_VIDEO_LENGTH_MIN = 'sptid-video-length-min';
const DOM_ID_VIDEO_LENGTH_MAX = 'sptid-video-length-max';
const DOM_ID_VIDEO_LENGTH_MODE = 'sptid-video-length-mode';
const DOM_ID_FILTER_BY_VIEWS = 'sptid-do-filter-by-views';
const DOM_ID_VIDEO_VIEWS_GROUP = 'sptid-video-views-group';
const DOM_ID_VIDEO_VIEWS_MIN = 'sptid-video-views-min';
const DOM_ID_VIDEO_VIEWS_MAX = 'sptid-video-views-max';
const DOM_ID_VIDEO_VIEWS_MODE = 'sptid-video-views-mode';
const DOM_ID_CATEGORIZE_SUBSCRIPTION = 'sptid-do-categorize-subscription';
const DOM_ID_CATEGORY_NAME = 'sptid-category-name';
const DOM_ID_CATEGORY_ADD = 'sptid-category-add';
const DOM_ID_CATEGORIES_LIST = 'sptid-categories-list';
const DOM_ID_SETTINGS_RESET = 'sptid-settings-reset';
const DOM_ID_ALERT_MESSAGE = 'sptid-alert-message';
const DOM_ID_VERSION = 'sptid-version';

const CLASS_JS_STATE_DISABLED = 'sptcl-js-is-disabled';
const CLASS_JS_STATE_ERROR = 'sptcl-js-error';
const CLASS_JS_STATE_SUCCESS = 'sptcl-js-success';
const CLASS_JS_EMPTY_ITEM = 'sptcl-js-empty-item';
const CLASS_JS_CATEGORY_ACTIONS = 'sptcl-js-category-actions';
const CLASS_JS_CATEGORY_BUTTON = 'sptcl-js-form-button-category';

const STORAGE_KEY_CHANNEL_CATEGORY_ASSIGNED = 'channelCategoryAssigned';
const STORAGE_KEY_CATEGORIES = 'categories';

const STORAGE_SETTINGS_KEYS = [
    'doHideShorts',
    'doHideWatched',
    'doHideExpandableSections',
    'doFadeByLength',
    'videoLengthMax',
    'videoLengthMin',
    'doCategorizeSubscription',
    'videoLengthMode',
    'doFilterByViews',
    'videoViewsMin',
    'videoViewsMax',
    'videoViewsMode',
];

/**
 * Helper Functions
 */

function getElementById(elementId) {
    return document.getElementById(elementId);
}

function updateOptionGroupsState() {
    const lengthEnabled = getElementById(DOM_ID_FADE_BY_LENGTH).checked;
    const viewsEnabled = getElementById(DOM_ID_FILTER_BY_VIEWS).checked;

    const lengthGroup = getElementById(DOM_ID_VIDEO_LENGTH_GROUP);
    const viewsGroup = getElementById(DOM_ID_VIDEO_VIEWS_GROUP);

    [
        getElementById(DOM_ID_VIDEO_LENGTH_MIN),
        getElementById(DOM_ID_VIDEO_LENGTH_MAX),
        getElementById(DOM_ID_VIDEO_LENGTH_MODE),
    ].forEach((element) => {
        element.disabled = !lengthEnabled;
    });

    [
        getElementById(DOM_ID_VIDEO_VIEWS_MIN),
        getElementById(DOM_ID_VIDEO_VIEWS_MAX),
        getElementById(DOM_ID_VIDEO_VIEWS_MODE),
    ].forEach((element) => {
        element.disabled = !viewsEnabled;
    });

    lengthGroup.classList.toggle(CLASS_JS_STATE_DISABLED, !lengthEnabled);
    viewsGroup.classList.toggle(CLASS_JS_STATE_DISABLED, !viewsEnabled);
}

function renderAlertMessage(message, error = false) {
    const messageElement = getElementById(DOM_ID_ALERT_MESSAGE);
    messageElement.classList.remove(CLASS_JS_STATE_ERROR, CLASS_JS_STATE_SUCCESS);

    messageElement.textContent = message;
    messageElement.classList.add(error ? CLASS_JS_STATE_ERROR : CLASS_JS_STATE_SUCCESS);

    // Clear any existing timeout to handle quick clicks
    if (renderAlertMessage.timeoutId) {
        clearTimeout(renderAlertMessage.timeoutId);
    }

    // Hide the message after 5 seconds
    renderAlertMessage.timeoutId = setTimeout(() => {
        messageElement.classList.remove(CLASS_JS_STATE_ERROR, CLASS_JS_STATE_SUCCESS);
        messageElement.textContent = '';
    }, 5000);
}

function renderListCategories(categories = []) {
    const categoriesList = getElementById(DOM_ID_CATEGORIES_LIST);
    categoriesList.innerHTML = '';

    // Sort categories alphabetically by name
    categories.sort((a, b) => a.name.localeCompare(b.name));

    // If there are no categories, show a message
    if (categories.length === 0) {
        const emptyLiElement = document.createElement('li');
        emptyLiElement.textContent = 'No categories added yet!';
        emptyLiElement.classList.add(CLASS_JS_EMPTY_ITEM);

        categoriesList.appendChild(emptyLiElement);
        return;
    }

    // Render categories with delete and rename buttons
    categories.forEach(({ id, name }) => {
        // Create list item for each category
        const newLiElement = document.createElement('li');

        // Create span to hold the category name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;

        // Create div to hold the action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add(CLASS_JS_CATEGORY_ACTIONS);

        // Create delete button for each category
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'delete';
        deleteButton.classList.add(CLASS_JS_CATEGORY_BUTTON);

        deleteButton.addEventListener('click', () => {
            // Remove the associated category from all subscriptions
            chrome.storage.sync.get([STORAGE_KEY_CHANNEL_CATEGORY_ASSIGNED], ({ channelCategoryAssigned }) => {
                Object.keys(channelCategoryAssigned).forEach((channel) => {
                    if (channelCategoryAssigned[channel] === id) {
                        delete channelCategoryAssigned[channel];
                    }
                });

                chrome.storage.sync.set({ channelCategoryAssigned });
            });

            // Remove the category from the list
            chrome.storage.sync.get([STORAGE_KEY_CATEGORIES], ({ categories = [] }) => {
                const newCategories = categories.filter((c) => c.id !== id);

                chrome.storage.sync.set({ categories: newCategories }, () => {
                    renderAlertMessage(`Category "${name}" deleted successfully!`);
                    renderListCategories(newCategories);
                });
            });
        });

        // Create rename button for each category
        const renameButton = document.createElement('button');
        renameButton.textContent = 'rename';
        renameButton.classList.add(CLASS_JS_CATEGORY_BUTTON);

        renameButton.addEventListener('click', () => {
            const newName = prompt('Enter new name for the category:', name);

            if (newName && newName.trim() !== '' && newName.trim() !== name) {
                chrome.storage.sync.get([STORAGE_KEY_CATEGORIES], ({ categories = [] }) => {
                    if (categories.some((category) => category.name === newName.trim())) {
                        renderAlertMessage(`Category "${newName.trim()}" already exists!`, true);
                        return;
                    }

                    const updatedCategories = categories.map((category) =>
                        category.id === id ? { ...category, name: newName.trim() } : category
                    );

                    chrome.storage.sync.set({ categories: updatedCategories }, () => {
                        renderAlertMessage(`Category renamed to "${newName.trim()}" successfully!`);
                        renderListCategories(updatedCategories);
                    });
                });
            }
        });

        // Append buttons to actions div
        actionsDiv.appendChild(renameButton);
        actionsDiv.appendChild(deleteButton);

        // Append elements to list item
        newLiElement.appendChild(nameSpan);
        newLiElement.appendChild(actionsDiv);

        // Append list item to categories list
        categoriesList.appendChild(newLiElement);
    });
}

/**
 * Event Click Settings
 */

// General options
getElementById(DOM_ID_HIDE_SHORTS).addEventListener('click', () => {
    const hideShorts = getElementById(DOM_ID_HIDE_SHORTS).checked;

    chrome.storage.sync.set({ doHideShorts: hideShorts }, () => {
        renderAlertMessage(`Short videos ${hideShorts ? 'hidden' : 'shown'} successfully!`);
    });
});

getElementById(DOM_ID_HIDE_WATCHED).addEventListener('click', () => {
    const hideWatched = getElementById(DOM_ID_HIDE_WATCHED).checked;

    chrome.storage.sync.set({ doHideWatched: hideWatched }, () => {
        renderAlertMessage(`Watched videos ${hideWatched ? 'hidden' : 'shown'} successfully!`);
    });
});

getElementById(DOM_ID_HIDE_SUBSCRIPTIONS_EXPANDABLE).addEventListener('click', () => {
    const hideExpandableSections = getElementById(DOM_ID_HIDE_SUBSCRIPTIONS_EXPANDABLE).checked;

    chrome.storage.sync.set({ doHideExpandableSections: hideExpandableSections }, () => {
        renderAlertMessage(`Expandable sections ${hideExpandableSections ? 'hidden' : 'shown'} successfully!`);
    });
});

// Fade by length
getElementById(DOM_ID_FADE_BY_LENGTH).addEventListener('click', () => {
    const fadeByLength = getElementById(DOM_ID_FADE_BY_LENGTH).checked;

    chrome.storage.sync.set({ doFadeByLength: fadeByLength }, () => {
        updateOptionGroupsState();

        renderAlertMessage(`Fade by length ${fadeByLength ? 'enabled' : 'disabled'} successfully!`);
    });
});

[getElementById(DOM_ID_VIDEO_LENGTH_MIN), getElementById(DOM_ID_VIDEO_LENGTH_MAX)].forEach((element) => {
    element.addEventListener('change', () => {
        const videoLengthMin = Number.parseInt(getElementById(DOM_ID_VIDEO_LENGTH_MIN).value, 10);
        const videoLengthMax = Number.parseInt(getElementById(DOM_ID_VIDEO_LENGTH_MAX).value, 10);

        if (videoLengthMin >= videoLengthMax) {
            renderAlertMessage('Minimum should be less than maximum!', true);
            return;
        }

        // Save the settings to Chrome's storage
        chrome.storage.sync.set(
            {
                videoLengthMax: videoLengthMax,
                videoLengthMin: videoLengthMin,
            },
            () => {
                renderAlertMessage('Video length settings updated successfully!');
            }
        );
    });
});

// Video length mode (fade or hide)
getElementById(DOM_ID_VIDEO_LENGTH_MODE).addEventListener('change', () => {
    const mode = getElementById(DOM_ID_VIDEO_LENGTH_MODE).value;

    chrome.storage.sync.set({ videoLengthMode: mode }, () => {
        renderAlertMessage(`Video length mode set to "${mode}" successfully!`);
    });
});

// Filter by views
getElementById(DOM_ID_FILTER_BY_VIEWS).addEventListener('click', () => {
    const filterByViews = getElementById(DOM_ID_FILTER_BY_VIEWS).checked;

    chrome.storage.sync.set({ doFilterByViews: filterByViews }, () => {
        updateOptionGroupsState();

        renderAlertMessage(`Filter by views ${filterByViews ? 'enabled' : 'disabled'} successfully!`);
    });
});

[getElementById(DOM_ID_VIDEO_VIEWS_MIN), getElementById(DOM_ID_VIDEO_VIEWS_MAX)].forEach((element) => {
    element.addEventListener('change', () => {
        const videoViewsMin = Number.parseInt(getElementById(DOM_ID_VIDEO_VIEWS_MIN).value, 10);
        const videoViewsMax = Number.parseInt(getElementById(DOM_ID_VIDEO_VIEWS_MAX).value, 10);

        if (videoViewsMin >= videoViewsMax) {
            renderAlertMessage('Minimum views should be less than maximum views!', true);
            return;
        }

        chrome.storage.sync.set(
            {
                videoViewsMax: videoViewsMax,
                videoViewsMin: videoViewsMin,
            },
            () => {
                renderAlertMessage('Video views settings updated successfully!');
            }
        );
    });
});

// Video views mode (fade or hide)
getElementById(DOM_ID_VIDEO_VIEWS_MODE).addEventListener('change', () => {
    const mode = getElementById(DOM_ID_VIDEO_VIEWS_MODE).value;

    chrome.storage.sync.set({ videoViewsMode: mode }, () => {
        renderAlertMessage(`Video views mode set to "${mode}" successfully!`);
    });
});

// Categorize subscriptions
getElementById(DOM_ID_CATEGORIZE_SUBSCRIPTION).addEventListener('click', () => {
    const categorizeSubscription = getElementById(DOM_ID_CATEGORIZE_SUBSCRIPTION).checked;

    chrome.storage.sync.set({ doCategorizeSubscription: categorizeSubscription }, () => {
        renderAlertMessage(`Categorize subscriptions ${categorizeSubscription ? 'enabled' : 'disabled'} successfully!`);
    });
});

getElementById(DOM_ID_CATEGORY_ADD).addEventListener('click', () => {
    const categoryName = getElementById(DOM_ID_CATEGORY_NAME).value.trim();

    if (categoryName) {
        chrome.storage.sync.get([STORAGE_KEY_CATEGORIES], ({ categories = [] }) => {
            if (categories.some((category) => category.name === categoryName)) {
                renderAlertMessage(`Category "${categoryName}" already exists!`, true);
                return;
            }

            const newCategory = { id: Date.now().toString(), name: categoryName };
            categories.push(newCategory);
            getElementById(DOM_ID_CATEGORY_NAME).value = '';

            // Sort categories alphabetically by name
            const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

            chrome.storage.sync.set({ categories: sortedCategories }, () => {
                renderAlertMessage(`Category "${categoryName}" added successfully!`);
                renderListCategories(sortedCategories);
            });
        });
    }
});

// Reset the settings to the default values
getElementById(DOM_ID_SETTINGS_RESET).addEventListener('click', () => {
    // Reset the settings to the default values
    getElementById(DOM_ID_HIDE_WATCHED).checked = false;
    getElementById(DOM_ID_HIDE_SHORTS).checked = false;
    getElementById(DOM_ID_HIDE_SUBSCRIPTIONS_EXPANDABLE).checked = false;

    getElementById(DOM_ID_FADE_BY_LENGTH).checked = true;
    getElementById(DOM_ID_VIDEO_LENGTH_MIN).value = 0;
    getElementById(DOM_ID_VIDEO_LENGTH_MAX).value = 30;
    getElementById(DOM_ID_VIDEO_LENGTH_MODE).value = 'fade';

    getElementById(DOM_ID_FILTER_BY_VIEWS).checked = false;
    getElementById(DOM_ID_VIDEO_VIEWS_MIN).value = 0;
    getElementById(DOM_ID_VIDEO_VIEWS_MAX).value = 1000000;
    getElementById(DOM_ID_VIDEO_VIEWS_MODE).value = 'fade';

    getElementById(DOM_ID_CATEGORIZE_SUBSCRIPTION).checked = true;

    updateOptionGroupsState();

    // Save the settings to Chrome's storage
    chrome.storage.sync.set(
        {
            // General Options
            doHideShorts: false,
            doHideWatched: false,
            doHideExpandableSections: false,
            // Video Length
            doFadeByLength: true,
            videoLengthMode: 'fade',
            videoLengthMin: 0,
            videoLengthMax: 30,
            // Video Views
            doFilterByViews: false,
            videoViewsMode: 'fade',
            videoViewsMin: 0,
            videoViewsMax: 1000000,
            // Subscriptions Categories
            doCategorizeSubscription: true,
        },
        () => {
            renderAlertMessage('Settings has been reset to default!');
        }
    );
});

/**
 * Event OnLoad
 */

document.addEventListener('DOMContentLoaded', () => {
    // Load the settings from Chrome's storage
    chrome.storage.sync.get(
        STORAGE_SETTINGS_KEYS,
        ({
            doHideShorts,
            doHideWatched,
            doHideExpandableSections,
            doFadeByLength,
            videoLengthMax,
            videoLengthMin,
            doCategorizeSubscription,
            videoLengthMode,
            doFilterByViews,
            videoViewsMin,
            videoViewsMax,
            videoViewsMode,
        }) => {
            getElementById(DOM_ID_HIDE_WATCHED).checked = doHideWatched;
            getElementById(DOM_ID_HIDE_SHORTS).checked = doHideShorts;
            getElementById(DOM_ID_HIDE_SUBSCRIPTIONS_EXPANDABLE).checked = doHideExpandableSections;

            getElementById(DOM_ID_FADE_BY_LENGTH).checked = doFadeByLength;
            getElementById(DOM_ID_VIDEO_LENGTH_MIN).value = videoLengthMin;
            getElementById(DOM_ID_VIDEO_LENGTH_MAX).value = videoLengthMax;
            getElementById(DOM_ID_VIDEO_LENGTH_MODE).value = videoLengthMode || 'fade';

            getElementById(DOM_ID_FILTER_BY_VIEWS).checked = doFilterByViews || false;
            getElementById(DOM_ID_VIDEO_VIEWS_MIN).value = videoViewsMin ?? 0;
            getElementById(DOM_ID_VIDEO_VIEWS_MAX).value = videoViewsMax ?? 1000000;
            getElementById(DOM_ID_VIDEO_VIEWS_MODE).value = videoViewsMode || 'fade';

            getElementById(DOM_ID_CATEGORIZE_SUBSCRIPTION).checked = doCategorizeSubscription;

            updateOptionGroupsState();
        }
    );

    // Load the categories from Chrome's storage
    chrome.storage.sync.get([STORAGE_KEY_CATEGORIES], ({ categories = [] }) => {
        renderListCategories(categories);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const versionElement = getElementById(DOM_ID_VERSION);
    versionElement.textContent = `v${chrome.runtime.getManifest().version}`;
});
