
const fs = require('fs');
const express = require('express');
let {PythonShell} = require('python-shell');
const User = require('../repo/user');
const passport = require('passport');
let Debug = false;
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
const db = require('../repo/db.js');

var moment = require('moment'); // require
moment().format(); 


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
let client  = mqtt.connect("mqtt://13.127.78.38");
//let client  = mqtt.connect("mqtt://");

//AWS CLIENT

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

//All the topics
/*let type = 'local';
//let type = 'server';
let signup_phizio=type+'signup/phizio';
let login_phizio = type+'login/phizio';
let phizio_addpatient = type+'phizio/addpatient';
let phizio_deletepatient = type+'phizio/deletepatient';*/


client.on('connect',function () {

        // console.log("connected");

        client.subscribe("sessionData");
        client.subscribe("getreport");
        client.subscribe("newapk/getreport");
        client.subscribe("phoneStorage/app/sessionData");
        client.subscribe("signup/phizio");
        client.subscribe("login/phizio");
        client.subscribe("phizio/addpatient");
        client.subscribe("phizio/deletepatient");
        client.subscribe("phizio/updatepatientdetails");
        client.subscribe("phizio/addpatientsession");
        client.subscribe("patient/entireEmgData");
        client.subscribe("patient/generate/report");
        client.subscribe("phizioprofile/update");
        client.subscribe("phizioprofile/update/password");
        client.subscribe("phizio/profilepic/upload");
        client.subscribe("phizio/getprofilepicture");
        client.subscribe("phizio/update/patientProfilePic");
        client.subscribe("phizio/mmt/addpatientsession");
        client.subscribe("phizio/calibration/addpatientsession");
        client.subscribe("phizio/update/patientStatus");
        client.subscribe("phizio/patient/updateCommentSection");
        client.subscribe("phizio/patient/updateMmtGrade");
        client.subscribe("phizio/patient/deletepatient/sesssion");
        client.subscribe('send/latest/firmware');




        //testing
        client.subscribe("confirm/email");
        client.subscribe("forgot/password");
        client.subscribe("phizio/testing/generate/sessions");
        //client.subscribe("/topic/qos0");
    

});

client.on('message',async function(topic, message) {

    if(topic==='sessionData') {
        await PheezeeAPI.pushDataToDatabase(message.toString());
    }   



    else if(topic==='send/latest/firmware'){
        // Debug && console.log(message.toString());

        // Debug && console.log('pheezee/latest+firmware/phv1_7_12.zip');
        var params = { 
        Bucket: 'pheezee', Key: 'latest firmware/phv1_7_12.zip' };

        s3Client.getObject(params, function (err, data) {
                    if (err) {
                        Debug && console.log("Error creating the folder: ", err);
                    } else {
                         client.publish('send/latest/firmware/response',data.Body);
                    }
        });
    }

    else if(topic==='phizio/patient/updateMmtGrade'){
        let data = JSON.parse(message);
        const responceDb = await PheezeeAPI.updatePatientMmtGrade(message);
        var id= data.id;
        if(typeof data.id!='undefined'){
            //Debug && console.log(responceDb);
            var object = {"response":responceDb,"id":id};
            client.publish('phizio/patient/updateMmtGrade/response'+data.phizioemail,JSON.stringify(object));
        }
        else{
            client.publish('phizio/patient/updateMmtGrade/response'+data.phizioemail,responceDb);
        }
    }

    else if(topic==='phizio/addpatient'){
        let data = JSON.parse(message);
        var id= data.id;
        const responceDb = await PheezeeAPI.addNewPhizioPatient(message);
        if(typeof data.id!='undefined'){
            //Debug && console.log(responceDb);
            var object = {"response":responceDb,"id":id};
            client.publish('phizio/addpatient/response'+data.phizioemail,JSON.stringify(object));
        }
        else{
            client.publish('phizio/addpatient/response'+data.phizioemail,responceDb);
        }
    }

    else if(topic==='phizio/patient/deletepatient/sesssion'){
        let data = JSON.parse(message);
        // Debug && console.log(message.toString());
        var id = data.id;
        const responceDb = await PheezeeAPI.deletePatientOneSession(message);
        // console.log(responceDb);
        if(typeof data.id!='undefined'){
            //Debug && console.log(responceDb);
            var object = {"response":responceDb,"id":id};
            client.publish('phizio/patient/deletepatient/sesssion/response'+data.phizioemail,JSON.stringify(object));
        }
        else{
            client.publish('phizio/patient/deletepatient/sesssion/response'+data.phizioemail,responceDb);
        }
        
    }

    else if(topic==='phizio/testing/generate/sessions'){
        // Debug && console.log(message.toString());
        const responceDb = await PheezeeAPI.getPatientEntireSessionDataForTesting(message);
        client.publish("phizio/testing/generate/sessions/response",JSON.stringify(responceDb));
    }
    
    else if(topic==='phizio/mmt/addpatientsession'){
        // Debug && console.log(message.toString());
        const responceDb = await PheezeeAPI.newPhizioPatientMmtSession(message);
    }

    else if(topic==='phizio/calibration/addpatientsession'){
        // Debug && console.log(message.toString());
        const responceDb = await PheezeeAPI.addPhizioPatientReferenceSession(message);
    }

    else if(topic==='phizio/patient/updateCommentSection'){
        // console.log(message);
        const response = await PheezeeAPI.updatePhizioPatientCommentSection(message);
    }

    else if(topic==='phizio/getprofilepicture'){
        // Debug && console.log(message.toString());
        // Debug && console.log("lol");
        let data = JSON.parse(message);
        let phizioemail = data.phizioemail;
        let responceDb = await PheezeeAPI.getPhizioProfilePicUrl(phizioemail);
        if(responceDb.phizioprofilepicurl==="url defauld now" || responceDb.phizioprofilepicurl==="empty"){
            // Debug && console.log(responceDb.phizioprofilepicurl);
        }else{
            var params = { 
            Bucket: 'pheezee', Key: 'physiotherapist/'+phizioemail+'/images/profilepic.png' };

            s3Client.getObject(params, function (err, data) {
                        if (err) {
                            // Debug && console.log("Error creating the folder: ", err);
                        } else {
                             client.publish('phizio/getprofilepic/response'+phizioemail,data.Body);
                        }
            });
        }


    }

    //testing email sending for otp
    else if(topic==='confirm/email'){
        // Debug && console.log(message.toString());
        let data = JSON.parse(message);
        const responceDb = await PheezeeAPI.checkPhizioAlreadyPresent(message);
        // Debug && console.log(responceDb);
        if(responceDb=="false"){
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
            <h3>Message</h3>
            <p>Please use ${data.otp} as the otp to confirm your email for further authentication </p>
        `;

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
            html: output // html body
          }, (error,info)=>{
                if(error){
                    client.publish("confirm/email/response"+data.phizioemail+data.phiziopassword,"nsent");
                    return console.log(error);
                }
                // Debug && console.log("confirm/email/response"+data.phizioemail+data.phiziopassword);
                client.publish("confirm/email/response"+data.phizioemail+data.phiziopassword,'sent');
                // Debug && console.log("Message sent: %s", info.messageId);
                // Debug && console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
          });
      }
      else{
        client.publish("confirm/email/response"+data.phizioemail+data.phiziopassword,'Email already present!');
      }
    }


    else if(topic==='forgot/password'){
        // Debug && console.log(message.toString());
        let data = JSON.parse(message);
        const responceDb = await PheezeeAPI.checkPhizioAlreadyPresent(message);
        // Debug && console.log(responceDb);
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
            <p>This is a request for email Confirmation</p>
            <h3>Message</h3>
            <p>Please use ${data.otp} as the otp to confirm your email for further authentication </p>
        `;

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
            html: output // html body
          }, (error,info)=>{
                if(error){
                    client.publish("forgot/password"+data.phizioemail+data.otp,"nsent");
                    return console.log(error);
                }
                // Debug && console.log("forgot/password"+data.phizioemail+data.otp);
                client.publish("forgot/password"+data.phizioemail+data.otp,'sent');
                // Debug && console.log("Message sent: %s", info.messageId);
                // Debug && console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
          });
      }
      else{
        client.publish("forgot/password"+data.phizioemail+data.otp,'invalid');
      }
    }

    else if(topic==='phizioprofile/update/password'){
        let data = JSON.parse(message);
        // Debug && console.log(message.toString());
        const responceDb = await PheezeeAPI.updatePhizioPassword(message);

        client.publish('phizioprofile/update/password/response'+data.phizioemail+data.phiziopassword,responceDb);
    }
    

    else if(topic==='phizio/profilepic/upload'){
    //   Debug && console.log(message.length);
      let data  = JSON.parse(message);
      let phizioemail = data.phizioemail;
      
      var imageBuffer = Buffer.from(data.image,'base64');


    var params = { 
        Bucket: 'pheezee', Key: 'physiotherapist/'+phizioemail+'/images/profilepic.png', 
        ACL: 'public-read', 
        Body:imageBuffer };

        s3Client.upload(params, function (err, data) {
                    if (err) {
                        // Debug && console.log("Error creating the folder: ", err);
                    } else {
                        // Debug && console.log("Successfully created a folder on S3");
                    }
        });
        let profilepickey = 'physiotherapist/'+phizioemail+'/images/profilepic.png';
        let responseDb = await PheezeeAPI.updatePhizioProfilePicUrl(phizioemail,profilepickey);
        client.publish('phizio/profilepic/upload/response'+phizioemail,profilepickey);
    }

    else if(topic==='phizio/update/patientProfilePic'){
    //   Debug && console.log(message.length);
      let data  = JSON.parse(message);
      let phizioemail = data.phizioemail;
      let patientid = data.patientid;
      var imageBuffer = Buffer.from(data.image,'base64');

      


    var params = { 
        Bucket: 'pheezee', Key: 'physiotherapist/'+phizioemail+'/patients/'+patientid+'/images/profilepic.png', 
        ACL: 'public-read', 
        Body:imageBuffer };

        s3Client.upload(params, function (err, data) {
                    if (err) {
                        // Debug && console.log("Error creating the folder: ", err);
                    } else {
                        //  Debug && console.log("Successfully created a folder on S3");
                    }
        });
        let profilepickey = 'physiotherapist/'+phizioemail+'/patients/'+patientid+'/images/profilepic.png';
        let responseDb = await PheezeeAPI.updatePatientProfilePicUrl(phizioemail,patientid,profilepickey);
        let responseJson = new Object();
        responseJson.patientid = data.patientid;
        responseJson.url  = profilepickey;
        client.publish('phizio/update/patientProfilePic/response'+data.phizioemail,responseJson);
    }

    else if (topic==='phizioprofile/update') {
        let data = JSON.parse(message);
        // Debug && console.log(message.toString());
        const responceDb = await PheezeeAPI.updatePhizioDetails(message);

        client.publish('phizioprofile/update/response'+data.phizioemail,responceDb);

    }

    else if(topic==='phizio/update/patientStatus'){
        let data = JSON.parse(message);
        const responceDb = await PheezeeAPI.updatePatientStatus(message);
        //  Debug && console.log(responceDb);
         client.publish('phizio/update/patientStatus/response'+data.phizioemail,JSON.stringify(responceDb));
    }

    else if (topic==='patient/generate/report') {
         let data = JSON.parse(message);
         const responceDb = await PheezeeAPI.getPatientReportData(message);
        //  Debug && console.log(responceDb);
         client.publish('patient/generate/report/response'+data.phizioemail,JSON.stringify(responceDb));
    }

    else if(topic==='patient/entireEmgData'){
        let data_main = JSON.parse(message);
        var id = data_main.id;        
        /*Debug && console.log(message.toString()); 
        const responceDb = await PheezeeAPI.newPatientSessionInsert(message);
        Debug && console.log(responceDb);
        if(typeof data_main.id!='undefined'){
            var object = {"response":responceDb,"id":id};
            Debug && console.log(object);
            client.publish('patient/entireEmgData/response'+data_main.phizioemail,JSON.stringify(object));
        }
        else{
            client.publish('patient/entireEmgData/response'+data_main.phizioemail,responceDb);
        }*/
        var temp_key_emg = 'physiotherapist/'+data_main.phizioemail+'/patients/'+data_main.patientid+'/'+data_main.heldon+'/'+'emg.txt';
        var params = { 
            Bucket: 'pheezee', Key: temp_key_emg,
            ContentType: 'text/plain; Charset=utf-8',
                            //Body:Buffer.from(data.data,'binary')
            Body:data_main.emgdata.toString()
        };
    
        s3Client.upload(params, function (err, data) {
            if (err) {
                // console.log("Error creating the folder: ", err);
            } else {
                var temp_key_rom = 'physiotherapist/'+data_main.phizioemail+'/patients/'+data_main.patientid+'/'+data_main.heldon+'/'+'rom.txt';
                var params = { 
                    Bucket: 'pheezee', Key: temp_key_rom,
                    ContentType: 'text/plain; Charset=utf-8',
                            //Body:Buffer.from(data.data,'binary')
                    Body:data_main.romdata.toString()
                };

                s3Client.upload(params, async function (err, data) {
                        if (err) {
                            // console.log("Error creating the folder: ", err);
                        } else {
                            data_main.emgdata = temp_key_emg;
                            data_main.romdata = temp_key_rom;
                            const responceDb = await PheezeeAPI.newPatientSessionInsert(JSON.stringify(data_main));
                            // Debug && console.log(responceDb);
                            if(typeof data_main.id!='undefined'){
                                var object = {"response":responceDb,"id":id};
                                // Debug && console.log(object);
                                client.publish('patient/entireEmgData/response'+data_main.phizioemail,JSON.stringify(object));
                            }
                            else{
                                client.publish('patient/entireEmgData/response'+data_main.phizioemail,responceDb);
                            }
                        }
                });                                  
            }
        });      
    }

    else if(topic==='phizio/updatepatientdetails'){
        const responceDb = await PheezeeAPI.updatePhizioPatientDetails(message);
        //Debug && console.log(responceDb);
        
    }

    else if(topic==='phizio/addpatientsession'){
        let data = JSON.parse(message);
        // Debug && console.log(message.toString());
        const responceDb  = await PheezeeAPI.addNewPatientSession(message);
        client.publish('phizio/addpatientsession/response'+data.phizioemail,responceDb);
    }


    else if(topic==='phizio/deletepatient'){
        // Debug && console.log(message);
        var data = JSON.parse(message.toString());
      let phizioemail = data.phizioemail;
      let patientid = data.patientid;

        const responceDb = await PheezeeAPI.deletePhizioPatient(message.toString());
        await PheezeeAPI.deletePatientData(message.toString());
        await emptyS3Directory('pheezee', 'physiotherapist/'+phizioemail+'/patients/'+patientid+'/')

    }

    //phiziotherapist when signing up
    else if(topic === 'signup/phizio'){
        let data = JSON.parse(message);
        const responceDb = await PheezeeAPI.addNewPhizioUser(message);
        // Debug && console.log(responceDb);
        if(responceDb=='inserted'){
            client.publish('signup/phizio/response'+data.phizioemail+data.phiziopassword,'inserted');
            // Debug && console.log('signup/phizio/response'+data.phizioemail+data.phiziopassword);
        }
        else if(responceDb=='not'){
             client.publish('signup/phizio/response'+data.phizioemail+data.phiziopassword,'Something went wrong');
        }
        else{
             client.publish('signup/phizio/response'+data.phizioemail+data.phiziopassword,'already');
            //  Debug && console.log('signup/phizio/response'+data.phizioemail+data.phiziopassword);
        }
    }


    //phiziotherapist when logging in
    else if (topic==='login/phizio') {
        let data = JSON.parse(message);
            // Debug && console.log(message.toString());
            const responceDb = await PheezeeAPI.getPhizioDetailsForLogin(message);
            client.publish('login/phizio/response'+data.phizioemail+data.phiziopassword,JSON.stringify(responceDb));
            // Debug && console.log(responceDb);
            // Debug && console.log('login/phizio/response'+data.phizioemail+data.phiziopassword);
    }
});
/* GET home page. */
/*router.get('/', (req, res) => {
  res.render('index');
});*/



