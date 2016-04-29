'use strict';

var zmq = require('zmq');
var util = require('util');
var EOL = require('os').EOL;
var EventEmitter = require('events').EventEmitter;

var logger = require('../../common/logger');

/**
 * Create a singleton channel object
 */
module.exports = (function() {
  var instantiated;

  function Channel(options) {
    EventEmitter.call(this);
    this.options = options || {};
    this.status = 'success';
    this.init();
  }

  util.inherits(Channel, EventEmitter);

  // Init the zmq socket and start to listening message.
  Channel.prototype.init = function() {
    var that = this;
    this.sock = zmq.socket('pair');
    this.sock.bindSync(`tcp://${this.options.ip}:${this.options.port}`);
    this.sock.monitor(500, 0);
    this.sock.on('message', function(data) {
      try {
        var msg = JSON.parse(data.toString());

        if (msg && msg.type !== 'monitor') {
          logger.debug('%s---> zmq message %s%s', EOL, EOL, data.toString());
        }
        that._handleMessage(msg);
      } catch (e) {
        logger.warn('Bad json data, %s', data);
      }
    });

    this.sock.on('accept', function(fd, ep) {logger.debug(`accept, endpoint: ${ep}`);});
    this.sock.on('accept_error', function(fd, ep) {logger.debug(`accept_error, endpoint: ${ep}`);});
    this.sock.on('close', function(fd, ep) {logger.debug(`close, endpoint: ${ep}`);});
    this.sock.on('close_error', function(fd, ep) {logger.debug(`close_error, endpoint: ${ep}`);});
    this.sock.on('disconnect', function() {
      that.emit('disconnect');
    });
  };

  // Emit different event when receiving msg.
  Channel.prototype._handleMessage = function(msg) {
    var type = msg.type;
    switch (type) {
      case 'ack':
        this.emit('ack', msg);
        break;
      case 'task':
        this.emit('task', msg);
        break;
      case 'monitor':
        this.emit('monitor', msg);
        break;
      default:
        break;
    }
  };

  Channel.prototype.send = function(data) {
    if (data && data.type !== 'monitor') {
      logger.debug('%s<--- zmq message %s%j', EOL, EOL, data);
    }
    this.sock.send(JSON.stringify(data));
  };

  Channel.prototype.toString = function() {
    return '[object Channel]';
  };

  return {
    getInstance: function(args) {
      if (!instantiated) {
        instantiated = new Channel(args);
      }
      return instantiated;
    }
  };
})();
