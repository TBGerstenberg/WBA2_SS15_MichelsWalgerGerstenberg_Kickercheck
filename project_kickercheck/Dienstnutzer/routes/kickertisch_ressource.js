var app = express.Router();

app.get('/:TischId', function(req, res) {

        //Extrahiere TischId
	    var tischId = req.params.TischId;

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

	        //Lokalitaet kennt einen Tisch mit dieser TischId
	        if (IdExists) {
            
                //Ermittle vom Client unterstützte content types 
                var acceptedTypes = req.get('Accept');
                
	            switch (acceptedTypes) {

                    //Client kann application/json verarbeiten 
	                case "application/json":
                        
                        client.hgetall('Kickertisch ' + tischId, function(err,KickertischDaten){
                            
                            //Server antwortet mit einer Lokalitaetrepräsentation 
							res.set("Content-Type","application/json");
                            
                            //Zeige mit Statuscode 200 Erfolg beim Abruf an 
                            res.status(200).json(KickertischDaten);
                            
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
	            res.status(404).send("Die Ressource wurde nicht gefunden tisch.");
	            res.end();
	        }
	    });
	});

	app.post('/',function(req, res){
        
        var Kickertisch = req.body;
        
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
                    client.incr('KickertischId', function(err, id) {
                        
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Kickertisch ' + id, {
                            'Hersteller': Kickertisch.Hersteller,
                            'Typ': Kickertisch.Typ,
                            'Zustand': Kickertisch.Zustand,
                            'Bild': Kickertisch.Bild
                        });
                        
/*
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
                        
*/
                                        
                            //Teile dem Client die URI der neu angelegten Ressource mit 
                            res.set("Location", "/Kickertisch/" + id);
                            
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
	app.put('/:TischId/', function(req, res) {

		var Kickertisch = req.body;
		
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
                var id = req.params.TischId;
                                                           
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Kickertisch ' + id, {
                            'Hersteller': Kickertisch.Hersteller,
                            'Typ ': Kickertisch.Typ,
                            'Zustand': Kickertisch.Zustand,
                            'Bild': Kickertisch.Bild
                        });
                                    
                            //Setze content type der Antwort 
							res.set("Content-Type","application/json");

                            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
                            res.json(req.body);
                            
                            //Antwort beenden 
                            res.end();
                        
                }
	});

	app.delete('/:TischId/', function(req, res) {

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
	
// Subressource Belegungssituation

app.get('/:TischId/Belegung/:BelegungId', function(req, res) {

        //Extrahiere TischId
	    var tischId = req.params.TischId;
	    var belegungId = req.params.BelegungId

	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

	        
	        if (IdExists) {
            
                //Ermittle vom Client unterstützte content types 
                var acceptedTypes = req.get('Accept');
                
	            switch (acceptedTypes) {

                    //Client kann application/json verarbeiten 
	                case "application/json":
                        
                        client.hgetall('Belegung ' + belegungId, function(err,BelegungDaten){
                            
                            //Server antwortet mit einer Lokalitaetrepräsentation 
							res.set("Content-Type","application/json");
                            
                            //Zeige mit Statuscode 200 Erfolg beim Abruf an 
                            res.status(200).json(BelegungDaten);
                            
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
	            res.status(404).send("Die Ressource wurde nicht gefunden.");
	            res.end();
	        }
	    });
	});

	app.post('/:TischId/Belegung',function(req, res){
        
        var Belegung = req.body;
        var tischId = req.params.TischId;
        
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
                    client.incr('BelegungId', function(err, id) {
                        
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Belegung ' + id, {
                            'Teilnehmer 1': Belegung.Teilnehmer1,
                            'Teilnehmer 2': Belegung.Teilnehmer2,
                            'Teilnehmer 3': Belegung.Teilnehmer3,
                            'Teilnehmer 4': Belegung.Teilnehmer4,
                            'Herausforderung': Belegung.Herausforderung
                        });
                                                                
                            //Teile dem Client die URI der neu angelegten Ressource mit 
                            res.set("Location", "/Kickertisch/" + tischId +"/Belegung/" + id);
                            
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
	app.put('/:TischId/Belegung/:BelegungId', function(req, res) {

		var Belegung = req.body;
		
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
                var id = req.params.BelegungId;
                                                           
                        //Pflege Daten über den Kickertisch in die DB ein 
                        client.hmset('Belegung ' + id, {
                            'Teilnehmer 1': Belegung.Teilnehmer1,
                            'Teilnehmer 2': Belegung.Teilnehmer2,
                            'Teilnehmer 3': Belegung.Teilnehmer3,
                            'Teilnehmer 4': Belegung.Teilnehmer4,
                            'Herausforderung': Belegung.Herausforderung
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