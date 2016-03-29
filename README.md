# ![Selene](https://raw.githubusercontent.com/LiquidLabsGmbH/selene/master/logo.png)

[![Build Status](https://travis-ci.org/LiquidLabsGmbH/selene.svg?branch=master)](https://travis-ci.org/LiquidLabsGmbH/selene)


The aim of Selene is to provide a WebDriver API with a strong focus on developer experience (DX).

Unlike [other](http://nightwatchjs.org/) [webdriver](http://webdriver.io/) [libraries](https://www.npmjs.com/package/wd), Selene uses the [official Selenium JavaScript](https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs) bindings. This has the big advantage that you __don't need a Selenium server__ in order to control browsers on your local machine. This does not only make things much easier to set up but also makes things considerably faster as it saves a lot of roundtrips.

While being very powerful, the official API sometimes feels a little alien to JavaScript developers as it is very closely modeled after its Java ancestor.

# Usage

```js
var selene = require('selene');

var se = selene();
se.goto('https://www.google.com/');
se.fill({ q: 'selene npm' });
se.click('[jsaction=sf.lck]');
```

# API

The top-level [`selene()`](#configuration) function is a factory for [`Selene`](#selene) instances which are thin wrappers around Selenium `WebDriver` objects.

## Selene

In addition to the [WebDriver API](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html), `Selene` instances provide the following methods:

### goto

`goto(url)`

### find

Returns a [SeElementPromise](#seelementpromise) for the first matching DOM element.

`find(locator, [filter], [timeout])`
  * `locator`: The [locator](#locators) to use
  * `filter`: An optional [filter](#filters)
  * `timeout`: Optional timeout in milliseconds to wait for the element

### findAll

Returns a promise for an `Array` of all matching DOM elements. Takes the same arguments as `find()`.

### click

Shorthand for finding and clicking on an element.

`click(locator, [filter], [timeout])`

### exists

Returns a promise for a boolean value indicating whether the specified element exists.

`exists(locator, [filter])`

### wait

Wraps the Selenium WebDriver [`wait`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html#wait) method to ensure that whenever a `WebElementPromise` would be returned it will actually be a [`SeElementPromise`](#seelementpromise).

`wait(condition, [timeout], [message])`
  * `condition`: The [condition](#conditions) to wait for
  * `timeout`: Optional timeout in milliseconds to wait
  * `message`: Optional error message in case of a timeout

### fill

Fills multiple input elements at once. The input elements are looked up using a CSS attribute selector. By default Selene expects each element to have a unique `name` attribute. Optionally a custom attribute can be specified.

`fill([attribute], values)`
  * `attribute`: Attribute name to use in CSS selectors. Defaults to `name`
  * `values`: The values to be filled in

```js
se.fill({
  user: 'John',
  email: 'john@example.com'
})

// shortcut for:
se.find('[name="user"]').type('John');
se.find('[name="email"]').type('john@example.com');
```

### getLogEntries

Fetches available log entries for a given type since the last call to this method, or from the start of the session.

`getLogMessages(type)`
  * `type`: The log type to fetch. Can be `browser`, `client`, `driver`, `performance` or `server`.

```js
// activate logging
var se = selene({
  logging: {
    browser: 'severe',
    driver: 'debug'
  }
});

// fetch browser logs
se.getLogEntries('browser').then(entries => {
  console.log(entries.map(e => e.message));
});
```


## SeElement

`SeElement` extends Selenium's [WebElement](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html) and adds the following methods:

### `attr(name)`

### `css(prop)`

### `find(locator, [filter], [timeout])`

### `findAll(selector, [filter], [timeout])`

### `parent()`

### `type(text)`

### `fill([attribute], values)`

### `press(chord1, chord2, ...)`

### `dragDrop(target)`

## SeElementPromise

`SeElementPromise` mixes both [`SeElement`](#seelement) and an [A+ compatible](https://promisesaplus.com/) promise interface. This allows calls to the `SeElement` API before the underlying element promise has been fulfilled.

## Selene Options

| Option | Description |
| ------ | ----------- |
| base   | ... |
| auth   | ... |

```js
var se = selene({
  base: 'https://www.example.com/',
  auth: {
    user: 'user',
    pass: 'secret'
  }
});
```


The following options map 1:1 to the underlying WebDriver settings.
For the meaning of each option please refer to the linked Selenium docs.

| Option | Description |
| ------ | ----------- |
| alerts | Sets how [alert popups should be handled](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setAlertBehavior). Can be either  `"accept"`, `"dismiss"` or `"ignore"`. Defaults to `"dismiss"`. |
| nativeEvents | Whether [native events](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setEnableNativeEvents) should be used. |
| proxyURL | URL of the [ proxy](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#usingWebDriverProxy) to use for the WebDriver's HTTP connections. |
| remoteURL | URL of a [remote WebDriver server](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#usingServer) to use. As an alternative to this method, you may also set the `SELENIUM_REMOTE_URL` __environment variable__. |
| scrollTo | How elements should be [scrolled](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setScrollBehavior) into view for interaction. Can either be `"top"` or  `"bottom"`. |
| logging | Set the [log level](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setLoggingPrefs) of different log types. Valid types are:  `browser`, `client`, `driver`, `performance` or `server`. Valid levels are: `off`, `severe`, `warning`, `info`, `fine`, `finer`, `finest`, `debug` or `all`. |
| capabilities | The desired [capabilities](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#withCapabilities) when requesting a new session. |
| envOverrrides | Whether to allow the configuration to be [overwritten by  environment variables](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#disableEnvironmentOverrides). Defaults to `true`. |
| browser | The desired [target browser](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#forBrowser). You may also specify a browser by  setting the `SELENIUM_BROWSER` __environment variable__ to `browser[:[version][:platform]]`. Defaults to `firefox`|


Additionally you can provide browser-specific options under the keys
[`chrome`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setChromeOptions), [`opera`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setOperaOptions), [`safari`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setSafariOptions), [`ie`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setIeOptions), [`edge`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setEdgeOptions) or [`firefox`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setFirefoxOptions).

__NOTE__
> All objects created by Selene inherit from their official counterparts, hence checks like `obj instanceof webdriver.WebDriver` will still pass and you can use Selene as drop-in replacement inside your existing code.


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

    //se.getTitle().then(function (t) {
    //  assert.equal(t, 'selene');
    //});
    //return se; // <-- `se` itself acts as promise
  });
});
```

Note that there is no `done` callback in the example above. Instead it uses mocha's built-in support for promises by returning the `se` object, which itself is a `thenable`.