//, userDataDir:"/home/ubuntu/testing_data/puppet_tmp"
/* GET generate and download PDF */
// router.get('/getreport/:id/:phizioemail/:date', async (req, res) => {
//   const patientId = req.params.id;
//   const { phizioemail } = req.params;
//   const { date } = req.params;


//   let phizio_type = await PheezeeAPI.getPhizioType(phizioemail);
// //   console.log(phizio_type);

//   if(phizio_type==1 || phizio_type==2){
//     async function printPDF() {
//     const browser = await puppeteer.launch({ headless: true});
//     const page = await browser.newPage();
//     await page.goto(`${URL}/generatereport/${patientId}/${phizioemail}/${date}`, { waitUntil: 'load' });
//     const pdf = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       preferCSSPageSize: true,
//       margin: {
//         left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
//       },
//     });
//     await browser.close();
//     return pdf;
//   }
//     printPDF().then((pdf) => {
//         res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
//         res.status(200).send(pdf);
//     });
//   }else if(phizio_type==2){
//     async function printPDF() {
//     const browser = await puppeteer.launch({ headless: true});
//     const page = await browser.newPage();
//     await page.goto(`${URL}/generatereport/sports/${patientId}/${phizioemail}/${date}`, { waitUntil: 'networkidle0' });
//     const pdf = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       preferCSSPageSize: true,
//       margin: {
//         left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
//       },
//     });
//     await browser.close();
//     return pdf;
//   }
//     printPDF().then((pdf) => {
//         res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
//         res.status(200).send(pdf);
//     });
//     //generateSportsReport(patientId, req.params.phizioemail, req.params.date,res);
//   }
// });



router.get('/getreport/:id/:phizioemail/:date', async (req, res) => {
  try {
    const patientId = req.params.id;
    const { phizioemail } = req.params;
    const { date } = req.params;

    const phizio_type = await PheezeeAPI.getPhizioType(phizioemail);

    async function printPDF(url) {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(url, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
        },
      });

      await browser.close();
      return pdf;
    }

    let pdf;
    if (phizio_type === 1 || phizio_type === 2) {
      const url = `${URL}/generatereport/${patientId}/${phizioemail}/${date}`;
      pdf = await printPDF(url);
    } else if (phizio_type === 2) {
      const url = `${URL}/generatereport/sports/${patientId}/${phizioemail}/${date}`;
      pdf = await printPDF(url);
    }

    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
    res.status(200).send(pdf);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});


// router.get('/getreport_testing_kranthi_new/:id/:phizioemail/:date', async (req, res) => {
//   const patientId = req.params.id;
//   const { phizioemail } = req.params;
//   const { date } = req.params;
//   let customerTypeStatusArray;
//   let customerTypeStatusArray_status;
  
//     const fs = require('fs');
//     const path = require('path');
    
//     const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');
    
//     fs.readFile(filePath, 'utf8', (err, data) => {
//         if (err) {
//             console.error('Error reading file:', err);
//             return;
//         }
    
//         try {
//             const dataArray = JSON.parse(data);
//             const inputEmail = req.params.phizioemail;
//             const filteredArray = dataArray.filter(item => item.Phisioemail === inputEmail);
//             customerTypeStatusArray = filteredArray.map(item => item.customer_type_status);
//             customerTypeStatusArray_status = customerTypeStatusArray.toString();
//             console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUU",customerTypeStatusArray_status);
            
//         } catch (parseError) {
//         }
//     });
    
//     if(customerTypeStatusArray_status == 'null'){
//         console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUU","not_et");
//          let phizio_type = await PheezeeAPI.getPhizioType(phizioemail);
//     async function printPDF() {
//     const browser = await puppeteer.launch({ headless: true});
//     const page = await browser.newPage();
//     await page.goto(`${URL}/generatereport_force_update/${patientId}/${phizioemail}/${date}`, { waitUntil: 'load' });
//     const pdf = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       preferCSSPageSize: true,
//       margin: {
//         left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
//       },
//     });
//     await browser.close();
//     return pdf;
//   }
//     printPDF().then((pdf) => {
//         res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
//         res.status(200).send(pdf);
//     });
//     }else if(customerTypeStatusArray_status !== 'null'){
//         console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUU","et");
//          let phizio_type = await PheezeeAPI.getPhizioType(phizioemail);
//     async function printPDF() {
//     const browser = await puppeteer.launch({ headless: true});
//     const page = await browser.newPage();
//     await page.goto(`${URL}/generatereport/${patientId}/${phizioemail}/${date}`, { waitUntil: 'load' });
//     const pdf = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       preferCSSPageSize: true,
//       margin: {
//         left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
//       },
//     });
//     await browser.close();
//     return pdf;
//   }
//     printPDF().then((pdf) => {
//         res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
//         res.status(200).send(pdf);
//     });
//     }



   

// });

router.get('/getreport_testing_kranthi_new/:id/:phizioemail/:date', async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;
  let customerTypeStatusArray_status = null;
  data_user_information = await db.getUsersData();
  const inputPhizioEmail = req.params.phizioemail;
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
   
      
  
  
  
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');



  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    try {
      const dataArray = JSON.parse(data);
      const inputEmail = req.params.phizioemail;
      const filteredArray = dataArray.filter(item => item.Phisioemail === inputEmail);
      const customerTypeStatusArray = filteredArray.map(item => item.customer_type_status);
      let customerTypeStatusArray_status_value = customerTypeStatusArray.toString();
     

      if (customerTypeStatusArray_status === '3.3.0') {
          if(customerTypeStatusArray_status_value === "old_user"){
            await generatePDF(`${URL}/generatereport/${patientId}/${phizioemail}/${date}`);  
          }else{
             await generatePDF(`${URL}/generatereport_new_short_report/${patientId}/${phizioemail}/${date}`);  
          }
          
         
      } else {
        await generatePDF(`${URL}/generatereport_force_update/${patientId}/${phizioemail}/${date}`);
      }
    } catch (parseError) {
      console.error('Error parsing data:', parseError);
    }
  });

  async function generatePDF(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
      },
    });
    
    await browser.close();

    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
    res.status(200).send(pdf);
  }
});








/*

/* GET generate and download PDF for thermal_printer*/
router.get('/getreport_thermal_printer/:id/:phizioemail/:date', async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;

  let phizio_type = await PheezeeAPI.getPhizioType(phizioemail);
//   console.log("kranthi_kiran_burra","Working");

  if(phizio_type==1 || phizio_type==2){
    async function printPDF() {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    await page.goto(`${URL}/generatereport_thermal_printer/${patientId}/${phizioemail}/${date}`, { waitUntil: 'load' });
    const pdf = await page.pdf({
    //   format: [PAGE_WIDTH, PAGE_HEIGHT],
      format: 'a7',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: '0.5cm', top: '0.0cm', right: '0.5cm', bottom: '0.0cm',
      },
        height: 0,
    });
    await browser.close();
    return pdf;
   }
    printPDF().then((pdf) => {
        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
        res.status(200).send(pdf);
    });
  }else if(phizio_type==2){
    async function printPDF() {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    await page.goto(`${URL}/generatereport/sports/${patientId}/${phizioemail}/${date}`, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
      },
    });
    await browser.close();
    return pdf;
   }
    printPDF().then((pdf) => {
        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
        res.status(200).send(pdf);
    });
    //generateSportsReport(patientId, req.params.phizioemail, req.params.date,res);
  }
});

router.get('/getreport_thermal_printer_pheezee_emg/:id/:phizioemail/:date', async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;

  let phizio_type = await PheezeeAPI.getPhizioType(phizioemail);
//   console.log("kranthi_kiran_burra","Working");

  if(phizio_type==1 || phizio_type==2){
    async function printPDF() {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    await page.goto(`${URL}/generatereport_thermal_printer_emg/${patientId}/${phizioemail}/${date}`, { waitUntil: 'load' });
    const pdf = await page.pdf({
    //   format: [PAGE_WIDTH, PAGE_HEIGHT],
      format: 'a8',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: '0.5cm', top: '0.0cm', right: '0.5cm', bottom: '0.0cm',
      },
        height: 0,
    });
    await browser.close();
    return pdf;
   }
    printPDF().then((pdf) => {
        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
        res.status(200).send(pdf);
    });
  }else if(phizio_type==2){
    async function printPDF() {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    await page.goto(`${URL}/generatereport/sports/${patientId}/${phizioemail}/${date}`, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
      },
    });
    await browser.close();
    return pdf;
   }
    printPDF().then((pdf) => {
        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
        res.status(200).send(pdf);
    });
    //generateSportsReport(patientId, req.params.phizioemail, req.params.date,res);
  }
});
/*





*/

router.get('/generatereport_force_update/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
 
  let report;
  let details;
  let lastsessions=[];
   let lastsessions_array=[];
  let current_session_data=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
  
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
   
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            lastsessions[i]=lastsession;
            var lastsession_array = await db.lastSessionBasedOnExerciseAndJointAndOrientationdata(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
     
      
      lastsessions_array[i]=lastsession_array;
      var current_session = report[0].sessiondetails.filter((set => f => !set.has(f.exercisename) && set.add(f.exercisename))(new Set));

      // current_session_data[i]=current_session;
    

			
        }
        
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;
    // Debug && console.log(sessionNo);

  }
  
  getData().then(() => {

        // Debug && console.log(details);
        // Debug && console.log(report[0].sessiondetails[0].heldon);
        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


          num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                      
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                    res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
								// 		console.log("Normal");
        //                                 console.log(python_variables);
                                        getData().then(() => {
                                        res.render('update_force', {
                                          title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                             lastsessions_array,
                                            current_session_data,
                                            download_result_rom,
                                              download_result_emg,
                                            download_time_stamp,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                        
                    }
                }
            });
        }         
  });
});

