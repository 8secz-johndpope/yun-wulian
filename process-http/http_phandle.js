'use strict';
const fork = require('child_process').fork;
const logger = require( '../logs/logs.js');
const config = require('config-lite');

//console.log('[main] create http process...');

//创建一个工作进程
const http_p = fork('./process-http/http_main.js');
http_p.on('message', function () {
    //config.process.http_pid = process.pid;
    console.log('[main] recv http message, pid =', process.pid);
    //console.log('[main] recv http message, pid =', config.process.http_pid);
});


http_p.on('error', (err) => {
    logger.info('http error:', err);
});

http_p.on('exit', (err) => {
    logger.error('http exit:', err);
});

http_p.on('close', (err) => {
    logger.error('http close:', err);
    //异常直接退出主进程，外部pm2重启整个进程
    //这里要杀死其它子进程
    if(config.process.http_pid > 0)    process.kill(config.process.http_pid);
    if(config.process.https_pid > 0)    process.kill(config.process.https_pid);
    if(config.process.mqtter_pid > 0)    process.kill(config.process.mqtter_pid);
    if(config.process.timer_pid > 0)    process.kill(config.process.timer_pid);

    process.exit(0);
});


//导出模块
module.exports = http_p;

