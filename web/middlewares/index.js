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

var logger = require('../../common/logger');

var middlewares = ['inject', 'favicon', 'powerby', 'static'];

function attach(app) {
  app.use(logger.middleware);
  logger.debug('base middlewares attached');
}

function register(app) {
  middlewares.forEach(function(middleware) {
    app.use(require(`./${middleware}`)(app));
    logger.debug('middleware: %s registed', middleware);
  });
}

module.exports = function(app) {
  attach.call(this, app);
  register.call(this, app);
};
