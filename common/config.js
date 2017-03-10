'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const _ = require('./helper');

const mongo = process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost';
const defaultCfg = {
  server: {
    worker: os.cpus().length,
    port: 8080,
    protocol: 'http'
  },
  database: `mongodb://${mongo}/reliable`,
  businessUrls:{
    //数据库所在电脑的IP
    dataSourceAdress :'localhost',
    dataSourcePort :'27017',
  }
};

var config = null;

exports.get = function() {
  if (config) {
    return config;
  }

  var rootPath = path.join(__dirname, '..');
  var list = fs.readdirSync(rootPath);

  list.forEach(item => {
    if (path.extname(item) === '.js' && !!~item.indexOf('.reliable.config.js')) {
      var mod = path.join(rootPath, item);
      config = _.merge({}, defaultCfg, require(mod));
    }
  });

  return config || defaultCfg;
};
