'use strict';
//const MqttPubHandle = require('../../../mqttclient/publish/mqtt_pub.js');
//const MqttSubHandle = require("../../../mqttclient/subscribe/mqtt_sub.js");
const DB = require( "../../../models/models.js");
const dtime = require( 'time-formater');
const config = require( "config-lite");
const logger = require( '../../../logs/logs.js');
const fs = require("fs");
const path = require('path');
const multiparty = require('multiparty');
const formidable = require('formidable');

class RomPkgHandle {
	constructor(){
        //logger.info('RomPkgHandle constructor...');
	}

	async download_test(req, res) {
        logger.info('rom download');

        //获取表单数据，josn
        var id = req.body['_id'];
        var file_name = req.body['file_name'];


        //file_name = 'openwrt-uboot-zc9525a.bin';
        //file_name = '63.0.3239.108.manifest';

        // 实现文件下载
        var filePath = path.join(config.firmware_dir, file_name);

        res.download(filePath, file_name, function(err){
            if(err){
                //处理错误，可能只有部分内容被传输，所以检查一下res.headerSent
                res.send({ret_code: -1, ret_msg: 'FAILED', extra:err});
                logger.info('err:', err);
            }else{
                //减少下载的积分值之类的。
                //res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: 'download ok'});
            }
        });

/*
        var stats = fs.statSync(filePath);
        if(stats.isFile()){
            res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename='+file_name,
                'Content-Length': stats.size
            });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.end(404);
        }
        */
	}

    async download_check(req, res) {
        logger.info('rom download_check');

        //获取表单数据，josn
        var id = req.body['_id'];
        var file_name = req.body['file_name'];

        //参数有效性检查
        if (typeof(id) === "undefined" || typeof(file_name) === "undefined") {
            res.send({ret_code: 1002, ret_msg: 'FAILED', extra: '用户输入参数无效'});
            return;
        }

        //logger.info('request fields: id:', id);
        //检查上下架状态
        try {
            var query = await DB.RomTable.findById(id).exec();
            logger.info('query rom_status:', query['rom_status'] );
            if (query['rom_status'] == 'revoke') {  //下架状态
                res.send({ret_code: 1003, ret_msg: 'FAILED', extra: '固件已下架'});
                return;
            }
        }
        catch(err){
            await res.send({ret_code: -1, ret_msg: 'FAILED', extra:err});
            return;
        }

        if (query['file_name'] != file_name){
            res.send({ret_code: 1016, ret_msg: 'FAILED', extra: '文件名称错误'});
            return;
        }

        //直接访问文件进行下载
        var access_path = '/firmware/' + file_name;
        res.send({ret_code: 0, ret_msg: 'SUCCESS', extra:{'access_path':access_path}});
        logger.info('rom download_check end');
        return;
    }


    async download(req, res) {
        logger.info('rom download');

        //获取表单数据，josn
        var id = req.body['_id'];
        var file_name = req.body['file_name'];

        //参数有效性检查
        if (typeof(id) === "undefined" || typeof(file_name) === "undefined") {
            res.send({ret_code: 1002, ret_msg: 'FAILED', extra: '用户输入参数无效'});
            return;
        }

        //logger.info('request fields: id:', id);
        //检查上下架状态
        try {
            var query = await DB.RomTable.findById(id).exec();
            logger.info('query rom_status:', query['rom_status'] );
            if (query['rom_status'] == 'revoke') {  //下架状态
                res.send({ret_code: 1003, ret_msg: 'FAILED', extra: '固件已下架'});
                return;
            }
        }
        catch(err){
            await res.send({ret_code: -1, ret_msg: 'FAILED', extra:err});
            return;
        }

        // 实现文件下载
        var filePath = path.join(config.firmware_dir, file_name);
        res.download(filePath, file_name, function(err){
            if(err){
                //处理错误，可能只有部分内容被传输，所以检查一下res.headerSent
                res.send({ret_code: -1, ret_msg: 'FAILED', extra:err});
            }else{
                //减少下载的积分值之类的。
                //res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: 'download ok'});
            }
        });
	}

