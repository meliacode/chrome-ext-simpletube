/**
 * Default settings and lifecycle initialization.
 */

const DEFAULT_SETTINGS = {
    doHideShorts: false,
    doHideWatched: false,
    doHideExpandableSections: false,
    doFadeByLength: true,
    videoLengthMode: 'fade',
    videoLengthMin: 0,
    videoLengthMax: 30,
    doFilterByViews: false,
    videoViewsMode: 'fade',
    videoViewsMin: 0,
    videoViewsMax: 1000000,
    doCategorizeSubscription: true,
    categories: [],
    channelCategoryAssigned: {},
};

// Repairs newly introduced or missing settings without overwriting existing user preferences.
async function initializeStorage() {
    const storedSettings = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
    const missingSettings = Object.fromEntries(
        Object.entries(DEFAULT_SETTINGS).filter(([key]) => typeof storedSettings[key] === 'undefined')
    );

    if (Object.keys(missingSettings).length > 0) {
        await chrome.storage.sync.set(missingSettings);
    }
}

// Ensures storage exists after install/update and opens setup only for a first installation.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    await initializeStorage();

    if (reason === 'install') {
        await chrome.runtime.openOptionsPage();
    }
});

// Repairs missing defaults when the browser starts without resetting existing users.
chrome.runtime.onStartup.addListener(initializeStorage);
