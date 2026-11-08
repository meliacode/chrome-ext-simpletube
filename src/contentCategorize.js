/**
 * YouTube subscription category assignment and filtering content script.
 */

(() => {
    const { getMessage } = globalThis.extensionI18n;

    const CHANNELS_PATH = '/feed/channels';
    const SUBSCRIPTIONS_PATH = '/feed/subscriptions';
    const SELECTOR_CHANNEL_PAGE = '.ytd-page-manager[page-subtype="subscriptions-channels"]';
    const SELECTOR_CHANNEL_RENDERER = 'ytd-channel-renderer';
    const SELECTOR_SUBSCRIPTION_PAGE = '.ytd-page-manager[page-subtype="subscriptions"]';
    const SELECTOR_SUBSCRIPTION_RENDERER = 'ytd-rich-item-renderer:not(:is(ytd-rich-section-renderer *))';
    const SELECTOR_CHANNEL_LINK = '#main-link.channel-link';
    const SELECTOR_CHANNEL_NAME_LINK = 'yt-content-metadata-view-model a.ytAttributedStringLink';
    const SELECTOR_CHANNEL_ACTIONS = '#buttons';
    const SELECTOR_PROFILE_HEADER =
        'ytd-c4-tabbed-header-renderer, ytd-page-header-renderer, page-header-view-model, yt-page-header-view-model';
    const SELECTOR_PROFILE_SUBSCRIBE = 'ytd-subscribe-button-renderer, yt-subscribe-button-view-model';

    const CATEGORY_ALL = '__all__';
    const CATEGORY_NOT_ASSIGNED = '__unassigned__';
    const CLASS_CATEGORY_SELECT = 'sptcl-js-category-select';
    const CLASS_CATEGORY_OPTION = 'sptcl-js-category-option';
    const CLASS_CHANNEL_FILTER = 'sptcl-js-channel-filter-container';
    const CLASS_SUBSCRIPTION_FILTER = 'sptcl-js-subscription-filter-container';
    const CLASS_FILTER_BUTTON = 'sptcl-js-filter-button';
    const CLASS_HIDE_FILTERED = 'sptcl-js-hide-filtered';

    const SETTINGS_KEYS = ['doCategorizeSubscription', 'categories', 'channelCategoryAssigned'];
    let currentSettings = {
        doCategorizeSubscription: true,
        categories: [],
        channelCategoryAssigned: {},
    };
    let activeFilterId = CATEGORY_ALL;
    let renderTimeoutId;
    let warningCount = 0;
    let profileSubscription = null;

    function warnMissingSelector(selector) {
        if (warningCount >= 5) {
            return;
        }
        warningCount += 1;
        console.warn(`[SimpleTube] Selector "${selector}" was not found.`);
    }

    function getChannelName(block, isChannelPage = false) {
        const channelLink = block.querySelector(isChannelPage ? SELECTOR_CHANNEL_LINK : SELECTOR_CHANNEL_NAME_LINK);
        if (!channelLink?.href) {
            return '';
        }

        try {
            const channelUrl = new URL(channelLink.href, window.location.origin);
            return decodeURIComponent(channelUrl.pathname.split('/').filter(Boolean).at(-1) || '').toLocaleLowerCase(
                'en-US'
            );
        } catch {
            return '';
        }
    }

    function getSortedCategories() {
        return [...currentSettings.categories].sort((left, right) =>
            left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
        );
    }

    function getAssignedCategories() {
        const assignedCategoryIds = new Set(Object.values(currentSettings.channelCategoryAssigned));
        return getSortedCategories().filter(({ id }) => assignedCategoryIds.has(id));
    }

    function getFilterDefinitions(includeUnassigned = false) {
        const categories = includeUnassigned ? getSortedCategories() : getAssignedCategories();
        return [
            { id: CATEGORY_ALL, name: getMessage('allCategories') },
            ...categories,
            ...(includeUnassigned ? [{ id: CATEGORY_NOT_ASSIGNED, name: getMessage('unassigned') }] : []),
        ];
    }

    function setActiveFilter(filterContainer, categoryId) {
        activeFilterId = categoryId;
        filterContainer.querySelectorAll(`.${CLASS_FILTER_BUTTON}`).forEach((button) => {
            if (button.dataset.categoryId === activeFilterId) {
                button.dataset.active = 'true';
            } else {
                delete button.dataset.active;
            }
        });
    }

    function applyFilter(pageContainer, itemSelector, isChannelPage) {
        pageContainer.querySelectorAll(itemSelector).forEach((item) => {
            const channelName = getChannelName(item, isChannelPage);
            const assignedCategoryId = currentSettings.channelCategoryAssigned[channelName];
            const shouldShow =
                activeFilterId === CATEGORY_ALL ||
                (activeFilterId === CATEGORY_NOT_ASSIGNED
                    ? !assignedCategoryId
                    : assignedCategoryId === activeFilterId);
            item.classList.toggle(CLASS_HIDE_FILTERED, !shouldShow);
        });
    }

    function renderFilter(pageContainer, containerClass, itemSelector, isChannelPage, includeUnassigned) {
        const filterDefinitions = getFilterDefinitions(includeUnassigned);
        if (!filterDefinitions.some(({ id }) => id === activeFilterId)) {
            activeFilterId = CATEGORY_ALL;
        }

        let filterContainer = pageContainer.querySelector(`.${containerClass}`);
        if (!filterContainer) {
            filterContainer = document.createElement('div');
            filterContainer.className = containerClass;
            pageContainer.prepend(filterContainer);
        }

        const signature = filterDefinitions.map(({ id, name }) => `${id}:${name}`).join('|');
        if (filterContainer.dataset.signature !== signature) {
            const buttons = filterDefinitions.map(({ id, name }) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = CLASS_FILTER_BUTTON;
                button.dataset.categoryId = id;
                button.textContent = name;
                button.addEventListener('click', () => {
                    setActiveFilter(filterContainer, id);
                    applyFilter(pageContainer, itemSelector, isChannelPage);
                });
                return button;
            });
            filterContainer.replaceChildren(...buttons);
            filterContainer.dataset.signature = signature;
        }

        setActiveFilter(filterContainer, activeFilterId);
        applyFilter(pageContainer, itemSelector, isChannelPage);
    }

    function createCategorySelect(channelName) {
        const select = document.createElement('select');
        select.className = CLASS_CATEGORY_SELECT;
        select.dataset.channelName = channelName;
        select.setAttribute('aria-label', getMessage('categoryForChannel', channelName));

        const unassignedOption = document.createElement('option');
        unassignedOption.value = '';
        unassignedOption.textContent = getMessage('categoryDropdown');
        unassignedOption.className = CLASS_CATEGORY_OPTION;
        select.append(unassignedOption);

        getSortedCategories().forEach(({ id, name }) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            option.className = CLASS_CATEGORY_OPTION;
            select.append(option);
        });

        select.value = currentSettings.channelCategoryAssigned[channelName] || '';
        select.addEventListener('change', () => {
            const nextAssignments = { ...currentSettings.channelCategoryAssigned };
            if (select.value) {
                nextAssignments[channelName] = select.value;
            } else {
                delete nextAssignments[channelName];
            }

            currentSettings = { ...currentSettings, channelCategoryAssigned: nextAssignments };
            chrome.storage.sync.set({ channelCategoryAssigned: nextAssignments }, () => {
                if (chrome.runtime.lastError) {
                    loadSettings(scheduleRender);
                    return;
                }
                scheduleRender();
            });
        });
        return select;
    }

    function renderChannelDropdowns() {
        const categorySignature = getSortedCategories()
            .map(({ id, name }) => `${id}:${name}`)
            .join('|');

        document.querySelectorAll(SELECTOR_CHANNEL_RENDERER).forEach((channelBlock) => {
            const actionsContainer = channelBlock.querySelector(SELECTOR_CHANNEL_ACTIONS);
            const channelName = getChannelName(channelBlock, true);
            if (!actionsContainer || !channelName) {
                return;
            }

            const existingSelect = actionsContainer.querySelector(`.${CLASS_CATEGORY_SELECT}`);
            const isCurrent =
                existingSelect?.dataset.channelName === channelName &&
                existingSelect?.dataset.categorySignature === categorySignature;
            if (isCurrent) {
                existingSelect.value = currentSettings.channelCategoryAssigned[channelName] || '';
                return;
            }

            const select = createCategorySelect(channelName);
            select.dataset.categorySignature = categorySignature;
            existingSelect?.remove();
            actionsContainer.append(select);
        });
    }

    function renderProfileDropdown(path) {
        const match = path.match(/^\/(?:(@[^/]+)|(?:channel|c|user)\/[^/]+)(?:\/|$)/i);
        const header =
            match &&
            [...document.querySelectorAll(SELECTOR_PROFILE_HEADER)].find(
                (element) => !element.closest('ytd-browse[hidden]') && element.querySelector(SELECTOR_PROFILE_SUBSCRIBE)
            );
        const subscribe = header?.querySelector(SELECTOR_PROFILE_SUBSCRIBE);
        subscribe.parentElement.classList.add('sptcl-js-profile-has-category-select');

        if (!header || !subscribe) {
            profileSubscription = null;
            document.querySelectorAll(`.${CLASS_CATEGORY_SELECT}`).forEach((select) => select.remove());
            return;
        }

        const handleLink = header.querySelector('a[href^="/@"], a[href^="https://www.youtube.com/@"]');
        const handleText = header.querySelector('yt-content-metadata-view-model')?.textContent.match(/@[^\s·]+/)?.[0];
        let channelName;
        try {
            const handle = match[1] || (handleLink ? new URL(handleLink.href).pathname.split('/')[1] : handleText);
            channelName = decodeURIComponent(handle || '').toLocaleLowerCase('en-US');
            if (match[1] && channelName !== decodeURIComponent(match[1]).toLocaleLowerCase('en-US')) {
                profileSubscription = null;
                header.querySelector(`.${CLASS_CATEGORY_SELECT}`)?.remove();
                return;
            }
        } catch {
            return;
        }
        if (!channelName?.startsWith('@')) {
            profileSubscription = null;
            header.querySelector(`.${CLASS_CATEGORY_SELECT}`)?.remove();
            return;
        }

        // The modern button uses different shapes for the subscription and
        // notification actions. Treat unrecognized markup as an unknown state.
        let subscribed = null;
        if (subscribe.matches('ytd-subscribe-button-renderer')) {
            subscribed = subscribe.hasAttribute('subscribed');
        } else {
            const button = subscribe.querySelector('.ytSubscribeButtonViewModelContainer > button');
            if (button?.classList.contains('ytSpecButtonShapeNextIconLeadingTrailing')) {
                subscribed = true;
            } else if (button?.classList.contains('ytSpecButtonShapeNextFilled')) {
                subscribed = false;
            }
        }
        if (
            profileSubscription?.channelName === channelName &&
            profileSubscription.subscribed &&
            subscribed === false
        ) {
            const nextAssignments = { ...currentSettings.channelCategoryAssigned };
            if (Object.hasOwn(nextAssignments, channelName)) {
                delete nextAssignments[channelName];
                currentSettings = { ...currentSettings, channelCategoryAssigned: nextAssignments };
                chrome.storage.sync.set({ channelCategoryAssigned: nextAssignments }, () => {
                    if (chrome.runtime.lastError) {
                        loadSettings(scheduleRender);
                    }
                });
            }
        }
        if (subscribed !== null) {
            profileSubscription = { channelName, subscribed };
        }
        if (subscribed !== true) {
            header.querySelector(`.${CLASS_CATEGORY_SELECT}`)?.remove();
            return;
        }

        const categorySignature = getSortedCategories()
            .map(({ id, name }) => `${id}:${name}`)
            .join('|');
        let select = header.querySelector(`.${CLASS_CATEGORY_SELECT}`);
        if (select?.dataset.channelName !== channelName || select?.dataset.categorySignature !== categorySignature) {
            select?.remove();
            select = createCategorySelect(channelName);
            select.dataset.categorySignature = categorySignature;
            select.classList.add('sptcl-js-profile-category-select');
            subscribe.insertAdjacentElement('afterend', select);
        } else if (select.previousElementSibling !== subscribe) {
            subscribe.insertAdjacentElement('afterend', select);
        }
        select.value = currentSettings.channelCategoryAssigned[channelName] || '';
    }

    function clearInjectedUi() {
        document
            .querySelectorAll(`.${CLASS_CATEGORY_SELECT}, .${CLASS_CHANNEL_FILTER}, .${CLASS_SUBSCRIPTION_FILTER}`)
            .forEach((element) => element.remove());
        document
            .querySelectorAll(`.${CLASS_HIDE_FILTERED}`)
            .forEach((element) => element.classList.remove(CLASS_HIDE_FILTERED));
    }

    function render() {
        if (!currentSettings.doCategorizeSubscription) {
            profileSubscription = null;
            clearInjectedUi();
            return;
        }

        const path = window.location.pathname.replace(/\/$/, '');
        if (path === CHANNELS_PATH) {
            profileSubscription = null;
            document.querySelectorAll('.sptcl-js-profile-category-select').forEach((select) => select.remove());
            document.querySelector(`.${CLASS_SUBSCRIPTION_FILTER}`)?.remove();
            renderChannelDropdowns();
            const channelPage = document.querySelector(SELECTOR_CHANNEL_PAGE);
            if (channelPage) {
                renderFilter(channelPage, CLASS_CHANNEL_FILTER, SELECTOR_CHANNEL_RENDERER, true, true);
            } else {
                warnMissingSelector(SELECTOR_CHANNEL_PAGE);
            }
            return;
        }

        if (path === SUBSCRIPTIONS_PATH) {
            profileSubscription = null;
            document
                .querySelectorAll(`.${CLASS_CATEGORY_SELECT}, .${CLASS_CHANNEL_FILTER}`)
                .forEach((element) => element.remove());
            const subscriptionsPage = document.querySelector(SELECTOR_SUBSCRIPTION_PAGE);
            if (subscriptionsPage) {
                renderFilter(
                    subscriptionsPage,
                    CLASS_SUBSCRIPTION_FILTER,
                    SELECTOR_SUBSCRIPTION_RENDERER,
                    false,
                    false
                );
            } else {
                warnMissingSelector(SELECTOR_SUBSCRIPTION_PAGE);
            }
            return;
        }

        document
            .querySelectorAll(`.${CLASS_CHANNEL_FILTER}, .${CLASS_SUBSCRIPTION_FILTER}`)
            .forEach((element) => element.remove());
        document
            .querySelectorAll(`.${CLASS_HIDE_FILTERED}`)
            .forEach((element) => element.classList.remove(CLASS_HIDE_FILTERED));
        document
            .querySelectorAll(`.${CLASS_CATEGORY_SELECT}:not(.sptcl-js-profile-category-select)`)
            .forEach((element) => element.remove());
        renderProfileDropdown(path);
    }

    function scheduleRender() {
        window.clearTimeout(renderTimeoutId);
        renderTimeoutId = window.setTimeout(render, 350);
    }

    function loadSettings(callback = render) {
        chrome.storage.sync.get(SETTINGS_KEYS, (stored) => {
            currentSettings = {
                doCategorizeSubscription: stored.doCategorizeSubscription !== false,
                categories: Array.isArray(stored.categories) ? stored.categories : [],
                channelCategoryAssigned:
                    stored.channelCategoryAssigned && typeof stored.channelCategoryAssigned === 'object'
                        ? stored.channelCategoryAssigned
                        : {},
            };
            callback();
        });
    }

    new MutationObserver((mutations) => {
        if (
            mutations.some(
                (mutation) =>
                    mutation.attributeName !== 'class' || mutation.target.closest?.(SELECTOR_PROFILE_SUBSCRIBE)
            )
        ) {
            scheduleRender();
        }
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['href', 'subscribed', 'class'],
        childList: true,
        subtree: true,
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && SETTINGS_KEYS.some((key) => changes[key])) {
            loadSettings();
        }
    });

    loadSettings();
})();
