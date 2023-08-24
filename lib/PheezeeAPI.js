"use strict"

/**
 *This is the file which works with database and helps connects to the mongoose database and calls the database apis. This module is used to call the functions which then calls the database functions.
 *
 *@module repo
 *
 */
let Debug = false;
/**
 *This module allows us to use the functions that interact with the phiziousers collection.
 *
 *@module phizioUsersDbInstance
 *
 */
let phizioUsersDbInstance = require('../repo/db').phizioUsersDbInstance;
let calbrationDataDbInstance = require('../repo/db').calbrationDataDbInstance;
/**
 *This module allows us to use the functions that interact with the patientSessionDatas collection.
 *
 *@module patientSessionDbInstance
 *
 */
let patientSessionDbInstance     = require('../repo/db').patientSessionDbInstance;
let reportDataDbInstance = require('../repo/db').reportDataDbInstance;
const CONFIg = require('config');
/**
*This class is responsible for calling the appropriate values from database classes in the db.js file for physiotherapist and patient related details and returning to the index.js/apiController.js file from where the 
*response is returned to the application user. All the methods in this are async methods so that the process is asychronous. 
*
* @class PheezeeAPI
* 
*/
class PheezeeAPI{

    /**
    *This method is responsible for getting the entire session data from the patientSessionData collection and
    *gets the patient information from the phiziousers collection and then clubs them together.
    *
    *
    *@method getPatientEntireSessionDataForTesting
    *@param {Object} message A JsonObject that contains the patients id and phiziotherapist emailid.
    *@return {Object} A JsonObject response that has both sessions and the patient details.
    */

    async getPatientEntireSessionDataForTesting(message){
        let data = JSON.parse(message);
        let response = await patientSessionDbInstance.findAllPatientSessionDataForTesting(message);
        Debug && console.log(response);
        if(response[0]!=null){
            let response_details = await phizioUsersDbInstance.findPatientDataForTesting(message);
            response_details = JSON.stringify(response_details[0]);
            response_details = JSON.parse(response_details);
            response = JSON.stringify(response[0]);
            response = JSON.parse(response);

            for(let i=0;i<response_details["phiziopatients"].length;i++){
                Debug && console.log(response_details["phiziopatients"][i].patientid);
                if(response_details["phiziopatients"][i].patientid===data.patientid){
                    //Debug && console.log(response_details["phiziopatients"][i]);
                    response["patientDetails"] = response_details["phiziopatients"][i];
                    break;
                }
            }
        }
        Debug && console.log(response);
        return response;
    }




    /**
    *This method is used to get the url of the profilepicture of the physiotherapist.
    *
    *
    *@method getPhizioProfilePicUrl
    *@param {Object} message A JsonObject that contains the phiziotherapist emailid.
    *@return {Object} A JsonObject response that has details of physiotherapist.
    */
    async getPhizioProfilePicUrl(phizioemail){
        let response = await phizioUsersDbInstance.getPhizioProfilePicUrl(phizioemail);
        return response;
    }


    /**
    *This method is used to check weather physiotherapist with the given email id already present or not.
    *
    *
    *@method checkPhizioAlreadyPresent
    *@param {Object} message A JsonObject that contains the phiziotherapist email id.
    *@return {String} if present returns true else returns false. 
    */
    async checkPhizioAlreadyPresent(message){
        Debug && console.log('Phizio Check');
        let data = JSON.parse(message);
        let phizioname = data.phizioname;
        let phiziopassword = data.phiziopassword;
        let phizioemail = data.phizioemail;
        let phiziophone = data.phiziophone;
        let phizioprofilepicurl = data.phizioprofilepicurl;
        let phiziopatients = data.phiziopatients;
        let flag;
        const response = await phizioUsersDbInstance.findPhiziotherapist({phizioemail});
        Debug && console.log(response);
        if (response[0]==null) {
                 return 'false';
        } else {
            return 'true';
        }
    }

