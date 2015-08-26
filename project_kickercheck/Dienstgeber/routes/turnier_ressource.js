var app = express.Router();

// TURNIER // 
// TURNIER //

app.get('/',function(req,res){

    //Speichert die alle Benutzer
    var response=[];    

    //returned ein Array aller Keys die das Pattern Benutzer* matchen 
    client.keys('Turnier *', function (err, key) {

        client.mget(key, function (err, turnier) {

            //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
            turnier.forEach(function (val) {

                response.push(JSON.parse(val));
            });

            res.status(200).set("Content-Type","application/json").json(response).end();
        });
    });
});


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

                        console.log(util.inspect(turnierDaten, false, null));

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

        generiereLigaTurnierSpielplan(req.body.Teilnehmeranzahl,req.body.Teamgroesse,function(spielplan){

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
                    'Teilnehmer': [],
                    'MatchHinzufuegen':turnierMatchHinzufügenLink,
                    'Matches':[],
                    'Austragungszeitraum':null,
                    'Status':'angelegt',
                    'Spielplan': spielplan
                }

                client.set('Turnier ' + id,JSON.stringify(turnierObj));
                res.set("Content-Type", 'application/json').set("Location", "/Turnier/" + id).status(201).json(turnierObj).end();

            });
        });

    } 
});

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

app.delete('/:TurnierId', function(req, res) {

    var turnierId = req.params.TurnierId;

    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
        }

        else {
            client.del('Turnier '+ turnierId);

            //Zeige mit Status 204-No Content Erfolg des Löschvorgangs
            res.status(204).send("Das hat funktioniert! Turnier gelöscht.").end();
        }
    });
});


//Fügt einem Turnier ein Match hinzu , benötigt eine Matchrepräsentation im Body 
app.post('/:TurnierId/Match',function(req,res){

    console.log("Turnier_Match hinzufügen gecalled");

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
                        'Datum' : match.Datum,
                        'Uhrzeit': match.Uhrzeit,
                        'Teilnehmer' : match.Teilnehmer,
                        'Regelwerk':match.Regelwerk,
                        'Austragungsort': match.Austragungsort,
                        'Status':match.Status
                    };

                    //Pflege Match in DB ein 
                    client.set('Match ' + id, JSON.stringify(matchObj));

                    //Füge Link zu diesem Match in die Repräsentation des Turniers ein 
                    turnier.Matches.push("/Match/" + id);

                    //Schreibe Turnierdaten zurück 
                    client.set('Turnier ' + turnierId,JSON.stringify(turnier));

                    //Sende Statuscode 201-Created , da hier ein neues Match angelegt wurde 
                    res.json(turnier).end();
                });
            });
        }

        else{
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
        }
    });
});


//Fügt einem bestehenden Turnier einen Teilnehmer hinzu 
app.put('/:TurnierId/Teilnehmer',function(req,res){

    var turnierId=req.params.TurnierId

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
        } 

        //Lese aktuellen Zustand des Turniers aus DB
        client.mget('Turnier '+turnierId,function(err,turnierdata){

            var Turnierdaten = JSON.parse(turnierdata);

            //Hinzufügen eines Teilnehmers darf nur funktionierten solang die Teilnehmeranzahl nicht überschritten wird 
            if(Turnierdaten.Teilnehmer.length < Turnierdaten.Teilnehmeranzahl){
                //console.log(req.body.teilnehmer);
                Turnierdaten.Teilnehmer.push(req.body.Teilnehmer);

                //Schreibe Turnierdaten zurück 
                client.set('Turnier ' + turnierId,JSON.stringify(Turnierdaten));

                //Setze Contenttype der Antwort auf application/json..
                res.set("Content-Type", 'application/json').status(200).json(Turnierdaten).end();
            }

            //Hinzufügen war unzulässig , sende einen 409-Conflict Status um anzuzeigen, dass keine Teilnehmer mehr hinzugefügt werden können
            else{
                res.status(409).end();
            }
        });
    });
});

//Erstellt den Turnierplan für ein Turnier vom Typ Liga (jeder gegen jden , auf Spieltage aufgeteilt)
//WORK IN PROGRESS
function generiereLigaTurnierSpielplan(teilnehmerzahl,teamGroesse,callback){


    //Zu wenig Teilnehmer oder unzulässige Teamgröße
    if(teilnehmerzahl < 0 || teamGroesse %2 != 0){
        return -1;  
    }

    //Legt fest wieviele Teams es geben wird 
    var anzahlTeams=teilnehmerzahl / teamGroesse;

    //Es gibt keine Spieler oder der Turnierplan geht nicht auf  
    if(anzahlTeams < 0 || anzahlTeams == 0){

        return -1;
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
    callback(spielPlan);
}

module.exports = app;