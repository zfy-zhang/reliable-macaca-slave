'use strict';

var fs = require('fs');
var path = require('path');
var co = require('co');
var pathUtil = require('../../common/util');
var Promise = require('bluebird');

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
                                        .then( co.wrap(function*(properties) {

                                            try{
                                                console.log('device.id',device.id);

                                            }catch (ex){
                                                console.log();
                                            }
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

                                                if (!hasMiniTouch) {
                                                    //push mini touch
                                                    console.log('minitouch not installed,and install minitouch ...');
                                                    yield client.push(device.id, pathUtil.vendor(minitouchPath), '/data/local/tmp/minitouch', 0o755);
                                                }
                                            } catch (ex) {
                                                console.log(ex);
                                            }


                                            // yield client.shell(device.id,' ps | grep minitouch').then(adb.util.readAll)
                                            //     .then(co.wrap(function*(output) {
                                            //         if(!output.toString().trim()){
                                            //             console.log('start minitouch');
                                            //             // start minitouch
                                            //             try{
                                            //                 yield client.shell(device.id, '/data/local/tmp/minitouch',function(){
                                            //                     console.log('-----')
                                            //                 });
                                            //             }catch (ex){
                                            //                 console.log(ex);
                                            //             }
                                            //         }
                                            //     }));


                                        }));
                                } else {
                                    // console.log('device[%s] all installed', device.id);
                                }

                            });
                    })
                });


        });


    }, 3 * 1000);

}

module.exports = installMiniCapAndTouch;