    /**
    *This method is used to add new user(physiotherapist).
    *
    *
    *@method addNewPhizioUser
    *@param {Object} message A JsonObject that contains {name, password, phone no, profile picture url, empty patient array}.
    *@return {String} if present returns already else returns inserted. 
    */
    async addNewPhizioUser(message, packagetype) {
        Debug && console.log('Hello World');
        let data = JSON.parse(message);
        let phizioname = data.phizioname;
        let phiziopassword = data.phiziopassword;
        let phizioemail = data.phizioemail;
        let phiziophone = data.phiziophone;
        let phizioprofilepicurl = data.phizioprofilepicurl;
        let phiziopatients = data.phiziopatients;
        let packageid = data.packageid;
        console.log(packageid);
        if(typeof data.packageid==='undefined')
            packageid = null;
        console.log(packageid);
        let flag;
        const response = await phizioUsersDbInstance.findPhiziotherapist({phizioemail});
	//Debug && console.log(response);
        if (response[0]==null) {
             flag = await phizioUsersDbInstance.addPhiziotherapist(phizioname,phiziopassword,phizioemail,
                phiziophone,phizioprofilepicurl,phiziopatients,packageid,packagetype);
	     if(flag!=null){
            	 return 'inserted';
	     }
        } else {
            flag = "already"
            return flag;
        }
    }


    async getPhizioPackageType(message){
        const response = await phizioUsersDbInstance.getPhizioPackageType(message);
        return response;
    }


    async updatePhizioPackageType(message){
        const response = await phizioUsersDbInstance.updatePhizioPackageType(message);
        return response;
    }

    /**
    *This method is used to update the profile picture url of the physiotherapist/user. This 
    *method is called evey time user uploads a new profile picture successfully.
    *
    *
    *@method updatePhizioProfilePicUrl
    *@param {String} phizioemail Contains the email of the user/physiotherapist.
    *@param {String} phizioprofilepicurl Contains the new s3 bucket url of the profile picture.
    *@return {String} if inserted returns inserted else returns error. 
    */
    async updatePhizioProfilePicUrl(phizioemail,phizioprofilepicurl){
        let flag = await phizioUsersDbInstance.updatePhizioProfilePicUrl(phizioemail,phizioprofilepicurl);
        Debug && console.log(flag);
        if(flag!=null){
            return true;
        }
        else{
            return false; 
        }   
    }

    /**
    */
    async updatePhizioClinicLogoUrl(phizioemail,cliniclogo){
        let flag = await phizioUsersDbInstance.updatePhizioClinicLogoUrl(phizioemail,cliniclogo);
        Debug && console.log(flag);
        if(flag!=null){
            return true;
        }
        else{
            return false; 
        }   
    }


    /**
    *This method is used to update the status of a patient. Status is basically active or inactive.
    *
    *
    *@method updatePatientStatus
    *@param {Object} message A JSONObject that contains {patient id, phizioemail, and status of the patient}.
    *@return {String} if inserted returns inserted else returns error. 
    */
    async updatePatientStatus(message){
        let flag = await phizioUsersDbInstance.updatePatientStatus(message);
        Debug && console.log(flag);
        if(flag!=null){
            return 'inserted';
        }
        else{
            return 'error'; 
        }
    }



    /**
    *This method is used to add new patient of a physiotherapist.
    *
    *
    *@method addNewPhizioPatient
    *@param {Object} message A JSONObject that contains {patient id, phizioemail, status(default active), name, profile picture url, age , gender }.
    *@return {String} if inserted returns inserted else returns error. 
    */
    async addNewPhizioPatient(message) {
        let flag;
        flag = await phizioUsersDbInstance.addPhizioPatient(message);
        Debug && console.log(flag);
        if(flag!=null){
            return 'inserted';
        }
        else if(flag==='already'){
            return 'inserted';
        }
        else{
            return 'error'; 
        }
    }
    
     async addCalbration(message) {
        let flag;
        flag = await calbrationDataDbInstance.addCalbration(message);
        Debug && console.log(flag);
        if(flag!=null){
            return 'inserted';
        }
        else if(flag==='already'){
            return 'inserted';
        }
        else{
            return 'error'; 
        }
    }
    
