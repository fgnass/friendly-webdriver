var URL = require('url');
var assign = require('object-assign');
var webdriver = require('selenium-webdriver');

var SeActions = require('./actions');
var build = require('./build');
var element = require('./element');
var filters = require('./filters');
var locators = require('./locators');
var until = require('./until');
var Query = require('./query');

var fn = {

  use: function (plugin) {
    plugin(this);
    return this;
  },

  addLocator: function (locator) {
    // TODO keep per instance list of locators
    locators.push(locator);
  },

  addFilter: function (filter) {
    // TODO keep per instance list of filters
    filters.push(filter);
  },

  _decorateElement: function (el) {
    return element(el, this);
  },

  actions: function () {
    return new SeActions(this);
  },

  findElement: function (locator) {
    return this._decorateElement(this.driver.findElement(locator));
  },

  findElements: function (locator) {
    var decorate = this._decorateElement.bind(this);
    return this.driver.findElements(locator).then(function (elements) {
      return elements.map(decorate);
    });
  },

  find: function (q, timeout) {
    var query = Query.create(q);
    return this.wait(query.untilOne(), (timeout || 2000));
  },

  findAll: function (q, timeout) {
    var query = Query.create(q, true);
    return this.wait(query.untilSome(), (timeout || 2000));
  },

  exists: function (locator) {
    if (typeof locator == 'string') {
      locator = { css: locator };
    }
    return this.isElementPresent(locator);
  },

  click: function (selector) {
    return this.find(selector).click();
  },

  wait: function (cond, timeout, message) {
    if (!webdriver.promise.isPromise(cond)
      && !(cond instanceof webdriver.until.Condition)
      && typeof cond != 'function') {

      cond = until(cond);
    }

    var ret = this.driver.wait.call(this, cond, timeout, message);
    if (ret instanceof webdriver.WebElementPromise) {
      ret = element(ret, this);
    }
    return ret;
  },

  then: function () {
    var promise = this.sleep(0);
    return promise.then.apply(promise, arguments);
  },

  goto: function (url) {
    var self = this;
    var base = this.opts.base || '';
    var target = URL.resolve(base, url);

    if (this.opts.auth && !this.authenticated) {
      var temp = URL.parse(target);
      temp.auth = this.opts.auth.user + ':' + this.opts.auth.pass;
      this.authenticated = true;
      this.navigate().to(URL.format(temp)).then(function () {
        self.navigate().to(target);
      });
    } else {
      this.navigate().to(target);
    }
  },

  fill: function (attr, values) {
    if (arguments.length == 1) {
      values = attr;
      attr = 'name';
    }
    var self = this;
    Object.keys(values).forEach(function (name) {
      var f = self.find('[' + attr + '=' + name + ']');
      f.clear().type(values[name]);
    });
  },

  reloadUntil: function (query, timeout) {
    return this.wait({ reloadUntil: query }, (timeout || 2000));
  },

  getLogMessages: function (type, level) {
    var t = webdriver.logging.Type[type.toUpperCase()];
    if (!t) throw new Error('No such log type: ' + type);
    return this.manage().logs().get(t).then(function (entries) {
      return entries
        .filter(function (entry) {
          return !level || level.toUpperCase() == entry.level.name;
        })
        .map(function (entry) {
          return entry.message;
        });
    });
  }
};

function se(driver, opts) {
  return assign(Object.create(driver), fn, {
    opts: opts || {},
    driver: driver
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
