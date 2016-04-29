'use strict';

require('babel/register')({
  extensions: ['.jsx']
});

const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const logger = require('./../../common/logger');

var current = path.join(__dirname, '..', 'views');

logger.debug('render view path: %s', current);

module.exports = function(template, data) {
  const file = path.join(current, template, 'index');
  let html;

  try {
    const Component = require(file);
    var temp = ReactDOMServer.renderToStaticMarkup(React.createFactory(Component)(data));
    html = `<!DOCTYPE html>${temp}`;
  } catch(e) {
    logger.warn(e.stack);
    html = 'render template:' + template + ' failed';
  }

  if (this.body) {
    this.body = html;
  }

  return html;
};
