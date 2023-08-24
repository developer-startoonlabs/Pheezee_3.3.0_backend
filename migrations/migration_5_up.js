"use strict"


/**
*DATABASE VERSION:- 2
*The first data base migration. Changing the database structure from storing entire data in database to
*storing the rom and emg values in s3 bucket as files.
*/
var mongodb = require("mongodb");
var client = mongodb.MongoClient;
let url  = "mongodb://localhost:27017/StartoonLabs";
console.log('........Connecting database........');

client.connect(url, {useNewUrlParser: true}, async function (err, client) {
    if(err)
        console.log(err);
    else{
        var db = client.db("StartoonLabs");
        var collection_phiziousers = db.collection("phiziousers");
        var collection_devicestatus = db.collection("devicehealthdatas");
        console.log("........Migrating database please wait........");
        let response1 = await collection_phiziousers.updateMany({},{$set:{'packagetype':2, 'packageid':null}});
        let response2 = await collection_devicestatus.updateMany({},{$set:{'packageid':null}});   
        if(response1.result.ok==1  && response2.result.ok==1 ){
            console.log("Migrated to database version 5");
            client.close();
        }
    }
});