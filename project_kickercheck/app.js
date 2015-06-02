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


//Setup für Datenbank
client.SETNX("BenutzerId","0");
client.SETNX("KickertischId","0");
client.SETNX("MatchId","0");
client.SETNX("StandortId","0");
client.SETNX("AccountId","0");
client.SETNX("TurnierId","0");




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

app.get('/Kickertisch/:TischId', function(req,res){
    
   //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var tisch=client.exists(req.params.TischId);
    
    //Angegebener Key existiert nicht
    if(tisch==0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    else{
    var acceptedTypes= req.get('Accepts');
    switch(acceptedTypes){
        
        case:"text/html"
            //Html repr. bauen 
            
        break;
            
        default:
            //We cannot send a representation that is accepted by the client 
            req.status(406).send("Content Type wird nicht unterstuetzt");
    }
    }
});

app.post('/Kickertisch/' ,function(req,res){
    
    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType=req.get('Content-Type');
    
    //Check ob der Content Type der Anfrage xml ist 
    if(contentType != "application/xml"){
        res.setHeader("Accepts","application/xml");
        res.status(406).send("Content Type is not supported");
    }

    //Id für den neuen Kickertisch 
    var currentId=client.INCR(KickertischId);

    //Kickertisch Information mit HMSET
    client.hmset(currentId,"Hersteller", req.body.Hersteller, "Standort" , req.body.StandortId ,"Zustand", req.body.Zustand,"Bild", req.body.Bild);
    
    //Setzen des Statuscodes 201 - created 
    res.status(201).send("Anfrage zum Anlegen eines Tisches erfolgreich");
    
    //Rueckerhalt eines Locationheaders der neu angelegten Ressource 
    res.setHeader("Location","/Kickertisch/"+ currentId);
    
    //Antwort beenden 
    res.end();

});


/*Mit put kann das Bild eines Kickertischs und/oder seine Zustandsbeschreibung geändert werden*/
app.put('/Kickertisch/:TischId' , function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var tisch=client.exists(req.params.TischId);
    
    //Angegebener Key existiert nicht
    if(tisch==0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    //Angegebener Key existiert 
    else{
    
        //Abfrage des contenttypes der Request
        var contentType=req.get('Content-Type');

        //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
        if(contentType != "application/xml"){
            res.setHeader("Accepts","application/xml");
            res.status(406).send("Content Type is not supported");
        }
        
        else{
            //Suche Tisch mit id :Tischid aus der Datenbank 
            var tischId=client.get(req.params.TischId);
            //Ueberschreibe Werte in der Datenbank 
            client.hmset(tischId,"Zustand", req.body.Zustand,"Bild", req.body.Bild);
        }
    }
    
    res.end();
    
});

app.delete('/Kickertisch/:TischId' , function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var tisch=client.exists(req.params.TischId);
    
    //Angegebener Key existiert nicht
    if(tisch==0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    else{
        var tischID=client.get(req.params.TischId);
        client.del(req.params.TischId);
    }

    
});

function kickerTischHTML(id,hersteller,zustand){
 
}




//Server lauscht auf Anfragen auf Port 3000
app.listen(3000);