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

var _ = require('xutil');

_.timeoutPromise = function(seconds, defaultValue) {
  return new Promise((reslove, reject) => {
    setTimeout(() => {
      reject(defaultValue);
    }, seconds * 1000);
  });
};

module.exports = _;
