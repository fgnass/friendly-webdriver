'use strict';

const webdriver = require('selenium-webdriver');
const remote = require('selenium-webdriver/remote');

function loggingPrefs(opts) {
  if (opts instanceof webdriver.logging.Preferences) return opts;
  const prefs = new webdriver.logging.Preferences();
  Object.keys(opts).forEach(key => {
    const type = webdriver.logging.Type[key.toUpperCase()];
    const level = webdriver.logging.Level[opts[key].toUpperCase()];
    if (type === undefined) throw new Error(`No such type: ${key}`);
    if (level === undefined) throw new Error(`No such level: ${opts[key]}`);
    prefs.setLevel(type, level);
  });
  return prefs;
}

module.exports = function (opts) {
  const b = new webdriver.Builder();
  if (opts.capabilities) b.withCapabilities(opts.capabilities);

  if ('envOverrides' in opts && !opts.envOverrides) b.disableEnvironmentOverrides();
  if ('alerts' in opts) b.setAlertBehavior(opts.alerts);
  if ('nativeEvents' in opts) b.setEnableNativeEvents(opts.nativeEvents);
  if ('proxy' in opts) b.setProxy(opts.proxy);
  if ('proxyURL' in opts) b.usingWebDriverProxy(opts.proxyURL);
  if ('remoteURL' in opts) b.usingServer(opts.remoteURL);
  if (opts.logging) b.setLoggingPrefs(loggingPrefs(opts.logging));
  if (opts.scrollTo == 'top') b.setScrollBehavior(0);
  if (opts.scrollTo == 'bottom') b.setScrollBehavior(1);
  if (opts.chrome) b.setChromeOptions(opts.chrome);
  if (opts.firefox) b.setFirefoxOptions(opts.firefox);
  if (opts.edge) b.setEdgeOptions(opts.edge);
  if (opts.ie) b.setIeOptions(opts.ie);
  if (opts.opera) b.setOperaOptions(opts.opera);
  if (opts.safari) b.setSafariOptions(opts.safari);

  const browser = opts.browser || 'firefox';
  b.forBrowser.apply(b, browser.split(':'));

  const driver = b.build();
  driver.getCapabilities().then(c => {
    if (c.has('webdriver.remote.sessionid')) {
      driver.setFileDetector(new remote.FileDetector());
    }
  });

  return driver;
};
