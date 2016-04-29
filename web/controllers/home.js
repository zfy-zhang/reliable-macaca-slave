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
