var app = express.Router();

//Liefert eine Collection aller Austragungsorte im System 
app.get('/',function(req,res){

    //Speichert alle Austragungsort
    var response=[];    

    //returned ein Array aller Keys die das Pattern Austragungsort* matchen 
    client.keys('Austragungsort *', function (err, key) {

        //Collection ist leer, zeige dies mit leerem Array im Body
        //Abruf war dennoch erfolgreich , daher 200-OK
        if(key.length == 0) {
            res.status(200).json(response).end();
            return;
        }

        var sorted =  key.sort();

        //Lese austragungsorte aus Redis
        client.mget(sorted, function (err, austragungsort) {

            //Pushe alle Antworten in ein Array, bevor Sie zurück gegeben werden 
            austragungsort.forEach(function (val) {
                response.push(JSON.parse(val));
            });

            res.status(200).set("Content-Type","application/json").json(response).end();
        });
    });
});

//Liefert eine Repräsentation eines Austragungsortes 
app.get('/:AustragungsortId', function(req, res) {

    //Angefragte Id extrahieren 
    var austragungsortId = req.params.AustragungsortId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Austragungsort ' + austragungsortId, function(err, IdExists) {

        //Die Lokalitaet existiert im System und ist nicht für den Zugriff von außen gesperrt
        if (!IdExists) {
            res.status(404);
            res.end();
        }

        //Angefragte Ressource existiert 
        else{

            var acceptedTypes = req.get('Accept');

            //Frage Content types die der client verarbeiten kann ab
            switch (acceptedTypes) {

                    //Client erwartet content type application/json
                case "application/json":

                    client.mget('Austragungsort ' + austragungsortId, function(err,austragungsortdata){

                        var Austragungsortdaten = JSON.parse(austragungsortdata);

                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json').status(200).json(Austragungsortdaten).end();
                    });
                    break;

                    //Service kann keinen im Accept header angegebenen content Type unterstützen 
                default:
                    //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                    res.status(406).end();
                    break;
            }
        }
    });
});

//Fügt der Collection aller Austragungsorte einen neuen hinzu 
app.post('/',function(req, res) {

    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 415 - unsupported Media Type und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).end();
    } 

    else{

        //Post liefert eine Repräsentation der angelegten Ressource zurück, daher muss der Client JSON verarbeiten können
        var acceptedTypes = req.get('Accept');

        //Frage Content types die der client verarbeiten kann ab
        switch (acceptedTypes) {

                //Client erwartet content type application/json
            case "application/json":

                var Austragungsort = req.body;

                // AustragungsortId in redis erhöhen, atomare Aktion 
                client.incr('AustragungsortId', function(err, id) {

                    //In redis abgelegtes Objekt 
                    var austragungsortObj={
                        'id' : id,
                        'Name': Austragungsort.Name,
                        'Adresse': Austragungsort.Adresse,
                        'Beschreibung': Austragungsort.Beschreibung
                    };

                    //Pflege daten in DB 
                    client.set('Austragungsort ' + id, JSON.stringify(austragungsortObj));

                    //Setze Contenttype der Antwort auf application/json
                    res.set("Content-Type", 'application/json').set("Location", "/Austragungsort/" + id).status(201).json(austragungsortObj).end();
                });

                break;

                //Service kann keinen im Accept header angegebenen content Type unterstützen 
            default:
                //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                res.status(406).end();
                break;
        }
    }
});

//Ändert die Daten eines Austragungsortes 
app.put('/:AustragungsortId', function(req, res) {

    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 415 - unsupported Media Type und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).end();
    } 

    else { 

        //Post liefert eine Repräsentation der angelegten Ressource zurück, daher muss der Client JSON verarbeiten können
        var acceptedTypes = req.get('Accept');

        //Frage Content types die der client verarbeiten kann ab
        switch (acceptedTypes) {

                //Client erwartet content type application/json
            case "application/json":

                //Extrahiere Id aus der Anfrage 
                var austragungsortId = req.params.AustragungsortId;
                var Austragungsort = req.body;

                //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
                client.exists('Austragungsort ' + austragungsortId, function(err, IdExists) {

                    //client.exists hat false geliefert 
                    if (!IdExists) {
                        res.status(404).end();
                    }

                    //Ressource existiert     
                    else {

                        //Lese aktuellen Zustand des Turniers aus DB
                        client.mget('Austragungsort '+austragungsortId,function(err,austragungsortdata){

                            var Austragungsortdaten = JSON.parse(austragungsortdata);

                            //Aktualisiere änderbare Daten 
                            Austragungsortdaten.Name = Austragungsort.Name;
                            Austragungsortdaten.Adresse = Austragungsort.Adresse;
                            Austragungsortdaten.Beschreibung = Austragungsort.Beschreibung;


                            //Schreibe Turnierdaten zurück 
                            client.set('Austragungsort ' + austragungsortId,JSON.stringify(Austragungsortdaten));


                            //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                            res.set("Content-Type", 'application/json').status(200).json(Austragungsortdaten).end();
                        });
                    }
                });
                break;

                //Service kann keinen im Accept header angegebenen content Type unterstützen 
            default:
                //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                res.status(406).end();
                break;
        }
    }
});

//Löscht einen Austragungsort aus dem System 
app.delete('/:AustragungsortId', function(req, res) {

    //Extrahiere Id aus der Anfrage 
    var austragungsortId = req.params.AustragungsortId;

    //Prüfe ob Lokalitaet existiert 
    client.exists('Austragungsort ' + austragungsortId, function(err, IdExists) {

        //Lokalitaet existiert 
        if(IdExists) {

            //Speichert die alle Benutzer
            var response=[];    

            //returned ein Array aller Keys die das Pattern Match* matchen , der gelöschte AUstragungsort wird aus allen 
            //Matches entfernt , die bei ihm ausgetragen werden sollten 
            client.keys('Match *', function (err, key) {

                if(key.length == 0) {
                    client.del('Austragungsort ' + austragungsortId);
                    res.status(200).json(response).end();
                    return;
                }

                client.mget(key, function (err, match) {

                    //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
                    match.forEach(function (val) {

                        var dieseMatch = JSON.parse(val);

                        if(dieseMatch.Austragungsort) {

                            var ortURI = "/Austragungsort/"+austragungsortId;

                            var ortURI2 = dieseMatch.Austragungsort.split("/");

                            var ortmitkickertisch = ortURI+'/'+ortURI2[3]+'/'+ortURI2[4];

                            if(dieseMatch.Austragungsort == ortURI || dieseMatch.Austragungsort == ortmitkickertisch) {

                                dieseMatch.Austragungsort = null;

                                client.set('Match '+dieseMatch.id,JSON.stringify(dieseMatch));

                                //Entferne EIntrag aus der Datenbank 
                                client.del('Austragungsort ' + austragungsortId);

                                //Alles ok , sende 200 
                                res.status(200);
                                //Antwort beenden
                                res.end();
                            }
                        }
                        else {
                            client.del('Austragungsort ' + austragungsortId);

                            //Alles ok , sende 200 
                            res.status(200);
                            //Antwort beenden
                            res.end(); 
                        }
                    });        
                });

            });
        }

        else {
            res.status(404);
            res.end();
        }

    });
});

module.exports = app;
