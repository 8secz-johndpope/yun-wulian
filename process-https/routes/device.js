'use strict';

const express = require('express');
const DeviceHandle = require('../../controller-https/device/device.js');
const Check = require( '../../middlewares/check');

const router = express.Router();


console.log("enter route of device");


//根据设备MAC,获取设备信息
router.all('/sysinfo', DeviceHandle.sysinfo);
//router.post('/sysinfo', DeviceHandle.sysinfo);
//router.get('/sysinfo', DeviceHandle.sysinfo);

//给渠道导入要管理的设备（根据mac地址或者特定格式的文件）
router.all('/import', Check.checkSuperAdmin, DeviceHandle.import);
router.all('/import/excel', DeviceHandle.import_excel);


//设备退出渠道
router.all('/leave', DeviceHandle.leave);

//根据用户条件，将终端渠道下的设备以excel文件方式导出。
router.all('/export',Check.checkSuperAdmin, DeviceHandle.export);

//获取渠道下的设备信息列表
router.all('/list', DeviceHandle.permission, DeviceHandle.list);


//根据设备的MAC地址，查询设备在线状态
router.all('/status', DeviceHandle.status);

//获取渠道下的在线设备信息列表
router.all('/list/online', DeviceHandle.permission, DeviceHandle.onLineList);

//获取渠道下的离线设备信息列表
router.all('/list/offline', DeviceHandle.permission, DeviceHandle.offLineList);


//批量删除路由
router.all('/batch/remove', DeviceHandle.permission, DeviceHandle.batchRemove);

module.exports = router;
