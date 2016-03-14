/* ================================================================
 * reliable-slave by xdf(xudafeng[at]126.com)
 *
 * first created at : Wed Oct 19 2015 16:16:10 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright zichen.zzc
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

var flow = require('./flow');
var Channel = require('../slave/channel');
var logger = require('../../common/logger');
var getServerInfo = require('../server/monitor');

// Machine status
var status = {
  ACK: 'ack',
  AVAILABLE: 'available',
  BUSY: 'busy'
};

// Message type
var type = {
  ACK: 'ack',
  TASK: 'task'
};

var isBusy = function() {
  return global.__task_status === status.BUSY;
};

module.exports = function *(msg, options) {
  logger.info('Coming to processor...');

  // Only process one task at the same time.
  if (isBusy()) {
    logger.info('Processing...no more work!');
    return;
  }

  global.__task_status = status.BUSY;

  var channel = Channel.getInstance();

  // Change the machine status to busy and notify master
  channel.send({
    type: type.TASK,
    taskId: msg.taskId,
    sysInfo: getServerInfo(),
    status: status.BUSY,
    body: ''
  });

  yield flow(msg, options);
};
