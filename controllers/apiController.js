const fs  = require('fs');
const express = require('express');
const DEFAULT_PACKAGE_ID = 4;
const SUCCESSFULL_HTTP_RESPONSE = 200;
const UNSUCCESSFULL_HTTP_RESPONSE = 400;
const PATIENT_DEFAULT_LIMIT_SIZE = 200;
let Debug = true;
let {PythonShell} = require('python-shell');
/**
*Nodemailer module is used to send emails via sftp. This module is currently used in the application to send verification mails.
*@module nodemailer
*/
const nodemailer = require('nodemailer');
/**
*puppeteer module is used to convert html content to pdf. 
*@module puppeteer
*/
const puppeteer = require('puppeteer');

const router = express.Router();
/**
*mqtt module is used for server application transfer protocol. It has some callback functions like the on.("connect"), on.("message"). 
*@module mqtt
*/
const mqtt = require('mqtt');
/**
*aws-sdk module is currently being used to put and get objects to the s3 bucket.
*@module aws-sdk
*@sub-module mqtt.connect(url)
*/
const AWS = require('aws-sdk');
const PheezeeAPI = require('../lib/PheezeeAPI').getAPIInstance();
const DeviceHealthAPI = require('../lib/DeviceHealthAPI').getDeviceHealthAPIInstance();
const DeviceLocationAPI = require('../lib/DeviceLocationAPI').getDeviceLocationApiInstance();
const DevicePackageAPI = require('../lib/DevicePackageApis').getDevicePackageApis();
const db = require('../repo/db.js');


/**
 * Url of the localhost.
 *
 * @attribute url
 * @type {String} String url of the database.
 */
const URL = 'http://localhost:3000';

/**
 * Mqtt object that is returned after the connect call on mqtt.
 *
 * @attribute client
 * @type {Object} client object of mqtt after connection.
 */
//let client  = mqtt.connect("mqtt://13.127.78.38");
let client  = mqtt.connect("mqtt://");

//AWS CLIENT

// IAM keys for SES Resources only

let awsConfig = {
    "region": "ap-south-1",
    "accessKeyId": "AKIAW66NHBCFBX2PL24F", "secretAccessKey": "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"
};

AWS.config.update(awsConfig);

const ses = new AWS.SES();
/**
 * Setting the region of aws.
 *
 * @attribute AWS.config.region
 * @type {String} String region.
 */
AWS.config.region = 'ap-south-1';
/**
 * Contains the instance of the aws-s3
 *
 * @attribute s3Client
 * @type {Object} Access to S3 bucket .
 */
var s3Client = new AWS.S3({
        accessKeyId:'AKIAJKA2C2DLAESWCURA',
        secretAccessKey:'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'});


const add_patient_topic = "phizio/addpatient";
const entire_emg_data_topic = "patient/entireEmgData";
const mmt_data_topic = "phizio/patient/updateMmtGrade";
const delete_patient_topic = "phizio/patient/deletepatient/sesssion";

/*
exports.confirm_email = async function(req, res) {
    Debug && //////console.log(req.body);
    let data = req.body;
    let message = req.body;
    data = JSON.stringify(data);
    data = JSON.parse(data);
    const responceDb = await PheezeeAPI.checkPhizioAlreadyPresent(JSON.stringify(req.body));
    const response_packageid = await DevicePackageAPI.checkPackageIdPresentOrNot(JSON.stringify(req.body));
    if(responceDb=="false"){
        if(response_packageid==true || typeof data.packageid==='undefined'){
            const response_packageid_already = await PheezeeAPI.checkPhizioPackageIdAlreadyPresent(JSON.stringify(req.body));
            //////console.log(response_packageid_already);
            if(!response_packageid_already || typeof data.packageid==='undefined'){
                Debug && ////console.log(responceDb);
                let transporter = nodemailer.createTransport({
                    host: "smtp.zoho.com",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                      user: "pheezee@startoonlabs.com", // generated ethereal user
                      pass: "Pheezee@2019" // generated ethereal password
                    }
                });
                let output = `
                    <p>This is a request for email Confirmation</p>
                    <p>Please use <b>${data.otp}</b> as the otp to confirm your email for further authentication </p>
                    <br><p>Please do not reply to this email</p>`+
                    '<br><br><br><br><img src="cid:logo" alt="address" with="100" height="60"/>';

                  // send mail with defined transport object
                  let info = await transporter.sendMail({
                    from: '"Pheezee Official" <pheezee@startoonlabs.com>', // sender address
                    to: data.phizioemail, // list of receivers
                    subject: "Email Confirmation", // Subject line
                    text: "Please confirm your email", // plain text body
                    envelope: {
                        from: '"Pheezee Official" <pheezee@startoonlabs.com>', // used as MAIL FROM: address for SMTP
                        to: data.phizioemail // used as RCPT TO: address for SMTP
                    },
                    html: output, // html body,
                    attachments: [{
                    filename: 'pheezeelogo.png',
                    path: '/home/ubuntu/pheezeebackend/public/icons/pheezeelogo.png',
                    cid: 'logo' //my mistake was putting "cid:logo@cid" here! 
                    }]
                  }, (error,info)=>{
                        if(error){
                            res.status(SUCCESSFULL_HTTP_RESPONSE).send("nsent");
                            return ////console.log(error);
                        }
                        Debug && ////console.log("confirm/email/response"+data.phizioemail+data.phiziopassword);
                        res.status(SUCCESSFULL_HTTP_RESPONSE).send("sent");
                        Debug && ////console.log("Message sent: %s", info.messageId);
                        Debug && ////console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                  });
            }else{
                res.status(SUCCESSFULL_HTTP_RESPONSE).send("packagealready");
            }
        }else{
            res.status(SUCCESSFULL_HTTP_RESPONSE).send("invalidpackageid");
        }
    }else{
        res.status(SUCCESSFULL_HTTP_RESPONSE).send("already");
    }
};

*/

exports.confirm_email = async function(req, res) {
    // Debug && ////console.log(req.body);
    let data = req.body;
    let message = req.body;
    data = JSON.stringify(data);
    data = JSON.parse(data);
    const responceDb = await PheezeeAPI.checkPhizioAlreadyPresent(JSON.stringify(req.body));
    const response_packageid = await DevicePackageAPI.checkPackageIdPresentOrNot(JSON.stringify(req.body));
    if(responceDb=="false"){
        if(response_packageid==true || typeof data.packageid==='undefined'){
            const response_packageid_already = await PheezeeAPI.checkPhizioPackageIdAlreadyPresent(JSON.stringify(req.body));
            // ////console.log(response_packageid_already);
            if(!response_packageid_already || typeof data.packageid==='undefined'){
                // Debug && ////console.log(responceDb);

                // Start

                const params = {
  Destination: {
    ToAddresses: [data.phizioemail] // Email address/addresses that you want to send your email
  },
 
  Message: {
    Body: {
      Html: {
        // HTML Format of the email
        Charset: "UTF-8",
        Data:
          "<html><body><p>This is a request for email confirmation.</p><p>Please use <b>"+data.otp+"</b> as the OTP to confirm your email for further authentication </p><br><p>Please do not reply to this email</p></body></html>"
      },
      Text: {
        Charset: "UTF-8",
        Data: ""
      }
    },
    Subject: {
      Charset: "UTF-8",
      Data: "Email Confirmation"
    }
  },
  Source: '"Pheezee Official" <pheezee@startoonlabs.com>'
};





    const sendEmail = ses.sendEmail(params).promise();

    sendEmail
    .then(data => {
        // ////console.log("email submitted to SES", data);
        // Debug && ////console.log("confirm/email/response"+data.phizioemail+data.phiziopassword);
            res.status(SUCCESSFULL_HTTP_RESPONSE).send('sent');
    })
    .catch(error => {
        // ////console.log(error);
        res.status(SUCCESSFULL_HTTP_RESPONSE).send("nsent");
    });

            }else{
                res.status(SUCCESSFULL_HTTP_RESPONSE).send("packagealready");
            }
        }else{
            res.status(SUCCESSFULL_HTTP_RESPONSE).send("invalidpackageid");
        }
    }else{
        res.status(SUCCESSFULL_HTTP_RESPONSE).send("already");
    }
};





exports.signup_phizio = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // Debug && ////console.log(req.body);
    data = JSON.stringify(data);
    data = JSON.parse(data);
    let responceDb;
    if(typeof data.packageid=='undefined'){
        responceDb = await PheezeeAPI.addNewPhizioUser(JSON.stringify(req.body), DEFAULT_PACKAGE_ID);
        // Debug && ////console.log(responceDb);
        if(responceDb=='inserted'){
            res.status(SUCCESSFULL_HTTP_RESPONSE).send('inserted');
        }
        else if(responceDb=='not'){
             res.status(SUCCESSFULL_HTTP_RESPONSE).send('Something went wrong');
        }
        else{
             res.status(SUCCESSFULL_HTTP_RESPONSE).send('already');
        }
    }else{
        let package_type = await DevicePackageAPI.getPackageType(data.packageid);
        responceDb = await PheezeeAPI.addNewPhizioUser(JSON.stringify(req.body), package_type);
        if(responceDb=='inserted'){
            data.packagetype = package_type;
            data.inserted = true;
            res.status(SUCCESSFULL_HTTP_RESPONSE).send(data);
        }
        else if(responceDb=='not'){
             data.inserted = false;
             res.status(SUCCESSFULL_HTTP_RESPONSE).send(false);
        }
        else{
             data.inserted = false;
             res.status(SUCCESSFULL_HTTP_RESPONSE).send(false);
        }
    }
    
};

exports.login_phizio = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // Debug && ////console.log(message);
    let responceDb = await PheezeeAPI.getPhizioDetailsForLogin(JSON.stringify(req.body));
    //  Debug && ////console.log(responceDb);
    if(responceDb=='invalid'){
        responceDb = [{'isvalid':false}];
    }
    else{
        responceDb = JSON.stringify(responceDb);
        responceDb = JSON.parse(responceDb);
        responceDb[0]['isvalid'] = true;
		
		if(responceDb[0]['patientlimit']==0 || !('patientlimit' in responceDb[0]))
		{
			responceDb[0]['patientlimit']=PATIENT_DEFAULT_LIMIT_SIZE;
		}
		
    }
    // Debug && ////console.log(JSON.stringify(responceDb));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(responceDb));
    // ////console.log(responceDb);
    // Debug && ////console.log('login/phizio/response'+data.phizioemail+data.phiziopassword);
};

exports.get_phizio_package_type = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // Debug && ////console.log(message);
    let responceDb = await PheezeeAPI.getPhizioPackageType(JSON.stringify(req.body));
    // ////console.log(responceDb);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};


exports.update_phizio_package_type = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // Debug && ////console.log(message);
    let responceDb = await PheezeeAPI.updatePhizioPackageType(JSON.stringify(req.body));
    // ////console.log(responceDb);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

/*
exports.forgot_password = async function(req, res) {
    let data = req.body;
    let message = req.body;
    Debug && ////console.log(req.body);
    const responceDb = await PheezeeAPI.checkPhizioAlreadyPresent(JSON.stringify(req.body));
    Debug && ////console.log(responceDb);
    if(responceDb=="true"){
    let transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: "pheezee@startoonlabs.com", // generated ethereal user
          pass: "Pheezee@2019" // generated ethereal password
        }
    });




    let output = `
        <p>This is a request for email confirmation</p>
        <p>Please use <b>${data.otp}</b> as the OTP to confirm your email for further authentication </p>
        <br><p>Please do not reply to this email</p>
    `+'<br><br><br><br><img src="cid:logo" alt="address" with="100" height="60"/>';

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Pheezee Official" <pheezee@startoonlabs.com>', // sender address
        to: data.phizioemail, // list of receivers
        subject: "Email Confirmation", // Subject line
        text: "Please confirm your email", // plain text body
        envelope: {
            from: '"Pheezee Official" <pheezee@startoonlabs.com>', // used as MAIL FROM: address for SMTP
            to: data.phizioemail // used as RCPT TO: address for SMTP
        },
        html: output, // html body,
        attachments: [{
        filename: 'pheezeelogo.png',
        path: '/home/ubuntu/pheezeebackend/public/icons/pheezeelogo.png',
        cid: 'logo' //my mistake was putting "cid:logo@cid" here! 
        }]
      }, (error,info)=>{
            if(error){
                res.status(SUCCESSFULL_HTTP_RESPONSE).send("nsent");
                return ////console.log(error);
            }
            Debug && ////console.log("forgot/password"+data.phizioemail+data.otp);
            res.status(SUCCESSFULL_HTTP_RESPONSE).send('sent');
            Debug && ////console.log("Message sent: %s", info.messageId);
            Debug && ////console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      });
  }
  else{
    res.status(SUCCESSFULL_HTTP_RESPONSE).send('invalid');
  }
};
*/

// AWS SES implemented for Forgot password functionality

exports.forgot_password = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // Debug && ////console.log(req.body);
    const responceDb = await PheezeeAPI.checkPhizioAlreadyPresent(JSON.stringify(req.body));
   // Debug && ////console.log(responceDb);
    // ////console.log("Sending using AWS");

    const params = {
  Destination: {
    ToAddresses: [data.phizioemail] // Email address/addresses that you want to send your email
  },
 
  Message: {
    Body: {
      Html: {
        // HTML Format of the email
        Charset: "UTF-8",
        Data:
          "<html><body><p>This is a request for email confirmation.</p><p>Please use <b>"+data.otp+"</b> as the OTP to confirm your email for further authentication </p><br><p>Please do not reply to this email</p></body></html>"
      },
      Text: {
        Charset: "UTF-8",
        Data: ""
      }
    },
    Subject: {
      Charset: "UTF-8",
      Data: "Email Confirmation"
    }
  },
  Source: '"Pheezee Official" <pheezee@startoonlabs.com>'
};



    if(responceDb=="true"){

    const sendEmail = ses.sendEmail(params).promise();

    sendEmail
    .then(data => {
        // ////console.log("email submitted to SES", data);
       // Debug && //////console.log("forgot/password"+data.phizioemail+data.otp);
            res.status(SUCCESSFULL_HTTP_RESPONSE).send('sent');
    })
    .catch(error => {
        ////console.log(error);
        res.status(SUCCESSFULL_HTTP_RESPONSE).send("nsent");
    });


   
  }
  else{
    res.status(SUCCESSFULL_HTTP_RESPONSE).send('invalid');
  }
};

exports.phizioprofile_update_password = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // Debug && ////console.log(req.body);
    const responceDb = await PheezeeAPI.updatePhizioPassword(JSON.stringify(req.body));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.phizioprofile_update_app_version = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // ////console.log(req.body);
   // Debug && ////console.log(req.body);
    const responceDb = await PheezeeAPI.phizioprofile_update_app_version(JSON.stringify(req.body));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.phizio_addpatient = async function(req, res) {
    let message = req.body;
    // //console.log(message);
    //req.body.sessions = JSON.parse(req.body.sessions)
    var data = req.body;
    // //console.log(data);
    var id= req.body.id;
    const responceDb = await PheezeeAPI.addNewPhizioPatient(JSON.stringify(req.body));
    if(typeof data.id!='undefined'){
        var object = {"response":responceDb,"id":id};
        //console.log(object);
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(object);
    }
    else{
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
    }
};

exports.phizio_deletepatient = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;

    let phizioemail = req.body.phizioemail.toString();
    let patientid = req.body.patientid.toString();

    const responceDb = await PheezeeAPI.deletePhizioPatient(JSON.stringify(req.body));
    await PheezeeAPI.deletePatientData(JSON.stringify(req.body));
    await emptyS3Directory('pheezee', 'physiotherapist/'+phizioemail+'/patients/'+patientid+'/')
    res.status(SUCCESSFULL_HTTP_RESPONSE).send('deleted');
};

exports.phizio_updatepatientdetails = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;
    const responceDb = await PheezeeAPI.updatePhizioPatientDetails(JSON.stringify(req.body));
    
    res.status(SUCCESSFULL_HTTP_RESPONSE).send('updated');
};



