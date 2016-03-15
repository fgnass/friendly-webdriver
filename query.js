var webdriver = require('selenium-webdriver');

var locators = require('./locators');
var filters = require('./filters');

function Query(q, all) {
  this.locator = locate(q, all);
  this.filter = filter(q);
}

Query.prototype.one = function (scope) {
  if (!this.filter) return scope.findElement(this.locator);

  var el = this.all(scope).then(function (matches) {
    if (!matches || !matches.length) throw new webdriver.error.NoSuchElementError();
    return matches[0];
  });

  var selene = scope.driver_ || scope;
  var elementPromise = new webdriver.WebElementPromise(selene, el);
  return selene._decorateElement(elementPromise);
};

Query.prototype.all = function (scope) {
  var elements = scope.findElements(this.locator);
  return this.filter ? this.filter(elements) : elements;
};

Query.prototype.untilOne = function (scope) {
  var self = this;
  return new webdriver.until.WebElementCondition('for ' + this,
    function (driver) {
      return self.one(scope || driver).catch(function () {
        return null;
      });
    }
  );
};

Query.prototype.untilSome = function (scope) {
  var self = this;
  return new webdriver.until.Condition('for ' + this,
    function (driver) {
      return self.all(scope || driver).then(function (elements) {
        return elements && elements.length ? elements : null;
      });
    }
  );
};

function locate(q, all) {
  var locator = pick(locators, q, all);
  if (!locator) throw new Error('No locator for ' + q);
  locator.toString = function () {
    return this.using + ' ' + this.value;
  };
  return locator;
}

function filter(q) {
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
}

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

Query.create = function (q, all) {
  if (q instanceof Query) return q;
  return new Query(q, all);
};

module.exports = Query;