    async normativecal(message){
       let response
       response = await phizioUsersDbInstance.normativecalculation(message);
       return response;
        
    }
    
    
    
    
    /**
    *This method is used to update the profile picture url of the patient. This 
    *method is called evey time user uploads a new profile picture of a patient successfully.
    *
    *
    *@method updatePatientProfilePicUrl
    *@param {String} phizioemail Contains the email of the user/physiotherapist.
    *@param {String} patientid Contains the patient id.
    *@param {String} profilepicurl Contains the new s3 bucket url of the profile picture.
    *@return {String} if inserted returns inserted else returns error. 
    */
    async updatePatientProfilePicUrl(phizioemail,patientid,profilepicurl){
        let flag;
        flag = await phizioUsersDbInstance.updatePizioPatientProfilePicUrl(phizioemail,patientid,profilepicurl);
        Debug && console.log(flag);
        if(flag!=null){
            return true;
        }
        else{
            return false; 
        }
    }


    /**
    *This method is used to update the details of the user/physiotherapist.
    *
    *
    *@method updatePhizioDetails
    *@param {Object} message A JSONObject that contains all the details like {email, profile pic url, clinic name, specialization, degree, date of birth, experience, gender, address}.
    *@return {String} if inserted returns inserted else returns error. 
    */
    async updatePhizioDetails(message){

        let flag = await phizioUsersDbInstance.updatePhizioDetails(message);
        Debug && console.log(flag);
        if(flag!=null)
            return 'updated';
        else
            return 'error';
    }


    /**
    *This method is used to update the password of the physiotherapist whenever he forgets his password.
    * This method is only called once the user has verified his email.
    *
    *
    *@method updatePhizioPassword
    *@param {Object} message A JSONObject that contains all the details like {email, new password}.
    *@return {String} if updated returns updated else returns error. 
    */
    async updatePhizioPassword(message){
        let flag = await phizioUsersDbInstance.updatePhizioPassword(message);
        Debug && console.log(flag);
        if(flag!=null)
            return 'updated';
        else
            return 'error';

    }
	
	/**
    *This method is used to update the Pheezee App version of the physiotherapist.
    * This method is callled on startup and login.
    *
    *
    *@method phizioprofile_update_app_version
    *@param {Object} message A JSONObject that contains all the details like {email, new version}.
    *@return {String} if updated returns updated else returns error. 
    */
    async phizioprofile_update_app_version(message){
        let flag = await phizioUsersDbInstance.phizioprofile_update_app_version(message);
        Debug && console.log(flag);
        if(flag!=null)
            return 'updated';
        else
            return 'error';

    }

    /**
    *This method is used to delete all the details of a patient including his entire session history and values.
    *
    *
    *@method deletePhizioPatient
    *@param {Object} message A JSONObject that contains {physio email and patient id}}.
    *@return {Object} Returns the response from the database. 
    */
    async deletePhizioPatient(message){
        let data = JSON.parse(message);
        let phizioemail = data.phizioemail;
        let patientid = data.patientid;


        let flag  = await phizioUsersDbInstance.deletePhizioPatient(phizioemail,patientid);
        Debug && console.log(flag);

    }

    /**
    *This method is used to update the details of patient.
    *
    *
    *@method updatePhizioPatientDetails
    *@param {Object} message A JSONObject that contains all the details of patient along with the physiotherapist email id.
    *@return {String} if updated returns updated else returns error. 
    */
    async updatePhizioPatientDetails(message){
        let data = JSON.parse(message);

        let flag = await phizioUsersDbInstance.updatePhizioPatientDetails(message);
        Debug && console.log(flag);
    }

        /**
    *This method is used to update the details of patient.
    *
    *
    *@method updatePhizioPatientDetails
    *@param {Object} message A JSONObject that contains all the details of patient along with the physiotherapist email id.
    *@return {String} if updated returns updated else returns error. 
    */
    async updatePhizioPatientheldon(message){
        let data = JSON.parse(message);

        let flag = await phizioUsersDbInstance.updatePhizioPatientheldon(message);
        Debug && console.log(flag);
        console.log("flagis");
        console.log(flag);
    }

    async getPhizioPatientheldon(phizioemail,patientid){

        // let data = JSON.parse(message);

        let response = await phizioUsersDbInstance.getPhizioPatientheldon(phizioemail,patientid);
        if(response!=null){
            return JSON.stringify(response);
        }  

    }
	