exports.patient_entireEmgData = async function(req, res) {
    let message = req.body;
    // //console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn",message);
    var data_main = req.body;
    var id = data_main.id;
    // Debug && //console.log(data_main.emgdata.values.length);
	
	 // Setting the status to download overall report
	 try{
    var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(data_main.phizioemail,data_main.patientid,data_main.bodypart,data_main.exercisename,data_main.orientation,data_main.musclename,data_main.bodyorientation,data_main.heldon.split(' ')[0]);
	 }
	 catch(err)
	 {
		 var lastsession;
	 }
	if(lastsession!=0)
    {
        // Set overall download status
		//console.log("the last session is ");
		
		
		let overall_report_add = {
			"patientid":data_main.patientid,
			"phizioemail":data_main.phizioemail,
			"sessiondetails":[{
				"heldon":null, 
				"date":null
			}],
			"overalldetails":[{
				"bodypart":data_main.bodypart.toLowerCase(), 
				"date":null,
				"download_status":true
			}]
		};
	const responeDb_overall_status_write = await PheezeeAPI.overallreport_download_status(overall_report_add);
	//console.log(responeDb_overall_status_write);
    }
	
	

    
                               
    
    
    const responceDb_temp = await PheezeeAPI.updatePhizioPatientheldon(JSON.stringify(data_main));
    ////console.log(JSON.stringify(data_main.emgdata.values));
		var activity_param = [];
	try{  
for(var i= 0; i < data_main.activity_list.values.length; i++)
{
	activity_param.push(data_main.activity_list.values[i].nameValuePairs);
}
data_main.activity_list = activity_param;
}
	catch(e)
	{
		//console.log("error occured");
	}

var temp_key_emg = 'physiotherapist/'+data_main.phizioemail+'/patients/'+data_main.patientid+'/sessions/'+data_main.heldon+'/'+'emg.txt';
    var params = { 
        Bucket: 'pheezee', Key: temp_key_emg,
        ContentType: 'text/plain; Charset=utf-8',
        Body:data_main.emgdata.values.join()
    };
    
    s3Client.upload(params, function (err, data) {
        if (err) {
            // Debug && //console.log("Error creating the folder: ", err);
        } else {
            var temp_key_rom = 'physiotherapist/'+data_main.phizioemail+'/patients/'+data_main.patientid+'/sessions/'+data_main.heldon+'/'+'rom.txt';
            var params = { 
                Bucket: 'pheezee', Key: temp_key_rom,
                ContentType: 'text/plain; Charset=utf-8',
                Body:data_main.romdata.values.join()
            };

            s3Client.upload(params, async function (err, data) {
                    if (err) {
                        // Debug && //console.log("Error creating the folder: ", err);
                    } else {
						
						
								let data = {'activetime':data_main.activetime, 'reps':data_main.numofreps, 'romdata':data_main.romdata.values, 'emgdata':data_main.emgdata.values, 'download_time_stamp':data_main.heldon};
        let options = {
          mode: '',
          pythonPath: '',
          pythonOptions: ['-u'], // get print results in real-time
          scriptPath: '/home/ubuntu/pheezeebackend/python', // Quick fix for report generation.
          args: [data_main.activetime,data_main.numofreps,data_main.romdata.values, data_main.emgdata.values,data_main.heldon]
        };
		if( data_main.emgdata.values.length>0 || data_main.romdata.values.length>0)
		{
			//console.log("py params check");
			//console.log(data_main.emgdata.values.length);
		
        var test  = new PythonShell('velocityromtests.py',options);
        test.on('message', async function (message) {
            //message = JSON.stringify(message);
            //message = JSON.parse(message);
			
            let res_py = message;
			try{
            res_py = JSON.parse(res_py);
            }
            catch(e){
				res_py={"velocity":0, "avg":0, "avgmaxemg":0,"contractions":0, "type_of":"ni","consistency":0,"smoothness":0,"download_time_stamp":0};
     
            }
			data_main.velocity = res_py.velocity;
			data_main.avgmaxemg = res_py.avgmaxemg;
			data_main.consistency = res_py.consistency;
			data_main.smoothness = res_py.smoothness;
			data_main.controlled = res_py.controlled;
			data_main.download_time_stamp = res_py.download_time_stamp;
			data_main.rom_avg_max = res_py.rom_avg_max;
			data_main.rom_avg_min = res_py.rom_avg_min;
			
			//console.log("py params");
			//console.log(data_main.consistency);
			
			
			
			
			data_main.emgdata = temp_key_emg;
            data_main.romdata = temp_key_rom;
						
			const responceDb = await PheezeeAPI.newPatientSessionInsert(JSON.stringify(data_main));
                        //console.log(responceDb);
                        if(typeof data_main.id!='undefined'){
                            var object = {"response":responceDb,"id":id};
                            Debug && //console.log(object);
                            res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(object));
                        }
                        else{
                            res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
                        }
			
			
			
        });
		}
		else
		{
			res_py={"velocity":0, "avg":0, "avgmaxemg":0,"contractions":0, "type_of":"ni","consistency":0,"smoothness":0,"download_time_stamp":0,"rom_avg_max":0,"rom_avg_min":0};
			data_main.velocity = res_py.velocity;
			data_main.avgmaxemg = res_py.avgmaxemg;
			data_main.consistency = res_py.consistency;
			data_main.smoothness = res_py.smoothness;
			data_main.controlled = res_py.controlled;
			data_main.download_time_stamp = res_py.download_time_stamp;
			data_main.rom_avg_max = res_py.rom_avg_max;
			data_main.rom_avg_min = res_py.rom_avg_min;
			
			//console.log("py params null");
			//console.log(data_main.consistency);
			
			
			
			data_main.emgdata = temp_key_emg;
            data_main.romdata = temp_key_rom;
						
			const responceDb = await PheezeeAPI.newPatientSessionInsert(JSON.stringify(data_main));
                        //console.log(responceDb);
                        if(typeof data_main.id!='undefined'){
                            var object = {"response":responceDb,"id":id};
                            Debug && //console.log(object);
                            res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(object));
                        }
                        else{
                            res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
                        }
		}
						
                        
						
							   
						
                       
						
                    }
            });                                  
        }
    });      
    
};

exports.patient_generate_report = async function(req, res) {
    let message = req.body;
   
    var data = req.body;   
    const responseDb = await PheezeeAPI.getPatientReportData(JSON.stringify(req.body));
    
    
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(responseDb));
};


exports.patient_generate_report_v2 = async function(req, res) {
    let message = req.body;
   
    var data = req.body;  
    //console.log("Kranthi_report",data);
    const responseDb1 = await PheezeeAPI.getPatientReportData(JSON.stringify(req.body));
    const responseDb2 = await PheezeeAPI.findReport(data.phizioemail,data.patientid);
    let resp = {"session_list":null,"session_result":null};
    resp.session_list = responseDb1;
    resp.session_result = responseDb2;

	
// 	//console.log("Kranthi_report",JSON.stringify(resp));
    

    res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(resp));
};

exports.patient_generate_report_testing = async function(req, res) {
    let message = req.body;
    // //console.log("result15_heldon",message);
    var data = req.body;  
    let date = data.patientid;
    let month = date.split(" ")[0];
    let year = date.split(" ")[1];
    
    if(month=="Jan"){
        month ="01"
    }else if(month=="Feb"){
        month ="02"
    }else if(month=="Mar"){
        month ="03"
    }else if(month=="Apr"){
        month ="04"
    }else if(month=="May"){
        month ="05"
    }else if(month=="Jun"){
        month ="06"
    }else if(month=="Jul"){
        month ="07"
    }else if(month=="Aug"){
        month ="08"
    }else if(month=="Sep"){
        month ="09"
    }else if(month=="Oct"){
        month ="10"
    }else if(month=="Nov"){
        month ="11"
    }else if(month=="Dec"){
        month ="12"
    }
    
    
  
    
 
    const responseDb2 = await PheezeeAPI.findReport_testing(data.phizioemail);
    
    
    let reports = await db.getsession_report_count_ind_testing(data.phizioemail);
    let responceDb = await PheezeeAPI.getPhizioDetailsForLoginData(JSON.stringify(req.body));
    let phiziopatients = responceDb.map(function(x) { return  x.phiziopatients; });
    const newData = phiziopatients.flat();
    let result1 = reports.map(x => {
    let item = newData.find(item => item.patientid === x.patientid);
     if (item) { 
        var nietos = [];
            nietos.push({"patientname": item.patientname, "heldon": item.heldon.split(" ")[0], "patientid" : item.patientid,"patientprofilepicurl":item.patientprofilepicurl});
    return nietos ;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    const rt = result1.flat();
    var today = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
    var start_date  = year+"-"+month+"-"+"01";
    var end_date = year+"-"+month+"-"+"31";
    let result7 = [];
        for(let key in rt) { if (rt[key].heldon >= start_date && rt[key].heldon <= end_date ) result7.push({"patientname": rt[key].patientname, "heldon": rt[key].heldon, "patientid" : rt[key].patientid,"patientprofilepicurl":rt[key].patientprofilepicurl}); }
    
    
    if(!result7){
        let respone={"session":"0","report":"0","data":"0"};
         res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
    }else if(result7){
    
    let result2 = result7.map(x => {
    let item = reports.find(item => item.patientid === x.patientid);
     if (item) { 
     var session_r = [];
            session_r.push({"patientid": item.patientid,"sessiondetails": item.sessiondetails });
    return session_r;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    const ft = result2.flat();
    
    let result_t = [];
        for(let i=0;i < ft.length;i++){
          for(let j=0; j < ft[i].sessiondetails.length;j++){ 
            result_t.push({
              patientid: ft[i].patientid,
              sessiondetails: ft[i].sessiondetails[j]
            });
          }
        }
        
        const session_date = result_t.map(obj => obj.sessiondetails.heldon.split(" ")[0]);
        const patient_id = result_t.map(obj => obj.patientid);
        
        var session_date_value=[];
            for(var i=0;i<session_date.length;i++){
               session_date_value.push({"id":session_date_value.length +1 ,"sessiondetails_heldon" : session_date[i]});
            }
            
         var patient_id_value=[];
            for(var i=0;i<patient_id.length;i++){
               patient_id_value.push({"id":patient_id_value.length +1 ,"patientid" : patient_id[i]});
            }
            
            const session_map_data = session_date_value.map((obj) => {
              const { id } = obj;
              const objThatExist = patient_id_value.find((o) => o.id === id);
              return { ...obj, ...objThatExist };
            });
            
            let return_result = [];
           for(let key in session_map_data) { if (session_map_data[key].sessiondetails_heldon >= start_date && session_map_data[key].sessiondetails_heldon <= end_date) return_result.push({"heldon": session_map_data[key].sessiondetails_heldon, "patientid" : session_map_data[key].patientid });}
            
             var filter_date_heldon = return_result.reduce((return_result, o) => {
                if(!return_result.some(obj => obj.heldon === o.heldon && obj.patientid === o.patientid)) {
                  return_result.push(o);
                }
                return return_result;
            },[]);
            
            
            
            
            
    function findOcc(filter_date_heldon, key){
      let arr2 = [];
        
      filter_date_heldon.forEach((x)=>{
        // Checking if there is any object in arr2
        // which contains the key value
         if(arr2.some((val)=>{ return val[key] == x[key] })){
             
           // If yes! then increase the occurrence by 1
           arr2.forEach((k)=>{
             if(k[key] === x[key]){ 
               k["occurrence"]++
             }
          })
             
         }else{
           // If not! Then create a new object initialize 
           // it with the present iteration key's value and 
           // set the occurrence to 1
           let a = {}
           a[key] = x[key]
           a["occurrence"] = 1
           arr2.push(a);
         }
      })
        
      return arr2
    }
    
    let key = "patientid"
    let fiter_data = findOcc(filter_date_heldon, key);
    
    
    
     let result10 = reports.map(x => {
    let item = fiter_data.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.occurrence;
  }      
    }).filter(item => item !== undefined);
    

  
    
    
  let result3 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientprofilepicurl;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    
     let result4 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientname;
  }      
    }).filter(item => item !== undefined);
    
     let result16 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientid;
  }      
    }).filter(item => item !== undefined);

    let result15 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
    return item.heldon;
  }      
    }).filter(item => item !== undefined);
    
    const result15_heldon = result15.flat();
    
    result15_heldon.reverse();
    
    
    

                                
  let session_helod_dates_newArray = [];
        let set = new Set();
        for (let i = 0; i < result15_heldon.length; i++) {
            if(!set.has(result15_heldon[i])) {
              session_helod_dates_newArray.push(result15_heldon[i]);
              set.add(result15_heldon[i]);
            } else {
             session_helod_dates_newArray.push('0');
            }
    }
   
     
      var sum = 0;
     
    // Running the for loop
    for (let i = 0; i < result10.length; i++) {
        sum += result10[i];
    }
    
    let url = result3.reverse();
    let name = result4.reverse();
    let count = result10.reverse();
    let patient  = result16.reverse();
    let dates = session_helod_dates_newArray;
  
    let session_url = url.toString();
    let report = name.toString();
    let data_pass = count.toString();
    let heldon_dates = dates.toString();
    let patient_data = patient.toString();
     let respone={"session":session_url,"report":report,"data":data_pass,"heldon_dates":heldon_dates,"patient":patient_data};
     //console.log("respone",respone);
      res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
        
    }
    
};


exports.patient_report_history = async function(req, res) {
    let message = req.body;
    var data = req.body;  

  
    
 
    const responseDb2 = await PheezeeAPI.findReport_testing(data.phizioemail);
    
    
    let reports = await db.getsession_report_count_ind_testing(data.phizioemail);
    let responceDb = await PheezeeAPI.getPhizioDetailsForLoginData(JSON.stringify(req.body));
    let phiziopatients = responceDb.map(function(x) { return  x.phiziopatients; });
    const newData = phiziopatients.flat();
    let result1 = reports.map(x => {
    let item = newData.find(item => item.patientid === x.patientid);
     if (item) { 
        var nietos = [];
            nietos.push({"patientname": item.patientname, "heldon": item.heldon.split(" ")[0], "patientid" : item.patientid,"patientprofilepicurl":item.patientprofilepicurl});
    return nietos ;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    const rt = result1.flat();
    var today = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
    // //console.log("today",today);
    var start_date  = "2019"+"-"+"01"+"-"+"01";
    var end_date = today;
    let result7 = [];
        for(let key in rt) { if (rt[key].heldon >= start_date && rt[key].heldon <= end_date ) result7.push({"patientname": rt[key].patientname, "heldon": rt[key].heldon, "patientid" : rt[key].patientid,"patientprofilepicurl":rt[key].patientprofilepicurl}); }
    
    
    if(!result7){
        let respone={"session":"0","report":"0","data":"0"};
         res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
    }else if(result7){
    
    let result2 = result7.map(x => {
    let item = reports.find(item => item.patientid === x.patientid);
     if (item) { 
     var session_r = [];
            session_r.push({"patientid": item.patientid,"sessiondetails": item.sessiondetails });
    return session_r;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    const ft = result2.flat();
    
    let result_t = [];
        for(let i=0;i < ft.length;i++){
          for(let j=0; j < ft[i].sessiondetails.length;j++){ 
            result_t.push({
              patientid: ft[i].patientid,
              sessiondetails: ft[i].sessiondetails[j]
            });
          }
        }
        
        const session_date = result_t.map(obj => obj.sessiondetails.heldon.split(" ")[0]);
        const patient_id = result_t.map(obj => obj.patientid);
        
        var session_date_value=[];
            for(var i=0;i<session_date.length;i++){
               session_date_value.push({"id":session_date_value.length +1 ,"sessiondetails_heldon" : session_date[i]});
            }
            
         var patient_id_value=[];
            for(var i=0;i<patient_id.length;i++){
               patient_id_value.push({"id":patient_id_value.length +1 ,"patientid" : patient_id[i]});
            }
            
            const session_map_data = session_date_value.map((obj) => {
              const { id } = obj;
              const objThatExist = patient_id_value.find((o) => o.id === id);
              return { ...obj, ...objThatExist };
            });
            
            let return_result = [];
           for(let key in session_map_data) { if (session_map_data[key].sessiondetails_heldon >= start_date && session_map_data[key].sessiondetails_heldon <= end_date) return_result.push({"heldon": session_map_data[key].sessiondetails_heldon, "patientid" : session_map_data[key].patientid });}
            
             var filter_date_heldon = return_result.reduce((return_result, o) => {
                if(!return_result.some(obj => obj.heldon === o.heldon && obj.patientid === o.patientid)) {
                  return_result.push(o);
                }
                return return_result;
            },[]);
            
            
            
            
            
    function findOcc(filter_date_heldon, key){
      let arr2 = [];
        
      filter_date_heldon.forEach((x)=>{
        // Checking if there is any object in arr2
        // which contains the key value
         if(arr2.some((val)=>{ return val[key] == x[key] })){
             
           // If yes! then increase the occurrence by 1
           arr2.forEach((k)=>{
             if(k[key] === x[key]){ 
               k["occurrence"]++
             }
          })
             
         }else{
           // If not! Then create a new object initialize 
           // it with the present iteration key's value and 
           // set the occurrence to 1
           let a = {}
           a[key] = x[key]
           a["occurrence"] = 1
           arr2.push(a);
         }
      })
        
      return arr2
    }
    
    let key = "patientid"
    let fiter_data = findOcc(filter_date_heldon, key);
    
    
    
     let result10 = reports.map(x => {
    let item = fiter_data.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.occurrence;
  }      
    }).filter(item => item !== undefined);
    

  
    
    
  let result3 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientprofilepicurl;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    
     let result4 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientname;
  }      
    }).filter(item => item !== undefined);
    
     let result16 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientid;
  }      
    }).filter(item => item !== undefined);

      let result15 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.heldon;
  }      
    }).filter(item => item !== undefined);
    
    const result15_heldon = result15.flat();
    result15_heldon.reverse();
    // //console.log("result15_heldon", result15_heldon);
  
    
//  let session_helod_dates = result15_heldon.map(function(x) { return x.heldon});
   
                           
//                             session_helod_dates.reverse();
                            
                            
//                             session_helod_dates = session_helod_dates.filter( function( item, index, inputArray ) {
//                                   return inputArray.indexOf(item) == index;
//                             });
                            
//                              session_helod_dates = session_helod_dates.map(element => {
//                               return element.split(" ")[0];
//                             });
                            
//                             let output = session_helod_dates.map((str) => {
                                  
//                                   /* Split date string into sub string parts */
//                                   const [year, month, date] = str.split("-");
                                  
