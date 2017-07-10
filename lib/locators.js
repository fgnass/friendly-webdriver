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

  function js(query) {
    if (typeof query === 'object' && typeof query.js == 'function') {
      const fn = query.js;
      return {
        description: fn.name || fn.toString(),
        by(scope) {
          const fwd = scope.driver_ || scope;
          const el = scope.driver_ ? scope : null;
          return fwd.executeScript(fn, el);
        }
      };
    }
  },

  function builtIns(query) {
    if (typeof query === 'function' || query instanceof webdriver.By) {
      return {
        description: query.displayName || query.toString(),
        by: query
      };
    }
    if (typeof query === 'object') {
      for (const key in query) {
        if (query.hasOwnProperty(key) && webdriver.By.hasOwnProperty(key)) {
          return {
            description: `${key} ${query[key]}`,
            by: webdriver.By[key](query[key])
          };
        }
      }
    }
  }
];