router.get('/generatereport/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
 
  let report;
  let details;
  let lastsessions=[];
   let lastsessions_array=[];
  let current_session_data=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
  
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
   
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            lastsessions[i]=lastsession;
            var lastsession_array = await db.lastSessionBasedOnExerciseAndJointAndOrientationdata(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
     
      
      lastsessions_array[i]=lastsession_array;
      var current_session = report[0].sessiondetails.filter((set => f => !set.has(f.exercisename) && set.add(f.exercisename))(new Set));

      // current_session_data[i]=current_session;
    

			
        }
        
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;
    // Debug && console.log(sessionNo);

  }
  
  getData().then(() => {

        // Debug && console.log(details);
        // Debug && console.log(report[0].sessiondetails[0].heldon);
        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


          num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                      
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                    res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
								// 		console.log("Normal");
        //                                 console.log(python_variables);
                                        getData().then(() => {
                                        res.render('sportsreport_new', {
                                          title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                             lastsessions_array,
                                            current_session_data,
                                            download_result_rom,
                                              download_result_emg,
                                            download_time_stamp,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                        
                    }
                }
            });
        }         
  });
});

router.get('/generatereport_thermal_printer/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
//   console.log("responeDb",responeDb);
  let report;
  let details;
  let lastsessions=[];
  var lastsession_array_new;
   let lastsessions_array=[];
  let current_session_data=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  var session_array_values;
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
    // console.log("report",report);
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
    // console.log(details);
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            lastsessions[i]=lastsession;
            lastsession_array_new = await db.lastSessionBasedOnExerciseAndJointAndOrientationdataK(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            var lastsession_array = await db.lastSessionBasedOnExerciseAndJointAndOrientationdata(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            
    //   console.log("c",lastsession_array);
      
      lastsessions_array[i]=lastsession_array;
      var current_session = report[0].sessiondetails.filter((set => f => !set.has(f.exercisename) && set.add(f.exercisename))(new Set));

      // current_session_data[i]=current_session;
    //   console.log("lastsession_array", current_session)
      session_array_values  = await db.session_array(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);

			
        }
        
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;
    // Debug && console.log(sessionNo);

  }
  
  getData().then(() => {

        Debug && console.log(details);
        Debug && console.log(report[0].sessiondetails[0].heldon);
        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


          num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                      
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                    res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
								// 		console.log("Normal");
        //                                 console.log(python_variables);
                                        getData().then(() => {
                                        res.render('thermal_printer',{
                                          title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                            lastsession_array_new,
                                             lastsessions_array,
                                            current_session_data,
                                            session_array_values,
                                            download_result_rom,
                                              download_result_emg,
                                            download_time_stamp,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                        
                    }
                }
            });
        }         
  });
});

router.get('/generatereport_thermal_printer_emg/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
  console.log("responeDb",responeDb);
  let report;
  let details;
  let lastsessions=[];
  var lastsession_array_new;
   let lastsessions_array=[];
  let current_session_data=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  var session_array_values;
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
    console.log("report",report);
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
    console.log(details);
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            lastsessions[i]=lastsession;
            lastsession_array_new = await db.lastSessionBasedOnExerciseAndJointAndOrientationdataK(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            var lastsession_array = await db.lastSessionBasedOnExerciseAndJointAndOrientationdata(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
      console.log("c",lastsession_array);
      
      lastsessions_array[i]=lastsession_array;
      var current_session = report[0].sessiondetails.filter((set => f => !set.has(f.exercisename) && set.add(f.exercisename))(new Set));

      // current_session_data[i]=current_session;
      console.log("lastsession_array", current_session)
      session_array_values  = await db.session_array(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);

			
        }
        
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;
    // Debug && console.log(sessionNo);

  }
  
  getData().then(() => {

        Debug && console.log(details);
        Debug && console.log(report[0].sessiondetails[0].heldon);
        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


          num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                      
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                    res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
                                        getData().then(() => {
                                        res.render('thermal_printer_new_page',{
                                          title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                            lastsession_array_new,
                                             lastsessions_array,
                                            current_session_data,
                                            session_array_values,
                                            download_result_rom,
                                            download_result_emg,
                                            download_time_stamp,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                        
                    }
                }
            });
        }         
  });
});


//new report testing api
router.get('/getreport_new_report/:id/:phizioemail/:date', async (req, res) => {
  try {
    const patientId = req.params.id;
    const { phizioemail } = req.params;
    const { date } = req.params;

    const phizio_type = await PheezeeAPI.getPhizioType(phizioemail);

    async function printPDF(url) {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(url, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
        },
      });

      await browser.close();
      return pdf;
    }

    let pdf;
    if (phizio_type === 1 || phizio_type === 2) {
      const url = `${URL}/generatereport_new_report/${patientId}/${phizioemail}/${date}`;
      pdf = await printPDF(url);
    } else if (phizio_type === 2) {
      const url = `${URL}/generatereport_new_report/${patientId}/${phizioemail}/${date}`;
      pdf = await printPDF(url);
    }

    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
    res.status(200).send(pdf);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});






router.get('/getreport_new_short_report/:id/:phizioemail/:date', async (req, res) => {
  try {
    const patientId = req.params.id;
    const { phizioemail } = req.params;
    const { date } = req.params;

    const phizio_type = await PheezeeAPI.getPhizioType(phizioemail);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--memory=4GB','--js-flags=--max-old-space-size=4096'],
    });

    const url = `${URL}/generatereport_new_short_report/${patientId}/${phizioemail}/${date}`;

    try {
      const pdf = await printPDF(browser, url);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
      res.status(200).send(pdf);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred while generating the PDF.');
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while generating the PDF.');
  }
});

async function printPDF(browser, url) {
  const page = await browser.newPage();

  page.on('error', (err) => {
    console.error('Page error:', err);
  });

  page.on('pageerror', (err) => {
    console.error('Page JavaScript error:', err);
  });

  page.on('console', (msg) => {
    console.log('Page console message:', msg.text());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
      },
    });

    return pdf;
  } catch (error) {
    console.error('Error during PDF generation:', error);
    throw error;
  } finally {
    await page.close();
  }
}


// router.get('/getreport_new_report/:id/:phizioemail/:date', async (req, res) => {
//   const patientId = req.params.id;
//   const { phizioemail } = req.params;
//   const { date } = req.params;
//   let phizio_type = await PheezeeAPI.getPhizioType(phizioemail);
//   console.log(phizio_type);
//   if(phizio_type==1 || phizio_type==2){
//     async function printPDF() {
//     const browser = await puppeteer.launch({ headless: true});
//     const page = await browser.newPage();
//     await page.goto(`${URL}/generatereport_new_report/${patientId}/${phizioemail}/${date}`, { waitUntil: 'load' });
//     const pdf = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       preferCSSPageSize: true,
//       margin: {
//         left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
//       },
//     });
//     await browser.close();
//     return pdf;
//   }
//     printPDF().then((pdf) => {
//         res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
//         res.status(200).send(pdf);
//     });
//   }
// });

router.get('/generatereport_new_report/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
  let report;
  let details;
  let lastsessions=[];
   let lastsessions_array=[];
  let current_session_data=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
  var lastsession_array_new;
  var lastsession_array_new_filter_kranthi;
  var session_array_values;
  let noramtive_emg_data;
  let normative_rom_data;
  let normative_reps_data;
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  
    var jsonDataemg = fs.readFileSync(__dirname+"/../public/EMGData.json", 'utf8');
    var jsonDatarom = fs.readFileSync(__dirname+"/../public/ROMData.json", 'utf8');
    var jsonDatareps = fs.readFileSync(__dirname+"/../public/Reps_Data.json", 'utf8');
    noramtive_emg_data= JSON.parse(jsonDataemg);
    noramtive_rom_data= JSON.parse(jsonDatarom);
    normative_reps_data= JSON.parse(jsonDatareps);
    // console.log("222222222222222222222", noramtive_emg_data);
    // console.log("111111111111111111111", noramtive_rom_data);
   
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            lastsessions[i]=lastsession;
            var lastsession_array = await db.lastSessionBasedOnExerciseAndJointAndOrientationdata(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
      lastsession_array_new = await db.lastSessionBasedOnExerciseAndJointAndOrientationdataK(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
      lastsession_array_new_filter_kranthi = await db.kranthi_last_session_filter_data(phizioemail,patientId,bodypart,exercisename,musclename,date);
       session_array_values  = await db.session_array(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
       
      lastsessions_array[i]=lastsession_array;
      var current_session = report[0].sessiondetails.filter((set => f => !set.has(f.exercisename) && set.add(f.exercisename))(new Set));

      // current_session_data[i]=current_session;

			
        }
        
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;

  
   
     

  }
  
  getData().then(() => {

        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


          num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){


                      if(report[0].sessiondetails[j].exercisename=='Isometric'){
                        runKineticPythonScript_isometric(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                          download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                              try{
                                   res_py = JSON.parse(res_py);
                             
                              }
                              catch(e)
                              {
                                  
                              }
                              python_variables.push(res_py);
                              num_of_scripts_run++;
                              if(num_of_scripts_run==report[0].sessiondetails.length){
                                  getData().then(() => {
                                    res.render('sportsreport_new_kranthi', {
                                      title: 'report',
                                        report,
                                        overallreport,
                                        details,
                                        sessionNo,
                                        lastsessions,
                                         lastsessions_array,
                                         lastsession_array_new,
                                         session_array_values,
                                        current_session_data,
                                        download_result_rom,
                                          download_result_emg,
                                        download_time_stamp,
                                        noramtive_emg_data,
                                        noramtive_rom_data,
                                        normative_reps_data,
                                        lastsession_array_new_filter_kranthi,
                                      python_variables
                                    });
                                  });
                                }
                            });

                      
                      }

                      else {
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                    res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
                                        getData().then(() => {
                                        res.render('sportsreport_new_kranthi', {
                                          title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                             lastsessions_array,
                                             lastsession_array_new,
                                            current_session_data,
                                            session_array_values,
                                            download_result_rom,
                                              download_result_emg,
                                            download_time_stamp,
                                            noramtive_emg_data,
                                            noramtive_rom_data,
                                            normative_reps_data,
                                            lastsession_array_new_filter_kranthi,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                              }
                    }
                }
            });
        }         
  });
});

router.get('/generatereport_new_short_report/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
  let report;
  let details;
  let lastsessions=[];
   let lastsessions_array=[];
  let current_session_data=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
  var lastsession_array_new;
  var lastsession_array_new_filter_kranthi;
  var session_array_values;
  let noramtive_emg_data;
  let normative_rom_data;
  let normative_reps_data;
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  
    var jsonDataemg = fs.readFileSync(__dirname+"/../public/EMGData.json", 'utf8');
    var jsonDatarom = fs.readFileSync(__dirname+"/../public/ROMData.json", 'utf8');
    var jsonDatareps = fs.readFileSync(__dirname+"/../public/Reps_Data.json", 'utf8');
    noramtive_emg_data= JSON.parse(jsonDataemg);
    noramtive_rom_data= JSON.parse(jsonDatarom);
    normative_reps_data= JSON.parse(jsonDatareps);
    // console.log("222222222222222222222", noramtive_emg_data);
    // console.log("111111111111111111111", noramtive_rom_data);
   
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
            lastsessions[i]=lastsession;
            var lastsession_array = await db.lastSessionBasedOnExerciseAndJointAndOrientationdata(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
      lastsession_array_new = await db.lastSessionBasedOnExerciseAndJointAndOrientationdataK(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
      lastsession_array_new_filter_kranthi = await db.kranthi_last_session_filter_data(phizioemail,patientId,bodypart,exercisename,musclename,date);
       session_array_values  = await db.session_array(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
       
      lastsessions_array[i]=lastsession_array;
      var current_session = report[0].sessiondetails.filter((set => f => !set.has(f.exercisename) && set.add(f.exercisename))(new Set));

      // current_session_data[i]=current_session;

			
        }
        
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;

  
   
     

  }
  
  getData().then(() => {

        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


          num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){


                      if(report[0].sessiondetails[j].exercisename=='Isometric'){
                        runKineticPythonScript_isometric(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                          download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                              try{
                                   res_py = JSON.parse(res_py);
                             
                              }
                              catch(e)
                              {
                                  
                              }
                              python_variables.push(res_py);
                              num_of_scripts_run++;
                              if(num_of_scripts_run==report[0].sessiondetails.length){
                                  getData().then(() => {
                                    res.render('sportsreport_new_kranthi_short', {
                                      title: 'report',
                                        report,
                                        overallreport,
                                        details,
                                        sessionNo,
                                        lastsessions,
                                         lastsessions_array,
                                         lastsession_array_new,
                                         session_array_values,
                                        current_session_data,
                                        download_result_rom,
                                          download_result_emg,
                                        download_time_stamp,
                                        noramtive_emg_data,
                                        noramtive_rom_data,
                                        normative_reps_data,
                                        lastsession_array_new_filter_kranthi,
                                      python_variables
                                    });
                                  });
                                }
                            });

                      
                      }

                      else {
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                    res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
                                        getData().then(() => {
                                        res.render('sportsreport_new_kranthi_short', {
                                          title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                             lastsessions_array,
                                             lastsession_array_new,
                                            current_session_data,
                                            session_array_values,
                                            download_result_rom,
                                              download_result_emg,
                                            download_time_stamp,
                                            noramtive_emg_data,
                                            noramtive_rom_data,
                                            normative_reps_data,
                                            lastsession_array_new_filter_kranthi,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                              }
                    }
                }
            });
        }         
  });
});


