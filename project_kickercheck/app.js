	//Redis.io NoSQL Datenbankmodul für Node.js einbinden 
	var redis = require('redis');

	//Client für die Abfrage von Daten aus der Redis DB erzeugen 
	var client = redis.createClient();
	
	//Express Modul einbinden 
	var express = require('express');
	
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
	client.SETNX("ForderungsId", "0");
	client.SETNX("KickertischId", "0");
	client.SETNX("MatchId", "0");
	client.SETNX("StandortId", "0");
	client.SETNX("AccountId", "0");
	client.SETNX("TurnierId", "0");
	
	//XML-Schema zur Validierung einlesen , Synchrone Variante gewählt weil dies eine Voraussetzung für den Erfolg anderer Methoden ist 
	var xsd=fileSystem.readFileSync('./Assets/XMLValidation/kickercheck_xml_schema.xsd','utf8');
	
	//XML-Schema parsen 
	var xsdDoc = libxml.parseXml(xsd);
	
    var atomNS = "http://www.w3.org/2005/Atom";
	var kickerNS = "http://www.kickercheck.de/namespace";
	var matchRel = "http://www.kickercheck.de/rels/Match";
	var lokalitaetRel = "http://www.kickercheck.de/rels/Lokalitaet";
	var spielstandRel = "http://www.kickercheck.de/rels/Spielstand";
	var benutzerRel = "http://www.kickercheck.de/rels/Benutzer";
	 
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
	
	"atom:link" : {'#text':'NULL', '@title':"NULL",'@rel':matchRel,'@href':"NULL"}
  
  }
};

 var lokalitaet_object = {  
  Lokalitaet: {
    Name: "NULL",
	Beschreibung: "NULL",
	"atom:link" : {'#text':'NULL', '@title':"NULL",'@rel':lokalitaetRel,'@href':"NULL"}
  
  }
};

 var match_object = {  
  Match: [
   {Datum: "NULL" },
	{Uhrzeit: "NULL" },
    {"atom:link" : {'#text':'NULL', '@title':"Teilnehmer",'@rel':benutzerRel,'@href':"NULL"} },
	{"atom:link" : {'#text':'NULL', '@title':"Austragungsort",'@rel':lokalitaetRel,'@href':"NULL" } }
  ]};
  
