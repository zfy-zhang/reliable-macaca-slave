'use strict';

var _ = require('xutil');
const request = require('request');
var logger = require('./logger');

const parse = require('co-body');

_.timeoutPromise = function(seconds, defaultValue) {
  return new Promise((reslove, reject) => {
    setTimeout(() => {
      reject(defaultValue);
    }, seconds * 1000);
  });
};

_.request = function(url, method, body) {
    return new Promise((resolve, reject) => {
        method = method.toUpperCase();

        const reqOpts = {
            url: url,
            method: method,
            headers: {
                'Content-type': 'application/json;charset=UTF=8'
            },
            resolveWithFullResponse: true
        };

        request(reqOpts, (error, res, body) => {
            if (error) {
                logger.error(`xctest client proxy error with: ${error}`);
                return reject(error);
            }

            resolve(body);
        });
    });
};

_.parse = parse;

module.exports = _;
