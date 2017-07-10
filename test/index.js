/* global window */

'use strict';

const expect = require('unexpected');
const webdriver = require('..');

const WebElement = webdriver.raw.WebElement;

const fwd = webdriver({
  browser: 'phantomjs',
  base: `file://${__dirname}/fixtures/`
});

beforeEach(() => fwd.goto('test.html'));
after(() => fwd.quit());

describe('FriendlyWebDriver', () => {

  describe('#goto', () => {
    it('shoud go to another page', () => {
      fwd.goto('other.html');
      return expect(fwd.getTitle(), 'to be fulfilled with', 'other');
    });
  });

  describe('#find', () => {
    it('finds a single WebElement by its CSS selector', () => {
      const el = fwd.find('.occurs_once');
      return expect(el, 'to be a', WebElement).and('to be fulfilled');
    });

    it('finds the first, even if there are multiple elements', () => {
      const el = fwd.find('.occurs_twice');
      return expect(el, 'to be a', WebElement).and('to be fulfilled');
    });

    it('raises an error if the element is not present', () => {
      const el = fwd.find('.not_available');
      return expect(el, 'when rejected', 'to be an', Error);
    });

    it('finds an element if the locator is a function', () => {
      const el = fwd.find(() => fwd.find('.occurs_twice'));
      return expect(el, 'to be a', WebElement).and('to be fulfilled');
    });

    it('includes the displayName of the locator in error messages', () => {
      function locator() {
        return fwd.find('.not_available');
      }
      locator.displayName = 'custom locator name';
      const el = fwd.find(locator);
      return expect(el, 'when rejected', 'to have message',
        'No such element: custom locator name');
    });

    describe('providing a filter', () => {
      it('finds the first element with matching CSS selector and text', () =>
        fwd.find('.with_text', { text: 'correct text' })
        .then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getText(), 'when fulfilled', 'to be', 'correct text');
        })
      );

      it('raises an error if the CSS selector is not present', () => {
        const elPromise = fwd.find('.not_available', { text: 'some_text' });
        return expect(elPromise, 'when rejected', 'to be a', Error);
      });

      it('raises an error if no element with the given text is found', () => {
        const el = fwd.find('.occurs_once', { text: 'text_does_not_exist' });
        return expect(el, 'when rejected', 'to have message',
          'No such element: css .occurs_once (containing "text_does_not_exist")'
        );
      });

      it('matches text using regular expressions', () =>
        fwd.find('.with_text', { text: /correct/ }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getText(), 'when fulfilled', 'to be', 'correct text');
        })
      );

      it('matches text using functions', () => {
        function match(t) {
          return t == 'correct text';
        }
        return fwd.find('.with_text', { text: match }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getText(), 'when fulfilled', 'to be', 'correct text');
        });
      });

      it('filters visible elements', () =>
        fwd.find('.visibility', { visible: true }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getAttribute('innerHTML'), 'to be fulfilled with', 'visible');
        })
      );

      it('filters invisible elements', () =>
        fwd.find('.visibility', { visible: false }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getAttribute('innerHTML'), 'to be fulfilled with', 'invisible');
        })
      );
    });

    describe('having to wait', () => {
      // clicking on #delayed_wrapper, makes .exists_soon appear after 500 milliseconds
      it('waits for the respective element to appear in the DOM', () => {
        fwd.find('#delayed_wrapper').click();
        const wait = fwd.find('.exists_soon', 600);
        return expect(wait, 'when fulfilled', 'to be a', WebElement);
      });

      it('works with an additional text filter', () => {
        fwd.find('#delayed_wrapper').click();
        const wait = fwd.find('.exists_soon', { text: 'correct text' }, 600);
        return expect(wait, 'when fulfilled', 'to be a', WebElement);
      });

      it('fails with the wrong text', () => {
        fwd.find('#delayed_wrapper').click();
        const wait = fwd.find('.exists_soon', { text: 'wrong text' }, 600);
        return expect(wait, 'when rejected', 'to have message',
          /Waiting for css \.exists_soon \(containing "wrong text"\)/
        );
      });
    });
  });

  describe('#findAll', () => {
    it('finds all WebElements by the given CSS selector', () => {
      const els = fwd.findAll('.occurs_twice');

      expect(els, 'when fulfilled', 'to be a', Array);
      return expect(els, 'when fulfilled', 'to have length', 2);
    });
  });

  describe('#fill', () => {
    it('finds inputs by the "name" attribute and fills it', () => {
      fwd.fill({ street: 'NEW_STREET' });
      const value = fwd.find("[name='street']").attr('value');
      return expect(value, 'to be fulfilled with', 'NEW_STREET');
    });

    it('allows using arbitrary attributes for finding inputs', () => {
      fwd.fill('id', { street_input: 'NEW_STREET' });
      const value = fwd.find('#street_input').attr('value');
      return expect(value, 'to be fulfilled with', 'NEW_STREET');
    });

    it('allows filling multiple inputs at once', () => {
      fwd.fill('id', {
        street_input: 'NEW_STREET',
        zipcode_input: 'NEW_ZIPCODE'
      });
      const zipcode = fwd.find('#zipcode_input').attr('value');
      const street = fwd.find('#street_input').attr('value');
      return Promise.all([
        expect(zipcode, 'to be fulfilled with', 'NEW_ZIPCODE'),
        expect(street, 'to be fulfilled with', 'NEW_STREET')
      ]);
    });

    it('clears the input before filling it', () => {
      const el = fwd.find('#already_filled');
      expect(el.attr('value'), 'to be fulfilled with', 'PREVIOUS_VALUE');

      fwd.fill('id', { already_filled: 'NEW_VALUE' });
      return expect(el.attr('value'), 'to be fulfilled with', 'NEW_VALUE');
    });
  });

  describe('#exists', () => {
    it('returns true the specified element exists', () => {
      const exists = fwd.exists('#exists');
      return expect(exists, 'to be fulfilled with', true);
    });

    it('returns false if the specified element does not exist', () => {
      const exists = fwd.exists('#does_not_exist');
      return expect(exists, 'to be fulfilled with', false);
    });
  });

  describe('#wait', () => {
    it('should wait for promises to be resolved', () => {
      const promise = new Promise(
        resolve => setImmediate(() => resolve('done'))
      );
      const wait = fwd.wait(promise, 1000, 'message');
      return expect(wait, 'to be fulfilled with', 'done');
    });

    it('should wait for function results to be fulfilled', () => {
      fwd.find('#delayed_wrapper').click();
      const wait = fwd.wait(() => fwd.exists('.exists_soon'), 2000);
      return expect(wait, 'to be fulfilled with', true);
    });

    it('should wait for the title to match', () => {
      const wait = fwd.wait({ title: 'Friendly WebDriver' }, 2000, 'message');
      return expect(wait, 'to be fulfilled with', true);
    });
  });

  describe('#reloadUntil', () => {

    function setDelayed() {
      window.localStorage.setItem('renderDelayedReloadItem', true);
    }

    function clearStorage() {
      window.localStorage.clear();
    }

    beforeEach(() => {
      setTimeout(() => fwd.executeScript(setDelayed), 100);
    });

    afterEach(() => fwd.executeScript(clearStorage));

    it('supports conditions', () => {
      const wait = fwd.reloadUntil({ title: 'reload-title' });
      return expect(wait, 'to be fulfilled with', true);
    });

    it('supports chained expressions', () => {
      const wait = fwd.reloadUntil(() =>
        (fwd.find('#delayed_wrapper').find('.reload-item'))
      , 2000);
      return expect(wait, 'when fulfilled', 'to be a', WebElement);
    });

  });
});