// Normative Values

router.get('/normativevalues/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
  let report;
  let details;
  let lastsessions=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientationtesting(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
			
            lastsessions[i]=lastsession;
// 			console.log("checking comments");
// 			console.log(report[0].sessiondetails[i].sessiontype);
			
        }
        Debug && console.log(lastsessions);
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;
    Debug && console.log(sessionNo);

  }
  
  getData().then(() => {

        Debug && console.log(details);
        Debug && console.log(report[0].sessiondetails[0].heldon);
        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


                num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                      
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                        res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
								// 		console.log("Normal");
                                //      console.log(python_variables);
                                        getData().then(() => {
                                        res.json({
                                            // title: 'report',
                                            // report,
								// 			overallreport,
        //                                     details,
        //                                     sessionNo
                                            // lastsessions
                                            // download_result_rom,
                                            // download_result_emg,
                                            // download_time_stamp,
                                            // python_variables
                                        });
                                      });
                                    }
                                });
                        
                    }
                }
            });
        }         


    
  });
});




router.get('/generatereport/test_report/:id/:email/:date', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
  const responeDb = await PheezeeAPI.addReport(session_report_add);
  let report;
  let details;
  let lastsessions=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
	overallreport = await db.overallReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
 
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
			
            lastsessions[i]=lastsession;
// 			console.log("checking comments");
// 			console.log(report[0].sessiondetails[i].sessiontype);
			
        }
        Debug && console.log(lastsessions);
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;
    Debug && console.log(sessionNo);

  }
  
  getData().then(() => {

        Debug && console.log(details);
        Debug && console.log(report[0].sessiondetails[0].heldon);
        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


                num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                      
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                        res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
								// 		console.log("Normal");
                                //      console.log(python_variables);
                                        getData().then(() => {
                                        res.json({
                                            title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                            download_result_rom,
                                            download_result_emg,
                                            download_time_stamp,
                                            python_variables
                                        });
                                      });
                                    }
                                });
                        
                    }
                }
            });
        }         


    
  });
});

router.get('/generatereport/happyshoulder/:id/:email/:date/:patientName/:dateofjoin/:patientgender/:patientcase/:phizioname/:phiziophone/:cliniclogo/:address/:clinicname/:degree/:age', async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  
  const  patientName  = req.params.patientName;
  const  dateofjoin  = req.params.dateofjoin;
  const  patientgender  = req.params.patientgender;
  const  patientcase  = req.params.patientcase;
  const  phizioname  = req.params.phizioname;
  const  phiziophone  = req.params.phiziophone;
  const  cliniclogo  = req.params.cliniclogo;
  const  address  = req.params.address;
  const  clinicname  = req.params.clinicname;
  const  degree  = req.params.degree;
  const  age  = req.params.age;
  
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);

  let session_report_add = {
"patientid":patientId,
"phizioemail":phizioemail,
"sessiondetails":[{
        "heldon":date, 
        "date":date_moment
    }],
    "overalldetails":[{
        "bodypart":null, 
        "date":null
    }]
};
console.log(session_report_add);
  const responeDb = await PheezeeAPI.addReport(session_report_add);
  let report;
  let details;
  let lastsessions=[];
  let download_result_emg = [];
  let download_result_rom = []; 
  let download_time_stamp = []; 
  let python_variables = [];
      var num_of_scripts_run = 0;
  var num_of_files_received = 0;
  let sessionNo;
  async function getData() {
    report = await db.DailyReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
	overallreport = await db.overallReport(phizioemail, patientId, date);
	details = [ { _id: '5d19d5822962a8064b7f8889',
    phizioname: phizioname,
    phizioemail: phizioemail,
    phiziophone: phiziophone,
    phizioprofilepicurl:
     cliniclogo,
    phiziopatients:
     [ { _id: '5d45c32a01511a140512d7c7',
         patientid: patientId,
         patientname: patientName,
         numofsessions: '0',
         dateofjoin: dateofjoin,
         status: 'active',
         patientage: age,
         patientcasedes: patientcase,
         patientgender: patientgender,
         patientphone: '  ',
         patientprofilepicurl: 'empty',
         heldon: '2020-11-05 12:14:46' } ],
    
    address: address,   clinicname: clinicname, degree: degree } ];
    
	
	
    // console.log('REPORT');
    //console.log(report);
    
    // console.log('END');
    if(report.length>0 && typeof report!=='string'){
        for(var i=0; i<report[0].sessiondetails.length; i++){
            
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
			
			lastsessions[i]=lastsession;
        }
        Debug && console.log(lastsessions);
    }
    let xyz = await db.sessionDates(phizioemail,patientId);
    sessionNo = Array.from(xyz).indexOf(date)+1;
    Debug && console.log(sessionNo);

  }
  getData().then(() => {

        Debug && console.log(details);
        Debug && console.log(report[0].sessiondetails[0].heldon);
        for(var i=0;i<report[0].sessiondetails.length;i++){
            
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                download_time_stamp.push(result[2]);


          num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                        if(report[0].sessiondetails[j].exercisename=='Isometric'){
                            runIsometricPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                            download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                //console.log(res_py);
                                res_py = JSON.parse(res_py);
                                python_variables.push(res_py);
                                num_of_scripts_run++;
                                if(num_of_scripts_run==report[0].sessiondetails.length){
                                   // console.log(python_variables);
                                }
                            });
                        }else{
                            runKineticPythonScript(report[0].sessiondetails[j].activetime, report[0].sessiondetails[j].numofreps,
                                download_result_rom[j],download_result_emg[j],download_time_stamp[j]).then((res_py)=>{
                                    try{
                                    res_py = JSON.parse(res_py);
                                    }
                                    catch(e){
                                        
                                    }
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
                                        console.log(python_variables);
                                        getData().then(() => {
                                        res.render('sportsreport_new', {
                                          title: 'report',
                                            report,
											overallreport,
                                            details,
                                            sessionNo,
                                            lastsessions,
                                            download_result_rom,
                                              download_result_emg,
                                            download_time_stamp,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                        }
                    }
                }
            });
        }         


    
  });
});
/*
router.get('/generatereport/sports/:id/:email/:date', async (req, res) => {
    const patientId = req.params.id;
    const phizioemail = req.params.email;
    const { date } = req.params;
      let report;
      let details;
      let lastsessions=[];
      let download_result_emg = [];
      let download_result_rom = []; 
      let python_variables = [];
      let sessionNo;
      var num_of_files_received = 0;
      var num_of_scripts_run = 0;
      async function getData() {
        report = await db.DailyReport(phizioemail, patientId, date);
        details = await db.PatientDetails(phizioemail, patientId);
        if(report.length>0 && typeof report!=='string'){
            for(var i=0; i<report[0].sessiondetails.length; i++){
                var exercisename="", bodypart="";

                var exercisename = report[0].sessiondetails[i].exercisename;
                var bodypart = report[0].sessiondetails[i].bodypart;
                var lastsession = await db.lastSessionBasedOnExerciseAndJoint(phizioemail,patientId,bodypart,exercisename,date);
                lastsessions[i]=lastsession;
            }
            Debug && console.log(lastsessions);
        }
        let xyz = await db.sessionDates(phizioemail,patientId);
        sessionNo = Array.from(xyz).indexOf(date)+1;
        Debug && console.log(sessionNo);
      }
      getData().then(()=>{
        for(var i=0;i<report[0].sessiondetails.length;i++){
            console.log(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata);
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                        if(report[0].sessiondetails[j].exercisename=='Isometric'){
                            runIsometricPythonScript(report[0].sessiondetails[0].activetime, report[0].sessiondetails[0].numofreps,
                            download_result_rom[0],download_result_emg[0]).then((res_py)=>{
                                console.log(res_py);
                                res_py = JSON.parse(res_py);
                                python_variables.push(res_py);
                                num_of_scripts_run++;
                                if(num_of_scripts_run==report[0].sessiondetails.length){
                                    console.log(python_variables);
                                }
                            });
                        }else{
                            runKineticPythonScript(report[0].sessiondetails[0].activetime, report[0].sessiondetails[0].numofreps,
                                download_result_rom[0],download_result_emg[0]).then((res_py)=>{
                                    res_py = JSON.parse(res_py);
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
                                        console.log(python_variables);
                                        getData().then(() => {
                                        res.render('sportsreport_new', {
                                          title: 'report',
                                          report,
                                          details,
                                          sessionNo,
                                          lastsessions,
                                          python_variables
                                        });
                                      });
                                    }
                                });
                        }
                    }
                }
            });
        }
      });
});
*/

//Generate csv for email and patients
/*router.get('/generatecsv', async (req, res) => {
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  var data = [];
    const csvWriter = createCsvWriter({
      path: 'out.csv',
      header: [
        {id:'sl', title: 'SL NO.'},
        {id: 'email', title: 'Email'},
        {id: 'noofpatients', title: 'No of patients'},
        {id: 'patientname', title: 'Patient Name'},
         {id: 'patientid', title: 'Patient Id'},
          {id: 'initials', title: 'Initials'},
      ]
    });

    var all = await db.getAllDatabase();
    all = JSON.stringify(all);
    all = JSON.parse(all);
    for(var i=0;i<all.length;i++){
        for(var j=0;j<all[i].phiziopatients.length;j++){
            var data1 = {};
            if(j==0){
                data1['sl']=i+1;
                data1['email'] = all[i].phizioemail.toString();
                data1['noofpatients'] = all[i].phiziopatients.length;
                data1['patientname'] = all[i].phiziopatients[j].patientname;
                data1['patientid'] = all[i].phiziopatients[j].patientid;
                if(all[i].phiziopatients[j].patientname.length>2)
                    data1['initials'] = all[i].phiziopatients[j].patientname.substr(0,2);
                else    
                    data1['initials'] = all[i].phiziopatients[j];
            }
            else{
                data1['sl']='';
                data1['email'] = '';
                data1['noofpatients'] = '';
                data1['patientname'] = all[i].phiziopatients[j].patientname;
                data1['patientid'] = all[i].phiziopatients[j].patientid;
                if(all[i].phiziopatients[j].patientname.length>2)
                    data1['initials'] = all[i].phiziopatients[j].patientname.substr(0,2);
                else    
                    data1['initials'] = all[i].phiziopatients[j];
            }

            data.push(data1);
        }
    }

    console.log(data);

    csvWriter
  .writeRecords(data)
  .then(()=> console.log('The CSV file was written successfully'));

});
*/

/*router.get('/updatedatabase', async (req, res) => {
  await db.updateDatabase();
});*/


//Removing support for Weekly and Monthly reports
/* GET generate and download PDF */

/*
router.get("/getreport/monthly/:id/:phizioemail/:date", async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;
  async function printPDF() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(
      `${URL}/generatereport/monthly/${patientId}/${phizioemail}/${date}`,
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
    res.send(pdf);
  });
});
router.get("/getreport/weekly/:id/:phizioemail/:date", async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;
  async function printPDF() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(
      `${URL}/generatereport/weekly/${patientId}/${phizioemail}/${date}`,
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
    res.send(pdf);
  });
});

*/


const getMonthNumber = (date, details) => {
  let [year, month, date_value] = date.split("-", 3);
  let presentDate = new Date(year + "/" + month + "/" + date_value);
  [date_value, month, year] = details[0].phiziopatients[0].dateofjoin.split(
    "/",
    3
  );
  let joiningDate = new Date(year + "/" + month + "/" + date_value);
  const timeDiff = presentDate.getTime() - joiningDate.getTime();
  const DaysDiff = timeDiff / (1000 * 3600 * 24);
  return Math.floor(DaysDiff / 30 + 1);
};

const getMonthString = date => {
  let [year, month, date_value] = date.split("-", 3);
  let presentDate = new Date(year + "/" + month + "/" + date_value);
  // 2505600000 milliseconds in 29 days
  let dateBeforeOneMonth = new Date(presentDate - 2505600000);
  let string;
  if (dateBeforeOneMonth.getFullYear() == presentDate.getFullYear()) {
    string =
      dateBeforeOneMonth.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long"
      }) +
      " - " +
      presentDate.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long"
      });
    string += "," + presentDate.getFullYear();
  } else {
    string =
      dateBeforeOneMonth.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }) +
      " - " +
      presentDate.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
  }
  return string;
};

