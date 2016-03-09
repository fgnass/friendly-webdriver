var assign = require('object-assign');
var webdriver = require('selenium-webdriver');

var fn = {

  find: function (locator) {
    return this.driver_.find(locator, this);
  },

  findAll: function (locator) {
    return this.driver_.findAll(locator, this);
  },

  findElement: function (locator) {
    return element(this.rawElement.findElement(locator), this.driver_);
  },

  findElements: function (locator) {
    var selene = this.driver_;
    return webdriver.promise.map(this.rawElement.findElements(locator), function (raw) {
      return element(raw, selene);
    });
  },

  attr: function (name) {
    return this.getAttribute(name);
  },

  css: function (prop) {
    return this.getCssValue(prop);
  },

  clear: function () {
    this.rawElement.clear();
    return this;
  },

  type: function (string) {
    this.sendKeys(string);
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
    this.sendKeys.apply(this, keys);
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
      f.clear().type(values[name]);
    });
    return this;
  },

  parent: function () {
    return this.find(webdriver.By.xpath('..'));
  },

  dragDrop: function (target) {
    var driver = this.getDriver();
    var self = this;
    if (typeof target == 'string') target = driver.find(target);
    if (!webdriver.promise.isPromise(target)) {
      target = webdriver.promise.fulfilled(target);
    }
    target.then(function (location) {
      return driver.actions()
        .mouseMove(location) // fix for target elements that are out of view
        .mouseDown(self)
        .mouseMove(location)
        .mouseUp().perform();
    });
    return this;
  }

};

function element(el, selene) {
  return assign(Object.create(el), {
    driver_: selene,
    rawElement: el
  }, fn);
}

module.exports = element;
