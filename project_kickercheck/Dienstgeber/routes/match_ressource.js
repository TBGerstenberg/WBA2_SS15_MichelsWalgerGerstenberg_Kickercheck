var app = express.Router();

//Liefert eine Collection aller Matches 
app.get('/',function(req,res){

    //Frage Accepted Types vom Client ab 
    var acceptedTypes = req.get('Accept');

    switch (acceptedTypes) {

        //Client kann application/json verarbeiten 
        case "application/json":

            //Speichert die Matchollection
            var response=[];    

            //returned ein Array aller Keys die das Pattern Match* matchen 
            client.keys('Match *', function (err, key) {

                //Abruf erfolgreich , zeige mit leerem Array im Body sowie Statuscode 200-OK das die Operation funktioniert hat 
                if(key.length == 0) {
                    res.status(200).json(response);
                    return;
                }

                var sorted =  key.sort();

                //Rufe daten aller Matches ab 
                client.mget(sorted, function (err, match) {

                    //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
                    match.forEach(function (val) {

                        response.push(JSON.parse(val));
                    });

                    res.status(200).set("Content-Type","application/json").json(response).end();
                });
            });
            break;

        //Der Client kann keine vom Service angebotenen Content types verarbeiten 
        default:
            res.status(406).end();
            break;
    }
});

//Liefert eine Repräsentation eines Matches 
app.get('/:MatchId', function(req, res) {

    var matchId = req.params.MatchId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Match ' + matchId, function(err, IdExists) {

        //Das Match existiert nicht im System 
        if (!IdExists) {
            res.status(404).end();
        }

        //Das Match existiert 
        else{

            //Welchen Content Type kann der client verarbeiten? 
            var acceptedTypes = req.get('Accept');

            switch (acceptedTypes) {

                    //Client empfängt JSON 
                case "application/json":

                    //Rufe Matchdaten aus DB ab
                    client.mget('Match ' + matchId, function(err,matchdata){

                        var matchDaten = JSON.parse(matchdata);
                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json').status(200).json(matchDaten).end();
                    });
                    break;

                default:
                    //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                    res.status(406).end();
                    break;
            }
        }  
    });
});

//Fügt der MatchCollection ein neues Element hinzu 
app.post('/',function(req, res) {

    //Anlegen eines Matches, Anfrage muss den Content Type application/atom+xml haben 
    var contentType = req.get('Content-Type');

    //Content type ist nicht application/json , zeige im Accept Header gültige content types 
    if (contentType != "application/json") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).end(); 
    } 

    //Content Type OK 
    else {

        //Erhöhe MatchIds in der DB , atomare Aktion 
        client.incr('MatchId', function(err, id) {

            var match=req.body;

            //Daten des matches
            var matchObj={
                //Set von Benutzern required
                'id':id,
                'Datum' : match.Datum,
                'Uhrzeit': match.Uhrzeit,
                'Teilnehmer' : match.Teilnehmer,
                'Regelwerk':match.Regelwerk,
                'Austragungsort': match.Austragungsort,
                'Status':match.Status,
                'Turnier':null
            };

            //Füge JSON-String des Matches in DB ein
            client.set('Match ' + id, JSON.stringify(matchObj));

            //Setze Contenttype der Antwort auf application/json , Location der neuen Ressource in den Header sowie 201-Created mit einer Respräsentation des
            //neuen Matches im Body
            res.set("Content-Type", 'application/json').set("Location", "/Match/" + id).status(201).json(matchObj).end();
        });
    }
});

//Ändert die Informationen eines Matches
app.put('/:MatchId',function(req, res) {

    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {

        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).end(); 
    } 

    else {

        var matchId = req.params.MatchId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Match ' + matchId, function(err, IdExists) {
        
            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).end();
            } 

            //Match existiert 
            else {

                //Lese aktuellen Zustand des Turniers aus DB
                client.mget('Match '+matchId,function(err,matchdata){
                    
                    var Matchdaten = JSON.parse(matchdata);
                    
                    //Sichere Read Only Felder gegen Änderung ab, indem bei einer Änderung ein "Forbidden" Status geantwortet wird 
                    if(Matchdaten.id != req.body.id){
                        res.status(403).end();
                    }
                    
                    else{
                        //Aktualisiere änderbare Daten 
                        Matchdaten.Datum = req.body.Datum;
                        Matchdaten.Uhrzeit = req.body.Uhrzeit;
                        Matchdaten.Austragungsort = req.body.Austragungsort;
                        Matchdaten.Regelwerk = req.body.Regelwerk;
                        Matchdaten.Status = req.body.Status;
                        Matchdaten.Teilnehmer=req.body.Teilnehmer;
                        Matchdaten.Turnier= req.body.Turnier;

                        //Schreibe Turnierdaten zurück 
                        client.set('Match ' + matchId,JSON.stringify(Matchdaten));

                        //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                        res.set("Content-Type", 'application/json').status(200).json(Matchdaten).end();
                    }
                });       
            }
        });
    }
});

//Löscht eine Match 
app.delete('/:MatchId', function(req, res) {

    var matchId = req.params.MatchId;

    client.exists('Match ' + matchId, function(err, IdExists) {

        // Match unter der angegebenen ID existiert in der DB
        if(IdExists == 1) {

            //Lösche Eintrag aus der DB
            client.del('Match ' + matchId);

            //Alles ok , sende 200 
            res.status(204).end();
        }

        // Match existierte nicht 
        else {
            res.status(404).end();
        }
    });
});

module.exports = app;