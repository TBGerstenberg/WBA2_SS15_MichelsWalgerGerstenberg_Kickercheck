	//Redis.io NoSQL Datenbankmodul für Node.js einbinden 
	var redis = require('redis');

	//Client für die Abfrage von Daten aus der Redis DB erzeugen 
	var client = redis.createClient();
	
	//Express Modul einbinden 
	var express = require('express');
	
    //Modul zum Debuggen
	var util= require('util');
	
	//Fs Modul zum einlesen der xsd 
	var fileSystem=require('fs');
	
	// Bodyparser für XML Parsing
	var bodyparser = require('body-parser');
	var parseXML = bodyparser.text({
	    type: 'application/atom+xml'
	});
	
	// libxml für XML Validierung
	var libxml = require('libxmljs');
		
	// xml2js für XML-JS Parsing
	var xml2js = require('xml2js');
	
	//Parser von xml2js 
	var xml2jsParser = new xml2js.Parser();

	//Expressinstanz anlegen und in "app" ablegen 
	var app = express();
	
	//Zusatzmodul zum erstellen von xml-Repräsentationen 
	var builder = require('xmlbuilder');


	//Setup für Datenbank , diese Werte werden inkrementiert um eindeutige IDs in den URI Templates zu generieren 
    //SETNX heißt set if not exists, so wird gewährleistet dass auch nach beendigung die Keys erhalten bleiben 
    //und nur nach DB Wipe neu gesetzt werden 
	client.SETNX("BenutzerId", "0");
	client.SETNX("MatchId", "0");
	client.SETNX("LokalitaetId", "0");
	client.SETNX("ForderungsId", "0");
	client.SETNX("KickertischId", "0");
	client.SETNX("TurnierId", "0");
	
	//XML-Schema zur Validierung einlesen , Synchrone Variante gewählt weil dies eine Voraussetzung für den Erfolg anderer Methoden ist 
	var xsd=fileSystem.readFileSync('./Assets/XMLValidation/kickercheck_xml_schema.xsd','utf8');
	
	//XML-Schema parsen 
	var xsdDoc = libxml.parseXml(xsd);
	
    //Namespaces und Rels, werden später in die Linkelemente der Ressourcenrepräsentationen eingebaut 
    var atomNS = "http://www.w3.org/2005/Atom";
	var kickerNS = "http://www.kickercheck.de/namespace";
	var MatchRel = "http://www.kickercheck.de/rels/Match";
	var LokalitaetRel = "http://www.kickercheck.de/rels/Lokalitaet";
	var SpielstandRel = "http://www.kickercheck.de/rels/Spielstand";
	var BenutzerRel = "http://www.kickercheck.de/rels/Benutzer";
    var KickertischRel="http://www.kickercheck.de/rels/Kickertisch";
	 

	var kickertisch_object = {  
    Kickertisch: {
    Tischhersteller: "NULL",
	Modell: "NULL",
	Zustand: "NULL",
	Bild: "NULL"
  }
};

/*
	 var benutzer_object = {  
  Benutzer: {
    Name: "NULL",
	Alter: "NULL",
	Position: "NULL",
	Bild: "NULL"
  
  }
};

gültige Benutzeranfrage 

<?xml version="1.0" encoding="UTF-8" ?><Benutzer xmlns="http://www.kickercheck.de/namespace"><Name>porker</Name><Alter>23</Alter><Position>Sturm</Position><Bild>eW9vbw==</Bild></Benutzer>
*/

 var turnier_object = {  
  Turnier: {
    Teilnehmerzahl: "NULL",
	Typ: "NULL",
	Austragungszeitraum: "NULL",
	
	"atom:link" : {'#text':'NULL', '@title':"NULL",'@rel':MatchRel,'@href':"NULL"}
  
  }
};

 var lokalitaet_object = {  
    Name: "NULL",
	Beschreibung: "NULL",
	Kickertisch: {
	"link" : {'#text':'NULL', '@title':"NULL",'@rel':LokalitaetRel,'@href':"NULL"}
  }
};

 //console.log(util.inspect(lokalitaet_object, {showHidden: false, depth: null}));

 var match_object = {  
  Match: [
   {Datum: "NULL" },
	{Uhrzeit: "NULL" },
    {"atom:link" : {'#text':'NULL', '@title':"Teilnehmer",'@rel':BenutzerRel,'@href':"NULL"} },
	{"atom:link" : {'#text':'NULL', '@title':"Austragungsort",'@rel':LokalitaetRel,'@href':"NULL" } }
  ]};
  
