    "use strict"


/**
*DATABASE VERSION:- 2
*The first data base migration. Changing the database structure from storing entire data in database to
*storing the rom and emg values in s3 bucket as files.
*/
var mongodb = require("mongodb");
const AWS = require('aws-sdk');

var client = mongodb.MongoClient;
let url  = "mongodb://localhost:27017/StartoonLabs";

var s3Client = new AWS.S3({
        accessKeyId:'AKIAJKA2C2DLAESWCURA',
        secretAccessKey:'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'});

client.connect(url, async function (err, client) {
    
    var db = client.db("StartoonLabs");
    var collection = db.collection("patientsessiondatas");
    var query = {};
    
    var cursor = collection.find(query);
    
    cursor.forEach(
        async function(doc) {
        	if(typeof doc.sessiondetails ==='undefined'){
        	}else{
        		var sessiondetails = doc.sessiondetails;
        		sessiondetails.forEach(async function(doc1){
	           	if(typeof doc1.emgdata!=='undefined' && typeof doc1.emgdata!=='string'){
	           		var temp_key = 'physiotherapist/'+doc.phizioemail+'/patients/'+doc.patientid+'/sessions/'+doc1.heldon+'/'+'emg.txt';
	           		var params = { 
				        Bucket: 'pheezee', Key: temp_key,
				        ContentType: 'text/plain; Charset=utf-8',
				        //Body:Buffer.from(data.data,'binary')
				        Body:doc1.emgdata.toString()
				    };

				    s3Client.upload(params, function (err, data) {
				                if (err) {
				                    console.log("Error creating the folder: ", err);
				                } else {
				                	/*doc1.emgdata = 'abc';
				                    doc1.emgdata = temp_key;
				                    console.log(doc1.emgdata);*/
				                }
				    });
				    doc1.emgdata = temp_key;
	           		
	           	}
	           	if(typeof doc1.romdata!=='undefined' && typeof doc1.romdata!=='string'){
	           		var temp_key = 'physiotherapist/'+doc.phizioemail+'/patients/'+doc.patientid+'/sessions/'+doc1.heldon+'/'+'rom.txt';
	           		var params = { 
				        Bucket: 'pheezee', Key: temp_key,
				        ContentType: 'text/plain; Charset=utf-8',
				        //Body:Buffer.from(data.data,'binary')
				        Body:doc1.romdata.toString()
				    };

				    s3Client.upload(params, function (err, data) {
				                if (err) {
				                    console.log("Error creating the folder: ", err);
				                } else {
				                	/*doc1.romdata = 'abc';
				                    doc1.romdata = temp_key;
				                    console.log(doc1.romdata);*/
				                }
				    });
				    
				    doc1.romdata = temp_key;
	           	}

	           	if(typeof doc1.activetime === 'undefined'){
				    	doc1.activetime = '00m: 00s';
				    }
				    if(typeof doc1.mmtgrade === 'undefined'){
				    	doc1.mmtgrade = '0';
				    }
				    if(typeof doc1.exercisename === 'undefined'){
				    	doc1.exercisename = '';
				    }
				    if(typeof doc1.commentsession === 'undefined'){
				    	doc1.commentsession = '';
				    }
				    if(typeof doc1.orientation === 'undefined'){
				    	doc1.orientation = 'Left'
				    }
				    if(typeof doc1.repsselected === 'undefined'){
				    	doc1.repsselected = 0;
				    }
				    if(typeof doc1.musclename === 'undefined'){
				    	doc1.musclename = '';
				    }
				    if(typeof doc1.bodyorientation === 'undefined'){
				    	doc1.bodyorientation = 'Sit';
				    }
				    if(typeof doc1.sessiontype === 'undefined'){
				    	doc1.sessiontype = 'Active';
				    }
				    if(typeof doc1.minangleselected === 'undefined'){
				    	doc1.minangleselected = '';
				    }
				    if(typeof doc1.maxangleselected === 'undefined'){
				    	doc1.maxangleselected = '';
				    }
				    if(typeof doc1.maxemgselected === 'undefined'){
				    	doc1.maxangleselected = '';
				    }
				    if(typeof doc1.sessioncolor === 'undefined'){
				    	doc1.sessioncolor = 0;
				    }
				    if(typeof doc1.emgdata === 'undefined'){
				    	doc1.emgdata = 'invalid';
				    }
				    if(typeof doc1.romdata === 'undefined'){
				    	doc1.romdata = 'invalid';
				    }
    		})
        	await collection.save(doc);
        }
    }, 
        function(err) {
            client.close();
        }
    );
    // Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/
    
});