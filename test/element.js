'use strict';

const expect = require('unexpected');
const selene = require('..');
const webdriver = require('selenium-webdriver');

const WebElement = webdriver.WebElement;

const se = selene({
  browser: 'phantomjs',
  base: `file://${__dirname}/fixtures/`
});

describe('element', function () {
  this.timeout(4000);

  before(() => se.goto('test.html'));

  describe('#parent', () => {
    it('finds the direct parent and returns it as a WebElement', () => {
      const el = se.find('.child').parent();
      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.attr('class'), 'when fulfilled', 'to be', 'parent');
    });
  });

  describe('#find', () => {
    it('finds sub-elements', () => {
      const el = se.find('.outer').find('.inner');

      expect(el, 'when fulfilled', 'to be a', WebElement);
      expect(el.attr('class'), 'when fulfilled', 'to be', 'inner');
      return expect(el.getText(), 'when fulfilled', 'not to be', 'nested false');
    });

    it('finds sub-elements by text', () => {
      const el = se.find('.outer').find({ css: '.inner', text: 'lorem dipsum' });

      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.getText(), 'when fulfilled', 'to be', 'lorem dipsum');
    });
  });
});
