'use strict';

const URL = require('url');
const webdriver = require('selenium-webdriver');

const until = webdriver.until;
const Condition = until.Condition;

function all(conds, method) {
  if (conds.length == 1) {
    return conds[0];
  }
  if (!method) method = 'every';

  const descriptions = conds.map(c => c.description());
  const desc = [`for ${method} of these:`].concat(descriptions).join('\n* ');

  return new Condition(desc, driver =>
    webdriver.promise.all(conds.map(cond => cond.fn(driver)))
    .then(values => values[method](Boolean))
  );
}

const builders = {

  url(url) {
    return new Condition(`for URL to become ${url}`,
      driver => driver.getCurrentUrl().then(
        current => URL.resolve(current, url) == current
      )
    );
  },

  title(title) {
    if (title instanceof RegExp) return until.titleMatches(title);
    return until.titles(title);
  },

  unless(spec) {
    const cond = build(spec);
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

function build(spec) {
  // if an array is given wait until ANY condition is satisfied
  if (Array.isArray(spec)) return all(spec.map(build), 'some');

  // if an object is given, wait until ALL props are satisfied
  return all(Object.keys(spec).map(name => {
    if (!builders[name]) throw Error(`no such condition: ${name}`);
    return builders[name](spec[name]);
  }));
}

module.exports = build;