	async findReport(phizioemail,patientid){
        // let data = JSON.parse(message);
        
        let response = await reportDataDbInstance.findReport(phizioemail,patientid);
        if(response!=null){
            return (response);
        }  
	}
	
	async findReport_testing(phizioemail){
        // let data = JSON.parse(message);
        
        let response = await reportDataDbInstance.findReport_testing(phizioemail);
        if(response!=null){
            return (response);
        }  
	}
	
	

	async addReport(data){
         let response = await reportDataDbInstance.addReport(data);
        if(response!=null){
            return JSON.stringify(response);
        }  
    }

	async addReport_overall(data){
         let response = await reportDataDbInstance.addReport_overall(data);
        if(response!=null){
            return JSON.stringify(response);
        }  
	}
	
	async overallreport_download_status(data){
         let response = await reportDataDbInstance.overallreport_download_status(data);
        if(response!=null){
            return JSON.stringify(response);
        }  
	}

    /**
    *This method is used to update the comment section of the sesison. The collection used in this method is patientSessionDb.
    *
    *
    *@method updatePhizioPatientCommentSection
    *@param {Object} message A JSONObject that contains all the comment values of a session.
    *@return {Object} returns the object received by the database. 
    */
    async updatePhizioPatientCommentSection(message){
        let flag = await patientSessionDbInstance.updatePatientSessionCommentData(message);
        /*if(flag!=null){
                 return 'inserted';
        }
        else{
            return 'not inserted';
        }*/

        Debug && console.log(flag);
    }
    
    
    // async updatePhizioPatientTherapistName(message){
    //     let flag = await patientSessionDbInstance.updatePatientTherapistNameData(message);
    //     // if(flag!=null){
    //     //          return 'inserted';
    //     // }
    //     // else{
    //     //     return 'not inserted';
    //     // }

    //     Debug && console.log(flag);
    // }
    
    


    async updatePatientMmtGrade(message){
        let flag = await patientSessionDbInstance.updatePatientMmtGrade(message);
        if(flag.nModified==1){
            Debug && console.log("updated");
            return "updated";
        }
        else if(flag.ok==1 && flag.nModified==0){
            Debug && console.log("updated not modified");
            return "updated";
        }
        else{
            return "error";
        }
    }


    async deletePatientOneSession(message){
        let flag = await patientSessionDbInstance.deletePhizioPatientSession(message);
        if(flag.nModified==1){
            return "deleted";
        }
        else if(flag==='deleted'){
            return "deleted";
        }
        else{
            return "error";
        }
    }


    /**
    *This method is used for user authentication.
    *
    *
    *@method getPhizioDetailsForLogin
    *@param {Object} message A JSONObject that contains {phizioemail, phiziopassword}.
    *@return {Object} returns all the details of physiotherapist along with the array of patients. 
    */
    async getPhizioDetailsForLogin(message){
        let jsonData = JSON.parse(message);
        let phizioemail = jsonData.phizioemail;
        let phiziopassword = jsonData.phiziopassword;

        const response = await phizioUsersDbInstance.findPhiziotherapistToSignin({phizioemail,phiziopassword});
        //Debug && console.log(response[0]._doc);
        if(response[0]==null){
            return 'invalid';
        }
        else{
            return response;
        }
        //return response[0]._doc;
    }
    
     async getPhizioDetailsForLoginData(message){
        let jsonData = JSON.parse(message);
        console.log("jsonData",jsonData);
        let phizioemail = jsonData.phizioemail;
        // let phiziopassword = jsonData.phiziopassword;

        const response = await phizioUsersDbInstance.findPhiziotherapistToSigninData({phizioemail});
        //Debug && console.log(response[0]._doc);
        if(response[0]==null){
            return 'invalid';
        }
        else{
            return response;
        }
        //return response[0]._doc;
    }


    /**
    *This method is to insert the session data of a new patient. The collection class used in this method is patientSessionDbInstance.
    *
    *
    *@method newPatientSessionInsert
    *@param {Object} message A JSONObject that contains {phizioemail, patient id and the entire session data of the session including the entire rom and emg data}.
    *@return {String} returns if inserted-> 'inserted' else 'not inserted'. 
    */
    async newPatientSessionInsert(message){
        let data = JSON.parse(message);
        let response = await patientSessionDbInstance.newPatientSessionData(message);
        Debug && console.log(response);
        if(response!=null){
            return 'inserted';
        }
        else{
            return 'not inserted';
        }
    }


