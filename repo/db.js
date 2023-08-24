    "use strict"
/**
 *This npm module is used to connect to the database using the connect function.
 *
 *@module mongoose
 *
 */
let mongoose = require('mongoose');
var uniqid = require('uniqid');
let DatabaseModels = require("./DatabaseModels.js");
let Debug = false;

/**
 * Url of the database to connect.
 *
 * @attribute url
 * @type {String} String url of the database.
 */
let url  = "mongodb://127.0.0.1:27017/StartoonLabs";
// let url  = "mongodb://127.0.0.1:27107/StartoonLabs";

// var session = require('cookie-session');

let dbPhizioUserSchema =new mongoose.Schema(DatabaseModels.PhizioUserModel);

//Model for saving all the emg values
let dbPatientSessionData =new mongoose.Schema(DatabaseModels.PatientSessionDataModel);

let deviceStatusData = new mongoose.Schema(DatabaseModels.DeviceStatusModel);

let deviceLocaationData = new mongoose.Schema(DatabaseModels.DeviceLocationModel);

let devicePackageData = new mongoose.Schema(DatabaseModels.DevicePackageModel);

let ReportData = new mongoose.Schema(DatabaseModels.ReportDataModel);

let deviceStatusSchema = new mongoose.Schema(DatabaseModels.deviceStatusDataModel);

let calbrationStatusSchema = new mongoose.Schema(DatabaseModels.calbrationStatusModel);

//Collections.
/**
*This collection model contains the details of physiotherapist his patient details.
*/
let phizioUsersModel = mongoose.model(DatabaseModels.phiziousersCollection,dbPhizioUserSchema);

/**
*This collection model contains the summary of the session and the links of the file containing the entire session emg and rom values.
*/
let dbPatientSessionDataModel = mongoose.model(DatabaseModels.patientSessionDataCollection,dbPatientSessionData);
let dbDeviceHealthStatusDataModel  = mongoose.model(DatabaseModels.deviceHealthDataCollection,deviceStatusData);
let dbDeviceLocationStatusModel = mongoose.model(DatabaseModels.deviceLocaationDataCollection,deviceLocaationData);
let dbDevicePackageModel = mongoose.model(DatabaseModels.devicePackageDataCollection, devicePackageData);
let dbReportDataModel = mongoose.model(DatabaseModels.ReportDataCollection,ReportData);
let dbDeviceDataModel = mongoose.model(DatabaseModels.deviceStatusDataCollection, deviceStatusSchema);
let dbCalbrationModel = mongoose.model(DatabaseModels.calbrattionStatusDataCollection,calbrationStatusSchema);


/**
* Coonection to the specified url of the database.
*/
console.log(mongoose.connect(url,{useNewUrlParser: true, useUnifiedTopology: true}));



/**
*This class is responsible for all the database related function only on the phiziouser collection. It contains all the
*functions(update, insert, delete etc) related to the phiziouser collection. Which contains only the details of the physiotherapist 
and its patient. This collection also contains the session summary values, mmt and calibration(Self reference) values.
*
* @class phizioUsersDb
* @constructor cunstructor()
*/
class phizioUsersDb{

    constructor(model) {
        this.model = model;
    }

    /**
    *This method is adding a phiysiotherapist entry to the database all the validation weather already
    *or not is handled in the PheezeeAPI class.
    *
    *
    *@method addPhiziotherapist
    *@param {String} phizioname Name of the user/physiotherapist.
    *@param {String} phiziopassword Password of the user/physiotherapist.
    *@param {String} phizioemail Email of the user/physiotherapist.
    *@param {String} phiziophone Phone number of the user/physiotherapist.
    *@param {String} phizioprofilepicurl profile pic url of the user/physiotherapist.
    *@param {String} phiziopatients empty array of patients of the user/physiotherapist.
    *@return {Object} Flag returned by the database.
    */
    async addPhiziotherapist(phizioname, phiziopassword,phizioemail,
        phiziophone,phizioprofilepicurl,phiziopatients, packageid, packagetype) {
    let flag;
        return this.model.create({
            phizioname:phizioname,
            phiziopassword:phiziopassword,
            phizioemail:phizioemail,
            phiziophone:phiziophone,
            phizioprofilepicurl:phizioprofilepicurl,
            phiziopatients:phiziopatients,
            cliniclogo:null,
            type:1,
            packageid:packageid,
            packagetype:packagetype
        });
    }


    /**
    *This method is used to update the status of a patient. Status is basically active or inactive.
    *
    *
    *@method updatePatientStatus
    *@param {message} A JSONObject that contains {patient id, phizioemail, and status of the patient}.
    *@return {Object} Flag returned by database. 
    */
    async updatePatientStatus(message){
        let data = JSON.parse(message);
        Debug && console.log(data);

        const updateOption = {
            $set: {
                    "phiziopatients.$.status":data.status
            }
        };

        return await this.model.updateOne({phizioemail:data.phizioemail,"phiziopatients.patientid":data.patientid},updateOption);
    }

    /**
    *This method is used to add new patient of a physiotherapist.
    *
    *
    *@method addPhizioPatient
    *@param {Object} message A JSONObject that contains {patient id, phizioemail, status(default active), patient name, profile picture url, age , gender, phone, case description of patient }.
    *@return {Object} Flag returned by database. 
    */
    async addPhizioPatient(message){
        let data = JSON.parse(message);
        // Debug && console.log(data);
        const updateOptions = {
            $push: {
                phiziopatients:{
                    patientid:data.patientid,
                    patientname:data.patientname,
                    numofsessions:data.numofsessions,
                    dateofjoin:data.dateofjoin,
                    status:data.status,
                    patientage:data.patientage,
                    patientcasedes:data.patientcasedes,
                    patientcondition:data.patientcondition,
                    patientcomments:data.comments,
                    patientgender:data.patientgender,
                    patientphone:data.patientphone,
                    patientemail:data.patientemail,
                    patientinjured:data.patientinjured,
                    patientcondition:data.patientcondition,
                    patienthistory:data.patienthistory,
                    patientprofilepicurl:data.patientprofilepicurl
                }
            }
        };

        let find_patient = await this.model.find({"phizioemail":data.phizioemail, "phiziopatients.patientid":data.patientid},{"phiziopatients.$":1});
        if(find_patient[0]==null){
            return await this.model.updateOne({phizioemail: data.phizioemail},updateOptions);
        }
        else{
            return 'already';
        }
        
    }

    



    /**
    *This method is used to delete a particular patient from the database. 
    *
    *
    *@method deletePhizioPatient
    *@param {Object} message A JSONObject that contains {physio email and, patientid}.
    *@return {Object} Flag returned by database.
    */
    async deletePhizioPatient(phizioemail, patientid){
             const updateOptions = {
            $pull: {
                phiziopatients:{
                    patientid:patientid
                }
            }
        };
        return this.model.updateOne({phizioemail: phizioemail},updateOptions);
    }

    /**
    *This method is used to update the profile picture url of the physiotherapist/user. 
    *
    *
    *@method updatePhizioProfilePicUrl
    *@param {String} phizioemail User/Physiotherapist email id.
    *@param {String} phizioprofilepicurl User/Physiotherapist profile picture url.
    *@return {Object} Flag returned by database.
    */
    async updatePhizioProfilePicUrl(phizioemail,phizioprofilepicurl){
             const updateOptions = {
             $set: {
                    phizioprofilepicurl:phizioprofilepicurl
             }

        };

        return await this.model.updateOne({phizioemail:phizioemail},updateOptions);
    }


    async updatePhizioClinicLogoUrl(phizioemail,cliniclogo){
             const updateOptions = {
             $set: {
                    cliniclogo:cliniclogo
             }

        };
        return await this.model.updateOne({phizioemail:phizioemail},updateOptions);
    }


    /**
    *This method is used to get the profile picture url of the physiotherapist/user. 
    *
    *
    *@method getPhizioProfilePicUrl
    *@param {String} phizioemail User/Physiotherapist email id.
    *@return {Object} Flag returned by database.
    */
    async getPhizioProfilePicUrl(phizioemail){
        return await this.model.find({phizioemail:phizioemail},{"phizioprofilepicurl":1,"_id":0});
    }


    /**
    *This method method is used to get the profile picture url of a patient. 
    *
    *
    *@method updatePizioPatientProfilePicUrl
    *@param {String} phizioemail User/Physiotherapist email id.
    *@param {String} patientid Patient id of User/Physiotherapist.
    *@param {String} profilepicurl Patients profile picture url.
    *@return {Object} Flag returned by database.
    */
    async updatePizioPatientProfilePicUrl(phizioemail,patientid,profilepicurl){
        Debug && console.log(profilepicurl,patientid,phizioemail);
        const updateOptions = {
            $set: {
                    "phiziopatients.$.patientprofilepicurl":profilepicurl
            }
        };

        return await this.model.updateOne({phizioemail:phizioemail,"phiziopatients.patientid":patientid},updateOptions);
    }

    /**
    *This method is used to update the patient details of a particular patient of a physiotherapist. 
    *
    *
    *@method updatePhizioPatientDetails
    *@param {Object} message A JSONObject that contains {physio email and, patientid, patient name, case description and gender of patient}.
    *@return {Object} Flag returned by database.
    */
    async updatePhizioPatientDetails(message){
        let data = JSON.parse(message);

        const updateOptions = {
            $set: {
                    "phiziopatients.$.patientname":data.patientname,
                    "phiziopatients.$.patientage":data.patientage,
                    "phiziopatients.$.patientcasedes":data.patientcasedes,
                    "phiziopatients.$.patientcondition":data.patientcondition,
                    "phiziopatients.$.patientemail":data.patientemail,
                    "phiziopatients.$.patienthistory":data.patienthistory,
                    "phiziopatients.$.patientinjured":data.patientinjured,
                    "phiziopatients.$.patientphone":data.patientphone,

            }
        };

        return await this.model.updateOne({phizioemail:data.phizioemail,"phiziopatients.patientid":data.patientid},updateOptions);
    }

   /**
    *This method is used to update the patient heldon data of a particular patient of a physiotherapist. 
    *
    *
    *@method updatePhizioPatientheldon
    *@param {Object} message A JSONObject that contains {physio email and, patientid, patient name, case description and gender of patient}.
    *@return {Object} Flag returned by database.
    */
    async updatePhizioPatientheldon(message){
        let data = JSON.parse(message);
        
        const updateOptions = {
            $set: {
                     "phiziopatients.$.heldon":data.heldon

            }
        };

        return await this.model.updateOne({phizioemail:data.phizioemail,"phiziopatients.patientid":data.patientid},updateOptions);
    }

    /**
    *This method is used to get the patient heldon data of a particular patient of a physiotherapist. 
    *
    *
    *@method getPhizioPatientheldon
    *@param {phizioemail,patientid} contains physio email and, patientid.
    *@return {Object} Flag returned by database.
    */
    async getPhizioPatientheldon(phizioemail,patientid){
    
        // let response =  await this.model.findOne({phizioemail:phizioemail,"phiziopatients.patientname":'Abha'});
        let heldon_result = '-'


        let response =  await this.model.find({phizioemail:phizioemail,"phiziopatients.patientid":patientid});
    if(response !=null){
        var results = [];
        var searchField = "patientid";
   
        let obj = JSON.parse(JSON.stringify(response));
        
    

        for (var i=0 ; i < obj[0].phiziopatients.length ; i++)
        {
            if (obj[0].phiziopatients[i][searchField] == patientid) {
            // results.push(obj.list[i]);
            heldon_result=obj[0].phiziopatients[i].heldon;

            }
        }
       
    }
        
        if(heldon_result!=null){
            return JSON.stringify(heldon_result);
        }else{
        return JSON.stringify("-");
    } 
    }

