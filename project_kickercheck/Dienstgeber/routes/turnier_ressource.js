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