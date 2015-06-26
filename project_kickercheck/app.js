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
	
    //Namespaces und Rels, werden später in die Linkelemente der Ressourcenrepräsentationen eingebuat 
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

	app.get('/Benutzer/:BenutzerId', function(req, res) {

        //BenutzerId aus der URI extrahieren
	    var benutzerId = req.params.BenutzerId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Benutzer ' + benutzerId, function(err, IdExists) {
			// hget return 0 wenn key auf false sonst 1
	        client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {
                //Der Benutzer existiert im System und ist nicht für den Zugriff von außen gesperrt
	            if (IdExists == 1 && benutzerValid == 1) {
                    //Headerfeld Accept abfragen
	                var acceptedTypes = req.get('Accept');
                    //Es wird zunaechst nur text/html 
	                switch (acceptedTypes) {
                            
	                    case "application/atom+xml":
                               
                            //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                            buildRep("Benutzer",benutzerId,function(err,benutzerXMLRep){

                                console.log(benutzerXMLRep);

                                //Setze Contenttype der Antwort auf application/atom+xml
                                res.set("Content-Type", 'application/atom+xml');

                                //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück
                                res.status(200);

                                res.write(''+benutzerXMLRep);

                                //Anfrage beenden 
                                res.end();

                            }); 
                            
                        break;
                            
	                    default:
	                        //Der gesendete Accept header enthaelt kein unterstuetztes Format 
	                        res.status(406).send("Content Type wird nicht unterstuetzt");
	                        //Antwort beenden        
							res.end();
	                    break;
	                }
               }
               
                else if(IdExists == 1 && benutzerValid == 0) {
                    //Der Benutzer mit der angefragten ID existiert nicht oder wurde für den Zugriff von außen gesperrt
	                res.status(404).send("Die Ressource wurde für den Zugriff von außen gesperrt.");
	                res.end();
	            }
	            else {
		             //Der Benutzer mit der angefragten ID existiert nicht oder wurde für den Zugriff von außen gesperrt
	                res.status(404).send("Die Ressource wurde nicht gefunden.");
	                res.end();

	            }
	        });
	    });
	});


	app.post('/Benutzer', parseXML, function(req, res) {

	    //Content Type der Anfrage abfragen 
	    var contentType = req.get('Content-Type');

	    //Check ob der Content Type der Anfrage xml ist 
	    if (contentType != "application/atom+xml") {
	        res.set("Accepts", "application/atom+xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    } 
        
        else{
            
			//Req.body als XML Parsen 
            var parsedXML = libxml.parseXml(req.body);
        
	       //Das geparste XML gegen das XSD validieren 
            var validateAgXSD = parsedXML.validate(xsdDoc);
        	
            // Verschicktes XML nach XSD Schema gültig
            if(validateAgXSD) {

                // Parser Modul um req.body von XML in JSON zu wandeln
                xml2jsParser.parseString(req.body, function(err, xml) {
	                	                
				    // BenutzerId in redis erhöhen, atomare Aktion 
                    client.incr('BenutzerId', function(err, id) {
	                    
                        // Setze Hashset auf Key "Benutzer BenutzerId" 
                        client.hmset('Benutzer ' + id,{
                            'Name': xml.Benutzer.Name,
                            'Alter': xml.Benutzer.Alter,
                            'Position': xml.Benutzer.Position,
                            'Bild': xml.Benutzer.Bild,
                            'isActive': 1
                        });
                    
                        //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                        buildRep("Benutzer",id,function(err,benutzerXMLRep){
                        
                            console.log(benutzerXMLRep);

                            //Setze Contenttype der Antwort auf application/atom+xml
                            res.set("Content-Type", 'application/atom+xml');

                            //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück
                            res.set("Location", "/Benutzer/" + id).status(201);

                            res.write(''+benutzerXMLRep);

                            //Anfrage beenden 
                            res.end();
                             
                        });       
	               });
	           });
	       }
	       
           //Das Übertragene XML-Schema war ungültig
           else{
	            //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                res.status(400);
                
                //Verweise auf eine Relpage mit der korrekten Form einer Benutzeranfrage 
                generateHelpForMalformedRequests("Benutzer",function(benutzerXML){
                              
                    //Schreibe Linkelement in den Body der Anfrage 
                    res.write(''+benutzerXML);
                
                    //Anfrage beenden
                    res.end();
               
               });
            }
        }
    });

	app.put('/Benutzer/:BenutzerId', parseXML, function(req, res) {

	    var contentType = req.get('Content-Type');

	    //Wenn kein XML+atom geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	    if (contentType != "application/atom+xml") {

	        //Teile dem Client einen unterstuetzten Type mit 
	        res.set("Accepts", "application/atom+xml");

	        //Zeige über den Statuscode und eine Nachricht 
	        res.status(406).send("Content Type is not supported");

	        //Antwort beenden
	        res.end();
	    } 
	    
        else {
	        
	        //extrahiere BenutzerId aus Anfrage 
	        var benutzerId = req.params.BenutzerId;
	        
	        	//Checke ob ein Eintrag in der DB unter dieser ID existiert 
	            client.exists('Benutzer ' + benutzerId, function(err, IdExists) {
		            
		            //Checke ob bestehender EIntrag gelöscht bzw für den Zugriff von außen gesperrt wrude 
                    client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {

	                    //client.exists hat false geliefert 
	                    if (IdExists == 1 && benutzerValid == 0) {
	                        res.status(404).send("Die Ressource wurde nicht gefunden.");
	                        res.end();
                        }
                        
                        //Der Benutzer existiert und kann bearbeitet werden 
                        else if (IdExists == 1 && benutzerValid == 1) {
	                        									
							//Xml parsen
                            var parsedXML = libxml.parseXmlString(req.body);
                            
                            //Das geparste XML gegen das XSD validieren 
                            var validateAgXSD = parsedXML.validate(xsdDoc);
	
                            // Verschicktes XML nach XSD Schema gültig
                            if(validateAgXSD) {
	                            
                                  // Parser Modul um req.body von XML in JSON zu wandeln
                                  xml2jsParser.parseString(req.body, function(err, xml) {

                                    client.hmset('Benutzer ' + benutzerId, {

                                        'Name': xml.Benutzer.Name,
                                        'Alter': xml.Benutzer.Alter,
                                        'Position': xml.Benutzer.Position,
                                        'Bild': xml.Benutzer.Bild,
                                        'isActive': 1
                                    });  
                                  });
                                   
                                //Wenn Content-Type und Validierung gestimmt haben, schicke die geänderte Rep. zurück
                                buildRep("Benutzer",benutzerId,function(err,benutzerXMLRep){

                                    //Setze Contenttype der Antwort auf application/atom+xml
                                    res.set("Content-Type", 'application/atom+xml');

                                    //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück
                                    res.status(200);

                                    res.write(''+benutzerXMLRep);

                                    //Anfrage beenden 
                                    res.end();

                                });                  
	                        }    
                       
                           //Das gesendete XML war bezüglich des XML-Schemas ungültig
                           else {
                           	    //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                                res.status(400);
                
                               //Verweise im Body auf die korrekte Verwendung einer Benutzeranfrage 
                               generateHelpForMalformedRequests("Benutzer" , function(benutzerXML){
                                   
                                    //Schreibe Linkelement in den Body der Anfrage 
                                    res.write(''+benutzerXML);

                                    //Anfrage beenden
                                    res.end();
                               });
	                      }
                       }
	                });  
	            });            
        }
    });

	app.delete('/Benutzer/:BenutzerId', function(req, res) {

        var benutzerId = req.params.BenutzerId;

        client.exists('Benutzer ' + benutzerId, function(err, IdExists) {
            
            client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {
               
               if(IdExists == 1 && benutzerValid == 1) {
	               //Setze das isActive Attribut des Benutzers in der Datenbank auf 0 , so bleiben seine Daten für statistische Zwecke erhalten , nach 				   
	               //außen ist die Ressource aber nicht mehr erreichbar 
                    client.hmset('Benutzer ' + benutzerId, "isActive", 0);
                    
                    //Alles ok , sende 200 
                    res.status(204).send("Das hat funktioniert! Benutzer gelöscht");
                    
                    //Antwort beenden
                    res.end();
                }
                
                //Es gab nie einen Benutzer mit dieser Id
                else if(IdExists == 1 && benutzerValid == 0) {
	                res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }
                
                //Der Benutzer wurde für den Zugriff von außen gesperrt 
                else {
	                res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }
            });
	    });
	});
	
	// MATCH //

	//Match Methoden
	app.get('/Match/:MatchId', function(req, res) {

	    var matchId = req.params.MatchId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match ' + matchId, function(err, IdExists) {
            
                //Das Match existiert nicht im System 
	            if (!IdExists) {
                        res.status(404).send("Die Ressource wurde nicht gefunden.");
	                    res.end();
                }
            
                //Das Match existiert 
                else{

                    //Welchen Content Type kann der client verarbeiten? 
                    var acceptedTypes = req.get('Accept');
                    
                    switch (acceptedTypes) {

                        case "application/atom+xml":

                            //XML Repräsentation bauen     
                            buildRep("Match",matchId,function(err,MatchXML){

                                //Server antwortet mit einer Matchrerpräsentation 
                                res.set("Content-Type","application/atom+xml");
                                
                                //Antworte mit Content Type 200 - OK , schreibe Matchrepräsentation in den Body 
                                res.status(200).write(''+MatchXML);
                                
                                //Antwort beenden        
                                res.end();
                            });
                        break;

	                    default:
                            //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                            res.status(406).send("Content Type wird nicht unterstuetzt");
                            //Antwort beenden        
                            res.end();
	                    break;
                    }
	           }  
	    });
	});

	app.post('/Match', parseXML, function(req, res) {
        
	    //Anlegen eines Matches, Anfrage muss den Content Type application/atom+xml haben 
	    var contentType = req.get('Content-Type');

        //Content type ist nicht application/atom+xml , zeige im Accept Header gültige content types 
	    if (contentType != "application/atom+xml") {
	        res.set("Accepts", "application/atom+xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();    
	    } 
        
        //Content Type OK 
        else {
		      
            //Req.body als XML Parsen 
            var parsedXML = libxml.parseXml(req.body);
           
            //Das geparste XML gegen das XSD validieren 
            var validateAgXSD = parsedXML.validate(xsdDoc);
        	
            // Verschicktes XML nach XSD Schema gültig
            if(validateAgXSD) {

                // Parser Modul um req.body von XML in JSON zu wandeln
                xml2jsParser.parseString(req.body, function(err, xml) {
					
					 console.log(util.inspect(xml, {showHidden: false, depth: null}));


//				 console.log(util.inspect('POKPOK'+xml.Match.Austragungsort[0].$.href, {showHidden: false, depth: null}));
					 
                    //Erhöhe MatchIds in der DB , atomare Aktion 
                    client.incr('MatchId', function(err, id) {

                        //Pflege Daten aus Anfrage in die DB ein, von den Linkelementen wird lediglich das href Attribut gespeichert 
                        client.hmset('Match ' + id, {
                                'Datum' : xml.Match.Datum,
                                'Uhrzeit': xml.Match.Uhrzeit,
                                'Austragungsort': xml.Match.Austragungsort[0].$.href, 
                                'Teilnehmer1': xml.Match.Teilnehmer1[0].$.href,
                                'Teilnehmer2': xml.Match.Teilnehmer2[0].$.href,
                                'Teilnehmer3': xml.Match.Teilnehmer3[0].$.href,
                                'Teilnehmer4': xml.Match.Teilnehmer4[0].$.href,
                                'Spielstand' : 'http://localhost:3000/Match/'+id+'/Spielstand'
                        });

                        //Baue Repräsentation des angelegten Mathes 
                        buildRep("Match",id,function(err,MatchXML){

                            //Setze Contenttype der Antwort auf application/atom+xml
                            res.set("Content-Type", 'application/atom+xml');

                            //Schicke das URI-Template für das angelegte Match via Location-Header zurück
                            res.set("Location", "/Match/" + id).status(201);

                            //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                            res.write(' '+req.body);

                            //Anfrage beenden 
                            res.end();

                        });
                    });
               });
	       }
            
        //XML entspricht nicht dem XML-Schema 
	    else {
		  console.log(parsedXML.validationErrors);
          
          //Füge Link in den Body ein der die korrekte Form einer Matchanfrage zeigt 
          generateHelpForMalformedRequests("Match",function(MatchXml){
                
                    //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                    res.status(400).write(''+MatchXml);
                
                    //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Matchrepräsentation zeigt 				
                    res.end();
          });
	    }
	  }
	});

	app.put('/Match/:MatchId', parseXML, function(req, res) {

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
		        var matchId = req.params.MatchId;

	            //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	            client.exists('Match ' + matchId, function(err, IdExists) {

	                //Die angeforderte Ressource existiert nicht im System 
	                if (!IdExists) {
	                    res.status(404).send("Die Ressource wurde nicht gefunden.");
	                    res.end();
	                }
                    
	                else {
                        //Req.body als XML Parsen 
                        var parsedXML = libxml.parseXml(req.body);


                       //Das geparste XML gegen das XSD validieren 
                        var validateAgXSD = parsedXML.validate(xsdDoc);

                        // Erhaltenes XML nach XSD Schema gültig
                        if(validateAgXSD) {

                            // Parser Modul um req.body von XML in JSON zu wandeln
                            xml2jsParser.parseString(req.body, function(err, xml) {

                                client.hmset('Match ' + matchId, {

                                    'Datum' : xml.Match.Datum,
                                    'Uhrzeit': xml.Match.Uhrzeit,
                                    'Austragungsort': xml.Match.Austragungsort[0].link[0].$.href, 
                                    'Teilnehmer1': xml.Match.link[0].$.href,
                                    'Teilnehmer2': xml.Match.link[1].$.href,
                                    'Teilnehmer3': xml.Match.link[2].$.href,
                                    'Teilnehmer4': xml.Match.link[3].$.href,
                                    'Spielstand' : 'http://localhost:3000/Match/'+matchId+'/Spielstand'                          	                    });

                                    //Wenn Content-Type und Validierung gestimmt haben, schicke die geupdatete Datei zurück
                                    res.status(200).set('Content-Type', 'application/atom+xml');

                                    //Baue eine XML Repräsentation der angelegten Ressource und schreibe diese in die den Antwortbody
                                    buildRep("Match",matchId,function(err,MatchXml){

                                        //Liefere Repräsentation der geänderten Ressource zurück 
                                        res.write(''+MatchXml);

                                        //Antwort beenden
                                        res.end();
                                });
                            });
                        }

                       // Erhaltenes XML nach XSD Schema ungültig
                       else {

                           console.log(parsedXML.validationErrors);
                           
                           generateHelpForMalformedRequests("Match",function(MatchXml){
                           
                                //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                                res.status(400);
                               
                               //Fülle body mit einem Link der die korrekte Form einer Matchanfrage zeigt 
                                res.write(''+MatchXml);

                               //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Matchrepräsentation zeigt 				
                                res.end();
                           });
                       }
	               }
	           });
	       }
	});
	
	app.delete('/Match/:MatchId', function(req, res) {
                
        var matchId = req.params.MatchId;

        client.exists('Match ' + matchId, function(err, IdExists) {
            
               // Match unter der angegebenen ID existiert in der DB
               if(IdExists == 1) {
	           
                    //Lösche Eintrag aus der DB
                    client.del('Match ' + matchId);
                    
                    //Alles ok , sende 200 
                    res.status(204).send("Das hat funktioniert! Match gelöscht");
                    
                    //Antwort beenden
                    res.end();
                }
            
                // Match existierte nicht 
                else {
	               
	                res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }
            });
	    });

	// / MATCH // 
	// / MATCH //

