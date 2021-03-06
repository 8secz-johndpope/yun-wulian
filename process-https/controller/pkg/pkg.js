'use strict';

import pkgModel from '../../models/pkg/pkg';
import logger from '../../logs/logs.js'
import formidable from 'formidable';
import fs from 'fs';
import config from 'config-lite';
import path from 'path';
import dtime from 'time-formater';

class PkgHandle {
    constructor(){
	this.upload = this.upload.bind(this);
    }
    async download(req, res, next){
	var pkg_name = req.body.pkg_name;
	try {
		if(!pkg_name) {
			throw new Error('请选择正确的插件');
		}
	}catch(err){
		logger.log('err.message',err);
		res.send({
			ret_code: 1,
			ret_msg: 'PKG_ERROE_PARAM',
			extra: err.message
		});
		return;
	}
	try{
		const pkg = await pkgModel.findOne({pkg_name});
		if(!pkg) {
			logger.log('PKG不存在');
			res.send({
				ret_code: 1,
				ret_msg: 'PKG_NOT_EXIST',
				extra: 'PKG不存在'
			});
			return;
		}
	}catch(err){
		logger.log('PKG不存在');
		res.send({
			ret_code: 1,
			ret_msg: 'PKG_NOT_EXIST',
			extra: err.message
		});
		return;
	}
	try{
		/*var pkg_path = path.join(config.pkg_dir,pkg_name);
		fs.exists(pkg_path, function(exist){
			if(exist){
				res.download(pkg_path,pkg_name);
			}else {
				res.send({ret_code:1, ret_msg:'DOWNLOAD_PKG_FAILED',extra:'下载插件失败'});
			}
		})*/
		var pkg_path = '/packages/'+pkg_name;
		res.send({ret_code:0 , res_msg:'SUCCESS',extra: pkg_path});
		return;
	}catch(err){
		logger.log('下载插件失败');
		res.send({
			ret_code: 1,
			ret_msg: 'DOWNLOAD_PKG_FAILED',
			extra: '下载插件失败'
		});
		return;
	}
    }
    async upload(req, res, next){
	const form = new formidable.IncomingForm();
	form.parse(req, async (err, fields, files) => {
		if(err) {
			res.send({
				ret_code: 1,
				ret_msg: 'PKG_DATA_ERROR',
				extra: '表单信息错误'
			});
			return;
		}
		
		const {pkg_name, pkg_str_name,  pkg_version, pkg_developer='admin', pkg_info, pkg_md5} = fields;
		try {
			if(!pkg_name) {
				throw new Error('请选择正确的插件');
			}else if(!pkg_str_name){
				throw new Error('请输入插件名称');
			}else if(!pkg_version){
				throw new Error('请输入插件的版本号');
			}else if(!pkg_info){
				throw new Error('请输入插件说明');
			}
		}catch(err){
			logger.log('err.message',err);
			res.send({
				ret_code: 1,
				ret_msg: 'PKG_ERROE_PARAM',
				extra: err.message
			});
			return;
		}
		
		try{
			const pkg = await pkgModel.findOne({pkg_name});
			if(pkg) {
				logger.log('PKG已经存在');
				res.send({
					ret_code: 1,
					ret_msg: 'PKG_HAS_EXIST',
					extra: 'PKG已经存在'
				});
				return;
			}
		}catch(err){
			logger.log('err.message',err);
			res.send({
				ret_code: 1,
				ret_msg: 'PKG_HAS_EXIST',
				extra: 'PKG已经存在'
			});
			return;
		}

		try{
			var repath = path.join(config.pkg_dir,files.file_name.name);
			/*fs.rename(files.file_name.path, repath,function(err){
				if(err){
					logger.log('上传插件失败');
				}else{
					logger.log('上传插件成功');
				}
			});*/
			fs.readFile(files.file_name.path, function(err,data){
				if(err){
					throw err;
				}else{
					fs.writeFile(repath, data,function(err){
						if(err){
							throw err;
						}else{
							fs.unlink(files.file_name.path,function(err){
								if(err){
									throw err;
								}else{
									logger.log('上传插件成功');
								}
							})
						}
					})
				}
			})
		}catch(err){
			logger.log('上传PKG失败');
			res.send({
				ret_code: 1,
				ret_msg: 'UPLOAD_PKG_FAILED',
				extra: '上传插件失败'
			});
			return;
		}

		try{
			const new_pkg = {
				pkg_name: pkg_name,
				pkg_str_name: pkg_str_name,
				pkg_version: pkg_version,
				pkg_developer: pkg_developer,
				pkg_info: pkg_info,
				pkg_create_time: dtime().format('YYYY-MM-DD HH:mm'),
				pkg_status: 0,
				pkg_md5:pkg_md5,
			};
			await pkgModel.create(new_pkg);
			logger.log('保存PKG成功');
			res.send({
				ret_code: 0,
				ret_msg: 'SAVE_PKG_SUCCESS',
				extra: '保存PKG成功'
			});
		}catch(err){
			logger.log('保存PKG失败');
			res.send({
				ret_code: 1,
				ret_msg: 'SAVE_PKG_FAILED',
				extra: '保存PKG失败'
			});
			return;
		}
	})
    }
    async release(req, res, next){
	var pkg_name = req.body.pkg_name;
	try {
		if(!pkg_name) {
			throw new Error('请选择正确的插件');
		}
	}catch(err){
		logger.log('err.message',err);
		res.send({
			ret_code: 1,
			ret_msg: 'PKG_ERROE_PARAM',
			extra: err.message
		});
		return;
	}
	try{
		const pkg = await pkgModel.findOne({pkg_name});
		if(!pkg) {
			logger.log('PKG不存在');
			res.send({
				ret_code: 1,
				ret_msg: 'PKG_NOT_EXIST',
				extra: 'PKG不存在'
			});
			return;
		}else{
			await pkgModel.findOneAndUpdate({pkg_name:pkg_name},{$set:{pkg_status:0}});
			logger.log('PKG已上架');
			res.send({
				ret_code: 0,
				ret_msg: 'SUCCESS',
				extra: 'PKG已上架',
			});
			return;
		}
	}catch(err){
		logger.log('PKG上架失败');
		res.send({
			ret_code: 1,
			ret_msg: 'PKG_RELEASE_FAILED',
			extra: err.message
		});
		return;
	}
    }
    async revoke(req, res, next){
	var pkg_name = req.body.pkg_name;
	try {
		if(!pkg_name) {
			throw new Error('请选择正确的插件');
		}
	}catch(err){
		logger.log('err.message',err);
		res.send({
			ret_code: 1,
			ret_msg: 'PKG_ERROE_PARAM',
			extra: err.message
		});
		return;
	}
	try{
		const pkg = await pkgModel.findOne({pkg_name});
		if(!pkg) {
			logger.log('PKG不存在');
			res.send({
				ret_code: 1,
				ret_msg: 'PKG_NOT_EXIST',
				extra: 'PKG不存在'
			});
			return;
		}else{
			await pkgModel.findOneAndUpdate({pkg_name:pkg_name},{$set:{pkg_status:1}});
			logger.log('PKG已上架');
			res.send({
				ret_code: 0,
				ret_msg: 'SUCCESS',
				extra: 'PKG已上架',
			});
			return;
		}
	}catch(err){
		logger.log('PKG上架失败');
		res.send({
			ret_code: 1,
			ret_msg: 'PKG_RELEASE_FAILED',
			extra: err.message
		});
		return;
	}
    }
    async del(req, res, next) {
	var pkg_name = req.body.pkg_name;
	try {
		if(!pkg_name) {
			throw new Error('请选择正确的插件');
		}
	}catch(err){
		logger.log('err.message',err);
		res.send({
			ret_code: 1,
			ret_msg: 'PKG_ERROE_PARAM',
			extra: err.message
		});
		return;
	}
	try{
		var pkg = await pkgModel.findOne({pkg_name});
		if(!pkg) {
			logger.log('PKG不存在');
			res.send({
				ret_code: 1,
				ret_msg: 'PKG_NOT_EXIST',
				extra: 'PKG不存在'
			});
			return;
		}else{
			var del_pkg = {'pkg_name': pkg_name};
			await pkgModel.remove(del_pkg, function(err){
				if(err){
					logger.log('del pkg occur a error',err);
				}
			});
			var pkg_path = path.join(config.pkg_dir, pkg_name);
			fs.unlink(pkg_path);
			res.send({ret_code:0, ret_msg:'DEL_PKG_SUCCESS',extra:'删除插件成功'});
		}
	}catch(err){
		logger.log('删除插件失败');
		res.send({
			ret_code: 1,
			ret_msg: 'DEL_PKG_FAILED',
			extra: '删除插件失败'
		});
		return;
	}
    }
    async delpkgs(req, res, next){
	var pkg_str_name = req.body.pkg_str_name;
	var pkg_version = req.body.pkg_version;
	try{
		var allpkgs = await pkgModel.find({pkg_str_name:pkg_str_name, pkg_version:pkg_version});
		for(var i=0; i < allpkgs.length; i++){
			var del_pkg = {'pkg_name': allpkgs[i].pkg_name};
			await pkgModel.remove(del_pkg);
			var pkg_path = path.join(config.pkg_dir,allpkgs[i].pkg_name);
			fs.unlink(pkg_path,function(err){
				if(err){
					throw err;
				}else{
					logger.log('del pkgs success');
				}
			});
		}
		res.send({ret_code:0, ret_msg:'SUCCESS', extra:'删除插件组成功'});
	}
	catch(err){
		res.send({ret_code:1, ret_msg:'DEL_ALLPKGS_FAILED', extra:'删除插件组失败'});
	}
	return;
    }
    async list(req, res, next) {
	var page_size = req.body.page_size;
	var current_page = req.body.current_page;
	try {
		if(typeof(page_size) === 'undefined' && typeof(current_page) === 'undefined'){
			var allPkg = await pkgModel.aggregate({$group:{_id:{pkg_str_name:'$pkg_str_name',pkg_version:'$pkg_version'}}});
			res.send({ret_code: 0,
				ret_ext:'SUCCESS',
				extra: allPkg
			});
			return;
		}
		else if(page_size > 0 && current_page >0 ){
			var allPkg = await pkgModel.aggregate(
				{$group:
				{_id:
				{pkg_str_name:'$pkg_str_name',
				pkg_version:'$pkg_version'}}}
				).skip(Number((current_page - 1)*page_size)).limit(Number(page_size));
			res.send({
				ret_code: 0,
				ret_ext:'SUCCESS',
				extra: allPkg
			});
			return;
		}else{
			res.send({ret_code:1, ret_msg: 'PARAM_ERROR', extra:'参数不对'});
			return;
		}
	}catch(err){
		logger.log('获取插件列表失败', err);
		res.send({
			ret_code: 1,
			ret_msg: 'ERROR_GET_PKG_LIST',
			extra:'获取插件列表失败'
		});
		return;
	}
    }
    async detail(req, res, next){
	try{
		var pkg_str_name = req.body.pkg_str_name;
		var pkg_version = req.body.pkg_version;
		var allpkgs = await pkgModel.find({pkg_str_name:pkg_str_name, pkg_version:pkg_version});
		res.send({
			ret_code: 0,
			ret_msg:'SUCCESS',
			extra: allpkgs
		});
	}catch(err){
		res.send({
			ret_code:-1,
			ret_msg: 'FAILED',
			extra: '获取插件详情失败'
		});
	}
    }
}

export default new PkgHandle()
