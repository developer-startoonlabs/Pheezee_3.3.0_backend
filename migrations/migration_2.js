    "use strict"


/**
*DATABASE VERSION:- 2
*The first data base migration. Changing the database structure from storing entire data in database to
*storing the rom and emg values in s3 bucket as files.
*/
var mongodb = require("mongodb");
var client = mongodb.MongoClient;
let url  = "mongodb://localhost:27017/StartoonLabs";

client.connect(url, async function (err, client) {
    
    var db = client.db("StartoonLabs");
    var collection = db.collection("phiziousers");
    var query = {};
    
    var cursor = collection.find(query);
    cursor.forEach(
        async function(doc) {
        	if(typeof doc.phiziopatients ==='undefined'){
        	}else{
        		var phiziopatients = doc.phiziopatients;
        		phiziopatients.forEach(async function(doc1){
        			delete doc1.sessions;
        			delete doc1.mmtsessions;
        			delete doc1.calibrationSession;
        		});
    		}
        	await collection.save(doc);
    }, 
        function(err) {
            client.close();
        }
    );


});