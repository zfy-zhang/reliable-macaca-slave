/* ================================================================
 * reliable-slave by xdf(xudafeng[at]126.com)
 *
 * first created at : Tue Mar 17 2015 00:16:10 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

var cluster = require('cluster');

var remote = require('../core/slave');
var server = require('../core/server');

if (cluster.isWorker) {
  cluster.worker.on('message', function(e) {
    switch (e.message) {
      case 'startServer':
        startServer(e.data);
        break;
    }
  });
}

/**
 * Start the remote server and web server
 * Remote Server is used to communicate with master
 * Web Server shows the basic information about the slave machine
 * @param options
 */
function startServer(options) {
  if (options.master) {
    remote(options, function() {
      server(options);
    });
  } else {
    console.log('lack of option master');
  }
}