//                                   /* Compose a new date from sub string parts of desired format */
//                                   return `${date}-${month}-${year}`;      
//                                 });
//                             // //console.log("session_helod_dates",output);
   
  let session_helod_dates_newArray = [];
        let set = new Set();
        for (let i = 0; i < result15_heldon.length; i++) {
            if(!set.has(result15_heldon[i])) {
              session_helod_dates_newArray.push(result15_heldon[i]);
              set.add(result15_heldon[i]);
            } else {
             session_helod_dates_newArray.push('0');
            }
    }
     
      var sum = 0;
     
    // Running the for loop
    for (let i = 0; i < result10.length; i++) {
        sum += result10[i];
    }
    
    let url = result3.reverse();
    let name = result4.reverse();
    let count = result10.reverse();
    let patient  = result16.reverse();
  
    let session_url = url.toString();
    let report = name.toString();
    let data_pass = count.toString();
    let heldon_dates = session_helod_dates_newArray.toString();
    let patient_data = patient.toString();
     let respone={"session":session_url,"report":report,"data":data_pass,"heldon_dates":heldon_dates,"patient":patient_data};
    //  //console.log("respone",respone);
      res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
        
    }
    
};


// New today

exports.patient_generate_report_today = async function(req, res) {
    let message = req.body;
    var data = req.body;  
    const responseDb2 = await PheezeeAPI.findReport_testing(data.phizioemail);
    
    
    let reports = await db.getsession_report_count_ind_testing(data.phizioemail);
    let responceDb = await PheezeeAPI.getPhizioDetailsForLoginData(JSON.stringify(req.body));
    let phiziopatients = responceDb.map(function(x) { return  x.phiziopatients; });
    const newData = phiziopatients.flat();
    let result1 = reports.map(x => {
    let item = newData.find(item => item.patientid === x.patientid);
     if (item) { 
        var nietos = [];
            nietos.push({"patientname": item.patientname, "heldon": item.heldon.split(" ")[0], "patientid" : item.patientid,"patientprofilepicurl":item.patientprofilepicurl});
    return nietos ;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    const rt = result1.flat();
    var today = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
    //console.log("today",today);
    // var start_date  = year+"-"+month+"-"+"01";
    // var end_date = year+"-"+month+"-"+"31";
    let result7 = [];
        for(let key in rt) { if (rt[key].heldon >= today && rt[key].heldon <= today ) result7.push({"patientname": rt[key].patientname, "heldon": rt[key].heldon, "patientid" : rt[key].patientid,"patientprofilepicurl":rt[key].patientprofilepicurl}); }
    
    
    if(!result7){
        let respone={"session":"0","report":"0","data":"0"};
         res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
    }else if(result7){
    
    let result2 = result7.map(x => {
    let item = reports.find(item => item.patientid === x.patientid);
     if (item) { 
     var session_r = [];
            session_r.push({"patientid": item.patientid,"sessiondetails": item.sessiondetails });
    return session_r;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    const ft = result2.flat();
    
    let result_t = [];
        for(let i=0;i < ft.length;i++){
          for(let j=0; j < ft[i].sessiondetails.length;j++){ 
            result_t.push({
              patientid: ft[i].patientid,
              sessiondetails: ft[i].sessiondetails[j]
            });
          }
        }
        
        const session_date = result_t.map(obj => obj.sessiondetails.heldon.split(" ")[0]);
        const patient_id = result_t.map(obj => obj.patientid);
        
        var session_date_value=[];
            for(var i=0;i<session_date.length;i++){
               session_date_value.push({"id":session_date_value.length +1 ,"sessiondetails_heldon" : session_date[i]});
            }
            
         var patient_id_value=[];
            for(var i=0;i<patient_id.length;i++){
               patient_id_value.push({"id":patient_id_value.length +1 ,"patientid" : patient_id[i]});
            }
            
            const session_map_data = session_date_value.map((obj) => {
              const { id } = obj;
              const objThatExist = patient_id_value.find((o) => o.id === id);
              return { ...obj, ...objThatExist };
            });
            
            let return_result = [];
           for(let key in session_map_data) { if (session_map_data[key].sessiondetails_heldon >= today && session_map_data[key].sessiondetails_heldon <= today) return_result.push({"heldon": session_map_data[key].sessiondetails_heldon, "patientid" : session_map_data[key].patientid });}
            
             var filter_date_heldon = return_result.reduce((return_result, o) => {
                if(!return_result.some(obj => obj.heldon === o.heldon && obj.patientid === o.patientid)) {
                  return_result.push(o);
                }
                return return_result;
            },[]);
            
            
            
            
            
    function findOcc(filter_date_heldon, key){
      let arr2 = [];
        
      filter_date_heldon.forEach((x)=>{
        // Checking if there is any object in arr2
        // which contains the key value
         if(arr2.some((val)=>{ return val[key] == x[key] })){
             
           // If yes! then increase the occurrence by 1
           arr2.forEach((k)=>{
             if(k[key] === x[key]){ 
               k["occurrence"]++
             }
          })
             
         }else{
           // If not! Then create a new object initialize 
           // it with the present iteration key's value and 
           // set the occurrence to 1
           let a = {}
           a[key] = x[key]
           a["occurrence"] = 1
           arr2.push(a);
         }
      })
        
      return arr2
    }
    
    let key = "patientid"
    let fiter_data = findOcc(filter_date_heldon, key);
    
    
    
     let result10 = reports.map(x => {
    let item = fiter_data.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.occurrence;
  }      
    }).filter(item => item !== undefined);
    

  
    
    
  let result3 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientprofilepicurl;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    
     let result4 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientname;
  }      
    }).filter(item => item !== undefined);

       let result21 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientid;
  }      
    }).filter(item => item !== undefined);
    
    
    
  
        
       
     
      var sum = 0;
     
    // Running the for loop
    for (let i = 0; i < result10.length; i++) {
        sum += result10[i];
    }
    
    
    let arr = result10;
    //console.log(arr);
    let newArr = arr.map(function(val){
        return val > 0 ? 0 : val;
    })
    
    //console.log(newArr);
  
    let session_url = result3.toString();
    let report = result4.toString();
    let data_pass = result10.toString();
    let patient_data = result21.toString();
    let heldon_dates = newArr.toString();
     let respone={"session":session_url,"report":report,"data":data_pass,"heldon_dates":heldon_dates,"patient":patient_data};
     //console.log("respone",respone);
      res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
        
    }
    
};


exports.patient_generate_report_today_arry = async function(req, res) {
    let message = req.body;
    var data = req.body;  
    let date = data.patientid;
    let month = date.split(" ")[0];
    let year = date.split(" ")[1];
    
    if(month=="Jan"){
        month ="01"
    }else if(month=="Feb"){
        month ="02"
    }else if(month=="Mar"){
        month ="03"
    }else if(month=="Apr"){
        month ="04"
    }else if(month=="May"){
        month ="05"
    }else if(month=="Jun"){
        month ="06"
    }else if(month=="Jul"){
        month ="07"
    }else if(month=="Aug"){
        month ="08"
    }else if(month=="Sep"){
        month ="09"
    }else if(month=="Oct"){
        month ="10"
    }else if(month=="Nov"){
        month ="11"
    }else if(month=="Dec"){
        month ="12"
    }
    
    //console.log("month",month);
  
  
    
 
    const responseDb2 = await PheezeeAPI.findReport_testing(data.phizioemail);
    
    
    let reports = await db.getsession_report_count_ind_testing(data.phizioemail);
    let responceDb = await PheezeeAPI.getPhizioDetailsForLoginData(JSON.stringify(req.body));
    let phiziopatients = responceDb.map(function(x) { return  x.phiziopatients; });
    const newData = phiziopatients.flat();
    let result1 = reports.map(x => {
    let item = newData.find(item => item.patientid === x.patientid);
     if (item) { 
        var nietos = [];
            nietos.push({"patientname": item.patientname, "heldon": item.heldon.split(" ")[0], "patientid" : item.patientid,"patientprofilepicurl":item.patientprofilepicurl});
    return nietos ;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    const rt = result1.flat();
    var today = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
    //console.log("today",today);
    var start_date  = year+"-"+month+"-"+"01";
    var end_date = year+"-"+month+"-"+"31";
    let result7 = [];
        for(let key in rt) { if (rt[key].heldon >= today && rt[key].heldon <= today ) result7.push({"patientname": rt[key].patientname, "heldon": rt[key].heldon, "patientid" : rt[key].patientid,"patientprofilepicurl":rt[key].patientprofilepicurl}); }
    
    
    if(!result7){
        let respone={"session":"0","report":"0","data":"0"};
         res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
    }else if(result7){
    
    let result2 = result7.map(x => {
    let item = reports.find(item => item.patientid === x.patientid);
     if (item) { 
     var session_r = [];
            session_r.push({"patientid": item.patientid,"sessiondetails": item.sessiondetails });
    return session_r;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    const ft = result2.flat();
    
    let result_t = [];
        for(let i=0;i < ft.length;i++){
          for(let j=0; j < ft[i].sessiondetails.length;j++){ 
            result_t.push({
              patientid: ft[i].patientid,
              sessiondetails: ft[i].sessiondetails[j]
            });
          }
        }
        
        const session_date = result_t.map(obj => obj.sessiondetails.heldon.split(" ")[0]);
        const patient_id = result_t.map(obj => obj.patientid);
        
        var session_date_value=[];
            for(var i=0;i<session_date.length;i++){
               session_date_value.push({"id":session_date_value.length +1 ,"sessiondetails_heldon" : session_date[i]});
            }
            
         var patient_id_value=[];
            for(var i=0;i<patient_id.length;i++){
               patient_id_value.push({"id":patient_id_value.length +1 ,"patientid" : patient_id[i]});
            }
            
            const session_map_data = session_date_value.map((obj) => {
              const { id } = obj;
              const objThatExist = patient_id_value.find((o) => o.id === id);
              return { ...obj, ...objThatExist };
            });
            
            let return_result = [];
           for(let key in session_map_data) { if (session_map_data[key].sessiondetails_heldon >= today && session_map_data[key].sessiondetails_heldon <= today) return_result.push({"heldon": session_map_data[key].sessiondetails_heldon, "patientid" : session_map_data[key].patientid });}
            
            
            var filter_date_heldon = return_result.reduce((return_result, o) => {
                if(!return_result.some(obj => obj.heldon === o.heldon && obj.patientid === o.patientid)) {
                  return_result.push(o);
                }
                return return_result;
            },[]);
            
            
            
    function findOcc(filter_date_heldon, key){
      let arr2 = [];
        
      filter_date_heldon.forEach((x)=>{
        // Checking if there is any object in arr2
        // which contains the key value
         if(arr2.some((val)=>{ return val[key] == x[key] })){
             
           // If yes! then increase the occurrence by 1
           arr2.forEach((k)=>{
             if(k[key] === x[key]){ 
               k["occurrence"]++
             }
          })
             
         }else{
           // If not! Then create a new object initialize 
           // it with the present iteration key's value and 
           // set the occurrence to 1
           let a = {}
           a[key] = x[key]
           a["occurrence"] = 1
           arr2.push(a);
         }
      })
        
      return arr2
    }
    
    let key = "patientid"
    let fiter_data = findOcc(filter_date_heldon, key);
    
    
    
     let result10 = reports.map(x => {
    let item = fiter_data.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.occurrence;
  }      
    }).filter(item => item !== undefined);
    
        
    
  
    
    
  let result3 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientprofilepicurl;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    
     let result4 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientname;
  }      
    }).filter(item => item !== undefined);

      
     
      var sum = 0;
     
    // Running the for loop
    for (let i = 0; i < result10.length; i++) {
        sum += result10[i];
    }
  
    let session_url = result3.toString();
    let report = result4.length;
    let data_pass = sum;
     let respone={"session":0,"report":report,"data":data_pass};
     //console.log("respone",respone);
      res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
        
    }
    
};

exports.patient_generate_report_month = async function(req, res) {
    let message = req.body;
    var data = req.body;  
 
    const responseDb2 = await PheezeeAPI.findReport_testing(data.phizioemail);
    
    
    let reports = await db.getsession_report_count_ind_testing(data.phizioemail);
    let responceDb = await PheezeeAPI.getPhizioDetailsForLoginData(JSON.stringify(req.body));
    let phiziopatients = responceDb.map(function(x) { return  x.phiziopatients; });
    const newData = phiziopatients.flat();
    let result1 = reports.map(x => {
    let item = newData.find(item => item.patientid === x.patientid);
     if (item) { 
        var nietos = [];
            nietos.push({"patientname": item.patientname, "heldon": item.heldon.split(" ")[0], "patientid" : item.patientid,"patientprofilepicurl":item.patientprofilepicurl});
    return nietos ;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    const rt = result1.flat();
    var today = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
    //console.log("today",today);
    var start_date  = "2023-02-01"
    var end_date = "2023-02-31"
    let result7 = [];
        for(let key in rt) { if (rt[key].heldon >= start_date && rt[key].heldon <= end_date ) result7.push({"patientname": rt[key].patientname, "heldon": rt[key].heldon, "patientid" : rt[key].patientid,"patientprofilepicurl":rt[key].patientprofilepicurl}); }
    
    
    if(!result7){
        let respone={"session":"0","report":"0","data":"0"};
         res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
    }else if(result7){
    
    let result2 = result7.map(x => {
    let item = reports.find(item => item.patientid === x.patientid);
     if (item) { 
     var session_r = [];
            session_r.push({"patientid": item.patientid,"sessiondetails": item.sessiondetails });
    return session_r;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    const ft = result2.flat();
    
    let result_t = [];
        for(let i=0;i < ft.length;i++){
          for(let j=0; j < ft[i].sessiondetails.length;j++){ 
            result_t.push({
              patientid: ft[i].patientid,
              sessiondetails: ft[i].sessiondetails[j]
            });
          }
        }
        
        const session_date = result_t.map(obj => obj.sessiondetails.heldon.split(" ")[0]);
        const patient_id = result_t.map(obj => obj.patientid);
        
        var session_date_value=[];
            for(var i=0;i<session_date.length;i++){
               session_date_value.push({"id":session_date_value.length +1 ,"sessiondetails_heldon" : session_date[i]});
            }
            
         var patient_id_value=[];
            for(var i=0;i<patient_id.length;i++){
               patient_id_value.push({"id":patient_id_value.length +1 ,"patientid" : patient_id[i]});
            }
            
            const session_map_data = session_date_value.map((obj) => {
              const { id } = obj;
              const objThatExist = patient_id_value.find((o) => o.id === id);
              return { ...obj, ...objThatExist };
            });
            
            let return_result = [];
           for(let key in session_map_data) { if (session_map_data[key].sessiondetails_heldon >= start_date && session_map_data[key].sessiondetails_heldon <= end_date) return_result.push({"heldon": session_map_data[key].sessiondetails_heldon, "patientid" : session_map_data[key].patientid });}
            
            
            
    function findOcc(return_result, key){
      let arr2 = [];
        
      return_result.forEach((x)=>{
        // Checking if there is any object in arr2
        // which contains the key value
         if(arr2.some((val)=>{ return val[key] == x[key] })){
             
           // If yes! then increase the occurrence by 1
           arr2.forEach((k)=>{
             if(k[key] === x[key]){ 
               k["occurrence"]++
             }
          })
             
         }else{
           // If not! Then create a new object initialize 
           // it with the present iteration key's value and 
           // set the occurrence to 1
           let a = {}
           a[key] = x[key]
           a["occurrence"] = 1
           arr2.push(a);
         }
      })
        
      return arr2
    }
    
    let key = "patientid"
    let fiter_data = findOcc(return_result, key);
    
    
    
     let result10 = reports.map(x => {
    let item = fiter_data.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.occurrence;
  }      
    }).filter(item => item !== undefined);
    
        
        
        //   const rtghg = result_t.flat();
        
       
            
    
    // var result = ft.map(value =>
    //      value.sessiondetails.map(child => ({ patientid: value.id, ...child }))
    //     ).flat();

    // //console.log(result);
    
    
    
//     // var filter_heldon_session = ft.find(item => item.heldon === today);
//   let filter_heldon_session = ft.map(function(x) { return  {"heldon":x.heldon.split(" ")[0]}; });
//   //console.log(filter_heldon_session);
// let result8 = [];
//         for(let key2 in filter_heldon_session) { if (filter_heldon_session[key2].heldon == "2022-10-07") result8.push({"heldon": filter_heldon_session[key2].heldon}); }
  
    
    
  let result3 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientprofilepicurl;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    
     let result4 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientname;
  }      
    }).filter(item => item !== undefined);

      
     
      var sum = 0;
     
    // Running the for loop
    for (let i = 0; i < result10.length; i++) {
        sum += result10[i];
    }
  
    let session_url = result3.toString();
    let report = result4.length;
    let data_pass = sum;
     let respone={"session":session_url,"report":report,"data":data_pass};
      res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
        
    }
    
};





exports.phizioprofile_update = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   
    const responceDb = await PheezeeAPI.updatePhizioDetails(JSON.stringify(req.body));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.phizio_profilepic_upload = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   

    let phizioemail = data.phizioemail;
    var imageBuffer = Buffer.from(data.image,'base64');

    var params = { 
        Bucket: 'pheezee', Key: 'physiotherapist/'+phizioemail+'/images/profilepic.png', 
        ACL: 'public-read', 
        Body:imageBuffer 
    };

    s3Client.upload(params, function (err, data) {
                if (err) {
                   // Debug && //console.log("Error creating the folder: ", err);
                } else {
                   // Debug && //console.log("Successfully created a folder on S3");
                }
    });
    let profilepickey = 'physiotherapist/'+phizioemail+'/images/profilepic.png';
    let responseDb = await PheezeeAPI.updatePhizioProfilePicUrl(phizioemail,profilepickey);
    let responseJson = new Object();
    responseJson.patientid = null;
    responseJson.url  = profilepickey;
    responseJson.isvalid = responseDb;
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responseJson);    
};

exports.clinic_logo_upload = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   

    let phizioemail = data.phizioemail;
    var imageBuffer = Buffer.from(data.image,'base64');

    var params = { 
        Bucket: 'pheezee', Key: 'physiotherapist/'+phizioemail+'/images/cliniclogo.png', 
        ACL: 'public-read', 
        Body:imageBuffer 
    };

    s3Client.upload(params, function (err, data) {
                if (err) {
                    // Debug && //console.log("Error creating the folder: ", err);
                } else {
                    // Debug && //console.log("Successfully created a folder on S3");
                }
    });
    let profilepickey = 'https://pheezee.s3.ap-south-1.amazonaws.com/physiotherapist/'+phizioemail+'/images/cliniclogo.png';
    let responseDb = await PheezeeAPI.updatePhizioClinicLogoUrl(phizioemail,profilepickey);
    let responseJson = new Object();
    responseJson.patientid = null;
    responseJson.url  = profilepickey;
    responseJson.isvalid = responseDb;
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responseJson);    
};

