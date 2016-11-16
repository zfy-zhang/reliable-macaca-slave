'use strict';

var path = require('path');
var logger = require('reliable-logger');

var options = {
  logFileDir: path.join(__dirname, '..', 'logs'),
  debugMode:true
};

module.exports = logger.Logger(options);
module.exports.middleware = logger.middleware(options);