    /**
    *This method is used to update the password of Physiotherapist/User. 
    *
    *
    *@method updatePhizioPassword
    *@param {Object} message A JSONObject that contains {physio email and,new password}.
    *@return {Object} Flag returned by database.
    */
    async updatePhizioPassword(message){
        let data = JSON.parse(message);

        const updateOptions = {
            $set: {
                    "phiziopassword":data.phiziopassword
            }
        };

        return await this.model.updateOne({phizioemail:data.phizioemail},updateOptions);
    }
	
	/**
    *This method is used to update the App version of Physiotherapist/User. 
    *
    *
    *@method phizioprofile_update_app_version
    *@param {Object} message A JSONObject that contains {physio email and,new version}.
    *@return {Object} Flag returned by database.
    */
    async phizioprofile_update_app_version(message){
        let data = JSON.parse(message);
		// The App version data is being stored in phiziopassword feild.

        const updateOptions = {
            $set: {
                    "app_version":data.phiziopassword
            }
        };

        return await this.model.updateOne({phizioemail:data.phizioemail},updateOptions);
    }

    /**
    *This method is used to update the details of a physiotherapist. 
    *
    *
    *@method updatePhizioDetails
    *@param {Object} message A JSONObject that contains {name, phone, clinic name, dob, experience, specialization, degree, gender, address}.
    *@return {Object} Flag returned by database.
    */
    async updatePhizioDetails(message){
        let data = JSON.parse(message);
        const updateOptions = {
            $set: {
                    "phizioname":data.phizioname,
                    "phiziophone":data.phiziophone,
                    "clinicname":data.clinicname,
                    "phiziodob":data.phiziodob,
                    "experience":data.experience,
                    "specialization":data.specialization,
                    "degree":data.degree,
                    "gender":data.gender,
                    "address":data.address

            }

        };

        return await this.model.updateOne({phizioemail:data.phizioemail},updateOptions);
    }


    /**
    *This method is generally used to check weather the user with the input email id is present in the database ot not. 
    *This method is usually called while insering new patient or while log in process. 
    *
    *
    *@method findPhiziotherapist
    *@param {String} phizioemail Email id of the physiotherapist.
    *@return {Object} Flag returned by database.
    */
    async findPhiziotherapist({phizioemail}) {
        return await this.model.find({phizioemail: phizioemail});
    }

    /**
    *This method is generally used while the login process. 
    *
    *
    *@method findPhiziotherapist
    *@param {String} phizioemail Email id of the physiotherapist.
    *@param {String} phiziopassword Password of the physiotherapist.
    *@return {Object} Entire data of the physiotherapist excluding session summary arrays of a particular patient and ids.
    */
    async findPhiziotherapistToSignin({phizioemail,phiziopassword}){
        Debug && console.log("inside the function");
        return await this.model.find({phizioemail:phizioemail,phiziopassword:phiziopassword},{"_id":0, 
            "phiziopatients._id":0});
    }
    
    async findPhiziotherapistToSigninData({phizioemail}){
        Debug && console.log("inside the function");
       
        return await this.model.find({phizioemail:phizioemail},{"_id":0, 
            "phiziopatients._id":0});
    }

    /**
    *This method is used only for testing to get just the details of all the patient of a particular physiotherapist/user. 
    *
    *
    *@method findPatientDataForTesting
    *@param {Object} message A JSONObject that contains {physio email and, patient id}.
    *@return {Object} Entire data of the physiotherapist excluding session summary arrays of a particular patient and ids.
    */
     async findPatientDataForTesting(message){
        let data = JSON.parse(message);
        Debug && console.log(data.patientid);
        return await this.model.find({phizioemail:data.phizioemail},{"_id":0});
        //,{"phiziopatients.sessions":0,"phiziopatients.mmtsessions":0,"phiziopatients.calibrationSession":0,"_id":0}, 
    }



    async getPhizioType(phizioemail){
        let response = await this.model.findOne({'phizioemail':phizioemail},{type:1});
        if(response!=null){
            return JSON.stringify(response);
        }  
    }


    async updatePhizioType(phizioemail,type){
        let updateOptions = {
            $set:{
                type:type
            }
        };
        let response = await this.model.updateOne({phizioemail:phizioemail},updateOptions);
        if(response.ok==1){
            return true;
        }else return false;
    }
	
	async getPatientLimit(phizioemail){
        let response = await this.model.findOne({'phizioemail':phizioemail},{patientlimit:1});
		console.log(phizioemail);
		console.log(response);
        if(response!=null){
            return JSON.stringify(response);
        }  
    }


    async updatePatientLimit(phizioemail,patientlimit){
        let updateOptions = {
            $set:{
                patientlimit:patientlimit
            }
        };
        let response = await this.model.updateOne({phizioemail:phizioemail},updateOptions);
        if(response.ok==1){
            return true;
        }else return false;
    }


    async getPhizioPackageType(message){
        let res = {'isvalid':false, 'type':0};
        let data = JSON.parse(message);
        let response = await this.model.findOne({'phizioemail':data.phizioemail},{packagetype:1});
        if(response!=null){
            res.isvalid = true;
            res.type = response.packagetype;
            return res;
        }else{
            return res;
        }
    }


    async getPhizioPackageId(phizioemail){
        var response = {'packageid':'', 'valid':false};
        let package_id = await this.model.findOne({'phizioemail':phizioemail},{packageid:1,_id:0});
        if(package_id.packageid!==null){
            response.packageid = package_id.packageid;
            response.valid = true;
        }
        return response;
    }


    async updatePhizioPackageType(message){
        let data = JSON.parse(message);
        const updateOptions = {
            $set: {
                    "packagetype":data.packagetype
            }

        };
        let response = await this.model.updateOne({'phizioemail':data.phizioemail},updateOptions);
        let package_id = await this.getPhizioPackageId(data.phizioemail);
        if(package_id.valid === true){
           let devicePackageDbInstance = new devicePackageCollectionDb(dbDevicePackageModel);
           let res_packagetype = await devicePackageDbInstance.updatePackageType(package_id.packageid,data.packagetype);
        }
        if(response.ok==1){
            return true;
        }else{
            return false;
        }
    }


    async checkPackageIdAlreadyPresent(packageid){
        let response_packageid = await this.model.findOne({'packageid':packageid});
        if(response_packageid==null)return false;
        else return true;
    }
    
    
    async deletePhizioUser(phizioemail) {
        const response = await this.model.deleteOne({ phizioemail: phizioemail })

        return response;
    }
    
    
}



//patientSessionData
/**
*This class is responsible for all the database related function only on the patientSessionData collection.
*This collection has the entire session data of every patient. The data also includes the entire emgdata, romdata and also 
*the feilds of every session like the painscale, musclename, etc
*
* @class patientSessionDb
* @constructor cunstructor()
*/
class patientSessionDb{
    constructor(model) {
        this.model = model;
    }
    /**
    *This method is used to get the entire session data of a particular patient. 
    *
    *
    *@method findPatientSessionData
    *@param {String} patientid Patient id.
    *@param {String} phizioemail Email of physiotherapisr.
    *@return {Object} Entire session data of the patient based on id.
    */
     async findPatientSessionData(patientid,phizioemail){
        return await this.model.find({phizioemail:phizioemail,patientid:patientid});
     }

    /**
    *This method is used to get the entire session data of a particular patient excluding the emgdata[] and the romdata[]. 
    *
    *
    *@method findAllPatientSessionData
    *@param {String} patientid Patient id.
    *@param {String} phizioemail Email of physiotherapisr.
    *@return {Object} Entire session data excluding the romdata[] and emgdata[]  of the patient based on id.
    */
     async findAllPatientSessionData(patientid,phizioemail){
        return await this.model.find({phizioemail:phizioemail,patientid:patientid},{"sessiondetails.emgdata":0,"sessiondetails.romdata":0,_id:0, "sessiondetails._id":0});
     }
     
     async findAllPatientSessionDataTesting(phizioemail){
        return await this.model.find({phizioemail:phizioemail},{"sessiondetails.emgdata":0,"sessiondetails.romdata":0,_id:0, "sessiondetails._id":0});
     }

