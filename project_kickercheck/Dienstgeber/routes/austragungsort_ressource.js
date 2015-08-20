//Lokalitaet

app.get('/:AustragungsortId', function(req, res) {

    //Angefragte Id extrahieren 
    var AustragungsortId = req.params.AustragungsortId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Austragungsort ' + AustragungsortId, function(err, IdExists) {

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
                case "application/json":

                    client.hgetall('Austragungsort' + AustragungsortId, function(err,AustragungsortDaten){

                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json');

                        //Zeige über Statuscode 200 Erfolg an 
                        res.status(200);

                        //Schreibe die Daten des Nutzers unter <benutzerId> in den Body
                        res.json(AustragungsortDaten);

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
    });
});

app.post('/',function(req, res) {

    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage xml ist 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json");
        res.status(406).send("Content Type is not supported");
        res.end();
    }

    else{
        // LokalitaetId in redis erhöhen, atomare Aktion 
        client.incr('AustragungsortId', function(err, id) {

            // Setze Hashset auf Key "Benutzer BenutzerId" 
            client.hmset('Austragungsort ' + id,{
                'Name' : req.body.Name,
                'Beschreibung' : req.body.Beschreibung,
                'Adresse':req.body.Adresse,
            });

            //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json');

            //Schicke das URI-Template für den Angeleten Benutzer via Location-Header zurück und zeige mit Statuscode 201 erfolgreiches anlegen an 
            res.set("Location", "/Austragungsort/" + id).status(201);

            //Wenn Content-Type und Validierung gestimmt haben, schicke die angelete Datei zurück
            res.json(req.body);

            //Anfrage beenden 
            res.end();
        });
    }
});


app.put('/:AustragungsortId', function(req, res) {

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
        //Extrahiere Id aus der Anfrage 
        var AustragungsortId = req.params.AustragungsortId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Austragungsort' + AustragungsortId, function(err, IdExists) {

            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).send("Die Ressource wurde nicht gefunden.");
                res.end();
            }

            //Ressource existiert     
            else {

                //Aendere Einträge in der Datenbank mit gelieferten Werten 
                client.hmset('Austragungsort' + AustragungsortId, {
                    'Name' : req.body.Name,
                    'Beschreibung' : req.body.Beschreibung,
                    'Adresse':req.body.Adresse
                });

                //Wenn Content-Type und Validierung gestimmt haben, schicke die geupdatete Datei zurück
                res.status(200).set('Content-Type', 'application/json');

                //Liefere Repräsentation der geänderten Ressource zurück 
                res.json(req.body);

                //Antwort beenden
                res.end();
            }
        });
    }
});

app.delete('/:AustragungsortId', function(req, res) {

    //Extrahiere Id aus der Anfrage 
    var AustragungsortId = req.params.AustragungsortId;

    //Prüfe ob Lokalitaet existiert 
    client.exists('Austragungsort ' + AustragungsortId, function(err, IdExists) {

        //Lokalitaet existiert 
        if(IdExists) {

            //Entferne EIntrag aus der Datenbank 
            client.del('Austragungsort ' + AustragungsortId);

            //Alles ok , sende 200 
            res.status(204).send("Das hat funktioniert! Austragungsort gelöscht");

            //Antwort beenden
            res.end();
        }

        else {
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }
    });
});