exports.phizio_getprofilepicture = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   
    
    let phizioemail = data.phizioemail;
    let responceDb = await PheezeeAPI.getPhizioProfilePicUrl(phizioemail);
    if(responceDb.phizioprofilepicurl==="url defauld now" || responceDb.phizioprofilepicurl==="empty"){
        // Debug && //console.log(responceDb.phizioprofilepicurl);
    }else{
        var params = { 
        Bucket: 'pheezee', Key: 'physiotherapist/'+phizioemail+'/images/profilepic.png' };

        s3Client.getObject(params, function (err, data) {
                    if (err) {
                        // Debug && //console.log("Error creating the folder: ", err);
                        res.status(SUCCESSFULL_HTTP_RESPONSE).send('noimage');
                    } else {
                        res.status(SUCCESSFULL_HTTP_RESPONSE).send(data.Body);
                    }
        });
    }    
};

exports.phizio_patient_updateCommentSection = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   
    const response = await PheezeeAPI.updatePhizioPatientCommentSection(JSON.stringify(req.body));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send('updated');
};



exports.phizio_update_patientProfilePic = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   

    let phizioemail = data.phizioemail;
    let patientid = data.patientid;
    var imageBuffer = Buffer.from(data.image,'base64');

    var params = { 
        Bucket: 'pheezee', Key: 'physiotherapist/'+phizioemail+'/patients/'+patientid+'/images/profilepic.png', 
        ACL: 'public-read', 
        Body:imageBuffer 
    };

    s3Client.upload(params, function (err, data) {
        if (err) {
            // Debug && //console.log("Error creating the folder: ", err);
        } else {
            // Debug && //console.log("Successfully created a folder on S3");
        }
    });
    let profilepickey = 'physiotherapist/'+phizioemail+'/patients/'+patientid+'/images/profilepic.png';
    let responseDb = await PheezeeAPI.updatePatientProfilePicUrl(phizioemail,patientid,profilepickey);
    let responseJson = new Object();
    responseJson.patientid = data.patientid;
    responseJson.url  = profilepickey;
    responseJson.isvalid = responseDb;
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responseJson);

};


exports.phizio_update_patientStatus = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   
    const responceDb = await PheezeeAPI.updatePatientStatus(JSON.stringify(req.body));
    // Debug && //console.log(responceDb);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.phizio_patient_updateMmtGrade = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   
    const responceDb = await PheezeeAPI.updatePatientMmtGrade(JSON.stringify(req.body));
    var id= data.id;
    if(typeof data.id!='undefined'){
        //Debug && //console.log(responceDb);
        var object = {"response":responceDb,"id":id};
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(object));
    }
    else{
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
    }
};


exports.update_phizio_type = async function(req, res){
    let message = req.body;
    const response = await PheezeeAPI.updatePhizioType(JSON.stringify(message));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(response);
};

exports.phizio_patient_deletepatient_sesssion = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   
    var id = data.id;
    const responceDb = await PheezeeAPI.deletePatientOneSession(JSON.stringify(req.body));
    // Debug && //console.log(responceDb);
 
    if(typeof data.id!='undefined'){
        //Debug && //console.log(responceDb);
        var object = {"response":responceDb,"id":id};
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(object));
    }
    else{
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
    }
};

exports.phizio_testing_generate_sessions = async function(req, res) {
    let message = req.body;
    // Debug && //console.log(req.body);
    var data = req.body;   
    const responceDb = await PheezeeAPI.getPatientEntireSessionDataForTesting(JSON.stringify(req.body));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(JSON.stringify(responceDb));
};


exports.sync_data_on_server = async function(req,res){
    var message = req.body;
    //console.log(message);
    let ids = [];
    for(var i=0;i<message.length;i++){
        var id = message[i].id;
        if(message[i].topic===add_patient_topic){
            const responceDb = await PheezeeAPI.addNewPhizioPatient(message[i].message);
            if(responceDb==='inserted'){
                ids.push(message[i].id);
            }
        }
        else if(message[i].topic===delete_patient_topic){
            const responceDb = await PheezeeAPI.deletePatientOneSession(message[i].message);
            if(responceDb==='deleted'){
                ids.push(message[i].id);
            }
        }
        else if(message[i].topic===mmt_data_topic){
            const responceDb = await PheezeeAPI.updatePatientMmtGrade(message[i].message);
            if(responceDb==='updated'){
                ids.push(message[i].id);
            }
        }
        else{
            var temp_message  = message[i].message;
            var data_main = JSON.parse(temp_message);
            var data_temp = JSON.parse(temp_message);
            var temp_key_rom = 'physiotherapist/'+data_main.phizioemail+'/patients/'+data_main.patientid+'/sessions/'+data_main.heldon+'/'+'rom.txt';
            var temp_key_emg = 'physiotherapist/'+data_main.phizioemail+'/patients/'+data_main.patientid+'/sessions/'+data_main.heldon+'/'+'emg.txt';
            var params = { 
                Bucket: 'pheezee', Key: temp_key_emg,
                ContentType: 'text/plain; Charset=utf-8',
                                //Body:Buffer.from(data.data,'binary')
                Body:data_main.emgdata.values.toString()
            };
            
            s3Client.upload(params, async function (err, data) {
                if (err) {
                    // Debug && //console.log("Error creating the folder: ", err);
                } else {
                    var params = { 
                        Bucket: 'pheezee', Key: temp_key_rom,
                        ContentType: 'text/plain; Charset=utf-8',
                                //Body:Buffer.from(data.data,'binary')
                        Body:data_main.romdata.values.toString()
                    };

                    s3Client.upload(params, async function (err, data) {
                        // Debug && //console.log()
                            if (err) {
                                // Debug && //console.log("Error creating the folder: ", err);
                            } else {
                            }
                    });                                  
                }
            });
            data_temp.emgdata = temp_key_emg;
            data_temp.romdata = temp_key_rom;
            const responceDb = await PheezeeAPI.newPatientSessionInsert(JSON.stringify(data_temp));
            if(responceDb==='inserted'){
                Debug && //console.log("here");
                ids.push(id);
            }
        }
    }
    Debug && //console.log(ids);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(ids);
};

exports.firmware_error_log = async function(req, res) {
    let date = new Date();
    // Debug && //console.log(req.body);
    var data = req.body;   

    var params = { 
        Bucket: 'pheezee', Key: 'firmware_error_log/'+date+'.txt',
        ContentType: 'text/plain; Charset=utf-8',
        //Body:Buffer.from(data.data,'binary')
        Body:data.data
    };

    s3Client.upload(params, function (err, data) {
                if (err) {
                    // Debug && //console.log("Error creating the folder: ", err);
                    res.status(SUCCESSFULL_HTTP_RESPONSE).send(false);
                } else {
                    // Debug && //console.log("Successfully created a folder on S3");
                    res.status(SUCCESSFULL_HTTP_RESPONSE).send(true);
                }
    });
        
};

exports.firmware_update_check_and_send = async function(req, res) {
    let latest_firmware = "1.13.9";
    let latest_firmware_link = "https://pheezee.s3.ap-south-1.amazonaws.com/latest+firmware/phv1_13_9.zip";
    let data = req.body;
    //console.log(data);
    if(data.firmware_version===latest_firmware){
        var object = {"latest_firmware_link":latest_firmware_link, "firmware_available":false};
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(object);
    }else{
        var object = {"latest_firmware_link":latest_firmware_link, "firmware_available":true,"firmware_version":latest_firmware};
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(object);
        //console.log(object);
    }
};










var emptyS3Directory = async function(bucket, dir) {
    const listParams = {
        Bucket: bucket,
        Prefix: dir
    };

    const listedObjects = await s3Client.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {
        Bucket: bucket,
        Delete: { Objects: [] }
    };

    listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
    });

    await s3Client.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}


