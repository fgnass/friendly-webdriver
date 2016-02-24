var driver = require('selenium-webdriver');
var selene = require('../..');
var expect = require('unexpected');

describe('#find', function() {
  const se = selene();

  beforeEach(function () {
    se.goto('file://' + process.cwd() + '/test/fixtures/test.html');
  })

  it('finds a single element by its css selector and resolves to a selenium WebElement', function() {
    se.find('.SINGLE_CLASS').then(function(result) {
      expect(result, 'to be a', driver.WebElement);
    });

    return se;
  });

  it('finds only the first element by its css selector, even if there are multiple on the page', function() {
    se.find('.MULTIPLE_CLASS').then(function(result) {
      expect(result, 'to be a', driver.WebElement);
    });

    return se;
  });

  it('raises an error if the element is not present', function() {
    se.find('.NOT_AVAILABLE').catch(function(err) {
      expect(err, 'to be a', driver.error.NoSuchElementError);
    })

    return se;
  });
});

