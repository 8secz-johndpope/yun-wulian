
'use strict';

const RomTable = require("../models/rom/rom.js");
const RomUpgradeTable= require("../models/rom/rom_upgrade.js");
const TaskTable= require("../models/task/task.js");
const SysinfoTable= require("../models/sysinfo/sysinfo.js");
const DeviceTable= require("../models/device/device.js");
const GatewayIDE4g_Real_Table= require("./device/gateway_ide4g_real.js");
const GatewayIDE4g_M1_Table= require("./device/gateway_ide4g_m1.js");
const GatewayIDE4g_Hour_Table= require("./history_gateway/gateway_ide4g_hour1.js");
const GatewayIDE4g_Day_Table= require("./history_gateway/gateway_ide4g_day1.js");
const InvoiceHourTable= require("./stats/invoice_stats_hour.js");
const InvoiceDayTable= require("../models/stats/invoice_stats_day.js");
const onlineDayTable= require("./stats/online_stats_day.js");
const AdminModel= require("../models/admin/admin.js");
const AccountTable = require('./admin/account.js');


//mqtt 命令
function DB() {
    this.RomTable = RomTable;
    this.RomUpgradeTable = RomUpgradeTable;
    this.TaskTable = TaskTable;
    this.SysinfoTable = SysinfoTable;
    this.DeviceTable = DeviceTable;
    this.GatewayIDE4g_Real_Table = GatewayIDE4g_Real_Table;
    this.GatewayIDE4g_M1_Table = GatewayIDE4g_M1_Table;
    this.GatewayIDE4g_Hour_Table = GatewayIDE4g_Hour_Table;
    this.GatewayIDE4g_Day_Table = GatewayIDE4g_Day_Table;
    this.InvoiceHourTable = InvoiceHourTable;
    this.InvoiceDayTable = InvoiceDayTable;
    this.onlineDayTable = onlineDayTable;
    this.AdminModel = AdminModel;
    this.AccountTable = AccountTable;
    this.getNowFormatDate = getNowFormatDate;

}

function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;
}

//导出模块
module.exports = new DB();