//Lokalitaet

    app.get('/Lokalitaet/:LokalitaetId', function(req, res) {
        
        //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	    if (contentType != "application/atom+xml") {
	        //Teile dem Client einen unterstuetzten Type mit 
	        res.set("Accepts", "application/atom+xml");
	        //Zeige über den Statuscode und eine Nachricht 
	        res.status(406).send("Content Type is not supported");
	        //Antwort beenden
	        res.end();  
	    } 
        
        //Angefragte Id extrahieren 
        var LokalitaetId = req.params.LokalitaetId;
    
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Lokalitaet ' + LokalitaetId, function(err, IdExists) {
            
            //Die Lokalitaet existiert im System und ist nicht für den Zugriff von außen gesperrt
	        if (!IdExists) {
                res.status(404).send("Die Ressource wurde nicht gefunden.");
	            res.end();
            }
            
            //Angefragte Ressource existiert 
            else{
                var acceptedTypes = req.get('Accept');
                
                switch (acceptedTypes) {
                        
                    //Client erwartet content type application/atom+xml
                    case "application/atom+xml":
                        
                        //Baue Lokalitaetrepräsentation 
                        buildRep("Lokalitaet",LokalitaetId,function(err,lokalitaetXml){
                                          
	                        //Server antwortet mit einer Lokalitaetrepräsentation 
							res.set("Content-Type","application/atom+xml");
							
							//Antworte mit Content Type 200 - OK , schreibe Lokalitaetrepräsentation in den Body 
	                        res.status(200).write(''+lokalitaetXml);
                            
	                        //Antwort beenden        
							res.end();
                        });
                            
                    break;

	                default:
	                   //Der gesendete Accept header enthaelt kein unterstuetztes Format 
	                   res.status(406).send("Content Type wird nicht unterstuetzt");
	                   //Antwort beenden        
                       res.end();
	                break;
	            }
	        }
	    });
	});

    app.post('/Lokalitaet/', parseXML, function(req, res) {

        //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
        var contentType = req.get('Content-Type');

        //Check ob der Content Type der Anfrage xml ist 
        if (contentType != "application/atom+xml") {
	            res.set("Accepts", "application/atom+xml");
	            res.status(406).send("Content Type is not supported");
	            res.end();
        }
        
        else{
            //Req.body als XML Parsen 
            var parsedXML = libxml.parseXml(req.body);   
           
            //Das geparste XML gegen das XSD validieren 
            var validateAgXSD = parsedXML.validate(xsdDoc);
                
            //Xml-Instanzdokument war valide
            if(validateAgXSD) {

                // Parser Modul um req.body von XML in JSON zu wandeln
                xml2jsParser.parseString(req.body, function(err, xml) {
	                
				    // LokalitaetId in redis erhöhen, atomare Aktion 
                    client.incr('LokalitaetId', function(err, id) {
	                    
                        // Setze Hashset auf Key "Benutzer BenutzerId" 
                        client.hmset('Lokalitaet ' + id,{
                            'Name' : xml.Lokalitaet.Name,
                            'Beschreibung' : xml.Lokalitaet.Beschreibung,
                            'Kickertisch' : generateLinkELementFromHref("Kickertische hinzufuegen",kickertischRel,'Lokalitaet/'+id+'/Kickertisch')       
                        });
                 
                        //Setze Contenttype der Antwort auf application/atom+xml
                        res.set("Content-Type", 'application/atom+xml');
           
                        //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück und zeige mit Statuscode 201 erfolgreiches anlegen an 
	                    res.set("Location", "/Lokalitaet/" + id).status(201);
	                
                        buildRep("Lokalitaet",id,function(LokalitaetXml){
                    
                            //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                            res.write(''+LokalitaetXml);
                    
                            //Anfrage beenden 
	                        res.end();
                        });
                    });
	           });
	       }
	       
           //Xml-Instanzdokument war nicht gültig 
           else {
		      console.log(parsedXML.validationErrors);
               
              generateHelpForMalformedRequests("Lokalitaet",function(lokalitaetXml){
                  
                //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                res.status(400).write(''+lokalitaetXml);
              
                //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Matchrepräsentation zeigt 				
                res.end();
              });
	       }
        }
    });
    
     app.put('/Lokalitaet/:LokalitaetId', parseXML, function(req, res) {
            
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
            //Extrahiere Id aus der Anfrage 
            var LokalitaetId = req.params.LokalitaetId;

	        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	        client.exists('Lokalitaet ' + LokalitaetId, function(err, IdExists) {

	           //client.exists hat false geliefert 
	           if (!IdExists) {
	                    res.status(404).send("Die Ressource wurde nicht gefunden.");
	                    res.end();
	           }
	           
               //Ressource existiert     
               else {
                    //Req.body als XML Parsen 
                    var parsedXML = libxml.parseXml(req.body);
           
                    //Das geparste XML gegen das XSD validieren 
                    var validateAgXSD = parsedXML.validate(xsdDoc);
        
                    // Verschicktes XML nach XSD Schema gültig
                    if(validateAgXSD) {
                        
                        // Parser Modul um req.body von XML in JSON zu wandeln
                        xml2jsParser.parseString(req.body, function(err, xml) {
	                        
                            //Aendere Einträge in der Datenbank mit gelieferten Werten 
                            client.hmset('Lokalitaet ' + LokalitaetId, {
                                'Name' : xml.Lokalitaet.Name,
                                'Beschreibung' : xml.Lokalitaet.Beschreibung,
                                'Kickertisch' : 'Lokalitaet/'+LokalitaetId+'/Kickertisch'
                            });
                                 
                            //Jede Lokalitaet bekommt intern eine Liste mit ihren Kickertischen, es wird bei jeder Anfrage der Letzte Link 
                            //dieser Liste hinzugefügt 
                            client.LPUSH('Lokalitaet'+LokalitaetId+'Tische', 
                                xml.Lokalitaet.link[xml.Lokalitaet.link.length-1].$.href
                            );
                                              
                            //Wenn Content-Type und Validierung gestimmt haben, schicke die geupdatete Datei zurück
                            res.status(200).set('Content-Type', 'application/atom+xml');
                            
                            //Baue Repräsentation der Lokalitaet zusammen und schriebe sie in res.body 
                            buildRep("Lokalitaet",LokalitaetId,function(lokalitaetXml){
                                
                                //Liefere Repräsentation der geänderten Ressource zurück 
				                res.write(''+lokalitaetXml);

                                //Antwort beenden
	                            res.end();
                            });
                            
	                   });
	               }
                    
                   //Anfrage hat Validation nicht bestanden 
	               else {
                       
                        console.log(parsedXML.validationErrors);
                       
                        generateHelpForMalformedRequests("Lokalitaet",function(lokalitaetId){
                            
                            //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                            res.status(400).write(LokalitaetId);
                
                            //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 				
                            res.end();
                        });
	               }
	           }
	       });
	   }
	});
	
    app.delete('/Lokalitaet/:LokalitaetId', function(req, res) {

        //Extrahiere Id aus der Anfrage 
        var LokalitaetId = req.params.LokalitaetId;

        //Prüfe ob Lokalitaet existiert 
        client.exists('Lokalitaet ' + LokalitaetId, function(err, IdExists) {
            
            //Lokalitaet existiert 
            if(IdExists) {
                
	            //Entferne EIntrag aus der Datenbank 
                client.del('Lokalitaet ' + LokalitaetId);
                
                //Ermittle den Key unter dem die Linkliste dieser Lokalitaet in der DB abgelegt ist 
                var listenKey="Loklitaet" + id + "Tische";
                        
                        //Länge der Liste der gespeicherten Links 
                        client.LLEN(listenLaenge,function(err,obj){
                            
                            //Baue alle vorhandenen Links in das JS Objekt 
                            for(var i=0; i<listenLaenge; i++){
                                
                            
  
                           }
                        });
                    
                //Alles ok , sende 200 
                res.status(204).send("Das hat funktioniert! Lokalitaet mit allen Tischen gelöscht");
                    
                    //Antwort beenden
                    res.end();
                }
                else {
	               
	                res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }
            });
	    });


	// KICKERTISCH // 
	// KICKERTISCH // 

	//Kickertisch Methoden 
	app.get('/Lokalitaet/:LokalitaetId/Kickertisch/:TischId', function(req, res) {

	    var tischId = req.params.TischId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

	        //client.exists hat false geliefert 
	        if (!IdExists) {

	            res.status(404).send("Die Ressource wurde nicht gefunden.");
	            res.end();

	        } else {

	            var acceptedTypes = req.get('Accept');
	            switch (acceptedTypes) {

	                case "text/html":
	                    //Html repr. bauen
	                    res.status(200).send("Tischnummer: " + tischId);

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

	app.post('/Lokalitaet/:LokalitaetId/Kickertisch', parseXML, function(req, res) {
	
		// Parser Modul um req.body von XML in JSON zu wandeln
	    xml2jsParser.parseString(req.body, function(err, xml) {

	        //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	        var contentType = req.get('Content-Type');

	        //Check ob der Content Type der Anfrage xml ist 
	        if (contentType != "application/atom+xml") {
	            res.set("Accepts", "application/atom+xml");
	            res.status(406).send("Content Type is not supported");
	            res.end();
	        }
            else {
                client.incr('KickertischId', function(err, id) {
	                client.hmset('Kickertisch ' + id, {
	                    'Tischhersteller': xml["kickercheck"]["Kickertisch"][0]["Tischhersteller"],
	                    'Modell': xml["kickercheck"]["Kickertisch"][0]["Modell"],
	                    'Zustand': xml["kickercheck"]["Kickertisch"][0]["Zustand"],
	                    'Bild': xml["kickercheck"]["Kickertisch"][0]["Bild"]
                        
	                });
                    
	                res.set("Location", "/Kickertisch/" + id);
	                res.status(201).send("Kickertisch angelegt!");
	                //Antwort beenden 
	                res.end();
	            });
	        }
	    });
	});

	/*Mit put kann das Bild eines Kickertischs und/oder seine Zustandsbeschreibung geändert werden*/
	app.put('/Lokalitaet/:LokalitaetId/Kickertisch/:TischId/', parseXML, function(req, res) {

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

	            var tischId = req.params.TischId;

	            //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	            client.exists('Kickertisch ' + tischId, function(err, IdExists) {

	                //client.exists hat false geliefert 
	                if (!IdExists) {


	                    res.status(404).send("Die Ressource wurde nicht gefunden.");
	                    res.end();

	                } else {

	                    //Kickertisch Information in die Datenbank einfügen 
	                    client.hmset('Kickertisch ' + tischId, {
	                        'Tischhersteller': xml["kickercheck"]["Kickertisch"][0]["Tischhersteller"],
	                        'Modell': xml["kickercheck"]["Kickertisch"][0]["Modell"],
	                        'Standort': xml["kickercheck"]["Kickertisch"][0]["Standort"],
	                        'Zustand': xml["kickercheck"]["Kickertisch"][0]["Zustand"],
	                        'Bild': xml["kickercheck"]["Kickertisch"][0]["Bild"]
	                    });

	                    //Alles ok , sende 200 
	                    res.status(200).send("Das hat funktioniert! Tisch geändert");

	                    //Antwort beenden
	                    res.end();
	                }
	            });

	        });
	    }
	});

	app.delete('/Lokalitaet/:LokalitaetId/Kickertisch/:TischId/', function(req, res) {

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

	        var tischId = req.params.TischId;
	        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	        client.exists('Kickertisch ' + tischId, function(err, IdExists) {

	            //client.exists hat false geliefert 
	            if (!IdExists) {

	                res.status(404).send("Die Ressource wurde nicht gefunden.");
	                res.end();

	            } else {

	                client.del('Kickertisch ' + tischId);


	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Kickertisch ist weg");

	                //Antwort beenden
	                res.end();
	            }
	        });
	    }

	});

	// / KICKERTISCH // 
	// / KICKERTISCH //

	// MATCH -> SPIELSTAND // 
	// MATCH -> SPIELSTAND //

	//Subressource von Match: Spielstand Methoden
	app.get('/Match/:MatchId/Spielstand', function(req, res) {

	    var matchId = req.params.MatchId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match ' + matchId, function(err, IdExists) {

	        client.hget('Match ' + matchId, "Spielstand", function(err, spielstandValid) {

	            //client.exists hat false geliefert 
	            if (IdExists && spielstandValid) {

	                var acceptedTypes = req.get('Accept');
	                switch (acceptedTypes) {

	                    case "text/html":
	                        //Html repr. bauen
	                        res.status(200).send("Spielstand: " + spielstandValid);

	                        break;


	                    default:
	                        //We cannot send a representation that is accepted by the client 
	                        res.status(406).send("Content Type wird nicht unterstuetzt");
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
	    } else {
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
							// Durch alle "Match" und "Spieler" XML Tags iterieren
	                        for (var i = 0; i < xml.kickercheck.Match.length; i++) {

	                            client.hmset('Match ' + matchId, {
	                                'Spieler': xml["kickercheck"]["Match"][i]["Spieler"],
	                                'Kickertisch': xml["kickercheck"]["Match"][0]["Kickertisch"],
	                                'Datum': xml["kickercheck"]["Match"][0]["Datum"],
	                                'Uhrzeit': xml["kickercheck"]["Match"][0]["Uhrzeit"],
	                                'Spielstand': xml["kickercheck"]["Match"][0]["Spielstand"]
	                            });
	                        }

	                        //Alles ok , sende 200 
	                        res.status(200).send("Das hat funktioniert! Spielstand geändert auf " + xml["kickercheck"]["Match"][0]["Spielstand"]);

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
                
            //Wir wollen eine Lokalitaetsrepräsentation der Lokalitaet unter der ubergebenen URI zusammenbauen 
            case "Lokalitaet":
                
                client.hgetall('Lokalitaet '+ id,function(err,obj){
                        
                    //JS Objekt mit Daten aus der Datenbank füllen , das Root Element <lokalitaet> ist nicht in                                             //der DB, daher hier nicht benötigt um die Werte auszulesen  
                    var lokalitaet_object ={  
                        Name: obj.Name,
                        Beschreibung: obj.Beschreibung,
                        Kickertisch: {
                        //URI unter der dieser Lokalitaet Tische hinzugefügt werden können 
                        "link":generateLinkELementFromHref("Tische Hinzufuegen",kickertischRel,"http://localhost:3000/Lokalitaet/"+id+"/Kickertisch")
                        }
                    }
                    
                    //Ermittle den Key unter dem die Linkliste dieser Lokalitaet in der DB abgelegt ist 
                    var listenKey="Loklitaet" + id + "Tische";
                        
                        //Länge der Liste der gespeicherten Links 
                        client.LLEN(listenLaenge,function(err,obj){
                            
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
                        callback(err,LokalitaetXMLRep);
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
    
     //Um die Richtigen Variablennamen anzusprechen in folgenden AUsdrücken muss der Ressourcenname klein geschrieben sein 
     
    
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