router.get("/generatereport/monthly/:id/:email/:date", async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  let report;
  let details;
  let bodypartArray = [];
  let allBodyParts = [];
  let monthCount;
  let monthRangeString;
  async function getData() {
    report = await db.MonthlyReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
  }
  getData()
    .then(() => {
      report[0].sessiondetails.forEach(set => {
        let uniqueKey = set.orientation.toLowerCase() + set.bodypart.toLowerCase() + set.exercisename.toLowerCase();
        let orientation = set.orientation;
        let bodyPart = set.bodypart;
        let exercise = set.exercisename;
        let pair = {orientation, exercise, bodyPart };

        if (!allBodyParts.includes(uniqueKey)) {
          bodypartArray.push(pair); 
          allBodyParts.push(uniqueKey);
        }
      });
    })
    .then(() => {
      monthCount = getMonthNumber(date, details);
      monthRangeString = getMonthString(date);
    })
    .then(() => {
      res.render("monthly", {
        title: "report",
        report,
        details,
        bodypartArray,
        monthCount,
        monthRangeString,
        date
      });
    });
});

const getWeekString = date => {
  let [year, month, date_value] = date.split("-", 3);
  let presentDate = new Date(year + "/" + month + "/" + date_value);
  let dateBeforeOneWeek = new Date(presentDate - 518400000);
  let string;
  if (dateBeforeOneWeek.getFullYear() == presentDate.getFullYear()) {
    string =
      dateBeforeOneWeek.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long"
      }) +
      " - " +
      presentDate.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long"
      });
    string += "," + presentDate.getFullYear();
  } else {
    string =
      dateBeforeOneWeek.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }) +
      " - " +
      presentDate.toLocaleDateString("en-uk", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
  }
  return string;
};
const getWeekNumber = (date, details) => {
  let [year, month, date_value] = date.split("-", 3);
  let presentDate = new Date(year + "/" + month + "/" + date_value);
  [date_value, month, year] = details[0].phiziopatients[0].dateofjoin.split(
    "/",
    3
  );
  let joiningDate = new Date(year + "/" + month + "/" + date_value);
  const timeDiff = presentDate.getTime() - joiningDate.getTime();
  const DaysDiff = timeDiff / (1000 * 3600 * 24);
  return Math.floor(DaysDiff / 7 + 1);
};
router.get("/generatereport/weekly/:id/:email/:date", async (req, res) => {
  const patientId = req.params.id;
  const phizioemail = req.params.email;
  const { date } = req.params;
  let report;
  let details;
  let bodypartArray = [];
  let arrayOfExercises = [];
  let rewardPoints;
  let weekCount;
  let weekString;
  async function getData() {
    report = await db.WeeklyReport(phizioemail, patientId, date);
    details = await db.PatientDetails(phizioemail, patientId);
  }
  getData()
    .then(() => {
      report[0].sessiondetails.forEach(set => {
        let uniqueKey = set.orientation.toLowerCase() + set.bodypart.toLowerCase() + set.exercisename.toLowerCase();
        let orientation = set.orientation;
        let bodyPart = set.bodypart;
        let exercise = set.exercisename;
        let pair = {orientation, exercise, bodyPart };

        if (!arrayOfExercises.includes(uniqueKey)) {
          bodypartArray.push(pair); 
          arrayOfExercises.push(uniqueKey);
        }
      });
    })
    .then(() => {
      weekCount = getWeekNumber(date, details);
      weekString = getWeekString(date, details);
    })
    .then(() => {
      const joiningDate = new Date(details[0].phiziopatients[0].dateofjoin);

      res.render("weekly", {
        title: "Weekly Report",
        report,
        details,
        bodypartArray,
        weekCount,
        weekString,
        date
      });
    });
});


//String for the overall graph
const getOverAllReportString = (joiningDate, date)=>{
    var from_date = new Date(joiningDate.split("/").reverse().join("-")).toDateString();
    var to_date = new Date(date).toDateString();
    from_date = from_date.split(' ').slice(1).join(' ');
    to_date = to_date.split(' ').slice(1).join(' ');
    var value = [];
    var return_date = "From: "+from_date+"  to "+to_date;
    value[0] = return_date;

    let [year, month, date_value] = date.split("-", 3);
    let presentDate = new Date(year + "/" + month + "/" + date_value);
    [date_value, month, year] = joiningDate.split("/",3);
    joiningDate = new Date(year + "/" + month + "/" + date_value);
    const timeDiff = presentDate.getTime() - joiningDate.getTime();
    const DaysDiff = timeDiff / (1000 * 3600 * 24);
    value[1] = DaysDiff+1;
    return value;
};



router.get("/getreport/overall/:id/:phizioemail/:date/:bodypart", async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;
  const  bodypart = req.params.bodypart;

  console.log(JSON.stringify(bodypart));


  async function printPDF() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(
      `${URL}/generatereport/overall/${patientId}/${phizioemail}/${date}/${bodypart}`,
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
    res.send(pdf);
  });
});



router.get("/generatereport/overall/:id/:email/:date/:bodypart/", async (req, res)=>{
    const patientId = req.params.id;
    const phizioemail = req.params.email;
    const bodypart = req.params.bodypart;
    console.log(bodypart);
    
    // Overall Report date add
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);
  let overall_report_add = {
    "patientid":patientId,
    "phizioemail":phizioemail,
    "sessiondetails":[{
        "heldon":null, 
        "date":null
    }],
    "overalldetails":[{
        "bodypart":bodypart, 
        "date":date_moment
    }]
    };
  const responeDb = await PheezeeAPI.addReport_overall(overall_report_add);
    

    var { date } = req.params;
    
    var date_split = date.split("-");
    
    var year = parseInt(date_split[0]);
    var month = parseInt(date_split[1]);
    var day = parseInt(date_split[2]);

    var date_moment = String(day)+"."+String(month)+"."+String(year);
     console.log("MAIN date");
     console.log(date_moment);
    var new_date = moment(date_moment, "DD-MM-YYYY").add(1,'days');



    
    console.log("todays' date");
   
    date = new_date.format('YYYY')+'-'+new_date.format('MM')+'-'+new_date.format('DD');
    console.log(date);

    let report;
    let details;
    let bodypartArray = [];
    let arrayOfExercises = [];
    async function getData() {
        report = await db.overallReport(phizioemail, patientId, date);
        details = await db.PatientDetails(phizioemail, patientId);
    }

    getData().then(()=>{
        report[0].sessiondetails.forEach(set=>{
            let uniqueKey =
            set.orientation.toLowerCase() + set.bodypart.toLowerCase() + set.exercisename.toLowerCase();
            let orientation = set.orientation;
            let bodyPart = set.bodypart;
            let exercise = set.exercisename;
            let pair = {orientation, exercise, bodyPart };

            if (!arrayOfExercises.includes(uniqueKey)) {
              bodypartArray.push(pair);
              arrayOfExercises.push(uniqueKey);
            }
        });
    }).then(()=>{
        var datestring_numofdays = getOverAllReportString(details[0].phiziopatients[0].dateofjoin, date);
        var dateString = datestring_numofdays[0];
        var numofdays = datestring_numofdays[1];

        //console.log(JSON.parse(JSON.stringify(report[0])));

       res.render("overall_new", {
        title: "Overall Report",
        report,
        details,
        bodypartArray,
        dateString,
        numofdays,
        date,
        bodypart
      });
    });
});

// Overall for happy shoulder

router.get("/getreport/overall/happyshoulder/:id/:phizioemail/:date/:bodypart/:patientName/:dateofjoin/:patientgender/:patientcase/:phizioname/:phiziophone/:cliniclogo/:address/:clinicname/:degree/:age", async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;
  const  bodypart = req.params.bodypart;
  
  const  patientName  = req.params.patientName;
  const  dateofjoin  = req.params.dateofjoin;
  const  patientgender  = req.params.patientgender;
  const  patientcase  = req.params.patientcase;
  const  phizioname  = req.params.phizioname;
  const  phiziophone  = req.params.phiziophone;
  const  cliniclogo  = req.params.cliniclogo;
  const  address  = req.params.address;
  const  clinicname  = req.params.clinicname;
  const  degree  = req.params.degree;
  const  age  = req.params.age;

  console.log(JSON.stringify(bodypart));


  async function printPDF() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(
      `${URL}/generatereport/overall/happyshoulder/${patientId}/${phizioemail}/${date}/${bodypart}/${patientName}/${dateofjoin}/${patientgender}/${patientcase}/${phizioname}/${phiziophone}/${cliniclogo}/${address}/${clinicname}/${degree}/${age}`,
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
    res.send(pdf);
  });
});

router.get("/generatereport/overall/happyshoulder/:id/:email/:date/:bodypart/:patientName/:dateofjoin/:patientgender/:patientcase/:phizioname/:phiziophone/:cliniclogo/:address/:clinicname/:degree/:age", async (req, res)=>{
    const patientId = req.params.id;
    const phizioemail = req.params.email;
    const bodypart = req.params.bodypart;
    console.log(bodypart);
	
	 const  patientName  = req.params.patientName;
  const  dateofjoin  = req.params.dateofjoin;
  const  patientgender  = req.params.patientgender;
  const  patientcase  = req.params.patientcase;
  const  phizioname  = req.params.phizioname;
  const  phiziophone  = req.params.phiziophone;
  const  cliniclogo  = req.params.cliniclogo;
  const  address  = req.params.address;
  const  clinicname  = req.params.clinicname;
  const  degree  = req.params.degree;
  const  age  = req.params.age;
    
    // Overall Report date add
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);
  let overall_report_add = {
    "patientid":patientId,
    "phizioemail":phizioemail,
    "sessiondetails":[{
        "heldon":null, 
        "date":null
    }],
    "overalldetails":[{
        "bodypart":bodypart, 
        "date":date_moment
    }]
    };
  const responeDb = await PheezeeAPI.addReport_overall(overall_report_add);
    

    var { date } = req.params;
    
    var date_split = date.split("-");
    
    var year = parseInt(date_split[0]);
    var month = parseInt(date_split[1]);
    var day = parseInt(date_split[2]);

    var date_moment = String(day)+"."+String(month)+"."+String(year);
     console.log("MAIN date");
     console.log(date_moment);
    var new_date = moment(date_moment, "DD-MM-YYYY").add(1,'days');
	
	



    
    console.log("todays' date");
   
    date = new_date.format('YYYY')+'-'+new_date.format('MM')+'-'+new_date.format('DD');
    console.log(date);

    let report;
    let details;
    let bodypartArray = [];
    let arrayOfExercises = [];
    async function getData() {
        report = await db.overallReport(phizioemail, patientId, date);
        details = await db.PatientDetails(phizioemail, patientId);
		
		details = [ { _id: '5d19d5822962a8064b7f8889',
    phizioname: phizioname,
    phizioemail: phizioemail,
    phiziophone: phiziophone,
    phizioprofilepicurl:
     cliniclogo,
    phiziopatients:
     [ { _id: '5d45c32a01511a140512d7c7',
         patientid: patientId,
         patientname: patientName,
         numofsessions: '0',
         dateofjoin: dateofjoin,
         status: 'active',
         patientage: age,
         patientcasedes: patientcase,
         patientgender: patientgender,
         patientphone: '  ',
         patientprofilepicurl: 'empty',
         heldon: '2020-11-05 12:14:46' } ],
    
    address: address,   clinicname: clinicname, degree: degree } ];
    
	}

    getData().then(()=>{
        report[0].sessiondetails.forEach(set=>{
            let uniqueKey =
            set.orientation.toLowerCase() + set.bodypart.toLowerCase() + set.exercisename.toLowerCase();
            let orientation = set.orientation;
            let bodyPart = set.bodypart;
            let exercise = set.exercisename;
            let pair = {orientation, exercise, bodyPart };

            if (!arrayOfExercises.includes(uniqueKey)) {
              bodypartArray.push(pair);
              arrayOfExercises.push(uniqueKey);
            }
        });
    }).then(()=>{
        // var datestring_numofdays = getOverAllReportString(details[0].phiziopatients[0].dateofjoin, date);
        var datestring_numofdays = getOverAllReportString(details[0].phiziopatients[0].dateofjoin, date);
        var dateString = datestring_numofdays[0];
        var numofdays = datestring_numofdays[1];

        //console.log(JSON.parse(JSON.stringify(report[0])));

       res.render("overall_new", {
        title: "Overall Report",
        report,
        details,
        bodypartArray,
        dateString,
        numofdays,
        date,
        bodypart
      });
    });
});

// Testing

