'use strict';

const expect = require('unexpected');
const selene = require('..');

const WebElement = selene.webdriver.WebElement;

const se = selene({
  browser: 'phantomjs',
  base: `file://${__dirname}/fixtures/`
});

after(() => se.quit());

describe('Se', () => {

  before(() => se.goto('test.html'));

  describe.skip('#goto', () => {
    it('is really hard to test', () => {
    });
  });

  describe('#find', () => {
    it('finds a single WebElement by its CSS selector', () => {
      const el = se.find('.occurs_once');
      return expect(el, 'when fulfilled', 'to be a', WebElement);
    });

    it('finds the first, even if there are multiple elements', () => {
      const el = se.find('.occurs_twice');
      return expect(el, 'when fulfilled', 'to be a', WebElement);
    });

    it('raises an error if the element is not present', () => {
      const el = se.find('.not_available');
      return expect(el, 'when rejected', 'to be an', Error);
    });

    describe('providing a filter', () => {
      it('finds the first element with matching CSS selector and text', () =>
        se.find('.with_text', { text: 'correct text' })
        .then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getText(), 'when fulfilled', 'to be', 'correct text');
        })
      );

      it('raises an error if the CSS selector is not present', () => {
        const elPromise = se.find('.not_available', { text: 'some_text' });
        return expect(elPromise, 'when rejected', 'to be a', Error);
      });

      it('raises an error if no element with the given text is found', () => {
        const el = se.find('.occurs_once', { text: 'text_does_not_exist' });
        return expect(el, 'when rejected', 'to have message',
          'No such element: css .occurs_once (containing "text_does_not_exist")'
        );
      });

      it('matches text using regular expressions', () =>
        se.find('.with_text', { text: /correct/ }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getText(), 'when fulfilled', 'to be', 'correct text');
        })
      );

      it('matches text using functions', () => {
        function match(t) {
          return t == 'correct text';
        }
        return se.find('.with_text', { text: match }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getText(), 'when fulfilled', 'to be', 'correct text');
        });
      });

      it('filters visible elements', () =>
        se.find('.visibility', { visible: true }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getInnerHtml(), 'to be fulfilled with', 'visible');
        })
      );

      it('filters invisible elements', () =>
        se.find('.visibility', { visible: false }).then(el => {
          expect(el, 'to be a', WebElement);
          return expect(el.getInnerHtml(), 'to be fulfilled with', 'invisible');
        })
      );
    });

    describe('having to wait', () => {
      // clicking on #delayed_wrapper, makes .exists_soon appear after 500 milliseconds
      it('waits for the respective element to appear in the DOM', () => {
        se.find('#delayed_wrapper').click();
        const wait = se.find('.exists_soon', 600);
        return expect(wait, 'when fulfilled', 'to be a', WebElement);
      });

      it('works with an additional text filter', () => {
        se.find('#delayed_wrapper').click();
        const wait = se.find('.exists_soon', { text: 'correct text' }, 600);
        return expect(wait, 'when fulfilled', 'to be a', WebElement);
      });

      it('fails with the wrong text', () => {
        se.find('#delayed_wrapper').click();
        const wait = se.find('.exists_soon', { text: 'wrong text' }, 600);
        return expect(wait, 'when rejected', 'to have message',
          /Waiting for css \.exists_soon \(containing "wrong text"\)/
        );
      });
    });
  });

  describe('#findAll', () => {
    it('finds all WebElements by the given CSS selector', () => {
      const els = se.findAll('.occurs_twice');

      expect(els, 'when fulfilled', 'to be a', Array);
      return expect(els, 'when fulfilled', 'to have length', 2);
    });
  });

  describe('#fill', () => {
    it('finds inputs by the "name" attribute and fills it', () => {
      se.fill({ street: 'NEW_STREET' });
      const value = se.find("[name='street']").attr('value');
      return expect(value, 'to be fulfilled with', 'NEW_STREET');
    });

    it('allows using arbitrary attributes for finding inputs', () => {
      se.fill('id', { street_input: 'NEW_STREET' });
      const value = se.find('#street_input').attr('value');
      return expect(value, 'to be fulfilled with', 'NEW_STREET');
    });

    it('allows filling multiple inputs at once', () => {
      se.fill('id', {
        street_input: 'NEW_STREET',
        zipcode_input: 'NEW_ZIPCODE'
      });
      const zipcode = se.find('#zipcode_input').attr('value');
      const street = se.find('#street_input').attr('value');
      return Promise.all([
        expect(zipcode, 'to be fulfilled with', 'NEW_ZIPCODE'),
        expect(street, 'to be fulfilled with', 'NEW_STREET')
      ]);
    });

    it('clears the input before filling it', () => {
      const el = se.find('#already_filled');
      expect(el.attr('value'), 'to be fulfilled with', 'PREVIOUS_VALUE');

      se.fill('id', { already_filled: 'NEW_VALUE' });
      return expect(el.attr('value'), 'to be fulfilled with', 'NEW_VALUE');
    });
  });

  describe('#exists', () => {
    it('returns true the specified element exists', () => {
      const exists = se.exists('#exists');
      return expect(exists, 'to be fulfilled with', true);
    });

    it('returns false if the specified element does not exist', () => {
      const exists = se.exists('#does_not_exist');
      return expect(exists, 'to be fulfilled with', false);
    });
  });

  describe('#wait', () => {
    describe('when the condition is a promise', () => {
      it('waits for the promise to be resolved', () => {
        const promise = new Promise(
          resolve => setImmediate(() => resolve('done'))
        );
        const wait = se.wait(promise, 1000, 'message');
        return expect(wait, 'to be fulfilled with', 'done');
      });
    });

    describe('when the condition is a function', () => {
      it('waits for the function to be finished', () => {
        let i = 0;
        function fn() {
          if (i++ > 1) return 'DONE';
        }
        const wait = se.wait(fn, 2000, 'message');
        return expect(wait, 'to be fulfilled with', 'DONE');
      });
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
      setTimeout(() => se.executeScript(setDelayed), 100);
    });

    afterEach(() =>
      se.executeScript(clearStorage).then(() => se.navigate().refresh())
    );

    it('supports simple css selector', () => {
      const wait = se.reloadUntil('.reload-item');
      return expect(wait, 'when fulfilled', 'to be a', WebElement);
    });

    it('supports text filter', () => {
      const wait = se.reloadUntil({ css: '.reload-item', text: 'correct text' });
      return expect(wait, 'when fulfilled', 'to be a', WebElement);
    });

    it('supports chained expressions', () => {
      const wait = se.reloadUntil(() => se.find('#delayed_wrapper').find('.reload-item'), 2000);
      return expect(wait, 'when fulfilled', 'to be a', WebElement);
    });

  });
});

describe('SeElement', () => {

  before(() => se.goto('test.html'));

  describe('#find', () => {
    it('finds sub-elements', () => {
      const el = se.find('.outer').find('.inner');

      expect(el, 'when fulfilled', 'to be a', WebElement);
      expect(el.attr('class'), 'when fulfilled', 'to be', 'inner');
      return expect(el.getText(), 'when fulfilled', 'not to be', 'nested false');
    });

    it('finds sub-elements by text', () => {
      const el = se.find('.outer').find('.inner', { text: 'lorem dipsum' });

      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.getText(), 'when fulfilled', 'to be', 'lorem dipsum');
    });
  });

  describe('#parent', () => {
    it('finds the direct parent and returns it as a WebElement', () => {
      const el = se.find('.child').parent();
      expect(el, 'when fulfilled', 'to be a', WebElement);
      return expect(el.attr('class'), 'when fulfilled', 'to be', 'parent');
    });
  });

});
