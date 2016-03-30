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

# Concepts

Selene adds the concept of [locators](#locators), [filters](#filters) and [conditions](#conditions) on top of the WebDriver API and allows [plugins](#plugins) to register their own custom implementations of either of these.

## Locators

By default Selene supports the following locators:

```js
// CSS selectors
se.find('.button');

// XPath expressions
se.find({ xpath: '//main' });

// Custom functions
se.find('ul').find(function (el) {
  return el.firstChild;
});
```

## Filters

When locating elements Selene also provides a way to filter the results. By default the following filters are supported:

```js
se.find('.button', { visible: true });
se.find('.button', { text: 'click me' });
se.find('.button', { text: /click/ });
```

## Conditions

```js
se.wait({ url: '/welcome' }, 2000);
se.wait({ title: /Selene/ }, 2000);
se.wait(() => se.find('.foo').find('.bar'), 2000);
se.wait({ stale: se.find('body') }, 2000);
```

## Plugins

# API

The top-level [`selene()`](#configuration) function is a factory for [`Selene`](#selene) instances which are thin wrappers around Selenium `WebDriver` objects.

## Selene

In addition to the [WebDriver API](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html), `Selene` instances provide the following methods:

### goto

`goto(url)` – Navigates to the given URL. Relative paths will be resolved against the [configured](#configuration) base URL.
Returns `this` for chaining.

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

Wraps the Selenium WebDriver [`wait`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html#wait) method to support custom [conditions](#conditions).

`wait(condition, [timeout], [message])`
  * `condition`: The condition to wait for
  * `timeout`: Optional timeout in milliseconds to wait
  * `message`: Optional error message in case of a timeout

### reloadUntil

Reloads the page until the given condition is met. Takes the same arguments as `wait()`.

### fill

Fills multiple input elements at once. The input elements are looked up using a CSS attribute selector. By default Selene expects each element to have a unique `name` attribute. Optionally a custom attribute can be specified. Returns `this` for chaining.

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

### use

`use(plugin)` – Registers a [plugin](#plugins).

## SeElement

`SeElement` extends Selenium's [WebElement](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html) and adds the following methods:

### attr

`attr(name)` – Returns a promise for the value of the attribute with the specified name. Alias for [`getAttribute(name)`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html#getAttribute)

### css

`css(prop)` – Returns the runtime CSS style of the given property. Alias for [`getCssValue(prop)`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html#getCssValue)

### find

`find(locator, [filter], [timeout])` – Scoped version of [se.find()](#find) that only takes the element's descendants into account.

### findAll

`findAll(selector, [filter], [timeout])` – Scoped version of [se.findAll()](#findAll) that only takes the element's descendants into account.

### fill

`fill([attribute], values)` – Scoped version of [se.fill()](#fill) that only takes the element's descendants into account.


### parent

`parent()` – Returns a `SeElementPromise` for the element's parent node.

### type

`type(text)` – Sends keystrokes to the element to type the given text.

### press

`press(sequence)` – Sends a sequence of key combinations to the element.

The given sequence is split at spaces into _chords_. Each chord is then split at `+` or `-` into _keys_. If a key is not found in the list of  supported [key names]( http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/input_exports_Key.html) all the characters will be pressed at once.

```js
el.press('ctrl+a ctrl+x'); // sequence of 2 chords
el.press('ctrl-alt-delete'); // minus signs work too
el.press('alt++ alt-+ ALT-+'); // synonym
el.press('qwertz'); // press all at once
el.press('h e l l o SPACE w o r l d'); // hello world
```

### dragDrop

`dragDrop(target)` – Drags the element to the given target.

The target can either be a `SeElement` or `{x: number, y: number}` or a promise for either of both.

## SeElementPromise

`SeElementPromise` mixes both [`SeElement`](#seelement) and an [A+ compatible](https://promisesaplus.com/) promise interface. This allows calls to the `SeElement` API before the underlying element promise has been fulfilled.

## Configuration

| Option | Description |
| ------ | ----------- |
| base   | Base URL against which all relative paths are resolved. |
| auth   | Credentials for HTTP basic authentication. |

```js
var se = selene({
  base: 'https://www.example.com/',
  auth: {
    user: 'user',
    pass: 'secret'
  }
});

se.goto('/').click('a[href="/welcome"]').wait({ url: '/welcome' });
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
| envOverrides | Whether to allow the configuration to be [overwritten by  environment variables](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#disableEnvironmentOverrides). Defaults to `true`. |
| browser | The desired [target browser](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#forBrowser). You may also specify a browser by  setting the `SELENIUM_BROWSER` __environment variable__ to `browser[:[version][:platform]]`. Defaults to `firefox`|


Additionally you can provide browser-specific options under the keys
[`chrome`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setChromeOptions), [`opera`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setOperaOptions), [`safari`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setSafariOptions), [`ie`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setIeOptions), [`edge`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setEdgeOptions) or [`firefox`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html#setFirefoxOptions).

__NOTE__
> All objects created by Selene inherit from their official counterparts, hence checks like `se instanceof webdriver.WebDriver` will still pass and you can use Selene as drop-in replacement inside your existing code.


# Test runners

Selene does not come with its own test runner nor is it bound to a specific assertion framework. You can use whatever tool you want for that. The following example uses [Mocha](https://mochajs.org/) and [unexpected-webdriver](https://www.npmjs.com/package/unexpected-webdriver).

```js
var selene = require('selene');
var expect = require('unexpected');
 expect.use(require('unexpected-webdriver'));

describe('Google', function () {

  this.timeout(60000); // don't timeout too quickly

  it('should go to the selene npm page', function () {
    var se = selene();
    se.goto('https://www.google.com/');
    se.fill({ q: 'selene npm' });
    se.click('[jsaction=sf.lck]');
    se.wait({ url: 'https://www.npmjs.com/package/selene' });

    var name = se.find('.package-name');
    return expect(name, 'to contain text', 'selene');
  });
});
```
# License

MIT
