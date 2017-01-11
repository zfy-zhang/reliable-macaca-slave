'use strict';

var _ = require('xutil');
const parse = require('co-body');

_.timeoutPromise = function(seconds, defaultValue) {
  return new Promise((reslove, reject) => {
    setTimeout(() => {
      reject(defaultValue);
    }, seconds * 1000);
  });
};
_.parse = parse;

module.exports = _;
