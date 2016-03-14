/* ================================================================
 * reliable-slave by xdf(xudafeng[at]126.com)
 *
 * first created at : Tue Mar 17 2015 00:16:10 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

var path = require('path');
var favicon = require('koa-favicon');

var dir = path.join(__dirname, '..', 'public', 'images', 'favicon.ico');

module.exports = function() {
  return favicon(dir);
};
