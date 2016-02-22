# ![Selene](https://raw.githubusercontent.com/LiquidLabsGmbH/selene/master/logo.png)

The aim of Selene is to provide a WebDriver API with a strong focus on developer experience (DX).

Unlike [other](http://nightwatchjs.org/) [webdriver](http://webdriver.io/) [libraries](https://www.npmjs.com/package/wd), Selene uses the [official](https://www.npmjs.com/package/selenium-webdriver) Selenium JavaScript bindings. This has the big advantage that you __don't need a Selenium server__ in order to control browsers on your local machine. This does not only make things much easier to set up but also saves

While being very powerful, the official API sometimes feels a little alien to JavaScript developers as it is very closely modeled after its Java ancestor.

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

* `browser` The desired target browser. You may also specify a browser by setting the `SELENIUM_BROWSER` __environment variable__ to `browser[:[version][:platform]]`.

## Se

`Se` extends Selenium's [WebDriver](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html) class and adds the following methods on top:

* `find(locator)` Alias for `findElement` that also accepts strings as locator which are interpreted as CSS selectors.

* `findAll(locator)` Alias for `findElements` that also accepts strings as locator which are interpreted as CSS selectors.

* `exists(locator)` Alias for `isElementPresent` that also accepts strings as locator which are interpreted as CSS selectors.

* `click(locator)` Shorthand for `se.find(locator).click()`

* `fill([attribute], values)`

* `actions` Creates a `SeActions` instance.

* `getLogMessages()`

* `wait(condition, timeout, message)`

* `goto(url)`

## SeElement

`SeElement` extends Selenium's [WebElement](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html) and adds the following methods:

* `attr(name)`

* `css(prop)`

* `find(selector)`

* `findAll(selector)`

* `dragDrop(target)`

* `type(text)`

* `press(chord1, chord2, ...)`

* `fill([attribute], values)`

## SeActions

`SeActions` extends Selenium's [ActionSequence](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/actions_exports_ActionSequence.html) and adds the following method:

* `exec(script, args)` Executes arbitrary JavaScript

## Test runners

Selene does not come with its own test runner nor is it bound to a specific assertion framework. You can use whatever tool you want for that. The following example uses [Mocha](https://mochajs.org/) and Node's built-in assertions.

```js
var assert = require('assert');
var selene = require('selene');

describe('Google', function () { // <-- no `done` callback here

  this.timeout(60000); // don't timeout too quickly

  it('should go to the selene npm page', function () {
    var se = selene();
    se.goto('https://www.google.com/');
    se.fill({ q: 'selene npm' });
    se.click('[jsaction=sf.lck]');
    se.wait({ url: 'https://www.npmjs.com/package/selene' });

    se.getTitle().then(function (t) {
      assert.equal(t, 'selene');
    });
    return se; // <-- `se` itself acts as promise
  });
});
```

Note that there is no `done` callback in the example above. Instead it uses mocha's built-in support for promises by returning the `se` object, which itself is a `thenable`.

## Use it as drop-in replacement
All objects created by Selene inherit from their official counterparts, hence checks like `obj instanceof webdriver.WebDriver` will still pass and you can use Selene as drop-in replacement inside your existing code.

This means that you can also use tools like [unexpected-webdriver](https://www.npmjs.com/package/unexpected-webdriver) which mixes very well Selene.
