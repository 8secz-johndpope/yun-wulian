'use strict';
//const MqttPubHandle = require('../../../mqttclient/publish/mqtt_pub.js');
//const MqttSubHandle = require("../../../mqttclient/subscribe/mqtt_sub.js");
const DB = require( "../../../models/models.js");
const dtime = require( 'time-formater');
const config = require( "config-lite");
const logger = require( '../../../logs/logs.js');
const fs = require("fs");
const path = require('path');
const MqttPubHandle = require('../../../mqttclient/publish/mqtt_pub.js');
const MqttSubHandle = require("../../../mqttclient/subscribe/mqtt_sub.js");

class CmdProcHandle {
	constructor(){
        //console.log('RomPkgHandle constructor...');
	}


    async exec_shell_cmd(req, res, next){
        console.log('cmd exec_shell_cmd');

        //获取表单数据，josn
        var route_mac = req.body['route_mac'];
        var shell_cmd = req.body['shell_cmd'];


        //logger.info(req.hostname , req.url, req.protocol, req.ip);
        logger.info('route_mac:', route_mac, shell_cmd);


        //支持批量任务下发
        var taskHandle = await MqttPubHandle.createTaskHandle(req.session.user_account, 'NA', route_mac);
        //执行固件升级命令
        var taskid = await MqttPubHandle.CMD_SHELL.linux(taskHandle, shell_cmd);
        //res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: taskid});


        // 监听器, 更新任务结果，在updateResponse 中
        // 正常升级过程中没有回应消息，需要起定时器进行查询升级结果
        var listener = async function (mac, josnObj) {
            logger.info('Hello listener:', josnObj);
            //timeout, 命令下发后，router进行升级，不回应该消息，timeout认为success
            if (mac == -1 || josnObj == "timeout") {
                res.send({ret_code: -1, ret_msg: '执行超时', extra: taskid});
            }
            //成功的状态为0
            else if (josnObj['retcode'] == "0") {
                res.send({ret_code: 0, ret_msg: '成功', extra: josnObj['retmsg']});
            }
            else{
                res.send({ret_code: -1, ret_msg: '失败', extra: josnObj});
                return;
            }

        };
        //监听下发任务的结果, 超时5000ms
        //监听下发任务的结果
        await MqttSubHandle.addOnceListener(taskHandle['uuid'], listener, 10000);

    }


    async exec_remote_ssh(req, res, next) {
        console.log('cmd exec_remote_ssh');

        //获取表单数据，josn
        var id = req.body['_id'];
        //var file_name = req.body['file_name'];

        //参数有效性检查
        if(typeof(id)==="undefined" ){
            res.send({ret_code: 1002, ret_msg: '用户输入参数无效', extra:''});
            return;
        }

        //console.log('romDocObj fields: ', romDocObj);
        //设置上架状态
        var updatestr = {'rom_status': 'normal'};
        var query = await DB.RomTable.findByIdAndUpdate(id, updatestr);
        res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: query});

    }

    async exec_remote_reboot(req, res, next) {
        console.log('cmd exec_remote_reboot');

        //获取表单数据，josn
        var id = req.body['_id'];
        //var file_name = req.body['file_name'];

        //参数有效性检查
        if(typeof(id)==="undefined" ){
            res.send({ret_code: 1002, ret_msg: '用户输入参数无效', extra:''});
            return;
        }

        //console.log('romDocObj fields: ', romDocObj);
        //设置上架状态
        var updatestr = {'rom_status': 'normal'};
        var query = await DB.RomTable.findByIdAndUpdate(id, updatestr);
        res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: query});

    }



}

const CmdProcHnd = new CmdProcHandle();
module.exports = CmdProcHnd;

