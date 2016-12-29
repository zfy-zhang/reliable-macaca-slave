'use strict';

var pkg = require('../../package.json');
var logger = require('../../common/logger');
var cp = require('child_process');
var co = require('co');
var pathUtil = require('../../common/util');
var detect = require('detect-port');
var util = require('util');
var net = require('net');
var path = require('path');
var os = require('os');
var Promise = require('bluebird');
var adb = require('adbkit');
var client = adb.createClient();
var http = require('http');
var WebSocketServer = require('websocket').server;
const _ = require('../../common/helper');


var resources = {
    bin: {
        dest: '/data/local/tmp/minicap',
        comm: 'minicap',
        mode: 0o755
    },
    lib: {
        dest: '/data/local/tmp/minicap.so',
        mode: 0o755
    }
}


function* getDeviceList() {
    var arrDeviceList = [];
    var iosDevices = [];
    var strText, match;
    var platform = os.platform();
    yield client.listDevices()
        .then(function(devices) {
            return Promise.filter(devices, function(device) {
                return client.getProperties(device.id)
                    .then(function(properties) {
                        strText = cp.execSync('adb -s ' + device.id + ' shell wm size').toString();
                        var resolution;

                        strText.replace(/Physical size: (.+?)\s+\r?\n/g, function(all, devicesName) {
                            resolution = devicesName.toString().trim();
                        });

                        arrDeviceList.push({
                            serialNumber: device.id,
                            model: properties['ro.product.model'],
                            brand: properties['ro.product.brand'],
                            releaseVersion: properties['ro.build.version.release'],
                            sdkVersion: properties['ro.build.version.sdk'],
                            abi: properties['ro.product.cpu.abi'],
                            product: properties['ro.product.name'],
                            screen: resolution,
                            plantForm: 'Android',
                            status: '1'
                        });
                    }).catch(function(err) {
                        arrDeviceList.push({
                            errorMessage: err.stack,
                            status: '4'
                        });
                    }).then(function(property) {

                    })
            })
        })
        .then(function(property) {

        })

    if (platform == 'darwin') {
        strText = cp.execSync('idevice_id -l').toString();
        var arr = strText.toString('ascii').split('\n').map(function(val) {
            return String(val);
        });
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != '') {
                var devices = cp.execSync('ideviceinfo -u ' + arr[i] + '').toString();
                var devicesArray = devices.toString('ascii').split('\n').filter(function(val) {
                    return val.indexOf('UniqueDeviceID') == 0 ||
                        val.indexOf('DeviceClass') == 0 ||
                        val.indexOf('ProductVersion') == 0 ||
                        val.indexOf('DeviceName') == 0;
                });
                iosDevices.push(devicesArray);
            }
        }
        var list = [];
        var specificData = [];
        if (iosDevices != '') {
            for (var i = 0; i < iosDevices.length; i++) {
                var ss = iosDevices[i];
                var screen = '';
                for (var j = 0; j < ss.length; j++) {
                    var devicesArray = ss[j].toString('ascii').split(',');
                    var sss = devicesArray.toString('ascii').split(':');
                    list.push(sss[1]);
                }
                specificData.push(list);
                list = [];
            }
            var screen = '';
            for (var i = 0; i < specificData.length; i++) {
                var deviceSpecificData = specificData[i];
                arrDeviceList.push({
                    serialNumber: deviceSpecificData[3].trim(),
                    model: 'iPhone 6s',
                    brand: deviceSpecificData[0].trim(),
                    releaseVersion: deviceSpecificData[2].trim(),
                    plantForm: 'ios',
                    screen: '750x1334',
                    status: '1'
                });
            }
        }
    }
    client.exit;
    return arrDeviceList;
}

function* controlDevices() {
    switch (this.params.control) {
        case 'run':
            yield runDevices.call(this);
            break;

    }
}

