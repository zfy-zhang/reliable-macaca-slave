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

var killing = require('killing');

/**
 * Listening to the system signal and do task
 * @param signal
 */
module.exports = function(signal) {
  switch (signal) {
    case 'stop':
      killing('reliable-slave', function(list) {
        if (list.length) {
          console.log('PID %s has been killed', list.join(', '));
        } else {
          console.log('no kill');
        }
      });
      break;
    case 'restart':
      // TODO
      break;
    default:
      console.log('\n  arguments `\u001b[33m%s\u001b[0m` not found', signal || 'undefined');
      break;
  }
};
