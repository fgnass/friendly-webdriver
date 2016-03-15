var webdriver = require('selenium-webdriver');

var locators = require('./locators');
var filters = require('./filters');

function Query(q) {
  var locator = pick(locators, q);
  if (!locator) throw new Error('No locator for ' + q);

  this.by = locator.by;
  this.description = locator.description;

  this.filters = pickAll(filters, q);

  var filterDescription = this.filters.map(function (f) {
    return f.description;
  }).join(' and ');

  if (filterDescription) {
    this.descripion += ' (' + filterDescription + ')';
  }
}

Query.prototype.toString = function () {
  return this.description;
};

Query.prototype.one = function (scope) {
  if (!this.filter) return scope.findElement(this.by);

  var el = this.all(scope).then(function (matches) {
    if (!matches || !matches.length) throw new webdriver.error.NoSuchElementError();
    return matches[0];
  });

  var selene = scope.driver_ || scope;
  var elementPromise = new webdriver.WebElementPromise(selene, el);
  return selene._decorateElement(elementPromise);
};

Query.prototype.all = function (scope) {
  var elements = scope.findElements(this.by);
  return this.filter ? this.filter(elements) : elements;
};

Query.prototype.filter = function (elements) {
  var filters = this.filters;
  if (!filters.length) return elements;
  return webdriver.promise.filter(elements, function (el) {
    return webdriver.promise.map(filters, function (filter) {
      return filter.test(el);
    })
    .then(function (filterResults) {
      return filterResults.every(Boolean);
    });
  });
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
