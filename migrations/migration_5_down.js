"use strict"


/**
*DATABASE VERSION:- 5
*
*/
var mongodb = require("mongodb");
var client = mongodb.MongoClient;
let url  = "mongodb://localhost:27017/StartoonLabs";

console.log('........Connecting database........');

client.connect(url,{useNewUrlParser: true}, async function (err, client) {
    
    if(err)
        console.log(err);
    else{
        var db = client.db("StartoonLabs");
        var collection_phiziousers = db.collection("phiziousers");
        var collection_devicestatus = db.collection("devicehealthdatas");
        console.log("........Migrating database please wait........");
        let response1 = await collection_phiziousers.updateMany({},{$unset:{'packagetype':"", 'packageid':""}});
        let response2 = await collection_devicestatus.updateMany({},{$unset:{'packageid':""}});   
        if(response1.result.ok==1  && response2.result.ok==1){
            console.log("Migrated to database version 4");
            client.close();
        }
    }
});