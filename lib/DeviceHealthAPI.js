"use strict"
let Debug = false;
let deviceStatusDbInstance     = require('../repo/db').deviceStatusDbInstance;

const CONFIg = require('config');
/**
*This class is responsible for calling the appropriate values from database classes in the db.js file for device health releated details and returning to the apiController.js file from where the 
*response is returned to the application user. All the methods in this are async methods so that the process is asychronous. 
*
* @class DeviceHealthAPI
* 
*/
class DeviceHealthAPI{

	/**
    *This method is used to insert or update the details of pheezee device.
    *
    *
    *@method insertOrUpdatePheezeeDeviceDetails
    *@param {Object} message A JsonObject that contains the details of the device like uuid, mac address , firmware version.etc
    *@return {Boolean} returns true else returns false based on the response. 
    */
	async insertOrUpdatePheezeeDeviceDetails(message){
		let response = await deviceStatusDbInstance.insertOrUpdatePheezeeDeviceDetails(message);
		return response;
	}

	/**
    *This method is used to insert the health data of pheezee device.
    *
    *
    *@method insertPheezeeHealthStatus
    *@param {Object} message A JsonObject that contains the health details of the device like uuid, lower lsm read value etc.
    *@return {Boolean} returns true else returns false based on the response. 
    */
	async insertPheezeeHealthStatus(message){
		let response = await deviceStatusDbInstance.insertPheezeeHealthStatus(message);
		return response;
	}

	/**
    *This method is used to insert the email data to know which device connected to which pheezee device.
    *
    *
    *@method insertPhizioEmailWhichUsedTheDevice
    *@param {Object} message A JsonObject that contains the email, uuid and timestamp.
    *@return {Boolean} returns true else returns false based on the response. 
    */
	async insertPhizioEmailWhichUsedTheDevice(message){
		let response = await deviceStatusDbInstance.insertPhizioEmailWhichUsedTheDevice(message);
		console.log(response);
		return response;
	}

	/**
    *This method is used to get the status of a device.
    *
    *
    *@method getDeviceStatus
    *@param {Object} message A JsonObject that contains the uuid of the device.
    *@return {Boolean} returns true or false and uuid.
    */
	async getDeviceStatus(message){
		let response = await deviceStatusDbInstance.getDeviceStatus(message);
		return response;
	}


	async getDeviceDetailsBasedOnMac(message){
		let response = await deviceStatusDbInstance.getDeviceDetailsBasedOnMac(message);
		return response;
	}

	async getDeviceDetailsBasedOnUid(message){
		let response = await deviceStatusDbInstance.getDeviceDetailsBasedOnUid(message);
		return response;
	}

	/**
    *This method is used to update the status of a device.
    *
    *
    *@method updateDeviceStatus
    *@param {Object} message A JsonObject that contains the uuid and status value of the device.
    *@return {Boolean} returns true or false based on the response.
    */
	async updateDeviceStatus(message){
		let response = await deviceStatusDbInstance.updateDeviceStatus(message);
		return response;
	}
	
	
	async getWarrantyDetails(macid) {
		let response
		const {devicemacid} = macid;
		console.log(devicemacid);
		if(devicemacid !== "") {
        	response = await deviceStatusDbInstance.getWarrantyDetails(devicemacid);
		} else {
			response = "DeviceDisconnect"
		}

        return response;
    }
    
    async getDeviceSerialNumber(macid) {
    	let response;
    	const {devicemacid} = macid;
    	console.log(devicemacid);
    	if(devicemacid !== "") {
        	response = await deviceStatusDbInstance.getDeviceSerialNumber(devicemacid);
		} else {
			response = "Please check if device is connected!"
		}
		
		return response;
    }
    
    
    async addCustomerDetails(data) {
    	console.log(data);
    	let response = await deviceStatusDbInstance.addCustomerDetails(data);
    	console.log(response);
    	
    	return response;
    }
}

function getDeviceHealthAPIInstance() {
    return new DeviceHealthAPI();
}

exports.getDeviceHealthAPIInstance = getDeviceHealthAPIInstance;
