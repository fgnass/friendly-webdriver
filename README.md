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

The top-level function exported by selene is a facade to Selenium's [Builder](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html) class and can be used to create `Se` instances (selene's enhenced version of the [WebDriver](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html) class.

`selene(opts)` Build a new `Se` instance.

__Options:__

* `alerts` The default action to take with an unexpected alert before returning an error.
  Can be either  `"accept"`, `"dismiss"` or `"ignore"`. Defaults to `"dismiss"`.
* `nativeEvents` Whether native events should be used.
* `proxyURL` URL of the proxy to use for the WebDriver's HTTP connections.
* `remoteURL` URL of a remote WebDriver server to use. As an alternative to this method, you may also set the `SELENIUM_REMOTE_URL` environment variable.
* `scrollTo` How elements should be scrolled into view for interaction. Can either be `"top"` or  `"bottom"`.
* `logging` Set the log level of different log types:
  ```json
  {
    "browser": "severe",
    "driver": "debug"
  }
  ```
  Valid types are:  `browser`, `client`, `driver`, `performance` or `server`.
  Valid levels are: `off`, `severe`, `warning`, `info`, `fine`, `finer`, `finest`, `debug` or `all`.


* `capabilities` The desired capabilities when requesting a new session.
* `envOverrrides` Whether to allow the configuration to be overwritten by environment variables. Defaults to `true`.
* `browser` The desired target browser. You may also specify a browser by setting the `SELENIUM_BROWSER` environment variable to `browser[:[version][:platform]]`.

chrome, firefox, edge, ie, opera, safari

## Se

`Se` extends Selenium's [WebDriver](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html) class and adds the following methods on top:

`find(selector)`

`findAll(selector)`

`exists(selector)`

`click(selector)`

`wait(condition, timeout, message)`

`goto(url)`

`fill([attribute], values)`

`getLogMessages()`

## SeElement

`SeElement` extends Selenium's [WebElement](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html) and adds the following methods:

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
