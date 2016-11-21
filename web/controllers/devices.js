'use strict';

var pkg = require('../../package.json');
var logger = require('../../common/logger');
var cp = require('child_process');
var os = require('os');
var Promise = require('bluebird')
var adb = require('adbkit')
var client = adb.createClient()


function *getDeviceList(){
    var arrDeviceList = [];
    var strText, match;
    var platform=os.platform();
    if(platform== 'win32'){
       yield client.listDevices()
            .then(function(devices) {
                return Promise.filter(devices, function(device) {
                    return client.getProperties(device.id)
                        .then(function(properties) {
                            strText = cp.execSync('adb -s '+device.id+' shell wm size').toString();
                            var resolution;

                            strText.replace(/Physical size:(.+?)\s+\r?\n/g, function(all, devicesName){
                                resolution=devicesName;
                            });

                            arrDeviceList.push({
                                serialNumber:device.id,
                                moedl:properties['ro.product.model'],
                                brand:properties['ro.product.brand'],
                                facturer:properties['ro.product.manufacturer'],
                                releaseVersion:properties['ro.build.version.release'],
                                sdkVersion:properties['ro.build.version.sdk'],
                                abi:properties['ro.product.cpu.abi'],
                                product:properties['ro.product.name'],
                                screen:resolution,
                                plantForm:'Android',
                                status:'1'
                            });
                            for(var i=0;i<arrDeviceList.length;i++){
                                console.log(arrDeviceList[i]);
                            }

                        }).catch(function(err) {
                            console.error('Something went wrong:', err.stack)
                            arrDeviceList.push({
                                errorMessage:err.stack,
                                status:'4'
                            });
                        }).then(function(property) {
                            //console.log('property:', property)
                        })
                })
            })
           .then(function(property) {
               //console.log('property:', property)
           })

    }else {
        strText = cp.execSync('xcrun simctl list devices').toString();
        strText.replace(/\r?\n\s*(.+?)\s+\((.+?)\) \(Booted\)/g, function(all, deviceName, udid){
            arrDeviceList.push({
                name: deviceName,
                udid: udid
            });
        });
    }
    return arrDeviceList;
}

function *render() {
  var context = yield getDeviceList.call(this);
  this.body = context;
}

function *dispatch() {
  logger.debug('controller devices');
  yield render.call(this);
}

module.exports = dispatch;
