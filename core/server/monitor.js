/* ================================================================
 * reliable-slave by xdf(xudafeng[at]126.com)
 *
 * first created at : Wed Oct 19 2015 16:16:10 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright zichen.zzc
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */
'use strict';

var os = require('os');

var timestamp = Date.now();
var data = global.sysInfo = calculate();

function uptime() {
  var time = os.uptime();
  var days = parseInt(time / 60 / 60 / 24, 10);
  var hours = parseInt((time - days * 60 * 60 * 24) / 60 / 60, 10);
  var minutes = parseInt((time - days * 60 * 60 * 24 - hours * 60 * 60) / 60, 10);
  return `${days}d ${hours}h ${minutes}m`;
}

function calculate() {
  var data = {};
  data.cpus = os.cpus();
  data.memory = os.freemem() / os.totalmem();
  data.type = os.type();
  data.platform = os.platform();
  data.uptime = uptime();
  data.release = os.release();
  data.hostname = os.hostname();
  data.port = global.__port;
  return data;
}

/**
 * Return the basic computer info
 * @returns {Object} Computer Info
 */
module.exports = function() {
  var newTimestamp = Date.now();
  var diff = newTimestamp - timestamp;
  if (diff < 30000) {
    return data;
  }
  timestamp = newTimestamp;
  data = calculate();
  return data;
};