//Device Health related functions
exports.insert_or_update_pheezee_device_details = async function(req, res) {
    let data = req.body;
    let responceDb = await DeviceHealthAPI.insertOrUpdatePheezeeDeviceDetails(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.insert_pheezee_health_status = async function(req, res) {
    let data = req.body;
    // Debug && //console.log('data',data);
    let responceDb = await DeviceHealthAPI.insertPheezeeHealthStatus(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.insert_phizio_email_which_used_the_device = async function(req, res) {
    let data = req.body;
    // Debug && //console.log(data);
    let responceDb = await DeviceHealthAPI.insertPhizioEmailWhichUsedTheDevice(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.get_device_status = async function(req, res) {
    let data = req.body;
    // Debug && //console.log(data);
    let responceDb = await DeviceHealthAPI.getDeviceStatus(JSON.stringify(data));
    // Debug && //console.log(responceDb);
    if(responceDb==null){
        res.status(UNSUCCESSFULL_HTTP_RESPONSE).send(responceDb);
    }else{
        res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
    }
};

exports.update_device_status = async function(req, res) {
    let data = req.body;
    // Debug && //console.log(data);
    let responceDb = await DeviceHealthAPI.updateDeviceStatus(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};


exports.update_device_location = async function(req, res) {
    let data = req.body;
    let responceDb = await DeviceLocationAPI.updateDeviceLocation(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.get_device_details_mac = async function(req,res){
    let data = req.body;
    let responceDb = await DeviceHealthAPI.getDeviceDetailsBasedOnMac(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
}

exports.get_device_details_uid = async function(req,res){
    let data = req.body;
    let responceDb = await DeviceHealthAPI.getDeviceDetailsBasedOnUid(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
}


//Package id related api's
exports.create_new_device_package = async function(req, res){
    let data = req.body;
    let responceDb = await DevicePackageAPI.createPackageDataForNewProduct(JSON.stringify(data));
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};


//Device Token
exports.saveMobileToken = async function(req,res){
    let data = req.body;
    //console.log(data.phizioemail+" "+ data.token);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(true);
};

exports.sceduledSessionNotSaved = async function(req, res){
    let data = req.body;
    //console.log(data);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(true);
};

exports.getheldon = async function(req, res){
    let data = req.body;
    let heldon = '12-13-2020'; 
    const responceDb = await PheezeeAPI.getPhizioPatientheldon(data.phizioemail,data.patientid);
    // //console.log(responceDb);




  
    if(typeof responceDb == 'undefined')
    {
reponseDb = '-'
}
    //console.log(responceDb);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};


// Session List
exports.getsessiondetails = async function(req, res){
    let data = req.body;
    // ////console.log(data);
 
  const patientId = data.patientid;
  const phizioemail = data.phizioemail;
  let date = data.date;
  let report;
// ////console.log(date);

    report = await db.DailyReport(phizioemail, patientId, date);
 
//while (typeof report[0] =='undefined'){

//    report = await db.DailyReport(phizioemail, patientId, date);
//res.status(SUCCESSFULL_HTTP_RESPONSE).send("-");
//}
  
	if(typeof report[0] =='undefined')
	{
	
		res.status(201).send("-");

	}
	else
	{
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(report[0].sessiondetails);
	}
};

exports.getoveralldetails = async function(req, res){

     let data = req.body;
 
  const patientId = data.patientid;
  const phizioemail = data.phizioemail;
  const { date } = data.status;
 
//  ////console.log(data);
 
  var elbow=0;
  var knee=0;
  var ankle=0;
  var hip=0;
  var wrist=0;
  var shoulder=0;
  var forearm=0;
  var spine=0;
  var abdomen=0;
  var cervical=0;
  var thoracic=0;
  var lumbar=0;
  var others=0;

  let report;
 
    report = await db.overallReport(phizioemail, patientId, date);
	
	if (typeof report === 'undefined' || report.length < 1) {		
		var respone = {"elbow":elbow,"knee":knee,"ankle":ankle,"hip":hip,"wrist":wrist,"shoulder":shoulder,"forearm":forearm,"spine":spine,"abdomen":abdomen,"cervical":cervical,"thoracic":thoracic,"lumbar":lumbar,"others":others}
		 res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
		 return
	}
	

var bodypartlist = ["elbow","knee","ankle","hip","wrist","shoulder","forearm","spine","abdomen","cervical","thoracic","lumbar","others"];
var overall_valid_list=[];

for(var list =0; list<bodypartlist.length; list++)
{

var input = bodypartlist[list];

var test ={};
var setup = [];
var table_list=[];
let new_template={};


      let Overall_session = JSON.parse(JSON.stringify(report[0].sessiondetails));
           Overall_session.forEach((element)=>{
       
           if(element.bodypart.toLowerCase()==input){
            let uniqueKeyPerGraph = element.bodypart.toLowerCase()+element.exercisename.toLowerCase()+element.musclename.toLowerCase()+element.bodyorientation.toLowerCase()+element.orientation.toLowerCase();
            uniqueKeyPerGraph=uniqueKeyPerGraph.replace('-','');
            uniqueKeyPerGraph=uniqueKeyPerGraph.replace('(','');
            uniqueKeyPerGraph=uniqueKeyPerGraph.replace(')','');
            uniqueKeyPerGraph=uniqueKeyPerGraph.replace('  ','');
            uniqueKeyPerGraph=uniqueKeyPerGraph.replace(' ','');
            uniqueKeyPerGraph=uniqueKeyPerGraph.replace('   ','');
            uniqueKeyPerGraph=uniqueKeyPerGraph.replace(/ /g,'');
      
        
            if(!(uniqueKeyPerGraph in test)){
              test[uniqueKeyPerGraph ]=0;
              var obj = {report_name:"",left:"",right:""};
              obj.report_name = uniqueKeyPerGraph;
               table_list.push(obj);
              }

              if(!(uniqueKeyPerGraph in new_template)){
              new_template[uniqueKeyPerGraph ]={};
                new_template[uniqueKeyPerGraph].numofsession = 0;
                new_template[uniqueKeyPerGraph].heldon_list={};
                new_template[uniqueKeyPerGraph].heldon_list_array=[];
            }
            

            eachDate = element.heldon.substr(0,10);
                if(!(eachDate in new_template[uniqueKeyPerGraph].heldon_list)){
                  if(element.sessiontype!=''){
                  new_template[uniqueKeyPerGraph].heldon_list_array.push(eachDate);
                  }
                }
            new_template[uniqueKeyPerGraph].heldon_list[eachDate]=null;
			
			}
			

                  
           });
          

        var table_len = table_list.length;
        if(table_len>9)
        {
          table_len = 9;
        }
        var exercise_count=0;
        for(var i = 0 ;i < table_len; i++)
        {
          if(new_template[table_list[i].report_name].heldon_list_array.length > 1)
          {
			  if(!overall_valid_list.includes(input))
			  {
				overall_valid_list.push(input);
			  }
          }
        }
		


    }

	

    for(var i =0; i<report[0].sessiondetails.length; i++)
    {
        var obj = report[0].sessiondetails[i];
        
        if(obj.bodypart == 'Elbow' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            elbow = elbow+1;
        }

        if(obj.bodypart == 'Knee' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            knee = knee+1;
        }

        if(obj.bodypart == 'Ankle' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            ankle=ankle+1;
        }

        if(obj.bodypart == 'Hip' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            hip=hip+1;
        }

        if(obj.bodypart == 'Wrist' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            wrist = wrist+1;
        }

        if(obj.bodypart == 'Shoulder' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            shoulder=shoulder+1;
        }

        if(obj.bodypart == 'Forearm' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            forearm = forearm+1;
        }

        if(obj.bodypart == 'Spine' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            spine = spine + 1;
        }
		
		if(obj.bodypart == 'Abdomen' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            abdomen = abdomen + 1;
        }
		
		if(obj.bodypart == 'Cervical' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            cervical = cervical + 1;
        }
		
		if(obj.bodypart == 'Thoracic' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            thoracic = thoracic + 1;
        }
		
		if(obj.bodypart == 'Lumbar' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            lumbar = lumbar + 1;
        }

        if(obj.bodypart == 'Others' && overall_valid_list.includes(obj.bodypart.toLowerCase()))
        {
            others = others + 1;
        }
    }

    var respone = {"elbow":elbow,"knee":knee,"ankle":ankle,"hip":hip,"wrist":wrist,"shoulder":shoulder,"forearm":forearm,"spine":spine,"abdomen":abdomen,"cervical":cervical,"thoracic":thoracic,"lumbar":lumbar,"others":others}


    res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);

};


// Python Analytics
let python_analytics =  async function(activetime, reps, romdata, emgdata,download_time_stamp){
    try{
    // ////console.log(activetime, reps, "ROMDATA:" , romdata.length, "EMGDATA: ",emgdata.length);
    let res_py;
    if(emgdata.length == 0 || romdata.length == 0)
    {   
        res_py={"velocity":0, "avg":0, "avgmaxemg":0,"contractions":0, "type_of":"ni","consistency":0,"smoothness":0,"download_time_stamp":0};
     
        return res_py;
    }

     return new Promise(function(resolve,reject){
  
        let data = {'activetime':activetime, 'reps':reps, 'romdata':romdata, 'emgdata':emgdata, 'download_time_stamp':download_time_stamp};
        let options = {
          mode: '',
          pythonPath: '',
          pythonOptions: ['-u'], // get print results in real-time
          scriptPath: '/home/ubuntu/pheezeebackend/python', // Quick fix for report generation.
          args: [activetime,reps,romdata, emgdata,download_time_stamp]
        };
        var test  = new PythonShell('velocityromtests.py',options);
        test.on('message', function (message) {
            //message = JSON.stringify(message);
            //message = JSON.parse(message);
            res_py = message;
            resolve();
        });

        //////console.log(activetime,reps, "ROM", romdata,"EMG", emgdata);
    }).then(function(){
        return res_py;
    });
    }
    catch(e)
    {
        res_py={"velocity":0, "avg":0, "avgmaxemg":0,"contractions":0, "type_of":"ni","consistency":0,"smoothness":0,"download_time_stamp":0};
     
        return res_py;
    }
}

// Session and Report count
exports.getsession_report_count = async function(req, res){

   let data = req.body;
//   ////console.log("555555555555555555555555555555555555555555",data);
  const phizioemail = data.phizioemail;

 

 

var report = await db.getsession_report_count(phizioemail);






var session_report_count=0;
var overall_report_count=0;
var session_report_data=[];
var kranthi_testing = [];


var session_count=0;
var report_count=0;
var report_count_data=new Array();

 for(var i =0; i<report.length;i++)
 {

    session_count = session_count + report[i].sessiondetails.length;

    var session_report={};
    var overall_report={};
    for(var j=0; j<report[i].sessiondetails.length; j++)
    {
        
     var heldon_array = report[i].sessiondetails[j].heldon.split(' ')[0];
    
     session_report_data = heldon_array;
     
      let kranthi = heldon_array;
     kranthi_testing = new Date(kranthi).toLocaleString('en-us',{month:'short', year:'numeric'})
// ////console.log(kranthi_testing);
     
     if(!(heldon_array[0] in session_report)){
              session_report[heldon_array[0]]=0;
          }

    if(!(report[i].sessiondetails[j].bodypart in overall_report)){
              overall_report[report[i].sessiondetails[j].bodypart]=0;
          }
    }
    session_report_count = session_report_count + Object.values(session_report).length;
    overall_report_count = overall_report_count + Object.values(overall_report).length;
    report_count_data[i]=kranthi_testing;
    session_report_data++;

 }
   
   // ////console.log('Total Session' + session_report_count);
   // ////console.log('Overall Session' + overall_report_count);
report_count = session_report_count;



var months = [
  'January', 'February', 'March', 'April', 'May',
  'June', 'July', 'August', 'September',
  'October', 'November', 'December'
];

let monthWords = report_count_data.map(month => {
  return month.substring(5, 7);
}).map(item => {
  return months[parseInt(item) - 1]
});








// report_count=report.length;

let respone={"session":session_count,"report":report_count,"data":report_count_data.toString()};

// ////console.log("Kranthi_report_1",respone);

        res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);

};


// Sorting Month

exports.getsession_report_count_month = async function(req, res){
    let message = req.body;
    var data = req.body;  
    // ////console.log("555555555555555555555555555555555",data);
    let date = data.patientid;
    let month = date.split(" ")[0];
    let year = date.split(" ")[1];
    
    if(month=="Jan"){
        month ="01"
    }else if(month=="Feb"){
        month ="02"
    }else if(month=="Mar"){
        month ="03"
    }else if(month=="Apr"){
        month ="04"
    }else if(month=="May"){
        month ="05"
    }else if(month=="Jun"){
        month ="06"
    }else if(month=="Jul"){
        month ="07"
    }else if(month=="Aug"){
        month ="08"
    }else if(month=="Sep"){
        month ="09"
    }else if(month=="Oct"){
        month ="10"
    }else if(month=="Nov"){
        month ="11"
    }else if(month=="Dec"){
        month ="12"
    }
    
 
  
  
    
 
    const responseDb2 = await PheezeeAPI.findReport_testing(data.phizioemail);
    
    
    let reports = await db.getsession_report_count_ind_testing(data.phizioemail);
    let responceDb = await PheezeeAPI.getPhizioDetailsForLoginData(JSON.stringify(req.body));
    let phiziopatients = responceDb.map(function(x) { return  x.phiziopatients; });
    const newData = phiziopatients.flat();
    let result1 = reports.map(x => {
    let item = newData.find(item => item.patientid === x.patientid);
     if (item) { 
        var nietos = [];
            nietos.push({"patientname": item.patientname, "heldon": item.heldon.split(" ")[0], "patientid" : item.patientid,"patientprofilepicurl":item.patientprofilepicurl});
    return nietos ;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    const rt = result1.flat();
    var today = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
    // ////console.log("today",today);
    var start_date  = year+"-"+month+"-"+"01";
    var end_date = year+"-"+month+"-"+"31";
    let result7 = [];
        for(let key in rt) { if (rt[key].heldon >= start_date && rt[key].heldon <= end_date ) result7.push({"patientname": rt[key].patientname, "heldon": rt[key].heldon, "patientid" : rt[key].patientid,"patientprofilepicurl":rt[key].patientprofilepicurl}); }
    
    
    if(!result7){
        let respone={"session":"0","report":"0","data":"0"};
         res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
    }else if(result7){
    
    let result2 = result7.map(x => {
    let item = reports.find(item => item.patientid === x.patientid);
     if (item) { 
     var session_r = [];
            session_r.push({"patientid": item.patientid,"sessiondetails": item.sessiondetails });
    return session_r;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    const ft = result2.flat();
    
    let result_t = [];
        for(let i=0;i < ft.length;i++){
          for(let j=0; j < ft[i].sessiondetails.length;j++){ 
            result_t.push({
              patientid: ft[i].patientid,
              sessiondetails: ft[i].sessiondetails[j]
            });
          }
        }
        
        const session_date = result_t.map(obj => obj.sessiondetails.heldon.split(" ")[0]);
        const patient_id = result_t.map(obj => obj.patientid);
        
        var session_date_value=[];
            for(var i=0;i<session_date.length;i++){
               session_date_value.push({"id":session_date_value.length +1 ,"sessiondetails_heldon" : session_date[i]});
            }
            
         var patient_id_value=[];
            for(var i=0;i<patient_id.length;i++){
               patient_id_value.push({"id":patient_id_value.length +1 ,"patientid" : patient_id[i]});
            }
            
            const session_map_data = session_date_value.map((obj) => {
              const { id } = obj;
              const objThatExist = patient_id_value.find((o) => o.id === id);
              return { ...obj, ...objThatExist };
            });
            
            let return_result = [];
           for(let key in session_map_data) { if (session_map_data[key].sessiondetails_heldon >= start_date && session_map_data[key].sessiondetails_heldon <= end_date) return_result.push({"heldon": session_map_data[key].sessiondetails_heldon, "patientid" : session_map_data[key].patientid });}
            
            
            var filter_date_heldon = return_result.reduce((return_result, o) => {
                if(!return_result.some(obj => obj.heldon === o.heldon && obj.patientid === o.patientid)) {
                  return_result.push(o);
                }
                return return_result;
            },[]);
            
            
            
    function findOcc(filter_date_heldon, key){
      let arr2 = [];
        
      filter_date_heldon.forEach((x)=>{
        // Checking if there is any object in arr2
        // which contains the key value
         if(arr2.some((val)=>{ return val[key] == x[key] })){
             
           // If yes! then increase the occurrence by 1
           arr2.forEach((k)=>{
             if(k[key] === x[key]){ 
               k["occurrence"]++
             }
          })
             
         }else{
           // If not! Then create a new object initialize 
           // it with the present iteration key's value and 
           // set the occurrence to 1
           let a = {}
           a[key] = x[key]
           a["occurrence"] = 1
           arr2.push(a);
         }
      })
        
      return arr2
    }
    
    let key = "patientid"
    let fiter_data = findOcc(filter_date_heldon, key);
    
    
    
     let result10 = reports.map(x => {
    let item = fiter_data.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.occurrence;
  }      
    }).filter(item => item !== undefined);
    
        
    
  
    
    
  let result3 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientprofilepicurl;
  }      
    }).filter(item => item !== undefined); // Can also use filter(item => item);
    
    
     let result4 = reports.map(x => {
    let item = result7.find(item => item.patientid === x.patientid);
     if (item) { 
     
    return item.patientname;
  }      
    }).filter(item => item !== undefined);

      
     
      var sum = 0;
     
    // Running the for loop
    for (let i = 0; i < result10.length; i++) {
        sum += result10[i];
    }
  
    let session_url = result3.toString();
    let report = result4.length;
    let data_pass = sum;
     let respone={"session":0,"report":report,"data":data_pass};
    //  ////console.log("respone",respone);
      res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
        
    }
    
};

//print report

exports.print_value = async function(req, res){
    
    let data = req.body;
    // ////console.log(data)

    let phizioemail = data.phizioemail;
    let patientId = data.patientid;
    let date = data.status;
    let report = await db.DailyReport(phizioemail, patientId, date);
                report.flat();
    let sessiondetails = report.map(function(x) { return  x.sessiondetails; });   
    let sessiondetail =  sessiondetails.flat();
    
    
    // value passing from array to print
    
    let bodypart = sessiondetail.map(function(x) { return  x.bodypart; });
    let exercisename = sessiondetail.map(function(x) { return  x.exercisename; });
    let musclename = sessiondetail.map(function(x) { return  x.musclename; });
    let maxemg = sessiondetail.map(function(x) { return  x.maxemg; });
    let maxangle = sessiondetail.map(function(x) { return  x.maxangle; });
    let minangle = sessiondetail.map(function(x) { return  x.minangle; });
    let maxangleselected = sessiondetail.map(function(x) { return  x.maxangleselected; });
    let minangleselected = sessiondetail.map(function(x) { return  x.minangleselected; });
    
    
    let respone={
        "bodypart":bodypart.toString(),
        "exercisename":exercisename.toString(),
        "musclename":musclename.toString(),
        "maxemg":maxemg.toString(),
        "maxangle":maxangle.toString(),
        "minangle":minangle.toString(),
        "maxangleselected":maxangleselected.toString(),
        "minangleselected":minangleselected.toString(),
    };
  
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
};

// view report summary 

exports.view_report_Summary = async function(req, res){
      var data = req.body;  
    //   ////console.log(data);
      
    let patient_id = data.patientid;
    let phizioemail = data.phizioemail;
    let session = 0;
    
    var report = await db.getsession_report_count_ind(phizioemail,patient_id);
        var session_report_count=0;
        var session_report_data=[];
        var kranthi_testing = [];
        var kranthi = 0;
        
        
        var session_count=0;
        var report_count=0;
        var report_count_data=new Array();
        
         for(var i =0; i<report.length;i++)
         {
        
            session_count = session_count + report[i].sessiondetails.length;
        
            var session_report={};
            var overall_report={};
            for(var j=0; j<report[i].sessiondetails.length; j++)
            {
             var heldon_array = report[i].sessiondetails[j].heldon.split(' ')[0];
             session_report_data.push(heldon_array);
             
             if(!(heldon_array[0] in session_report)){
                      session_report[heldon_array[0]]=0;
                  }
        
            if(!(report[i].sessiondetails[j].bodypart in overall_report)){
                      overall_report[report[i].sessiondetails[j].bodypart]=0;
                  }
            }
            session_report_count = session_report_count + Object.values(session_report).length;
           
         }
           
   
        
        let uniqueChars = [...new Set(session_report_data)];

        
        
        
        
        session = session_count.toString();
    
    
    
    
    
    let current_array = await db.goal_reached(phizioemail,patient_id);
  
    let final_perstage = 0;
    
       
    let responceDb = await PheezeeAPI.getPhizioDetailsForLoginData(JSON.stringify(req.body));
    let phiziopatients = responceDb.map(function(x) { return  x.phiziopatients; });
    const rt = phiziopatients.flat();
    
     let result7 = [];
        for(let key in rt) { if (rt[key].patientid == patient_id ) result7.push({
        "patientid": rt[key].patientid,
        "patientname": rt[key].patientname, 
        "dateofjoin" : rt[key].dateofjoin,
        "patientage" : rt[key].patientage,
        "patientcasedes" : rt[key].patientcasedes,
        "patientcondition" : rt[key].patientcondition,
        "patientgender" : rt[key].patientgender,
        "patientphone" : rt[key].patientphone,
        "patientemail" : rt[key].patientemail,
        "patientinjured" : rt[key].patientinjured,
        "patienthistory": rt[key].patienthistory,
        "patientprofilepicurl":rt[key].patientprofilepicurl,
        "heldon":rt[key].heldon.split(" ")[0],
        }); }
        
        
        let patientid = result7.map(function(x) { return  x.patientid; });
        let patientname = result7.map(function(x) { return  x.patientname; });
        let dateofjoin = result7.map(function(x) { return  x.dateofjoin; });
        let patientage = result7.map(function(x) { return  x.patientage; });
        let patientcasedes = result7.map(function(x) { return  x.patientcasedes; });
        let patientcondition = result7.map(function(x) { return  x.patientcondition; });
        let patientgender = result7.map(function(x) { return  x.patientgender; });
        let patientphone = result7.map(function(x) { return  x.patientphone; });
        let patientemail = result7.map(function(x) { return  x.patientemail; });
        let patientinjured = result7.map(function(x) { return  x.patientinjured; });
        let patienthistory = result7.map(function(x) { return  x.patienthistory; });
        let patientprofilepicurl = result7.map(function(x) { return  x.patientprofilepicurl; });
        let heldon = result7.map(function(x) { return  x.heldon; });
        
        
    
    if(current_array == "no_session"){
        // return res.status(200).send("0");
    }else{
         let current_session_min_rom = current_array.map(function(x) { return x.minangle; });
         let current_session_max_rom = current_array.map(function(x) { return x.maxangle; });
          current_session_max_rom.map(function (x,i){
              if (x>0 && current_session_min_rom[i]<0){
                  current_session_min_rom[i]=0;
              }
          });
        
          
         
         let current_session_maxangleselected_rom = current_array.map(function(x) { return x.maxangleselected; });
         let current_session_minangleselected_rom = current_array.map(function(x) { return x.minangleselected; });
        //  let current_session_min_rom_remove_netive = current_session_min_rom.map(num => num < 0  ? 0 : num);
         let current_session_max_sub_min = current_session_max_rom.map(function(n, i) { return Math.abs(n) - Math.abs(current_session_min_rom[i]); });
         let current_target_max_sub_min = current_session_maxangleselected_rom.map(function(n, i) { return n - current_session_minangleselected_rom[i]; });
         let goal_reached_array = current_session_max_sub_min.map(function(n, i) { return n / current_target_max_sub_min[i]; });
         let goal_reached_array_before=  goal_reached_array.filter(n => n);
         let goal_reached_array_before_filter = goal_reached_array_before.map(num => num > 1  ? 1 : num);
        //  ////console.log(goal_reached_array_before_filter.length);
         if(goal_reached_array_before_filter.length != 0){
         let average = goal_reached_array_before_filter => goal_reached_array_before_filter.reduce((prev, curr) => prev + curr) / goal_reached_array_before_filter.length;
         let final_output = Number(average(goal_reached_array_before_filter));
         let perstage = final_output*100;
         final_perstage =  Number(Math.round(perstage))
         }else{
            final_perstage = Number(Math.round(0)); 
         }
    }
    
    
    
    let respone={
        "patientid": patientid.toString(),
        "patientname": patientname.toString(), 
        "dateofjoin" : dateofjoin.toString(),
        "patientage" :patientage.toString(),
        "patientcasedes" : patientcasedes.toString(),
        "patientcondition" : patientcondition.toString(),
        "patientgender" :patientgender.toString(),
        "patientphone" : patientphone.toString(),
        "patientemail" : patientemail.toString(),
        "patientinjured" : patientinjured.toString(),
        "patienthistory": patienthistory.toString(),
        "patientprofilepicurl":patientprofilepicurl.toString(),
        "heldon":heldon.toString(),
        "Goal_reached":final_perstage.toFixed(0),
        "session_count":session
    };
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
};






//Session Number count
exports.getsession_number_count = async function(req, res){

   let data = req.body;

  const phizioemail = data.phizioemail;
  const patientId = data.patientid;
  const date  = data.date;

    let xyz = await db.sessionDates(phizioemail,patientId);
    var sessionNo = Array.from(xyz).indexOf(date)+1;
	if(sessionNo == 0)
	{
		sessionNo = xyz.size+1;
	}

let respone={"session":sessionNo,"report":0};

        res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);

};

exports.phizio_report_download_count = async function(req, res) {
    let data = req.body;
    let message = req.body;
    
    let responceDb = await PheezeeAPI.getPhizioDetailsForLogin(JSON.stringify(req.body));
    if(responceDb=='invalid'){
        responceDb = [{'isvalid':false}];
    }
    else{
        responceDb = JSON.stringify(responceDb);
        responceDb = JSON.parse(responceDb);
        responceDb[0]['isvalid'] = true;
    }

	var session_reports=0;
	var overall_reports=0;
	for(var i=0;i<responceDb[0]['phiziopatients'].length;i++){
		
		var responseDb2 = await PheezeeAPI.findReport(data.phizioemail,responceDb[0]['phiziopatients'][i].patientid);
		
		// Getting Session report count
		
		try {
		
		for(var session_counter =0; session_counter< responseDb2[0]['sessiondetails'].length;session_counter++)
		{
			if(responseDb2[0]['sessiondetails'][session_counter].date != null)
			{
				session_reports = session_reports+1;
				
			}
			
		}
		}catch(err){
			
		}
		
		try{
		// Getting Overall report count
		for(var overall_counter = 0; overall_counter < responseDb2[0]['overalldetails'].length;overall_counter++)
		{
			if(responseDb2[0]['overalldetails'][overall_counter].date != null)
			{
				
				overall_reports = overall_reports+1;
			}
			
		}
		}catch(err){
	
		}
		
		
		
	}
// 	////console.log("FINAL COUNTS");
// 		////console.log("kranthi_ok",session_reports);
// 		////console.log(overall_reports);
		
		let response={"session_report":session_reports,"overall_reports":overall_reports};
	
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(response);
    
};


exports.get_phizio_patient_limit = async function(req, res) {
    let message = req.body;
    // Debug && ////console.log(message);
    let responceDb = await PheezeeAPI.getPatientLimit(message.phizioemail);
    // ////console.log(responceDb);
	
	let respone={"patientlimit":responceDb};
	
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
};

exports.update_phizio_patient_limit = async function(req, res) {
    let data = req.body;
    let message = req.body;
    // Debug && ////console.log(message);
    let responceDb = await PheezeeAPI.updatePatientLimit(JSON.stringify(req.body));
    // ////console.log(responceDb);
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(responceDb);
};

exports.invoice_generation = async function(req, res) {
    // Debug && ////console.log(req.body);
    let data = req.body;
    let message = req.body;
    data = JSON.stringify(data);
    data = JSON.parse(data);
	
	                // Start



  async function printPDF() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(
      `${URL}/generateinvoice/${data.phizioemail}/${data.phizioemail}/1122`,
      { waitUntil: "networkidle0" }
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: "0.5cm",
        top: "0.5cm",
        right: "0.5cm",
        bottom: "0.5cm"
      }
    });
    await browser.close();
    return pdf;
  }
  printPDF().then(pdf => {
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length
    });
	
	
	 var mailOptions = {
                from: '"Pheezee Official" <pheezee@startoonlabs.com>',
                subject: 'Pheezee Invoice',
                html: `<p>This is an auto generated email for acknowledgement.</p><p>Please file the attached invoice file.</p><br><p>Please do not reply to this email</p>`,
                to: [data.phizioemail],
                // bcc: Any BCC address you want here in an array,
                attachments: [
                    {
                        filename: "Invoice.pdf",
                        content: pdf
                    }
                ]
            };

            // ////console.log('Creating SES transporter');
            // create Nodemailer SES transporter
            var transporter = nodemailer.createTransport({
                SES: ses
            });

            // send email
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    // ////console.log(err);
                    res.status(SUCCESSFULL_HTTP_RESPONSE).send("nsent");
                } else {
                    // ////console.log('Email sent successfully');
					res.status(SUCCESSFULL_HTTP_RESPONSE).send('sent');
                }
            });
	
	
    //res.send(pdf);
	
  });
    
};
  
  
  exports.delete_phiziouser = async function (req, res) {
    // ////console.log(req.body);
    const { phizioemail, feedback, todelete, needdata } = req.body;
    const data1 = JSON.parse(JSON.stringify(req.body));
    const response = await PheezeeAPI.getPatientDataForDeletion(phizioemail);
    
    var deletePhizioUser, deletePatientData;

    if (todelete === 'user') {
        deletePhizioUser = await PheezeeAPI.deletePhizioUser(phizioemail);
        deletePatientData = 1;
    } else {
        deletePatientData = await PheezeeAPI.deletePatientEntireData(phizioemail);
        deletePhizioUser = await PheezeeAPI.deletePhizioUser(phizioemail);
    }

    var data = [];
    var twoDArray = [["S.No.", "Patient's Name", "Patient's ID"]];

    if (typeof response !== 'string') {
        response.map((e, i) => {
            data.push("<tr><td>" + i + "</td>" + "<td>" + e.patientname + "</td>" + "<td>" + e.patientid + "</td></tr>")
            twoDArray.push([`${i + 1}, ${e.patientname}, ${e.patientid}`]);
        })
    } else {
        response;
    }

    data = data.join(" ")

    let requested_data = twoDArray.map(e => e.join(",")).join("\n");

    var mailOptions = {
        from: '"Pheezee Official" <pheezee@startoonlabs.com>',
        subject: "Data Requested",
        html: '<html><body><p>The data that you have requested:</p><table border="1"><tr><th>S.No.</th><th>Patient\'s Name</th><th>Patient\'s ID</th></tr>' +
            data
            + "</table></body></html>",
        to: [phizioemail],
        bcc: 'developer.startoonlabs@gmail.com',
        // bcc: Any BCC address you want here in an array,
        attachments: [
            {
                filename: "data.csv",
                content: requested_data
            }
        ]
    };

    var transporter = nodemailer.createTransport({
        SES: ses
    });

    // send email
    if (needdata) {
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                // ////console.log(err);
                res.status(SUCCESSFULL_HTTP_RESPONSE).send("nsent");
            } else {
                if (deletePatientData !== 1) {
                    if ((deletePatientData.deletedCount && deletePhizioUser.deletedCount) !== 0) {
                        res.status(SUCCESSFULL_HTTP_RESPONSE).send("accountdeletedanddatasent");
                    }
                } else if (deletePhizioUser.deletedCount) {
                    res.status(SUCCESSFULL_HTTP_RESPONSE).send("onlyuserdatahasbeendeleted");
                } else {
                    res.status(SUCCESSFULL_HTTP_RESPONSE).send("nodatahasbeendeleted");
                }
            }
        });
    } else {
        // ////console.log(deletePatientData, deletePhizioUser.deletedCount)
        if ((deletePatientData.deletedCount && deletePhizioUser.deletedCount) !== 0) {
            res.status(SUCCESSFULL_HTTP_RESPONSE).send("accountdeletedandnorequestforemail");
        } else if (deletePhizioUser.deletedCount) {
            res.status(SUCCESSFULL_HTTP_RESPONSE).send("onlyuserdatahasbeendeletedandnorequestforemail");
        } else {
            res.status(SUCCESSFULL_HTTP_RESPONSE).send("nodatahasbeendeleted");
        }
    }
}


