'use strict';
const fork = require('child_process').fork;
const logger = require( '../logs/logs.js');
//const emitter = require("../mqttclient/subscribe/mqtt_event.js");
const config = require('config-lite');

const http_hnd = require('../process-http/http_phandle.js');
//console.log('[main] create mqtt process...');



//创建一个工作进程
const mqtt_p = fork('./process-mqtt/mqtter_main.js');
mqtt_p.on('message', function (message) {
    //console.log('[main] recv mqtt message, pid =', process.pid);
    console.log('[main] recv mqtt message, message =', JSON.stringify(message));

    // 发送task 事件， 主进程中使用监听函数监听
    /*
    if (message['task_id']){
        emitter.emit(message['task_id'], message['router_mac'], message['body']);
    }
    */
});

mqtt_p.on('error', (err) => {
    logger.info('mqtt error:', err);
});

mqtt_p.on('exit', (err) => {
    logger.error('mqtt exit:', err);
});

mqtt_p.on('close', (err) => {
    logger.error('mqtt close:', err);
    //异常直接退出主进程，外部pm2重启整个进程
    //这里要杀死其它子进程

    logger.error('mqtt close, http_pid:', config.process.http_pid);
    if(config.process.http_pid > 0)
    {
        logger.error('ready kill http pid:', config.process.http_pid );
        process.kill(config.process.http_pid);
    }
    if(config.process.https_pid > 0)
    {
        logger.error('ready kill https pid:', config.process.https_pid );
        process.kill(config.process.https_pid);
    }
    if(config.process.mqtter_pid > 0)
    {
        logger.error('ready kill mqtter pid:', config.process.mqtter_pid );
        process.kill(config.process.mqtter_pid);
    }
    if(config.process.timer_pid > 0)
    {
        logger.error('ready kill timer pid:', config.process.timer_pid );
        process.kill(config.process.timer_pid);
    }

    //<boolean> 当 subprocess.kill() 已成功发送信号给子进程后会被设置为 true。
    logger.error('http_hnd.killed:', http_hnd.killed);
    // 发送 SIGHUP 到进程
    http_hnd.kill();
    logger.error('http_hnd.killed:', http_hnd.killed);
    process.exit(0);
});


//导出模块
module.exports = mqtt_p;
