var URL = require('url');
var assign = require('object-assign');
var webdriver = require('selenium-webdriver');
var remote = require('selenium-webdriver/remote');

var until = require('./until');
var element = require('./element');

var SeActions = require('./actions');

var fn = {

  actions: function () {
    return new SeActions(this);
  },

  find: function (locator, timeout) {
    if (typeof locator == 'string') {
      locator = { css: locator };
    }

    if (locator.text) {
      var el = this.wait(locator, timeout || 2000);
      var webElementPromise = new webdriver.WebElementPromise(webdriver, el);

      return element(webElementPromise, this);
    }

    return this.findElement(locator);
  },

  findElement: function (locator) {
    return element(this.driver.findElement(locator), this);
  },

  findAll: function (locator) {
    if (typeof locator == 'string') {
      locator = { css: locator };
    }

    return this.findElements(locator);
  },

  findElements: function (locator) {
    var self = this;
    return this.driver.findElements(locator).then(function (elements) {
      return elements.map(function (raw) {
        return element(raw, self);
      });
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

      if (typeof cond == 'string') {
        cond = { css: cond };
      }

      cond = until(cond);
    }

    return this.driver.wait(cond, timeout, message);
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

module.exports = function selene(driver, opts) {
  if (driver && driver instanceof webdriver.WebDriver) {
    return se(driver, opts);
  }
  opts = driver || {};
  if (typeof opts == 'string') opts = { base: opts };
  return se(build(opts), opts);
};

module.exports.webdriver = webdriver;
