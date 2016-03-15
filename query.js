'use strict';

const webdriver = require('selenium-webdriver');

const locators = require('./locators');
const filters = require('./filters');

function Query(q) {
  const locator = pick(locators, q);
  if (!locator) throw new Error(`No locator for ${q}`);

  this.by = locator.by;
  this.description = locator.description;

  this.filters = pickAll(filters, q);
  const filterDescription = this.filters.map(f => f.description).join(' and ');
  if (filterDescription) this.descripion += ` (${filterDescription})`;
}

Query.prototype.toString = function () {
  return this.description;
};

Query.prototype.one = function (scope) {
  if (!this.filter) return scope.findElement(this.by);

  const el = this.all(scope).then(matches => {
    if (!matches || !matches.length) throw new webdriver.error.NoSuchElementError();
    return matches[0];
  });

  const selene = scope.driver_ || scope;
  const elementPromise = new webdriver.WebElementPromise(selene, el);
  return selene._decorateElement(elementPromise);
};

Query.prototype.all = function (scope) {
  const elements = scope.findElements(this.by);
  return this.filter ? this.filter(elements) : elements;
};

Query.prototype.filter = function (elements) {
  const filters = this.filters;
  if (!filters.length) return elements;
  return webdriver.promise.filter(elements, el =>
    webdriver.promise.map(filters,
      f => f.test(el)
    )
    .then(res => res.every(Boolean))
  );
};

Query.prototype.untilOne = function (scope) {
  return new webdriver.until.WebElementCondition(`for ${this}`,
    driver => this.one(scope || driver).catch(() => null)
  );
};

Query.prototype.untilSome = function (scope) {
  return new webdriver.until.Condition(`for ${this}`,
    driver => this.all(scope || driver).then(
      list => list && list.length ? list : null
    )
  );
};

function pick(functions, query) {
  let ret;
  functions.some(fn => {
    ret = fn(query);
    return ret;
  });
  return ret;
}

function pickAll(functions, query) {
  return functions.map(fn => fn(query)).filter(Boolean);
}

Query.create = function (q, all) {
  if (q instanceof Query) return q;
  return new Query(q, all);
};

module.exports = Query;
