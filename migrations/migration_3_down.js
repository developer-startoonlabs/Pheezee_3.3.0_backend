"use strict"


/**
*DATABASE VERSION:- 3
*
*/
var mongodb = require("mongodb");
var client = mongodb.MongoClient;
let url  = "mongodb://localhost:27017/StartoonLabs";

client.connect(url,{useNewUrlParser: true}, async function (err, client) {
    
    if(err)
        console.log(err);
    else{
        var db = client.db("StartoonLabs");
        var collection = db.collection("phiziousers");
        console.log("hello");
        await collection.updateMany({},{$unset:{'type':""}});   
    }

});