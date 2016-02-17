var assign = require('object-assign');
var webdriver = require('selenium-webdriver');

var fn = {
  attr: function (name) {
    return this.getAttribute(name);
  },

  css: function (prop) {
    return this.getCssValue(prop);
  },

  find: function (sel) {
    return element(this.findElement({ css: sel }));
  },

  findAll: function (sel) {
    return this.findElements({ css: sel }).map(element);
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
    return this.sendKeys.apply(this, keys);
  },

  fill: function (attr, values) {
    if (arguments.length == 1) {
      if (typeof attr == 'string') {
        this.clear();
        return this.sendKeys(attr);
      }
      values = attr;
      attr = 'name';
    }
    var self = this;
    Object.keys(values).forEach(function (name) {
      self.find('[' + attr + '=' + name + ']').fill(values[name]);
    });
  }
};

function element(el) {
  return assign(Object.create(el), fn);
}

module.exports = element;
