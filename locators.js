var webdriver = require('selenium-webdriver');

module.exports = [
  function css(query) {
    if (typeof query === 'string') {
      return webdriver.By.css(query);
    }
  },
  function builtIns(query) {
    if (query instanceof webdriver.By) return query;
    for (var key in query) {
      if (query.hasOwnProperty(key) && webdriver.By.hasOwnProperty(key)) {
        return webdriver.By[key](query[key]);
      }
    }
  }
];