describe('FwdElement', () => {

  describe('#find', () => {
    it('finds sub-elements', () => {
      const el = fwd.find('.outer').find('.inner');

      expect(el, 'when fulfilled', 'to be a', WebElement);
      expect(el.attr('class'), 'when fulfilled', 'to be', 'inner');
      return expect(el.getText(), 'when fulfilled', 'not to be', 'nested false');
    });

    it('finds sub-elements by text', () => {
      const el = fwd.find('.outer').find('.inner', { text: 'lorem dipsum' });

      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.getText(), 'when fulfilled', 'to be', 'lorem dipsum');
    });

    it('finds sub-elements by executing a function', () => {
      function lastChild(el) {
        return el.lastElementChild;
      }
      const el = fwd.find('.outer').find({ js: lastChild });
      return expect(el.getText(), 'when fulfilled', 'to be', 'lorem dipsum');
    });
  });

  describe('#parent', () => {
    it('finds the direct parent and returns it as a WebElement', () => {
      const el = fwd.find('.child').parent();
      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.attr('class'), 'when fulfilled', 'to be', 'parent');
    });
  });

  describe('#type', () => {
    it('should type values into input fields', () => {
      const el = fwd.find('#already_filled').type('+1');
      return expect(el.attr('value'), 'to be fulfilled with', 'PREVIOUS_VALUE+1');
    });
  });

  describe('#press', () => {
    it('should press keys', () => {
      const el = fwd.find('#street_input').press('a SPACE shift+b space SHIFT-c');
      return expect(el.attr('value'), 'to be fulfilled with', 'a B C');
    });
  });

  describe('#fill', () => {
    it('should fill only inputs that are descendants', () => {
      fwd.find('#nested_form').fill({ street: 'NESTED_STREET' });

      const outerValue = fwd.find('#street_input').attr('value');
      const innerValue = fwd.find('#nested_form input').attr('value');

      return Promise.all([
        expect(outerValue, 'to be fulfilled with', ''),
        expect(innerValue, 'to be fulfilled with', 'NESTED_STREET')
      ]);
    });
  });

});
