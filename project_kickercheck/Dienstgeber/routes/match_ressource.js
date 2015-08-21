var app = express.Router();

//Match Methoden
app.get('/:MatchId', function(req, res) {

    var matchId = req.params.MatchId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Match ' + matchId, function(err, IdExists) {

        //Das Match existiert nicht im System 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
        }

        //Das Match existiert 
        else{

            //Welchen Content Type kann der client verarbeiten? 
            var acceptedTypes = req.get('Accept');

            switch (acceptedTypes) {

                case "application/json":

                    client.hgetall('Match ' + matchId, function(err,matchDaten){
                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json').status(200).json(matchDaten).end();
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

    //Anlegen eines Matches, Anfrage muss den Content Type application/atom+xml haben 
    var contentType = req.get('Content-Type');

    //Content type ist nicht application/atom+xml , zeige im Accept Header gültige content types 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json").status(406).send("Content Type is not supported").end();  
    } 

    //Content Type OK 
    else {

        //Erhöhe MatchIds in der DB , atomare Aktion 
        client.incr('MatchId', function(err, id) {

            var match=req.body;
            //Pflege Daten aus Anfrage in die DB ein
            client.hmset('Match ' + id, {
                //Set von Benutzern required
                'Datum' : match.Datum,
                'Uhrzeit': match.Uhrzeit,
                'Regelwerk':match.Regelwerk,
                'Austragungsort': match.Austragungsort,
                'Status':match.Status
            });

            //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json').set("Location", "/Match/" + id).status(201).json(req.body).end();
        });
    }
});

app.put('/:MatchId',function(req, res) {

    //Anlegen eines Matches, Anfrage muss den Content Type application/json haben 
    var contentType = req.get('Content-Type');

    //Content type ist nicht application/atom+xml , zeige im Accept Header gültige content types 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json").status(406).send("Content Type is not supported").end();   
    } 

    //Content Type OK 
    else {

        //Erhöhe MatchIds in der DB , atomare Aktion 
        client.incr('MatchId', function(err, id) {

            var match=req.body;
            //Pflege Daten aus Anfrage in die DB ein, alle Daten eines Matches sind änderbar 
            client.hmset('Match ' + id, {
                //Set von Benutzern required
                'Datum' : match.Datum,
                'Uhrzeit': match.Uhrzeit,
                'Regelwerk':match.Regelwerk,
                'Austragungsort': match.Austragungsort,
                'Status':match.Status,
            });

            //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
            res.set("Content-Type", 'application/json').status(201).json(req.body).end();
        });
    }
});

app.delete('/:MatchId', function(req, res) {

    var matchId = req.params.MatchId;

    client.exists('Match ' + matchId, function(err, IdExists) {

        // Match unter der angegebenen ID existiert in der DB
        if(IdExists == 1) {

            //Lösche Eintrag aus der DB
            client.del('Match ' + matchId);

            //Alles ok , sende 200 
            res.status(204).send("Das hat funktioniert! Match gelöscht").end();
        }

        // Match existierte nicht 
        else {
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }
    });
});

module.exports = app;