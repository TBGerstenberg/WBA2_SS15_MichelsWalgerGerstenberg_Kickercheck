//Redis.io NoSQL Datenbankmodul für Node.js einbinden 
var redis=require('redis');
var assert = require('assert');

//Client für die Abfrage von Daten aus der Redis DB erzeugen 
var client=redis.createClient();
// Filesystem Modul include
var fs = require('fs');
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


var libxml = require('libxmljs');

var xsd='Assets/XMLValidation/test.xsd';
var xmlSample='Assets/XMLValidation/sample.xml';
var xmlDoc="";
var xsdDoc="";



function readXML(callback) {      
  fs.readFile(xmlSample,'utf8', function (err, data) {
    // The data argument of the fs.readFile callback is the data buffer
    xmlDoc += libxml.parseXml(data.toString()); 
      callback();
  });
}

function showXML() {
	 xmlDoc;
}

var ergebnis=readXML(showXML)
console.log(ergebnis);

/*
//..... do some changes to xmlDoc
fs.writeFile('test.xml', xmlDoc.toString(), function(err) {
  if (err) throw err;
  console.log('Wrote XML string to test.xml'); 
});
*/

app.get('/Benutzer/{BenutzerId}', function(req,res){
    
});

app.post('/Benutzer', function(req,res){
    //Wenn acceptedTypes != Null war der Content Type der Anfrage application/xml
    var acceptedTypes=req.accepts('application/xml');
    if(acceptedTypes){
        //Userdatensatz in die Datenbank einfügen
        if(isValidated){
        }
        else{
            req.status(400).send("Die Anfrage ist fehlerhaft Aufgebaut");
        }     
    }
    else{
        req.status(406).send("Content Type wird nicht unterstuetzt");
    }         
});

app.put('/Benutzer/{BenutzerId}', function(req,res){
    var acceptedTypes=req.accepts('application/xml');
    if(acceptedTypes){
        //Userdatensatz in die Datenbank einfügen
        if(isValidated){
            
        }
        else{
            req.status(400).send("Die Anfrage ist fehlerhaft Aufgebaut");
        }
    }
    else{
        req.status(406).send("Content Type wird nicht unterstuetzt");
    }         
});

app.delete('/Benutzer/{BenutzerId}', function(req,res){

});

//Kickertisch Methoden 

app.get('/Kickertisch/{TischId}', function(req,res){


});

app.post('/Kickertisch/' ,function(req,res){


});

app.put('/Kickertisch/{TischId}' , function(req,res){


});

app.delete('/Kickertisch/{TischId}' , function(req,res){

    
});




//Server lauscht auf Anfragen auf Port 3000
app.listen(3000);