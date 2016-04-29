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