/*  gültige Matchanfrage

<?xml version="1.0" encoding="UTF-8" ?><Match xmlns="http://www.kickercheck.de/namespace"><Datum>02.11.2012</Datum><Uhrzeit>12:25</Uhrzeit><atom:link title="Teilnehmer" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/1" ></atom:link><atom:link title="Teilnehmer" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/2" ></atom:link><atom:link title="Austragungsort" rel="http://www.kickercheck.de/rels/Lokalitaet" href="http://localhost:3000/Lokalitaet/1" ></atom:link></Match>

*/

 var spielstand_object = {  
  Spielstand: 'NULL'
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
	                    
	                    client.hgetall('Benutzer ' + benutzerId,function(err,obj) {
		                   
		                var benutzerZu = builder.create('kickercheck',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:atom',atomNS).att('xmlns:kickercheck', kickerNS)
.ele(obj)
.end({ pretty: true });

   							//Server antwortet mit einer Benutzerrerpräsentation 
							res.set("Content-Type","application/atom+xml");
							//Antworte mit Content Type 200 - OK , schreibe Benutzerrepräsentation in den Body 
	                        res.status(200).write(' '+benutzerZu);
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
        
/*
            console.log("XML Validierungsfehler:");
           console.log(parsedXML.validationErrors);
*/
	
            // Verschicktes XML nach XSD Schema gültig
            if(validateAgXSD) {

                // Parser Modul um req.body von XML in JSON zu wandeln
                xml2jsParser.parseString(req.body, function(err, xml) {
	                
/*
	                console.log(xml);
	                
	                console.log(xml.Benutzer.Name);
*/
	                
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
                    
                    //Setze Contenttype der Antwort auf application/atom+xml
                    res.set("Content-Type", 'application/atom+xml');
           
                    //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück
	                res.set("Location", "/Benutzer/" + id).status(201);
	                
	         
                    //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                    res.write(' '+req.body);
                    
	                //Anfrage beenden 
	                res.end();
	               });
	           });
	       }
	       
           //Das Übertragene XML-Schema war ungültig
           else{
	            //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                res.status(400).send("Die Anfrage enthielt keine gütlige Benutzerrepräsentation.");
                
                //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 				
                res.end();
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
							
							 //Wenn Content-Type und Validierung gestimmt haben, schicke die geupdatete Datei zurück
                             res.status(200).set('Content-Type', 'application/atom+xml');
                             
                             //Liefere Repräsentation der geänderten Ressource zurück 
							res.write(' '+req.body);

                            //Antwort beenden
	                        res.end();
	                        
	                        }    
                       
                            
                        //Das XML+Atom Schema war nicht gültig
                        else {
			               //Setze content Type auf 400 - Bad Request , 
			               //der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
						   res.status(400).send("Die Anfrage enthielt keine gütlige Benutzerrepräsentation.");
	                
						   //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 				
						   
						   res.end();
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
                    res.status(200).send("Das hat funktioniert! Benutzer gelöscht");
                    
                    //Antwort beenden
                    res.end();
                }
                
                else if(IdExists == 1 && benutzerValid == 0) {
	                 res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }
                
                else {
	                res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }
            });
	    });
	});
	
		// MATCH // 
	// MATCH //

	//Match Methoden
	app.get('/Match/:MatchId', function(req, res) {

	    var matchId = req.params.MatchId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match ' + matchId, function(err, IdExists) {
                //Der Benutzer existiert im System und ist nicht für den Zugriff von außen gesperrt
	            if (!IdExists) {
                        res.status(404).send("Die Ressource wurde nicht gefunden.");
	                    res.end();
                }
                else{

           
                    var acceptedTypes = req.get('Accept');
                    switch (acceptedTypes) {

	                case "application/atom+xml":
                            
                        client.hgetall('Match ' + MatchId,function(err,obj) {
		                   
		                var MatchZu = builder.create('Match',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck', kickerNS)
.ele(obj)
.end({ pretty: true });
	                    
	                    //Server antwortet mit einer Matchrerpräsentation 
							res.set("Content-Type","application/atom+xml");
							//Antworte mit Content Type 200 - OK , schreibe Benutzerrepräsentation in den Body 
	                        res.status(200).write(' '+MatchZu);
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

	            res.end();
	        }
	    });


	});

	app.post('/Match', parseXML, function(req, res) {


	    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	    var contentType = req.get('Content-Type');

	    //Check ob der Content Type der Anfrage xml ist 
	    if (contentType != "application/atom+xml") {
	        res.set("Accepts", "application/atom+xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    } else {
		    
		    	//Req.body als XML Parsen 
            var parsedXML = libxml.parseXml(req.body);
        
	       
	       //Das geparste XML gegen das XSD validieren 
            var validateAgXSD = parsedXML.validate(xsdDoc);
        
/*
            console.log("XML Validierungsfehler:");
           console.log(parsedXML.validationErrors);
*/
	
            // Verschicktes XML nach XSD Schema gültig
            if(validateAgXSD) {


		// Parser Modul um req.body von XML in JSON zu wandeln
	        xml2jsParser.parseString(req.body, function(err, xml) {
			
			
			console.log(util.inspect(xml, {showHidden: false, depth: null}));
			
			
			
	            client.incr('MatchId', function(err, id) {
					// Durch alle "Match" und "Spieler" XML Tags iterieren


	                    client.hmset('Match ' + id, {
                            
		                    'Datum' : xml.Match.Datum,
		                    'Uhrzeit': xml.Match.Uhrzeit,
                            'Austragungsort': xml.Match.Austragungsort, 
                            
 	                        'Teilnehmer': xml.Match.link[0],
                            'Teilnehmer2': xml.Match.link[1],
                            'Teilnehmer3': xml.Match.link[2],
                            'Teilnehmer4': xml.Match.link[3],
                            
                            'Spielstand' : xml.Match.link[4]
                            
                          	                    });
                    
	                //Setze Contenttype der Antwort auf application/atom+xml
                    res.set("Content-Type", 'application/atom+xml');
           
                    //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück
	                res.set("Location", "/Match/" + id).status(201);
	                
                    //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                    res.write(' '+req.body);
                    
	                //Anfrage beenden 
	                res.end();
	            });
	        });
	    }
	    else {
		     console.log(parsedXML.validationErrors);
		     //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                res.status(400).send("Die Anfrage enthielt keine gütlige Benutzerrepräsentation.");
                
                //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 				
                res.end();
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
	    } else {
            //Req.body als XML Parsen 
            var parsedXML = libxml.parseXml(req.body);
        
	       
	       //Das geparste XML gegen das XSD validieren 
            var validateAgXSD = parsedXML.validate(xsdDoc);
        
/*
            console.log("XML Validierungsfehler:");
           console.log(parsedXML.validationErrors);
*/
	
            // Verschicktes XML nach XSD Schema gültig
            if(validateAgXSD) {
		    // Parser Modul um req.body von XML in JSON zu wandeln
	        xml2jsParser.parseString(req.body, function(err, xml) {

	            var matchId = req.params.MatchId;

	            //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	            client.exists('Match ' + matchId, function(err, IdExists) {

	                //client.exists hat false geliefert 
	                if (!IdExists) {

	                    res.status(404).send("Die Ressource wurde nicht gefunden.");
	                    res.end();


	                } else {


                        client.hmset('Match ' + matchId, {
                            
		                    'Datum' : xml.Match.Datum,
		                    'Uhrzeit': xml.Match.Uhrzeit,
                            'Austragungsort': xml.Match.Austragungsort, 
                            
 	                        'Teilnehmer': xml.Match.link[0],
                            'Teilnehmer2': xml.Match.link[1],
                            'Teilnehmer3': xml.Match.link[2],
                            'Teilnehmer4': xml.Match.link[3],
                          	                    });
	                    
                            //Wenn Content-Type und Validierung gestimmt haben, schicke die geupdatete Datei zurück
                             res.status(200).set('Content-Type', 'application/atom+xml');
                             
                             //Liefere Repräsentation der geänderten Ressource zurück 
							res.write(' '+req.body);

                            //Antwort beenden
	                        res.end();
	                }
	            });
	        });
	    }
        else {
		     console.log(parsedXML.validationErrors);
		     //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                res.status(400).send("Die Anfrage enthielt keine gütlige Benutzerrepräsentation.");
                
                //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 				
                res.end();
	    }
	  }
	});

	// / MATCH // 
	// / MATCH //

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

	// KICKERTISCH -> FORDERUNGEN // 
	// KICKERTISCH -> FORDERUNGEN //

	//Subressource von Kickertisch: Forderungen Methoden
	app.post('/Kickertisch/:TischId/Forderungen', parseXML, function(req, res) {

	    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	    var contentType = req.get('Content-Type');

	    //Check ob der Content Type der Anfrage xml ist 
	    if (contentType != "application/atom+xml") {
	        res.set("Accepts", "application/atom+xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    } else {

	        var tischId = req.params.TischId;

	        client.exists('Kickertisch ' + tischId, function(err, IdExists) {

	            if (!IdExists) {

	                res.status(404).send("Die Ressource wurde nicht gefunden.");
	                res.end();

	            } else {

					// Parser Modul um req.body von XML in JSON zu wandeln
	                xml2jsParser.parseString(req.body, function(err, xml) {

	                    //Warte bis der id Zaehler erhoeht wurde 
	                    client.incr('ForderungsId', function(err, fid) {

	                        client.hmset('Kickertisch ' + tischId + ' Forderung ' + fid, {
	                            'Datum': xml["kickercheck"]["Forderung"][0]["Datum"],
	                            'Uhrzeit': xml["kickercheck"]["Forderung"][0]["Uhrzeit"]
	                        });

	                        res.set("Location", "/Kickertisch/" + tischId + "/Forderungen/" + fid);

	                        res.status(201).send("Forderung für Kickertisch angelegt!");
	                        //Antwort beenden 
	                        res.end();
	                    });
	                });
	            }
	        });
	    }
	});

	app.delete('/Kickertisch/:TischId/Forderungen/:ForderungsId/', function(req, res) {
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  

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
	        var forderungsId = req.params.ForderungsId;

	        client.exists('Kickertisch ' + tischId + ' Forderung ' + req.params.ForderungsId, function(err, IdExists) {

	            //client.exists hat false geliefert 
	            if (!IdExists) {
	                res.status(404).send("Die Ressource wurde nicht gefunden.");
	                res.end();

	            } else {


	                client.del('Kickertisch ' + tischId + ' Forderung ' + forderungsId);

	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Foderung gelöscht.");
	                res.end();

	            }
	        });
	    }
	});

	// / KICKERTISCH -> FORDERUNGEN // 
	// / KICKERTISCH -> FORDERUNGEN //


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

	            } else {


	                client.del('Turnier ' + turnierId);

	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Turnier gelöscht.");
	                res.end();

	            }
	        });
	    }
	});

	//Server lauscht auf Anfragen auf Port 3000
	app.listen(3000);



	// / TURNIER // 
	// / TURNIER //


	// VALIDIERE XML GEGEN SCHEMA //
	// VALIDIERE XML GEGEN SCHEMA //

	/*
		
	var xsd = '<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"> <xsd:element name="root" type="rootTyp" /> <xsd:element name="Benutzer" type="BenutzerTyp"/> <xsd:element name="Forderung" type="ForderungTyp"/> <xsd:complexType name="BenutzerTyp"> <xsd:all> <xsd:element ref="Name"/> <xsd:element ref="Alter"/> <xsd:element ref="Position"/> <xsd:element ref="Profilbild"/> </xsd:all> </xsd:complexType> <xsd:element name="Name" type="xsd:string"/> <xsd:element name="Alter" type="xsd:integer"/> <xsd:element name="Profilbild" type="xsd:base64Binary"/> <xsd:element name="Position" type="PositionTyp"/> <xsd:simpleType name="PositionTyp"> <xsd:restriction base="xsd:string"> <xsd:enumeration value="Sturm"/> <xsd:enumeration value="Verteidigung"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="ForderungTyp"> <xsd:sequence> <xsd:element ref="Datum"/> <xsd:element ref="Uhrzeit"/> </xsd:sequence> </xsd:complexType> <xsd:element name="Datum" type="xsd:date"/> <xsd:element name="Uhrzeit" type="xsd:time"/> <xsd:complexType name="rootTyp"> <xsd:all> <xsd:element ref="Benutzer"/> <xsd:element ref="Forderung"/> </xsd:all> </xsd:complexType> <xsd:element name="Turnier" type="TurnierTyp"/> <xsd:element name="Match" type="MatchTyp"/> <xsd:element name="Kickertisch" type="KickertischTyp"/> <xsd:element name="Standort" type="xsd:string"/> <xsd:element name="Tischhersteller" type="TischherstellerTyp"/> <xsd:element name="Modell" type="ModellTyp"/> <xsd:element name="Zustand" type="xsd:string"/> <xsd:complexType name="TurnierTyp" > <xsd:sequence> <xsd:element ref="Standort"/> <xsd:element ref="Tischhersteller"/> </xsd:sequence> </xsd:complexType> <xsd:complexType name="MatchTyp"> <xsd:sequence> <xsd:element ref="Datum"/> <xsd:element ref="Uhrzeit"/> <xsd:element ref="Kickertisch"/> </xsd:sequence> </xsd:complexType> <xsd:complexType name="KickertischTyp"> <xsd:sequence> <xsd:element ref="Standort"/> <xsd:element ref="Tischhersteller"/> <xsd:element ref="Modell"/> </xsd:sequence> </xsd:complexType> <xsd:simpleType name="TischherstellerTyp"> <xsd:restriction base="xsd:string"> <xsd:enumeration value="Heiku" /> <xsd:enumeration value="Fireball" /> <xsd:enumeration value="Leonhart" /> <xsd:enumeration value="Lettner"/> <xsd:enumeration value="Libero"/> <xsd:enumeration value="Tornado"/> <xsd:enumeration value="Ullrich"/> <xsd:enumeration value="P4P"/> <xsd:enumeration value="Tuniro"/> <xsd:enumeration value="Garlando"/> <xsd:enumeration value="Longoni"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="ModellTyp"> </xsd:complexType> <xsd:complexType name="StandortTyp"> </xsd:complexType> </xsd:schema> ';
	var xsdDoc = libxml.parseXmlString(xsd);
	app.use(express.static(__dirname + '/Assets/XMLValidation'));
	
	
	var parsedXML = libxml.parseXmlString(req.body);
	
	var validateAgXSD = parsedXML.validate(xsdDoc);
	
	if(validateAgXSD) {
		// Verschicktes XML nach XSD Schema gültig
		}
	 else {
		        res.status(404).send("Das Schema war ungültig.");
		            res.end();
	        }
	*/

	// / VALIDIERE XML GEGEN SCHEMA //
	// / VALIDIERE XML GEGEN SCHEMA //


	// KICKERTISCH -> FORDERUNGEN PUT // 
	// KICKERTISCH -> FORDERUNGEN PUT //


	/*
	
	app.put('/Kickertisch/:TischId/Forderungen/:ForderungsId/', parseXML , function(req,res){
	    
	    var tischid = req.params.TischId;
	
	    client.exists('Kickertisch '+tischid+ ' Forderung '+req.params.ForderungsId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
		        
		        var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/atom+xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/atom+xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		         
	               //Kickertisch Information in die Datenbank einfügen 
	            client.hmset('Kickertisch '+req.params.TischId+ ' Forderung '+req.params.ForderungsId,
	            {'Datum':req.body.root.Datum,'Uhrzeit':req.body.root.Uhrzeit});
	                            
	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Aenderungen angenommen");
	                
	                //Antwort beenden
	                res.end();
	            }
	            });
	
	        //Abfrage des contenttypes der Request
	            
	           
	});
	*/

	// / KICKERTISCH -> FORDERUNGEN PUT // 
	// / KICKERTISCH -> FORDERUNGEN PUT //