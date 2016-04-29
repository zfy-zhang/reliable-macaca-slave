'use strict';

var path = require('path');
var serve = require('koa-static');
var router = require('koa-router');

module.exports = function(app) {
  var p = path.join(__dirname, '..', 'public');
  app.use(serve(p));
  app.use(serve(path.join(p, '3rdparty')));
  return router(app);
};
