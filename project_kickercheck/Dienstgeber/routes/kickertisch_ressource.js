app.get('/Lokalitaet/:LokalitaetId/Kickertisch/:TischId', function(req, res) {

        //Extrahiere TischId
	    var tischId = req.params.TischId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

	        //Lokalitaet kennt einen Tisch mit dieser TischId
	        if (IdExists) {
            
                //Ermittle vom Client unterstützte content types 
                var acceptedTypes = req.get('Accept');
                
	            switch (acceptedTypes) {

                    //Client kann application/atom+xml verarbeiten 
	                case "application/atom+xml":
                        
                        //Baue XML Repr. des Kickertisches 
	                    buildRep("Kickertisch",tischId,function(kickertischXml){
                            
                            //Server antwortet mit einer Lokalitaetrepräsentation 
							res.set("Content-Type","application/atom+xml");
                            
                            //Zeige mit Statuscode 200 Erfolg beim Abruf an 
                            res.status(200).write(''+kickertischXml);
                            
                            //Beende Antwort 
                            res.end();
                        });   
	                break;

	                default:
                        
	                   //We cannot send a representation that is accepted by the client 
	                   res.status(406);
                       res.set("Accepts", "application/atom+xml");
                       res.end();
                        
	                break;
	           }
            }

            //Lokalitaet kennt keinen Tisch mit dieser Id 
            else {
	            res.status(404).send("Die Ressource wurde nicht gefunden.");
	            res.end();
	        }
	    });
	});

	app.post('/Lokalitaet/:LokalitaetId/Kickertisch', parseXML,function(req, res){
        
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
                    
                    //Inkrementiere Kickertischids in der DB , atomare Aktion 
                    client.incr('KickertischId', function(err, id) {
                        
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Kickertisch ' + id, {
                            'Tischhersteller': xml.Kickertisch.Tischhersteller,
                            'Modell': xml.Kickertisch.Modell,
                            'Zustand': xml.Kickertisch.Zustand,
                            'Bild': xml.Kickertisch.Bild
                        });
                        
                        //Extrahiere LokalitaetId aus Anfrage 
                        var LokalitaetId = req.params.LokalitaetId;

                        //Jede Lokalitaet hat intern eine Liste mit ihren Kickertischen,
                        //Bei jedem Post auf einen Tisch wird dieser Liste ein Eintrag hinzugefügt 
                        //Die Liste wird beim zusammensetzen von Repräsentationen der Lokalitaet berücksichtigt 
                        //Die Liste beinhaltet lediglich den Wert des href-Attributs des zugehörigen 
                        //Link Elements ,denn die anderen Attribute wie "title" variieren je nach Kontext 
                        client.LPUSH('Lokalitaet'+LokalitaetId+'Tische', 
                            "http://kickercheck.de/Lokalitaet/" + LokalitaetId + "/Kickertisch/" + id
                        );
                        
                        //Baue Repräsentation des Kickertisches und schreibe diese in res.body 
                        buildRep("Kickertisch",id,function(kickertischXml){
                                        
                            //Teile dem Client die URI der neu angelegten Ressource mit 
                            res.set("Location", "/Kickertisch/" + id);
                            
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
                generateHelpForMalformedRequests("Kickertisch",function(kickertischXml){
                    
                    //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                    res.status(400);
                
                    //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 
                    res.write(kickertischXml);
                		
                    //Antwort beenden 
                    res.end();     
                });
            }
        }
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
	    }
                
        else {
            
            //Req.body als XML Parsen 
            var parsedXML = libxml.parseXml(req.body);
           
            //Das geparste XML gegen das XSD validieren 
            var validateAgXSD = parsedXML.validate(xsdDoc);
            
            //Anfrage ist bezüglich der XSD Valide 
            if(validateAgXSD){
                
                //Extrahiere Tischid aus der Anfrage
                var id = req.params.TischId;
                    
                // Parser Modul um req.body von XML in JSON zu wandeln
                xml2jsParser.parseString(req.body,function(err, xml){
                                            
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Kickertisch ' + id, {
                            'Tischhersteller': xml.Kickertisch.Tischhersteller,
                            'Modell': xml.Kickertisch.Modell,
                            'Zustand': xml.Kickertisch.Zustand,
                            'Bild': xml.Kickertisch.Bild
                        });

                        //Baue Repräsentation des Kickertisches und schreibe diese in res.body 
                        buildRep("Kickertisch",id,function(kickertischXml){
                                    
                            //Setze content type der Antwort 
							res.set("Content-Type","application/atom+xml");
                            
                            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
                            res.status(201).write(kickertischXml);
                            
                            //Antwort beenden 
                            res.end();
                        });
                });
            }
            
            //Anfrage ist nicht valide 
            else{
                
                //Verweise den Client auf die korrekte Form einer Kickertischanfrage
                generateHelpForMalformedRequests("Kickertisch",function(kickertischXml){
                    
                    //Setze content Type auf 400 - Bad Request , der Client sollte die gleiche Anfrage nicht erneut stellen ohne Den Content zu ändern 
                    res.status(400);
                
                    //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt 
                    res.write(LokalitaetId);
                		
                    //Antwort beenden 
                    res.end();     
                });
            }
        }
	});

	app.delete('/Lokalitaet/:LokalitaetId/Kickertisch/:TischId/', function(req, res) {

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
	});