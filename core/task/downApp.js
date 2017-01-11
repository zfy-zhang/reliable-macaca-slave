/**
 * Created by Administrator on 2016/12/6.
 */
var http = require('http');
const co = require('co');
var fs = require('fs');
var path = require('path');
var _ = require('../../common/helper');
var request = require('request');
var REQUST = require("co-request");
function  *getApp(cloneOptions){
    try{
        var demourl = cloneOptions.master+'/getAttachments/getApp/'+cloneOptions.attachmentId;
        var resultData =yield REQUST.get({ url: demourl+'?checkmd5=true'});

        var data = resultData.body;
        var dataForm = JSON.parse(data);
        var checkmd5 = dataForm.checkmd5;
        var appName = dataForm.fileName;
        var appFilePath = path.join(__dirname, '../../','.temp', 'app',checkmd5);
        if(!fs.existsSync(appFilePath)){
            _.mkdir(appFilePath);
            var downFile = path.join(appFilePath,appName);
            var promise = new Promise(function (resolve, reject) {
                var out = request(demourl).pipe(fs.createWriteStream(downFile));
                out.on('finish', function () {
                    resolve("OK");
                });
            });
            var resultStr = yield promise;
        }
    }catch (e){
        console.log(e);
    }


}

module.exports = function *(cloneOptions) {
    yield getApp(cloneOptions);
}
