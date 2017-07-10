'use strict';

const URL = require('url');
const assign = require('object-assign');
const webdriver = require('selenium-webdriver');

const FwdActions = require('./actions');
const build = require('./build');
const element = require('./element');
const QueryFactory = require('./QueryFactory');

const FriendlyWebDriver = {

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

  reloadUntil(until, timeout, message) {
    const condition = this.createCondition(until);
    const reload = () => { this.navigate().refresh(); };
    const innerWait = () => this.wait(condition, 1).catch(reload);
    return this.wait(innerWait, timeout, message || condition.description);
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

  click(selector, filter, timeout) {
    return this.find(selector, filter, timeout).click();
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
    return this;
  },

  fill(attr, values) {
    if (values === undefined) {
      values = attr;
      attr = 'name';
    }
    Object.keys(values).forEach(name => {
      this.find(`[${attr}=${name}]`).clear().type(values[name]);
    });
    return this;
  },

  actions() {
    return new FwdActions(this);
  },

  getLogEntries(type) {
    const t = webdriver.logging.Type[type.toUpperCase()];
    if (!t) throw new Error(`No such log type: ${type}`);
    return this.manage().logs().get(t);
  },

  use(plugin) {
    plugin(this);
    return this;
  }
};

function decorateDriver(driver, opts) {
  return assign(Object.create(driver), FriendlyWebDriver, new QueryFactory(), {
    opts: opts || {},
    driver
  });
}

function friendlyWebdriver(driver, opts) {
  if (driver && driver instanceof webdriver.WebDriver) {
    return decorateDriver(driver, opts);
  }
  opts = driver || {};
  if (typeof opts == 'string') opts = { base: opts };
  return decorateDriver(build(opts), opts);
}

module.exports = friendlyWebdriver;
module.exports.raw = webdriver;