router.get("/generatereport/test/overall/:id/:email/:date/:bodypart/", async (req, res)=>{
    const patientId = req.params.id;
    const phizioemail = req.params.email;
    const bodypart = req.params.bodypart;
    console.log(bodypart);
    
    // Overall Report date add
  var date_moment = moment();
  date_moment = date_moment.toString();
  date_moment = date_moment.slice(4,16);
  let overall_report_add = {
    "patientid":patientId,
    "phizioemail":phizioemail,
    "sessiondetails":[{
        "heldon":null, 
        "date":null
    }],
    "overalldetails":[{
        "bodypart":bodypart, 
        "date":date_moment
    }]
    };
  const responeDb = await PheezeeAPI.addReport_overall(overall_report_add);
    

    var { date } = req.params;
    
    var date_split = date.split("-");
    
    var year = parseInt(date_split[0]);
    var month = parseInt(date_split[1]);
    var day = parseInt(date_split[2]);

    var date_moment = String(day)+"."+String(month)+"."+String(year);
     console.log("MAIN date");
     console.log(date_moment);
    var new_date = moment(date_moment, "DD-MM-YYYY").add(1,'days');



    
    console.log("todays' date");
   
    date = new_date.format('YYYY')+'-'+new_date.format('MM')+'-'+new_date.format('DD');
    console.log(date);

    let report;
    let details;
    let bodypartArray = [];
    let arrayOfExercises = [];
    async function getData() {
        report = await db.overallReport(phizioemail, patientId, date);
        details = await db.PatientDetails(phizioemail, patientId);
    }

    getData().then(()=>{
        report[0].sessiondetails.forEach(set=>{
            let uniqueKey =
            set.orientation.toLowerCase() + set.bodypart.toLowerCase() + set.exercisename.toLowerCase();
            let orientation = set.orientation;
            let bodyPart = set.bodypart;
            let exercise = set.exercisename;
            let pair = {orientation, exercise, bodyPart };

            if (!arrayOfExercises.includes(uniqueKey)) {
              bodypartArray.push(pair);
              arrayOfExercises.push(uniqueKey);
            }
        });
    }).then(()=>{
        var datestring_numofdays = getOverAllReportString(details[0].phiziopatients[0].dateofjoin, date);
        var dateString = datestring_numofdays[0];
        var numofdays = datestring_numofdays[1];

        //console.log(JSON.parse(JSON.stringify(report[0])));

       res.render("overall_v3", {
        title: "Overall Report",
        report,
        details,
        bodypartArray,
        dateString,
        numofdays,
        date,
        bodypart
      });
    });
});

// For back-comptibility
router.get("/getreport/overall/:id/:phizioemail/:date", async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;
  async function printPDF() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(
      `${URL}/generatereport/overall/${patientId}/${phizioemail}/${date}`,
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
    res.send(pdf);
  });
});

router.get("/generatereport/overall/:id/:email/:date", async (req, res)=>{
    const patientId = req.params.id;
    const phizioemail = req.params.email;
    const { date } = req.params;
    let report;
    let details;
    let bodypartArray = [];
    let arrayOfExercises = [];
    async function getData() {
        report = await db.overallReport(phizioemail, patientId, date);
        details = await db.PatientDetails(phizioemail, patientId);
    }

    getData().then(()=>{
        report[0].sessiondetails.forEach(set=>{
            let uniqueKey =
            set.orientation.toLowerCase() + set.bodypart.toLowerCase() + set.exercisename.toLowerCase();
            let orientation = set.orientation;
            let bodyPart = set.bodypart;
            let exercise = set.exercisename;
            let pair = {orientation, exercise, bodyPart };

            if (!arrayOfExercises.includes(uniqueKey)) {
              bodypartArray.push(pair);
              arrayOfExercises.push(uniqueKey);
            }
        });
    }).then(()=>{
        var datestring_numofdays = getOverAllReportString(details[0].phiziopatients[0].dateofjoin, date);
        var dateString = datestring_numofdays[0];
        var numofdays = datestring_numofdays[1];
       res.render("overall", {
        title: "Overall Report",
        report,
        details,
        bodypartArray,
        dateString,
        numofdays,
        date
      });
    });
});




async function emptyS3Directory(bucket, dir) {
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



async function phizioDayReport(patientId,phizioemail,date){
      const { phizioemail } = phizioemail;
      const { date } = date;
      async function printPDF() {
        const browser = await puppeteer.launch({ headless: true});
        const page = await browser.newPage();
        await page.goto(`${URL}/generatereport/${patientId}/${phizioemail}/${date}`, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          margin: {
            left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
          },
        });
        await browser.close();
        return pdf;
      }
      printPDF().then((pdf) => {
        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
        res.status(200).send(pdf);
      });
}


async function generateSportsReport(patientId,phizioemail,date,res){
    console.log(patientId,phizioemail,date);
      let report;
      let details;
      let lastsessions=[];
      let download_result_emg = [];
      let download_result_rom = []; 
      let python_variables = [];
      let sessionNo;
      var num_of_files_received = 0;
      var num_of_scripts_run = 0;
      async function getData() {
        report = await db.DailyReport(phizioemail, patientId, date);
        details = await db.PatientDetails(phizioemail, patientId);
        if(report.length>0 && typeof report!=='string'){
            for(var i=0; i<report[0].sessiondetails.length; i++){
               
			
			var exercisename = report[0].sessiondetails[i].exercisename;
			var orientation = report[0].sessiondetails[i].orientation;
            var bodypart = report[0].sessiondetails[i].bodypart;
			var musclename = report[0].sessiondetails[i].musclename;
			var bodyorientation = report[0].sessiondetails[i].bodyorientation;
            var lastsession = await db.lastSessionBasedOnExerciseAndJointAndOrientation(phizioemail,patientId,bodypart,exercisename,orientation,musclename,bodyorientation,date);
                lastsessions[i]=lastsession;
            }
            Debug && console.log(lastsessions);
        }
        let xyz = await db.sessionDates(phizioemail,patientId);
        sessionNo = Array.from(xyz).indexOf(date)+1;
        Debug && console.log(sessionNo);
      }
      getData().then(()=>{
        console.log("here2");
        for(var i=0;i<report[0].sessiondetails.length;i++){
            console.log(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata);
            downloadFile(report[0].sessiondetails[i].romdata,report[0].sessiondetails[i].emgdata).then(function(result){
                download_result_rom.push(result[0]);
                download_result_emg.push(result[1]);
                num_of_files_received++;
                if(num_of_files_received==report[0].sessiondetails.length){
                    console.log("here2");
                    for(var j=0;j<report[0].sessiondetails.length;j++){
                        if(report[0].sessiondetails[j].exercisename=='Isometric'){
                            runIsometricPythonScript(report[0].sessiondetails[0].activetime, report[0].sessiondetails[0].numofreps,
                            download_result_rom[0],download_result_emg[0]).then((res_py)=>{
                                console.log(res_py);
                                python_variables.push(res_py);
                                num_of_scripts_run++;
                                if(num_of_scripts_run==report[0].sessiondetails.length){
                                    console.log(python_variables);
                                }
                            });
                        }else{
                            console.log('here1');
                            runKineticPythonScript(report[0].sessiondetails[0].activetime, report[0].sessiondetails[0].numofreps,
                                download_result_rom[0],download_result_emg[0]).then((res_py)=>{
                                    console.log('here',res_py);
                                    python_variables.push(res_py);
                                    num_of_scripts_run++;
                                    if(num_of_scripts_run==report[0].sessiondetails.length){
                                        console.log(python_variables);
                                    }
                                });
                        }
                    }
                }
            });
        }
      });
}



let runKineticPythonScript =  async function(activetime, reps, romdata, emgdata,download_time_stamp){
    try{
    console.log(activetime, reps, "ROMDATA:" , romdata.length, "EMGDATA: ",emgdata.length);
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
          args: [activetime,reps,romdata.trim(), emgdata.trim(),download_time_stamp]
        };
        var test  = new PythonShell('velocityromtests.py',options);
        test.on('message', function (message) {
            //message = JSON.stringify(message);
            //message = JSON.parse(message);
            res_py = message;
            // console.log("Kranthi",res_py);
            resolve();
        });

        //console.log(activetime,reps, "ROM", romdata,"EMG", emgdata);
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


let runKineticPythonScript_isometric =  async function(activetime, reps, romdata, emgdata,download_time_stamp){
  
  try{
    let res_py;
    let emgl=emgdata.length;
  
  if(emgdata.length == 0 && romdata.length == 0)
  {   
      res_py={"velocity":0, "avg":0, "avgmaxemg":0,"contractions":0, "type_of":"ni","consistency":0,"smoothness":0,"controlled":0,"download_time_stamp":0,"rom_avg_max":0,"rom_avg_min":0,"rom_max":0,"rom_min":0,"coordination":0};
      return res_py;
  }
  return new Promise(function(resolve,reject)
  {    var slic =30000;
       if (emgl>15000)
       {
        if (emgl<slic){
        //  console.log("no sicing");
        }
        else{
          emgdata=emgdata.slice(0,slic);
          romdata=romdata.slice(0,slic);

        }
        fs.writeFile('emg.txt', emgdata, (err) => {
          if (err) throw err;
        })
      fs.writeFile('rom.txt', romdata, (err) => {
        if (err) throw err;
        
        })
        var flagd='1'
        var argum=[activetime,reps,download_time_stamp,flagd];
     }
     else{
      //var emgdata1=emgdata;
      //var romdata1=romdata;
      var flagd='0'
      var argum=[activetime,reps,download_time_stamp,flagd,romdata.trim(), emgdata.trim()];
     }
      let options = {
        mode: '',
        pythonPath: '',
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/home/ubuntu/pheezeebackend/python', // Quick fix for report generation.
        args: argum
      };
      var test  = new PythonShell('isometrictest.py',options);
      test.on('message', function (message) 
      {
          res_py = message;
          resolve();
      });
  }).then(function(){
      return res_py;
      //console.log("kranthi",res_py);
  });
  }
  catch(e)
  {
      res_py={"velocity":0, "avg":0, "avgmaxemg":0,"contractions":0, "type_of":"ii","consistency":0,"smoothness":0,"controlled":0,"download_time_stamp":0,"rom_avg_max":0,"rom_avg_min":0,"rom_max":0,"rom_min":0,"coordination":0};
   
      return res_py;
  }
}

let runIsometricPythonScript= async function(activetime, reps, romdata, emgdata){
    let res_py;
    res_py={"velocity":0, "avg":0, "avgmaxemg":0,"contractions":0, "type_of":"ni","consistency":0,"smoothness":0,"download_time_stamp":0};
     
        return res_py;
    return new Promise(function(resolve,reject){
        let options = {
          mode: '',
          pythonPath: '',
          pythonOptions: ['-u'], // get print results in real-time
          scriptPath: '/home/ubuntu/pheezeebackend/python',
          args: [activetime,reps,romdata.trim(), emgdata.trim(),download_time_stamp]
        };
        var test  = new PythonShell('isometrictest.py', { uid: 0 }, options);
        test.on('message', function (message) {
            res_py = message;
            console.log(res_py);
            resolve();
        });

        //console.log(activetime,reps, "ROM", romdata,"EMG", emgdata);
    }).then(function(){
        return res_py;
    });
}


let runTestPythonScript =  async function(activetime, reps, romdata, emgdata,download_time_stamp){
    try{
    console.log(activetime, reps, "ROMDATA:" , romdata.length, "EMGDATA: ",emgdata.length);
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
          args: [activetime,reps,romdata.trim(), emgdata.trim(),download_time_stamp]
        };
        var test  = new PythonShell('python_test.py',options);
        test.on('message', function (message) {
            //message = JSON.stringify(message);
            //message = JSON.parse(message);
            res_py = message;
            // console.log(res_py);
            resolve();
        });

        //console.log(activetime,reps, "ROM", romdata,"EMG", emgdata);
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

function downloadFile(keyrom_received,keyemg_received){
  var objectData=[];
  var timestamp = '';
  timestamp = keyrom_received;
  timestamp = timestamp.substr(timestamp.length-27);
  timestamp = timestamp.substr(0,19);
 // console.log(timestamp);

  return new Promise(function(resolve,reject){
    var getParams = {
      Bucket: 'pheezee', // your bucket name,
      Key: keyrom_received // path to the object you're looking for
    };

    try{
    s3Client.getObject(getParams, function(err, data) {
    // Handle any error and exit
    
    if (err)
    {
       // console.log(err);
       // return err;
    }else{  
      objectData[0] = data.Body.toString('utf-8');
      //console.log(objectData[0]);
    } 
      var getParams2 = {
        Bucket: 'pheezee', // your bucket name,
        Key: keyemg_received // path to the object you're looking for
      };

      s3Client.getObject(getParams2, function(err1, data1){
          if(err1){
            reject();
           // return err1;
          }
        
          objectData[1] = data1.Body.toString('utf-8');
          objectData[2] = timestamp;
          resolve();
      });
  
  });
    }
    catch(err)
    {
        return 0;
    };

  }).then(function(){
    return objectData;
  });
}

router.get("/newapk",function (req, res) {
    var file = fs.readFileSync(__dirname+"/../public/newapk.apk", 'binary');
    res.setHeader('Content-Type','application/vnd.android.package-archive');
    res.write(file, 'binary');
    res.end();
});

// Invoice generation

router.get("/getinvoice/:id/:phizioemail/:date", async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;

  async function printPDF() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(
      `${URL}/generateinvoice/${patientId}/${phizioemail}/${date}`,
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
    res.send(pdf);
  });
});


