var app = express.Router();

// TURNIER // 
// TURNIER //

//Liste aller Turniere
app.get('/',function(req,res){

    //Speichert die alle Benutzer
    var response=[];    

    //returned ein Array aller Keys die das Pattern Benutzer* matchen 
    client.keys('Turnier *', function (err, key) {

        if(key.length == 0) {
            res.json(response);
            return;
        }

        client.mget(key, function (err, turnier) {

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

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        } 
        else {
            var acceptedTypes = req.get('Accept');
            switch (acceptedTypes) {

                case "application/json":
                    client.mget('Turnier ' + turnierId, function(err,turnierDaten){
                        //Setze Contenttype der Antwort auf application/json

                        var send = JSON.parse(turnierDaten);

                        //console.log(util.inspect(turnierDaten, false, null));

                        res.set("Content-Type", 'application/json').status(200).json(send).end();
                    });
                    break;

                default:
                    //We cannot send a representation that is accepted by the client 
                    res.status(406).send("Content Type wird nicht unterstuetzt");
                    res.end();
                    break;
            }
        }
    });
});

//Legt ein neues Turnier unter Angabe der Rahmeninformationen an 
app.post('/',function(req, res) {

    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage xml ist 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json");
        res.status(406).send("Content Type is not supported");
        res.end();
    } 

    else {

        generiereLigaTurnierSpielplan(req.body.Teilnehmeranzahl,req.body.Teamgroesse,function(spielplan,erfolg){

            if(erfolg){
                client.incr('TurnierId', function(err, id) {

                    var turnierLink ='http://kickercheck.de/Turnier/'+id+'/Matches';
                    var turnierTeilnehmerHinzufügenLink = '/Turnier/'+id+'/Teilnehmer';
                    var turnierMatchHinzufügenLink = '/Turnier/'+id+'/Match';

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

                    //Lege Liste der Teilnehmer für die Subressource an 
                    //client.LPUSH('Turnier '+id+' Teilnehmer',id);

                    //Lege Liste der Matches für die Subressource an 
                    //client.LPUSH('Turnier '+id+' Matches',id);

                    res.set("Content-Type", 'application/json').set("Location", "/Turnier/" + id).status(201).json(turnierObj).end();
                });
            }
            else{
                res.status(409).send("Dienstgeber konnte keinen TUrnierplan erstellen").end();
            }   
        });
    } 
});

//Ändert die Informationen eines Turnieres
app.put('/:TurnierId',function(req, res) {

    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {

        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(406).send("Content Type is not supported").end();
    } 

    else {

        var turnierId = req.params.TurnierId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Turnier ' + turnierId, function(err, IdExists) {

            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).end();
            } 

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

                    //Setze Contenttype der Antwort auf application/json..
                    res.set("Content-Type", 'application/json').status(200).json(Turnierdaten).end();
                });
            }
        });
    }
});

//Löscht das Turnier mit <TurnierId> , entfernt alle assoziierten Matches sowie 
//die Teinehmerliste
app.delete('/:TurnierId', function(req, res) {

    var turnierId = req.params.TurnierId;

    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
        }

        else {
            client.del('Turnier '+ turnierId);
            client.del('einTurnier ' + turnierId + ' Teilnehmer');


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
            res.status(204).send("Das hat funktioniert! Turnier gelöscht.").end();
        }
    });
});

//Liefert eine Liste aller mit dem Turnier assoziierten Matches 
app.get('/:TurnierId/Match',function(req,res){

    var turnierId=req.params.TurnierId;

    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
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
});

//Fügt einem Turnier ein Match hinzu , benötigt eine Matchrepräsentation im Body 
//Legt ein neues Match an , wiederholte Anfragen führen zu immer neuen Matches 
//und neuen Links im Turnierbody, daher ist diese Operation nicht idempotent. POST ist daher 
//das geeignete Verb
app.post('/:TurnierId/Match',function(req,res){

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

                    //Schreibe Turnierdaten zurück 
                    //client.set('Turnier ' + turnierId,JSON.stringify(turnier));

                    //Sende Statuscode 201-Created , da hier ein neues Match angelegt wurde 
                    res.status(201).set('Location',"Turnier/"+turnierId+/Match/+id).json(matchObj).end();
                });
            });
        }

        else{
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
        }
    });
});

//Ruft die Teilnehmerliste eines Turnieres ab , liefert leeres Array wenn 
//Kein Teilnemer vorhanden ist 
app.get('/:TurnierId/Teilnehmer',function(req,res){

    var listenKey="einTurnier "+req.params.TurnierId+" Teilnehmer";

    //Hole alle Assoziierten Teilnehmer
    client.lrange(listenKey, 0, -1, function(err,items) {

        //Antworte mit der aktualisierten Teilnehmerliste
        res.set("Content-Type", 'application/json').status(200).json(items).end();
    }); 
});


//Fügt einem bestehenden Turnier einen Teilnehmer hinzu 
//Ein Teilnehmer kann nicht zweimal einem Turnier 
//Hinzugefügt werden, daher ist diese Opration idemtpotent 
//Und führt bei Wiederholung immer zum gleichen Ergebnis => der Teilnehmer ist hinzugefügt
app.put('/:TurnierId/Teilnehmer',function(req,res){

    //Extrahiere TurnierId
    var turnierId=req.params.TurnierId

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
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
                    res.status(409).send("Teilnehmerzahl bereits erreicht").end();
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

    /*
    for(var k=0;k<spielPlan.length;k++){
        var paarung=spielPlan[k];
        console.log("Runde"+paarung.Runde+"  "+paarung.Team1 + " vs   " + paarung.Team2);
    }*/

    callback(spielPlan,erfolg);
}

module.exports = app;