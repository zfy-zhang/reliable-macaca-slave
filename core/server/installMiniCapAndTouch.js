'use strict';

var fs = require('fs');
var path = require('path');
var co = require('co');
var pathUtil = require('../../common/util');
var Promise = require('bluebird');
var util = require('util');
var _ = require('../../common/helper');
var logger = require('../../common/logger');
var adb = require('adbkit');
var client = adb.createClient();

var resources = {
    bin: {
        dest: '/data/local/tmp/minicap'
        , comm: 'minicap'
        , mode: 0o755
    }
    , lib: {
        dest: '/data/local/tmp/minicap.so'
        , mode: 0o755
    }
}


function installMiniCapAndTouch() {
    setInterval(() => {
            co(function*() {

                yield client.listDevices()
                    .then(function (devices) {
                        return Promise.map(devices, function (device) {

                            return client.readdir(device.id, '/data/local/tmp')
                                .then(function (files) {

                                    var hasMiniTouch = false;
                                    var hasMiniCap = false;
                                    var hasMiniCapSo = false;

                                    files.forEach(function (file) {
                                        if (file.isFile()) {
                                            if ('minitouch' == (file.name)) {
                                                hasMiniTouch = true;
                                            } else if ('minicap' == (file.name)) {
                                                hasMiniCap = true;
                                            } else if ('minicap.so' == (file.name)) {
                                                hasMiniCapSo = true;
                                            }
                                        }
                                    });

                                    if (!(hasMiniTouch && hasMiniCap && hasMiniCapSo)) {
                                        console.log('something not installed');

                                        return client.getProperties(device.id)
                                            .then(co.wrap(function*(properties) {
                                                var cpu = properties['ro.product.cpu.abi'];
                                                var sdk = properties['ro.build.version.sdk'];
                                                var minicapPath = 'minicap-prebuilt/prebuilt/' + cpu + '/bin/minicap' + (sdk >= 16 ? '' : '-nopie');
                                                var minicapSoPath = 'minicap-prebuilt/prebuilt/' + cpu + '/lib/android-' + sdk + '/minicap.so';
                                                var minitouchPath = 'minitouch/' + cpu + '/minitouch' + (sdk >= 16 ? '' : '-nopie');

                                                try {
                                                    //push minicap and minicap.so
                                                    if (!hasMiniCap) {
                                                        console.log('minicap not installed,and install minicap ...');
                                                        yield client.push(device.id, pathUtil.module(minicapPath), resources.bin.dest, resources.bin.mode);
                                                    }

                                                    if (!hasMiniCapSo) {
                                                        console.log('minicapso not installed,and install minicapso ...');
                                                        yield client.push(device.id, pathUtil.module(minicapSoPath), resources.lib.dest, resources.bin.mode);
                                                    }

                                                } catch (ex) {
                                                    console.log('安装minicap失败');
                                                }
                                                try {
                                                    if (!hasMiniTouch) {
                                                        //push mini touch
                                                        console.log('minitouch not installed,and install minitouch ...');
                                                        yield client.push(device.id, pathUtil.vendor(minitouchPath), '/data/local/tmp/minitouch', 0o755);
                                                        yield client.shell(device.id, '/data/local/tmp/minitouch &');
                                                    }
                                                } catch (ex) {
                                                    console.log('安装启动minitouch失败');
                                                }
                                            }));
                                    } else {

                                        client.shell(device.id, ' ps | grep minitouch').then(adb.util.readAll)
                                            .then(function (output) {
                                                var result = output.toString().trim();
                                                if (!result) {
                                                    console.log('start minitouch')
                                                    client.shell(device.id, '/data/local/tmp/minitouch &');
                                                }
                                            }).catch(function (err) {
                                            console.log('启动minitouch失败');
                                        })

                                        var resolution;

                                        return client.shell(device.id, ' wm size').then(adb.util.readAll)
                                            .then(function (result) {
                                                result.toString().replace(/Physical size: (.+?)\s+\r?\n/g, function (all, screen) {
                                                    resolution = screen.toString().trim();
                                                });
                                                return resolution;
                                            }).then(function (resolution) {
                                                return client.shell(device.id, ' ps | grep minicap')
                                            })
                                            .then(adb.util.readAll)
                                            .then(function (output) {
                                                var result = output.toString().trim();

                                                if (!result) {
                                                    return client.shell(device.id, util.format(
                                                        'LD_LIBRARY_PATH=%s exec %s %s &', path.dirname(resources.lib.dest), resources.bin.dest, '-P ' + resolution + '@' + resolution + '/0 '
                                                    ));

                                                }
                                            }).catch(function (err) {
                                                console.log(err);
                                            })


                                    }

                                });
                        })
                    });


            });


        }
        ,
        3 * 1000
    )
    ;

}

module.exports = installMiniCapAndTouch;