    /**
    *This method is to delete the etire sessin data of a paticular patient based on the id of patient.
    *
    *
    *@method deletePatientData
    *@param {Object} message A JSONObject that contains {phizioemail, patient id }.
    *@return {Object} onject returned by the database. 
    */
    async deletePatientData(message){
        const response = await patientSessionDbInstance.deletePatientData(message);
        Debug && console.log(response);
    }



    async getPatientReportData(message){
        let data = JSON.parse(message);
        let patientid = data.patientid; 
        let phizioemail = data.phizioemail;
        const response = await patientSessionDbInstance.findAllPatientSessionData(patientid,phizioemail);
        let x = [];
        if(response[0]!=null){
            for(let i=0;i<response[0].sessiondetails.length;i++){
                x.push(response[0].sessiondetails[i]._doc);
                //Debug && console.log(response[0].sessiondetails[i]._doc);
            }

        }
        // Debug && console.log(x.length);
        return x;
    }
    
    async getPatientReportData_testing(message){
        let data = JSON.parse(message);
        let patientid = data.patientid; 
        let phizioemail = data.phizioemail;
        const response = await patientSessionDbInstance.findAllPatientSessionDataTesting(phizioemail);
        
        let x = [];
        if(response[0]!=null){
            for(let i=0;i<response[0].sessiondetails.length;i++){
                x.push(response[0].sessiondetails[i]._doc);
                //Debug && console.log(response[0].sessiondetails[i]._doc);
            }

        }
        // Debug && console.log(x.length);
        return x;
    }
    
    async getPatientReportData_test(message){
      
        let data = JSON.parse(message);
        let phizioemail = data.phizioemail;
        const response = await patientSessionDbInstance.findPatientSessionData_testing(phizioemail);
        console.log("Kranthi+resp",response.length);
        let x = [];
        if(response[0]!=null){
            for(let i=0;i<response[0].sessiondetails.length;i++){
                x.push(response[0].sessiondetails[i]);
                //Debug && console.log(response[0].sessiondetails[i]._doc);
            }

        }
        // Debug && console.log(x.length);
        return x;
    }


    async getPhizioType(phizioemail){
        let response = await phizioUsersDbInstance.getPhizioType(phizioemail);
        response = JSON.parse(response);
        let x = response.type;
        return x;
    }

    async checkPhizioPackageIdAlreadyPresent(message){
        let data = JSON.parse(message);
        let response = await phizioUsersDbInstance.checkPackageIdAlreadyPresent(data.packageid);
        return response;
    }


    async updatePhizioType(message){
        let data = JSON.parse(message);
        let response = await phizioUsersDbInstance.updatePhizioType(data.phizioemail, data.type);
        return response;
    }
	
	async getPatientLimit(phizioemail){
        let response = await phizioUsersDbInstance.getPatientLimit(phizioemail);
        try{
		response = JSON.parse(response);
        let x = response.patientlimit;
        return x;
			
		}catch(err){
			return response;
        }
		
    }

    async updatePatientLimit(message){
        let data = JSON.parse(message);
        let response = await phizioUsersDbInstance.updatePatientLimit(data.phizioemail, data.patientlimit);
        return response;
    }
    
    async getPatientDataForDeletion(phizioemail) {
        let response = await phizioUsersDbInstance.findPhiziotherapist({ phizioemail });
        var patientData;
        if (response.length) {
            patientData = response[0].phiziopatients;
        } else {
            patientData = 'Email does not exists';
        }

        return patientData;
    }

    async deletePhizioUser(phizioemail) {
        let response = await phizioUsersDbInstance.deletePhizioUser(phizioemail);
        return response;
    }

    async deletePatientEntireData(phizioemail) {
        let response = await patientSessionDbInstance.deleteEntireSessionData(phizioemail);

        return response;
    }

}

function getAPIInstance() {
    return new PheezeeAPI();
}

exports.getAPIInstance = getAPIInstance;