function* runDevices() {
    console.log('start--');
    var deviceId = this.params.deviceId;


    const post = yield _.parse(this);
    var display = post.display;
    var serialNumber = post.serialNumber;
    try {
        //start minicap
        console.log('start minicap', util.format(
            'LD_LIBRARY_PATH=%s exec %s %s', path.dirname(resources.lib.dest), resources.bin.dest, '-P ' + display + '@' + display + '/0 '
        ));

        yield client.shell(serialNumber, util.format(
            'LD_LIBRARY_PATH=%s exec %s %s', path.dirname(resources.lib.dest), resources.bin.dest, '-P ' + display + '@' + display + '/0 '
        ), function() {
            console.log('start minicap successful');
        });

        console.log('start minitouch');
        // start minitouch
        yield client.shell(serialNumber, '/data/local/tmp/minitouch', function() {
            console.log('start minitouch successful');
        });


        // cp.execSync('adb forward --remove-all');
        yield client.listForwards(serialNumber, function(err, forwards) {
            console.log(forwards);
            return Promise.filter(forwards, function(forward) {
                console.log('remove', forward);
                cp.execSync('adb -s ' + serialNumber + ' forward --remove ' + forward.local);
            });
        });

        var serverPort = yield detect(9765);
        var server = http.createServer();
        server.listen(serverPort, function() {
            console.log('----', serverPort);
        });

        var wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: true
        });

        wsServer.on('connect', co.wrap(function*(connection) {

            //minitouch adb forward
            var minitouchPort = yield detect(1111);
            console.log('minitouchPort', minitouchPort);
            yield client.forward(serialNumber, 'tcp:' + minitouchPort, 'localabstract:minitouch').delay(1000);

            //minicap adb forward
            var minicapPort = yield detect(1313);
            console.log('minicapPort', minicapPort);
            yield client.forward(serialNumber, 'tcp:' + minicapPort, 'localabstract:minicap').delay(1000);
            console.log('delay');
            var touchStream = net.connect({
                port: minitouchPort
            });

            touchStream.on('close', function() {
                console.log('touch end--tcp', minitouchPort);
                try {
                    cp.execSync('adb -s ' + serialNumber + ' forward --remove tcp:' + minitouchPort);
                } catch (ex) {
                    console.log(ex);
                }
            });

            var stream = net.connect({
                port: minicapPort
            });

            stream.on('error', function() {
                console.error('Be sure to run `adb forward tcp:1313 localabstract:minicap`')
                process.exit(1)
            });

            stream.on('close', function() {
                console.log('minicap end--tcp', minicapPort);
                try {
                    cp.execSync('adb -s ' + serialNumber + ' forward --remove tcp:' + minicapPort);
                } catch (ex) {
                    console.log(ex);
                }
            });


            var wsConnection = connection;

            var readBannerBytes = 0
            var bannerLength = 2
            var readFrameBytes = 0
            var frameBodyLength = 0
            var frameBody = new Buffer(0)
            var banner = {
                version: 0,
                length: 0,
                pid: 0,
                realWidth: 0,
                realHeight: 0,
                virtualWidth: 0,
                virtualHeight: 0,
                orientation: 0,
                quirks: 0
            }

            function tryRead() {
                for (var chunk;
                    (chunk = stream.read());) {
                    // console.info('chunk(length=%d)', chunk.length)
                    for (var cursor = 0, len = chunk.length; cursor < len;) {
                        if (readBannerBytes < bannerLength) {
                            switch (readBannerBytes) {
                                case 0:
                                    // version
                                    banner.version = chunk[cursor]
                                    break
                                case 1:
                                    // length
                                    banner.length = bannerLength = chunk[cursor]
                                    break
                                case 2:
                                case 3:
                                case 4:
                                case 5:
                                    // pid
                                    banner.pid +=
                                        (chunk[cursor] << ((readBannerBytes - 2) * 8)) >>> 0
                                    break
                                case 6:
                                case 7:
                                case 8:
                                case 9:
                                    // real width
                                    banner.realWidth +=
                                        (chunk[cursor] << ((readBannerBytes - 6) * 8)) >>> 0
                                    break
                                case 10:
                                case 11:
                                case 12:
                                case 13:
                                    // real height
                                    banner.realHeight +=
                                        (chunk[cursor] << ((readBannerBytes - 10) * 8)) >>> 0
                                    break
                                case 14:
                                case 15:
                                case 16:
                                case 17:
                                    // virtual width
                                    banner.virtualWidth +=
                                        (chunk[cursor] << ((readBannerBytes - 14) * 8)) >>> 0
                                    break
                                case 18:
                                case 19:
                                case 20:
                                case 21:
                                    // virtual height
                                    banner.virtualHeight +=
                                        (chunk[cursor] << ((readBannerBytes - 18) * 8)) >>> 0
                                    break
                                case 22:
                                    // orientation
                                    banner.orientation += chunk[cursor] * 90
                                    break
                                case 23:
                                    // quirks
                                    banner.quirks = chunk[cursor]
                                    break
                            }

                            cursor += 1
                            readBannerBytes += 1

                            if (readBannerBytes === bannerLength) {
                                // console.log('banner', banner)
                            }
                        } else if (readFrameBytes < 4) {
                            frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0
                            cursor += 1
                            readFrameBytes += 1
                                // console.info('headerbyte%d(val=%d)', readFrameBytes, frameBodyLength)
                        } else {
                            if (len - cursor >= frameBodyLength) {
                                // console.info('bodyfin(len=%d,cursor=%d)', frameBodyLength, cursor)

                                frameBody = Buffer.concat([
                                    frameBody, chunk.slice(cursor, cursor + frameBodyLength)
                                ])

                                // Sanity check for JPG header, only here for debugging purposes.
                                if (frameBody[0] !== 0xFF || frameBody[1] !== 0xD8) {
                                    console.error(
                                        'Frame body does not start with JPG header', frameBody)
                                    process.exit(1)
                                }

                                connection.send(frameBody, {
                                    binary: true
                                })

                                cursor += frameBodyLength
                                frameBodyLength = readFrameBytes = 0
                                frameBody = new Buffer(0)
                            } else {
                                // console.info('body(len=%d)', len - cursor)

                                frameBody = Buffer.concat([
                                    frameBody, chunk.slice(cursor, len)
                                ])

                                frameBodyLength -= len - cursor
                                readFrameBytes += len - cursor
                                cursor = len
                            }
                        }
                    }
                }
            }

            stream.on('readable', tryRead);

            connection.on('message', function(message) {
                console.log('收到消息', message);
                var message = message.utf8Data;
                try {
                    message = JSON.parse(message);
                } catch (e) {};
                var type = message.type;
                console.log('type', type);
                switch (type) {
                    case 'command':
                        saveCommand(serialNumber, message.data.cmd, message.data.data, touchStream);
                        break;
                }

            });
            connection.on('close', function(reasonCode, description) {
                wsConnection = null;
                console.info('Lost a client')
                stream.end();
                touchStream.end();
            });

        }));


        console.log('run success,webSocketPort:', serverPort);

        this.body = {
            success: true,
            data: { webSocketPort: serverPort }
        };

    } catch (ex) {
        console.log(ex);
        this.body = {
            success: false,
            errorMsg: '运行手机失败',
            data: null
        };
    }
}

