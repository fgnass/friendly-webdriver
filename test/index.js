var webdriver = require('selenium-webdriver');
var expect = require('unexpected');
var selene = require('..');

var WebElement = webdriver.WebElement;
var NoSuchElementError = webdriver.error.NoSuchElementError;

var se = selene({
  browser: 'phantomjs',
  base: 'file://' + __dirname + '/fixtures/'
});

describe('index', function () {
  this.timeout(4000);

  describe('#goto', function () {
    it('is really hard to test', function () {
    });
  });

  describe('#find', function () {
    beforeEach(function () {
      se.goto('test.html');
    });

    it('finds a single WebElement by its CSS selector', function () {
      var el = se.find('.single_class');
      return expect(el, 'when fulfilled', 'to be a', WebElement);
    });

    it('finds the first, even if there are multiple elements', function () {
      var el = se.find('.multiple_class');
      return expect(el, 'when fulfilled', 'to be a', WebElement);
    });

    it('raises an error if the element is not present', function () {
      var el = se.find('.not_available');
      return expect(el, 'when rejected', 'to be a', NoSuchElementError);
    });
  });

  describe('#fill', function () {
    beforeEach(function () {
      se.goto('test.html');
    });

    it('finds inputs by the "name" attribute and fills it', function () {
      se.fill({ street: 'NEW_STREET' });
      var value = se.find('[name=\'street\']').attr('value');
      return expect(value, 'to be fulfilled with', 'NEW_STREET');
    });

    it('allows using arbitrary attributes for finding inputs', function () {
      se.fill('id', { street_input: 'NEW_STREET' });
      var value = se.find('#street_input').attr('value');
      return expect(value, 'to be fulfilled with', 'NEW_STREET');
    });

    it('allows filling multiple inputs at once', function () {
      se.fill('id', {
        street_input: 'NEW_STREET',
        zipcode_input: 'NEW_ZIPCODE'
      });
      var zipcode = se.find('#zipcode_input').attr('value');
      var street = se.find('#street_input').attr('value');
      return Promise.all([
        expect(zipcode, 'to be fulfilled with', 'NEW_ZIPCODE'),
        expect(street, 'to be fulfilled with', 'NEW_STREET')
      ]);
    });

    it('clears the input before filling it', function () {
      var el = se.find('#already_filled');
      expect(el.attr('value'), 'to be fulfilled with', 'PREVIOUS_VALUE');

      se.fill('id', { already_filled: 'NEW_VALUE' });
      return expect(el.attr('value'), 'to be fulfilled with', 'NEW_VALUE');
    });
  });

  describe('#exists', function () {
    it('returns true the specified element exists', function () {
      var exists = se.exists('#exists');
      return expect(exists, 'to be fulfilled with', true);
    });

    it('returns false if the specified element does not exist', function () {
      var exists = se.exists('#does_not_exist');
      return expect(exists, 'to be fulfilled with', false);
    });
  });

  describe('#wait', function () {

    describe('when the condition is a promise', function () {
      it('waits for the promise to be resolved', function () {
        var promise = new Promise(function (resolve) {
          setImmediate(function () { resolve('done'); });
        });
        var wait = se.wait(promise, 1000, 'message');
        return expect(wait, 'to be fulfilled with', 'done');
      });
    });

    describe('when the condition is a css selector', function () {
      it('waits for the respective element to appear in the DOM', function () {
        se.find('#delayed_wrapper').click();
        var wait = se.wait('#exists_soon', 501, 'description');
        return expect(wait, 'when fulfilled', 'to be a', WebElement);
      });
    });


    describe('when the condition is a function', function () {
      it('waits for the function to be finished', function () {
        var i = 0;
        function fn() {
          if (i++ > 1) return 'DONE';
        }
        var wait = se.wait(fn, 2000, 'message');
        return expect(wait, 'to be fulfilled with', 'DONE');
      });
    });
  });
});
