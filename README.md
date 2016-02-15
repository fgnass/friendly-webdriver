# ![Selene](logo.svg)

### [EXPERIMENTAL]

The aim of Selene is to provide a WebDriver API with a strong focus on developer experience.

Unlike [various](http://nightwatchjs.org/) [other](http://webdriver.io/) [approaches](https://www.npmjs.com/package/wd) it uses the [official](https://www.npmjs.com/package/selenium-webdriver) Selenium WebDriver JavaScript bindings, which has the big advantage that you __don't need__ a Selenium server in order to control browsers on your local machine.

While being very powerful, the official API sometimes feels a little alien to JavaScript developers as it is very closely modeled after its Java ancestor.

All objects created by Selene inherit from their official counterparts, hence checks like `obj instanceof webdriver.WebDriver` will still pass and you can use Selene as drop-in replacement inside your existing code.

This means that you can also use tools like [unexpected-webdriver](https://www.npmjs.com/package/unexpected-webdriver) which mixes very well Selene.

# Usage

```js
var selene = require('selene');

var se = selene();
se.goto('https://www.google.com/');
se.fill({ q: 'selene npm' });
se.click('[jsaction=sf.lck]');
```

## Base URL and authentication

```js
var se = selene({
  base: 'https://www.example.com/',
  auth: {
    user: 'user',
    pass: 'secret'
  }
});
```

# API

## Se

`selene()`

`se.find(selector)`

`se.findAll(selector)`

`se.click(selector)`

`se.exists(selector)`

`se.wait(condition, timeout, message)`

`goto(url)`

`fill([attribute], values)`

## SeElement

`attr(name)`

`css(prop)`

`find(selector)`

`findAll(selector)`

`press(chord1, chord2, ...)`

`fill(text)`
`fill([attribute], values)`

## Mocha

Selene does not come with its own test runner nor is it bound to a specific assertion framework. You can use whatever tool you want for that. The following example uses mocha and Node's built-in assertions.

```js
var assert = require('assert');
var selene = require('selene');

describe('Google', function() { // <-- no `done` callback here

  it('should go to the selene npm page', function() {
    var se = selene();
    se.goto('https://www.google.com/');
    se.fill({ q: 'selene npm' });
    se.click('[jsaction=sf.lck]');
    se.wait({ url: 'https://www.npmjs.com/package/selene' });

    se.title().then(function(t) {
      assert.equal(t, 'selene');
    });
    return se; // <-- `se` itself acts as promise
  });
});
```

Note that there is no `done` callback in the example above. Instead it uses mocha's built-in support for promises by returning the `se` object, which itself is a `thenable`.
