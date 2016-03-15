var URL = require('url');
var assign = require('object-assign');
var webdriver = require('selenium-webdriver');

var SeActions = require('./actions');
var build = require('./build');
var element = require('./element');
var filters = require('./filters');
var locators = require('./locators');
var until = require('./until');
var query = require('./query');

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

  actions: function () {
    return new SeActions(this);
  },

  locate: function (q, scope) {
    var locator = query.locate(q);
    var filter = query.filter(q);
    if (!filter) {
      return (scope || this).findElement(locator);
    }
    var elements = (scope || this).findElements(locator);

    var filtered = filter(elements).then(function (filtered) {
      if (!filtered || !filtered.length) throw new webdriver.error.NoSuchElementError();
      return filtered[0];
    });
    return element(new webdriver.WebElementPromise(this, filtered), this);
  },

  locateAll: function (q, scope) {
    var locator = query.locate(q, true);
    var filter = query.filter(q);
    var elements = (scope || this).findElements(locator);
    return filter ? filter(elements) : elements;
  },

  findElement: function (locator) {
    return element(this.driver.findElement(locator), this);
  },

  findElements: function (locator) {
    var self = this;
    return this.driver.findElements(locator).then(function (elements) {
      return elements.map(function (raw) {
        return element(raw, self);
      });
    });
  },

  find: function (query, timeout) {
    return this.wait({ element: query }, (timeout || 2000));
  },

  findAll: function (query, timeout) {
    var self = this;
    return this.wait({ element: query }, (timeout || 2000)).then(function () {
      return self.locateAll(query);
    });
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
