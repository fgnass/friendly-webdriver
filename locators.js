'use strict';

const webdriver = require('selenium-webdriver');

module.exports = [
  function css(query) {
    if (typeof query === 'string') {
      return {
        description: `css ${query}`,
        by: webdriver.By.css(query)
      };
    }
  },
  function builtIns(query) {
    if (query instanceof webdriver.By) {
      return {
        description: query.toString(),
        by: query
      };
    }
    for (const key in query) {
      if (query.hasOwnProperty(key) && webdriver.By.hasOwnProperty(key)) {
        return {
          description: `${key} ${query[key]}`,
          by: webdriver.By[key](query[key])
        };
      }
    }
  }
];
