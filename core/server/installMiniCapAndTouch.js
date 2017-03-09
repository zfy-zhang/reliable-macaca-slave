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


var cp = require('child_process');
var request = require('request');



var mongodb = require('mongodb')
var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/reliable';

var mongo=require("mongodb");
var host="localhost";
var port='27017';
var server=mongo.Server(host,port,{auto_reconnect:true});
var db=new mongo.Db("reliable",server,{safe:true});


var controllers = require('../../web/controllers');
var arrDeviceList =[];
var slaveId =[];
var allDeviceList = [];

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

function getIPAdress(){
    var interfaces = require('os').networkInterfaces();
    for(var devName in interfaces){
          var iface = interfaces[devName];
          for(var i=0;i<iface.length;i++){
               var alias = iface[i];
               if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                     return alias.address;
               }
          }
    }
}


/**
  判断数据库中是否存在该设备
*/

function contains(arr,obj){
  var i = arr.length;
  while(i--){
    if(arr[i].id===obj){
      return true;
    }
  }
  return false;
}





function installMiniCapAndTouch() {
  var result;
    db.open(function (err,db) {
    setInterval(() => {
            co(function*() {
                yield client.listDevices()
                    .then(function (devices) {
                      try {
                        //body...
                        console.log('devices====================',devices);


                        db.collection("devices", function (err,collection) {
                        collection.find().toArray(function(err,docs){
                              if(err){
                                        console.log(err);
                                }
                                allDeviceList=docs;

                              //db.close();
                              })
                            })


                            if(devices==''){
                              console.log('没有查询到可用的设备');
                              for(var j=0;j<allDeviceList.length;j++){
                                db.collection('devices',function(err,collection){
                                collection.update({serialNumber:allDeviceList[i].serialNumber},{$set:{status:1}},{safe:true},function(err,result){
                                          console.log('success');
                                });
                                })
                              }

                            }



                          console.log('deviceID ---------');
                      } catch (err) {
                        console.log(err);
                      }
                        return Promise.map(devices, function (device) {
                          console.log('deviceID ---------',device.id);
                          console.log('deivceType========',device.type);
                          if(device.type!='unauthorized'&&device.type!='offline'){
                            return client.getProperties(device.id)
                                .then(function (properties) {
                                  try {
                                    var address = getIPAdress();

                                    //  db.open(function (err,db) {

                                      db.collection("slaves", function (err,collection) {
                                      collection.find({slaveIp:{$in:[address]}}).toArray(function(err,docs){
                                              if(err){
                                                        console.log(err);
                                                }
                                                console.log('---------address----------',address);
                                                console.log('-----------------docs---------------',docs);
                                                slaveId.push(docs[0]._id);

                                              })
                                            })






                                      db.collection("devices", function (err,collection) {
                                        try {

                                          //body...
                                          if(err) throw err;
                                              else{
                                                  console.log('device.id',device.id);
                                                  collection.find({serialNumber:{$in:[device.id]}}).toArray(function(err,docs){

                                                    console.log('**************************',docs.length);
                                                    console.log('--------------------------',allDeviceList.length);



                                                    if(err) throw  err;
                                                      if (docs==''){
                                                        var strText = cp.execSync('adb -s ' + device.id + ' shell wm size').toString();
                                                        var resolution;

                                                        strText.replace(/Physical size: (.+?)\s+\r?\n/g, function (all, devicesName) {
                                                            resolution = devicesName.toString().trim();
                                                        });
                                                        console.log('this is new device');
                                                        arrDeviceList.push({
                                                            serialNumber: device.id,
                                                            model: properties['ro.product.model'],
                                                            brand: properties['ro.product.brand'],
                                                            releaseVersion: properties['ro.build.version.release'],
                                                            sdkVersion: properties['ro.build.version.sdk'],
                                                            abi: properties['ro.product.cpu.abi'],
                                                            product: properties['ro.product.name'],
                                                            // screen: resolution,
                                                            plantForm: 'Android',
                                                            status: '1'
                                                        });
                                                        var screen = resolution.split('x');
                                                        console.log('this is arrDeviceList',arrDeviceList);
                                                        var insertData = {"plantForm":arrDeviceList[0].plantForm,
                                                        "screenHeight" :screen[1],
                                                        "screenWidth" : screen[0],
                                                        "abi" :arrDeviceList[0].abi,
                                                        "sdkVersion" : arrDeviceList[0].sdkVersion,
                                                        "releaseVersion" : arrDeviceList[0].releaseVersion,
                                                        "model" : arrDeviceList[0].model,
                                                        "brand" : arrDeviceList[0].brand,
                                                        "serialNumber" : arrDeviceList[0].serialNumber,
                                                        "status" : 1,
                                                        "slaveId":slaveId[0].toString(),
                                                        "__v" : 0

                                                      };
                                                      console.log('this insertData',insertData);
                                                        collection.insert(insertData,function(error,result){
                                                          if (error) {
                                                            console.log(error);
                                                          }else{
                                                            console.log(result.result.n,'~~~~~~~~');
                                                          }

                                                        });
                                                        arrDeviceList=[];
                                                        slaveId=[];
                                                        //db.close();

                                                      }else{
                                                        console.log('----------已经有设备了-------');
                                                        for(var i=0;i<allDeviceList.length;i++){
                                                            //片段当前设备在数据库是否存在
                                                            console.log('he');
                                                            var checkDevice = contains(devices,allDeviceList[i].serialNumber);
                                                            console.log('============================+++++++++allDeviceList+++++++++================ ',allDeviceList[i].serialNumber);
                                                            console.log('============================++++++++++++++++++================ ',checkDevice);
                                                            if(checkDevice==false){
                                                                console.log('change  device status ------111111--------------------');
                                                              db.collection('devices',function(err,collection){
                                                              collection.update({serialNumber:allDeviceList[i].serialNumber},{$set:{status:4}},{safe:true},function(err,result){
                                                                        console.log('success');
                                                              });
                                                              })
                                                            }else if(checkDevice==true){
                                                              if(allDeviceList[i].status===4){
                                                                console.log('change  device status ----------44444----------------');
                                                                db.collection('devices',function(err,collection){
                                                                collection.update({serialNumber:allDeviceList[i].serialNumber},{$set:{status:1}},{safe:true},function(err,result){
                                                                          console.log('success');
                                                                });
                                                                })
                                                              }
                                                            }
                                                          }
                                                        //  db.close();
                                                          console.log(docs);
                                                          slaveId=[];

                                                        }
                                                    });
                                                   }
                                        } catch (err) {
                                            console.log(err);
                                        }

                                          });
                                      //  });

                                    } catch (err) {
                                        console.log(err);
                                    }

                              return client.readdir(device.id, '/data/local/tmp')
                                  .then(function (files) {
                                    console.log('======================================================================');
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
                          }

                        },{concurrency: 1})


                    });


            });


        },5 * 1000)
  });
}

/**
 * 查询本地的设备信息
 * @param slave
 * @returns {*}
 */
function *requestByUrl() {
    try {
        var result = yield request({
            uri: 'localhost:8080/devices',
            method: 'get'
        });
        result = JSON.parse(result.body);
        return result;
    } catch (e) {
        return false;
    }
}

module.exports = installMiniCapAndTouch;
