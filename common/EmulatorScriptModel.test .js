'use strict';

var _ = require('macaca-utils');

var browserName = process.env.browser || 'safari';
browserName = browserName.toLowerCase();

var iOSSafariOpts = {
  platformVersion: '10.0',
  deviceName: #iosDevice#,
  platformName: 'iOS',
  browserName: 'Safari'
};

var AndroidChromeOpts = {
  platformName: 'Android',
  browserName: 'Chrome'
};

var wd = require('webdriver-client')(_.merge({}, browserName === 'safari' ? iOSSafariOpts : AndroidChromeOpts));

describe('macaca mobile sample', function() {
  this.timeout(5 * 60 * 1000);

  var driver = wd.initPromiseChain();

  before(function() {
    return driver
      .initDriver();
  });

  after(function() {
    return driver
      .sleep(1000)
      .quit();
  });

   #script-replace#

});
