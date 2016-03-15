module.exports = [
  function text(query) {
    if (query.text) {
      return function (el) {
        return el.getText().then(function (text) {
          if (typeof query.text == 'function') {
            return query.text(text);
          }
          if (query.text instanceof RegExp) {
            return query.text.test(text);
          }
          return text.indexOf(query.text) !== -1;
        });
      };
    }
  },
  function visible(query) {
    if (query.visible !== undefined) {
      return function (el) {
        return el.isDisplayed().then(function (v) {
          return v == query.visible;
        });
      };
    }
  }
];
