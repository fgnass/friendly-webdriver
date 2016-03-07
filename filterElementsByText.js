var webdriver = require('selenium-webdriver');

function filterElementsByText(locator) {
  var self = this;
  return this.findElements({ css: locator.css }).then(function (elements) {
    return Promise.all(elements.map(function (el) { return el.getText(); }))
      .then(function (texts) {
        var filteredEls = elements.filter(function (el, index) {
          return locator.text == texts[index];
        });

        if (filteredEls.length == 0) {
          if (self instanceof webdriver.WebElementPromise) {
            throw new webdriver.error.NoSuchElementError();
          } else {
            return false;
          }
        }

        return filteredEls[0];
      });
  });
}

module.exports = filterElementsByText;
