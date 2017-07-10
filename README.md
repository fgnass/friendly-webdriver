[![Build Status](https://travis-ci.org/fgnass/friendly-webdriver.svg?branch=master)](https://travis-ci.org/fgnass/friendly-webdriver)

# friendly-webdriver 🚕

This is a thin wrapper around the [official Selenium JavaScript](https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs) bindings.

While being very powerful, the official API often feels a little alien to JavaScript developers as it is very closely modeled after its Java ancestor.

**NOTE:** Since _friendly-webdriver_ uses the official bindings under the hood you __don't need a Selenium server__ in order to control browsers on your local machine. This does not only make things much easier to set up but also makes things considerably faster as it saves a lot of roundtrips.


**Example:**

```js
var webdriver = require('friendly-webdriver');

var fwd = webdriver();
fwd.goto('https://www.google.com/');
fwd.fill({ q: 'friendly-webdriver npm' });
fwd.click('[jsaction=sf.lck]');
```

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Contents**

- [Concepts](#concepts)
  - [Locators](#locators)
  - [Filters](#filters)
  - [Conditions](#conditions)
- [API](#api)
  - [FriendlyWebDriver](#friendlywebdriver)
    - [goto](#goto)
    - [find](#find)
    - [findAll](#findall)
    - [click](#click)
    - [exists](#exists)
    - [wait](#wait)
    - [reloadUntil](#reloaduntil)
    - [fill](#fill)
    - [getLogEntries](#getlogentries)
    - [addLocator](#addlocator)
    - [addFilter](#addfilter)
    - [addCondition](#addcondition)
    - [use](#use)
  - [FwdElement](#fwdelement)
    - [attr](#attr)
    - [css](#css)
    - [find](#find-1)
    - [findAll](#findall-1)
    - [fill](#fill-1)
    - [parent](#parent)
    - [type](#type)
    - [press](#press)
    - [dragDrop](#dragdrop)
  - [FwdElementPromise](#fwdelementpromise)
  - [Configuration](#configuration)
- [Test runners](#test-runners)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Concepts

FWD adds the concept of [locators](#locators), [filters](#filters) and [conditions](#conditions) on top of the WebDriver API.

## Locators

By default FWD supports the following locators:

```js
// CSS selectors
fwd.find('.button');

// XPath expressions
fwd.find({ xpath: '//main' });

// Client-side functions
fwd.find('ul').find({ js: function (el) {
  return el.firstChild;
}});
```

You can add custom locators via the [`addLocator()`](#addlocator) method.

## Filters

When locating elements FWD also provides a way to filter the results. By default the following filters are supported:

```js
fwd.find('.button', { visible: true });
fwd.find('.button', { text: 'click me' });
fwd.find('.button', { text: /click/ });
```

You can add custom filters via the [`addFilter()`](#addfilter) method.

## Conditions

You can use FWD to wait for certain conditions to be met. The following conditions are supported by default:

```js
fwd.wait({ url: '/welcome' }, 2000);
fwd.wait({ title: /friendly/ }, 2000);
fwd.wait(() => fwd.find('.foo').find('.bar'), 2000);
fwd.wait({ stale: fwd.find('body') }, 2000);
```

You can add custom conditions via the [`addCondition()`](#addcondition) method.


# API

The top-level [`webdriver()`](#configuration) function is a factory for [`FriendlyWebDriver`](#friendlywebdriver) instances which are thin wrappers around Selenium `WebDriver` objects.

## FriendlyWebDriver

In addition to the [WebDriver API](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html), `FriendlyWebDriver` instances provide the following methods:

### goto

`goto(url)` – Navigates to the given URL. Relative paths will be resolved against the [configured](#configuration) base URL.
Returns `this` for chaining.

### find

Returns a [FwdElementPromise](#FwdElementpromise) for the first matching DOM element.

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

Fills multiple input elements at once. The input elements are looked up using a CSS attribute selector. By default FWD expects each element to have a unique `name` attribute. Optionally a custom attribute can be specified. Returns `this` for chaining.

`fill([attribute], values)`
  * `attribute`: Attribute name to use in CSS selectors. Defaults to `name`
  * `values`: The values to be filled in

```js
fwd.fill({
  user: 'John',
  email: 'john@example.com'
})

// shortcut for:
fwd.find('[name="user"]').type('John');
fwd.find('[name="email"]').type('john@example.com');
```

### getLogEntries

Fetches available log entries for a given type since the last call to this method, or from the start of the session.

`getLogMessages(type)`
  * `type`: The log type to fetch. Can be `browser`, `client`, `driver`, `performance` or `server`.

```js
// activate logging
var fwd = webdriver({
  logging: {
    browser: 'severe',
    driver: 'debug'
  }
});

// fetch browser logs
fwd.getLogEntries('browser').then(entries => {
  console.log(entries.map(e => e.message));
});
```

### addLocator

Registers a custom [locator](#locators).

`addLocator(fn)`
  * `fn` A function that takes an arbitrary `query` object as argument and returns
  `{ description: String, by: (webdriver.by.By | Function) }` if it wants to handle the given query.

The following example adds a locator that uses jQuery to locate elements:

```js
fwd.addLocator(query => {
  // Handle only objects that have a `jQuery` property
  if (typeof query === 'object' && 'jQuery' in query) {
    const selector = query.$;
    return {
      description: `$(${selector})`, // description used in error messages
      by: driver => driver.executeScript(jQuery, selector)
    };
  }

  // This function gets executed inside the browser:
  function jQuery(selector) {
    if (!window.$) throw new Error('jQuery not found in global scope');
    return window.$(selector);
  }
});

// Use it like this:
fwd.find({jQuery: 'div:animated' });
```

### addFilter

Registers a custom [filter](#filter).

`addFilter(fn)`
  * `fn` A function that takes an arbitrary `filter` object as argument and returns
  `{ description: String, test: Function) }` if it wants to handle the given filter.

The following example adds a _min-width_ filter:

```js
fwd.addFilter(filter => {
  if (filter.minWidth) {
    return {
      description: `width >= ${filter.minWidth}px`,
      test(el) {
        return el.getSize().then(size => size.width >= filter.minWidth);
      }
    };
  }
});

// Use it like this:
fwd.find('img', { minWidth: 200 });
```

### addCondition

Registers a custom [condition](#conditions).

`addCondition(fn)`
  * `fn` A function that takes an arbitrary `until` object as argument and returns a `webdriver.Contition` if it wants to handle the given object.

### use

Registers a plugin.

`use(plugin)`
* `plugin` A function that is invoked with a `FriendlyWebDriver` instance so it can call [`addLocator()`](#addlocator), [`addFilter()`](#addfilter) or [`addCondition()`](#addcondition).


## FwdElement

`FwdElement` extends Selenium's [WebElement](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html) and adds the following methods:

### attr

`attr(name)` – Returns a promise for the value of the attribute with the specified name. Alias for [`getAttribute(name)`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html#getAttribute)

### css

`css(prop)` – Returns the runtime CSS style of the given property. Alias for [`getCssValue(prop)`](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_WebElement.html#getCssValue)

### find

`find(locator, [filter], [timeout])` – Scoped version of [fwd.find()](#find) that only takes the element's descendants into account.

### findAll

`findAll(selector, [filter], [timeout])` – Scoped version of [fwd.findAll()](#findAll) that only takes the element's descendants into account.

### fill

`fill([attribute], values)` – Scoped version of [fwd.fill()](#fill) that only takes the element's descendants into account.


### parent

`parent()` – Returns a `FwdElementPromise` for the element's parent node.

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

The target can either be a `FwdElement` or `{x: number, y: number}` or a promise for either of both.

## FwdElementPromise

`FwdElementPromise` mixes both [`FwdElement`](#FwdElement) and an [A+ compatible](https://promisesaplus.com/) promise interface. This allows calls to the `FwdElement` API before the underlying element promise has been fulfilled.

## Configuration

| Option | Description |
| ------ | ----------- |
| base   | Base URL against which all relative paths are resolved. |
| auth   | Credentials for HTTP basic authentication. |

```js
var fwd = webdriver({
  base: 'https://www.example.com/',
  auth: {
    user: 'user',
    pass: 'secret'
  }
});

fwd.goto('/').click('a[href="/welcome"]').wait({ url: '/welcome' });
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
> All objects created by FWD inherit from their official counterparts, hence checks like `se instanceof webdriver.WebDriver` will still pass and you can use FWD as drop-in replacement inside your existing code.


# Test runners

FWD does not come with its own test runner nor is it bound to a specific assertion framework. You can use whatever tool you want for that. The following example uses [Mocha](https://mochajs.org/) and [unexpected-webdriver](https://www.npmjs.com/package/unexpected-webdriver).

```js
var webdriver = require('friendly-webdriver');
var expect = require('unexpected').clone();

expect.use(require('unexpected-webdriver')());

describe('Google', function () {

  this.timeout(60000); // don't timeout too quickly

  it('should go to the FWD npm page', function () {
    var se = FWD();
    fwd.goto('https://www.google.com/');
    fwd.fill({ q: 'friendly-webdriver npm' });
    fwd.click('[jsaction=sf.lck]');
    fwd.wait({ url: 'https://www.npmjs.com/package/friendly-webdriver' });

    var name = fwd.find('.package-name');
    return expect(name, 'to contain text', 'FWD');
  });
});
```

# History

This project was originally released under the name `Selene` and was later renamed to avoid confusion with the [Selene](https://github.com/yashaka/selene) Python library and its [Jselene](https://github.com/yashaka/jselene) counterpart.

# License

MIT