function saveCommand(udid, cmd, data, touchStream) {

    console.log(cmd);

    switch (cmd) {
        case 'click':
            console.log('1-start');
            // touchStream.write('r\n');
            touchStream.write('d 0 ' + data.touchX + ' ' + data.touchY + ' 20\n');
            touchStream.write('c\n');
            touchStream.write('u 0\n');
            touchStream.write('c\n');
            console.log('1-end');

            break;
        case 'swipe':
            // touchStream.write('r\n');
            console.log('2-start');

            touchStream.write('d 0 ' + data.startX + ' ' + data.startY + ' 20\n');
            touchStream.write('c\n');
            touchStream.write('m 0 ' + data.endX + ' ' + data.endY + ' 20\n');
            touchStream.write('c\n');
            touchStream.write('u 0\n');
            touchStream.write('c\n');
            console.log('2-end');

            break;
        case 'back':
            client.shell(udid, 'input keyevent 4');
            break;
        case 'home':
            client.shell(udid, 'input keyevent 3');
            break;
        case 'menu':
            client.shell(udid, 'input keyevent 82');
            break;
    }

}

function* dispatch() {
    logger.debug('controller devices');
    if (this.params.method) {
        switch (this.params.method) {
            case 'control_devices':
                yield controlDevices.call(this);
                break;
        };
    } else {
        this.body = yield getDeviceList.call(this);
    }

}

module.exports = dispatch;