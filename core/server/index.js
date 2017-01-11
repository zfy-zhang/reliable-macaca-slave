'use strict';

var co = require('co');
var os = require('os');
var koa = require('koa');
var EOL = require('os').EOL;
var detect = require('detect-port');

var cron = require('./cron');
var router = require('./router');
var _ = require('../../common/helper');
var logger = require('../../common/logger');
var middlewares = require('../../web/middlewares');

/**
 * The Koa Web Server
 * @param options
 * @param callback
 */
module.exports = function(options, callback) {
  co(function *() {
    var app = koa();

    middlewares(app);
    router(app);

    options.webPort = yield detect(options.webPort);
    app.listen(options.webPort, function() {
      logger.info('Slave Web Server start with options %s %j', EOL, options);
      callback && callback();
    });
  }).catch(function(e) {
    console.error(e);
  });

  // cron task for cleaning temp directory
  cron();
};
