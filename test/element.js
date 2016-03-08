var expect = require('unexpected');
var selene = require('..');
var webdriver = require('selenium-webdriver');

var WebElement = webdriver.WebElement;

var se = selene({
  browser: 'phantomjs',
  base: 'file://' + __dirname + '/fixtures/'
});

describe('element', function () {
  this.timeout(4000);

  before(function () {
    se.goto('test.html');
  });

  describe('#parent', function () {
    it('finds the direct parent and returns it as a WebElement', function () {
      var el = se.find({ css: '.inner', text: 'lorem dipsum' }).parent();

      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.attr('class'), 'when fulfilled', 'to be', 'outer');
    });
  });

  describe('#find', function () {
    it('finds sub-elements', function () {
      var el = se.find('.outer').find('.inner');

      expect(el, 'when fulfilled', 'to be a', WebElement);
      expect(el.attr('class'), 'when fulfilled', 'to be', 'inner');
      return expect(el.getText(), 'when fulfilled', 'not to be', 'nested false');
    });

    it('finds sub-elements by text', function () {
      var el = se.find('.outer').find({ css: '.inner', text: 'lorem dipsum' });

      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.getText(), 'when fulfilled', 'to be', 'lorem dipsum');
    });
  });
});
