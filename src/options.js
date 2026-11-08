/**
 * Options-page state, validation, and storage synchronization.
 */

const { getMessage, localizePage } = globalThis.extensionI18n;

const DOM_IDS = {
    alert: 'sptid-alert-message',
    categoriesEnabled: 'sptid-do-categorize-subscription',
    categoriesList: 'sptid-categories-list',
    categoryForm: 'sptid-category-form',
    categoryName: 'sptid-category-name',
    hideExpandable: 'sptid-do-hide-subscriptions-expandable-sections',
    hideShorts: 'sptid-do-hide-shorts',
    hideWatched: 'sptid-do-hide-watched',
    lengthEnabled: 'sptid-do-fade-by-length',
    lengthGroup: 'sptid-video-length-group',
    lengthMax: 'sptid-video-length-max',
    lengthMin: 'sptid-video-length-min',
    lengthMode: 'sptid-video-length-mode',
    reset: 'sptid-settings-reset',
    version: 'sptid-version',
    viewsEnabled: 'sptid-do-filter-by-views',
    viewsGroup: 'sptid-video-views-group',
    viewsMax: 'sptid-video-views-max',
    viewsMin: 'sptid-video-views-min',
    viewsMode: 'sptid-video-views-mode',
};

const DEFAULT_OPTIONS = {
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
};

const STORAGE_KEYS = [...Object.keys(DEFAULT_OPTIONS), 'categories', 'channelCategoryAssigned'];

function getElement(id) {
    return document.getElementById(id);
}

function showAlert(message, state = 'success') {
    const alertElement = getElement(DOM_IDS.alert);
    alertElement.textContent = message;
    alertElement.dataset.state = state;
    window.clearTimeout(showAlert.timeoutId);
    showAlert.timeoutId = window.setTimeout(() => {
        alertElement.textContent = '';
        delete alertElement.dataset.state;
    }, 4000);
}

function readSettings(callback) {
    chrome.storage.sync.get(STORAGE_KEYS, (stored) => {
        callback({
            ...DEFAULT_OPTIONS,
            ...stored,
            categories: Array.isArray(stored.categories) ? stored.categories : [],
            channelCategoryAssigned:
                stored.channelCategoryAssigned && typeof stored.channelCategoryAssigned === 'object'
                    ? stored.channelCategoryAssigned
                    : {},
        });
    });
}

function saveSettings(values, successMessage, callback) {
    chrome.storage.sync.set(values, () => {
        if (chrome.runtime.lastError) {
            showAlert(chrome.runtime.lastError.message, 'error');
            return;
        }

        showAlert(successMessage);
        callback?.();
    });
}

function normalizeName(name) {
    return name.trim().replace(/\s+/g, ' ');
}

