var app = express.Router();

app.get('/:TickerId', function(req, res) {

        //Extrahiere TischId
	    var tickerId = req.params.TickerId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Liveticker ' + tickerId, function(err, IdExists) {

	        //Lokalitaet kennt einen Tisch mit dieser TischId
	        if (IdExists) {
            
                //Ermittle vom Client unterstützte content types 
                var acceptedTypes = req.get('Accept');
                
	            switch (acceptedTypes) {

                    //Client kann application/json verarbeiten 
	                case "application/json":
                        
                        client.hgetall('Liveticker ' + tickerId, function(err,LivetickerDaten){
                            
                            //Server antwortet mit einer Lokalitaetrepräsentation 
							res.set("Content-Type","application/json");
                            
                            //Zeige mit Statuscode 200 Erfolg beim Abruf an 
                            res.status(200).json(LivetickerDaten);
                            
                            //Beende Antwort 
                            res.end();
                     });        
	                break;

	                default:
                        
	                   //We cannot send a representation that is accepted by the client 
	                   res.status(406);
                       res.set("Accepts", "application/json");
                       res.end();
                        
	                break;
	        }
	        }       
            //Lokalitaet kennt keinen Tisch mit dieser Id 
            else {
	            res.status(404).send("Die Ressource wurde nicht gefunden ticker.");
	            res.end();
	        }
	    });
	});

	app.post('/',function(req, res){
        
        var Liveticker = req.body;
        
        //Anlegen eines Tisches geht nur mit Content Type application/atom+xml
	    var contentType = req.get('Content-Type');
        
        //Check ob der Content Type der Anfrage xml ist 
        if (contentType != "application/json") {
	       res.set("Accepts", "application/json");
	       res.status(406).send("Content Type is not supported");
	       res.end();
	    }
        
        else {
            
                    //Inkrementiere Kickertischids in der DB , atomare Aktion 
                    client.incr('LivetickerId', function(err, id) {
                        
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Liveticker ' + id, {
	                        'id': id,
                            'Match': Liveticker.Match,
                            'Subscriber': [Liveticker.Subscriber],
                            'Beschreibung': Liveticker.Beschreibung
                        });
                       
                                        
                            //Teile dem Client die URI der neu angelegten Ressource mit 
                            res.set("Location", "/Liveticker/" + id);
                            
                            //Setze content type der Antwort 
							res.set("Content-Type","application/json");
                            
                            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
                            res.json(req.body);
                            
                            //Antwort beenden 
                            res.end();
                        });
                }
            
    });

	/*Mit put kann das Bild eines Kickertischs und/oder seine Zustandsbeschreibung geändert werden*/
	app.put('/:TickerId/', function(req, res) {

		var Liveticker = req.body;
		
	    var contentType = req.get('Content-Type');

	    //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	    if (contentType != "application/json") {
	        //Teile dem Client einen unterstuetzten Type mit 
	        res.set("Accepts", "application/json");
	        //Zeige über den Statuscode und eine Nachricht 
	        res.status(406).send("Content Type is not supported");
	        //Antwort beenden
	        res.end();
	    }
                
        else {
                         
                //Extrahiere Tischid aus der Anfrage
                var id = req.params.TickerId;
                                                           
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Liveticker ' + id, {
                             'Match': Liveticker.Match,
                            'Subscriber': [Liveticker.Subscriber],
                            'Beschreibung': Liveticker.Beschreibung
                        });
                                    
                            //Setze content type der Antwort 
							res.set("Content-Type","application/json");

                            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
                            res.json(req.body);
                            
                            //Antwort beenden 
                            res.end();
                        
                }
	});

module.exports = app;