     /**
    *This method is used to get the entire session data of a particular patient. 
    *This method is used for in hose testing purposes and for file creation of every pation using the session application.
    *
    *
    *@method findAllPatientSessionDataForTesting
    *@param {Object} patientid Patient id.
    *@return {Object} Entire session data of the patient based on patient id and physioemail.
    */
     async findAllPatientSessionDataForTesting(message){
        let data = JSON.parse(message);
        return await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid});
     }

    /**
    *This method is used to add new session of a particualr patient based on the physioemail and patientid. This function uses create query for the first time and 
    *then uses just update.
    *
    *
    *@method newPatientSessionData
    *@param {Object} message A JSONObject that contains {physio email and, patient id, heldon,maxemg,minangle, maxangle, holdtime, bodypart, anglecorrected, numofreps, sessiontime,painscale, romdata[], muscletone, excercisename, commentsession,musclename, repsselected,orientation,emgdata[]}.
    *@return {Object} Flag returned by the database.
    */
     async newPatientSessionData(message){
        Debug && console.log(message);
            let data = JSON.parse(message);
            let check = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid});
            let check2 = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.heldon},{"sessiondetails.$":1});
        if(check2[0]==null){
                if(check[0]!=null && check2[0]==null){
                    const updateOptions = {
                        $push: {
                            "sessiondetails":{
                                            heldon:data.heldon,
                                            maxemg:data.maxemg,
                                            maxangle:data.maxangle,
                                            minangle:data.minangle,
                                            holdtime:data.holdtime,
                                            holdangle:data.holdangle,
                                            activetime:data.activetime,
                                            mmtgrade:data.mmtgrade,
                                            bodyorientation:data.bodyorientation,
                                            sessiontype:data.sessiontype,
                                            maxangleselected:data.maxangleselected,
                                            minangleselected:data.minangleselected,
                                            maxemgselected:data.maxemgselected,
                                            sessioncolor:data.sessioncolor,
                                            bodypart:data.bodypart,
                                            anglecorrected:data.anglecorrected,
                                            numofreps:data.numofreps,
                                            sessiontime:data.sessiontime,
                                            painscale:data.painscale,
                                            romdata:data.romdata,
                                            muscletone:data.muscletone,
                                            exercisename:data.exercisename,
                                            commentsession:data.commentsession,
                                            painscale:data.painstatus,
                                            patientstatus:data.patientstatus,
                                            therapistname:data.therapistname,
                                            musclename:data.musclename,
                                            repsselected:data.repsselected,
                                            orientation:data.orientation,
                                            emgdata:data.emgdata,
                                            velocity:data.velocity,
                                            avgmaxemg:data.avgmaxemg,
                                            consistency:data.consistency,
                                            smoothness:data.smoothness,
                                            controlled:data.controlled,
                                            rom_avg_max:data.rom_avg_max,
                                            rom_avg_min:data.rom_avg_min,
											activity_list:data.activity_list
                                            
                                        }
                        }
                    };

                 return this.model.updateOne({phizioemail: data.phizioemail,patientid:data.patientid},updateOptions);
                }
                else{
                     return this.model.create({
                            phizioemail:data.phizioemail,
                            patientid:data.patientid,
                            sessiondetails:[{
                                            heldon:data.heldon,
                                            maxemg:data.maxemg,
                                            maxangle:data.maxangle,
                                            minangle:data.minangle,
                                            bodypart:data.bodypart,
                                            anglecorrected:data.anglecorrected,
                                            holdtime:data.holdtime,
                                            holdangle:data.holdangle,
                                            activetime:data.activetime,
                                            mmtgrade:data.mmtgrade,
                                            bodyorientation:data.bodyorientation,
                                            sessiontype:data.sessiontype,
                                            maxangleselected:data.maxangleselected,
                                            minangleselected:data.minangleselected,
                                            maxemgselected:data.maxemgselected,
                                            sessioncolor:data.sessioncolor,
                                            numofreps:data.numofreps,
                                            sessiontime:data.sessiontime,
                                            painscale:data.painscale,
                                            romdata:data.romdata,
                                            muscletone:data.muscletone,
                                            symptoms:data.symptoms,
                                            exercisename:data.exercisename,
                                            commentsession:data.commentsession,
                                            painscale:data.painstatus,
                                            patientstatus:data.patientstatus,
                                            therapistname:data.therapistname,
                                            musclename:data.musclename,
                                            repsselected:data.repsselected,
                                            orientation:data.orientation,
                                            emgdata:data.emgdata,
                                            velocity:data.velocity,
                                            avgmaxemg:data.avgmaxemg,
                                            consistency:data.consistency,
                                            smoothness:data.smoothness,
                                            controlled:data.controlled,
                                            rom_avg_max:data.rom_avg_max,
                                            rom_avg_min:data.rom_avg_min,
											activity_list:data.activity_list
                                        }
                            ]
                    });
                }
            }
            else{
                Debug && console.log("already");
                return "already";
            }
     }

    /**
    *This method is used to update the comment values of a session after the session is completed.
    *
    *
    *@method updatePatientSessionCommentData
    *@param {Object} message A JSONObject that contains {physio email and, patient id, painscale, muscletone, exercisename, commentsession, symptoms}.
    *@return {Object} Flag returned by the database.
    */
     async updatePatientSessionCommentData(message){
        let data = JSON.parse(message);
        const updateOptions = {
            $set: {
                    "sessiondetails.$.painscale":data.painscale,
                    "sessiondetails.$.muscletone":data.muscletone,
                    "sessiondetails.$.exercisename":data.exercisename,
                    "sessiondetails.$.commentsession":data.commentsession,
                    "sessiondetails.$.painscale":data.painstatus,
                    "sessiondetails.$.patientstatus":data.patientstatus,
                    "sessiondetails.$.therapistname":data.therapistname,
                    "sessiondetails.$.symptoms":data.symptoms

            }
        };

        return await this.model.updateOne({phizioemail:data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.heldon},updateOptions);

     }



     /**
    *This method is used to update the mmt grade of a session after the session is completed.
    *
    *
    *@method updatePatientMmtGrade
    *@param {Object} message A JSONObject that contains {physio email and, patient id, heldon and mmtgrade}.
    *@return {Object} Flag returned by the database.
    */
     async updatePatientMmtGrade(message){
        let data = JSON.parse(message);
        let updateOptions;
        if(typeof data.commentsession!='undefined'){
            updateOptions = {
                $set: {
                        "sessiondetails.$.mmtgrade":data.mmtgrade,
                        "sessiondetails.$.sessiontype":data.sessiontype,
                        "sessiondetails.$.bodyorientation":data.bodyorientation,
                        "sessiondetails.$.commentsession":data.commentsession,
                         "sessiondetails.$.painscale":data.painstatus,
                         "sessiondetails.$.patientstatus":data.patientstatus,
                        "sessiondetails.$.therapistname":data.therapistname

                }
            };
        }
        else{
            updateOptions = {
                $set: {
                        "sessiondetails.$.mmtgrade":data.mmtgrade,
                        "sessiondetails.$.sessiontype":data.sessiontype,
                        "sessiondetails.$.bodyorientation":data.bodyorientation,
                        "sessiondetails.$.therapistname":data.therapistname,
                        "sessiondetails.$.painscale":data.painstatus,
                        "sessiondetails.$.patientstatus":data.patientstatus
                    

                }
            };
        }

        return await this.model.updateOne({phizioemail:data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.heldon},updateOptions);
     }

    /**
    *This method is used to delete the entire data of a patient based on the phizioemail and patientid.
    *
    *
    *@method deletePatientData
    *@param {Object} message A JSONObject that contains {physio email and, patient id}.
    *@return {Object} Flag returned by the database.
    */
     async deletePatientData(message){
            let data = JSON.parse(message);
            return this.model.deleteOne({phizioemail: data.phizioemail,patientid:data.patientid});
     }


     async deletePhizioPatientSession(message){
        let data = JSON.parse(message);
             const updateOptions = {
            $pull: {
                sessiondetails:{
                    heldon:data.heldon
                }
            }
        };
        let check2 = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.heldon},{"sessiondetails.$":1});
        console.log(check2);
        if(check2[0]!=null){
            return this.model.updateOne({phizioemail: data.phizioemail, patientid:data.patientid},updateOptions);
        }
        else{
            return "deleted";
        }
    } 
    
    
    async deleteEntireSessionData(phizioemail) {
        const response = await this.model.deleteMany({ phizioemail: phizioemail });

        return response;
    }
    
}


//deviceStatusCollectionDb
/**
*This class has all the functions related to the health and status of the device.
*
* @class deviceStatusCollectionDb
* @constructor cunstructor()
*/
class deviceStatusCollectionDb{
    constructor(model) {
        this.model = model;
    }

    async insertOrUpdatePheezeeDeviceDetails(message){
        let data = JSON.parse(message);
        let check_device_present = await this.model.countDocuments({uid:data.uid});
        if(check_device_present==0){
            let response = await this.model.create({
                uid:data.uid,
                mac:data.mac,
                firmware_version:data.firmware_version,
                hardware_version:data.hardware_version,
                serial_version:data.serial_version,
                atiny_version:data.atiny_version,
                status:true
            });
            if(response!=null){return true;}
            else{return false;}
        }else{
            const updateOptions = {
                $set: {
                    firmware_version:data.firmware_version,
                    hardware_version:data.hardware_version,
                    serial_version:data.serial_version,
                    atiny_version:data.atiny_version
                }
            };

            let query = {uid:data.uid};

            let response = await this.model.updateOne(query,updateOptions);
            if(response!=null && response.ok==1){return true;}
            else{return false;}
        }
    }

    async checkIfDevicePresent(uid){
        let query = {uid:uid};
        let check = await this.model.findOne(query,{health:0,phizioemails:0});
        if(check!=null){return true;}
        else{return false;}
    }
    


    async insertPheezeeHealthStatus(message){
        let data = JSON.parse(message);
        let check_if_device_present = await this.checkIfDevicePresent(data.uid); 
        if(check_if_device_present){
            var to_be_inserted = false;
            if(data.u_lsm_ini==1 || data.l_lsm_ini==1 || data.gain_amplifier==1 || data.atiny_init_status==1 || data.adc_status==1 ||
                data.u_lsm_regi==1 || data.l_lsm_regi==1 || data.gain_amplifier_write_status==1 || data.ble_status==1 || data.charger_staus==1 ||
                data.pow_btn_status==1 || data.main_ldo_status==1 || data.over_current_protection_status==1 || data.u_lesm_read==1 ||
                data.l_lsm_read==1 || data.atiny_read_status==1){
                to_be_inserted = true;
            }else{
                to_be_inserted = await this.checkIfHealthStatusToBeInserted(data.uid,data.time_stamp);
                console.log('here2');
            }
            Debug && console.log('To be Inserted',to_be_inserted);
            if(to_be_inserted){
               return await this.finallyInsertPheezeeeHealthStatus(data,false);
               Debug && console.log('here1');
            }else{
                Debug && console.log('here3');
                return true;
            }
        }
        /*else{
            return await this.finallyInsertPheezeeeHealthStatus(data,true);
        }*/
    }

    async checkIfHealthStatusToBeInserted(uid,date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(0, 10)){
        let days = 8;
        let to_be_inserted = false;
        var current_date = new Date(date);
        let last_date = new Date(current_date.getTime() - (days*24*60*60*1000))
                            .toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(0, 10);
        Debug && console.log(last_date);
        await this.model.aggregate([
            { $match: { 'uid': uid } },
            {
                $project: {
                  health: {
                    $filter: {
                      input: '$health',
                      as: 'item',
                      cond: { $and: [
                        {$lt:[{ $substrBytes: ['$$item.time_stamp', 0, 10] }, date]  },
                        {$gt:[{ $substrBytes: ['$$item.time_stamp', 0, 10] }, last_date]  }
                      ] }
                    },
                  },
                },
              },
            ]).then(function(docs){
                Debug && console.log(docs[0].health.length);
                if(docs[0].health.length==0){to_be_inserted=true;}
            });

            return to_be_inserted;
    }

    async finallyInsertPheezeeeHealthStatus(data,create_new){
        let health = {
            time_stamp:data.time_stamp,
            health_info:{
                u_lsm_ini:data.u_lsm_ini,
                l_lsm_ini:data.l_lsm_ini,
                gain_amplifier:data.gain_amplifier,
                atiny_init_status:data.atiny_init_status,
                adc_status:data.adc_status,
                u_lsm_regi:data.u_lsm_regi,
                l_lsm_regi:data.l_lsm_regi,
                gain_amplifier_write_status:data.gain_amplifier_write_status,
                ble_status:data.ble_status,
                charger_staus:data.charger_staus,
                pow_btn_status:data.pow_btn_status,
                main_ldo_status:data.main_ldo_status,
                over_current_protection_status:data.over_current_protection_status,
                u_lesm_read:data.u_lesm_read,
                l_lsm_read:data.l_lsm_read,
                atiny_read_status:data.atiny_read_status,
                u_mag_ini:data.u_mag_ini,
                l_mag_ini:data.l_mag_ini,
                u_mag_read:data.u_mag_read,
                l_mag_read:data.l_mag_read
            }
        };
        if(create_new){
            let create = {
                uid:data.uid,
                status:true,
                'health':[health]
            };

            let response_health_data_created = await this.model.create(create);
            if(response_health_data_created!=null){return true;}else{return false;}
        }
        else{
            let updateOptions = {
                $push: {
                            'health':health
                        }
            };
            let response_health_data_pushed = await this.model.updateOne({uid:data.uid},updateOptions);
            if(response_health_data_pushed.ok==1){return true;}else{return false;}
        }
        

    }


    async insertPhizioEmailWhichUsedTheDevice(message){
        let data = JSON.parse(message);
        let response = await this.model.find({uid:data.uid,"phizioemails.phizioemail":data.phizioemail},{"phizioemails.$":1});
        if(response[0]==null){
            let updateOptions = {
                $push:{
                    'phizioemails':{
                        phizioemail:data.phizioemail,
                        time_stamp:data.time_stamp
                    }
                }
            };
            let response_insert = await this.model.updateOne({uid:data.uid},updateOptions);
            Debug && console.log(response_insert);
            if(response_insert.ok==1){return true;}else{return false;}
        }else{
            let updateOptions = {
                $set: {
                        "phizioemails.$.time_stamp":data.time_stamp
                }
            };
            let response_update = await this.model.updateOne({uid:data.uid,'phizioemails.phizioemail':data.phizioemail},updateOptions);
            if(response_update.ok==1){return true;}else{return false;}
        }
    }


    async getDeviceStatus(message){
        let data = JSON.parse(message);
        let response = await this.model.findOne({uid:data.uid},{status:1,uid:1});
        /*response = JSON.stringify(response);
        response = JSON.parse(response);*/
        return response;
    }

    async updateDeviceStatus(message){
        let data = JSON.parse(message);
        let check_device_present = await this.checkIfDevicePresent(data.uid);
        if(check_device_present){
            let updateOptions = {
                $set: {
                    status:data.status
                }
            };

            let response_update = await this.model.updateOne({uid:data.uid},updateOptions);
            Debug && console.log(response_update);
        }
    }

    async getDevicePackageId(uid){
        let data = await this.model.findOne({uid:uid},{packageid:1,_id:0});
        return data;
    }

