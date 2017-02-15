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
const UIAutomator = require('uiautomator-client');
var os = require('os');
var Promise = require('bluebird');
var adb = require('adbkit');
var client = adb.createClient();
var http = require('http');
var WebSocketServer = require('websocket').server;
const _ = require('../../common/helper');
var HashMap = require('hashmap').HashMap;
const ADB = require('macaca-adb');
const XCTest = require('xctest-client');
var iosDevicesList = require('ios-device-list');
var xml2map = require('xml2map');


var map = new HashMap();
var xcMap = new HashMap();
var adbMap = new HashMap();
var uiautomatorMap = new HashMap();


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


var iosDevicesScreen = new Map();
iosDevicesScreen.set('iPhone 4', '640x960');
iosDevicesScreen.set('iPhone 4S', '640x960');
iosDevicesScreen.set('iPhone 5', '640x1136');
iosDevicesScreen.set('iPhone 5c', '640x1136');
iosDevicesScreen.set('iPhone 5s', '640x1136');
iosDevicesScreen.set('iPhone 6', '750x1334');
iosDevicesScreen.set('iPhone 6 Plus', '1080x1920');
iosDevicesScreen.set('iPhone 6s', '750x1334');
iosDevicesScreen.set('iPhone 6s Plus', '1080x1920');
iosDevicesScreen.set('iPhone 7', '750x1334');
iosDevicesScreen.set('iPhone 7 Plus', '1080x1920');


