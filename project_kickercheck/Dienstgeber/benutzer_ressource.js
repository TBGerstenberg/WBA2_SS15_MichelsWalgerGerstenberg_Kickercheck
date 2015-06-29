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
                        
                        //client kann application/atom+xml verarbeiten     
	                    case "application/atom+xml":
                               
                            //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                            buildRep("Benutzer",benutzerId,function(err,benutzerXMLRep){

                                console.log(benutzerXMLRep);

                                //Setze Contenttype der Antwort auf application/atom+xml
                                res.set("Content-Type", 'application/atom+xml');

                                //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück
                                res.status(200);

                                res.write(' '+benutzerXMLRep);

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


	app.post('/Benutzer', jsonParser, function(req, res) {

	    //Content Type der Anfrage abfragen 
	    var contentType = req.get('Content-Type');

	    //Check ob der Content Type der Anfrage xml ist 
	    if (contentType != "application/json") {
	        res.set("Accepts", "application/json");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    } 
        
        else{
            
	                	                
				    // BenutzerId in redis erhöhen, atomare Aktion 
                    client.incr('BenutzerId', function(err, id) {
                        
                        console.log("Die BenutzerId nach hinzufügen eines Benutzers : " + id);
	                    
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
                            
                            //Setze Contenttype der Antwort auf application/atom+xml
                            res.set("Content-Type", 'application/atom+xml');

                            //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück
                            res.set("Location", "/Benutzer/" + id).status(201);

                            res.write(' '+benutzerXMLRep);

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
                    res.write(' '+benutzerXML);
                
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

                                    res.write(' '+benutzerXMLRep);

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
                                    res.write(' '+benutzerXML);

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

    //Listenressource Benutzer 
    app.get('/Benutzer',function(req,res){
        
        buildRep("BenutzerListe",0,function(benutzerListeXMLRep){
            
                //Abruf war erfolgreich , antworte mit Statuscode 200 
                res.status(200);

                //Setze content type der Antwort auf application/atom+xml 
                res.set("Content-Type","application/atom+xml");

                //Schreibe XML in Antwort 
                res.write(' '+benutzerListeXMLRep);

                //Beende Antwort 
                res.end();
            
        });
    });