var URL = require('url');
var assign = require('object-assign');
var webdriver = require('selenium-webdriver');
var remote = require('selenium-webdriver/remote');

var until = require('./until');
var element = require('./element');

var SeActions = require('./actions');

var locators = [
  function css(query) {
    if (typeof query === 'string') {
      return webdriver.By.css(query);
    }
  },
  function builtIns(query) {
    if (query instanceof webdriver.By) return query;
    for (var key in query) {
      if (query.hasOwnProperty(key) && webdriver.By.hasOwnProperty(key)) {
        return webdriver.By[key](query[key]);
      }
    }
  }
];

var filters = [
  function text(query) {
    if (query.text) {
      return function (el) {
        return el.getText().then(function (text) {
          if (typeof query.text == 'function') {
            return query.text(text);
          }
          if (query.text instanceof RegExp) {
            return query.text.test(text);
          }
          return text.indexOf(query.text) !== -1;
        });
      };
    }
  },
  function visible(query) {
    if (query.visible !== undefined) {
      return function (el) {
        return el.isDisplayed().then(function (v) {
          return v == query.visible;
        });
      };
    }
  }
];

var fn = {

  use: function (plugin) {
    plugin(this);
    return this;
  },

  addLocator: function (locator) {
    this.locators.push(locator);
  },

  addFilter: function (filter) {
    this.filters.push(filter);
  },

  actions: function () {
    return new SeActions(this);
  },

  locate: function (query, scope) {
    var locator = pick(this.locators, query);
    var filters = pickAll(this.filters, query);
    if (!locator) throw new Error('No locator for ' + query);
    if (!filters.length) {
      return (scope || this).findElement(locator);
    }
    var elements = (scope || this).findElements(locator);

    var filtered = elements.then(function (elements) {
      return applyFilters(elements, filters);
    })
    .then(function (filtered) {
      if (!filtered || !filtered.length) throw new webdriver.error.NoSuchElementError();
      return filtered[0];
    });
    return element(new webdriver.WebElementPromise(this, filtered), this);
  },

  locateAll: function (query, scope) {
    var locator = pick(this.locators, query, true);
    var filters = pickAll(this.filters, query);

    var elements = (scope || this).findElements(locator);

    if (!filters.length) return elements;

    return elements.then(function (elements) {
      return applyFilters(elements, filters);
    });
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
    driver: driver,
    locators: locators.slice(),
    filters: filters.slice()
  });
}

function loggingPrefs(opts) {
  if (opts instanceof webdriver.logging.Preferences) return opts;
  var prefs = new webdriver.logging.Preferences();
  Object.keys(opts).forEach(function (key) {
    var type = webdriver.logging.Type[key.toUpperCase()];
    var level = webdriver.logging.Level[opts[key].toUpperCase()];
    if (type === undefined) throw new Error('No such type: ' + key);
    if (level === undefined) throw new Error('No such level: ' + opts[key]);
    prefs.setLevel(type, level);
  });
  return prefs;
}

function build(opts) {
  var b = new webdriver.Builder();
  if (opts.capabilities) b.withCapabilities(opts.capabilities);

  if ('envOverrrides' in opts && !opts.envOverrrides) b.disableEnvironmentOverrides();
  if ('alerts' in opts) b.setAlertBehavior(opts.alerts);
  if ('nativeEvents' in opts) b.setEnableNativeEvents(opts.nativeEvents);
  if ('proxy' in opts) b.setProxy(opts.proxy);
  if ('proxyURL' in opts) b.usingWebDriverProxy(opts.proxyURL);
  if ('remoteURL' in opts) b.usingServer(opts.remoteURL);
  if (opts.logging) b.setLoggingPrefs(loggingPrefs(opts.logging));
  if (opts.scrollTo == 'top') b.setScrollBehavior(0);
  if (opts.scrollTo == 'bottom') b.setScrollBehavior(1);
  if (opts.chrome) b.setChromeOptions(opts.chrome);
  if (opts.firefox) b.setFirefoxOptions(opts.firefox);
  if (opts.edge) b.setEdgeOptions(opts.edge);
  if (opts.ie) b.setIeOptions(opts.ie);
  if (opts.opera) b.setOperaOptions(opts.opera);
  if (opts.safari) b.setSafariOptions(opts.safari);

  var browser = opts.browser || 'firefox';
  b.forBrowser.apply(b, browser.split(':'));

  var driver = b.build();
  driver.getCapabilities().then(function (c) {
    if (c.has('webdriver.remote.sessionid')) {
      driver.setFileDetector(new remote.FileDetector());
    }
  });

  return driver;
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

function pick(functions) {
  var args = Array.prototype.slice.call(arguments, 1);
  var ret;
  functions.some(function (fn) {
    ret = fn.apply(null, args);
    return ret;
  });
  return ret;
}

function pickAll(functions) {
  var args = Array.prototype.slice.call(arguments, 1);
  return functions.map(function (fn) {
    return fn.apply(null, args);
  })
  .filter(Boolean);
}

function applyFilters(elements, filters) {
  return webdriver.promise.filter(elements, function (el) {
    return webdriver.promise.map(filters, function (filter) {
      return filter(el);
    })
    .then(function (filterResults) {
      return filterResults.every(Boolean);
    });
  });
}

module.exports = selene;
module.exports.webdriver = webdriver;