router.get("/generateinvoice/:id/:email/:date", async (req, res)=>{
    const patientId = req.params.id;
    const phizioemail = req.params.email;
    const { date } = req.params;
	
	details = await db.PhizioDetails(phizioemail);
// 	console.log("debug");
// 	console.log(details);
   

       res.render("invoice", {
		   phizioemail,
		   details,
        title: "Overall Report",
        date
      });
});


//Happy Shoulder Support
/* GET generate and download PDF */
router.get('/getreport/happyshoulder/:id/:phizioemail/:date/:patientName/:dateofjoin/:patientgender/:patientcase/:phizioname/:phiziophone/:cliniclogo/:address/:clinicname/:degree/:age', async (req, res) => {
  const patientId = req.params.id;
  const { phizioemail } = req.params;
  const { date } = req.params;
  
const  patientName  = req.params.patientName;
  const  dateofjoin  = req.params.dateofjoin;
  const  patientgender  = req.params.patientgender;
  const  patientcase  = req.params.patientcase;
  const  phizioname  = req.params.phizioname;
  const  phiziophone  = req.params.phiziophone;
  const  cliniclogo  = req.params.cliniclogo;
  const  address  = req.params.address;
  const  clinicname  = req.params.clinicname;
  const  degree  = req.params.degree;
  const  age  = req.params.age;
  
//   console.log(patientName);
  
  
  


 // let phizio_type = await PheezeeAPI.getPhizioType(phizioemail);
  //console.log(phizio_type);


    async function printPDF() {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    await page.goto(`${URL}/generatereport/happyshoulder/${patientId}/${phizioemail}/${date}/${patientName}/${dateofjoin}/${patientgender}/${patientcase}/${phizioname}/${phiziophone}/${cliniclogo}/${address}/${clinicname}/${degree}/${age}`, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm',
      },
    });
    await browser.close();
    return pdf;
   }
    printPDF().then((pdf) => {
        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
        res.status(200).send(pdf);
    });
  
});


/*
* By Ravi Ranjan
* 
* The following APIs are meant to be 
*/

const isLoggedIn = function (req, res, next) {
    // console.log(req._parsedOriginalUrl.path);
    if (req.isAuthenticated()) {
        return next();
    }
    // req.flash("error", "You need to be logged in to do that!");
    res.redirect("/dashboard/login");
};


router.get("/dashboard", isLoggedIn, async function (req, res) {
  let overallData = await db.getOverallHomepage(req.query);
  let deviceActivity = await db.getDeviceActivitySummary();
  let patientSummary = await db.getPatientSummaryDayWise();
  let topUsers = await db.getTopUsers();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  let topAccounts = await db.getTopAccounts();
  let deviceData = await db.kranthi();
//   console.log(deviceData);

  let dataFromSessionData = await db.getDataFromSessionData();
  let userActivityOverall = await db.getAllSessionTimeStamp();
  let usersData = await db.getUsersData();

  res.render("dashboard/dashboard", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    overallData,
    deviceActivity,
    patientSummary,
    topUsers,
    dailyDeviceActivity,
    topAccounts,
    dataFromSessionData,
    userActivityOverall,
    usersData,
    deviceData
  })
})


router.get("/dashboard/dashboard_v1", isLoggedIn, async function (req, res) {
  let deviceHealthData = await db.getAllDeviceDetails();
  let patientSessionDataByUserId = await db.getSessionDetailsByUserID();
  let patientSessionDataByClinic = await db.getSessionDetailsByClinic();
  let patientSessionDataByDate = await db.getSessionDetailsByDate();
  let deviceActivityByMonth = await db.numberOfActiveDevicesByMonth();
  let deviceActivityByDay = await db.getDailyDeviceActivityByUsers();
  
  res.render("dashboard/dashboard_v1", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    patientSessionDataByUserId,
    patientSessionDataByClinic,
    deviceHealthData,
    patientSessionDataByDate,
    deviceActivityByMonth,
    deviceActivityByDay
  });
});

// router.get('/user-info', (req, res) => {
//     res.send("Hello");
// })

router.get("/dashboard/user-info", isLoggedIn, async function (req, res) {
  let overallSessionActivity = await db.getAllSessionTimeStamp();
  let dataFromSessionData = await db.getDataFromSessionData();
  let usersData = await db.getUsersData();
  let usersWithDevices = await db.getDeviceDataByUsers();

  let data = []

  usersData.map((e, i) => {
    if (e.numberOfPatients == 0) {
      data.push({ ...e, numberOfSessions: 0 })
    } else {
      dataFromSessionData.map((el, idx) => {
        usersWithDevices.map((element, index) => {
          if (el._id == e.phizioemail && element._id == e.phizioemail && el._id == element._id) {
            data.push({ ...e, ...el, ...element })
          }
        })
      })
    }
  })
  res.render("dashboard/user-info", {
    author: "Ravi Ranjan",
    title: "Pheezee | Users",
    overallSessionActivity,
    dataFromSessionData,
    usersData,
    usersWithDevices,
    data
  });
});



router.get("/dashboard/users", isLoggedIn, async function (req, res) {
  let overallSessionActivity = await db.getAllSessionTimeStamp();
  let dataFromSessionData = await db.getDataFromSessionData();
  let usersData = await db.getUsersData();
  let usersWithDevices = await db.getDeviceDataByUsers();

  let data = []

  usersData.map((e, i) => {
    if (e.numberOfPatients == 0) {
      data.push({ ...e, numberOfSessions: 0 })
    } else {
      dataFromSessionData.map((el, idx) => {
        usersWithDevices.map((element, index) => {
          if (el._id == e.phizioemail && element._id == e.phizioemail && el._id == element._id) {
            data.push({ ...e, ...el, ...element })
          }
        })
      })
    }
  })
  res.render("dashboard/users", {
    author: "Ravi Ranjan",
    title: "Pheezee | Users",
    overallSessionActivity,
    dataFromSessionData,
    usersData,
    usersWithDevices,
    data
  });
});

router.get("/dashboard/sessionreport", isLoggedIn, async function (req, res) {
  let patientSessionDataByUserId = await db.getSessionDetailsByUserID();
  let patientSessionDataByClinic = await db.getSessionDetailsByClinic();
  let patientSessionDataByDate = await db.getSessionDetailsByDate();
  res.render("dashboard/sessionreport", {
    author: "Ravi Ranjan",
    title: "Pheezee | Session Report Analysis",
    patientSessionDataByUserId,
    patientSessionDataByClinic,
    patientSessionDataByDate
  });
});

router.get("/dashboard/devicereport", isLoggedIn, async function (req, res) {
  let deviceDetails = await db.getDeviceDetails();
  let { usersWithPatients } = await db.getTopUsers();
  let deviceActivity = await db.getDeviceActivitySummary();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  res.render("dashboard/devicereport", {
    author: "Ravi Ranjan",
    title: "Pheezee | Device Report Analysis",
    deviceDetails,
    deviceActivity,
    dailyDeviceActivity,
    usersWithPatients
  })
})

router.get("/dashboard/testing", async function (req, res) {
  let deviceDetails = await db.getDeviceDetails();
  let { usersWithPatients } = await db.getTopUsers();
  let deviceActivity = await db.getDeviceActivitySummary();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  res.render("dashboard/devicereport", {
    author: "Ravi Ranjan",
    title: "Pheezee | Device Report Analysis",
    deviceDetails,
    deviceActivity,
    dailyDeviceActivity,
    usersWithPatients
  })
})

router.get("/dashboard/devicereport_v1", isLoggedIn, async function (req, res) {
  let deviceHealthData = await db.getAllDeviceDetails();
  let deviceActivityByMonth = await db.numberOfActiveDevicesByMonth();
  let deviceActivityByDay = await db.getDailyDeviceActivityByUsers();
  res.render("dashboard/devicereport", {
    author: "Ravi Ranjan",
    title: "Pheezee | Device Report Analysis",
    deviceHealthData,
    deviceActivityByMonth,
    deviceActivityByDay
  })
})

router.post('/register', async(req, res) => {
    const newUser = {
        username: req.body.username
    }
    User.register(newUser, req.body.password, function(err, user) {
      if (err) {
        return res.render("dashboard/login", {
          error: err.message
        });
      }
      passport.authenticate("local")(req, res, function() {
        res.redirect("/dashboard");
      });
    });
})


router.get('/dashboard/login', async(req, res) => {
    if(req.user) {
        res.redirect("/dashboard");
    } else {
        res.render("dashboard/login", { title: "Login Users"} )
    }
})

router.post('/dashboard/login', passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/dashboard/login",
    failureFlash: true
}), function(req, res) {
    // console.log(req)
    if(req.user) {
        res.redirect("/dashboard");
    }
})

router.get('/dashboard/logout', function(req, res) {
    req.logout();
    res.redirect("/dashboard/login");
});

router.get('/user-data', async(req, res) => {
    let data = {}
    data.patientData = await db.getPatientNumber();
    data.deviceData = await db.getDeviceDataAllAtOnce();
    data.reportData = await db.getReportData();
    res.json(data);
})

router.get('/postsales-data', async(req, res) => {
    let data = {}
    data.patientData = await db.getPatientNumber();
    data.deviceData = await db.getDeviceDataAllAtOnce();
    data.reportData = await db.getReportData();
    res.json(data);
})


  router.get('/dashboard/device-status-info', (req, res) => {
      res.render("dashboard/device_info")
  }) 
  router.post('/post-feedback', async (req, res) => {
  const data = JSON.parse(JSON.stringify(req.body));
  const response = await db.createDeviceRecord(data); 
  res.redirect('/dashboard/get_doc_msgs')
  });
    
router.get('/dashboard/edit-device-info', (req, res) => {
  res.render("dashboard/edit-device-info")
}) 



router.post('/post-edit', async (req, res) => {
const data = JSON.parse(JSON.stringify(req.body));
// console.log(data);
const response = await db.updateDeviceRecord(data); 
res.redirect('/dashboard/get_doc_msgs')
});

    
router.get('/dashboard/get_doc_msgs', async(req, res)=>{
 let deviceData = await db.kranthi();
 res.render("dashboard/kranthi", {
  author: "Ravi Ranjan",
  title: "Pheezee | Session Report Analysis",
  deviceData,
});
})



router.get('/dashboard/sold_device', async(req, res)=>{
 let deviceData = await db.kranthi();
 res.render("dashboard/sold", {
  author: "Ravi Ranjan",
  title: "Pheezee | Session Report Analysis",
  deviceData,
});
})

router.get('/dashboard/development_device', async(req, res)=>{
 let deviceData = await db.kranthi();
 res.render("dashboard/development", {
  author: "Ravi Ranjan",
  title: "Pheezee | Session Report Analysis",
  deviceData,
});
})
router.get('/dashboard/demo_device', async(req, res)=>{
 let deviceData = await db.kranthi();
 res.render("dashboard/demo", {
  author: "Ravi Ranjan",
  title: "Pheezee | Session Report Analysis",
  deviceData,
});
})
router.get('/dashboard/production_device', async(req, res)=>{
 let deviceData = await db.kranthi();
 res.render("dashboard/production", {
  author: "Ravi Ranjan",
  title: "Pheezee | Session Report Analysis",
  deviceData,
});
})
router.get('/dashboard/clinical_device', async(req, res)=>{
 let deviceData = await db.kranthi();
 res.render("dashboard/clinical", {
  author: "Ravi Ranjan",
  title: "Pheezee | Session Report Analysis",
  deviceData,
});
})


router.get("/dashboard/sold", isLoggedIn, async function (req, res) {
  let overallData = await db.getOverallHomepage(req.query);
  let deviceActivity = await db.getDeviceActivitySummary();
  let patientSummary = await db.getPatientSummaryDayWise();
  let topUsers = await db.getTopUsers();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  let topAccounts = await db.getTopAccounts();
  let deviceData = await db.kranthi();
//   console.log(deviceData);

  let dataFromSessionData = await db.getDataFromSessionData();
  let userActivityOverall = await db.getAllSessionTimeStamp();
  let usersData = await db.getUsersData();

  res.render("dashboard/dashboard_sold", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    overallData,
    deviceActivity,
    patientSummary,
    topUsers,
    dailyDeviceActivity,
    topAccounts,
    dataFromSessionData,
    userActivityOverall,
    usersData,
    deviceData
  })
})
router.get("/dashboard/demo", isLoggedIn, async function (req, res) {
  let overallData = await db.getOverallHomepage(req.query);
  let deviceActivity = await db.getDeviceActivitySummary();
  let patientSummary = await db.getPatientSummaryDayWise();
  let topUsers = await db.getTopUsers();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  let topAccounts = await db.getTopAccounts();
  let deviceData = await db.kranthi();
//   console.log(deviceData);

  let dataFromSessionData = await db.getDataFromSessionData();
  let userActivityOverall = await db.getAllSessionTimeStamp();
  let usersData = await db.getUsersData();

  res.render("dashboard/dashboard_demo", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    overallData,
    deviceActivity,
    patientSummary,
    topUsers,
    dailyDeviceActivity,
    topAccounts,
    dataFromSessionData,
    userActivityOverall,
    usersData,
    deviceData
  })
})

