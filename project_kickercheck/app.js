//Redis.io NoSQL Datenbankmodul für Node.js einbinden 
var redis =  require('redis');
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




//Setup für Datenbank
client.SETNX("BenutzerId","0");
client.SETNX("KickertischId","0");
client.SETNX("MatchId","0");
client.SETNX("StandortId","0");
client.SETNX("AccountId","0");
client.SETNX("TurnierId","0");



//Account Methoden
app.get('/Account/:AccountId', function(req, res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var account = client.exists(req.params.AccountId);
    
    //Angegebener Key existiert nicht
    if(account == 0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    else{
        var acceptedTypes= req.get('Accepts');
        switch(acceptedTypes){
        
            case "text/html":
                //Html repr. bauen 
            
            break;
              
            default:
            //We cannot send a representation that is accepted by the client 
            req.status(406).send("Content Type wird nicht unterstuetzt");
    }
    res.end();
}
});

app.post('/Account', function(req, res){


});

app.put('/Account/:AccountId', function(req, res){


});

app.delete('/Account/:AccountId', function(req, res){


});











//Benutzer Methoden
app.get('/Benutzer/:BenutzerId', function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var benutzer = client.exists(req.params.BenutzerId);
    
    //Speichere BenuzerId aus der URI in eine Variable
    var BenutzerId=client.get(req.params.BenutzerId);
    
    //Angegebener Key existiert nicht
    if(benutzer==0 || client.hmget(BenutzerId,"isActive") == 0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    else{
        var acceptedTypes= req.get('Accepts');
        switch(acceptedTypes){
        
            case "text/html":
                //Html repr. bauen 
            
            break;
              
            default:
            //We cannot send a representation that is accepted by the client 
            req.status(406).send("Content Type wird nicht unterstuetzt");
    }
    }
    //Antwort beenden
    res.end();
});

app.post('/Benutzer', function(req,res){

    //Abruf eines Benutzer, nur dann wenn client html verarbeiten kann 
    var contentType=req.get('Content-Type');
    
    //Check ob der Content Type der Anfrage xml ist 
    if(contentType != "application/xml"){
        res.setHeader("Accepts","application/xml");
        res.status(406).send("Content Type is not supported");
    }

    //Id für den neuen Benutzer
    var currentId=client.INCR(BenutzerId);

    //Benutzer Information mit HMSET
    client.hmset(currentId,"Name", req.body.Name, "Alter" , req.body.Alter ,"Position", req.body.Position,"Bild", req.body.Bild,"isActive", 1);
    
    //Setzen des Statuscodes 201 - created 
    res.status(201).send("Anfrage zum Anlegen eines Benutzers erfolgreich");
    
    //Rueckerhalt eines Locationheaders der neu angelegten Ressource 
    res.setHeader("Location","/Benutzer/"+ currentId);
    
    //Antwort beenden 
    res.end(); 
});

app.put('/Benutzer/:BenutzerId', function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var benutzer=client.exists(req.params.BenutzerId);
    //Speichere BenuzerId aus der URI in eine Variable
    var BenutzerId=client.get(req.params.BenutzerId);
    
    //Angegebener Key existiert nicht
    if(benutzer==0 || client.hmget(BenutzerId,"isActive") == 0){
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
            //Ueberschreibe Werte in der Datenbank 
            client.hmset(BenutzerId,"Name", req.body.Name, "Alter" , req.body.Alter ,"Position", req.body.Position,"Bild", req.body.Bild, "isActive", 1);
        }
    }
    
    res.end();
    
});

app.delete('/Benutzer/:BenutzerId', function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var benutzer=client.exists(req.params.BenutzerId);
    
    //Speichere BenuzerId aus der URI in eine Variable
    var BenutzerId=client.get(req.params.BenutzerId);
    
    //Angegebener Key existiert nicht
    if(benutzer==0 || client.hmget(BenutzerId,"isActive") == 0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    else{
        //Speichere Benutzer mit id :BenuzerId aus der Datenbank
        var benutzerId=client.get(req.params.benutzerId);
        client.hmset(benutzerId,"isActice",0);
    }

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

            case "text/html":
                //Html repr. bauen
                req.status(200);
            break;

            default:
                //We cannot send a representation that is accepted by the client 
                req.status(406).send("Content Type wird nicht unterstuetzt");
        }
    }
    //Antwort beenden
    res.end();
});

