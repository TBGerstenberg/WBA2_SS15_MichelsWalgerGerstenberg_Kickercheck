var app = express.Router();

// TURNIER // 
// TURNIER //

//Liefert eine Collection aller Turniere
app.get('/',function(req,res){

    //Speichert die alle Benutzer
    var response=[];    

    //returned ein Array aller Keys die das Pattern Turnier* matchen 
    client.keys('Turnier *', function (err, key) {

        //Es gibt noch keine Turniere, dennoch war der Abruf erfolgreich . Sende leere Collection im Body und Status 200-OK
        if(key.length == 0) {
            res.status(200).json(response);
            return;
        }

        var sorted =  key.sort();

        //Lese Turnieredaten aus DB
        client.mget(sorted, function (err, turnier) {

            //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
            turnier.forEach(function (val) {
                response.push(JSON.parse(val));
            });

            res.status(200).set("Content-Type","application/json").json(response).end();
        });
    });
});

//Liefert die Repräsentation eines Turnieres zurück
app.get('/:TurnierId', function(req, res) {

    var turnierId = req.params.TurnierId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert , die Ressource existiert nicht  
        if (!IdExists) {
            res.status(404).end();
        } 

        //das Turnier existiert 
        else {

            //Frage Accepted Types vom Client ab 
            var acceptedTypes = req.get('Accept');

            switch (acceptedTypes) {

                    //Client kann application/json verarbeiten 
                case "application/json":

                    //Lese Turnierdaten aus DB
                    client.mget('Turnier ' + turnierId, function(err,turnierDaten){

                        //Parse Redis Antwort 
                        var send = JSON.parse(turnierDaten);

                        //Setze content Type der Antwort, sende 200-OK und eine Repräsentation der abgerufenen Ressource im Body
                        res.set("Content-Type", 'application/json').status(200).json(send).end();
                    });
                    break;

                    //Der Client kann keine vom Service angebotenen Content types verarbeiten 
                default:
                    res.status(406).end();
                    break;
            }
        }
    });
});

//Legt ein neues Turnier unter Angabe der Rahmeninformationen an 
app.post('/',function(req, res) {

    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage application/json ist 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json").status(415).end();
    } 

    //Content type OK 
    else {

        //Generiere den Spielplan des turnieres 
        generiereLigaTurnierSpielplan(req.body.Teilnehmeranzahl,req.body.Teamgroesse,function(spielplan,erfolg){

            //Kein Fehler beim generieren des Spielplans 
            if(erfolg){

                //Erhöhre TurnierIds in Redis ,atomare Aktion
                client.incr('TurnierId', function(err, id) {

                    //Links die dem Client weitere Interaktionsschritte aufzeigen 
                    var turnierTeilnehmerHinzufügenLink = '/Turnier/'+id+'/Teilnehmer';
                    var turnierMatchHinzufügenLink = '/Turnier/'+id+'/Match';

                    //Repräsentation des Turnieres
                    var turnierObj={
                        'id' : id,
                        'Teilnehmeranzahl': req.body.Teilnehmeranzahl,
                        'Teamgroesse' : req.body.Teamgroesse,
                        'Typ':req.body.Typ,
                        'Austragungsort':req.body.Austragungsort,
                        'TeilnehmerHinzufuegen':turnierTeilnehmerHinzufügenLink,
                        'MatchHinzufuegen':turnierMatchHinzufügenLink,
                        'Austragungszeitraum':null,
                        'Status':'angelegt',
                        'Spielplan': spielplan
                    }

                    //Lege Turnier in der DB an 
                    client.set('Turnier ' + id,JSON.stringify(turnierObj));

                    //Erfolg - Location der neuen Ressource im Header, Repräsentation im Body sowie 201-Created 
                    res.set("Content-Type", 'application/json').set("Location", "/Turnier/" + id).status(201).json(turnierObj).end();
                });
            }

            //Fehler beim Anlegen des Turnierplans 
            else{
                res.status(500).end();
            }   
        });
    } 
});

//Ändert die Informationen eines Turnieres
app.put('/:TurnierId',function(req, res) {

    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 415 - unsupported Media Typeund zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {

        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).end();
    } 

    //Content type OK 
    else {

        var turnierId = req.params.TurnierId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Turnier ' + turnierId, function(err, IdExists) {

            //client.exists hat false geliefert
            //das Turnier das geändert werden soll existiert nicht 
            if (!IdExists) {
                res.status(404).end();
            } 

            //Zu änderndes Turnier existiert 
            else {

                //Lese aktuellen Zustand des Turniers aus DB
                client.mget('Turnier '+turnierId,function(err,turnierdata){

                    var Turnierdaten = JSON.parse(turnierdata);

                    //Aktualisiere änderbare Daten 
                    Turnierdaten.Teilnehmeranzahl=req.body.Teilnehmeranzahl;
                    Turnierdaten.Austragungsort=req.body.Austragungsort;
                    Turnierdaten.Teamgroesse=req.body.Teamgroesse;
                    Turnierdaten.Austragungszeitraum = req.body.Austragungszeitraum;
                    Turnierdaten.Status=req.body.Status;

                    //Schreibe Turnierdaten zurück 
                    client.set('Turnier ' + turnierId,JSON.stringify(Turnierdaten));

                    //Sende geänderte Repräsentation des Turneires im Body, sowie 200-OK für erfolgreiche Änderung 
                    res.set("Content-Type", 'application/json').status(200).json(Turnierdaten).end();
                });
            }
        });
    }
});