    async checkIfDeviceHasPackageID(uid){
        var response = {'res':false,'message':''};
        let check_if_device_present = await this.checkIfDevicePresent(uid);
        if(check_if_device_present){
            let check_package_id = await this.getDevicePackageId(uid);
            if(check_package_id.packageid===undefined){
                response.res = true;
                response.message = "Package id can be generated.";
            }else{
                response.message = "Package id already present for device";
            }
        }else{
            response.message = "Device not present!";
        }

        return response;
    }

    async updatePackageId(uid, packageid){
        let updateOptions = {
            $set:{
                packageid:packageid
            }
        };
        let response = await this.model.updateOne({uid:uid},updateOptions);
        if(response.ok==1){
            return true;
        }else{
            return false;
        }
    }


    async getDeviceDetailsBasedOnMac(message){
        let data = JSON.parse(message);
        let response = await this.model.findOne({'mac':data.mac},{health:0,phizioemails:0});
        return response;
    }

    async getDeviceDetailsBasedOnUid(message){
        let data = JSON.parse(message);
        let response = await this.model.findOne({'uid':data.uid},{health:0,phizioemails:0});
        return response;
    }
    
    async getWarrantyDetails(macid) {
        let response = await this.model.findOne({ mac: macid });
        let health_data = response.health;
        health_data.sort(function (a, b) {
            return new Date(a.time_stamp) - new Date(b.time_stamp);
        });
        
        let dateAfterShipment = [];
        
        

        if (health_data.length) {
            if(response.customerdetails.shipmentdate) {
                health_data.map((e, i) => {
                if(new Date(response.customerdetails.shipmentdate) < new Date(e.time_stamp)) {
                        dateAfterShipment.push(e.time_stamp);
                    }
                })
                return dateAfterShipment[0];
            } else {
                return "Null"
            }
        } else {
            return "DeviceDisconnect";
        }
    }
    
    async getDeviceSerialNumber(macid) {
        let response = await this.model.findOne({ mac: macid });
        
        if(response.packagelabel.serialnumber) {
            return response.packagelabel.serialnumber;
        } else {
            return "Null";
        }
    }
    
    
    async addCustomerDetails(data) {
        let responseOne = await this.model.findOne({uid: data.uid});
        console.log(responseOne);
        
        if (responseOne) {
            let updateOptions = {
                $set: {
                    packagelabel: {
                        serialnumber: data.serialnumber,
                        modelnumber: data.modelnumber,
                        lotnumber: data.lotnumber
                    },
                    customerdetails: {
                        invoice: data.invoice,
                        customername: data.customername,
                        phonenumber: data.phonenumber,
                        emailid: data.emailid,
                        shipmentdate: data.shipmentdate,
                    }
                }
            };

            let response_update = await this.model.updateOne({ uid: data.uid }, updateOptions);
            console.log(response_update);
        }
    }
    
}



//deviceLocationStatusCollectionDb
/**
*This class has all the functions related to the location of the device. Also this class handels all the operations
*related to the device location collection.
* @class deviceLocationStatusCollectionDb
* @constructor cunstructor()
*/
class deviceLocationStatusCollectionDb{
    constructor(model) {
        this.model = model;
    }


    async updateDeviceLocation(message){
        let data = JSON.parse(message);
        let query = {
            uid:data.uid,
            time_stamp:data.time_stamp,
            latitude:data.latitude,
            longitude:data.longitude    
        };   
        /*let response = await this.model.create(query);
        console.log(response);*/

        let check_last = await this.model.findOne({uid:data.uid}).sort({_id:-1});
        if(check_last==null){
            let response = await this.model.create(query);
            if(response!=null){return true;}else{return false;}
        }else{
            let distance = await this.distance(data.latitude, data.longitude, check_last.latitude, check_last.longitude,'K');
            if(distance>2){
                let response = await this.model.create(query);
                if(response!=null){
                    return true;
                }else{return false;}
            }else{
                return true;
            }
        }
    }


    async distance(lat1, lon1, lat2, lon2, unit) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit=="K") { dist = dist * 1.609344 }
            if (unit=="N") { dist = dist * 0.8684 }
            return dist;
        }
    }

    
}

//deviceLocationStatusCollectionDb
/**
*This class has all the functions related to the location of the device. Also this class handels all the operations
*related to the device location collection.
* @class deviceLocationStatusCollectionDb
* @constructor cunstructor()
*/
class devicePackageCollectionDb{
    constructor(model) {
        this.model = model;
        this.deviceStatusDbInstance = new deviceStatusCollectionDb(dbDeviceHealthStatusDataModel);
    }

    async checkPackageDataCanBeCreated(uid){
        let check_if_packageid_already_given_to_device = await this.deviceStatusDbInstance.checkIfDeviceHasPackageID(uid);
        return check_if_packageid_already_given_to_device;
    }

    async checkPackageIdAlreadyPresent(id){
        let check_id = await this.model.findOne({packageid:id});
        if(check_id==null)return false;
        else return true;
    }

    async getPackageType(id){
        let package_type = await this.model.findOne({packageid:id},{packagetype:1,_id:0});
        return package_type.packagetype;
    }

    async updatePackageType(id,packagetype){
        let updateOptions = {
            $set:{
                packagetype:packagetype
            }
        };

        let response = await this.model.updateOne({packageid:id},updateOptions);
        if(response.ok==1){
            return true;
        }else{
            return false;
        }
    }

    async createPackageDataForNewProduct(message){
        let data = JSON.parse(message);
        let can_create = await this.checkPackageDataCanBeCreated(data.uid);
        if(can_create.res===true){
            let packageid = uniqid();
            let query = {
                packageid:packageid,
                packagetype:data.packagetype
            }
            let check_alread_present = await this.checkPackageIdAlreadyPresent(packageid);
            if(!check_alread_present){
                let response_create = await this.model.create(query);
                if(response_create!=null){
                    console.log('here');
                    let response_update_packageid = await this.deviceStatusDbInstance.updatePackageId(data.uid, packageid);
                    if(response_update_packageid===true){
                        can_create.res = true;
                        can_create.message = 'Created the packageid';
                        can_create.packageid = packageid;
                    }
                }else{
                    can_create.res = false;
                    can_create.message = 'Error, try again later';
                }
            }else{
                can_create.res = false;
                can_create.message = 'Package id already present, try again later';
            }
        }

        return can_create;
    }
    
}

//ReportCollectionDb
/**
*This class has all the functions related to the report download data. Also this class handels all the operations
*related to the report download  collection.
* @class deviceLocationStatusCollectionDb
* @constructor cunstructor()
*/
class ReportDataCollectionDb{
    constructor(model) {
        this.model = model;
    }
    /**
    *This method is generally used to check weather the user with the input email id is present in the database ot not. 
    *This method is usually called while insering new patient or while log in process. 
    *
    *
    *@method findReport
    *@param {String} phizioemail Email id of the physiotherapist.
    *@return {Object} Flag returned by database.
    */
    async findReport(phizioemail,patientid) {
        console.log(phizioemail);
        return await this.model.find({phizioemail: phizioemail,patientid:patientid});
    }
    
    async findReport_testing(phizioemail) {
        console.log(phizioemail);
        return await this.model.find({phizioemail: phizioemail});
    }
    
    /**
    *This method is adding a report download date entry to the database all the validation weather already
    *or not is handled in the PheezeeAPI class.
    *
    *
    *@method addReport
    *@param {String} message object of the user/physiotherapist.
    *@return {Object} Flag returned by the database.
    */
    async addReport(data) {  
   
    let check = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid});
    let check2 = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.sessiondetails[0].heldon});
   
        if(check[0]==null){
            return this.model.create({
                phizioemail:data.phizioemail,
                patientid:data.patientid,
                sessiondetails:[{
                              heldon:data.sessiondetails[0].heldon,
                              date:data.sessiondetails[0].date
                              }],
                overalldetails:[{
                              bodypart:data.overalldetails[0].bodypart,
                              date:data.overalldetails[0].date
                              }]
            
                });
        }
        // Session Report
        if(check[0]!=null && check2[0]==null){
            console.log("inside the DB Update db.js");
                    const updateOptions = {
                        $push: {
                            "sessiondetails":{
                                            heldon:data.sessiondetails[0].heldon,
                                            date:data.sessiondetails[0].date
                                            
                                        }
                        }
                    };
                 return this.model.updateOne({phizioemail: data.phizioemail,patientid:data.patientid},updateOptions);
             }else if(check[0]!=null && check2[0]!=null)
             {
                const updateOptions = {
                        $set: {
                            "sessiondetails.$.heldon":data.sessiondetails[0].heldon,
                            "sessiondetails.$.date":data.sessiondetails[0].date,
                        }
                    };
                 return this.model.updateOne({phizioemail: data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.sessiondetails[0].heldon},updateOptions);
             }
    }
    
    /**
    *This method is adding a Overall report download date entry to the database all the validation weather already
    *or not is handled in the PheezeeAPI class.
    *
    *
    *@method addReport_overall
    *@param {String} message object of the user/physiotherapist.
    *@return {Object} Flag returned by the database.
    */
       async addReport_overall(data) {  
   
    let check = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid});
    let check2 = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.sessiondetails[0].heldon});
    let check3 = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid,"overalldetails.bodypart":data.overalldetails[0].bodypart});
    
        if(check[0]==null){
        
            return this.model.create({
                phizioemail:data.phizioemail,
                patientid:data.patientid,
                sessiondetails:[{
                              heldon:data.sessiondetails[0].heldon,
                              date:data.sessiondetails[0].date
                              }],
                overalldetails:[{
                              bodypart:data.overalldetails[0].bodypart,
                              date:data.overalldetails[0].date,
                              download_status:false
                              }]
            
                });
        }
 
             // Overall Report
             if(check[0]!=null && check3[0]==null){
                    const updateOptions = {
                        $push: {
                            "overalldetails":{
                                            bodypart:data.overalldetails[0].bodypart,
                                            date:data.overalldetails[0].date,
											download_status:false
                                            
                                        }
                        }
                    };
                 return this.model.updateOne({phizioemail: data.phizioemail,patientid:data.patientid},updateOptions);
             }else if(check[0]!=null && check3[0]!=null)
             {
                const updateOptions = {
                        $set: {
                            "overalldetails.$.bodypart":data.overalldetails[0].bodypart,
                            "overalldetails.$.date":data.overalldetails[0].date,
                              "overalldetails.$.download_status":false
                            // "sessiondetails":{
                            //                 heldon:data.sessiondetails[0].heldon,
                            //                 date:data.sessiondetails[0].date
                                            
                            //             }
                        }
                    };
                 return this.model.updateOne({phizioemail: data.phizioemail,patientid:data.patientid,"overalldetails.bodypart":data.overalldetails[0].bodypart},updateOptions);
             }
    
 
    }
	
	 /**
    *This method is checks if new overall report needs to be downloaded or not.
    *
    *
    *@method overallreport_download_status
    *@param {String} message object of the user/physiotherapist.
    *@return {Object} Flag returned by the database.
    */
       async overallreport_download_status(data) {
        
   
    let check = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid});
    let check2 = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid,"sessiondetails.heldon":data.sessiondetails[0].heldon});
    let check3 = await this.model.find({phizioemail:data.phizioemail,patientid:data.patientid,"overalldetails.bodypart":data.overalldetails[0].bodypart});
    
        if(check[0]==null){
        
            return this.model.create({
                phizioemail:data.phizioemail,
                patientid:data.patientid,
                sessiondetails:[{
                              heldon:data.sessiondetails[0].heldon,
                              date:data.sessiondetails[0].date
                              }],
                overalldetails:[{
                              bodypart:data.overalldetails[0].bodypart,
                              date:data.overalldetails[0].date
                              }]
            
                });
        }
 
             // Overall Report
             if(check[0]!=null && check3[0]==null){
                    const updateOptions = {
                        $push: {
                            "overalldetails":{
                                            bodypart:data.overalldetails[0].bodypart,
                                            date:data.overalldetails[0].date,
                                            download_status:data.overalldetails[0].download_status,                                            
                                        }
                        }
                    };
                 return this.model.updateOne({phizioemail: data.phizioemail,patientid:data.patientid},updateOptions);
             }else if(check[0]!=null && check3[0]!=null)
             {
                const updateOptions = {
                        $set: {
                            "overalldetails.$.download_status":data.overalldetails[0].download_status
                        }
                    };
                 return this.model.updateOne({phizioemail: data.phizioemail,patientid:data.patientid,"overalldetails.bodypart":data.overalldetails[0].bodypart},updateOptions);
             }
    
 
    }
    
}

