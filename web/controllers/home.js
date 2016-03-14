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

var pkg = require('../../package.json');
var logger = require('../../common/logger');

function *getContext() {
  var context = {};
  context.global = global;
  context.pkg = pkg;
  return context;
}

function *render() {
  var context = yield getContext.call(this);
  this.body = this.render('home', context);
}

function *dispatch() {
  logger.debug('controller home');
  yield render.call(this);
}

module.exports = dispatch;
