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
    if(err)
        console.log(err);
    else{
        var db = client.db("StartoonLabs");
        var collection = db.collection("phiziousers");
        console.log("hello");
        await collection.updateMany({},{$set:{'type':1}});   
    }
});