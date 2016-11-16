'use strict';

var pkg = require('../../package.json');
var logger = require('../../common/logger');
var cp = require('child_process');

function *getDeviceList(){
    var arrDeviceList = [];
    var strText, match;
    strText = cp.execSync('adb devices').toString();
    strText.replace(/(.+?)\s+device\r?\n/g, function(all, deviceName){
        arrDeviceList.push({
            udid: deviceName,
            name: name
        });
    });
   
    strText = cp.execSync('xcrun simctl list devices').toString();
    strText.replace(/\r?\n\s*(.+?)\s+\((.+?)\) \(Booted\)/g, function(all, deviceName, udid){
        arrDeviceList.push({
            name: deviceName,
            udid: udid
        });
    });
    return arrDeviceList;
}

function *render() {
  var context = yield getDeviceList.call(this);
  this.body = context;
}

function *dispatch() {
  logger.debug('controller devices');
  yield render.call(this);
}

module.exports = dispatch;
