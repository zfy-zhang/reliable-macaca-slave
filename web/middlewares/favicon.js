'use strict';

var path = require('path');
var favicon = require('koa-favicon');

var dir = path.join(__dirname, '..', 'public', 'images', 'favicon.ico');

module.exports = function() {
  return favicon(dir);
};
