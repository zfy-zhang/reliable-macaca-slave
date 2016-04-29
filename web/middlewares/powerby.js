'use strict';

var os = require('os');

var pkg = require('../../package');

module.exports = function() {
  const string = `${pkg.name}/${pkg.version} node/${process.version}(${os.platform()})`;

  return function *powerby(next) {
    yield next;
    this.set('X-Powered-By', string);
  };
};
