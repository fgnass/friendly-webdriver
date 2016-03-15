var webdriver = require('selenium-webdriver');

var locators = require('./locators');
var filters = require('./filters');

exports.locate = function (q, all) {
  var locator = pick(locators, q, all);
  if (!locator) throw new Error('No locator for ' + q);
  return locator;
};

exports.filter = function (q) {
  var functions = pickAll(filters, q);
  if (!functions.length) return;
  return function (elements) {
    return webdriver.promise.filter(elements, function (el) {
      return webdriver.promise.map(functions, function (filter) {
        return filter(el);
      })
      .then(function (filterResults) {
        return filterResults.every(Boolean);
      });
    });
  };
};

function pick(functions) {
  var args = Array.prototype.slice.call(arguments, 1);
  var ret;
  functions.some(function (fn) {
    ret = fn.apply(null, args);
    return ret;
  });
  return ret;
}

function pickAll(functions) {
  var args = Array.prototype.slice.call(arguments, 1);
  return functions.map(function (fn) {
    return fn.apply(null, args);
  })
  .filter(Boolean);
}