//Löscht das Turnier mit <TurnierId> 
//entfernt alle assoziierten Matches sowie 
//die Teinehmerliste (Subressourcen des Turnieres)
app.delete('/:TurnierId', function(req, res) {

    var turnierId = req.params.TurnierId;

    //Existiert das angebene Turnier?
    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).end();
        }

        //Turnier existiert 
        else {
            //Lösche Turnierdaten 
            client.del('Turnier '+ turnierId);

            //Lösche Teilnehmerliste 
            client.del('einTurnier ' + turnierId + ' Teilnehmer');

            //Lösche assoziierte Matches 
            var listenKey="einTurnier "+turnierId+"Matches"; 

            //Hole alle Assoziierten Matches 
            client.lrange(listenKey, 0, -1, function(err,items) {

                //Wenn es Matches gibt 
                if(items.length!=0){
                    //Lösche alle
                    items.foreach(function(entry){
                        //Lösche Eintrag aus der DB
                        client.del('Match ' + item);
                    });
                }
            });

            //Lösche MatchListe
            client.del('einTurnier ' + turnierId + ' Matches');

            //Zeige mit Status 204-No Content Erfolg des Löschvorgangs
            res.status(204).end();
        }
    });
});

//Liefert eine Collection aller mit dem Turnier assoziierten Matches 
app.get('/:TurnierId/Match',function(req,res){


    //Frage Accepted Types vom Client ab 
    var acceptedTypes = req.get('Accept');

    switch (acceptedTypes) {

            //Client kann application/json verarbeiten 
        case "application/json":

            var turnierId=req.params.TurnierId;

            client.exists('Turnier ' + turnierId, function(err, IdExists) {

                //client.exists hat false geliefert 
                if (!IdExists) {
                    res.status(404).end();
                }

                else{

                    var matches=[];
                    var listenKey="einTurnier "+turnierId+" Matches";

                    //Hole alle Assoziierten Matches 
                    client.lrange(listenKey, 0, -1, function(err,items) {

                        items.forEach(function(entry){
                            matches.push("Match/"+entry);
                        });

                        //Liefere die Matchliste
                        res.status(200).json(matches).end();
                    });  
                }
            });
            break;

            //Der Client kann keine vom Service angebotenen Content types verarbeiten 
        default:
            res.status(406).end();
            break;
    }
});

//Fügt einem Turnier ein Match hinzu , benötigt eine Matchrepräsentation im Body 
//Legt ein neues Match an , wiederholte Anfragen führen zu immer neuen Matches 
//und neuen Links im Turnierbody, daher ist diese Operation nicht idempotent. POST ist daher 
//das geeignete Verb
app.post('/:TurnierId/Match',function(req,res){

    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 415 - unsupported Media Typeund zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).end();
    } 

    console.log("Turnier_Match hinzufügen auf Dienstgeber gecalled");

    var turnierId=req.params.TurnierId;

    //Existiert das Angefragte Turnier? 
    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //Turnier existiert 
        if(IdExists){

            //Lese betroffenes Turnier aus DB 
            client.mget('Turnier '+turnierId,function(err,turnierdata){

                var turnier = JSON.parse(turnierdata);

                //Lege das Match an , äquivalent zu Post auf Matchressource 
                client.incr('MatchId', function(err, id) {

                    var match=req.body;

                    var matchObj={
                        'id': id,
                        'Datum' : match.Datum,
                        'Uhrzeit': match.Uhrzeit,
                        'Teilnehmer' : match.Teilnehmer,
                        'Regelwerk':match.Regelwerk,
                        'Austragungsort': match.Austragungsort,
                        'Status':match.Status
                    };

                    //Pflege Match in DB ein 
                    client.set('Match ' + id, JSON.stringify(matchObj));

                    //Pushe das angelegte Match in die Liste der Matches
                    client.LPUSH("einTurnier "+turnierId+" Matches",id)

                    //Sende Statuscode 201-Created , da hier ein neues Match angelegt wurde 
                    res.status(201).set('Location',"Turnier/"+turnierId+/Match/+id).json(matchObj).end();
                });
            });
        }

        else{
            res.status(404).end();
        }
    });
});

