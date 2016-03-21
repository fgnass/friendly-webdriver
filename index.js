'use strict';

const URL = require('url');
const assign = require('object-assign');
const webdriver = require('selenium-webdriver');
const Timeouts = require('selenium-webdriver/lib/webdriver').Timeouts;

const SeActions = require('./actions');
const build = require('./build');
const element = require('./element');
const filters = require('./filters');
const locators = require('./locators');
const until = require('./until');
const Query = require('./query');

const _implicitlyWait = Timeouts.prototype.implicitlyWait;
Timeouts.prototype.implicitlyWait = function (ms) {
  this.driver_._implicitlyWaitTimeout = ms;
  return _implicitlyWait.call(this, ms);
};

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

  findElement(locator) {
    return this._decorateElement(this.driver.findElement(locator));
  },

  findElements(locator) {
    return this.driver.findElements(locator).then(
      elements => elements.map(el => this._decorateElement(el))
    );
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

  implicitlyWait(opts, cb) {
    const timeout = getTimeout(opts);
    const prevTimeout = this._implicitlyWaitTimeout || 0;

    if (timeout == prevTimeout) return cb();

    this.manage().timeouts().implicitlyWait(timeout);
    const result = cb();
    this.manage().timeouts().implicitlyWait(prevTimeout);
    return result;
  },

  reloadUntil(query, opts) {
    const condition = new webdriver.until.WebElementCondition(`for ${query}`,
      driver => {
        function reload(promise) {
          return promise.catch(() => {
            driver.navigate().refresh();
          });
        }
        if (typeof query === 'function') return reload(query());
        return reload(Query.create(query, opts).one(driver));
      }
    );
    return this.wait(condition, getTimeout(opts));
  },

  find(selector, opts) {
    return Query.create(selector, opts).one(this);
  },

  findAll(selector, opts) {
    return Query.create(selector, opts).all(this);
  },

  exists(selector, opts) {
    return Query.create(selector, opts).one(this).then(res => !!res).catch(() => false);
  },

  click(selector, filter) {
    return this.find(selector, filter).click();
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

  actions() {
    return new SeActions(this);
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

function getTimeout(opts) {
  return typeof opts == 'number' ? opts : opts && opts.timeout || 0;
}

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