function* getDeviceList() {
    try {
        var arrDeviceList = [];
        var iosDevices = [];
        var strText, match;
        var platform = os.platform();
        yield client.listDevices()
            .then(function (devices) {
                return Promise.filter(devices, function (device) {
                    return client.getProperties(device.id)
                        .then(function (properties) {
                            strText = cp.execSync('adb -s ' + device.id + ' shell wm size').toString();
                            var resolution;

                            strText.replace(/Physical size: (.+?)\s+\r?\n/g, function (all, devicesName) {
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
                        }).catch(function (err) {
                            arrDeviceList.push({
                                errorMessage: err.stack,
                                status: '4'
                            });
                        }).then(function (property) {

                        })
                })
            })
            .then(function (property) {

            })

        if (platform == 'darwin') {
            strText = cp.execSync('idevice_id -l').toString();
            var arr = strText.toString('ascii').split('\n').map(function (val) {
                return String(val);
            });
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] != '') {
                    var devices = cp.execSync('ideviceinfo -u ' + arr[i] + '').toString();
                    var devicesArray = devices.toString('ascii').split('\n').filter(function (val) {
                        return val.indexOf('UniqueDeviceID') == 0 ||
                            val.indexOf('DeviceClass') == 0 ||
                            val.indexOf('ProductVersion') == 0 ||
                            val.indexOf('DeviceName') == 0 ||
                            val.indexOf('ProductType') == 0;
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
                    var devices = iosDevicesList.devices();
                    var gen = iosDevicesList.generationByIdentifier(deviceSpecificData[2].trim());
                    arrDeviceList.push({
                        serialNumber: deviceSpecificData[4].trim(),
                        model: gen,
                        brand: deviceSpecificData[0].trim(),
                        releaseVersion: deviceSpecificData[3].trim(),
                        plantForm: 'ios',
                        screen: iosDevicesScreen.get(gen),
                        status: '1'
                    });
                }
            }
        }
        client.exit;
        return arrDeviceList;
    } catch (e) {
        console.log(e);
        return null;
    }

}

function* controlDevices() {
    switch (this.params.control) {
        case 'run':
            yield runDevices.call(this);
            break;
        case 'stop':
            yield stopDevices.call(this);
            break;
        case 'record':
            yield recordDevices.call(this);
            break;
    }
}

function *stopDevices() {

    try {
        var deviceId = this.params.deviceId;

        const post = yield _.parse(this);
        var display = post.display;
        var serialNumber = post.serialNumber;
        var wss = map.get(serialNumber);
        if (wss) {
            wss.close();
            map.remove(serialNumber);
        }

        var xcTest = xcMap.get(serialNumber);
        if (xcTest) {
            xcTest.stop();
            xcMap.remove(serialNumber);
        }

        var adb1 = adbMap.get(serialNumber);
        if (adb1) {
            adbMap.remove(serialNumber);
        }

        var uiautomator = uiautomatorMap.get(serialNumber);
        if (uiautomator) {
            uiautomatorMap.remove(serialNumber);
        }

        this.body = {
            success: true,
            errorMsg: '',
            data: null
        };
    } catch (ex) {
        console.log(ex);
        this.body = {
            success: false,
            errorMsg: '释放手机失败',
            data: null
        };
    }

}

function* getSourceForAndroid(wsConnection,serialNumber){

    var adb1 = adbMap.get(serialNumber);
    var uiautomator =uiautomatorMap.get(serialNumber);

    yield uiautomator.send({
        cmd: 'getSource',
        args: {
        }
    });

    const tmpDir = adb1.getTmpDir();
    const xmlData = yield adb1.shell(`cat ${tmpDir}/macaca-dump.xml`);
    const xmlHackData = yield adb1.shell(`cat ${tmpDir}/local/tmp/macaca-dump.xml`);

    var xml = xmlData.length > xmlHackData.length ? xmlData : xmlHackData;

    wsConnection.send(JSON.stringify({source: xml2map.tojson(xml)}));

}

function* runDevices(){
    yield runOrRecordDevices.call(this,false);
}

function* recordDevices(){
    yield runOrRecordDevices.call(this,true);
}

function* runOrRecordDevices(isRecord) {
    var deviceId = this.params.deviceId;


    const post = yield _.parse(this);
    var display = post.display;
    var serialNumber = post.serialNumber;
    try {

        var platForm = post.plantForm;

        if (platForm == "ios") {

            var device = {
                deviceId: serialNumber
            };

            var xctest = new XCTest({
                device: device
            });

            yield xctest.start({
                desiredCapabilities: {}
            });

            const status = yield _.request(`http://${xctest.proxyHost}:${xctest.proxyPort}/status`, 'get', {});
            var sessionId = JSON.parse(status).sessionId;
            console.log(sessionId);

            var serverPort = yield detect(9765);
            var server = http.createServer();
            server.listen(serverPort, function () {
                console.log('----', serverPort);
            });

            var wsServer = new WebSocketServer({
                httpServer: server,
                autoAcceptConnections: true
            });
            var wsConnection;

            map.set(serialNumber, server);
            xcMap.set(serialNumber, xctest);

            wsServer.on('connect', function (connection) {
                wsConnection = connection;
                connection.on('message', function (message) {
                    // console.log('收到消息', message);
                    var message = message.utf8Data;
                    try {
                        message = JSON.parse(message);
                    } catch (e) {
                    }
                    var type = message.type;
                    switch (type) {
                        case 'command':
                            saveCommandForIOS(xctest, wsConnection, sessionId, message.data.cmd, message.data.data);
                            break;
                        case 'mobileAppInfo':
                            saveCommandForIOS(xctest, wsConnection, sessionId, 'mobileAppInfo');
                            break;
                    }

                });
                connection.on('close', function (reasonCode, description) {
                    wsConnection = null;
                });
            });

            this.body = {
                success: true,
                data: {webSocketPort: serverPort}
            };

        } else {

            var serverPort = yield detect(9765);
            var server = http.createServer();
            server.listen(serverPort, function () {
                console.log('----', serverPort);
            });

            var wsServer = new WebSocketServer({
                httpServer: server,
                autoAcceptConnections: true
            });

            map.set(serialNumber, server);

            wsServer.on('connect', co.wrap(function*(connection) {

                var wsConnection = connection;

                client.openLocal(serialNumber, 'localabstract:minitouch')
                    .timeout(10000)
                    .then(function (touchStream) {
                        console.log('minitouch start');
                        return client.openLocal(serialNumber, 'localabstract:minicap')
                            .timeout(10000)
                            .then(function (stream) {
                                console.log('minicap start')
                                var readBannerBytes = 0
                                var bannerLength = 2
                                var readFrameBytes = 0
                                var frameBodyLength = 0
                                var frameBody = new Buffer(0)
                                var banner = {
                                    version: 0
                                    , length: 0
                                    , pid: 0
                                    , realWidth: 0
                                    , realHeight: 0
                                    , virtualWidth: 0
                                    , virtualHeight: 0
                                    , orientation: 0
                                    , quirks: 0
                                }

                                function tryRead() {
                                    for (var chunk; (chunk = stream.read());) {
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
                                                    console.log('banner', banner)
                                                }
                                            }
                                            else if (readFrameBytes < 4) {
                                                frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0
                                                cursor += 1
                                                readFrameBytes += 1
                                                // console.info('headerbyte%d(val=%d)', readFrameBytes, frameBodyLength)
                                            }
                                            else {
                                                if (len - cursor >= frameBodyLength) {
                                                    // console.info('bodyfin(len=%d,cursor=%d)', frameBodyLength, cursor)

                                                    frameBody = Buffer.concat([
                                                        frameBody
                                                        , chunk.slice(cursor, cursor + frameBodyLength)
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
                                                }
                                                else {
                                                    // console.info('body(len=%d)', len - cursor)

                                                    frameBody = Buffer.concat([
                                                        frameBody
                                                        , chunk.slice(cursor, len)
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

                                connection.on('message', function (message) {
                                    console.log('收到消息', message);
                                    var message = message.utf8Data;
                                    try {
                                        message = JSON.parse(message);
                                    }
                                    catch (e) {
                                    }
                                    ;
                                    var type = message.type;
                                    console.log('type', type);
                                    switch (type) {
                                        case 'command':
                                            saveCommand(serialNumber, message.data.cmd, message.data.data, touchStream,wsConnection);
                                            break;
                                    }

                                });
                                connection.on('close', function (reasonCode, description) {
                                    wsConnection = null;
                                    console.info('Lost a client')
                                    stream.end();
                                    touchStream.end();
                                });
                            })
                            .catch(function (err) {
                                console.log(err);
                            })
                    });

            }));

            var sourcePort;
            if(isRecord){
                var adb1 = new ADB();
                adb1.setDeviceId(serialNumber);
                var uiautomator = new UIAutomator();
                yield uiautomator.init(adb1);
                adbMap.set(serialNumber,adb1);
                uiautomatorMap.set(serialNumber, uiautomator);

                sourcePort = yield detect(9766);
                var sourceServer = http.createServer();
                sourceServer.listen(sourcePort, function () {
                    console.log('----', sourcePort);
                });

                var sourceWsServer = new WebSocketServer({
                    httpServer: sourceServer,
                    autoAcceptConnections: true
                });

                sourceWsServer.on('connect', co.wrap(function*(connection) {
                    connection.on('message', function (message) {
                        var message = message.utf8Data;
                        try {
                            message = JSON.parse(message);
                        }
                        catch (e) {
                        }
                        ;
                        var type = message.type;
                        switch (type) {
                            case 'command':
                                saveCommand(serialNumber, message.data.cmd, message.data.data, null,connection);
                                break;
                        }

                    });
                    connection.on('close', function (reasonCode, description) {
                        wsConnection = null;
                        console.info('Lost a client')
                    });

                }));

            }

            console.log('run success,webSocketPort:', serverPort);

            this.body = {
                success: true,
                data: {webSocketPort: serverPort,sourcePort:sourcePort}
            };

        }


    } catch (ex) {
        console.log(ex);
        this.body = {
            success: false,
            errorMsg: '运行手机失败',
            data: null
        };
    }
}

function saveCommand(udid, cmd, data, touchStream,wsConnection) {

    co(function*() {

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
            case 'getSource':
                yield getSourceForAndroid(wsConnection,udid);
                break;
        }
    });


}


function saveCommandForIOS(xctest, wsConnection, sessionId, cmd, data) {

    co(function*() {

        switch (cmd) {
            case 'click':
                try {
                    yield xctest.sendCommand(`/session/${sessionId}/tap/null`, 'post',
                        {"x": data.touchX, "y": data.touchY});
                } catch (ex) {
                    console.log(ex);
                }
                break;
            case 'swipe':
                try {
                    yield xctest.sendCommand(`/session/${sessionId}/dragfromtoforduration`, 'post',
                        {
                            "fromX": data.startX,
                            "fromY": data.startY,
                            "toX": data.endX,
                            "toY": data.endY,
                            "duration": 0.5
                        });

                } catch (ex) {
                    console.log(ex);
                }
                break;
            case 'mobileAppInfo':
                try {
                    const screenshot = yield _.request(`http://${xctest.proxyHost}:${xctest.proxyPort}/screenshot`, 'get', {});
                    const base64Data = JSON.parse(screenshot).value;
                    // console.log('base64Data',base64Data);
                    sendWsMessage(wsConnection, 'mobileAppInfo', {
                        screenshot: base64Data
                    });
                } catch (ex) {
                    console.log(ex);
                }
                break;

            case 'home':
                yield xctest.sendCommand(`/homescreen`, 'post');
                break;

        }

    });
}

function sendWsMessage(wsConnection, type, data) {
    if (wsConnection) {
        var message = {
            type: type,
            data: data
        };
        wsConnection.send(JSON.stringify(message));
    }
}


function* dispatch() {
    logger.debug('controller devices');
    if (this.params.method) {
        switch (this.params.method) {
            case 'control_devices':
                yield controlDevices.call(this);
                break;
        }
        ;
    } else {
        this.body = yield getDeviceList.call(this);
    }

}

module.exports = dispatch;