/*  gültige Matchanfrage POST

<?xml version="1.0" encoding="UTF-8" ?>
<Match xmlns="http://www.kickercheck.de/namespace">
    <Datum>2012-04-12</Datum>
    <Uhrzeit>12:25:00</Uhrzeit>
    <Austragungsort><link title="Austragungsort" rel="http://www.kickercheck.de/rels/Lokalitaet" href="" /></Austragungsort>
 <link title="Teilnehmer 1" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/1" />
  <link title="Teilnehmer 2" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/2" />
      <link title="Teilnehmer 3" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/3" />
  <link title="Teilnehmer 4" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/4" />
   <link title="Spielstand" rel="http://www.kickercheck.de/rels/Spielstand" href="" />
</Match>

gültige Matchanfrage PUT

<?xml version="1.0" encoding="UTF-8" ?>
<Match xmlns="http://www.kickercheck.de/namespace">
    <Datum>2012-04-12</Datum>
    <Uhrzeit>12:25:00</Uhrzeit>
    <Austragungsort><link title="Austragungsort" rel="http://www.kickercheck.de/rels/Lokalitaet" href="" /></Austragungsort>
<link title="Teilnehmer 1" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/1" />
<link title="Teilnehmer 2" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/2" />
<link title="Teilnehmer 3" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/3" />
<link title="Teilnehmer 4" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/4" />
</Match>

*/

 var spielstand_object = {  
  'Spielstand':'0-0'
};


var kickertisch_template = builder.create('kickercheck',{version: '1.0', encoding: 'UTF-8'}).att("xmlns:atom",atomNS).att("xmlns:kickercheck",kickerNS)
.ele(kickertisch_object)
.end({ pretty: true});

var turnier_template = builder.create('kickercheck',{version: '1.0', encoding: 'UTF-8'}).att("xmlns:atom",atomNS).att("xmlns:kickercheck",kickerNS)
.ele(turnier_object)
.end({ pretty: true});

var spielstand_template = builder.create('kickercheck',{version: '1.0', encoding: 'UTF-8'}).att("xmlns:atom",atomNS).att("xmlns:kickercheck",kickerNS)
.ele(spielstand_object)
.end({ pretty: true});

/*
var benutzer_template = builder.create('kickercheck',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:atom',atomNS).att('xmlns:kickercheck',kickerNS)
.ele(benutzer_object)
.end({ pretty: false});
*/

var lokalitaet_template = builder.create('kickercheck',{version: '1.0', encoding: 'UTF-8'}).att("xmlns:atom",atomNS).att("xmlns:kickercheck",kickerNS)
.ele(lokalitaet_object)
.end({ pretty: true});

