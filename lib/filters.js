'use strict';

module.exports = [
  function text(query) {
    if (query.text) {
      const test = matchText(query.text);
      return {
        description: test.description,
        test(el) {
          return el.getText().then(test.test);
        }
      };
    }
  },
  function visible(query) {
    if (query.visible !== undefined) {
      return {
        description: query.visible ? 'visible' : 'invisible',
        test(el) {
          return el.isDisplayed().then(v => v == query.visible);
        }
      };
    }
  }
];

function matchText(expected) {
  if (typeof expected == 'function') {
    return {
      description: `passing ${expected.name || 'function'}()`,
      test: expected
    };
  }
  if (expected instanceof RegExp) {
    return {
      description: `matching ${expected.toString()}`,
      test(text) {
        return expected.test(text);
      }
    };
  }
  return {
    description: `containing ${JSON.stringify(expected)}`,
    test(text) {
      return ~text.indexOf(expected);
    }
  };
}