router.get("/dashboard/clinical", isLoggedIn, async function (req, res) {
  let overallData = await db.getOverallHomepage(req.query);
  let deviceActivity = await db.getDeviceActivitySummary();
  let patientSummary = await db.getPatientSummaryDayWise();
  let topUsers = await db.getTopUsers();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  let topAccounts = await db.getTopAccounts();
  let deviceData = await db.kranthi();
//   console.log(deviceData);

  let dataFromSessionData = await db.getDataFromSessionData();
  let userActivityOverall = await db.getAllSessionTimeStamp();
  let usersData = await db.getUsersData();

  res.render("dashboard/dashboard_clinical", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    overallData,
    deviceActivity,
    patientSummary,
    topUsers,
    dailyDeviceActivity,
    topAccounts,
    dataFromSessionData,
    userActivityOverall,
    usersData,
    deviceData
  })
})

router.get("/dashboard/development", isLoggedIn, async function (req, res) {
  let overallData = await db.getOverallHomepage(req.query);
  let deviceActivity = await db.getDeviceActivitySummary();
  let patientSummary = await db.getPatientSummaryDayWise();
  let topUsers = await db.getTopUsers();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  let topAccounts = await db.getTopAccounts();
  let deviceData = await db.kranthi();
//   console.log(deviceData);

  let dataFromSessionData = await db.getDataFromSessionData();
  let userActivityOverall = await db.getAllSessionTimeStamp();
  let usersData = await db.getUsersData();

  res.render("dashboard/dashboard_development", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    overallData,
    deviceActivity,
    patientSummary,
    topUsers,
    dailyDeviceActivity,
    topAccounts,
    dataFromSessionData,
    userActivityOverall,
    usersData,
    deviceData
  })
})

router.get("/dashboard/production", isLoggedIn, async function (req, res) {
  let overallData = await db.getOverallHomepage(req.query);
  let deviceActivity = await db.getDeviceActivitySummary();
  let patientSummary = await db.getPatientSummaryDayWise();
  let topUsers = await db.getTopUsers();
  let dailyDeviceActivity = await db.getDailyDeviceActivity();
  let topAccounts = await db.getTopAccounts();
  let deviceData = await db.kranthi();
//   console.log(deviceData);

  let dataFromSessionData = await db.getDataFromSessionData();
  let userActivityOverall = await db.getAllSessionTimeStamp();
  let usersData = await db.getUsersData();

  res.render("dashboard/dashboard_production", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    overallData,
    deviceActivity,
    patientSummary,
    topUsers,
    dailyDeviceActivity,
    topAccounts,
    dataFromSessionData,
    userActivityOverall,
    usersData,
    deviceData
  })
})

router.get("/dashboard/database", isLoggedIn, async function (req, res) {
    
    let usersData = await db.getUsersData();
    let usersWithDevices = await db.getDeviceDataByUsers();
    let deviceDatas = await db.getDeviceDataAllAtOnce();
    let deviceData = await db.kranthi();
    
     res.render("dashboard/testing", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    usersData,
    usersWithDevices,
    deviceDatas,
    deviceData
  })
    
    
//   let data = {}
// //   data.overallSessionActivity = await db.getAllSessionTimeStamp();
// //   data.dataFromSessionData = await db.getDataFromSessionData();
//   data.usersData = await db.getUsersData();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   res.json(data);
  
});

router.get("/dashboard/session", async function (req, res) {
    
    let getDataFromSession = await db.getDataFromSession();
    res.render("dashboard/session", {
    author: "Ravi Ranjan",
    title: "Pheezee | Dashboard",
    getDataFromSession
  })
    
    
//   let data = {}
// //   data.overallSessionActivity = await db.getAllSessionTimeStamp();
// //   data.dataFromSessionData = await db.getDataFromSessionData();
//   data.usersData = await db.getUsersData();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   res.json(data);
  
});

router.get("/databases", async(req, res) => {
    
    
    
  let data = {}
//   data.overallSessionActivity = await db.getAllSessionTimeStamp();
  data.dataFromSessionData = await db.getDataFromSessionData();
//   data.userpopstatus = await db.getAllPatientSessionDetails();
//   data.usersData = await db.kranthi_data_k();
//   data.deviceLocation = await db.deviceLocation();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   data.deviceDatas = await db.getDeviceDataAllAtOnce();
//   data.calbration = await db.calbration();
//   data.deviceData = await db.kranthi();
//   data.health = await db.health();


  res.json(data);
  
  
  
});


router.get("/sree", async(req, res) => {
    
    
    
  let data = {}
//   data.overallSessionActivity = await db.getAllSessionTimeStamp();
//   data.dataFromSessionData = await db.getDataFromSessionData();
//   data.userpopstatus = await db.getAllPatientSessionDetails();
  data.usersData = await db.kranthi_data_k();
//   data.deviceLocation = await db.deviceLocation();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   data.deviceDatas = await db.getDeviceDataAllAtOnce();
//   data.calbration = await db.calbration();
//   data.deviceData = await db.kranthi();
//   data.health = await db.health();


  res.json(data);
  
  
  
});

router.get("/pheezee_data1", async(req, res) => {
    
    
    
  let data = {}
  
  data.calbration = await db.calbration();


    res.json(data);
  
  
});

router.get("/pheezee_data2", async(req, res) => {
    
    
    
  let data = {}
  
  data.dataFromSessionData = await db.getDataFromSessionAll();
//   data.overallSessionActivity = await db.getAllSessionTimeStamp();
//   data.dataFromSessionData = await db.getDataFromSession();
//   data.usersData = await db.getUsersData();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   data.deviceDatas = await db.getDeviceDataAllAtOnce();
//   data.deviceData = await db.kranthi();
//   data.health = await db.health


    res.json(data);
  
  
});






router.get("/pheezee_datas", async(req, res) => {
    
    
    
  let data = {}
//   data.overallSessionActivity = await db.getAllSessionTimeStamp();
//   data.dataFromSessionData = await db.getDataFromSessionData();
  data.usersData = await db.getUsersData();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   data.deviceDatas = await db.getDeviceDataAllAtOnce();
//   data.deviceData = await db.kranthi();
//   data.health = await db.health();

  res.json(data);
  
  
  
});


router.get("/pheezee_report_data", async(req, res) => {
    
    
    
  let data = {}
//   data.overallSessionActivity = await db.getAllSessionTimeStamp();
//   data.dataFromSessionData = await db.getDataFromSessionData();
  data.usersData = await db.getnewreportdata();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   data.deviceDatas = await db.getDeviceDataAllAtOnce();
//   data.deviceData = await db.kranthi();
//   data.health = await db.health();

  res.json(data);
  
  
  
});

router.get("/pheezee_datas_2", async(req, res) => {
    
    
    
  let data = {}
//   data.overallSessionActivity = await db.getAllSessionTimeStamp();
//   data.dataFromSessionData = await db.getDataFromSessionData();
  data.usersData = await db.getUsersData();
//   data.usersWithDevices = await db.getDeviceDataByUsers();
//   data.deviceDatas = await db.getDeviceDataAllAtOnce();
//   data.deviceData = await db.kranthi();
//   data.health = await db.health();

  res.json(data);
  
  
  
});

router.get("/patientsessiondatas", async(req, res) => {
  let data = {}
  data.session = await db.session();
   res.json(data);
});
router.get("/phiziousers", async(req, res) => {
  let data = {}
  data.phiziousers = await db.phiziousers();
   res.json(data);
});
router.get("/reportdatas", async(req, res) => {
  let data = {}
  data.reportdatas = await db.reportdatas();
   res.json(data);
});





router.get('/dashboard/app_version', async(req, res)=>{
 let usersData = await db.getUsersData();
 res.render("dashboard/app_data", {
  author: "Ravi Ranjan",
  title: "Pheezee | Session Report Analysis",
  usersData,
});
})

router.get('/normative', async(req, res)=>{
 let getinfostatus = await db.getinfostatus();
//  let getUsersDatas = await db.getUsersDatas();
 
 res.json({
  getinfostatus,
//   getUsersDatas,

});
})


router.get('/normative1', async(req, res)=>{
 let getAllPatientSessionDetails = await db.getAllPatientSessionDetails();
 let getUsersDatas = await db.getUsersDatas();
//  console.log(getUsersDatas);

 res.json({
  getAllPatientSessionDetails,
  getUsersDatas,
});
})



router.get('/dashboard/premium_sub_report', async(req, res)=>{
    
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
    
      try {
        const dataArray = JSON.parse(data);
         res.render("dashboard/sub_data", {
          author: "Kranthi Kiran Burra",
          title: "Pheezee | Session Report Analysis",
          dataArray,
        });
        // console.log(dataArray);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });

})

// router.get('/dashboard/premium_sub_report_kranthitesting', async(req, res)=>{
    
//     const fs = require('fs');
//     const path = require('path');
    
//     const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');
    
//      fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ error: 'Internal server error' });
//     }

//     try {
//       const jsonData = JSON.parse(data);

//       const modifiedData = jsonData.map(item => ({
//         ...item,
//         status: false
//       }));

//       fs.writeFile(filePath, JSON.stringify(modifiedData, null, 2), 'utf8', err => {
//         if (err) {
//           console.error(err);
//           return res.status(500).json({ error: 'Internal server error' });
//         }

//         res.json(modifiedData);
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });
    
// })









// router.get('/dashboard/premium_sub_report_update', async(req, res) => {
//   const fs = require('fs');
//   const path = require('path');

//   const filePath = path.join('/home/ubuntu/pheezeebackend/controllers/report_records.json');

//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       return;
//     }

//     try {
//       const dataArray = JSON.parse(data);
      
//       // Update and override values in dataArray
//       const updatedArray = dataArray.map(item => ({
//         "Phisioemail": item.Phisioemail,
//         "customer_type_status": "null",
//         "start_date": "null",
//         "end_date":  "null",
//         "number_of_report": 0,
//         "amount_worth_report": 0,
//         "number_of_accessable_generate": "0"
//       }));

//       // Convert updatedArray to JSON
//       const updatedJSON = JSON.stringify(updatedArray, null, 2);

//       // Write the JSON to a file
//       const outputFilePath = path.join('/home/ubuntu/pheezeebackend/controllers/modified_report_records.json');
//       fs.writeFile(outputFilePath, updatedJSON, err => {
//         if (err) {
//           console.error('Error writing to file:', err);
//           return;
//         }
        
//         console.log('Output JSON file has been updated.');

//         res.render("dashboard/sub_data", {
//           author: "Kranthi Kiran Burra",
//           title: "Pheezee | Session Report Analysis",
//           dataArray: updatedArray, // Render the updated array
//         });
//       });
//     } catch (error) {
//       console.error('Error parsing JSON:', error);
//     }
//   });
// })





router.get('/dashboard/kranthi_sub_testing', async(req, res)=>{
    
   
         res.render("dashboard/kranthi_sub_test", {
          author: "Kranthi Kiran Burra",
          title: "Pheezee | Session Report Analysis",

        });

      
})

router.get('/dashboard/user_name_password_api', async(req, res)=>{
    
   
         res.render("dashboard/user_name_password_file", {
          author: "Kranthi Kiran Burra",
          title: "Pheezee | Session Report Analysis",

        });

      
})






router.get('/dashboard/device_records_api', async(req, res)=>{
    
   
         res.render("dashboard/device_records_file", {
          author: "Kranthi Kiran Burra",
          title: "Pheezee | Session Report Analysis",

        });

      
})
router.get('/dashboard/user_report_count_api', async(req, res)=>{
    
   
         res.render("dashboard/user_report_count_file", {
          author: "Kranthi Kiran Burra",
          title: "Pheezee | Session Report Analysis",

        });

      
})

router.get('/dashboard/report_all_user_api', async(req, res)=>{
    
   
         res.render("dashboard/report_all_user_file", {
          author: "Kranthi Kiran Burra",
          title: "Pheezee | Session Report Analysis",

        });

      
})

router.get('/internet_status', async(req, res)=>{
    
   
         res.json({
          author: "Kranthi Kiran Burra",
          title: "Pheezee | Session Report Analysis",
        });

      
})






module.exports = router;