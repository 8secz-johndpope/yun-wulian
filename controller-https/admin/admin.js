'use strict';

import AdminModel from '../../models/admin/admin'
import DeviceTable from '../../models/device/device'
import logger from '../../logs/logs.js'
import crypto from 'crypto'
import dtime from 'time-formater'
const schedule = require('node-schedule');

class admin {
	constructor() {
		this.login = this.login.bind(this);
		this.register = this.register.bind(this);
		this.changePassword = this.changePassword.bind(this);
		this.resetPassword = this.resetPassword.bind(this);
		this.revoke = this.revoke.bind(this);
		this.restore = this.restore.bind(this);
		this.encryption = this.encryption.bind(this);
		this.getAllAdmin = this.getAllAdmin.bind(this);
		this.singout = this.singout.bind(this);
		this.getAdminInfo = this.getAdminInfo.bind(this);
		this.statusQuery = this.statusQuery.bind(this);
		this.switchAdmin = this.switchAdmin.bind(this);


        //本地调试, 使用 add by chenzejun
        if (process.env.NODE_ENV == 'local') {
            try {
                const  user_account = 'local';
                const  user_password = this.encryption('local');
                AdminModel.findOne({user_account: user_account}).exec(function (err, res) {
                    if (res == null) {
                        var newAdmin = {
                            'user_account': user_account,
                            'user_password': user_password,
                            'user_phone': '18211122333',
                            'user_create_time': dtime().format('YYYY-MM-DD HH:mm'),
                            'user_last_login_time': dtime().format('YYYY-MM-DD HH:mm'),
                            'user_admin': '管理员',
                            'user_type': 1,
                            'user_name': '',
                            'user_status': 0,
                            'user_city': 'beijing',
                            'user_device_count': 0,
                            'user_online_count': 0
                        };

                        logger.info('local 用户添加');
                        AdminModel.create(newAdmin);
                    }
                });
            } catch (err) {
                logger.info('local 用户添加失败');
            }

            try {
                const  user_account = 'iotks';
                const  user_password = this.encryption('iotks');
                AdminModel.findOne({user_account: user_account}).exec(function (err, res) {
                    if (res == null) {
                        var newAdmin = {
                            'user_account': user_account,
                            'user_password': user_password,
                            'user_phone': '18211122222',
                            'user_create_time': dtime().format('YYYY-MM-DD HH:mm'),
                            'user_last_login_time': dtime().format('YYYY-MM-DD HH:mm'),
                            'user_admin': '超级管理员',
                            'user_type': 0,
                            'user_name': '',
                            'user_status': 0,
                            'user_city': 'beijing',
                            'user_device_count': 0,
                            'user_online_count': 0
                        };
                        logger.info('iotks 用户添加');
                        AdminModel.create(newAdmin);
                    }
                });

            } catch (err) {
                logger.info('iotks 用户添加失败');
            }
        }
	}
	async login(req, res, next){
		var user_account = req.body.user_account;
		var user_password = req.body.user_password;
		try {
			if(!user_account) {
				throw new Error('用户名参数错误');
			}else if(!user_password) {
				throw new Error('密码参数错误');
			}
		}catch(err) {
			logger.info(err.message, err);
			res.send({
				ret_code: 1,
				ret_msg: 'GET_ERROR_PARAM',
				extra: err.message,
			});
			return;
		}
		const newpassword = this.encryption(user_password);
		try {
			const admin = await AdminModel.findOne({user_account});
			if(!admin) {
				logger.info('该用户不存在');
				res.send({
					ret_code: 1,
					ret_msg: 'USER_NOT_EXIST',
					extra: '用户不存在'
				});
			}else if(newpassword.toString() != admin.user_password.toString()) {
				logger.info('管理员登录密码错误');
				res.send({
					ret_code: 1,
					ret_msg: 'ERROR_PASSWORD',
					extra: '密码错误'
				});
			}else{
				if(admin.user_status === 1){
					logger.info('管理员被冻结');
					res.send({
						ret_code:1011,
						ret_msg: 'ADMIN_REVOKED',
						extra: '你已经被冻结'
					});
					return;
				}
				req.session.user_account = admin.user_account;
				req.session.user_type = (admin.user_type === 0) ? 0 : 1;
				logger.info('登录成功');
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: (admin.user_type ===0) ? "欢迎你，超级管理员" : "欢迎你，管理员"
				});
			}
		}catch(err) {
			logger.info('登录管理员失败', err);
			res.send({
				ret_code: 1,
				ret_msg: 'LOGIN_ADMIN_FAILED',
				extra: '登录管理员失败'
			});
			return;
		}
	}
	async register(req, res, next){
		var user_account = req.body.user_account;
		var user_password = req.body.user_password;
		var user_name = req.body.user_name;
		var user_phone = req.body.user_phone;
		var user_type = 1;
		var user_status = 0;
		var user_city = req.body.user_city;
		try {
			if(!user_account) {
				throw new Error('账号名错误');
			}else if(!user_password){
				throw new Error('密码错误');
			}
		}catch(err){
			logger.info(err.message, err);
			res.send({
				ret_code: 1,
				ret_msg: 'GET_ERROR_PARAM',
				extra: err.message,
			});
			return;
		}
		try{
			const admin = await AdminModel.findOne({user_account});
			if(admin) {
				logger.info('管理员已经存在');
				res.send({
					ret_code: 1,
					ret_msg: 'USER_HAS_EXIST',
					extra: '管理员已经存在',
				});
			}else{
				const adminTip = user_type == 1 ?  '管理员'　: '超级管理员';
				const newpassword = this.encryption(user_password);
				const newAdmin = {
					user_account,
					user_password: newpassword,
					user_name,
					user_phone,
					user_create_time: dtime().format('YYYY-MM-DD HH:mm'),
					user_last_login_time: dtime().format('YYYY-MM-DD HH:mm'),
					user_admin: adminTip,
					user_type,
					user_status,
					user_city,
					user_device_count: 0,
					user_online_count: 0
				};
				await AdminModel.create(newAdmin);
					res.send({
						ret_code: 0,
						ret_msg: 'SUCCESS',
						extra: '注册管理员成功',
					})
				}
			}catch(err){
				logger.info('注册管理员失败', err);
				res.send({
					ret_code: 1,
					ret_msg: 'REGISTER_ADMIN_FAILED',
					extra: '注册管理员失败',
				})
			}
	}
	async resetPassword(req, res, next){
		var user_account = req.body.user_account;
		try{
			if(!user_account){
				throw new Error('请输入用户账号');
			}
		}catch(err){
			logger.info(err.message, err);
                        res.send({
                                ret_code: 1,
                                ret_msg: 'GET_ERROR_PARAM',
                                extra: err.message
                        });
                        return;
		}
		const password = this.encryption(user_account);
                try{
                        const admin = await AdminModel.findOne({user_account});
                        if(!admin){
                                logger.info('用户不存在');
                                res.send({
                                        ret_code: 1,
                                        ret_msg: 'USER_NOT_EXIST',
                                        extra: '用户不存在'
                                });
			}else{
				await AdminModel.findOneAndUpdate({user_account: user_account},{$set: {user_password: password}});
                                logger.info('重置密码成功');
                                res.send({
                                        ret_code: 0,
                                        ret_msg: 'SUCCESS',
                                        extra: '重置密码成功'
                                });
			}
		}catch(err){
                        logger.info('重置用户密码失败');
                        res.send({
                                ret_code: 1,
                                ret_msg: 'ERROR_RESET_PASSWORD',
                                extra: '重置用户密码失败'
                        });
                        return;
                }
	}
	async changePassword(req, res, next){
	//	var user_account = req.body.user_account;
		var user_account = req.session.user_account;
		var user_password = req.body.user_password;
		var user_new_password =req.body.user_new_password;
		try{
			if(!user_account){
				throw new Error('请登录用户账号');
			}else if(!user_password) {
				throw new Error('请输入用户密码');
			}
		}catch(err){
			logger.info(err.message, err);
			res.send({
				ret_code: 1,
				ret_msg: 'GET_ERROR_PARAM',
				extra: err.message
			});
			return;
		}
		const password = this.encryption(user_password);
		try{
			const admin = await AdminModel.findOne({user_account});
			if(!admin){
				logger.info('用户不存在');
				res.send({
					ret_code: 1,
					ret_msg: 'USER_NOT_EXIST',
					extra: '用户不存在'
				});
			}else if(password.toString() != admin.user_password.toString()){
				logger.info('密码错误');
				res.send({
					ret_code: 1,
					ret_msg: 'ERROR_PASSWORD',
					extra: '密码错误'
				});
			}else {
				const changed_password = this.encryption(user_new_password);
				await AdminModel.findOneAndUpdate({user_account: user_account},{$set: {user_password: changed_password}});
				logger.info('修改密码成功');
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: '修改密码成功'
				});
			}
		}catch(err){
			logger.info('修改用户密码失败');
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_CHANGE_PASSWORD',
				extra: '修改用户密码失败'
			});
			return;
		}
	}
	async revoke(req, res, next){
		var user_account = req.body.user_account;
		try{
			if(!user_account){
				throw new Error('请输入用户账号');
			}
		}catch(err){
			logger.info(err.message, err);
			res.send({
				ret_code: 1,
				ret_msg: 'GET_ERROR_PARAM',
				extra: err.message,
			});
			return;
		}
		try{
			const admin = await AdminModel.findOne({user_account});
			if(!admin){
				logger.info('用户不存在');
				res.send({
					ret_code: 1,
					ret_msg: 'USER_NOT_EXIST',
					extra: '用户不存在'
				})
			}else if(admin.user_type === 0){
				logger.info('超级管理员不能冻结');
				res.send({
					ret_code: 1,
					ret_msg: 'SUPER_ADMIN_CAN_NOT_REVOKE',
					extra:'超级管理员不能冻结'
				});
			}else{
				await AdminModel.findOneAndUpdate({user_account:user_account},{$set:{user_status:1}});
				logger.info('用户已冻结');
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: '用户已冻结',
				});
			}
		}catch(err){
			logger.info('冻结用户失败');
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_USER_REVOKE',
				extra: '冻结用户失败',
			});
		}
		
	}
	async restore(req, res, next){
		var user_account = req.body.user_account;
		try{
			if(!user_account){
				throw new Error('请输入用户账号');
			}
		}catch(err){
			logger.info(err.message, err);
			res.send({
				ret_code: 1,
				ret_msg: 'GET_ERROR_PARAM',
				extra: err.message,
			});
			return;
		}
		try{
			const admin = await AdminModel.findOne({user_account});
			if(!admin){
				logger.info('用户不存在');
				res.send({
					ret_code: 1,
					ret_msg: 'USER_NOT_EXIST',
					extra: '用户不存在'
				});
			}else if(admin.user_type === 0){
				logger.info('超级管理员不需要解冻');
				res.send({
					ret_code:1,
					ret_msg:'SUPER_ADMIN_NOT_NEED_RESTORE',
					extra:'超级管理员不需要解冻'});
			}else{
				await AdminModel.findOneAndUpdate({user_account:user_account},{$set:{user_status:0}});
				logger.info('用户已解冻');
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: '用户已解冻'
				});
			}
		}catch(err){
			logger.info('解冻用户失败')
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_USER_RESTORE',
				extra: '解冻用户失败',
			})
		}
		
	}
	encryption(password){
		const newpassword = this.Md5(this.Md5(password).substr(2,7) + this.Md5(password));
		return newpassword
	}
	Md5(password) {
		const md5 = crypto.createHash('md5')
		return md5.update(password).digest('base64')
	}
	async singout(req, res, next){
		try{
			delete req.session.user_account;
			delete req.session.user_type;
			res.send({
				ret_code: 0,
				ret_msg: 'SUCCESS',
				extra: '退出成功'
			});
		}catch(err){
			logger.info('退出失败', err);
			res.send({
				ret_code: 1,
				ret_msg: 'FAILED',
				extra: '退出失败'
			});
		}
	}
	async getAllAdmin(req, res, next) {
		var page_size = req.body.page_size;
		var current_page = req.body.current_page;
	/*	var Admin = await AdminModel.find();
		for(var i=0; i < Admin.length; i++){
			Admin[i].user_device_count = await DeviceTable.count({'user_name':Admin[i].user_account});
			Admin[i].user_online_count = await DeviceTable.count({'user_name':Admin[i].user_account,'status':'online'});
			await AdminModel.findOneAndUpdate({user_account: Admin[i].user_account},
						{$set: {'user_device_count' : Admin[i].user_device_count,
							'user_online_count' : Admin[i].user_online_count}});
		}*/
		try {
			if(typeof(page_size) === 'undefined' && typeof(current_page) === 'undefined'){
				var count = await AdminModel.count();
				var allAdmin = await AdminModel.find().sort({id: -1}).limit(10);
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: {allAdmin,count}
				});
				return;
			}else if(page_size > 0 && current_page > 0){
				var allAdmin = await AdminModel.find().sort({id: -1})
					.skip(Number((current_page - 1)*page_size))
					.limit(Number(page_size));
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: {allAdmin}
				});
				return;
			}else{
				res.send({ret_code: 1, ret_msg: 'PARAM_ERROR', extra: '参数错误'});
				return;
			}
		}catch(err){
			logger.info('获取管理员列表失败', err);
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_GET_ADMIN_LIST',
				extra: '获取管理员列表失败'
			});
		}
	}
	async getQueryAdmin(req, res, next) {
		var user = req.body.user;
		try {
			const allAdmin = await AdminModel.find({$or:[{user_account: user},{user_name: user}]});
			logger.info('allAdmin='+allAdmin);
			res.send({
				ret_code: 0,
				ret_msg: 'SUCCESS',
				data: allAdmin,
			});
		}catch(err){
			logger.info('查询管理员失败', err);
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_QUERY_ADMIN',
				extra: '查询管理员失败'
			});
		}
	}
	async getAdminCount(req, res, next){
		try{
			const count = await AdminModel.count();
			res.send({
				ret_code: 0,
				data: count
			});
		}catch(err){
			logger.info('获取管理员数量失败',err);
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_GET_ADMIN_COUNT',
				extra: '获取管理员数量失败'
			});
		}
	}
	async getAdminInfo(req,res, next){
		const user_account = req.session.user_account;
		if(!user_account) {
			logger.info('获取管理员信息的session失效');
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_SESSION',
				extra: '获取管理员信息失败'
			})
			return;
		} 
		try {
			const admin = await AdminModel.findOne({user_account: user_account});
			if(!admin){
				throw new Error('未找到当前管理员');
			}else{
				logger.info('获取管理员信息成功');
				res.send({
					ret_code: 0,
					ret_msg : (admin.user_type === 0) ? 0 : 1,
					extra:(admin.user_type ===0) ? "超级管理员" : "管理员"
				});
			}
		}catch(err){
			logger.info('获取管理员信息失败');
			res.send({
				ret_code: 1,
				ret_msg: 'GET_ADMIN_INFO_FAILED',
				extra: '获取管理员信息失败'
			});
		}
	}
	async statusQuery(req, res, next){
		var query = req.body.user_status;
		var page_size = req.body.page_size;
		var current_page = req.body.current_page;
		try {
			if(typeof(page_size) === 'undefined' && typeof(current_page) === 'undefined'){
				var count = await AdminModel.count({'user_status':query});
				var allAdmin = await AdminModel.find({'user_status':query}).sort({id: -1}).limit(10);
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: {allAdmin,count}
				});
				return;
			}else if(page_size > 0 && current_page > 0){
				var allAdmin = await AdminModel.find({'user_status':query}).sort({id: -1})
					.skip(Number((current_page - 1)*page_size))
					.limit(Number(page_size));
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: {allAdmin}
				});
				return;
			}else{
				res.send({ret_code: 1, ret_msg: 'PARAM_ERROR', extra: '参数错误'});
				return;
			}
		}catch(err){
			logger.info('获取管理员状态列表失败', err);
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_GET_ADMIN_STATUS_LIST',
				extra: '获取管理员状态列表失败'
			});
		}
	}
	async switchAdmin(req, res, next){
		var user_account = req.body.user_account;
		if(!user_account){
			logger.info('参数错误');
			res.send({
				ret_code: 1,
				ret_msg: 'ERROR_ADMIN_ACCOUNT',
				extra: '用户账号参数错误'
			})
			return;
		}
		try{
			//delete req.session.user_account;
			//delete req.session.user_type;
			const admin = await AdminModel.findOne({user_account});
			if(!admin) {
				logger.info('该用户不存在');
				res.send({
					ret_code: 1,
					ret_msg: 'USER_NOT_EXIST',
					extra: '用户不存在'
				});
			}else{
				if(admin.user_status === 1){
					logger.info('管理员被冻结');
					res.send({
						ret_code:1011,
						ret_msg: 'ADMIN_REVOKED',
						extra: '此用户已经被冻结'
					});
					return;
				}
				delete req.session.user_account;
				delete req.session.user_type;
				req.session.user_account = user_account;
				req.session.user_type = (admin.user_type === 0) ? 0 : 1;
				logger.info('切换用户成功');
				res.send({
					ret_code: 0,
					ret_msg: 'SUCCESS',
					extra: (admin.user_type ===0) ? "欢迎你，超级管理员" : "欢迎你，管理员"
				});
			}
		}catch(err){
			logger.info('切换管理员失败', err);
			res.send({
				ret_code: 1,
				ret_msg: 'SWITCH_ADMIN_FAILED',
				extra: '切换管理员失败'
			});
			return;
		}
	}
	async update_admin_device(){
		var Admin = await AdminModel.find();
                for(var i=0; i < Admin.length; i++){
                        Admin[i].user_device_count = await DeviceTable.count({'user_name':Admin[i].user_account});
                        Admin[i].user_online_count = await DeviceTable.count({'user_name':Admin[i].user_account,'status':'online'});
                        await AdminModel.findOneAndUpdate({user_account: Admin[i].user_account},
                                                {$set: {'user_device_count' : Admin[i].user_device_count,
                                                        'user_online_count' : Admin[i].user_online_count}});
                }
	}
}

const Admin = new admin();
export default Admin;
//schedule.scheduleJob('0 0 * * * *', Admin.update_admin_device);
