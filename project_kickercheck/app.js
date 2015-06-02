//Redis.io NoSQL Datenbankmodul für Node.js einbinden 
var redis=require('redis');
//Client für die Abfrage von Daten aus der Redis DB erzeugen 
var client=redis.createClient();
//
var ValidatorXML = require("libxml.js");

//Express Modul einbinden 
var express=require('express');
//bodyParser modul einbinden und in "bodyparser" ablegen
var bodyParser= require('body-parser');
//jsonParser inszanziieren und in "jsonParser" ablegen 
var jsonParser=bodyParser.json();
//Expressinstanz anlegen und in "app" ablegen 
var app=express();

app.use(express.static(__dirname + '/styles'));
app.use(express.static(__dirname + '/Assets/XMLValidation'));

app.get('/Benutzer/{BenutzerId}', function(req,res){
});

app.post('/Benutzer', function(req,res){
    //Wenn acceptedTypes != Null war der Content Type der Anfrage application/xml
    var acceptedTypes=req.accepts('application/xml');
    if(acceptedTypes){
        //Userdatensatz in die Datenbank einfügen
        
    }
    else{
        req.status(406).send("Content Type wird nicht unterstuetzt");
    }
    


         
});

app.put('/Benutzer/{BenutzerId}', function(req,res){
         
});

app.delete('/Benutzer/{BenutzerId}', function(req,res){

});




//Server lauscht auf Anfragen auf Port 3000
app.listen(3000);