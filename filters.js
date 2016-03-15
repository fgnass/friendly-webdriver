module.exports = [
  function text(query) {
    if (query.text) {
      var test = matchText(query.text);
      return {
        desciption: test.description,
        test: function (el) {
          return el.getText().then(test.test);
        }
      };
    }
  },
  function visible(query) {
    if (query.visible !== undefined) {
      return {
        description: query.visible ? 'visible' : 'invisible',
        test: function (el) {
          return el.isDisplayed().then(function (v) {
            return v == query.visible;
          });
        }
      };
    }
  }
];

function matchText(expected) {
  if (typeof expected == 'function') {
    return {
      desciption: 'passing ' + (expected.name || 'function') + '()',
      test: expected
    };
  }
  if (expected instanceof RegExp) {
    return {
      desciption: 'matching ' + expected.toString(),
      test: function (text) {
        return expected.test(text);
      }
    };
  }
  return {
    decription: 'containing ' + JSON.stringify(expected),
    test: function (text) {
      return ~text.indexOf(expected);
    }
  };
}
