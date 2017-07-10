'use strict';

const assign = require('object-assign');
const webdriver = require('selenium-webdriver');

const FwdElement = {

  find(selector, filter, timeout) {
    return this.driver_.createQuery(selector, filter, timeout).one(this);
  },

  findAll(selector, filter, timeout) {
    return this.driver_.createQuery(selector, filter, timeout).all(this);
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
   * el.press('ctrl+a ctrl+x')
   */
  press(sequence) {
    const keys = sequence.split(/\s+/).map(chord => {
      const keys = chord.split(/[+-](?!$)/).map(
        key => webdriver.Key[key.toUpperCase()] || key
      );
      return webdriver.Key.chord.apply(webdriver.Key, keys);
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
    if (!webdriver.promise.isPromise(target)) {
      target = webdriver.promise.fulfilled(target);
    }
    target.then(location =>
      driver.actions()
      .mouseMove(location) // fix for target elements that are out of view
      .mouseDown(this)
      .mouseMove(location)
      .mouseUp()
      .perform()
    );
    return this;
  }

};

function element(el, fwd) {
  return assign(Object.create(el), {
    driver_: fwd,
    rawElement: el
  }, FwdElement);
}

module.exports = element;