exports.get_warranty_details = async function (req, res) {
    let data = await DeviceHealthAPI.getWarrantyDetails(req.body);
    
    res.status(200).send(data)
}


exports.get_serial_number = async function (req, res) {
    let data = await DeviceHealthAPI.getDeviceSerialNumber(req.body);
    
    
    res.status(200).send(data);
}


exports.addCustomerDetails = async function(req, res) {
    const response = DeviceHealthAPI.addCustomerDetails(req.body);
    
    res.status(200).send(response);
};

exports.phizio_cal = async function(req,res){
    let message = req.body;
    // Debug && ////console.log(req.body);
    const response = PheezeeAPI.addCalbration(req.body);
};

exports.phizio_normative = async function(req,res){
    // Android Database
     let normative = req.body;
     let phizioemail = normative.phizioemail;
     let patientId = normative.patientid;
     let bodypart = normative.str_body_part;
     let exercisename = normative.str_exercise_name;
     let orientation = normative.patient_injured;
     let musclename = normative.str_muscle_name;
     let bodyorientation = normative.orientation;
    //  let date = normative.dateString;
    
     
     
    //**server code*//
    

    let normativeapi_cuurent = await db.normativeapi_current(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation);
  
    if(normativeapi_cuurent == 0){
        return res.status(200).send("no")
    }else{
         let last_session_emg_array = normativeapi_cuurent.map(function(x) { return x.maxemg; });
         let last_session_max_value = last_session_emg_array.sort((a,b)=> a-b)[last_session_emg_array.length-1]
         return res.status(200).send(last_session_max_value)
         
    }
    
  
       
    
};
exports.phizio_normative_ref = async function(req,res){
    // Android Database
     let normative = req.body;
     let phizioemail = normative.phizioemail;
     let patientId = normative.patientid;
     let bodypart = normative.str_body_part;
     let exercisename = normative.str_exercise_name;
     let orientation = normative.patient_injured;
     let musclename = normative.str_muscle_name;
     let bodyorientation = normative.orientation;
    
     
     
    //**server code*//
    
    let normativeapi_ref = await db.normativeapi_referance(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation);

    if(normativeapi_ref == 0){
        return res.status(200).send("no");
    }else{
         let last_session_emg_array = normativeapi_ref.map(function(x) { return x.maxemg; });
         let last_session_max_value = last_session_emg_array.sort((a,b)=> a-b)[last_session_emg_array.length-1]
         return res.status(200).send(last_session_max_value);
         
    }
    
};

exports.phizio_normative_rom = async function(req,res){
    // Android Database
     let normative = req.body;
    //  ////console.log("normative",normative);
     let phizioemail = normative.phizioemail;
     let patientId = normative.patientid;
     let bodypart = normative.str_body_part;
     let exercisename = normative.str_exercise_name;
     let orientation = normative.patient_injured;
     let musclename = normative.str_muscle_name;
     let bodyorientation = normative.orientation;
     let responce = "";
    
     
     
    //**server code*//
    
    let normativeapi_ref = await db.normativeapi_referance(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation);
    

    if(normativeapi_ref == 0){
        return res.status(200).send("0");
    }else{
        
        let sort_rom_max = normativeapi_ref.map(function(x) { return x.rom_avg_max; });
        let sort_rom_min = normativeapi_ref.map(function(x) { return x.rom_avg_min; });
        let newArr = sort_rom_min.map(num => num < 0  ? 0 : num);
        
        let absDifference = (sort_rom_max, newArr) => {
           let resk = [];
           for(let i = 0; i < sort_rom_max.length; i++){
              let el = Math.abs((sort_rom_max[i] || 0) - (newArr[i] || 0));
              resk[i] = el;
           };
           return resk;
        };
          let kranthi = absDifference(sort_rom_max, sort_rom_min);
          let last_session_max_value = kranthi.sort((a,b)=> a-b)[kranthi.length-1];
          responce = last_session_max_value.toString();
        //   ////console.log("responce",responce);
    
         
    }
      return res.status(200).send(responce);
    
};

exports.phizio_normative_ref_comp = async function(req,res){
    // Android Database
     let normative = req.body;
     let phizioemail = normative.phizioemail;
     let patientId = normative.patientid;
     let bodypart = normative.str_body_part;
     let exercisename = normative.str_exercise_name;
     let orientation = normative.patient_injured;
     let orientation_ref = normative.injuredside_ref;
     let musclename = normative.str_muscle_name;
     let bodyorientation = normative.orientation;
    
     
     
    //**server code*//
    let normativeapi_cuurent = await db.normativeapi_current(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation);
    let last_session_emg_array = normativeapi_cuurent.map(function(x) { return x.maxemg; });
    let last_session_max_value = last_session_emg_array.sort((a,b)=> a-b)[last_session_emg_array.length-1]

    
    
    let normativeapi_cuurent_ref = await db.normativeapi_referance(phizioemail,patientId,bodypart,exercisename,orientation_ref,musclename,bodyorientation);
    let last_session_emg_array_ref = normativeapi_cuurent_ref.map(function(x) { return x.maxemg; });
    let last_session_max_value_ref = last_session_emg_array_ref.sort((a,b)=> a-b)[last_session_emg_array_ref.length-1]

    
    
    let final_data = [last_session_max_value,last_session_max_value_ref]
    let last_session_max_value_final= final_data.sort((a,b)=> a-b)[final_data.length-1]
    return res.status(200).send(last_session_max_value_final);
    
       
    
};
exports.normative_data_camp = async function(req,res){
    // Android Database
     let normative = req.body;
     let phizioemail = normative.phizioemail;
     let patientId = normative.patientid;
     let bodypart = normative.str_body_part;
     let exercisename = normative.str_exercise_name;
     let orientation = normative.patient_injured;
     let orientation_ref = normative.injuredside_ref;
     let musclename = normative.str_muscle_name;
     let bodyorientation = normative.orientation;
    
     
     
    //**server code*//
    let normativeapi_cuurent = await db.normativeapi_current(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation);
    // const normativeapi_values = [normativeapi_cuurent];
    let last_session_emg_array = normativeapi_cuurent.map(function(x) { return x.maxemg; });
    let last_session_max_value = last_session_emg_array.sort((a,b)=> a-b)[last_session_emg_array.length-1]
    let normativeapi_cuurent_ref = await db.normativeapi_referance(phizioemail,patientId,bodypart,exercisename,orientation_ref,musclename,bodyorientation);
    let last_session_emg_array_ref = normativeapi_cuurent_ref.map(function(x) { return x.maxemg; });
    let last_session_max_value_ref = last_session_emg_array_ref.sort((a,b)=> a-b)[last_session_emg_array.length-1]
    let final_data = [last_session_max_value,last_session_max_value_ref]
    let last_session_max_value_final= final_data.sort((a,b)=> a-b)[last_session_emg_array.length-1]
    return res.status(200).send(last_session_max_value_final);
       
    
};
exports.current_data = async function(req,res){
    // Android Database
     let normative = req.body;
     let phizioemail = normative.phizioemail;
     let patientId = normative.patientid;
     let bodypart = normative.str_body_part;
     let exercisename = normative.str_exercise_name;
     let orientation = normative.patient_injured;
     let orientation_ref = normative.injuredside_ref;
     let orientation_selet = normative.str_side_orientation;
     let musclename = normative.str_muscle_name;
     let bodyorientation = normative.orientation;
     
    //  let date = normative.dateString;
    
     
     
    //**server code*//
    let current_array = await db.current_session_prv(phizioemail,patientId,bodypart,exercisename,orientation_selet,musclename,bodyorientation);
    
    if(current_array == 0){
        return res.status(200).send("no");
    }else{
         let last_session_cur_emg_array = current_array.map(function(x) { return x.maxemg; });
         let last_session_max_value = last_session_cur_emg_array.sort((a,b)=> a-b)[last_session_cur_emg_array.length-1]
         return res.status(200).send(last_session_max_value);
         
    }
    
       
    
};




exports.view_data_value = async function(req, res){

   let data = req.body;
  const phizioemail = data.phizioemail;
  const patientid = data.patientid;

 

 

var report = await db.getsession_report_count_ind(phizioemail,patientid);
        var session_report_count=0;
        var session_report_data=[];
        var kranthi_testing = [];
        var kranthi = 0;
        
        
        var session_count=0;
        var report_count=0;
        var report_count_data=new Array();
        
         for(var i =0; i<report.length;i++)
         {
        
            session_count = session_count + report[i].sessiondetails.length;
        
            var session_report={};
            var overall_report={};
            for(var j=0; j<report[i].sessiondetails.length; j++)
            {
             var heldon_array = report[i].sessiondetails[j].heldon.split(' ')[0];
             session_report_data.push(heldon_array);
             
             if(!(heldon_array[0] in session_report)){
                      session_report[heldon_array[0]]=0;
                  }
        
            if(!(report[i].sessiondetails[j].bodypart in overall_report)){
                      overall_report[report[i].sessiondetails[j].bodypart]=0;
                  }
            }
            session_report_count = session_report_count + Object.values(session_report).length;
           
         }
           
        // ////console.log("session_report_data",session_report_data); 
        
        let uniqueChars = [...new Set(session_report_data)];

        // ////console.log(uniqueChars.length);
        
        
        
        let respone=session_count.toString();
        
   
        
                res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
};


exports.view_data_value_last = async function(req, res){

  let data = req.body;
  const phizioemail = data.phizioemail;
  const patientid = data.patientid;

 //**server code*//
    let current_array = await db.goal_reached(phizioemail,patientid);
    
    if(current_array == "no_session"){
        return res.status(200).send("-");
    }else{
         let last_session_cur_emg_array = current_array.map(function(x) { return x.heldon; });
         let last_session_max_value = last_session_cur_emg_array.sort((a,b)=> a-b)[last_session_cur_emg_array.length-1]
         let date = last_session_max_value.split(' ')[0];
         let kranthi_testing = new Date(date).toLocaleDateString();
         
         return res.status(200).send(date);
    }
};

exports.view_data_value_report = async function(req, res){

   let data = req.body;
  const phizioemail = data.phizioemail;
  const patientid = data.patientid;

 

 

var report = await db.getsession_report_count_ind(phizioemail,patientid);
        var session_report_count=0;
        var session_report_data=[];
        var kranthi_testing = [];
        var kranthi = 0;
        
        
        
        var session_count=0;
        var report_count=0;
        var report_count_data=new Array();
        
         for(var i =0; i<report.length;i++)
         {
        
            session_count = session_count + report[i].sessiondetails.length;
        
            var session_report={};
            var overall_report={};
            for(var j=0; j<report[i].sessiondetails.length; j++)
            {
             var heldon_array = report[i].sessiondetails[j].heldon.split(' ')[0];
             session_report_data.push(heldon_array);
             
             if(!(heldon_array[0] in session_report)){
                      session_report[heldon_array[0]]=0;
                  }
        
            if(!(report[i].sessiondetails[j].bodypart in overall_report)){
                      overall_report[report[i].sessiondetails[j].bodypart]=0;
                  }
            }
            session_report_count = session_report_count + Object.values(session_report).length;
           
         }
           
        // ////console.log("session_report_data",session_report_data); 
        
        let uniqueChars = [...new Set(session_report_data)];

        // ////console.log(uniqueChars.length);
        
        
        
        let respone=uniqueChars.length.toString();
        
        
        
                res.status(SUCCESSFULL_HTTP_RESPONSE).send(respone);
};

