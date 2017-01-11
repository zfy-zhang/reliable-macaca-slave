'use strict';

var path = require('path');
var _ = require('macaca-utils');
var xml2map = require('xml2map');

//var platform = process.env.platform || 'Android';
var platform = '#platform-replace#';
platform = platform.toLowerCase();

var iOSOpts = {
  deviceName: 'iPhone 5s',
  platformName: 'iOS',
  udid: process.env.udid ||'#device-ios-udid#',
  //bundleId: 'xudafeng.ios-app-bootstrap',
  app: path.join(__dirname, '../../../', '.app', '#appname-ios-replace#')
};

var androidOpts = {
  platformName: 'Android',
  udid: process.env.udid ||'#device-android-udid#',
  //package: 'com.bankcomm.maidanba',
  reuse: 2,
  //activity: '.activity.SplashActivity',
  //package: 'com.github.android_app_bootstrap',
  //activity: 'com.github.android_app_bootstrap.activity.WelcomeActivity',
  app: path.join(__dirname, '../../../', '.app', '#appname-android-replace#')
};

var wd = require('webdriver-client')(_.merge({}, platform === 'ios' ? iOSOpts : androidOpts));

// override back for ios
wd.addPromiseChainMethod('customback', function() {
  if (platform === 'ios') {
    return this;
  }

  return this
    .back();
});

describe('macaca mobile test', function() {
  this.timeout(5 * 60 * 1000);

  var driver = wd.initPromiseChain();

  driver.configureHttp({
    timeout: 600 * 1000
  });

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