class CalbrationCollectionDb{
   constructor(model) {
        this.model = model;
        
    }
    async addCalbration(message){
        console.log(message);
         const response = await dbCalbrationModel.create(message);
            console.log(response);
            return response;
        };
        
        
    }
    

exports.phizioUsersDbInstance = new phizioUsersDb(phizioUsersModel);
exports.patientSessionDbInstance = new patientSessionDb(dbPatientSessionDataModel);
exports.deviceStatusDbInstance = new deviceStatusCollectionDb(dbDeviceHealthStatusDataModel);
exports.deviceLocationStatusDbInstance = new deviceLocationStatusCollectionDb(dbDeviceLocationStatusModel);
exports.devicePackageDbInstance = new devicePackageCollectionDb(dbDevicePackageModel);
exports.reportDataDbInstance = new ReportDataCollectionDb(dbReportDataModel);
exports.calbrationDataDbInstance = new CalbrationCollectionDb(dbCalbrationModel);


    /**
    *This method is used to get the data of a patient based on the date of session.
    *
    *
    *@method DailyReport
    *@param {String} phizioemail Email of physiotherapist.
    *@param {String} patientid Patient id.
    *@param {String} date Date of session held.
    *@return {Object} Session data.
    */
exports.DailyReport = async function (
  phizioemail,
  patientid,
  date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10),
) {
  let DailyReports;
  await dbPatientSessionDataModel
    .aggregate([
      { $match: { phizioemail, patientid } },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond: { $eq: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date] },
            },
          },
        },
      },
    ])
    .then((docs) => {
      if (typeof docs !== 'undefined' && docs.length > 0) {
        DailyReports = docs;
      } else {
        DailyReports = 'there are no reports for today';
      }
      DailyReports = docs;
    });
  return DailyReports;
};

    /**
    *This method is used to get the details of a patient based on phizioemail and patientid.
    *
    *
    *@method PatientDetails
    *@param {String} phizioemail Email of physiotherapist.
    *@param {String} patientid Patient id.
    *@return {Object} PatientDetails.
    */
exports.PatientDetails = async function (phizioemail, patientid) {
  let details;
  await phizioUsersModel
    .find(
      {
        phizioemail,
        'phiziopatients.patientid': patientid,
      },
      {
         phizioprofilepicurl:1,'phiziopatients.$ ': 1, phizioname: 1,degree: 1, clinicname: 1, address: 1,phizioemail:1,phiziophone:1,cliniclogo:1
      },
    )
    .then((docs) => {
      if (typeof docs !== 'undefined' && docs.length > 0) {
        details = docs;
      } else {
        details = 'the email and patientID you entered does not match any documents';
      }
    });
  return details;
};

exports.PhizioDetails = async function (phizioemail) {
  let details;

   
  await phizioUsersModel
    .find(
      {
        phizioemail
      },
      {
         phizioprofilepicurl:1, phizioname: 1,degree: 1, clinicname: 1, address: 1,phizioemail:1,phiziophone:1,cliniclogo:1
      },
    )
    .then((docs) => {
      if (typeof docs !== 'undefined' && docs.length > 0) {
        details = docs;
      } else {
        details = 'the email you entered does not match any documents';
      }
    });
  return details;
};


//get all the database of phiziouser
exports.getAllDatabase = async function (phizioemail, patientid) {
  let details;
  await phizioUsersModel
    .find(
      {
      },
      {
         "phiziopatients.sessions": 0 ,"phiziopatients.mmtsessions": 0,"phiziopatients.calibrationSession": 0
      },
    )
    .then((docs) => {
      if (typeof docs !== 'undefined' && docs.length > 0) {
        details = docs;
      } else {
        details = 'the email and patientID you entered does not match any documents';
      }
    });
  return details;
};


exports.sessionDates = async function (phizioemail,patientid) {
  let xyz = new Set();
     await dbPatientSessionDataModel.distinct('sessiondetails.heldon',{'phizioemail':phizioemail,'patientid':patientid}).then((docs)=>{
        docs.forEach((docs)=>{
          xyz.add(docs.substring(0,10));
        });
     });
       return xyz; 
};

exports.lastSessionBasedOnExerciseAndJoint = async function (phizioemail,patientid, joint, exercisename,date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10)) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.bodypart' , joint] },
                      { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails[docs[0].sessiondetails.length-1];
        }
        else{
            last_session = 0;
        }
    });

    return last_session;
};

exports.lastSessionBasedOnExerciseAndJointAndOrientation = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10)) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] },
					  { $eq: ['$$item.musclename' , musclename] },
					  { $eq: ['$$item.bodyorientation' , bodyorientation] },
                      { $eq: ['$$item.bodypart' , joint] },
                      { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails[docs[0].sessiondetails.length-1];
        }
        else{
            last_session = 0;
        }
    });

    return last_session;
};
exports.normativeapi_current = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] },
					  { $eq: ['$$item.musclename' , musclename] },
					  { $eq: ['$$item.bodyorientation' , bodyorientation] },
                      { $eq: ['$$item.bodypart' , joint] },
                    //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = 0;
        }
        }
        catch (error) {
  last_session = 0;
}
    });

    return last_session;
};
exports.normativeapi_referance = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] },
					  { $eq: ['$$item.musclename' , musclename] },
					  { $eq: ['$$item.bodyorientation' , bodyorientation] },
                      { $eq: ['$$item.bodypart' , joint] },
                    //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = 0;
        }
        }
        catch (error) {
  last_session = 0;
}
    });

    return last_session;
};














exports.current_session_prv = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] },
					  { $eq: ['$$item.musclename' , musclename] },
					  { $eq: ['$$item.bodyorientation' , bodyorientation] },
                      { $eq: ['$$item.bodypart' , joint] },
                    //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = 0;
        }
        }
        catch (error) {
  last_session = 0;
}
    });

    return last_session;
};

exports.goal_reached = async function (phizioemail,patientid) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
    //                   { $eq: ['$$item.exercisename' , exercisename] },
    //                   { $eq: ['$$item.orientation' , orientation] },
				// 	  { $eq: ['$$item.musclename' , musclename] },
				// 	  { $eq: ['$$item.bodyorientation' , bodyorientation] },
    //                   { $eq: ['$$item.bodypart' , joint] },
                    //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = "no_session";
        }
        }
        catch (error) {
  last_session = "no_session";
}
    });

    return last_session;
};


exports.recommanded_assigment_value = async function (phizioemail,patientid,orientation) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
    //                   { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] }
				// 	  { $eq: ['$$item.musclename' , musclename] },
				// 	  { $eq: ['$$item.bodyorientation' , bodyorientation] },
    //                   { $eq: ['$$item.bodypart' , joint] },
                    //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = "no_session";
        }
        }
        catch (error) {
  last_session = "no_session";
}
    });

    return last_session;
};


exports.testing_kranthi_value = async function (phizioemail,patientid,orientation) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
    //   {
    //     $project: {
    //       sessiondetails: {
    //         $filter: {
    //           input: '$sessiondetails',
    //           as: 'item',
    //           cond:
    //                 {
    //                   $and:[
    // //                   { $eq: ['$$item.exercisename' , exercisename] },
    //                   { $eq: ['$$item.orientation' , orientation] }
				// // 	  { $eq: ['$$item.musclename' , musclename] },
				// // 	  { $eq: ['$$item.bodyorientation' , bodyorientation] },
    // //                   { $eq: ['$$item.bodypart' , joint] },
    //                 //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
    //                   ]  
    //                 } 
    //         }
    //       }
    //     }
    //   }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = "no_session";
        }
        }
        catch (error) {
  last_session = "no_session";
}
    });

    return last_session;
};


exports.lastSessionBasedOnExerciseAndJointAndOrientationdataK = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10)) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                    //   { $eq: ['$$item.exercisename' , exercisename] },
                    //   { $eq: ['$$item.orientation' , orientation] },
					//   { $eq: ['$$item.musclename' , musclename] },
					//   { $eq: ['$$item.bodyorientation' , bodyorientation] },
                    //   { $eq: ['$$item.bodypart' , joint] },
                      { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = 0;
        }
    });

    return last_session;
};

exports.kranthi_last_session_filter_data = async function (phizioemail,patientid, joint, exercisename,musclename,date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10)) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
               //   { $eq: ['$$item.exercisename' , exercisename] },
              { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = 0;
        }
    });

    return last_session;
};

exports.session_array = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10)) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                    //   { $eq: ['$$item.exercisename' , exercisename] },
                    //   { $eq: ['$$item.orientation' , orientation] },
					//   { $eq: ['$$item.musclename' , musclename] },
					// //   { $eq: ['$$item.bodyorientation' , bodyorientation] },
                    //   { $eq: ['$$item.bodypart' , joint] },
                      { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = 0;
        }
    });

    return last_session;
};

exports.recommanded_assigment_value_bilateral = async function (phizioemail,patientid,orientation) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
    //   {
    //     $project: {
    //       sessiondetails: {
    // //         $filter: {
    // //           input: '$sessiondetails',
    // //           as: 'item',
    // // //           cond:
    // // //                 {
    // // //                   $and:[
    // // // //                   { $eq: ['$$item.exercisename' , exercisename] },
    // // //                 //   { $eq: ['$$item.orientation' , orientation] }
				// // // // 	  { $eq: ['$$item.musclename' , musclename] },
				// // // // 	  { $eq: ['$$item.bodyorientation' , bodyorientation] },
    // // // //                   { $eq: ['$$item.bodypart' , joint] },
    // //                 //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
    // // //                   ]  
    // // //                 } 
    // //         }
    //       }
    //     }
    //   }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = "no_session";
        }
        }
        catch (error) {
  last_session = "no_session";
}
    });

    return last_session;
};

exports.session_summary_health_db = async function (phizioemail,patientId,orientation,bodypart,bodyorientation,exercisename,musclename) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientId} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] },
					  { $eq: ['$$item.musclename' , musclename] },
					  { $eq: ['$$item.bodyorientation' , bodyorientation] },
                      { $eq: ['$$item.bodypart' , bodypart] },
                    //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        try{
        
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = "no_session";
        }
        }
        catch (error) {
  last_session = "no_session";
}
    });

    return last_session;
};


// Extra Api For Data

exports.lastSessionBased = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10)) 

{
    let last_session="";
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] },
					  { $eq: ['$$item.musclename' , musclename] },
					  { $eq: ['$$item.bodyorientation' , bodyorientation] },
                      { $eq: ['$$item.bodypart' , joint] },
                    //   { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{

        last_session = docs[0].sessiondetails;
        // if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
        //     last_session = docs[0].sessiondetails;
        // }
        // else{
        //     last_session = 0;
        // }
    });

    return last_session;
};


exports.lastSessionBasedOnExerciseAndJointAndOrientationdata = async function (phizioemail,patientid, joint, exercisename,orientation,musclename,bodyorientation,date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10)) 