var match_template = builder.create('kickercheck',{version: '1.0', encoding: 'UTF-8'}).att("xmlns:atom",atomNS).att("xmlns:kickercheck",kickerNS)
.ele(match_object)
.end({ pretty: true});


	//  BENUTZER // 
	//  BENUTZER // 



	// / KICKERTISCH // 
	// / KICKERTISCH //

	// MATCH -> SPIELSTAND // 
	// MATCH -> SPIELSTAND //

	//Subressource von Match: Spielstand Methoden
	app.get('/Match/:MatchId/:SpielstandId', function(req, res) {

	    var matchId = req.params.MatchId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match ' + matchId, function(err, IdExists) {

	        client.hget('Match ' + matchId, "Spielstand", function(err, spielstandValid) {

	            //client.exists hat false geliefert 
	            if (IdExists && spielstandValid) {

	                var acceptedTypes = req.get('Accept');
	                switch (acceptedTypes) {

	                    case "application/atom+xml":
	                        res.status(200).send("Spielstand: " + spielstandValid);
	                        
                            break;


	                    default:
	                        //We cannot send a representation that is accepted by the client 
	                        res.status(406);
                            res.set("Accepts", "application/atom+xml");
                            res.end();
	                   break;

	                }

	                res.end();


	            } else {

	                res.status(404).send("Die Ressource wurde nicht gefunden.");
	                res.end();

	            }
	        });

	    });

	});


    app.post('/Match/:MatchId/Spielstand', parseXML, function(req, res) {
        
        //Anlegen eines Tisches geht nur mit Content Type application/atom+xml
	    var contentType = req.get('Content-Type');
        
        //Check ob der Content Type der Anfrage xml ist 
        if (contentType != "application/atom+xml") {
	       res.set("Accepts", "application/atom+xml");
	       res.status(406).send("Content Type is not supported");
	       res.end();
	    }
        
        else {
            
            //Req.body als XML Parsen 
            var parsedXML = libxml.parseXml(req.body);
           
            //Das geparste XML gegen das XSD validieren 
            var validateAgXSD = parsedXML.validate(xsdDoc);
            
            //Anfrage ist bezüglich der XSD Valide 
            if(validateAgXSD){
                    
                // Parser Modul um req.body von XML in JSON zu wandeln
                xml2jsParser.parseString(req.body,function(err, xml){
                    
                    //Inkrementiere Spielstandids in der DB ( In der DB haben die Spielstände ID's >1, es gibt aber trozdem nur einen Spielstand für ein Match 
                    client.incr('SpielstandId', function(err, id) {
                        
                        //Pflege Daten über einen Spiestand in die DB ein 
                        client.hmset('Spielstand ' + id, {
                            'Spielstand': xml.Spielstand.Spielstand
                        });
                        
                        //Extrahiere MatchId aus Anfrage 
                        var MatchId = req.params.MatchId;

                        //Schreibe Link zu dem angelegten Spielstand in die Match Ressource
                        client.hmset('Match ' + MatchId, {
                            'Spielstand': "http://kickercheck.de/Match/" + MatchId + "/Spielstand/"
                        });
                        
                        //Baue Repräsentation des Kickertisches und schreibe diese in res.body 
                        buildRep("Spielstand",id,function(spielstandXml){
                                        
                            //Teile dem Client die URI der neu angelegten Ressource mit 
                            res.set("Match", "/Spielstand/");
                            
                            //Setze content type der Antwort 
							res.set("Content-Type","application/atom+xml");
                            
                            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
                            res.status(201).write(kickertischXml);
                            
                            //Antwort beenden 
                            res.end();
                        });
                    });
                });
            }
            
            //Anfrage ist nicht valide 
            else{
                
                console.log(parsedXML.validationErrors);
                
                //Verweise den Client auf die korrekte Form einer Kickertischanfrage
                generateHelpForMalformedRequests("Spielstand",function(kickertischXml){
                    
                    //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                    res.status(400);
                
                    //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 
                    res.write(spielstandXml);
                		
                    //Antwort beenden 
                    res.end();     
                });
            }
        }
    });
});

	app.put('/Match/:MatchId/Spielstand', parseXML, function(req, res) {

	    var contentType = req.get('Content-Type');

	    //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	    if (contentType != "application/atom+xml") {

	        //Teile dem Client einen unterstuetzten Type mit 
	        res.set("Accepts", "application/atom+xml");

	        //Zeige über den Statuscode und eine Nachricht 
	        res.status(406).send("Content Type is not supported");

	        //Antwort beenden
	        res.end();
	    } 
        else {
		// Parser Modul um req.body von XML in JSON zu wandeln
	        xml2jsParser.parseString(req.body, function(err, xml) {

                var matchId = req.params.MatchId;

	            //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	            client.exists('Match ' + matchId, function(err, IdExists) {

	                client.hget('Match ' + matchId, "Spielstand", function(err, spielstandValid) {

	                    if (!IdExists) {
	                        res.status(404).send("Die Ressource wurde nicht gefunden.");
	                        res.end();
	                    }


	                    //client.exists hat false geliefert 
	                    if (IdExists && spielstandValid) {
	                            client.hmset('Spielstand ' + id, {
                                    'Spielstand': xml.Spielstand.Spielstand   
	                            });
                        }
                            
                            //Baue Repräsentation des Kickertisches und schreibe diese in res.body 
                            buildRep("Kickertisch",id,function(kickertischXml){
                                    
                            //Setze content type der Antwort 
							res.set("Content-Type","application/atom+xml");
                            
                            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
                            res.status(201).write(kickertischXml);
                            
                            //Antwort beenden 
                            res.end();

	                    });
                        else{
                            
                            //Verweise den Client auf die korrekte Form einer Kickertischanfrage
                            generateHelpForMalformedRequests("Spielstand",function(spielstandXml){
                    
                            //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                            res.status(400);
                
                            //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 
                            res.write(LokalitaetId);
                		
                            //Antwort beenden 
                            res.end();     
                        }
	                });
	            });
	        });
	    }
	});

	// / MATCH -> SPIELSTAND // 
	// / MATCH -> SPIELSTAND //

	// TURNIER // 
	// TURNIER //

	//Tunier Methoden
	app.get('/Turnier/:TurnierId', function(req, res) {

	    var turnierId = req.params.TurnierId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Turnier ' + turnierId, function(err, IdExists) {

	        //client.exists hat false geliefert 
	        if (!IdExists) {

	            res.status(404).send("Die Ressource wurde nicht gefunden.");
	            res.end();

	        } else {

	            var acceptedTypes = req.get('Accept');
	            switch (acceptedTypes) {

	                case "text/html":
	                    //Html repr. bauen
	                    res.status(200).send("Turnier: " + turnierId);

	                    break;


	                default:
	                    //We cannot send a representation that is accepted by the client 
	                    res.status(406).send("Content Type wird nicht unterstuetzt");
	                    break;

	            }

	            res.end();
	        }
	    });
	});

	app.post('/Turnier', parseXML, function(req, res) {

	    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	    var contentType = req.get('Content-Type');

	    //Check ob der Content Type der Anfrage xml ist 
	    if (contentType != "application/atom+xml") {
	        res.set("Accepts", "application/atom+xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    } 
        else {
		    // Parser Modul um req.body von XML in JSON zu wandeln
	        xml2jsParser.parseString(req.body, function(err, xml) {
	            client.incr('TurnierId', function(err, id) {
					// Durch alle "Match" und "Spieler" XML Tags iterieren
	                for (var i = 0; i < xml.kickercheck.Turnier.length; i++) {
                        client.hmset('Turnier ' + id, {
	                        'Matches': xml.kickercheck.Turnier[i].Match,
	                        'Typ': xml["kickercheck"]["Turnier"][0]["Typ"],
	                        'Datum': xml["kickercheck"]["Turnier"][0]["Datum"],
                            'Spieleranzahl': xml["kickercheck"]["Tunier"][0]["Spieleranzahl"],
	                    });
	                }
                    //Setze ResponseType auf application/atom+xml
                    res.type("application/atom+xml"); 
                    //sets the response’s HTTP header Location field to /Turnier/
	                res.set("Location", "/Turnier/" + id);
                    //Statuscode 201 für Erfolg, Rückgabe Body ist das Angelegte Tunier im ContentType application/atom+xml
                    res.status(201).send(req.body);
	                //Antwort beenden 
	                res.end();
	            });
	        });
	    }
	});

	app.put('/Turnier/:TurnierId', parseXML, function(req, res) {

	    var contentType = req.get('Content-Type');

	    //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	    if (contentType != "application/atom+xml") {

	        //Teile dem Client einen unterstuetzten Type mit 
	        res.set("Accepts", "application/atom+xml");

	        //Zeige über den Statuscode und eine Nachricht 
	        res.status(406).send("Content Type is not supported");

	        //Antwort beenden
	        res.end();
	    } else {
			// Parser Modul um req.body von XML in JSON zu wandeln
	        xml2jsParser.parseString(req.body, function(err, xml) {

	            var turnierId = req.params.TurnierId;

	            //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	            client.exists('Turnier ' + turnierId, function(err, IdExists) {

	                //client.exists hat false geliefert 
	                if (!IdExists) {
		                
	                    res.status(404).send("Die Ressource wurde nicht gefunden.");
	                    res.end();
	                } 
	                else {

	                    // Durch alle "Match" und "Spieler" XML Tags iterieren

	                    for (var i = 0; i < xml.kickercheck.Turnier.length; i++) {

	                        client.hmset('Turnier ' + turnierId, {
	                            'Matches': xml.kickercheck.Turnier[i].Match,
	                            'Spieler': xml.kickercheck.Turnier[i].Spieler,
	                            'Typ': xml["kickercheck"]["Turnier"][0]["Typ"],
	                            'Datum': xml["kickercheck"]["Turnier"][0]["Datum"],
	                        });
	                    }
	                    //Alles ok , sende 200 
	                    res.status(200).send("Das hat funktioniert! Turnier geändert");

	                    //Antwort beenden
	                    res.end();
	                }
	            });
	        });
	    }
	});

	app.delete('/Turnier/:TurnierId', function(req, res) {

	    var contentType = req.get('Content-Type');

	    //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	    if (contentType != "application/atom+xml") {

	        //Teile dem Client einen unterstuetzten Type mit 
	        res.set("Accepts", "application/atom+xml");

	        //Zeige über den Statuscode und eine Nachricht 
	        res.status(406).send("Content Type is not supported");

	        //Antwort beenden
	        res.end();
	    } else {

	        var turnierId = req.params.TurnierId;

	        client.exists('Turnier ' + turnierId, function(err, IdExists) {

	            //client.exists hat false geliefert 
	            if (!IdExists) {

	                res.status(404).send("Die Ressource wurde nicht gefunden.");
	                res.end();

	            } 
                else {

	                client.del('Turnier ' + turnierId);

	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Turnier gelöscht.");
	                res.end();

	            }
	        });
	    }
	});

    // Helper Functions 
    

    /* Erstellt eine XML Repräsentation einer Ressource 
    Params: 
    Ressource = String der die Ressource identifiziert, hier muss der String rein unter dem die Ressource auch in der Datenbank liegt
    id = Id der Ressource */
    function buildRep(Ressource,id,callback){
        
        switch(Ressource){
                
            case "Match":
                
                client.hgetall('Match '+id,function(err,obj){
                    
                    var match_object={
                            Datum:obj.Datum,
                            Uhrzeit:obj.Uhrzeit,
                            Austragungsort:generateLinkELementFromHref("Austragungsort",LokalitaetRel,obj.Austragungsort),
                            Teilnehmer1:generateLinkELementFromHref("Teilnehmer1",BenutzerRel,obj.Teilnehmer1), 
                            Teilnehmer2:generateLinkELementFromHref("Teilnehmer2",BenutzerRel,obj.Teilnehmer2), 
                            Teilnehmer3:generateLinkELementFromHref("Teilnehmer3",BenutzerRel,obj.Teilnehmer3), 
                            Teilnehmer4:generateLinkELementFromHref("Teilnehmer4",BenutzerRel,obj.Teilnehmer4), 
                            Spielstand:generateLinkELementFromHref("Spielstand",SpielstandRel,obj.Spielstand)
                    }
                    
                  //Parse zu XML und return
                  var MatchXMLRep = builder.create('Match',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck', kickerNS).ele(match_object).end({ pretty: true }); 
                  
                  //Rufe Callback mit dem Ergebnis auf  
                  callback(err,MatchXMLRep);
                });  
                
            break;   
                
           //Wir wollen eine Benutzerrepräsentation des Benutzers unter der ID bauen 
           case "Benutzer":
                
               client.hgetall('Benutzer '+id,function(err,obj){
                     
                    //Objekt das später geparst wird 
                     var benutzer_object = {  
                            Name: obj.Name,
                            Alter: obj.Alter,
                            Position: obj.Position,
                            Bild: obj.Bild
                    }
 
                    //Parse zu XML und return
                    var BenutzerXMLRep = builder.create('Benutzer',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck',kickerNS).ele(benutzer_object).end({ pretty: true }); 
                     
                    //Rufe Callback mit dem Ergebnis auf 
                    callback(err,BenutzerXMLRep);
                });      
            break;
                
            case "BenutzerListe":
            
              
                 
            
            
            var benutzerliste_object=[];
            // Hole alle Benutzer x aus DB
            
            function benutzerKeys(callback) {
            client.keys('Benutzer *',function(err,rep) {
	            
	                 
	           // Wenn keine Benutzer
	           if (rep.length==0) {
		           console.log('keine Benutzer in Liste');
		           return;
	           }
	           
	           benutzerliste_object.push(JSON.stringify(rep));
	       
		callback();
		             
                        }); 
                        }
                        
                        benutzerKeys(function() {
	                        console.log(benutzerliste_object);
                        })
	                                    
                        //Parse zu XML und return
                    
//                         var benutzerListeXMLRep = builder.create('Benutzer',{version: '1.0', encoding: 'UTF-8'}).att('xmlns', kickerNS).ele(benutzerliste_object).end({ pretty: true }); 
                        var benutzerListeXMLRep='';
                        callback(benutzerListeXMLRep);
    
		       
		       
	           
	         //Schliefen und Async Aufrufe vertragen sich nicht ohne weiteres 
                        //Pseudocode : 
                            /*
                                Für alle Nutzer in der DB 
                                     Prüfe ob isActive = 1 
                                        Wenn ja
                                            generiere Linkhref mit der Id des NUtzers  
                                            generiere XML-Linkelemente mit diesem Href 
                                            Pushe Linkelement in die Benutzerliste 
                                
                                Parse Liste als XML und Antworte 
                            
                            
                            
                            */
            break;
                
            
                
            //Wir wollen eine Lokalitaetsrepräsentation der Lokalitaet unter der ubergebenen URI zusammenbauen 
            case "Lokalitaet":
                
                client.hgetall('Lokalitaet '+ id,function(err,obj){
                        
                    //JS Objekt mit Daten aus der Datenbank füllen , das Root Element <lokalitaet> ist nicht in                                             //der DB, daher hier nicht benötigt um die Werte auszulesen  
                    var lokalitaet_object ={  
                        Name: obj.Name,
                        Beschreibung: obj.Beschreibung,
                        Adresse:obj.Adresse,
                        //URI unter der dieser Lokalitaet Tische hinzugefügt werden können
                        Kickertisch:generateLinkELementFromHref("Tische Hinzufuegen",KickertischRel,"http://localhost:3000/Lokalitaet/"+id+"/Kickertisch")
                    }
                    
                    //Ermittle den Key unter dem die Linkliste dieser Lokalitaet in der DB abgelegt ist 
                    var listenKey="Loklitaet" + id + "Tische";
                        
                        //Länge der Liste der gespeicherten Links 
                        client.LLEN(listenKey,function(err,listenLaenge){
                            
                            //Baue alle vorhandenen Links in das JS Objekt 
                            for(var i=0; i<listenLaenge; i++){
                            
                                //In der DB werden nur die HREFS gespeichert 
                                client.LINDEX(listenKey,i,function(err,linkHref){

                                    //Linkelement zusammenbauen 
                                    var linkElement=generateLinkELementFromHref("kickertisch",kickertischRel,linkHref);

                                    //Linkelement in das LokalitaetObjekt Pushen 
                                    lokalitaet_object.push("link",linkElement); 
                                });
                           }
                        }); 
	                                    
                        //Parse zu XML und return
                    
                        var LokalitaetXMLRep = builder.create('Lokalitaet',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck', kickerNS).ele(lokalitaet_object).end({ pretty: true }); 
                        callback(LokalitaetXMLRep);
                });
            break;
                
            case "Kickertisch":
                
                //Kickertisch Daten aus der DB holen 
                client.hgetall('Kickertisch '+ id,function(err,obj){
                    
                    //Später in XML zu parsendes Objekt zusammestellen 
                    var kickertisch_object={
                        Tischhersteller:obj.Tischhersteller,
                        Modell:obj.Modell,
                        Zustand:obj.Zustand,
                        Bild:obj.Bild
                    }
                    
                    //XML zusammensetzen 
                    var kickertischXml=builder.create('Kickertisch',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck', kickerNS).ele(kickertisch_object).end({ pretty: true }); 
                       
                    //Callback mit Ergebnis aufrufen 
                    callback(kickertischXml);
                });    
            break;
        } //EndSwitch
    }
      

/*Generates a Link Object that containt the attributes title , rel and href */                               
function generateLinkELementFromHref(title,rel,href){
    
    var linkElement={
        link:{
        '#text':' ',
        '@title':title,
        '@rel':rel,
        '@href':href
        }
    }                
    return linkElement;
}   

/*Generiert XML-Payloads die übermittelt werden falls ein Request malformed war 
, diese Dokumente enthalten Links auf die Rel-Seiten des Dienstes 
um einem Client die korrekte Formatierung einer Anfrage 
aufzuzeigen
Parameter : Ressource Typ : String  */
function generateHelpForMalformedRequests(Ressource,callback){
    
    if (typeof Ressource != 'string' && !(Ressource instanceof String)){
        console.trace();
        throw "Ressourcenname in generateHelpForMalformedRequests ist kein String";
        return;
    }
    
    
     //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt
     var linkElement =generateLinkELementFromHref("korrekte Form einer " + Ressource +  " Anfrage" ,eval(Ressource+"Rel"),eval(Ressource+"Rel"));
    console.log(eval(Ressource+"Rel"));
               
    //Parse als XML 
    var RessourceXML = builder.create(Ressource,{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck',kickerNS).ele(linkElement).end({ pretty: true }); 

    console.log(RessourceXML);
    
    //Rufe Callback Function mit dem Ergebnis auf 
    callback(RessourceXML);    
}
               
	//Server lauscht auf Anfragen auf Port 3000
	app.listen(3000);                     