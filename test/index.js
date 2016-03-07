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

  before(function () {
    se.goto('test.html');
  });

  describe('#goto', function () {
    it('is really hard to test', function () {
    });
  });

  describe('#find', function () {
    it('finds a single WebElement by its CSS selector', function () {
      var el = se.find('.occurs_once');
      return expect(el, 'when fulfilled', 'to be a', WebElement);
    });

    it('finds the first, even if there are multiple elements', function () {
      var el = se.find('.occurs_twice');
      return expect(el, 'when fulfilled', 'to be a', WebElement);
    });

    it('raises an error if the element is not present', function () {
      var el = se.find('.not_available');
      return expect(el, 'when rejected', 'to be a', NoSuchElementError);
    });

    describe('providing a text', function () {
      it('finds the first element with matching CSS selector and text', function () {
        return se.find({ css: '.with_text', text: 'correct text' }).then(function (el) {
          expect(el, 'to be a', WebElement);
          return expect(el.getText(), 'when fulfilled', 'to be', 'correct text');
        });
      });

      it('raises an error if the CSS selector is not present', function () {
        var elPromise = se.find({ css: '.not_available', text: 'some_text' }, 100);

        return expect(elPromise, 'when rejected', 'to be a', Error);
      });

      it('raises an error if no element with the given text is found', function () {
        var elPromise = se.find({ css: '.occurs_once', text: 'text_does_not_exist' }, 100);

        return expect(elPromise, 'when rejected', 'to be a', Error);
      });
    });
  });

  describe('#findAll', function () {
    it('finds all WebElements by the given CSS selector', function () {
      var els = se.findAll('.occurs_twice');

      expect(els, 'when fulfilled', 'to be a', Array);
      return expect(els, 'when fulfilled', 'to have length', 2);
    });
  });

  describe('#fill', function () {
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
      // clicking on #delayed_wrapper, makes .exists_soon appear after 500 milliseconds
      it('waits for the respective element to appear in the DOM', function () {
        se.find('#delayed_wrapper').click();
        var wait = se.wait('.exists_soon', 600);

        return expect(wait, 'when fulfilled', 'to be a', WebElement);
      });

      it('works with an additional text filter', function () {
        se.find('#delayed_wrapper').click();
        var wait = se.wait({ css: '.exists_soon', text: 'correct text' }, 600);

        return expect(wait, 'when fulfilled', 'to be a', WebElement);
      });

      it('fails with the wrong text', function () {
        se.find('#delayed_wrapper').click();
        var wait = se.wait({ css: '.exists_soon', text: 'wrong text' }, 600);

        return expect(wait, 'when rejected', 'to be a', Error);
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