{
    let last_session=0;
  await dbPatientSessionDataModel
     .aggregate([
      { $match: {phizioemail:phizioemail, patientid:patientid} },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond:
                    {
                      $and:[
                      { $eq: ['$$item.exercisename' , exercisename] },
                      { $eq: ['$$item.orientation' , orientation] },
					  { $eq: ['$$item.musclename' , musclename] },
					  { $eq: ['$$item.bodyorientation' , bodyorientation] },
                      { $eq: ['$$item.bodypart' , joint] },
                      { $lt: [{ $substrBytes: ['$$item.heldon', 0, 10] }, date]}
                      ]  
                    } 
            }
          }
        }
      }
    ]).then((docs)=>{
        if (typeof docs !== 'undefined' && docs[0].sessiondetails.length > 0) {
            last_session = docs[0].sessiondetails;
        }
        else{
            last_session = 0;
        }
    });

    return last_session;
};
// Helper function for MonthlyReport
const getPreviousMonth = (date)=>{ 
    let [year,month,date_value] = date.split("-",3);  
    let presentDate = new Date(year+"/"+ month +"/"+date_value);   
    let dateBeforeOneMonth = new Date();    
    dateBeforeOneMonth.setDate(presentDate.getDate());
    dateBeforeOneMonth.setMonth(presentDate.getMonth()-1); 
    // database uses two digit month format i.e 01 instaed of 1
    let twoDigitMonth = (dateBeforeOneMonth.getMonth()+1 < 10) ? `0${dateBeforeOneMonth.getMonth()+1}` : `${dateBeforeOneMonth.getMonth()+1}`  
    return(dateBeforeOneMonth.getFullYear()+"-"+twoDigitMonth)

}
// Helper function for MonthlyReport
const filterByMonth = (unFilteredDocs,date)=>{ 

    let [year,month,date_value] = date.split("-",3);  
    let presentDate = new Date(year+"/"+ month +"/"+date_value);  
    let dateBeforeOneMonth = new Date();    
    dateBeforeOneMonth.setDate(presentDate.getDate());
    dateBeforeOneMonth.setMonth(presentDate.getMonth()-1);
    unFilteredDocs[0].sessiondetails.filter((item)=>{
        [year,month,date_value]= item.heldon.substr(0,10).split('-',3)
        let dateOfItem = new Date(year+"/"+ month +"/"+date_value);
        return(dateOfItem<=presentDate && dateOfItem>dateBeforeOneMonth)
    })
  
    return(unFilteredDocs);
}
exports.MonthlyReport = async function (
  phizioemail,
  patientid,
  date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10),
) {
  

  let MonthlyReports;
  let dateCurrentMonth = date.slice(0, -3);
  let datePreviousMonth =getPreviousMonth(date);
  await dbPatientSessionDataModel
    .aggregate([
      { $match: { phizioemail, patientid } },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond: { $or: [
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 7] }, dateCurrentMonth]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 7] }, datePreviousMonth]  }
              ] }
            },
          },
        },
      },
    ]).then((unFilteredDocs)=>{
        
        let FilteredDocs = filterByMonth(unFilteredDocs,date);        
        return(FilteredDocs);
    })
    .then((docs) => {
     
      if (typeof docs !== 'undefined' && docs.length > 0) {
        MonthlyReports = docs;
      } else {
        MonthlyReports = 'there are no reports for today';
      }
      MonthlyReports;
    });
  return MonthlyReports;
};

// Helper function for WeeklyReport
const getWeekDates = (date)=>{ 
    let arrayOfDates =[];
    let [year,month,date_value] = date.split("-",3);  
    let presentDate = new Date(year+"/"+ month +"/"+date_value);
    for(let i =0;i<7;i++){
        let twoDigitMonth = (presentDate.getMonth()+1 < 10) ? `0${presentDate.getMonth()+1}` : `${presentDate.getMonth()+1}`  
        let twoDigitDate = (presentDate.getDate() < 10) ? `0${presentDate.getDate()}` : `${presentDate.getDate()}`  
        let dateString = presentDate.getFullYear()+"-"+twoDigitMonth+"-"+twoDigitDate
        arrayOfDates.push(dateString)        
        presentDate.setDate(presentDate.getDate()-1);       
    } 
 
    return(arrayOfDates)

}
exports.WeeklyReport = async function (
  phizioemail,
  patientid,
  date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10),
) {
  
  let WeeklyReports;

  let datesOfWeek =getWeekDates(date);

  await dbPatientSessionDataModel
    .aggregate([
      { $match: { phizioemail, patientid } },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond: { $or: [
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, datesOfWeek[0] ]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, datesOfWeek[1] ]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, datesOfWeek[2] ]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, datesOfWeek[3] ]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, datesOfWeek[4] ]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, datesOfWeek[5] ]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, datesOfWeek[6] ]  },
              ] }
            },
          },
        },
      },
    ])
    .then((docs) => {
     
      if (typeof docs !== 'undefined' && docs.length > 0) {
        WeeklyReports = docs;
      } else {
        WeeklyReports = 'there are no reports for today';
      }
      WeeklyReports = docs;
    });
  return WeeklyReports;
};

exports.overallReport = async function (
  phizioemail,
  patientid,
  date = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .slice(0, 10),
) {
  
  let overallReport;

  await dbPatientSessionDataModel
    .aggregate([
      { $match: { phizioemail, patientid } },
      {
        $project: {
          sessiondetails: {
            $filter: {
              input: '$sessiondetails',
              as: 'item',
              cond: { $or: [
                {$lt:[{ $substrBytes: ['$$item.heldon', 0, 10] }, date ]  },
                {$eq:[{ $substrBytes: ['$$item.heldon', 0, 10] }, date ]  }
              ] }
            },
          },
        },
      },
    ])
    .then((docs) => {
     
      if (typeof docs !== 'undefined' && docs.length > 0) {
        overallReport = docs;
      } else {
        overallReport = 'there are no reports for today';
      }
      overallReport = docs;
    });
  return overallReport;
};

exports.getsession_report_count = async function (
  phizioemail
) {
  
  let result;

  await dbPatientSessionDataModel
    .find({'phizioemail':phizioemail})
    .then((docs) => {
     
      if (typeof docs !== 'undefined' && docs.length > 0) {
        result = docs;
      } else {
        result = 'there are no reports for today';
      }
      result = docs;
    });
  return result;
};


exports.getsession_report_count_ind = async function (
  phizioemail,
  patientid
) {
  
  let result;

  await dbPatientSessionDataModel
    .find({'phizioemail':phizioemail , 'patientid' : patientid })
    .then((docs) => {
     
      if (typeof docs !== 'undefined' && docs.length > 0) {
        result = docs;
      } else {
        result = 'there are no reports for today';
      }
      result = docs;
    });
  return result;
};


exports.getsession_report_count_ind_testing = async function (
  phizioemail,
) {
  
  let result;

  await dbPatientSessionDataModel
    .find({'phizioemail':phizioemail})
    .then((docs) => {
     
      if (typeof docs !== 'undefined' && docs.length > 0) {
        result = docs;
      } else {
        result = 'there are no reports for today';
      }
      result = docs;
    });
  return result;
};

/* 
*  By Ravi Ranjan
*  
*
*  The functions from this point onwords are for data dashboard for internal
*  requirements.
*/


/*
 * This function applies aggregation on multiple models and returns data based on the time range 
 *
 * @method getOverallHomepage
 * @params query (non-functional)
 * @returns the following object in which the details are quite self descriptive 
 *  {
 *      totalDevicesSold,
 *      totalUsers,
 *      totalPatients,
 *      totalSessions,
 *      totalReports,
 *      dataByWeek,
 *      dataByMonth,
 *      dataByFiveMonths,
 *      dataByOneYear,
 *      dataByFiveYear,
 *      reportDataByWeek,
 *      reportDataByMonth,
 *      reportDataByFiveMonths,
 *      reportDataByOneYear,
 *      reportDataByFiveYear
 *  }
 */
exports.getOverallHomepage = async (query) => {

    var today = new Date();
    var start = today
    var sevenDays = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);
    var thirtyDays = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    var fiveMonths = new Date(today.getTime() - 5 * 30 * 24 * 60 * 60 * 1000);
    var oneYear = new Date(today.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    var fiveYear = new Date(today.getTime() - 5 * 12 * 30 * 24 * 60 * 60 * 1000);

    // Returns total devices present in the database
    let totalDevicesSold = await dbDeviceHealthStatusDataModel.find({ status: { $eq: true } }).countDocuments();
    
    // Returns total users present in the database
    let totalUsers = await phizioUsersModel.find({}).countDocuments();
    
    // Total Patients and Total Sessions
    let totalPatients = 0, totalSessions = 0;
    await (await phizioUsersModel.find({})).forEach(function (doc) {
        totalPatients += doc.phiziopatients.length;
    })

    await (await dbPatientSessionDataModel.find({})).forEach(function (doc) {
        totalSessions += doc.sessiondetails.length;
    })
    
    // Total Reports Generated
    let totalReports = await dbReportDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: null,
                numberOfReports: {
                    $sum: 1
                }
            }
        },
    ])

    let dataByWeek = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                numberOfPatients: {
                    $size: "$patients"
                },
                numberOfUsers: {
                    $size: "$users"
                }
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": sevenDays
                }
            }
        }
    ])
    let dataByMonth = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": thirtyDays
                }
            }
        }
    ])
    let dataByFiveMonths = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": fiveMonths
                }
            }
        }
    ])
    let dataByOneYear = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": oneYear
                }
            }
        }
    ])
    let dataByFiveYear = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": fiveYear
                }
            }
        }
    ])

    let reportDataByWeek = await dbReportDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$sessiondetails.date",
                numberOfReports: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfReports: 1,
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": sevenDays
                }
            }
        }
    ])
    let reportDataByMonth = await dbReportDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$sessiondetails.date",
                numberOfReports: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfReports: 1,
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": thirtyDays
                }
            }
        }
    ])
    let reportDataByFiveMonths = await dbReportDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$sessiondetails.date",
                numberOfReports: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfReports: 1,
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": fiveMonths
                }
            }
        }
    ])
    let reportDataByOneYear = await dbReportDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$sessiondetails.date",
                numberOfReports: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfReports: 1,
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": oneYear
                }
            }
        }
    ])
    let reportDataByFiveYear = await dbReportDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$sessiondetails.date",
                numberOfReports: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfReports: 1,
            }
        },
        {
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": fiveYear
                }
            }
        }
    ])


    return {
        totalDevicesSold,
        totalUsers,
        totalPatients,
        totalSessions,
        totalReports,
        dataByWeek,
        dataByMonth,
        dataByFiveMonths,
        dataByOneYear,
        dataByFiveYear,
        reportDataByWeek,
        reportDataByMonth,
        reportDataByFiveMonths,
        reportDataByOneYear,
        reportDataByFiveYear
    }
}


/*
 * This method returns an array containing all the devices' last updated health info 
 *
 * @method getDeiceActivitySummary
 * @params none
 * @returns An array containing the device uid and last updated health information
 */
exports.getDeviceActivitySummary = async () => {
    let recentDeviceHealthData = await dbDeviceHealthStatusDataModel.aggregate([
        {
            $project: {
                uid: "$uid",
                lastHealthArrayElement: {
                    $slice: ["$health", -1]
                }
            },
        },
        {
            $unwind: "$lastHealthArrayElement"
        }
    ])

    return {
        recentDeviceHealthData
    }
}


/*
 * This function applies aggregation on phizioUsersModel and returns an array 
 * containing number of Patients joined based on date 
 * 
 * @method getPatientSummaryDayWise
 * @params none
 * @returns an array containing number of patients joined in reverse order day wise
 */
exports.getPatientSummaryDayWise = async () => {
    return await phizioUsersModel.aggregate([
        {
            $unwind: "$phiziopatients"
        },
        {
            $project: {
                "name": "$phiziopatients.patientname",
                "joinedOn": "$phiziopatients.dateofjoin",
            }
        },
        {
            $group: {
                _id: "$joinedOn",
                numberOfPatients: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                _id: -1
            }
        }
    ])
}



