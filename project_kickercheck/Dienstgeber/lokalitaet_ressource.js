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
                            'Adresse':xml.Lokalitaet.Adresse,
                            'Kickertisch' : generateLinkELementFromHref("Kickertische hinzufuegen",KickertischRel,'Lokalitaet/'+id+'/Kickertisch')       
                        });
                 
                        //Setze Contenttype der Antwort auf application/atom+xml
                        res.set("Content-Type", 'application/atom+xml');
           
                        //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück und zeige mit Statuscode 201 erfolgreiches anlegen an 
	                    res.set("Location", "/Lokalitaet/" + id).status(201);
	                
                        buildRep("Lokalitaet",id,function(LokalitaetXml){
                    
                            //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
                            res.write(' '+LokalitaetXml);
                    
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
                                'Adresse':xml.Lokalitaet.Adresse,
                                'Kickertisch' : 'Lokalitaet/'+LokalitaetId+'/Kickertisch'
                            });
                                                                              
                            //Wenn Content-Type und Validierung gestimmt haben, schicke die geupdatete Datei zurück
                            res.status(200).set('Content-Type', 'application/atom+xml');
                            
                            //Baue Repräsentation der Lokalitaet zusammen und schriebe sie in res.body 
                            buildRep("Lokalitaet",LokalitaetId,function(lokalitaetXml){
                                
                                //Liefere Repräsentation der geänderten Ressource zurück 
				                res.write(' '+lokalitaetXml);

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
                        client.LLEN(listenKey,function(err,listenLaenge){
                            
                            //Lösche alle Kickertische in dieser Liste 
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