function createCategoryId() {
    return globalThis.crypto?.randomUUID?.() || `category-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hasDuplicateCategoryName(categories, name, excludedCategoryId = '') {
    return categories.some(
        (category) =>
            category.id !== excludedCategoryId &&
            category.name.localeCompare(name, undefined, { sensitivity: 'base' }) === 0
    );
}

function countAssignments(assignments, categoryId) {
    return Object.values(assignments).filter((assignedId) => assignedId === categoryId).length;
}

function updateOptionGroupsState() {
    const lengthEnabled = getElement(DOM_IDS.lengthEnabled).checked;
    const viewsEnabled = getElement(DOM_IDS.viewsEnabled).checked;

    [DOM_IDS.lengthMin, DOM_IDS.lengthMax, DOM_IDS.lengthMode].forEach((id) => {
        getElement(id).disabled = !lengthEnabled;
    });
    [DOM_IDS.viewsMin, DOM_IDS.viewsMax, DOM_IDS.viewsMode].forEach((id) => {
        getElement(id).disabled = !viewsEnabled;
    });

    getElement(DOM_IDS.lengthGroup).classList.toggle('sptcl-js-is-disabled', !lengthEnabled);
    getElement(DOM_IDS.viewsGroup).classList.toggle('sptcl-js-is-disabled', !viewsEnabled);
}

function createCategoryItem(category, categories, assignments) {
    const item = document.createElement('li');

    const details = document.createElement('span');
    details.className = 'sptcl-js-category-details';
    const name = document.createElement('strong');
    name.textContent = category.name;
    const count = document.createElement('small');
    count.textContent = getMessage('assignedChannelCount', String(countAssignments(assignments, category.id)));
    details.append(name, count);

    const actions = document.createElement('span');
    actions.className = 'sptcl-js-category-actions';
    const rename = document.createElement('button');
    rename.type = 'button';
    rename.className = 'sptcl-js-form-button-category';
    rename.textContent = getMessage('rename');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'sptcl-js-form-button-category';
    remove.dataset.variant = 'danger';
    remove.textContent = getMessage('delete');

    rename.addEventListener('click', () => {
        const editor = document.createElement('form');
        editor.className = 'sptcl-js-category-editor';
        const input = document.createElement('input');
        input.className = 'sptcl-form-text-input';
        input.value = category.name;
        input.maxLength = 30;
        input.setAttribute('aria-label', getMessage('categoryName'));
        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.className = 'sptcl-form-button';
        saveButton.textContent = getMessage('save');
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'sptcl-form-button sptcl-form-button-secondary';
        cancelButton.textContent = getMessage('cancel');
        cancelButton.addEventListener('click', () => renderCategories(categories, assignments));
        editor.append(input, saveButton, cancelButton);
        item.replaceChildren(editor);
        input.focus();
        input.select();

        editor.addEventListener('submit', (event) => {
            event.preventDefault();
            const nextName = normalizeName(input.value);
            if (!nextName) {
                showAlert(getMessage('nameRequired'), 'error');
                return;
            }

            readSettings(({ categories: currentCategories, channelCategoryAssigned }) => {
                if (hasDuplicateCategoryName(currentCategories, nextName, category.id)) {
                    showAlert(getMessage('duplicateCategory', nextName), 'error');
                    return;
                }

                const nextCategories = currentCategories.map((entry) =>
                    entry.id === category.id ? { ...entry, name: nextName } : entry
                );
                saveSettings({ categories: nextCategories }, getMessage('categoryRenamed'), () =>
                    renderCategories(nextCategories, channelCategoryAssigned)
                );
            });
        });
    });

    remove.addEventListener('click', () => {
        readSettings(({ categories: currentCategories, channelCategoryAssigned }) => {
            const assignedCount = countAssignments(channelCategoryAssigned, category.id);
            if (!window.confirm(getMessage('confirmDelete', [category.name, String(assignedCount)]))) {
                return;
            }

            const nextCategories = currentCategories.filter(({ id }) => id !== category.id);
            const nextAssignments = Object.fromEntries(
                Object.entries(channelCategoryAssigned).filter(([, assignedId]) => assignedId !== category.id)
            );
            saveSettings(
                { categories: nextCategories, channelCategoryAssigned: nextAssignments },
                getMessage('categoryDeleted'),
                () => renderCategories(nextCategories, nextAssignments)
            );
        });
    });

    actions.append(rename, remove);
    item.append(details, actions);
    return item;
}

function renderCategories(categories, assignments) {
    const list = getElement(DOM_IDS.categoriesList);
    list.replaceChildren();

    if (categories.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'sptcl-js-empty-item';
        empty.textContent = getMessage('noCategories');
        list.append(empty);
        return;
    }

    [...categories]
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
        .forEach((category) => list.append(createCategoryItem(category, categories, assignments)));
}

function applySettingsToForm(settings) {
    getElement(DOM_IDS.hideShorts).checked = settings.doHideShorts;
    getElement(DOM_IDS.hideWatched).checked = settings.doHideWatched;
    getElement(DOM_IDS.hideExpandable).checked = settings.doHideExpandableSections;
    getElement(DOM_IDS.lengthEnabled).checked = settings.doFadeByLength;
    getElement(DOM_IDS.lengthMin).value = String(settings.videoLengthMin);
    getElement(DOM_IDS.lengthMax).value = String(settings.videoLengthMax);
    getElement(DOM_IDS.lengthMode).value = settings.videoLengthMode;
    getElement(DOM_IDS.viewsEnabled).checked = settings.doFilterByViews;
    getElement(DOM_IDS.viewsMin).value = String(settings.videoViewsMin);
    getElement(DOM_IDS.viewsMax).value = String(settings.videoViewsMax);
    getElement(DOM_IDS.viewsMode).value = settings.videoViewsMode;
    getElement(DOM_IDS.categoriesEnabled).checked = settings.doCategorizeSubscription;
    updateOptionGroupsState();
}

function bindBooleanSetting(elementId, storageKey, labelKey, afterSave) {
    getElement(elementId).addEventListener('change', (event) => {
        const enabled = event.currentTarget.checked;
        saveSettings(
            { [storageKey]: enabled },
            getMessage(enabled ? 'settingEnabled' : 'settingDisabled', getMessage(labelKey)),
            afterSave
        );
    });
}

function bindRange(minimumId, maximumId, minimumKey, maximumKey, successKey) {
    [minimumId, maximumId].forEach((elementId) => {
        getElement(elementId).addEventListener('change', () => {
            const minimum = Number.parseInt(getElement(minimumId).value, 10);
            const maximum = Number.parseInt(getElement(maximumId).value, 10);
            if (minimum >= maximum) {
                showAlert(getMessage('minimumBelowMaximum'), 'error');
                return;
            }
            saveSettings({ [minimumKey]: minimum, [maximumKey]: maximum }, getMessage(successKey));
        });
    });
}

bindBooleanSetting(DOM_IDS.hideWatched, 'doHideWatched', 'hideWatchedSetting');
bindBooleanSetting(DOM_IDS.hideShorts, 'doHideShorts', 'hideShortsSetting');
bindBooleanSetting(DOM_IDS.hideExpandable, 'doHideExpandableSections', 'hideExpandableSetting');
bindBooleanSetting(DOM_IDS.lengthEnabled, 'doFadeByLength', 'lengthFilterSetting', updateOptionGroupsState);
bindBooleanSetting(DOM_IDS.viewsEnabled, 'doFilterByViews', 'viewsFilterSetting', updateOptionGroupsState);
bindBooleanSetting(DOM_IDS.categoriesEnabled, 'doCategorizeSubscription', 'categoriesSetting');

bindRange(DOM_IDS.lengthMin, DOM_IDS.lengthMax, 'videoLengthMin', 'videoLengthMax', 'lengthUpdated');
bindRange(DOM_IDS.viewsMin, DOM_IDS.viewsMax, 'videoViewsMin', 'videoViewsMax', 'viewsUpdated');

getElement(DOM_IDS.lengthMode).addEventListener('change', (event) => {
    saveSettings({ videoLengthMode: event.currentTarget.value }, getMessage('modeUpdated', event.currentTarget.value));
});
getElement(DOM_IDS.viewsMode).addEventListener('change', (event) => {
    saveSettings({ videoViewsMode: event.currentTarget.value }, getMessage('modeUpdated', event.currentTarget.value));
});

getElement(DOM_IDS.categoryForm).addEventListener('submit', (event) => {
    event.preventDefault();
    const input = getElement(DOM_IDS.categoryName);
    const name = normalizeName(input.value);
    if (!name) {
        showAlert(getMessage('nameRequired'), 'error');
        return;
    }

    readSettings(({ categories, channelCategoryAssigned }) => {
        if (hasDuplicateCategoryName(categories, name)) {
            showAlert(getMessage('duplicateCategory', name), 'error');
            return;
        }

        const nextCategories = [...categories, { id: createCategoryId(), name }];
        saveSettings({ categories: nextCategories }, getMessage('categoryAdded', name), () => {
            input.value = '';
            input.focus();
            renderCategories(nextCategories, channelCategoryAssigned);
        });
    });
});

getElement(DOM_IDS.reset).addEventListener('click', () => {
    saveSettings(DEFAULT_OPTIONS, getMessage('settingsReset'), () => {
        readSettings((settings) => applySettingsToForm(settings));
    });
});

localizePage();
document.title = getMessage('optionsTitle');
getElement(DOM_IDS.version).textContent = `v${chrome.runtime.getManifest().version}`;
readSettings((settings) => {
    applySettingsToForm(settings);
    renderCategories(settings.categories, settings.channelCategoryAssigned);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !STORAGE_KEYS.some((key) => changes[key])) {
        return;
    }

    readSettings((settings) => {
        applySettingsToForm(settings);
        if (!document.querySelector('.sptcl-js-category-editor')) {
            renderCategories(settings.categories, settings.channelCategoryAssigned);
        }
    });
});