/*
 * This method applies aggregation on different models and returns an array containing 
 * details of the users with max number of patients and sessions based on the time range defined
 *
 * @method getTopUsers
 * @params none
 * @returns an object containing different details as shown below
 * {
 *      usersWithUID,
 *      usersWithPatients,
 *      usersWithSessions,
 *      usersWithSessionsandPatientsByWeek,
 *      usersWithSessionsandPatientsByMonth,
 *      usersWithSessionsandPatientsByFiveMonths,
 *      usersWithSessionsandPatientsByOneYear,
 *      usersWithSessionsandPatientsByFiveYears
 * }
 */
exports.getTopUsers = async () => {
    var today = new Date();
    var start = today
    var sevenDays = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);
    var thirtyDays = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    var fiveMonths = new Date(today.getTime() - 5 * 30 * 24 * 60 * 60 * 1000);
    var oneYear = new Date(today.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    var fiveYear = new Date(today.getTime() - 5 * 12 * 30 * 24 * 60 * 60 * 1000);
    console.log(start, fiveYear)
    let usersWithUID = [];
    (await dbDeviceHealthStatusDataModel.aggregate([
        {
            $unwind: "$phizioemails"
        },
        {
            $group: {
                _id: {
                    uid: "$uid",
                    phizioemail: "$phizioemails.phizioemail"
                },
            }
        }
    ])).map((e, i) => {
        usersWithUID.push(e._id)
    })
    let usersWithPatients = await phizioUsersModel.aggregate([
        {
            $project: {
                phizioname: 1,
                phizioemail: 1,
                clinicname: 1,
                numberOfPatients: {
                    $size: "$phiziopatients"
                }
            }
        },
        {
            $sort: {
                numberOfPatients: -1
            }
        }
    ])

    let usersWithSessions = await dbPatientSessionDataModel.aggregate([
        {
            $group: {
                _id: "$phizioemail",
                numberOfSessions: {
                    $sum: {
                        $size: "$sessiondetails"
                    }
                }
            },
        },
        // {
        //     $sort: {
        //         numberOfSessions: -1
        //     }
        // }
    ])

    let usersWithSessionsandPatientsByWeek = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                timestamp: {
                    $cond: {
                        if: { $ne: ["$sessiondetails.heldon", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$sessiondetails.heldon"
                            }
                        },
                        else: {

                        }
                    }
                }
            }
        },

        {
            $match: {
                timestamp: {
                    "$lte": start,
                    "$gte": sevenDays
                }
            }
        },
        {
            $group: {
                _id: "$phizioemail",
                numberOfSessions: {
                    $sum: 1
                },
                numberOfPatients: {
                    $addToSet: "$patientid"
                }
            }
        },
    ])
    let usersWithSessionsandPatientsByMonth = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                timestamp: {
                    $cond: {
                        if: { $ne: ["$sessiondetails.heldon", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$sessiondetails.heldon"
                            }
                        },
                        else: {

                        }
                    }
                }
            }
        },

        {
            $match: {
                timestamp: {
                    "$lte": start,
                    "$gte": thirtyDays
                }
            }
        },
        {
            $group: {
                _id: "$phizioemail",
                numberOfSessions: {
                    $sum: 1
                },
                numberOfPatients: {
                    $addToSet: "$patientid"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1,
            }
        }
    ])
    let usersWithSessionsandPatientsByFiveMonths = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                timestamp: {
                    $cond: {
                        if: { $ne: ["$sessiondetails.heldon", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$sessiondetails.heldon"
                            }
                        },
                        else: {

                        }
                    }
                }
            }
        },

        {
            $match: {
                timestamp: {
                    "$lte": start,
                    "$gte": fiveMonths
                }
            }
        },
        {
            $group: {
                _id: "$phizioemail",
                numberOfSessions: {
                    $sum: 1
                },
                numberOfPatients: {
                    $addToSet: "$patientid"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1,
            }
        }
    ])
    let usersWithSessionsandPatientsByOneYear = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                timestamp: {
                    $cond: {
                        if: { $ne: ["$sessiondetails.heldon", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$sessiondetails.heldon"
                            }
                        },
                        else: {

                        }
                    }
                }
            }
        },

        {
            $match: {
                timestamp: {
                    "$lte": start,
                    "$gte": oneYear
                }
            }
        },
        {
            $group: {
                _id: "$phizioemail",
                numberOfSessions: {
                    $sum: 1
                },
                numberOfPatients: {
                    $addToSet: "$patientid"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1,
            }
        }
    ])
    let usersWithSessionsandPatientsByFiveYears = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                timestamp: {
                    $cond: {
                        if: { $ne: ["$sessiondetails.heldon", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$sessiondetails.heldon"
                            }
                        },
                        else: {

                        }
                    }
                }
            }
        },

        {
            $match: {
                timestamp: {
                    "$lte": start,
                    "$gte": fiveYear
                }
            }
        },
        {
            $group: {
                _id: "$phizioemail",
                numberOfSessions: {
                    $sum: 1
                },
                numberOfPatients: {
                    $addToSet: "$patientid"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1,
            }
        }
    ])

    // console.log(usersWithSessionsandPatientsByFiveMonths[0])
    return {
        usersWithUID,
        usersWithPatients,
        usersWithSessions,
        usersWithSessionsandPatientsByWeek,
        usersWithSessionsandPatientsByMonth,
        usersWithSessionsandPatientsByFiveMonths,
        usersWithSessionsandPatientsByOneYear,
        usersWithSessionsandPatientsByFiveYears
    };
}


/*
 * This method applies aggregation on the devicehealthdatas collection and 
 * returns an array of time stamps on which the device were active.
 * 
 * @method getDailyDeviceActivity
 * @params none
 * @returns An array containing the time stamps on which the device were active
 */
exports.getDailyDeviceActivity = async () => {
    return await dbDeviceHealthStatusDataModel.aggregate([
        {
            $unwind: "$health"
        },
        {
            $group: {
                _id: '$uid',
                timeStamps: {
                    $addToSet: {
                        $substr: ['$health.time_stamp', 0, 10]
                    }
                }
            }
        },
        {
            $unwind: "$timeStamps"
        },
    ])
}



/*
 * This function returns top accounts based on the time range defined 
 * 
 * @method getTopAccounts
 * @params none
 * @returns an object containing top accounts details based on the time range as shown below
 *          { overAllTopUsers, topUsersByWeek, topUsersByMonth, topUsersByFiveMonths, topUsersByOneYear, topUsersByFiveYear }
 */
exports.getTopAccounts = async () => {
    var today = new Date();
    var start = today
    var sevenDays = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);
    var thirtyDays = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    var fiveMonths = new Date(today.getTime() - 5 * 30 * 24 * 60 * 60 * 1000);
    var oneYear = new Date(today.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    var fiveYear = new Date(today.getTime() - 5 * 12 * 30 * 24 * 60 * 60 * 1000);


    let clinicWithNumberOfDevices = await dbDeviceHealthStatusDataModel.aggregate([
        {
            $unwind: "$phizioemails"
        },
        {
            $lookup: {
                from: 'phiziousers',
                localField: 'phizioemails.phizioemail',
                foreignField: 'phizioemail',
                as: 'usersData'
            }
        },
        {
            $unwind: "$usersData"
        },
        {
            $project: {
                uid: 1,
                clinicname: "$usersData.clinicname"
            }
        },
        {
            $group: {
                _id: "$clinicname",
                numberOfDevices: {
                    $addToSet: "$uid"
                }
            }
        },
        {
            $project: {
                numberOfDevices: {
                    $size: "$numberOfDevices"
                }
            }
        }
    ])

    let clinicWithNumberOfPatients = await phizioUsersModel.aggregate([
        {
            $project: {
                clinicname: 1,
                phizioemail: 1,
                noOfPatients: {
                    $size: "$phiziopatients"
                }
            }
        },
        {
            $group: {
                _id: "$clinicname",
                numberOfPatients: {
                    $sum: "$noOfPatients"
                },
                numberOfUsers: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                numberOfPatients: 1,
                numberOfUsers: {
                    $size: "$numberOfUsers"
                }
            }
        }
    ])

    let clinicWithNumberOfSessions = await dbPatientSessionDataModel.aggregate([
        {
            $lookup: {
                from: 'phiziousers',
                localField: 'phizioemail',
                foreignField: 'phizioemail',
                as: 'usersData'
            }
        },
        {
            $unwind: "$usersData"
        },
        {
            $project: {
                clinicname: "$usersData.clinicname",
                noOfSessions: {
                    $size: "$sessiondetails"
                }
            }
        },
        {
            $group: {
                _id: "$clinicname",
                numberOfSessions: {
                    $sum: "$noOfSessions"
                }
            }
        }
    ])

    let overAllTopUsers = []
    clinicWithNumberOfDevices.map((e) => {
        clinicWithNumberOfPatients.map((el) => {
            clinicWithNumberOfSessions.map((ele) => {
                if (e._id == el._id && el._id == ele._id && ele._id == e._id) {
                    overAllTopUsers.push({
                        clinicname: e._id,
                        numberOfDevices: e.numberOfDevices,
                        numberOfPatients: el.numberOfPatients,
                        numberOfSessions: ele.numberOfSessions,
                        numberOfUsers: el.numberOfUsers
                    })
                }
            })
        })
    })

    overAllTopUsers = overAllTopUsers.sort((a, b) => (b.numberOfSessions - a.numberOfSessions));

    let topUsersByWeek = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $lookup: {
                from: 'phiziousers',
                localField: 'phizioemail',
                foreignField: 'phizioemail',
                as: 'usersData'
            }
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                date: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                clinicname: "$usersData.clinicname"
            }
        },
        {
            $unwind: "$clinicname"
        },
        {
            $group: {
                _id: {
                    date: "$date",
                    clinicname: "$clinicname"
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id.date", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id.date"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": sevenDays
                }
            }
        },
        {
            $group: {
                _id: "$_id.clinicname",
                numberOfSessions: {
                    $sum: "$numberOfSessions"
                },
                users: {
                    $addToSet: "$users"
                },
                patients: {
                    $addToSet: "$patients"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1
            }
        }
    ])
    let topUsersByMonth = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $lookup: {
                from: 'phiziousers',
                localField: 'phizioemail',
                foreignField: 'phizioemail',
                as: 'usersData'
            }
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                date: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                clinicname: "$usersData.clinicname"
            }
        },
        {
            $unwind: "$clinicname"
        },
        {
            $group: {
                _id: {
                    date: "$date",
                    clinicname: "$clinicname"
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id.date", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id.date"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": thirtyDays
                }
            }
        },
        {
            $group: {
                _id: "$_id.clinicname",
                numberOfSessions: {
                    $sum: "$numberOfSessions"
                },
                users: {
                    $addToSet: "$users"
                },
                patients: {
                    $addToSet: "$patients"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1
            }
        }
    ])
    let topUsersByFiveMonths = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $lookup: {
                from: 'phiziousers',
                localField: 'phizioemail',
                foreignField: 'phizioemail',
                as: 'usersData'
            }
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                date: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                clinicname: "$usersData.clinicname"
            }
        },
        {
            $unwind: "$clinicname"
        },
        {
            $group: {
                _id: {
                    date: "$date",
                    clinicname: "$clinicname"
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id.date", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id.date"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": fiveMonths
                }
            }
        },
        {
            $group: {
                _id: "$_id.clinicname",
                numberOfSessions: {
                    $sum: "$numberOfSessions"
                },
                users: {
                    $addToSet: "$users"
                },
                patients: {
                    $addToSet: "$patients"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1
            }
        }
    ])
    let topUsersByOneYear = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $lookup: {
                from: 'phiziousers',
                localField: 'phizioemail',
                foreignField: 'phizioemail',
                as: 'usersData'
            }
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                date: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                clinicname: "$usersData.clinicname"
            }
        },
        {
            $unwind: "$clinicname"
        },
        {
            $group: {
                _id: {
                    date: "$date",
                    clinicname: "$clinicname"
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id.date", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id.date"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": oneYear
                }
            }
        },
        {
            $group: {
                _id: "$_id.clinicname",
                numberOfSessions: {
                    $sum: "$numberOfSessions"
                },
                users: {
                    $addToSet: "$users"
                },
                patients: {
                    $addToSet: "$patients"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1
            }
        }
    ])
    let topUsersByFiveYear = await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $lookup: {
                from: 'phiziousers',
                localField: 'phizioemail',
                foreignField: 'phizioemail',
                as: 'usersData'
            }
        },
        {
            $project: {
                phizioemail: 1,
                patientid: 1,
                date: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                clinicname: "$usersData.clinicname"
            }
        },
        {
            $unwind: "$clinicname"
        },
        {
            $group: {
                _id: {
                    date: "$date",
                    clinicname: "$clinicname"
                },
                numberOfSessions: {
                    $sum: 1
                },
                patients: {
                    $addToSet: "$patientid"
                },
                users: {
                    $addToSet: "$phizioemail"
                }
            }
        },
        {
            $project: {
                date: {
                    $cond: {
                        if: { $ne: ["$_id.date", ""] },
                        then: {
                            $dateFromString: {
                                dateString: "$_id.date"
                            }
                        },
                        else: {

                        }
                    }
                },
                numberOfSessions: 1,
                patients: 1,
                users: 1
            }
        },
        {
            $match: {
                date: {
                    "$lte": start,
                    "$gte": fiveYear
                }
            }
        },
        {
            $group: {
                _id: "$_id.clinicname",
                numberOfSessions: {
                    $sum: "$numberOfSessions"
                },
                users: {
                    $addToSet: "$users"
                },
                patients: {
                    $addToSet: "$patients"
                }
            }
        },
        {
            $sort: {
                numberOfSessions: -1
            }
        }
    ])
    // console.log(topUsersByOneYear[0])
    return { overAllTopUsers, topUsersByWeek, topUsersByMonth, topUsersByFiveMonths, topUsersByOneYear, topUsersByFiveYear }
}