/*Das Verb Post auf der Ressource Kickertisch legt eine neue Kicktisch Ressource an und liefert bei Erolg 
einen 201 Statuscode mit einem Locationheader der neu erzeugten Ressource */
app.post('/Kickertisch/',xmlparser({trim: false, explicitArray: false}),function(req,res){
    
    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType=req.get('Content-Type');
    
    //Check ob der Content Type der Anfrage xml ist 
    if(contentType != "application/xml"){
        //res.writeHead("Accepts","application/xml");
        //res.status(406).write("Content Type is not supported");
    }
    
    
    
    else{
            
        client.incr('KickertischId', function(err, id) {
            
                //console.log(gimmeValue(id));
                //Kickertisch Information mit HMSET
                    client.hmset(id,
                     {'Tischhersteller':req.body.root.Tischhersteller,
                      'Modell':req.body.root.Modell,
                      'Standort':'23',
                      'Zustand':req.body.root.Zustand,
                      'Bild':req.body.root.Bild});
            
                      res.set('Location','/Kickertisch/'+id);
        });
        
    
      
        
        //Setzen des Statuscodes 201 - created 
       // res.status(201).write("Anfrage zum Anlegen eines Tisches erfolgreich");
    }
        
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
    
    //Antwort beenden
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

//Subressource von Kickertisch: Fordernungen Methoden
app.post('Kickertisch/:TischId', function(req,res){

});

app.delete('Kickertisch/:TischId/Forderung', function(req,res){

});


//Match Methoden
app.get('/Match/:MatchId', function(req,res){
});
app.post('/Match', function(req,res){
});
app.put('/Match/:MatchId', function(req,res){
});
app.delete('/Match/:MatchId', function(req,res){
});

//Standort Methoden

app.get('/Standort/:StandortId', function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var standort=client.exists(req.params.StandortId);
    
    //Speichere standortId aus der URI in eine Variable
    var standortId=client.get(req.params.StandortId);
    
    //Angegebener Key existiert nicht
    if(standort==0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    else{
        var acceptedTypes= req.get('Accepts');
        switch(acceptedTypes){
        
            case "text/html":
                //Html repr. bauen 
            
            break;
              
            default:
            //We cannot send a representation that is accepted by the client 
            req.status(406).send("Content Type wird nicht unterstuetzt");
    }
    }
    //Antwort beenden
    res.end();
    
});

app.post('/Standort', function(req,res){
    
    //Abruf eines Benutzer, nur dann wenn client html verarbeiten kann 
    var contentType=req.get('Content-Type');
    
    //Check ob der Content Type der Anfrage xml ist 
    if(contentType != "application/xml"){
        res.setHeader("Accepts","application/xml");
        res.status(406).send("Content Type is not supported");
    }

    //Id für den neuen Standort
    var currentId=client.INCR(StandortId);

    //Benutzer Information mit HMSET
    client.hmset(currentId,"Name", req.body.Name, "Adresse" , req.body.Adresse ,"Beschreibung", req.body.Beschreibung);
    
    //Setzen des Statuscodes 201 - created 
    res.status(201).send("Anfrage zum Anlegen eines Benutzers erfolgreich");
    
    //Rueckerhalt eines Locationheaders der neu angelegten Ressource 
    res.setHeader("Location","/Standort/"+ currentId);
    
    //Antwort beenden 
    res.end();
    
});

app.put('/Standort/:StandortId', function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var standort=client.exists(req.params.StandortId);
    //Speichere StandortId aus der URI in eine Variable
    var StandortId=client.get(req.params.StandortId);
    
    //Angegebener Key existiert nicht
    if(standort==0){
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
            //Ueberschreibe Werte in der Datenbank 
            client.hmset(StandortId,"Name", req.body.Name, "Adresse" , req.body.Adresse ,"Beschreibung", req.body.Beschreibung);
        }
    }
    
    res.end();

    
});

app.delete('/Standort/:StandortId', function(req,res){
    
    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    var standort=client.exists(req.params.StandortId);
    
    //Angegebener Key existiert nicht
    if(standort==0){
        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
    }
    
    else{
        var standortID=client.get(req.params.StandortId);
        client.del(req.params.StandortId);
    }  
});

//Tunier Methoden
app.get('/Tunier/:TunierId', function(req,res){
});
app.post('/Tunier', function(req,res){
});
app.put('/Tunier/:TunierId', function(req,res){
});
app.delete('/Tunier/:TunierId', function(req,res){
});

//Subressource von Match: Spielstand Methoden
app.get('/Match/:MatchId/Spielstand',function(req,res){

});
app.put('Match/:MatchId/Spielstand', function(req,res){

});

//Server lauscht auf Anfragen auf Port 3000
app.listen(3000);