exports.view_data_value_goal = async function(req, res){
    
    let data = req.body;
    // ////console.log(data)

    let phizioemail = data.phizioemail;
    let patientId = data.patientid;
    let date = "0";
    let final_perstage = 0;
    
     let current_array = await db.goal_reached(phizioemail,patientId);
    
    if(current_array != "no_session"){
     
        
         let last_session_cur_emg_array = current_array.map(function(x) { return x.heldon; });
         let last_session_max_value = last_session_cur_emg_array.sort((a,b)=> a-b)[last_session_cur_emg_array.length-1]
         date = last_session_max_value.split(' ')[0];
  
    
    
    
    
    
    let report = await db.DailyReport(phizioemail, patientId, date);
                report.flat();
                
   let seession_value = report.map(function(x) { return x.sessiondetails; });
    let session_data = seession_value.flat();
    
            
                
  let current_session_min_rom = session_data.map(function(x) { return x.minangle; });
  let current_session_max_rom = session_data.map(function(x) { return x.maxangle; });   
  
  let current_session_maxangleselected_rom = session_data.map(function(x) { return x.maxangleselected; });
  let current_session_minangleselected_rom = session_data.map(function(x) { return x.minangleselected; });
  
   
   
   
    let current_session_max_sub_min = current_session_max_rom.map(function(n, i) { return Math.abs(n - current_session_min_rom[i]); });
  let current_target_max_sub_min = current_session_maxangleselected_rom.map(function(n, i) { return n - current_session_minangleselected_rom[i]; });
  let goal_reached_array = current_session_max_sub_min.map(function(n, i) { return n / current_target_max_sub_min[i]; });
    let goal_reached_arrays = goal_reached_array.map(function(value) {
        if (isNaN(value)) {
            return 1; // replace NaN with 0
        } else {
            return value; // keep non-NaN values as they are
        }
    });
            // ////console.log("goal_reached_array_before",goal_reached_arrays);
         let goal_reached_array_before =  goal_reached_arrays.filter(n => n);
        
         let goal_reached_array_before_filter = goal_reached_array_before.map(num => num > 1  ? 1 : num);
        //  ////console.log("goal_reached_array_before_filter",goal_reached_array_before_filter);
         if(goal_reached_array_before_filter.length != 0){
         let average = goal_reached_array_before_filter => goal_reached_array_before_filter.reduce((prev, curr) => prev + curr) / goal_reached_array_before_filter.length;
         let final_output = Number(average(goal_reached_array_before_filter));
         let perstage = final_output*100;
         final_perstage =  Number(Math.round(perstage))
        //  //console.log(final_perstage)
        return res.status(200).send(final_perstage.toFixed(0));
         }else if(goal_reached_array_before_filter.length == 0){
            final_perstage = Number(Math.round(0)); 
            return res.status(200).send(final_perstage.toFixed(0));
         }
    }
    else{
        res.status(200).send("-");
    }
                
                
                
    
    
    
    
    

    //   let data = req.body;
    //   //console.log("kranthi_data",data);
    //   const phizioemail = data.phizioemail;
    //   const patientid = data.patientid;
    //   let final_perstage = 0;
      
    //   //**server code*//
    // let current_array = await db.goal_reached(phizioemail,patientid);
    
    //   //console.log("sort_rom_min",current_array);
    
    // if(current_array == "no_session"){
    //     return res.status(200).send("0");
    // }else{
    //      let current_session_min_rom = current_array.map(function(x) { return x.minangle; });
    //      let current_session_max_rom = current_array.map(function(x) { return x.maxangle; });
    //       current_session_max_rom.map(function (x,i){
    //           if (x>0 && current_session_min_rom[i]<0){
    //               current_session_min_rom[i]=0;
    //           }
    //       });
        
          
         
    //      let current_session_maxangleselected_rom = current_array.map(function(x) { return x.maxangleselected; });
    //      let current_session_minangleselected_rom = current_array.map(function(x) { return x.minangleselected; });
         
    //     //  let current_session_min_rom_remove_netive = current_session_min_rom.map(num => num < 0  ? 0 : num);
    //      let current_session_max_sub_min = current_session_max_rom.map(function(n, i) { return Math.abs(Math.abs(n) - Math.abs(current_session_min_rom[i])); });
    //      //console.log("current_session_max_sub_min",current_session_max_sub_min);
    //      let current_target_max_sub_min = current_session_maxangleselected_rom.map(function(n, i) { return n - current_session_minangleselected_rom[i]; });
    //      let goal_reached_array = current_session_max_sub_min.map(function(n, i) { return n / current_target_max_sub_min[i]; });
    //      let goal_reached_array_before =  goal_reached_array.filter(n => n);
    //      let goal_reached_array_before_filter = goal_reached_array_before.map(num => num > 1  ? 1 : num);
    //      //console.log(goal_reached_array_before_filter);
    //      if(goal_reached_array_before_filter.length != 0){
    //      let average = goal_reached_array_before_filter => goal_reached_array_before_filter.reduce((prev, curr) => prev + curr) / goal_reached_array_before_filter.length;
    //      let final_output = Number(average(goal_reached_array_before_filter));
    //      let perstage = final_output*100;
    //      final_perstage =  Number(Math.round(perstage))
    //      //console.log(final_perstage)
    //     return res.status(200).send(final_perstage.toFixed(0));
    //      }else{
    //         final_perstage = Number(Math.round(0)); 
    //         return res.status(200).send(final_perstage.toFixed(0));
    //      }
        
        
        
        
       
         
       
        
                 
        
        
    // }
      
      
      
     
     
      

       
};

exports.recommanded_assigment_effected_side = async function(req, res){
    
     let data = req.body;

     
     let phizioemail = data.phizioemail;
    let patientId = data.patientid;
    let injured_side = data.injured_side;
    
    let current_array = await db.recommanded_assigment_value(phizioemail,patientId,injured_side);
    // //console.log("55555555555555555",current_array);
    
    // function removeDuplicatesByParameters(array, parameters) {
    //       const uniqueValues = new Set();
          
    //       return array.filter(obj => {
    //         const value = parameters.map(parameter => obj[parameter]).join('|');
            
    //         if (!uniqueValues.has(value)) {
    //           uniqueValues.add(value);
    //           return true;
    //         }
            
    //         return false;
    //       });
    //     }
        
        
     function removeDuplicatesByParameters(arr, parameters) {
              const uniqueValues = {};
              const result = [];
            
              for (let i = arr.length - 1; i >= 0; i--) {
                const item = arr[i];
                const key = parameters.map(param => item[param]).join('|');
            
                if (!uniqueValues.hasOwnProperty(key)) {
                  uniqueValues[key] = true;
                  result.unshift(item); // Add the item to the beginning of the result array
                }
              }
            
              return result;
            }
        
        
        
        const originalArray  = current_array;
        const parameters = ['bodypart', 'bodyorientation', 'exercisename', 'musclename'];
        const newArray = removeDuplicatesByParameters(originalArray, parameters);
            
    let bodypart = newArray.map(function(x) { return x.bodypart; });
    let exercisename = newArray.map(function(x) { return x.exercisename; });  
     let musclename = newArray.map(function(x) { return x.musclename; }); 
     let heldon = newArray.map(function(x) { return x.heldon.split(' ')[0]; }); 
    let responce = {"exercisename":exercisename.toString(),"musclename":musclename.toString(), "heldon":heldon.toString(), "bodypart":bodypart.toString()};
                
  res.status(200).send(responce);
       
};

exports.recommanded_assigment_non_effected_side = async function(req, res){
    
     let data = req.body;
    //  //console.log("kranthi_kiran_burra",data);
     let phizioemail = data.phizioemail;
     let patientId = data.patientid;
     let injured_side = data.injured_side;
     if(injured_side == "Left"){
         injured_side ="Right"
     }else if(injured_side == "Right"){
       injured_side = "Left"  
     }
    
    
    let current_array = await db.recommanded_assigment_value(phizioemail,patientId,injured_side);
    // //console.log("kranthi_testing",current_array);
    
    function removeDuplicatesByParameters(array, parameters) {
          const uniqueValues = new Set();
          
          return array.filter(obj => {
            const value = parameters.map(parameter => obj[parameter]).join('|');
            
            if (!uniqueValues.has(value)) {
              uniqueValues.add(value);
              return true;
            }
            
            return false;
          });
        }
        
        const originalArray  = current_array;
        const parameters = ['bodypart', 'bodyorientation', 'exercisename', 'musclename'];

        const newArray = removeDuplicatesByParameters(originalArray, parameters);
            
    
    
    
    
    let bodypart = newArray.map(function(x) { return x.bodypart; });

    let exercisename = newArray.map(function(x) { return x.exercisename; });  
     let musclename = newArray.map(function(x) { return x.musclename; }); 
     let heldon = newArray.map(function(x) { return x.heldon.split(' ')[0]; }); 
    let responce = {"exercisename":exercisename.toString(),"musclename":musclename.toString(), "heldon":heldon.toString(), "bodypart":bodypart.toString() };
                
  res.status(200).send(responce);
       
};

exports.recommanded_assigment_bilateral = async function(req, res){
    
     let data = req.body;
     let phizioemail = data.phizioemail;
    let patientId = data.patientid;
    let orientation = data.orientation;
    
    let current_array = await db.recommanded_assigment_value_bilateral(phizioemail,patientId,orientation);
    
    function removeDuplicatesByParameters(array, parameters) {
          const uniqueValues = new Set();
          
          return array.filter(obj => {
            const value = parameters.map(parameter => obj[parameter]).join('|');
            
            if (!uniqueValues.has(value)) {
              uniqueValues.add(value);
              return true;
            }
            
            return false;
          });
        }
        
        const originalArray  = current_array;
        const parameters = ['bodypart', 'bodyorientation', 'exercisename', 'musclename'];
        const newArray = removeDuplicatesByParameters(originalArray, parameters);
     let bodypart = newArray.map(function(x) { return x.bodypart; });
    let exercisename = newArray.map(function(x) { return x.exercisename; });  
     let musclename = newArray.map(function(x) { return x.musclename; }); 
     let heldon = newArray.map(function(x) { return x.heldon.split(' ')[0]; }); 
    let responce = {"exercisename":exercisename.toString(),"musclename":musclename.toString(), "heldon":heldon.toString(), "bodypart":bodypart.toString()};
                
  res.status(200).send(responce);
       
};

exports.session_summary_health = async function(req, res){
    
     let data = req.body;
    //  //console.log("222222222222222222222222222222222222", data);
     let phizioemail = data.phizioemail;
    let patientId = data.patientid;
    let orientation = data.injured_side;
    let bodypart = data.bodypart;
    let bodyorientation = data.bodyorientation;
    let musclename = data.musclename;
    let exercisename = data.exercisename;
    
    let current_array = await db.session_summary_health_db(phizioemail,patientId,orientation,bodypart,bodyorientation,exercisename,musclename);
    // //console.log("99999999999999999999999999999",current_array);
    
    if(current_array == "no_session"){
         let responce = {"max_emg":"-".toString(),"max_rom":"-"};
    // let responce = current_array;
         res.status(200).send(responce);
        
    }else{
        
    let maxemg = current_array.map(function(x) { return x.maxemg; });
    let max_emg = Math.max(...maxemg.map(Number));
    let maxangle = current_array.map(function(x) { return x.maxangle; }); 
    let minangle = current_array.map(function(x) { return x.minangle; });
    const min = minangle;
    const max = maxangle;
    const result = max.map((value, index) => Number(value) - Number(min[index]));
     let max_rom = Math.max(...result.map(Number));
  
    let responce = {"max_emg":max_emg.toString(),"max_rom":max_rom.toString()};
    // let responce = current_array;
    
                
  res.status(200).send(responce);
    }
    
       
};

exports.testing_last = async function(req, res){
    
     let data = req.body;
    //  //console.log("kranthi_kiran_burra",data);
     let phizioemail = data.phizioemail;
     let patientId = data.patientid;
     let injured_side = data.injured_side;
     if(injured_side == "Left"){
         injured_side ="Right"
     }else if(injured_side == "Right"){
       injured_side = "Left"  
     }
    
    
    let current_array = await db.testing_kranthi_value(phizioemail,patientId,injured_side);
    // //console.log("kranthi_testing",current_array);
  
                
  res.status(200).send(current_array);
       
};

exports.buy_printer_api = async function(req, res){
    
    // //console.log("555555555555555555555",req.body);
    let data = req.body;

    let phizioemail = data.pt_email;
    let phizioname = data.pt_name;
    let phiziophone = data.pt_phone;
    
    
    var status;
    
 const nodemailer = require('nodemailer');

        async function sendEmail() {
          // Create a transporter object
          const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'developer.startoonlabs@gmail.com',
              pass: 'oksrdxbvahawabqy'
            }
          });
        
          // Define the email content
          const mailOptions = {
            from: 'developer.startoonlabs@gmail.com',
            to: 'care@startoonlabs.com',
            subject: 'Buy the Pheezee Printer', 
            text: 'Hello Team, This is Dr.'+ phizioname + ' Phone.no ' + phiziophone + ' email id ' + phizioemail + ' I am intrested in Buy the Pheezee Printer ',
          };
        
          try {
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            //console.log('Email sent:', info.response);
            status = "Sucessfull";
          } catch (error) {
            //console.log('Error:', error);
            status = error ;
          }
        }

        sendEmail();
        


res.status(200).send(status);
     

};

exports.buy_report_api = async function(req, res){
    
    //console.log("555555555555555555555",req.body);
    let data = req.body;

    let phizioemail = data.pt_email;
    let phizioname = data.pt_name;
    let phiziophone = data.pt_phone;
    let amount =  data.pt_amount;
    
    
    var status;
    
 const nodemailer = require('nodemailer');

        async function sendEmail() {
          // Create a transporter object
          const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'developer.startoonlabs@gmail.com',
              pass: 'oksrdxbvahawabqy'
            }
          });
        
          // Define the email content
          const mailOptions = {
            from: 'developer.startoonlabs@gmail.com',
            to: 'care@startoonlabs.com',
            subject: 'Buy the Pheezee Printer', 
            text: 'Hello Team, This is Dr.'+ phizioname + ' Phone.no ' + phiziophone + ' email id ' + phizioemail + ' I am intrested in Buy the Pheezee report worth of ' + amount,
          };
        
          try {
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            //console.log('Email sent:', info.response);
            status = "Sucessfull";
          } catch (error) {
            //console.log('Error:', error);
            status = error ;
          }
        }

        sendEmail();
        


res.status(200).send(status);
     

};

exports.buy_printer_api_data = async function(req, res){
    //console.log("555555555555555555555",req.body);
    
    let data = req.body;
    let phizioemail = data.pt_email;
    
    let phisiodata = await db.getUsersData();
    
    const filtered_data = phisiodata.filter(e => e.phizioemail === phizioemail);
    
     let pt_name = filtered_data.map(function(x) { return x.phizioname; });
     let pt_email = filtered_data.map(function(x) { return x.phizioemail; });
     let pt_phone = filtered_data.map(function(x) { return x.phiziophone; });
     
     
     let responce = {"pt_name":pt_name.toString(),"pt_email":pt_email.toString(), "pt_phone":pt_phone.toString()};

    
                
  res.status(200).send(responce);
    
    
    
     

};

exports.reports_sub = async function(req, res){
         let data = req.body;
         //console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqq",data);
  
        let total_report_count;
        let respone_final;
        
        /*This Functionality get report count*/
         const phizioemail = data.PhizioEmail;
         var report = await db.getsession_report_count(phizioemail);
 
 
         let transformed_array = report.map((item) => {
            let sessiondetails = item.sessiondetails.map((session) => {
                return { heldon: session.heldon };
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails,
            };
        });
        
        let transformed_array_2 = transformed_array.map((item) => {
            let sessiondetails = item.sessiondetails.map((session) => {
                return { heldon: session.heldon.substring(0, 10) };
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails
            };
        });
        
        let modified_array = transformed_array_2.map((item) => {
            let sessiondetails = item.sessiondetails.filter((session, index, self) => {
                return index === self.findIndex((s) => s.heldon === session.heldon);
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails
            };
        });
        
        let modified_array_final = modified_array.map((item) => {
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: item.sessiondetails.length.toString()
            };
        });
         
        let session_reports_array = modified_array_final.map(function(x) { return x.sessiondetails; });
        total_report_count = session_reports_array.reduce((accumulator, currentValue) => {
          return parseInt(accumulator) + parseInt(currentValue);
        }, 0);
        

    
    
    /*new report functionality fetch data from the db*/
    
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join(__dirname, 'report_records.json');
    
    const readFileAsync = (filePath) => {
      return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            reject(err);
            return;
          }
    
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      });
    };
    
    (async () => {
      try {
        const jsonData = await readFileAsync(filePath);
        const filteredArray = jsonData.filter(obj => obj.Phisioemail === phizioemail);
        let customer_type = filteredArray.map(function(x) { return x.customer_type_status; });
        let start_date = filteredArray.map(function(x) { return x.start_date; });
        let end_date = filteredArray.map(function(x) { return x.end_date; });
        let report_generated = filteredArray.map(function(x) { return x.number_of_report; });
        let number_of_accessable_generate = filteredArray.map(function(x) { return x.number_of_accessable_generate; });
        let amount = filteredArray.map(function(x) { return x.amount_worth_report; }); 
        let report_gta = total_report_count - report_generated;
         respone_final = {
                "customer_type": customer_type.toString(),
                "start_date": start_date.toString(),
                "end_date": end_date.toString(),
                "report_generated": report_generated.toString(),
                "number_of_accessable_generate": number_of_accessable_generate.toString(),
                "amount": amount.toString()
                }
        res.status(200).send(respone_final);
        
      } catch (error) {
        console.error('Error reading file:', error);
      }
    })();

 

};



