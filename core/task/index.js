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
