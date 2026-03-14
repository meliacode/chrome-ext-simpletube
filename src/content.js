/**
 * Chrome Extension Content Script.
 * Will run on all YouTube page.
 */

/**
 * Constants
 */

const SELECTOR_VIDEO_ITEM = 'ytd-rich-item-renderer';
const SELECTOR_WATCHED_PROGRESS = 'yt-thumbnail-overlay-progress-bar-view-model';
const SELECTOR_VIDEO_DURATION = 'yt-thumbnail-badge-view-model badge-shape div';
const SELECTOR_VIDEO_METADATA = 'yt-content-metadata-view-model span';
const SELECTOR_SHORTS_SECTION = 'ytd-rich-shelf-renderer[is-shorts]';
const SELECTOR_EXPANDABLE_SECTION = 'ytd-rich-shelf-renderer[has-expansion-button]';

/**
 * Main
 */

chrome.storage.sync.get(
    [
        'doHideShorts',
        'doHideWatched',
        'doHideExpandableSections',
        'doFadeByLength',
        'videoLengthMax',
        'videoLengthMin',
        'videoLengthMode',
        'doFilterByViews',
        'videoViewsMin',
        'videoViewsMax',
        'videoViewsMode',
    ],
    ({
        doHideShorts,
        doHideWatched,
        doHideExpandableSections,
        doFadeByLength,
        videoLengthMax,
        videoLengthMin,
        videoLengthMode = 'fade',
        doFilterByViews = false,
        videoViewsMin = 0,
        videoViewsMax = 1000000,
        videoViewsMode = 'fade',
    }) => {
        /**
         * Filters videos
         */

        // Hide watched videos (if the option is enabled)
        const hideWatchedVideos = () => {
            const videoElements = document.querySelectorAll(SELECTOR_VIDEO_ITEM);

            videoElements.forEach((video) => {
                const progressBar = video.querySelector(SELECTOR_WATCHED_PROGRESS);

                if (doHideWatched && progressBar) {
                    video.classList.add('spt-hide-watched');
                } else {
                    video.classList.remove('spt-hide-watched');
                }
            });
        };

        // Hide shorts sections (if the option is enabled)
        const hideShortsSections = () => {
            const shortsSections = document.querySelectorAll(SELECTOR_SHORTS_SECTION);

            shortsSections.forEach((shorts) => {
                if (doHideShorts) {
                    shorts.classList.add('spt-hide-shorts');
                } else {
                    shorts.classList.remove('spt-hide-shorts');
                }
            });
        };

        // Hide expandable sections on subscriptions page (if the option is enabled)
        const hideExpandableSections = () => {
            const expandableSections = document.querySelectorAll(SELECTOR_EXPANDABLE_SECTION);

            expandableSections.forEach((section) => {
                if (doHideExpandableSections) {
                    section.classList.add('spt-hide-expandable');
                } else {
                    section.classList.remove('spt-hide-expandable');
                }
            });
        };

        // Apply video length filter (fade or hide) based on settings
        const applyVideoLengthFilter = () => {
            if (!doFadeByLength) return;

            // Select all video elements on the YouTube page
            const videoElements = document.querySelectorAll(SELECTOR_VIDEO_ITEM);

            videoElements.forEach((video) => {
                // Find the element that contains the video duration
                const timeElement = video.querySelector(SELECTOR_VIDEO_DURATION);

                if (!timeElement) return;

                // Split the duration text into parts (e.g., "12:34" or "1:02:34")
                const timeParts = timeElement.textContent.trim().split(':').map(Number);
                let videoMinutes = 0;

                // Calculate the video length in minutes
                if (timeParts.length === 2) {
                    // Format MM:SS
                    videoMinutes = timeParts[0] + timeParts[1] / 60;
                } else if (timeParts.length === 3) {
                    // Format HH:MM:SS
                    videoMinutes = timeParts[0] * 60 + timeParts[1] + timeParts[2] / 60;
                }

                const outOfRange = videoMinutes < videoLengthMin || videoMinutes > videoLengthMax;

                // Logic to either hide or fade the video based on the mode
                if (videoLengthMode === 'hide') {
                    // Hide elements outside the range, show otherwise
                    if (outOfRange) {
                        video.classList.add('spt-hide-length');
                    } else {
                        video.classList.remove('spt-hide-length');
                    }

                    video.classList.remove('spt-fade-length');
                } else {
                    // Default to fade behavior
                    if (outOfRange) {
                        video.classList.add('spt-fade-length');
                    } else {
                        video.classList.remove('spt-fade-length');
                    }

                    video.classList.remove('spt-hide-length');
                }
            });
        };

        const parseViewCountText = (text) => {
            if (!text) return null;

            const VIEW_COUNT_MULTIPLIER = {
                k: 1e3,
                m: 1e6,
                b: 1e9,
            };

            // Normalize the text by removing whitespace and converting to lowercase
            const normalized = text.replace(/\s+/g, '').toLowerCase();
            // Match the numeric part and the optional suffix (k, m, b)
            const match = normalized.match(/(\d+(?:[.,]\d+)?)([kmb])?/);

            if (!match) return null;

            const rawNumber = match[1]; // Extract the numeric part (e.g., "1.2" or "12,3")
            const suffix = match[2] || ''; // Extract the suffix (e.g., "k", "m", "b") or default to empty string

            // If both separators exist, treat commas as thousands separators.
            // Otherwise treat comma as decimal separator for locale formats like 1,2M.
            const numericText =
                rawNumber.includes('.') && rawNumber.includes(',')
                    ? rawNumber.replace(/,/g, '')
                    : rawNumber.replace(',', '.');

            const value = Number(numericText);

            if (Number.isNaN(value)) return null;

            return value * (VIEW_COUNT_MULTIPLIER[suffix] || 1);
        };

        const extractViewCount = (videoElement) => {
            const candidates = new Set();

            // Text would have channel name, view, delimiter, publish time.
            videoElement.querySelectorAll(SELECTOR_VIDEO_METADATA).forEach((metadataElement) => {
                const metadataText = metadataElement.textContent ? metadataElement.textContent.trim() : '';

                if (!metadataText || !/\d/.test(metadataText)) return;

                candidates.add(metadataText);
            });

            // If there is 1 candidate, we assume there is no view count (e.g., live videos, premieres, or unknown metadata format) and return 0 to avoid stale class states.
            if (candidates.size <= 1) {
                return 0;
            }

            // If there are multiple candidates, we parse the view count from the first option.
            return parseViewCountText([...candidates][0]);
        };

        // Apply video views filter (fade or hide) based on settings
        const applyVideoViewsFilter = () => {
            if (!doFilterByViews) return;

            // Select all video elements on the YouTube page
            const videoElements = document.querySelectorAll(SELECTOR_VIDEO_ITEM);

            videoElements.forEach((video) => {
                const viewCount = extractViewCount(video);

                if (!viewCount) return;

                const outOfRange = viewCount < videoViewsMin || viewCount > videoViewsMax;

                // Logic to either hide or fade the video based on the mode
                if (videoViewsMode === 'hide') {
                    if (outOfRange) {
                        video.classList.add('spt-hide-views');
                    } else {
                        video.classList.remove('spt-hide-views');
                    }
                    video.classList.remove('spt-fade-views');
                } else {
                    if (outOfRange) {
                        video.classList.add('spt-fade-views');
                    } else {
                        video.classList.remove('spt-fade-views');
                    }
                    video.classList.remove('spt-hide-views');
                }
            });
        };

        /**
         * Run
         */

        const runOnce = () => {
            hideWatchedVideos();
            hideShortsSections();
            hideExpandableSections();
            applyVideoLengthFilter();
            applyVideoViewsFilter();
        };

        // Run once at startup
        runOnce();

        // Debounce helper
        const debounce = (fn, wait = 300) => {
            let t = null;
            return (...args) => {
                if (t) clearTimeout(t);
                t = setTimeout(() => fn(...args), wait);
            };
        };

        // Observe the document body and run the appropriate renderers when the DOM changes
        const onMutations = debounce(() => {
            runOnce();
        }, 350);

        const observer = new MutationObserver(onMutations);
        observer.observe(document.body, { childList: true, subtree: true });
    }
);
