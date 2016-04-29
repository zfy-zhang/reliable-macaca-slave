'use strict';

var render = require('../views/render');

module.exports = function() {
  return function *inject(next) {
    this.render = render;
    yield next;
  };
};
