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
            
            Object.keys(options).forEach(prop => {
                options[prop] = options[prop].filter(selectorInside => selectorInside !== selector)
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