exports.getDeviceDetails = async () => {
    return await dbDeviceHealthStatusDataModel.aggregate([
        {
            $unwind: "$health"
        },
        {
            $unwind: "$phizioemails"
        },
        {
            $project: {
                uid: 1,
                mac: 1,
                hardware_version: 1,
                atiny_version: 1,
                firmware_version: 1,
                serial_version: 1,
                time_stamp: {
                    $substr: ['$health.time_stamp', 0, 10]
                },
                health_status: '$health',
                phizioemail: '$phizioemails.phizioemail'
            }
        },
        {
            $group: {
                _id: '$uid',
                deviceActivity: {
                    $addToSet: '$time_stamp'
                },
                users: {
                    $addToSet: '$phizioemail'
                },
                doc: {
                    $last: '$$ROOT'
                }
            }
        }
    ])
}


// For Users Page

exports.getAllSessionTimeStamp = async () => {
    return await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: null,
                timeStamps: {
                    $addToSet: "$sessiondetails.heldon"
                }
            }
        }
    ])
}

exports.getDataFromSessionData = async () => {
    return await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$phizioemail",
                timestamps: {
                    $push: {
                        $substr: ["$sessiondetails.heldon", 0, 10]
                    }
                },
                patients: {
                    $addToSet: "$patientid"
                },
                numberOfSessions: {
                    $sum: 1
                },
                sessiontimes: {
                    $addToSet: "$sessiondetails.sessiontime"
                }
            }
        }
    ])
}

exports.getDataFromSession = async () => {
    return await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$phizioemail",
                // timestamps: {
                //     $push: {
                //         $substr: ["$sessiondetails.heldon", 0, 10]
                //     }
                // },
                // patients: {
                //     $addToSet: "$patientid"
                // },
                numberOfSessions: {
                    $sum: 1
                },
                sessiontimes: {
                    $addToSet: "$sessiondetails"
                }
            }
        }
     
    ])
}

exports.getDataFromSessionAll = async () => {
    return await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: "$phizioemail",
                // timestamps: {
                //     $push: {
                //         $substr: ["$sessiondetails.heldon", 0, 10]
                //     }
                // },
                // patients: {
                //     $addToSet: "$patientid"
                // },
                numberOfSessions: {
                    $sum: 1
                },
                sessiontimes: {
                    $addToSet: "$sessiondetails"
                }
            }
        }
    ])
}

exports.getUsersData = async () => {
    return await phizioUsersModel.aggregate([
        {
            $project: {
                phizioemail: 1,
                phizioname: 1,
                app_version: 1,
                phiziophone:1,
                phiziopassword:1,
                phiziopatients: 1,
                phizioprofilepicurl: 1,
                address: 1,
                
                // numberOfPatients: {
                //     $size: "$phiziopatients"
                // }
                
            }
        }
    ])
}

exports.getnewreportdata = async () => {
    return await phizioUsersModel.aggregate([
        {
            $project: {
                phizioemail: 1,
                // numberOfPatients: {
                //     $size: "$phiziopatients"
                // }
                
            }
        }
    ])
}

exports.getDeviceDataByUsers = async () => {
    return await dbDeviceHealthStatusDataModel.aggregate([
        {
            $unwind: "$phizioemails",
        },
        {
            $group: {
                _id: "$phizioemails.phizioemail",
                devices: {
                    $addToSet: {
                        uid: "$uid",
                        mac: "$mac"
                    }
                }
            }
        }
    ])
}

exports.getDeviceDataByUsersData = async () => {
    return await dbDeviceHealthStatusDataModel.aggregate([
        {
            $unwind: "$phizioemails"
        },
        {
            $group: {
                _id: "$phizioemails.phizioemail",
                mac: "$mac.mac"
            }
        }
    ])
}

exports.getAllPhizioUsersDetails = async () => {
    return await phizioUsersModel.find({});
    
}

exports.getAllPatientSessionDetails = async () => {
    return await dbPatientSessionDataModel.find({});
}


exports.getAllDeviceDetails = async () => {
    return await dbDeviceHealthStatusDataModel.find({});
}

exports.getSessionDetailsByUserID = async () => {
    return await dbPatientSessionDataModel.aggregate([
        {
            $group: {
                _id: "$phizioemail",
                numberOfPatientSessions: {
                    $sum: {
                        $size: "$sessiondetails"
                    }
                },
            },

        },
    ])
}

exports.getSessionDetailsByClinic = async () => {

    return await phizioUsersModel.aggregate([
        {
            $lookup: {
                from: "patientsessiondatas",
                localField: "phizioemail",
                foreignField: "phizioemail",
                as: "patientSessionData"
            },
        },
        {
            $unwind: "$patientSessionData"
        }, {
            $group: {
                _id: "$clinicname",
                numberOfPatientSessions: {
                    $sum: {
                        $size: "$patientSessionData.sessiondetails"
                    }
                }
            }
        }
    ])
}

exports.getSessionDetailsByDate = async () => {
    return await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $group: {
                _id: {
                    $substr: ["$sessiondetails.heldon", 0, 10]
                },
                numberOfPatientSessions: {
                    $sum: 1
                }
            }
        }
    ])
}

exports.numberOfActiveDevicesByMonth = async () => {
    return await dbDeviceHealthStatusDataModel.aggregate([
        {
            $lookup: {
                from: 'devicelocaationdatas',
                localField: 'uid',
                foreignField: 'uid',
                as: 'deviceLocationData'
            },
        },
        {
            $unwind: "$deviceLocationData"
        },
        {
            $group: {
                _id: {
                    $substr: ["$deviceLocationData.time_stamp", 0, 7]
                },
                numberOfActiveDevices: {
                    $sum: 1
                }
            }
        }
    ])
}

exports.getDailyDeviceActivityByUsers = async () => {
    return await dbPatientSessionDataModel.aggregate([
        {
            $unwind: "$sessiondetails"
        },
        {
            $project: {
                phizioemail: "$phizioemail",
                patientSessionDate: "$sessiondetails.heldon"
            }
        },
        {
            $group: {
                _id: {
                    $substr: ["$patientSessionDate", 0, 10]
                },
                phizioUsers: {
                    $addToSet: "$phizioemail"
                }
            }
        }
    ])
}

exports.getPatientNumber = async() => {
    const response = await phizioUsersModel.aggregate([{
            $project: {
                phizioemail: 1,
                phiziopatients: {
                    $size: '$phiziopatients'
                }
            }
        }])
        
    return response;
}


exports.getDeviceDataAllAtOnce = async() => {
    const response = dbDeviceHealthStatusDataModel.aggregate([{$project: {
                     uid: 1,
                     mac: 1,
                     phizioemails: 1,
                     phizioname: 1,
                     
                     noOfDaysActive: {
                      $size: '$health'
                     },
                     health: {
                      $arrayElemAt: [
                       '$health',
                       -1
                      ]
                     }
                    }}, {$project: {
                     uid: 1,
                     mac: 1,
                     noOfDaysActive: 1,
                     lastUsed: '$health.time_stamp',
                     phizioemails: '$phizioemails.phizioemail',
                    }}])
                    
    
    return response;
}

exports.getReportData = async() => {
    const response = dbReportDataModel.aggregate([{$project: {
                 phizioemail: 1,
                //  sessionreport: {
                //   $size: '$sessiondetails'
                //  },
                //  overallreport: {
                //   $size: '$overalldetails'
                //  }
                sessiondetails: 1,
                overalldetails: 1
                }}])
    return response;
}

exports.createDeviceRecord = async(data) => {
    const response = await dbDeviceDataModel.create(data);
    console.log(response);
    return response;
}

// exports.createDeviceRecord = async(data) => {
//     const response = await dbCalbrationModel.create(data);
//     console.log(response);
//     return response;
// }

exports.updateDeviceRecord = async(data) => {
    const response = await dbDeviceDataModel.updateOne({macId: data.macId}, {$set: {status: data.status}});
    return response;
}

exports.kranthi = async() => {
    return await dbDeviceDataModel.find({});
}


exports.database = async() => {
    return await phizioUsersModel.find({});
}

exports.session = async() =>{
    return await dbPatientSessionDataModel.find({});
}

exports.phiziousers = async() =>{
    return await phizioUsersModel.find({});
}

exports.reportdatas = async() =>{
    return await dbReportDataModel.find({});
}

exports.health = async() => {
    return await dbDeviceHealthStatusDataModel.find({});
}

exports.calbration = async() => {
    return await dbCalbrationModel.find({});
}

exports.deviceLocation = async() =>{
    return await dbDeviceLocationStatusModel.find({});
    
}
exports.sessiondata = async() => {
   
   let response = await dbReportDataModel.aggregate([{$project: {
                 
    phizioemail:1,
   
    sessiondetails:1,
   
 
                 }}])
     return response;
 }
 


//  Session Data Isometic
exports.getinfostatus = async () => {

    const response = dbPatientSessionDataModel.aggregate([{$project: {
                 
   phizioemail:1,
   patientid:1,
   items:{

    $filter:{
        input:"$sessiondetails",
        as: "item",
        cond:{
            // $eq:["$$item.bodypart","Knee"]
        }
    }
   }
  

                }}])
    return response;
}

exports.kranthi_data_k = async () => {

    const response = dbPatientSessionDataModel.aggregate([{$project: {
                 
   phizioemail:1,
   patientid:1,
   sessiondetails:1,
//   items:{

//     $filter:{
//         input:"$sessiondetails",
//         as: "item",
//         cond:{
//             // $eq:["$$item.bodypart","Knee"]
//         }
//     }
//   }
  

                }}])
    return response;
}
