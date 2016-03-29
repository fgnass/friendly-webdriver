'use strict';

const URL = require('url');
const assign = require('object-assign');
const webdriver = require('selenium-webdriver');

const SeActions = require('./actions');
const build = require('./build');
const element = require('./element');
const QueryFactory = require('./QueryFactory');

const seleneMixin = {

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

  wait(until, timeout, message) {
    const condition = this.createCondition(until);
    const ret = this.driver.wait.call(this, condition, timeout, message);
    if (ret instanceof webdriver.WebElementPromise) {
      return this._decorateElement(ret);
    }
    return ret;
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
        return reload(this.createQuery(query, opts).one(driver));
      }
    );
    return this.wait(condition, getTimeout(opts));
  },

  find(selector, filter, timeout) {
    return this.createQuery(selector, filter, timeout).one(this);
  },

  findAll(selector, filter, timeout) {
    return this.createQuery(selector, filter, timeout).all(this);
  },

  exists(selector, opts) {
    return this.createQuery(selector, opts).one(this)
      .then(res => !!res).catch(() => false);
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

function decorateDriver(driver, opts) {
  return assign(Object.create(driver), seleneMixin, new QueryFactory(), {
    opts: opts || {},
    driver
  });
}

function selene(driver, opts) {
  if (driver && driver instanceof webdriver.WebDriver) {
    return decorateDriver(driver, opts);
  }
  opts = driver || {};
  if (typeof opts == 'string') opts = { base: opts };
  return decorateDriver(build(opts), opts);
}

module.exports = selene;
module.exports.webdriver = webdriver;
