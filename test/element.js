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
      var el = se.find('.inner').parent();

      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.attr('class'), 'when fulfilled', 'to be', 'outer');
    });
  });
});
