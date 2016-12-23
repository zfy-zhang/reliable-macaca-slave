/**
 * Created by Administrator on 2016/12/5.
 */
var http = require('http');
const co = require('co');
var fs = require('fs');
var path = require('path');
var _ = require('../../common/helper');
var iconv = require('iconv-lite');
var request = require('request');
var REQUST = require("co-request");
var _ = require('../../common/helper');

function *getScript(cloneOptions){
    //-----------------------------下载并封装脚本start-------------------------------------
    var demourl = cloneOptions.master+'/getAttachments/getScript/'+cloneOptions.attachmentId;
    var resultData =yield REQUST.get({ url: demourl+'?checkmd5=true'});
    var data = resultData.body;
    var dataForm = JSON.parse(data);
    var checkmd5 = dataForm.checkmd5;
    var scriptName = dataForm.fileName;
    var scriptFilePath = path.join(__dirname, '../../', '.temp','script',checkmd5);

    //获取app信息start
    var appInfo = yield getAppInfo(cloneOptions);
    cloneOptions =  _.merge({appInfo:appInfo}, cloneOptions);
    //获取app信息end
    //若脚本已存在，直接使用本地脚本，若脚本不存在，则去master下载
    if(!fs.existsSync(scriptFilePath)){
        _.mkdir(scriptFilePath);
        var downFile = path.join(scriptFilePath,scriptName);
        var promise = new Promise(function (resolve, reject) {
            var out = request(demourl).pipe(fs.createWriteStream(downFile));
            out.on('finish', function () {
                resolve("OK");
                //文件下载完成后，调封装方法
                readFile(downFile,cloneOptions);
            });
        });
        var resultStr = yield promise;
    }else {
        var downFile = path.join(scriptFilePath,scriptName);
        readFile(downFile,cloneOptions);
    }


    //-----------------------------下载并封装脚本end-------------------------------------
}
//对下载的脚本进行封装
function readFile(downFile,cloneOptions) {
    // downFile = "E:\\macaca\\aadownLoad.js";
    var scriptFile = cloneOptions.dir;
    var modelFile = path.join(__dirname, '../../', 'common','scriptModel.test.js');
    var text = fs.readFileSync(modelFile);
    var script = fs.readFileSync(downFile);
    var modelText = iconv.decode(text, 'utf-8');
    var scriptText = iconv.decode(script, 'utf-8');
    var data = modelText.replace('#script-replace#', scriptText);
    //替换platform，app ,udid信息
    if(cloneOptions.runiOS){
        data = data.replace('#platform-replace#', 'ios');
        data = data.replace('#appname-ios-replace#', cloneOptions.appInfo);
        data = data.replace('#device-ios-udid#', cloneOptions.serialNumber);
    }else {
        data = data.replace('#platform-replace#', 'Android');
        data = data.replace('#appname-android-replace#', cloneOptions.appInfo);
        data = data.replace('#device-android-udid#', cloneOptions.serialNumber);

    }

    writeFile(scriptFile, data);
}
//获取app信息
function *getAppInfo(cloneOptions){
    var demourl = cloneOptions.master+'/getAttachments/getApp/'+cloneOptions.attachmentId;

    var resultData = yield REQUST.get({ url: demourl+'?checkmd5=true'});
    var dataString = resultData.body;
    var dataForm = JSON.parse(dataString);
    var checkmd5 = dataForm.checkmd5;
    var appname ='';
    var apppath = path.join(__dirname, '../../','.temp', '.app', checkmd5);
    fs.readdirSync(apppath).forEach(function(file) {
        appname = file;
    });
    return checkmd5+"','"+appname;
}

function writeFile(scriptFile,data){
    // 把中文转换成字节数组
    var arr = iconv.encode(data, 'utf-8');
    scriptFile = path.join(scriptFile,"macaca-test");
    if (!fs.existsSync(scriptFile)) {
        fs.mkdirSync(scriptFile);
    }
    scriptFile = path.join(scriptFile,"sample.test.js");
    // appendFile，如果文件不存在，会自动创建新文件
    // 如果用writeFile，那么会删除旧文件，直接写新文件
    fs.writeFileSync(scriptFile, arr);
}

module.exports =function *(cloneOptions) {
    yield getScript(cloneOptions);
}