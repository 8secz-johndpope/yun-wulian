'use strict';
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;


//设备建立全量的表，不同设备公用，如果没有的项 填写NA
const devunitTriggerSchema = new mongoose.Schema({
    device_name:String,  //设备名称
    devunit_name:String,  //设备元名称
    varName:String,  //变量名称，number1
    //varValue:String,  //变量名称，number1
    if_number:String,  //变量需要比较的值
    if_symbol:String, //操作符号，等于，不等于，小于，大于
    if_true_comment:String, //  判断正确输出的内容
    if_false_comment:String, //判断错误输出的内容

    logs_type:String, //日志类型， alarm， operate

    update_time:String, //状态更新时间
    sort_time:Number, //排序时间戳，
});



const devunitTriggerTable = mongoose.model('devunitTriggerTable', devunitTriggerSchema);

//导出模块
module.exports = devunitTriggerTable;