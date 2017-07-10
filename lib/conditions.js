'use strict';

const URL = require('url');
const webdriver = require('selenium-webdriver');

const until = webdriver.until;
const Condition = webdriver.Condition;

const builtIns = {

  stale: until.stalenessOf,

  url(url) {
    return new Condition(`for URL to become ${url}`,
      driver => driver.getCurrentUrl().then(
        current => URL.resolve(current, url) == current
      )
    );
  },

  title(title) {
    if (title instanceof RegExp) return until.titleMatches(title);
    return until.titleIs(title);
  },

  unless(spec) {
    const cond = this.createCondition(spec);
    return new Condition(`unless ${spec}`,
      driver => new webdriver.promise.Promise(
        (res, rej) => {
          cond.fn(driver).then(
            value => {
              const err = new Error(cond.description());
              err.cause = value;
              err.fn = cond.fn;
              rej(err);
            }
          );
        }
      )
    );
  }
};

module.exports = [

  function native(spec) {
    if (spec instanceof Condition) {
      return spec;
    }
    if (webdriver.promise.isPromise(spec)) {
      return new Condition(`promise ${spec}`, () => spec);
    }
    if (typeof spec == 'function') {
      return new Condition(spec.toString(), spec);
    }
  },

  function all(spec) {
    if (Array.isArray(spec)) {
      const conds = spec.map(this.createCondition, this);
      const descriptions = conds.map(c => c.description());
      const desc = ['for all of these:'].concat(descriptions).join('\n* ');

      return new Condition(desc, driver =>
        webdriver.promise.all(conds.map(c => c.fn(driver)))
        .then(values => values.every(Boolean))
      );
    }
  },

  function builtIn(spec) {
    const type = Object.keys(spec).find(key => key in builtIns);
    if (type) return builtIns[type].call(this, spec[type]);
  }
];