    //1.fs.writeFile(filename,data,[options],callback); 创建并写入文件
    /**
     * filename, 必选参数，文件名
     * data, 写入的数据，可以字符或一个Buffer对象
     * [options],flag 默认‘2’,mode(权限) 默认‘0o666’,encoding 默认‘utf8’
     * callback  回调函数，回调函数只包含错误信息参数(err)，在写入失败时返回。
     */


    //2.readFile(filename,[options],callback); 读取文件内容
    //字符串方式读取文件
    /**
     * filename, 必选参数，文件名
     * [options],可选参数，可指定flag 默认为‘r’，encoding 默认为null，在读取的时候，需要手动指定
     * callback 读取文件后的回调函数，参数默认第一个err,第二个data 数据
     */
	async upload(req, res){

        logger.info('upload');
        //logger.info(req);

        //生成multiparty对象，并配置上传目标路径
        /*
        fields： 是一个对象（上传名称和值），其属性名的字段名称和值是字段值的数组。
        files ：是一个对象（上传名称和服务器文件路径），其属性名的字段名称和值是文件对象的数组。
        */

        //var form = new multiparty.Form({uploadDir: config.firmware_dir});
        var fileName = '';
        var uploadedPath = '';
        var fileMatch = -1;
        var form = new formidable.IncomingForm({
            encoding: 'utf-8',
            keepExtensions: true,
            maxFieldsSize: 10 * 1024 * 1024,
            uploadDir: config.firmware_dir
        });

        var fields = {};   //各个字段值
        form.on('field', function (field, value) {
            //logger.info('upload field: ', field, value);
            fields[field] = value;
        });

        form.on('file', function (field, file) {
            fileName = file.name;
            uploadedPath = file.path;
            logger.info('upload file: ', fileName, uploadedPath);
        });

        form.on('fileBegin', function () {
            logger.info('begin upload...');
        });

        form.on('end', async function () {
            logger.info('upload end: ');
            //logger.info(fields);

            //参数有效性检查
            if (typeof(fields.dev_type) === "undefined" || fields.dev_type == ""
                || typeof(fields.ver_type) === "undefined" || fields.ver_type == ""
                || typeof(fields.rom_version) === "undefined" || fields.rom_version == ""
                || typeof(fields.md5_value) === "undefined" || fields.md5_value == "" ){
                res.send({ret_code: 1002, ret_msg: '用户输入参数无效', extra: ''});
                fs.unlinkSync(uploadedPath);
                return;
            }

            var query = await DB.RomTable.findOne({'dev_type': fields.dev_type, 'rom_version': fields.rom_version}).exec();
            if (query != null){
                logger.info('the same version already exist');
                res.send({ret_code: 1009, ret_msg: '同类型设备版本号已存在', extra: ''});
                fs.unlinkSync(uploadedPath);
                return;
            }

            var query = await DB.RomTable.findOne({'file_name': fileName}).exec();
            if (query != null){
                logger.info('the same file already exist');
                res.send({ret_code: 1008, ret_msg: '同名文件已存在', extra: ''});
                fs.unlinkSync(uploadedPath);
                return;
            }

            logger.info('fs.rename');
            //重命名为真实文件名
            var dstPath = path.join(config.firmware_dir, fileName);
            fs.rename(uploadedPath, dstPath, function(err) {
                if(err){
                    res.send({ret_code: -1, ret_msg: 'FAILED', extra: err});
                } else {
                    res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: 'upload ok'});

                    var mytime =  new Date();
                    //写入数据库
                    var romDocObj = {
                        "file_name": fileName,
                        "rom_version" : fields.rom_version,
                        "dev_type": fields.dev_type,
                        "ver_type": fields.ver_type,
                        "md5_value": fields.md5_value,
                        "comment": fields.comment,
                        "rom_status" : 'normal',  //上架
                        "create_date": dtime(mytime).format('YYYY-MM-DD HH:mm:ss'),
                        'sort_time':mytime.getTime(),
                    };

                    //logger.info('romDocObj fields: ', romDocObj);
                    DB.RomTable.create(romDocObj);
                }
            });

            /*
            //文件和设备类型检查，读取文件前64字节
            var readable  = fs.createReadStream(uploadedPath, { start: 0, end: 80 });
            readable.on('data', function(chunk){
                //fileMatch = chunk.indexOf(fields.dev_type.toUpperCase());
                fileMatch = chunk.indexOf(fields.dev_type);
                logger.info('read %d, match', chunk.length, fileMatch);
            });

            readable.on('end', async function(){
                logger.info('read end');
                /*
                if (fileMatch < 0){
                    logger.info('romfile is not match dev_type');
                    res.send({ret_code: 1008, ret_msg: 'FAILED', extra: '设备类型和文件不匹配'});
                    fs.unlinkSync(uploadedPath);
                    return;
                }
                */

            //});

        });

        form.on('error', function(err) {
            res.send({ret_code: -1, ret_msg: '上传出错', extra:""});
        });

        form.parse(req);
        logger.info('upload ok');

	}

	async list(req, res, next){
        logger.info('rom list');
        //logger.info(req.body);

        //获取表单数据，josn
        var page_size = req.body['page_size'];
        var current_page = req.body['current_page'];
        var sort = req.body['sort'];
        var filter = req.body['filter'];

        // 如果没有定义排序规则，添加默认排序
        if(typeof(sort)==="undefined"){
            logger.info('sort undefined');
            sort = {"sort_time":-1};
        }

        // 如果没有定义排序规则，添加默认排序
        if(typeof(filter)==="undefined"){
            logger.info('filter undefined');
            filter = {};
        }

        //参数有效性检查
        if(typeof(page_size)==="undefined" && typeof(current_page)==="undefined"){
            var query = await DB.RomTable.find(filter).sort(sort);
            res.send({ret_code: 0, ret_msg: 'SUCCESS', extra:query});
        }
        else if (page_size > 0 && current_page > 0) {
            //var ret = await DB.RomTable.findByPage(filter, page_size, current_page, sort);
            var skipnum = (current_page - 1) * page_size;   //跳过数
            var query = await DB.RomTable.find(filter).sort(sort).skip(skipnum).limit(page_size);
            res.send({ret_code: 0, ret_msg: 'SUCCESS', extra:query});
        }
        else{
            res.send({ret_code: 1002, ret_msg: '用户输入参数无效', extra:''});
        }
        //logger.info('rom list end');
	}
	async del(req, res, next) {

        logger.info('rom delete');
        //logger.info(req.body);

        //获取表单数据，josn
        var id = req.body['_id'];
        var file_name = req.body['file_name'];

        //参数有效性检查
        if(typeof(id)==="undefined" || typeof(file_name)==="undefined" ){
            res.send({ret_code: 1002, ret_msg: '用户输入参数无效', extra:''});
            return;
        }

        try{
            var query = await DB.RomTable.findByIdAndRemove (id);
            var filePath = path.join(config.firmware_dir, file_name);
            fs.unlink(filePath, function(err) {
                if (err){
                    res.send({ret_code: -1, ret_msg: 'FAILED', extra:err});
                }
                else{
                    res.send({ret_code: 0, ret_msg: 'SUCCESS', extra:'delete ok'});
                }
            });
        }catch(err){
            res.send({ret_code: -1, ret_msg: 'FAILED', extra:err});
        }
        logger.info('rom delete end');

    }


    async revoke(req, res, next){
        logger.info('rom revoke');

        //获取表单数据，josn
        var id = req.body['_id'];
        //var file_name = req.body['file_name'];


        //参数有效性检查
        if(typeof(id)==="undefined"){
            res.send({ret_code: 1002, ret_msg: '用户输入参数无效', extra:''});
            return;
        }

        //logger.info('_id: ', id);
        //设置下架状态
        var updatestr = {'rom_status': 'revoke'};
        var query = await DB.RomTable.findByIdAndUpdate(id, updatestr);
        res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: query});

    }


    async release(req, res, next) {
        logger.info('rom release');

        //获取表单数据，josn
        var id = req.body['_id'];
        //var file_name = req.body['file_name'];

        //参数有效性检查
        if(typeof(id)==="undefined" ){
            res.send({ret_code: 1002, ret_msg: '用户输入参数无效', extra:''});
            return;
        }

        //logger.info('romDocObj fields: ', romDocObj);
        //设置上架状态
        var updatestr = {'rom_status': 'normal'};
        var query = await DB.RomTable.findByIdAndUpdate(id, updatestr);
        res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: query});

    }


}

const RomPkgHnd = new RomPkgHandle();
module.exports = RomPkgHnd;

