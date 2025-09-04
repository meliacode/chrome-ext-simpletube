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
const SELECTOR_SHORTS_SECTION = 'ytd-rich-shelf-renderer[is-shorts]';

/**
 * Main
 */

chrome.storage.sync.get(
    ['doHideShorts', 'doHideWatched', 'doFadeByLength', 'videoLengthMax', 'videoLengthMin', 'videoLengthMode'],
    ({ doHideShorts, doHideWatched, doFadeByLength, videoLengthMax, videoLengthMin, videoLengthMode = 'fade' }) => {
        /**
         * Filters videos
         */

        // Hide watched videos (if the option is enabled)
        const hideWatchedVideos = () => {
            if (doHideWatched) {
                const videoElements = document.querySelectorAll(SELECTOR_VIDEO_ITEM);

                videoElements.forEach((video) => {
                    const progressBar = video.querySelector(SELECTOR_WATCHED_PROGRESS);

                    if (progressBar) {
                        video.style.display = 'none';
                    }
                });
            }
        };

        // Hide shorts sections (if the option is enabled)
        const hideShortsSections = () => {
            if (doHideShorts) {
                const shortsSections = document.querySelectorAll(SELECTOR_SHORTS_SECTION);

                shortsSections.forEach((shorts) => {
                    shorts.style.display = 'none';
                });
            }
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

                if (videoLengthMode === 'hide') {
                    // Hide elements outside the range, show otherwise
                    video.style.display = outOfRange ? 'none' : '';
                    video.style.opacity = '1';
                } else {
                    // Default to fade behavior
                    video.style.display = '';
                    video.style.opacity = outOfRange ? '0.2' : '1';
                }
            });
        };

        /**
         * Run
         */

        const runOnce = () => {
            hideWatchedVideos();
            hideShortsSections();
            applyVideoLengthFilter();
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
