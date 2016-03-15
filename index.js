'use strict';

const URL = require('url');
const assign = require('object-assign');
const webdriver = require('selenium-webdriver');

const SeActions = require('./actions');
const build = require('./build');
const element = require('./element');
const filters = require('./filters');
const locators = require('./locators');
const until = require('./until');
const Query = require('./query');

const fn = {

  use(plugin) {
    plugin(this);
    return this;
  },

  addLocator(locator) {
    // TODO keep per instance list of locators
    locators.push(locator);
  },

  addFilter(filter) {
    // TODO keep per instance list of filters
    filters.push(filter);
  },

  _decorateElement(el) {
    return element(el, this);
  },

  actions() {
    return new SeActions(this);
  },

  findElement(locator) {
    return this._decorateElement(this.driver.findElement(locator));
  },

  findElements(locator) {
    return this.driver.findElements(locator).then(
      elements => elements.map(el => this._decorateElement(el))
    );
  },

  find(selector, timeout) {
    return this.wait(Query.create(selector).untilOne(), timeout || 2000);
  },

  findAll(selector, timeout) {
    return this.wait(Query.create(selector).untilSome(), timeout || 2000);
  },

  exists(selector) {
    return this.findAll(selector, 1)
      .then(res => !!(res && res.length))
      .catch(() => false);
  },

  click(selector) {
    return this.find(selector).click();
  },

  wait(cond, timeout, message) {
    if (!webdriver.promise.isPromise(cond)
      && !(cond instanceof webdriver.until.Condition)
      && typeof cond != 'function') {

      cond = until(cond);
    }

    const ret = this.driver.wait.call(this, cond, timeout, message);
    if (ret instanceof webdriver.WebElementPromise) {
      return this._decorateElement(ret);
    }
    return ret;
  },

  then(cb) {
    return this.sleep(0).then(cb);
  },

  goto(url) {
    const base = this.opts.base || '';
    const target = URL.resolve(base, url);

    if (this.opts.auth && !this.authenticated) {
      const temp = URL.parse(target);
      temp.auth = [this.opts.auth.user, this.opts.auth.pass].join(':');
      this.authenticated = true;
      this.navigate().to(URL.format(temp)).then(() => this.navigate().to(target));
    } else {
      this.navigate().to(target);
    }
  },

  fill(attr, values) {
    if (values === undefined) {
      values = attr;
      attr = 'name';
    }
    Object.keys(values).forEach(name => {
      this.find(`[${attr}=${name}]`).clear().type(values[name]);
    });
  },

  reloadUntil(query, timeout) {
    return this.wait({ reloadUntil: query }, timeout || 2000);
  },

  getLogMessages(type, level) {
    const t = webdriver.logging.Type[type.toUpperCase()];
    if (!t) throw new Error(`No such log type: ${type}`);
    return this.manage().logs().get(t).then(
      entries => entries
        .filter(entry => !level || level.toUpperCase() == entry.level.name)
        .map(entry => entry.message)
    );
  }
};

function se(driver, opts) {
  return assign(Object.create(driver), fn, {
    opts: opts || {},
    driver
  });
}

function selene(driver, opts) {
  if (driver && driver instanceof webdriver.WebDriver) {
    return se(driver, opts);
  }
  opts = driver || {};
  if (typeof opts == 'string') opts = { base: opts };
  return se(build(opts), opts);
}

selene.addLocator = function (locator) {
  locators.push(locator);
};

module.exports = selene;
module.exports.webdriver = webdriver;
