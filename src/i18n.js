(() => {
    // SimpleTube localization selectors.
    const SELECTOR_I18N = '[data-sptcl-i18n]';
    const SELECTOR_I18N_PLACEHOLDER = '[data-sptcl-i18n-placeholder]';
    const SELECTOR_I18N_ARIA_LABEL = '[data-sptcl-i18n-aria-label]';

    function getMessage(key, substitutions) {
        return chrome.i18n.getMessage(key, substitutions) || key;
    }

    function localizePage() {
        document.documentElement.lang = chrome.i18n.getUILanguage() || 'en';

        document.querySelectorAll(SELECTOR_I18N).forEach((element) => {
            element.textContent = getMessage(element.dataset.sptclI18n);
        });

        document.querySelectorAll(SELECTOR_I18N_PLACEHOLDER).forEach((element) => {
            element.placeholder = getMessage(element.dataset.sptclI18nPlaceholder);
        });

        document.querySelectorAll(SELECTOR_I18N_ARIA_LABEL).forEach((element) => {
            element.setAttribute('aria-label', getMessage(element.dataset.sptclI18nAriaLabel));
        });
    }

    globalThis.extensionI18n = Object.freeze({ getMessage, localizePage });
})();
