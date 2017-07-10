'use strict';

const webdriver = require('selenium-webdriver');

function QueryFactory() {

  const locators = require('./locators').slice();
  const filters = require('./filters').slice();
  const conditions = require('./conditions').slice();

  function Query(selector, filter, timeout) {
    const locator = pick(locators, selector);
    if (!locator) throw new Error(`No locator for ${selector}`);

    this.by = locator.by;
    this.description = locator.description;
    this.timeout = typeof filter == 'number' ? filter : timeout;

    if (typeof filter == 'object') {
      this.filters = pickAll(filters, filter);
      const filterDescription = this.filters.map(f => f.description).join(' and ');
      if (filterDescription) this.description += ` (${filterDescription})`;
    }
  }

  Query.prototype.toString = function () {
    return this.description;
  };

  Query.prototype.one = function (scope) {
    const fwd = scope.driver_ || scope;
    if (this.timeout) return fwd.wait(this.untilOne(scope), this.timeout);
    return this.findOne(scope);
  };

  Query.prototype.all = function (scope) {
    const fwd = scope.driver_ || scope;
    if (this.timeout) return fwd.wait(this.untilSome(scope), this.timeout);
    return this.findAll(scope);
  };

  Query.prototype.assert = function (el) {
    if (!el) {
      throw new webdriver.error.NoSuchElementError(
        `No such element: ${this.description}`
      );
    }
    return el;
  };

  Query.prototype.findOne = function (scope) {
    const fwd = scope.driver_ || scope;
    const el = this.filters
      ? this.all(scope).then(matches => this.assert(matches[0]))
      : scope.findElement(this.by).catch(() => this.assert());

    const elementPromise = new webdriver.WebElementPromise(fwd, el);
    return fwd._decorateElement(elementPromise);
  };

  Query.prototype.findAll = function (scope) {
    const elements = scope.findElements(this.by);
    return this.filters ? this.filter(elements) : elements;
  };

  Query.prototype.filter = function (elements) {
    const filters = this.filters;
    if (!filters) return elements;
    return webdriver.promise.filter(elements, el =>
      webdriver.promise.map(filters,
        f => f.test(el)
      )
      .then(res => res.every(Boolean))
    );
  };

  Query.prototype.untilOne = function (scope) {
    return new webdriver.WebElementCondition(`for ${this}`,
      driver => this.findOne(scope || driver).catch(() => null)
    );
  };

  Query.prototype.untilSome = function (scope) {
    return new webdriver.Condition(`for ${this}`,
      driver => this.findAll(scope || driver).then(
        list => (list && list.length ? list : null)
      )
    );
  };

  return {
    createQuery(locator, filter, timeout) {
      return new Query(locator, filter, timeout);
    },

    createCondition(spec) {
      const condition = pick(conditions, spec);
      if (!condition) throw new Error(`Unsupported condition ${spec}`);
      return condition;
    },

    addLocator(locator) {
      locators.push(locator);
    },

    addFilter(filter) {
      filters.push(filter);
    },

    addCondition(condition) {
      conditions.push(condition);
    }
  };
}

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

module.exports = QueryFactory;
