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
                                'Austragungsort': xml.Match.Austragungsort[0].link[0].$.href, 
                                'Teilnehmer1': xml.Match.link[0].$.href,
                                'Teilnehmer2': xml.Match.link[1].$.href,
                                'Teilnehmer3': xml.Match.link[2].$.href,
                                'Teilnehmer4': xml.Match.link[3].$.href,
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
                                        res.write(' '+MatchXml);

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
                                res.write(' '+MatchXml);

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