//Ruft eine Collection aller Teilnehmer  eines Turnieres ab , liefert leeres Array wenn 
//Kein Teilnemer vorhanden ist 
app.get('/:TurnierId/Teilnehmer',function(req,res){

    //Frage Accepted Types vom Client ab 
    var acceptedTypes = req.get('Accept');

    switch (acceptedTypes) {

            //Client kann application/json verarbeiten 
        case "application/json":
            var listenKey="einTurnier "+req.params.TurnierId+" Teilnehmer";

            //Hole alle Assoziierten Teilnehmer
            client.lrange(listenKey, 0, -1, function(err,items) {

                //Antworte mit der Teilnehmerliste
                res.set("Content-Type", 'application/json').status(200).json(items).end();
            }); 
            break;

            //Der Client kann keine vom Service angebotenen Content types verarbeiten 
        default:
            res.status(406).end();
            break;
    }
});


//Fügt einem bestehenden Turnier einen Teilnehmer hinzu 
//Ein Teilnehmer kann nicht zweimal einem Turnier 
//Hinzugefügt werden, daher ist diese Opration idemtpotent 
//Und führt bei Wiederholung immer zum gleichen Ergebnis => der Teilnehmer ist hinzugefügt
app.put('/:TurnierId/Teilnehmer',function(req,res){

    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 415 - unsupported Media Typeund zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {

        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).end();
    } 

    //Extrahiere TurnierId
    var turnierId=req.params.TurnierId

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).end();
            return;
        } 

        //Lese aktuellen Zustand des Turniers aus DB
        client.mget('Turnier '+turnierId,function(err,turnierdata){

            var Turnierdaten = JSON.parse(turnierdata);

            var listenKey="einTurnier "+turnierId+" Teilnehmer";

            var teilnehmer=[];

            //Hole alle Assoziierten Teilnehmer
            client.lrange(listenKey, 0, -1, function(err,items) {

                //Hinzufügen eines Teilnehmers darf nur funktionierten solang die Teilnehmeranzahl nicht überschritten wird 
                //Teilnehmerzahl noch nicht erreicht
                if(items.length < Turnierdaten.Teilnehmeranzahl){

                    //Flag um anzuzeigen ob der Benutzer bereits in der Liste ist
                    var bereitsVorhanden=false;

                    //Durchsuche Teilnehmerliste nach diesem Teilnehmer
                    for(var i=0;i<items.length;i++){
                        if(items[i] == req.body.Teilnehmer){
                            //Benutzer ist bereits eingetragen 
                            bereitsVorhanden=true;
                        } 
                    }

                    //Wenn er vorhanden war, gebe einfach den aktuellen Stand der Liste zurück
                    if(bereitsVorhanden){
                        res.set("Content-Type", 'application/json').status(200).json(items).end();
                    }

                    //Benutzer ist nicht vorhanden 
                    else{
                        //Pushe Teilnehmer in die Liste 
                        client.LPUSH("einTurnier "+turnierId+" Teilnehmer",req.body.Teilnehmer);

                        //Hole alle Assoziierten Teilnehmer
                        client.lrange(listenKey, 0, -1, function(err,items) {
                            //Antworte mit der aktualisierten Teilnehmerliste
                            res.set("Content-Type", 'application/json').status(200).json(items).end();
                        });
                    }
                }

                //Teilnehmerzahl erreicht
                else{
                    res.status(409).end();
                }
            }); 
        });
    });
});


//Erstellt den Turnierplan für ein Turnier vom Typ Liga (jeder gegen jden , auf Spieltage aufgeteilt)
//WORK IN PROGRESS
function generiereLigaTurnierSpielplan(teilnehmerzahl,teamGroesse,callback){

    var erfolg=true;

    //Legt fest wieviele Teams es geben wird 
    var anzahlTeams=teilnehmerzahl / teamGroesse;

    //Es gibt keine Spieler oder der Turnierplan geht nicht auf  
    if(anzahlTeams < 0 || anzahlTeams == 0){
        erfolg=false;
    }

    //Quellen für den Spielplanalgorithmus: 
    //http://www-i1.informatik.rwth-aachen.de/~algorithmus/algo36.php
    //http://www.inf-schule.de/algorithmen/algorithmen/bedeutung/fallstudie_turnierplanung/station_algorithmen

    //Enthält später den fertigen Spielplan 
    var spielPlan= [];

    var i=0;
    var n = anzahlTeams;

    while(i < (n-1)){

        spielPlan.push({
            "Team1":n-1,
            "Team2":i,
            "Runde":i+1
        });

        var j=1;

        while(j<n/2){
            var a=i-j;
            var b=i+j;

            if(a<0){
                a=a+(n-1);
            }

            if(b>n-2){
                b=b-(n-1);
            }

            spielPlan.push({
                "Team1":a,
                "Team2":b,
                "Runde":i+1
            });
            j++;
        }
        i++;
    }

    callback(spielPlan,erfolg);
}

module.exports = app;