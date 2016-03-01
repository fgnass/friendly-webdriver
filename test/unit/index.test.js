var driver = require('selenium-webdriver');
var selene = require('../..');
var expect = require('unexpected');
var path = require('path');
const se = selene({ browser: 'phantomjs', base: 'file://' });
const FIXTURE_URL = path.resolve(__dirname, '../fixtures/test.html');

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
      return expect(se.find('.single_class'), 'when fulfilled', 'to be a', driver.WebElement);
    });

    it('finds only the first element by its css selector, even if there are multiple on the page', function() {
      return expect(se.find('.multiple_class'), 'when fulfilled', 'to be a', driver.WebElement);
    });

    it('raises an error if the element is not present', function() {
      return expect(se.find('.not_available'), 'when rejected', 'to be a', driver.error.NoSuchElementError);
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
      se.fill('id', { street_input: 'NEW_STREET' });

      return expect(se.find('#street_input').attr('value'), 'when fulfilled', 'to be', 'NEW_STREET');
    });

    it('allows filling multiple inputs at once', function() {
      se.fill('id', { street_input: 'NEW_STREET', zipcode_input: 'NEW_ZIPCODE' });

      return Promise.all([
        expect(se.find('#zipcode_input').attr('value'), 'when fulfilled', 'to be', 'NEW_ZIPCODE'),
        expect(se.find('#street_input').attr('value'), 'when fulfilled', 'to be', 'NEW_STREET')
      ]);
    });

    it('clears the input before filling it', function() {
      expect(se.find('#already_filled').attr('value'), 'when fulfilled', 'to be', 'PREVIOUS_VALUE');

      se.fill('id', { already_filled: 'NEW_VALUE' });

      return expect(se.find('#already_filled').attr('value'), 'when fulfilled', 'to be', 'NEW_VALUE');
    });
  });

  describe('#exists', function() {
    it('returns true if an element with the given css selector exists', function() {
      return expect(se.exists('#exists'), 'when fulfilled', 'to be truthy')
    });

    it('returns false if no element with the given css selector exists', function() {
      return expect(se.exists('#does_not_exist'), 'when fulfilled', 'to be falsy')
    });
  });

  describe('#wait', function() {

    describe('when the condition is a promise', function() {
      it('waits for the promise to be resolved', function() {
        var promise = new Promise(function(resolve){
          setTimeout(function() { resolve('fertig') }, 500);
        });

        return expect(se.wait(promise, 1000, 'blub'), 'when fulfilled', 'to be', 'fertig');
      });
    });

    describe('when the condition is a css selector', function() {
      it('waits for the respective element to appear in the DOM', function() {
        se.find('#delayed_wrapper').click();

        var waitingPromise = se.wait('#exists_soon', 501, 'description');
        return expect(waitingPromise, 'when fulfilled', 'to be a', driver.WebElement);
      });
    });


    describe.skip('when the condition is a function', function() {
      it('waits for the function to be finished', function() {
        const longRunningFn = function() {
          setTimeout(function() { return 'DONE' }, 100);
        };
        var waitingPromise = se.wait(longRunningFn, 2000, 'description');
        return expect(waitingPromise, 'when fulfilled', 'to be', 'DONE');
      });
    });
  });
});
