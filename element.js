'use strict';

const assign = require('object-assign');
const webdriver = require('selenium-webdriver');

const Query = require('./query');

const fn = {

  find(selector, opts) {
    const query = Query.create(selector, opts);
    return this.driver_.wait(query.untilOne(this), query.timeout);
  },

  findAll(selector, opts) {
    const query = Query.create(selector, opts);
    return this.driver_.wait(query.untilSome(this), query.timeout);
  },

  findElement(locator) {
    const el = this.rawElement.findElement(locator);
    return this.driver_._decorateElement(el);
  },

  findElements(locator) {
    return webdriver.promise.map(
      this.rawElement.findElements(locator),
      el => this.driver_._decorateElement(el)
    );
  },

  attr(name) {
    return this.getAttribute(name);
  },

  css(prop) {
    return this.getCssValue(prop);
  },

  clear() {
    this.rawElement.clear();
    return this;
  },

  type(string) {
    this.sendKeys(string);
    return this;
  },

  /**
   * el.press('ctrl+a', 'ctrl+x')
   */
  press(/* chord1, chord2, ... */) {
    const args = Array.prototype.slice.call(arguments);

    const keys = args.map(chord => {
      const keys = chord.split(/[+-](?!$)/).map(
        key => webdriver.Key[key.toUpperCase()] || key
      );
      if (keys.length) {
        return webdriver.Key.chord.apply(webdriver.Key, keys);
      }
      return keys[0];
    });
    this.sendKeys.apply(this, keys);
    return this;
  },

  fill(attr, values) {
    if (values === undefined) {
      values = attr;
      attr = 'name';
    }
    Object.keys(values).forEach(
      name => this.find(`[${attr}=${name}]`).clear().type(values[name])
    );
    return this;
  },

  parent() {
    return this.find(webdriver.By.xpath('..'));
  },

  dragDrop(target) {
    const driver = this.getDriver();
    const self = this;
    if (typeof target == 'string') target = driver.find(target);
    if (!webdriver.promise.isPromise(target)) {
      target = webdriver.promise.fulfilled(target);
    }
    target.then(location =>
      driver.actions()
      .mouseMove(location) // fix for target elements that are out of view
      .mouseDown(self)
      .mouseMove(location)
      .mouseUp()
      .perform()
    );
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