exports.reports_sub_update = async function(req, res){
        let User_data_fetch=[];
        const currentDate = new Date();

            const day = String(currentDate.getDate()).padStart(2, '0');
            const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is 0-based
            const year = currentDate.getFullYear();
            
            const formattedDate = `${day}-${month}-${year}`;
            
        User_data_fetch = await db.getnewreportdata();
         
        const fs = require('fs');
        const path = require('path');
        
        // Current array
        const currentArray = User_data_fetch;
        
        // Path to the JSON file
        const filePath = path.join(__dirname, 'report_records.json');
        
        // Read the JSON file
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
        
          let jsonContent = JSON.parse(data);
        
          // Check if each email from the current array exists in the JSON file
          currentArray.forEach(item => {
            const emailExists = jsonContent.some(record => record.Phisioemail === item.phizioemail);
            
            if (!emailExists) {
              const newRecord = {
                Phisioemail: item.phizioemail,
                customer_type_status: 'null',
                start_date: formattedDate,
                end_date: formattedDate,
                number_of_report: 0,
                amount_worth_report: 0,
                number_of_accessable_generate: 0,
                status: false
              };
              jsonContent.push(newRecord);
            }
          });
        
          // Write the updated JSON back to the file
          fs.writeFile(filePath, JSON.stringify(jsonContent, null, 2), err => {
            if (err) {
              console.error(err);
              return;
            }
            res.status(SUCCESSFULL_HTTP_RESPONSE).send("JSON file updated successfully!");
            // //console.log();
          });
        });
                 
         
         
     
    
    
       
};
exports.reports_sub_update_values = async function(req, res){
    let data = req.body;
    //console.log("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",data);
    let Phisioemail = data.Phisioemail;
    let customer_type_status = data.customer_type_status;
    let start_date = data.start_date;
    let end_date = data.end_date;
    let number_of_report = data.number_of_report;
    let amount_worth_report;
    let number_of_accessible_generate = data.number_of_accessible_generate;
    let status = data.status;
     let total_report_count;
    
      var report = await db.getsession_report_count(Phisioemail);
 
 
         let transformed_array = report.map((item) => {
            let sessiondetails = item.sessiondetails.map((session) => {
                return { heldon: session.heldon };
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails,
            };
        });
        
        let transformed_array_2 = transformed_array.map((item) => {
            let sessiondetails = item.sessiondetails.map((session) => {
                return { heldon: session.heldon.substring(0, 10) };
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails
            };
        });
        
        let modified_array = transformed_array_2.map((item) => {
            let sessiondetails = item.sessiondetails.filter((session, index, self) => {
                return index === self.findIndex((s) => s.heldon === session.heldon);
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails
            };
        });
        
        let modified_array_final = modified_array.map((item) => {
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: item.sessiondetails.length.toString()
            };
        });
         
        let session_reports_array = modified_array_final.map(function(x) { return x.sessiondetails; });
         total_report_count = session_reports_array.reduce((accumulator, currentValue) => {
          return parseInt(accumulator) + parseInt(currentValue);
        }, 0);
   
    //  number_of_report = total_report_count; 
    amount_worth_report = number_of_report * 200;
    
    
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join(__dirname, 'report_records.json');
    const targetEmail = Phisioemail;
    
    // Read the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
    
      try {
        // Parse the JSON data
        const records = JSON.parse(data);
    
        // Find the object with matching email
        const targetRecord = records.find((record) => record.Phisioemail === targetEmail);
    
        if (targetRecord) {
          // Update the properties of the target record
          targetRecord.customer_type_status = customer_type_status;
          targetRecord.start_date = start_date;
          targetRecord.end_date = end_date;
          targetRecord.number_of_report = parseInt(number_of_report);
          targetRecord.amount_worth_report = amount_worth_report;
          targetRecord.number_of_accessable_generate = number_of_accessible_generate;
          
          targetRecord.status = status;
    
          // Convert the updated data back to JSON string
          const updatedData = JSON.stringify(records, null, 2);
    
          // Write the updated JSON back to the file
          fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
              console.error(err);
              return;
            }
            res.status(SUCCESSFULL_HTTP_RESPONSE).send("File updated successfully!");
            // //console.log('');
          });
        } else {
           res.status(SUCCESSFULL_HTTP_RESPONSE).send("No record found with email");
        //   //console.log(`No record found with email: ${targetEmail}`);
        }
      } catch (err) {
              res.status(SUCCESSFULL_HTTP_RESPONSE).send("Error parsing JSON", err);
        // console.error('Error parsing JSON:', err);
      }
    });

    
 
  
        // res.status(SUCCESSFULL_HTTP_RESPONSE).send("OK");

};

exports.session_summary_opt = async function(req, res){
 let data = req.body;
 //console.log("555555555555555555555555555555555555555555",data);
 /*This Functionality get report count*/
   
        let respone_final;
        
        /*This Functionality get report count*/
         const phizioemail = data.phizioemail;
         var report = await db.getsession_report_count(phizioemail);
 
 
         let transformed_array = report.map((item) => {
            let sessiondetails = item.sessiondetails.map((session) => {
                return { heldon: session.heldon };
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails,
            };
        });
        
        let transformed_array_2 = transformed_array.map((item) => {
            let sessiondetails = item.sessiondetails.map((session) => {
                return { heldon: session.heldon.substring(0, 10) };
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails
            };
        });
        
        let modified_array = transformed_array_2.map((item) => {
            let sessiondetails = item.sessiondetails.filter((session, index, self) => {
                return index === self.findIndex((s) => s.heldon === session.heldon);
            });
        
            return {
                _id: item._id,
                phizioemail: item.phizioemail,
                patientid: item.patientid,
                sessiondetails: sessiondetails
            };
        });
        
        const array = modified_array;
        
        const start_date = data.start_time;
        const end_date = data.end_time;
        
        const startDate = new Date(start_date.split("-").reverse().join("-"));
        const endDate = new Date(end_date.split("-").reverse().join("-"));
        
        const filteredArray = array.map(item => {
          const sessiondetails = item.sessiondetails.filter(session => {
            const heldon = new Date(session.heldon);
            return heldon >= startDate && heldon <= endDate;
          });
        
          return {
            ...item,
            sessiondetails
          };
        });
        
        
        const filteredData2 = filteredArray.map((item) => ({
          _id: item._id,
          phizioemail: item.phizioemail,
          patientid: item.patientid,
          sessiondetails: item.sessiondetails.length,
        }));
        
         let session_reports_array = filteredData2.map(function(x) { return x.sessiondetails; });
             let total_report_count = session_reports_array.reduce((accumulator, currentValue) => {
                  return parseInt(accumulator) + parseInt(currentValue);
                }, 0);
        
    //console.log("88888888888888888888888888888888888888",total_report_count);
        
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(String(total_report_count));

  
  
        // res.status(SUCCESSFULL_HTTP_RESPONSE).send(total_report_count);

};

exports.device_records = async function(req, res){
 
    let data = await db.health();
    
 
    const transformedArray = data.flatMap((obj) => {
    const { uid, mac, phizioemails } = obj;

      return phizioemails.map((emailObj) => {
        const { phizioemail, time_stamp } = emailObj;
        const timestampParts = time_stamp;
        // const formattedTimeStamp = timestampParts[0];
    
        return {
          uid,
          mac,
          phizioemail,
          time_stamp: timestampParts
        };
      });
    });
    
 
 
  res.status(SUCCESSFULL_HTTP_RESPONSE).send(transformedArray);
 

};

exports.user_report_count = async function(req, res){
 
   
    let data2 = await db.kranthi_data_k();
    
    const transformedArray2 = data2.map((obj) => {
      const { _id, phizioemail, patientid, sessiondetails } = obj;
      const sessionHeldOns = sessiondetails.map((session) => session.heldon);
    
      return {
        _id,
        phizioemail,
        patientid,
        sessiondetails: sessionHeldOns
      };
    });
    
    transformedArray2.forEach((item) => {
      item.sessiondetails = item.sessiondetails.map((date) => date.split(" ")[0]);
      item.sessiondetails = Array.from(new Set(item.sessiondetails));
    });
        transformedArray2.forEach((item) => {
      item.sessiondetails = item.sessiondetails.length.toString();
    });
    

        let output = transformedArray2.reduce((result, item) => {
      const existingItem = result.find((obj) => obj.phizioemail === item.phizioemail);
              if (existingItem) {
                existingItem.sessiondetails = (parseInt(existingItem.sessiondetails) + parseInt(item.sessiondetails)).toString();
              } else {
                result.push({ phizioemail: item.phizioemail, sessiondetails: item.sessiondetails });
              }
              return result;
            }, []);

 

 
 
  res.status(SUCCESSFULL_HTTP_RESPONSE).send(output);
 

};

exports.user_name_password = async function(req, res){
 
  
    let data = await db.getUsersData();

 
 
    res.status(SUCCESSFULL_HTTP_RESPONSE).send(data);
 

};

exports.premium_pop = async function(req, res) {
    let data = req.body;
    let phizioemail = data.phizioemail;
    let final_data;
    let respone_final;
    //console.log("9999999999999999999999",phizioemail);
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');
    
    try {
        // Read the JSON file
        const jsonData = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(jsonData);
        const filteredData = parsedData.filter(item => item.Phisioemail === phizioemail);
        
        if (filteredData.length > 0) {
          const selectedData = filteredData[0];
          
          if (selectedData.customer_type_status !== 'null' && selectedData.status !== false) {
              final_data = "1"
          } else {
              final_data = "0"
          }
        } else {
          //console.log('Email not found');
        }
        
        respone_final = {"status": final_data.toString()}
        // Send the JSON data as response
        res.status(200).json(respone_final);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.premium_pop_status_update = async function(req, res) {
    let data = req.body;
    let phisioemail = data.phizioemail; // Fix typo: change phizioemail to Phisioemail
    
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');
    
    try {
        // Read the JSON file
        const jsonData = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(jsonData);

        // Find the item with matching Phisioemail
        const itemToUpdate = parsedData.find(item => item.Phisioemail === phisioemail);
        
        if (itemToUpdate) {
            // Update the status to false
            itemToUpdate.status = false;

            // Write the updated data back to the file
            fs.writeFileSync(filePath, JSON.stringify(parsedData, null, 2), 'utf8');

            res.status(200).json({ message: 'Status updated successfully' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        console.error('Error reading/writing JSON file:', error);
        res.status(500).send('Internal Server Error');
    }
};



exports.report_all_user = async function(req, res){
 
   
    let data2 = await db.kranthi_data_k();
     let data = await db.getUsersData();
    
    const transformedArray2 = data2.map((obj) => {
      const { _id, phizioemail, patientid, sessiondetails } = obj;
      const sessionHeldOns = sessiondetails.map((session) => session.heldon);
    
      return {
        _id,
        phizioemail,
        patientid,
        sessiondetails: sessionHeldOns
      };
    });
    
    transformedArray2.forEach((item) => {
      item.sessiondetails = item.sessiondetails.map((date) => date.split(" ")[0]);
      item.sessiondetails = Array.from(new Set(item.sessiondetails));
    });
    
        const outputArray = transformedArray2.reduce((result, obj) => {
          const sessions = obj.sessiondetails.map((date) => ({
            _id: obj._id,
            phizioemail: obj.phizioemail,
            patientid: obj.patientid,
            sessiondetails: date
          }));
        
          result.push(...sessions);
          return result;
        }, []);
    
    
   const convertedArray = [];
    const phizio = data[0];
    const phizioPatients = phizio.phiziopatients;
    
    for (const patient of phizioPatients) {
        convertedArray.push({
            phizioname: phizio.phizioname,
            phizioemail: phizio.phizioemail,
            phiziophone: phizio.phiziophone,
            patientname: patient.patientname,
            patientid: patient.patientid
        });
    }

 

 
 
  res.status(SUCCESSFULL_HTTP_RESPONSE).send(outputArray);
 

};



exports.report_count_update = async function(req, res) {
    try {
        const data = req.body;
        const phisioemail = data.phizioemail; // Correct the typo
        
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');
        
        fs.readFile(filePath, 'utf8', (err, fileData) => {
            if (err) {
                console.error('Error reading file:', err);
                return res.status(SUCCESSFULL_HTTP_RESPONSE).send('Error reading file.');
            }

            try {
                const dataArray = JSON.parse(fileData);
                const inputEmail = phisioemail;
                const filteredArray = dataArray.filter(item => item.Phisioemail === inputEmail);

                if (filteredArray.length === 0) {
                    return res.status(SUCCESSFULL_HTTP_RESPONSE).send('Email not found.');
                }

                if (filteredArray[0].number_of_report === undefined) {
                    filteredArray[0].number_of_report = 1;
                } else {
                    filteredArray[0].number_of_report += 1;
                }

                fs.writeFile(filePath, JSON.stringify(dataArray, null, 2), 'utf8', err => {
                    if (err) {
                        console.error('Error writing file:', err);
                        return res.status(SUCCESSFULL_HTTP_RESPONSE).send('Error writing file.');
                    }
                    res.status(SUCCESSFULL_HTTP_RESPONSE).send(filteredArray);
                });
            } catch (parseError) {
                console.error('Error parsing data:', parseError);
                return res.status(SUCCESSFULL_HTTP_RESPONSE).send('Error parsing data.');
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(SUCCESSFULL_HTTP_RESPONSE).send('Error.');
    }
};

exports.login_force_update = async function(req, res) {
      const data = req.body;
      //console.log("9999999999999999999999",data);
      let customerTypeStatusArray_status = null;
      let data_user_information = await db.getUsersData();
      const inputPhizioEmail = data.phizioemail;
      const filteredData = [];
    
        for (const user of data_user_information) {
            if (user.phizioemail === inputPhizioEmail) {
                filteredData.push({
                    phizioemail: user.phizioemail,
                    app_version: user.app_version
                });
            }
        }
        
        const customerTypeStatusArray_db = filteredData.map(item => item.app_version);
         customerTypeStatusArray_status = customerTypeStatusArray_db.toString();
         
         if (customerTypeStatusArray_status === '3.3.0') {
             let responce = {"status":"Pass"};
        return res.status(SUCCESSFULL_HTTP_RESPONSE).send(responce);
      } else {
        let responce = {"status":"Fail"};
        return res.status(SUCCESSFULL_HTTP_RESPONSE).send(responce);
      }
   
    
};

exports.session_count_status = async function(req, res) {
    let data = req.body;
    //console.log("999999999999999999999999999999999",data);
    let phizioEmail = data.PhizioEmail;
    let patientId = data.PatientId;
    let responce;
    let session_data = await db.kranthi_data_k();
        // Function to filter data based on phizioemail and patientid
    function filterDataByPhizioEmailAndPatientId(session_data, phizioemail, patientid) {
        return session_data.filter(item => item.phizioemail === phizioemail && item.patientid === patientid);
    }
    
    const filteredData = filterDataByPhizioEmailAndPatientId(session_data, phizioEmail, patientId);
    
    const givenDate = "2023-08-17"; // Given date in the format "YYYY-MM-DD"

        // Filter sessions based on the given date
        const filteredSessions = filteredData.map(item => ({
            _id: item._id,
            phizioemail: item.phizioemail,
            patientid: item.patientid,
            sessiondetails: item.sessiondetails.filter(session => session.heldon.startsWith(givenDate)).length
        }));
        
        // Loop through the array and check the sessiondetails value
            filteredSessions.forEach(item => {
                if (item.sessiondetails === 20) {
                responce = {"status":"No Limit", "count_status":item.sessiondetails};
                    //console.log("sessiondetails is 20");
                    // Your code for when sessiondetails is 20
                } else {
                 responce = {"status":"Yes Limit", "count_status":item.sessiondetails};
                    ////console.log("sessiondetails is not 20");
                    // Your code for when sessiondetails is not 20
                }
            });
    
   return res.status(SUCCESSFULL_HTTP_RESPONSE).send(responce);
    
};

exports.max_exeises = async function(req, res) {
    let data = req.body;
    let phizioemail = data.phizioemail;
    let patientId = data.patientid;
    let date = data.heldon;
    
    const inputDate = date;
    const parts = inputDate.split('-');
    
    const year = parts[0];
    const month = parts[1].padStart(2, '0'); // Pad with leading zero if necessary
    const day = parts[2].padStart(2, '0');   // Pad with leading zero if necessary
    
    const formattedDate = `${year}-${month}-${day}`;
   
    
    let session_count = await db.DailyReport(phizioemail, patientId, formattedDate);
    
    const session_count_final_length = session_count.map(item => {
      return {
        _id: item._id,
        sessiondetails: item.sessiondetails.length
      };
    });
    const convertedObject = session_count_final_length[0];
   return res.status(SUCCESSFULL_HTTP_RESPONSE).send(convertedObject);
};

