/**
 * General YouTube filtering content script.
 */

const SELECTOR_VIDEO_ITEM = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer[is-search]',
    'ytd-item-section-renderer ytd-video-renderer',
].join(', ');
const SELECTOR_WATCHED_PROGRESS = 'yt-thumbnail-overlay-progress-bar-view-model';
const SELECTOR_VIDEO_DURATION = [
    'yt-thumbnail-badge-view-model badge-shape div',
    'ytd-thumbnail-overlay-time-status-renderer badge-shape div',
].join(', ');
const SELECTOR_VIDEO_METADATA = ['yt-content-metadata-view-model span', 'ytd-video-meta-block span'].join(', ');
const SELECTOR_SHORTS_SECTION = 'ytd-rich-shelf-renderer[is-shorts]';
const SELECTOR_EXPANDABLE_SECTION = 'ytd-rich-shelf-renderer[has-expansion-button]';

const CLASS_JS_FADE_LENGTH = 'sptcl-js-fade-length';
const CLASS_JS_HIDE_LENGTH = 'sptcl-js-hide-length';
const CLASS_JS_FADE_VIEWS = 'sptcl-js-fade-views';
const CLASS_JS_HIDE_VIEWS = 'sptcl-js-hide-views';
const CLASS_JS_HIDE_SHORTS = 'sptcl-js-hide-shorts';
const CLASS_JS_HIDE_WATCHED = 'sptcl-js-hide-watched';
const CLASS_JS_HIDE_EXPANDABLE = 'sptcl-js-hide-expandable';

const DEFAULT_SETTINGS = {
    doHideShorts: false,
    doHideWatched: false,
    doHideExpandableSections: false,
    doFadeByLength: true,
    videoLengthMin: 0,
    videoLengthMax: 30,
    videoLengthMode: 'fade',
    doFilterByViews: false,
    videoViewsMin: 0,
    videoViewsMax: 1000000,
    videoViewsMode: 'fade',
};
const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS);

let currentSettings = { ...DEFAULT_SETTINGS };
let renderTimeoutId;

function getVideoElements() {
    return document.querySelectorAll(SELECTOR_VIDEO_ITEM);
}

function hideWatchedVideos() {
    getVideoElements().forEach((video) => {
        const shouldHide = currentSettings.doHideWatched && video.querySelector(SELECTOR_WATCHED_PROGRESS);
        video.classList.toggle(CLASS_JS_HIDE_WATCHED, Boolean(shouldHide));
    });
}

function hideShortsSections() {
    document.querySelectorAll(SELECTOR_SHORTS_SECTION).forEach((section) => {
        section.classList.toggle(CLASS_JS_HIDE_SHORTS, currentSettings.doHideShorts);
    });
}

function hideExpandableSections() {
    document.querySelectorAll(SELECTOR_EXPANDABLE_SECTION).forEach((section) => {
        section.classList.toggle(CLASS_JS_HIDE_EXPANDABLE, currentSettings.doHideExpandableSections);
    });
}

function getVideoMinutes(video) {
    const timeElement = video.querySelector(SELECTOR_VIDEO_DURATION);
    if (!timeElement) {
        return null;
    }

    const timeParts = timeElement.textContent.trim().split(':').map(Number);
    if (timeParts.some(Number.isNaN)) {
        return null;
    }
    if (timeParts.length === 2) {
        return timeParts[0] + timeParts[1] / 60;
    }
    if (timeParts.length === 3) {
        return timeParts[0] * 60 + timeParts[1] + timeParts[2] / 60;
    }
    return null;
}

function applyRangeState(element, outOfRange, mode, fadeClass, hideClass) {
    element.classList.toggle(fadeClass, outOfRange && mode !== 'hide');
    element.classList.toggle(hideClass, outOfRange && mode === 'hide');
}

function applyVideoLengthFilter() {
    getVideoElements().forEach((video) => {
        if (!currentSettings.doFadeByLength) {
            video.classList.remove(CLASS_JS_FADE_LENGTH, CLASS_JS_HIDE_LENGTH);
            return;
        }

        const videoMinutes = getVideoMinutes(video);
        if (videoMinutes === null) {
            video.classList.remove(CLASS_JS_FADE_LENGTH, CLASS_JS_HIDE_LENGTH);
            return;
        }

        const outOfRange =
            videoMinutes < currentSettings.videoLengthMin || videoMinutes > currentSettings.videoLengthMax;
        applyRangeState(video, outOfRange, currentSettings.videoLengthMode, CLASS_JS_FADE_LENGTH, CLASS_JS_HIDE_LENGTH);
    });
}

function parseViewCountText(text) {
    if (!text) {
        return null;
    }

    const multipliers = { k: 1e3, m: 1e6, b: 1e9 };
    const match = text
        .replaceAll(/\s+/g, '')
        .toLowerCase()
        .match(/(\d+(?:[.,]\d+)?)([kmb])?/);
    if (!match) {
        return null;
    }

    const rawNumber = match[1];
    const numericText =
        rawNumber.includes('.') && rawNumber.includes(',')
            ? rawNumber.replaceAll(',', '')
            : rawNumber.replace(',', '.');
    const value = Number(numericText);
    return Number.isNaN(value) ? null : value * (multipliers[match[2] || ''] || 1);
}

function extractViewCount(video) {
    const candidates = new Set();
    video.querySelectorAll(SELECTOR_VIDEO_METADATA).forEach((metadataElement) => {
        const metadataText = metadataElement.textContent?.trim() || '';
        if (metadataText && /\d/.test(metadataText)) {
            candidates.add(metadataText);
        }
    });

    return candidates.size > 1 ? parseViewCountText([...candidates][0]) : null;
}

function applyVideoViewsFilter() {
    getVideoElements().forEach((video) => {
        if (!currentSettings.doFilterByViews) {
            video.classList.remove(CLASS_JS_FADE_VIEWS, CLASS_JS_HIDE_VIEWS);
            return;
        }

        const viewCount = extractViewCount(video);
        if (viewCount === null) {
            video.classList.remove(CLASS_JS_FADE_VIEWS, CLASS_JS_HIDE_VIEWS);
            return;
        }

        const outOfRange = viewCount < currentSettings.videoViewsMin || viewCount > currentSettings.videoViewsMax;
        applyRangeState(video, outOfRange, currentSettings.videoViewsMode, CLASS_JS_FADE_VIEWS, CLASS_JS_HIDE_VIEWS);
    });
}

function render() {
    hideWatchedVideos();
    hideShortsSections();
    hideExpandableSections();
    applyVideoLengthFilter();
    applyVideoViewsFilter();
}

function scheduleRender() {
    window.clearTimeout(renderTimeoutId);
    renderTimeoutId = window.setTimeout(render, 350);
}

function loadSettings(callback = render) {
    chrome.storage.sync.get(SETTINGS_KEYS, (stored) => {
        currentSettings = { ...DEFAULT_SETTINGS, ...stored };
        callback();
    });
}

new MutationObserver(scheduleRender).observe(document.documentElement, {
    childList: true,
    subtree: true,
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && SETTINGS_KEYS.some((key) => changes[key])) {
        loadSettings();
    }
});

loadSettings();
