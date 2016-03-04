var webdriver = require('selenium-webdriver');

function filterElementsByText(locator, text) {
  return this.findElements(locator).then(function (elements) {
    return Promise.all(elements.map(function (el) { return el.getText(); }))
      .then(function (texts) {
        var filteredEls = elements.filter(function (el, index) {
          return text == texts[index];
        });

        if (filteredEls.length == 0) {
          throw new webdriver.error.NoSuchElementError();
        }

        return filteredEls[0];
      });
  });
}

module.exports = filterElementsByText;
