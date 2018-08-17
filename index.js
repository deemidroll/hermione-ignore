'use strict';

function merge(global = [], local = [], excludeElements = []) {
    return [].concat(global, local)
        .filter(selector => !excludeElements.includes(selector));
}

function normalize(input) {
    return typeof input === 'string' ? [input] : input;
}

module.exports = (hermione, opts = {}) => {
    const globalIgnore = opts.globalIgnore || {};

    hermione.on(hermione.events.NEW_BROWSER, (browser) => {
        const assertViewOriginal = browser.assertView;

        browser.addCommand('assertView', (name, selector, options = {}) => {
            options.excludeElements = normalize(options.excludeElements);
            
            // Merge global and local selectors without excluded selectors.
            ['ignoreElements', 'hideElements', 'invisibleElements'].forEach((prop, index, arr) => {
                options[prop] = merge(
                    globalIgnore[`${prop}Elements`],
                    normalize(options[prop]),
                    // Удалить из глобального игнора:
                    // - явно переданные исключения
                    // - селектор, который скриншотится
                    // - другие виды игнора
                    [].concat(
                        options.excludeElements,
                        options.selector,
                        arr.reduce((acc, p) => {
                            return p !== prop ? acc.concat(options[p]) : acc;
                        }, [])
                    )
                );
            });

            let styleString = '';

            if (options.hideElements.length) {
                styleString += options.hideElements.join(',') + '{display:none !important}';
            }

            if (options.invisibleElements.length) {
                styleString += options.invisibleElements.join(',') + '{opacity:0 !important}';
            }

            return browser
                // Add styles before screenshot capturing.
                .execute(function(styleString) {
                    var style = document.createElement('style');
                    style.innerText = styleString;
                    style.setAttribute('id', 'hermione-ignore');
                    document.body.appendChild(style);
                }, styleString)
                .then(() => assertViewOriginal.call(browser, name, selector, options))
                // Remove styles after screenshot capturing.
                .execute(function() {
                    document.body.removeChild(document.getElementById('hermione-ignore'));
                });
        }, true);
    });
};
