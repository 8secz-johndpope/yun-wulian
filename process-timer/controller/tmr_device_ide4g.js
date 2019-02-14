'use strict';
const config = require( "config-lite");
const DB = require( "../../models/models.js");
const dtime = require( 'time-formater');
const logger = require( '../../logs/logs.js');
const schedule = require('node-schedule');

const keep_record_num = config.keep_record_num;


class GatewayTimerHandle {
	constructor(){

	}


    // 监听器 #3
    async hour1BackupProcess () {
        logger.info('hour1 timer out:', dtime().format('YYYY-MM-DD HH:mm:ss'));

        let mytime = new Date();
        let update_time = dtime(mytime).format('YYYY-MM-DD HH');

        // 将实时数据存储到历史数据库
        let queryList = await DB.Gateway_Real_Table.find();
        for (let i = 0; i < queryList.length; i++){

            //更新每天的汇总统计
            let devunit_name = queryList[i].devunit_name;
            let wherestr = {
                'devunit_name': devunit_name,
                'update_time': update_time,
            };

            let query = await DB.Gateway_Hour_Table.findOne(wherestr).exec();
            if (query == null){
                let updatestr = {
                    'devunit_name': devunit_name,
                    'update_time': update_time,
                    'sort_time': queryList[i].sort_time,
                    'data': queryList[i].data,
                };
                DB.Gateway_Hour_Table.create(updatestr);
            }

            // 3. 删除实时数据中最近1小时不更新的数据
            //删除数据， sort_time  单位：ms
            let limit_time = mytime.getTime() - 3600000;
            if (queryList[i].sort_time < limit_time) {
                //logger.info('delete record of Gateway_Real_Table, limit_time:', limit_time);
                DB.Gateway_Real_Table.findByIdAndRemove(queryList[i]._id).exec();
            }

            // 3. 限制数量
            //存最近60条记录,  记录数可配置：keep_record_num
            let wherestr_2 = { 'devunit_name': devunit_name};
            let amount = await DB.Gateway_Hour_Table.count(wherestr_2);
            if (amount > keep_record_num){
                //删除数据， sort_time  单位：ms
                let old_sort_time = mytime.getTime() - keep_record_num * 3600000;
                let wheredel = { 'devunit_name': devunit_name, 'sort_time': {$lt: old_sort_time}};
                //logger.info('delete record of Gateway_Hour_Table, condition:', wheredel);
                DB.Gateway_Hour_Table.deleteMany(wheredel).exec();
            }

        }



    }


    // 监听器 #4
    async day1BackupProcess () {
        logger.info('hour24 timer out:', dtime().format('YYYY-MM-DD HH:mm:ss'));

        let mytime = new Date();
        let update_time = dtime(mytime).format('YYYY-MM-DD');

        // 将实时数据存储到历史数据库
        let queryList = await DB.Gateway_Real_Table.find();
        for (let i = 0; i < queryList.length; i++){

            //更新每天的汇总统计
            let devunit_name = queryList[i].devunit_name;
            let wherestr = {
                'devunit_name': devunit_name,
                'update_time': update_time,
            };

            let query = await DB.Gateway_Day_Table.findOne(wherestr).exec();
            if (query == null){
                let updatestr = {
                    'devunit_name': devunit_name,
                    'update_time': update_time,
                    'sort_time': queryList[i].sort_time,
                    'data': queryList[i].data,
                };
                DB.Gateway_Day_Table.create(updatestr);
            }

            // 2. 限制数量
            //存最近60条记录
            let wherestr_2 = { 'devunit_name': devunit_name};
            let amount = await DB.Gateway_Day_Table.count(wherestr_2);
            if (amount > keep_record_num){
                //删除数据， sort_time  单位：ms
                let old_sort_time = mytime.getTime() - keep_record_num * 86400000;
                let wheredel = { 'devunit_name': devunit_name, 'sort_time': {$lt: old_sort_time}};
                //logger.info('delete record of Gateway_Day_Table, condition:', wheredel);
                DB.Gateway_Day_Table.deleteMany(wheredel).exec();
            }

        }
    }


}

const gwTimerHnd = new GatewayTimerHandle();

//场景：每小时采样一次，记录历史数据, 0, 30 分的时候，更新两次，增加可靠性
schedule.scheduleJob('0 0,30 * * * *', gwTimerHnd.hour1BackupProcess);
//场景：超时失败, 每天夜里12:00, 中午12:00进行更新, 更新两次，增加可靠性
schedule.scheduleJob('0 0 0,12 * * *', gwTimerHnd.day1BackupProcess);

