(() => {
    function getMessage(key, substitutions) {
        return chrome.i18n.getMessage(key, substitutions) || key;
    }

    function localizePage() {
        document.documentElement.lang = chrome.i18n.getUILanguage() || 'en';

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = getMessage(element.dataset.i18n);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            element.placeholder = getMessage(element.dataset.i18nPlaceholder);
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
            element.setAttribute('aria-label', getMessage(element.dataset.i18nAriaLabel));
        });
    }

    globalThis.extensionI18n = Object.freeze({ getMessage, localizePage });
})();
