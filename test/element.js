var expect = require('unexpected');
var selene = require('..');

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
    it('is really hard to test', function () {
      var el = se.find('.inner').parent();

      return expect(el.getAttribute('class'), 'when fulfilled', 'to be', 'outer');
    });
  });
});
