var app = express.Router();

app.get('/',function(req,res){

    //Speichert die alle Benutzer
    var response=[];    

    //returned ein Array aller Keys die das Pattern Benutzer* matchen 
    client.keys('Match *', function (err, key) {
	    
	        if(key.length == 0) {
		    res.json(response);
		    return;
	    }

	  var sorted =  key.sort();
	  

	     client.mget(sorted, function (err, match) {
		     
		     
        //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
        match.forEach(function (val) {
	     
       response.push(JSON.parse(val));


        });
        
        
            res.status(200).set("Content-Type","application/json").json(response).end();
    });
});
});

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

                    client.mget('Match ' + matchId, function(err,matchdata){

                        var matchDaten = JSON.parse(matchdata);
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


            var matchObj={
                //Set von Benutzern required
                'id':id,
                'Datum' : match.Datum,
                'Uhrzeit': match.Uhrzeit,
                'Teilnehmer' : match.Teilnehmer,
                'Regelwerk':match.Regelwerk,
                'Austragungsort': match.Austragungsort,
                'Status':match.Status
            };

            console.log(matchObj);

            client.set('Match ' + id, JSON.stringify(matchObj));

            console.log(matchObj);

            //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json').set("Location", "/Match/" + id).status(201).json(matchObj).end();
        });
    }
});

app.put('/:MatchId',function(req, res) {


    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {

        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(406).send("Content Type is not supported").end();
    } 

    else {

        var matchId = req.params.MatchId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Match ' + matchId, function(err, IdExists) {

            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).end();
            } 

            else {

                //Lese aktuellen Zustand des Turniers aus DB
                client.mget('Match '+matchId,function(err,matchdata){

                    var Matchdaten = JSON.parse(matchdata);

                    //Aktualisiere änderbare Daten 
                    Matchdaten.Datum = req.body.Datum;
                    Matchdaten.Uhrzeit = req.body.Uhrzeit;
                    Matchdaten.Austragungsort = req.body.Austragungsort;
                    Matchdaten.Regelwerk = req.body.Regelwerk;
                    Matchdaten.Status = req.body.Status;

                    //Schreibe Turnierdaten zurück 
                    client.set('Match ' + matchId,JSON.stringify(Matchdaten));

                    console.log(Matchdaten);
                    //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                    res.set("Content-Type", 'application/json').status(201).json(Matchdaten).end();
                });       
            }
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