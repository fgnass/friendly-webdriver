var driver = require('selenium-webdriver');
var selene = require('../..');
var expect = require('unexpected');
const se = selene({ browser: 'phantomjs', base: 'file://' });
const FIXTURE_URL = process.cwd() + '/test/fixtures/test.html';

describe('index', function() {
  this.timeout(4000);

  describe('#goto', function() {
    it('is really hard to test', function() {
    });
  });

  describe('#find', function() {
    beforeEach(function () {
      se.goto(FIXTURE_URL);
    });

    it('finds a single element by its css selector and resolves to a selenium WebElement', function() {
      return expect(se.find('.SINGLE_CLASS'), 'when fulfilled', 'to be a', driver.WebElement);
    });

    it('finds only the first element by its css selector, even if there are multiple on the page', function() {
      return expect(se.find('.MULTIPLE_CLASS'), 'when fulfilled', 'to be a', driver.WebElement);
    });

    it('raises an error if the element is not present', function() {
      return expect(se.find('.NOT_AVAILABLE'), 'when rejected', 'to be a', driver.error.NoSuchElementError);
    });
  });

  describe('#fill', function() {
    beforeEach(function () {
      se.goto(FIXTURE_URL);
    });

    it('finds inputs by the "name" attribute and fills it', function() {
      se.fill({ street: 'NEW_STREET' });

      return expect(se.find('[name=\'street\']').attr('value'), 'when fulfilled', 'to be', 'NEW_STREET');
    })

    it('allows overwriting the "name" attribute for finding inputs', function() {
      se.fill('id', { STREET_INPUT: 'NEW_STREET' });

      return expect(se.find('#STREET_INPUT').attr('value'), 'when fulfilled', 'to be', 'NEW_STREET');
    });

    it('allows filling multiple inputs at once', function() {
      se.fill('id', { STREET_INPUT: 'NEW_STREET', ZIPCODE_INPUT: 'NEW_ZIPCODE' });

      return Promise.all([
        expect(se.find('#ZIPCODE_INPUT').attr('value'), 'when fulfilled', 'to be', 'NEW_ZIPCODE'),
        expect(se.find('#STREET_INPUT').attr('value'), 'when fulfilled', 'to be', 'NEW_STREET')
      ]);
    });

    it('clears the input before filling it', function() {
      expect(se.find('#ALREADY_FILLED').attr('value'), 'when fulfilled', 'to be', 'PREVIOUS_VALUE');

      se.fill('id', { ALREADY_FILLED: 'NEW_VALUE' });

      return expect(se.find('#ALREADY_FILLED').attr('value'), 'when fulfilled', 'to be', 'NEW_VALUE');
    });
  });
});

