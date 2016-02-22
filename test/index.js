/* eslint-env mocha */

var expect = require('unexpected');
var selene = require('..');

describe('Selene', function () {

  this.timeout(60000);

  it('should go to the selene npm page', function () {
    var se = selene({
      browser: 'phantomjs'
    });

    se.goto('https://www.google.com/');
    se.find({ name: 'q' }).type('selene npm').press('enter');

    se.wait({ visible: '#resultStats' });
    se.find({ linkText: 'selene - npm' }).click();

    se.wait({ url: 'https://www.npmjs.com/package/selene' });

    expect(se.exists('h1.package-name'), 'to be fulfilled with', true);

    return se;
  });

  it('support drag and drop', function () {
    var se = selene({
      browser: 'phantomjs'
    });

    se.goto('http://bevacqua.github.io/dragula/');

    se.find('#sortable div:last-child').dragDrop('#sortable div:first-child');

    // se.select('', '', function(e1, e2) {
    //   this.actions()
    //     .keyDown('shift')
    //     .click(e1)
    //     .dragAndDrop(e1, e2)
    //     .keyUp('shift')
    //     .perform();
    // });

    return se;
  });
});
