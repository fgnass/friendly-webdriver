var assign = require('object-assign');
var webdriver = require('selenium-webdriver');
var filterElementsByText = require('./filterElementsByText');

var fn = {

  find: function (locator) {
    if (typeof locator == 'string') {
      locator = { css: locator };
    }

    if (locator.text) {
      var el = filterElementsByText.bind(this)(locator);
      var webElementPromise = new webdriver.WebElementPromise(webdriver, el);

      return element(webElementPromise, this.getDriver());
    }

    return element(this.findElement(locator), this.getDriver());
  },

  findAll: function (sel) {
    var driver = this.getDriver();
    return this.findElements({ css: sel }).map(function (raw) {
      return element(raw, driver);
    });
  },

  then: function () {
    return this.promise.then.apply(this.promise, arguments);
  },

  catch: function () {
    return this.promise.catch.apply(this.promise, arguments);
  },

  clear: function () {
    this.promise = this.rawElement.clear();
    return this;
  },

  attr: function (name) {
    this.promise = this.getAttribute(name);
    return this.promise;
  },

  css: function (prop) {
    this.promise = this.getCssValue(prop);
    return this.promise;
  },

  type: function (string) {
    this.promise = this.sendKeys(string);
    return this;
  },

  /**
   * el.press('ctrl+a', 'ctrl+x')
   */
  press: function (/* chord1, chord2, ... */) {
    var args = Array.prototype.slice.call(arguments);
    var keys = args.map(function (chord) {
      var keys = chord.split(/[+-](?!$)/).map(function (key) {
        return webdriver.Key[key.toUpperCase()] || key;
      });
      if (keys.length) {
        return webdriver.Key.chord.apply(webdriver.Key, keys);
      }
      return keys[0];
    });
    this.promise = this.sendKeys.apply(this, keys);
    return this;
  },

  fill: function (attr, values) {
    if (arguments.length == 1) {
      values = attr;
      attr = 'name';
    }
    var self = this;
    Object.keys(values).forEach(function (name) {
      var f = self.find('[' + attr + '=' + name + ']');
      self.promise = f.clear().type(values[name]);
    });
    return this;
  },

  parent: function () {
    return element(this.findElement(webdriver.By.xpath('..')), this.getDriver());
  },

  dragDrop: function (target) {
    var driver = this.getDriver();
    var self = this;
    if (typeof target == 'string') target = driver.find(target);
    if (!webdriver.promise.isPromise(target)) {
      target = webdriver.promise.fulfilled(target);
    }
    this.promise = target.then(function (location) {
      return driver.actions()
        .mouseMove(location) // fix for target elements that are out of view
        .mouseDown(self)
        .mouseMove(location)
        .mouseUp().perform();
    });
    return this;
  }

};

function element(el, driver) {
  return assign(Object.create(el), {
    driver_: driver,
    rawElement: el,
    promise: webdriver.promise.fulfilled(el)
  }, fn);
}

module.exports = element;
