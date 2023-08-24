"use strict"
let Debug = false;
let devicePackageDbInstance = require('../repo/db').devicePackageDbInstance;

const CONFIg = require('config');

/**
*This class is responsible for calling the appropriate values from database classes in the db.js file for device location releated details and returning to the apiController.js file from where the 
*response is returned to the application user. All the methods in this are async methods so that the process is asychronous. 
*
* @class DeviceLocationApi
* 
*/
class DevicePackageApis{

	/**
    *This method is used to update the location of the device in the database. 
    *
    *
    *@method updateDeviceLocation
    *@param {Object} message A JsonObject that contains the uuid of device, latiture, longiture and time stamp.
    *@return {Boolean} returns true else returns false based on the response. 
    */
	async createPackageDataForNewProduct(message){
		const response = await devicePackageDbInstance.createPackageDataForNewProduct(message);
		return response;
	}


    async checkPackageIdPresentOrNot(message){
        let data = JSON.parse(message);
        const response = await devicePackageDbInstance.checkPackageIdAlreadyPresent(data.packageid);
        return response;
    }

    async getPackageType(packageid){
        const response = await devicePackageDbInstance.getPackageType(packageid);
        return response;
    }



}


function getDevicePackageApiInstance(){
	return new DevicePackageApis();
}

exports.getDevicePackageApis = getDevicePackageApiInstance;

