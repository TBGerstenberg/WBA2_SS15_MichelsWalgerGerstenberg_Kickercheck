var app = express.Router();


//Der Dienstnutzer nutzt die Capability Turniere und Matches zu organisieren ,wie sie der Dienstgeber anbietet. Im Dienstgeber ist in jedem Match ein Feld "Regelwerk" vorgesehen  ,dass die 
//Spezifika eines Wettkampfes beschreibt. So ist erreicht ,dass der Dienst für unterschiedlichste Wettkampfarten nutzbar ist.

var Regelwerk=
    {
        "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
        "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm",
        "Spielstand":{
            "SpielstandT1":null,
            "SpielstandT2":null
        }
    }


app.get('/addTurnier', function(req, res) {

    var options = {
        host: "localhost",
        port: 3000,
        path: "/Austragungsort",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }

    var x = http.request(options, function(externalrep){


        externalrep.on("data", function(chunks){

            var austragungsorte = JSON.parse(chunks);

            res.render('pages/addTurnier',{austragungsorte:austragungsorte});

            res.end();

        });

    });
    x.end();

});

app.get('/alleTurniere', function(req, res) {

    var options = {
        host: "localhost",
        port: 3000,
        path: "/Turnier",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }
    var externalRequest = http.request(options, function(externalResponse){

        externalResponse.on("data", function(chunk){

            var turniere = JSON.parse(chunk);
            res.render('pages/alleturniere',{turniere:turniere});
            res.end();
        });

    });

    externalRequest.end();
});


app.post('/', function(req, res) {

    // Speichert req.body
    var TurnierAnfrage = req.body;

    // HTTP Header für Anfragen vorbereiten 
    var headers = {
        'Content-Type': 'application/json',
        'Accepts':'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier',
        method: 'POST',
        headers: headers
    };

    //Poste Turnier 
    var externalRequest = http.request(options, function(externalResponse) {

        //Post hat nicht funktioniert, sende Statuscode 400
        if(externalResponse.statusCode == 400){
            res.status(400).end();
        };

        //Sobald Post Ergebnis zurückkommt 
        externalResponse.on('data', function (chunk) {
            //Parse Antwort
            var turnier=JSON.parse(chunk);

            //Schicke fertiges Turnier zurück
            //console.log(util.inspect(turnier, false, null));
            res.setHeader('Location',externalResponse.headers.location);
            res.status(201).json(turnier).end();
        });
    });

    externalRequest.write(JSON.stringify(TurnierAnfrage));
    externalRequest.end();
});


//Generiert den Konkreten Spielplan mit Turnier.Teilnehmerzahl / Turnier.Teamgröße Matches 
//Durch wiederholte Anfragen auf Turnier/Id/Match beim Dienstgeber 
//Die konkrete ausgestaltung eines Matches (Anzahl Teams, Teinehemer=>Teams Mapping usw..) übernimmt
//Dabei der Dienstnutzer.
//Diese Operation verändert den Server-State und ist daher ein Put , kein Get 
//Per Definition ist Put Idempotent , liefert also bei wiederholter Ausführung immer das selbse 
//Ergebnis, so ist erreicht, dass der Spielplan beliebig oft geupdated werden kann 
app.put('/:TurnierId/Spielplan',function(req,res){

    console.log("Spielplan für Turnier" + req.params.TurnierId + "angefordert");

    var options1 = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier/'+req.params.TurnierId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };

    //Antwort für die Abfrage des Turniers 
    var jsonString;

    var externalRequest = http.request(options1, function(externalResponse){

        //Das angefragte Turnier war nicht vorhanden
        if(externalResponse.statusCode==404){
            res.status(404).end();
        }

        externalResponse.on("data", function(chunk){
            jsonString = JSON.parse(chunk);
            //console.log("Data angekommen , JSON String:" + chunk); 
        });

        //Wenn der Turnierrequest beendet ist
        externalResponse.on("end",function(){

            //Parse die Antwort
            var turnier = jsonString;

            //Checke ob schon ein Spielplan existiert 
            if(turnier.Matches.length != 0){
                res.status(200).json(turnier).end();
                return;
            }

            console.log("Stelle Turnierrequest für den Spielplan von Turnier" + req.params.TurnierId);

            //Checke ob ein Spielplan generiert werden kann oder noch Teilnehmer fehlen
            if(turnier.Teilnehmer.length != turnier.Teilnehmeranzahl){
                console.log("Zu wenig Teilnehmer,der Turnierplan kann nicht gefüllt werden");
                console.log("Die Länge des Teilnehmerarrays" + turnier.Teilnehmer.length + " Teilnehmerzahl" + turnier.Teilnehmeranzahl);
                res.status(409).send("Zu wenig Teilnehmer ").end();
                return;
            }

            //Turnier ist erfolgreich abgerufen worden 
            //Wenn Austragungsort bekannt ist , 
            //Poste AnzahlTeilnehmer / Teamgröße Matches
            //Der Austragungsort (und damit die Anzahl an verfügbaren Kickertischen) 
            //limitiert wieviele Matches pro Zeitpunkt x abgehalten werden können 
            console.log("Der Austragungsort des Turnieres :" + turnier.Austragungsort); 

            if(turnier.Austragungsort){

                // HTTP Header für Match Posts vorbereiten 
                var matchHeader = {
                    'Accept':'application/json',
                    'Content-Type':'application/json'
                };

                //Benötigt um Anfragen zu loopen
                var myAgent = new http.Agent({maxSockets: 1});

                //Extrahiere Link um Matches dem Turnier hinzuzufügen und Poste darauf 
                var optionsMatches = {
                    host: 'localhost',
                    port: 3000,
                    agent: myAgent,
                    path: turnier.MatchHinzufuegen,
                    method: 'POST',
                    headers: matchHeader
                };

                //Bilde die Teams
                //Beispiel: //https://jsfiddle.net/fwrun1or/
                var teams=[];
                var anzahlTeams=turnier.Teilnehmeranzahl / turnier.Teamgroesse;


                //Beim Kicker sind nur die Teamgrößen 1 und 2 zulässig
                //Teilnehmer sind nummeriert durch ihren index im Teilnehmerarray 
                //Dieser Index wird nun genutzt um Teilnehmer auf Teamnummern aus dem Speilplan abzubilden
                switch(turnier.Teamgroesse){
                    case 1:
                        var i=0;
                        for(var j=0;j<anzahlTeams;j++){

                            //Name des jeweiligen Teams
                            var teamName="Team"+j.toString();

                            //Objekt das unter dem Key <teamName> die Tielnehmer enthält
                            var teamObj={};

                            //Teilnehmer hinzufügen 
                            teamObj[teamName]={
                                "Teilnehmer1":turnier.Teilnehmer[i]
                            }

                            //Team dem Teamarray hinzufügen 
                            teams.push(teamObj);
                            i++;
                        }
                        break;

                    case 2:

                        var i=0;
                        for(var j=0;j<anzahlTeams;j++){

                            //Name des jeweiligen Teams
                            var teamName="Team"+j.toString();

                            //Objekt das unter dem Key <teamName> die Tielnehmer enthält
                            var teamObj={}

                            //Teilnehmer hinzufügen 
                            teamObj[teamName]={
                                "Teilnehmer1":turnier.Teilnehmer[i],
                                "Teilnehmer2":turnier.Teilnehmer[i+1]
                            }

                            //Team dem Teamarray hinzufügen 
                            teams.push(teamObj);
                            i+=2;
                        }
                        break;
                }

                console.log('teams array ist leer'+teams);

                var j = 0;
                
                console.log("Spielplan der ficker"+turnier.Spielplan);

                async.each(turnier.Spielplan, function(listItem, next) {
                    
                    console.log("Listenitem: "+listItem);
                     
                    listItem.position = j;

                    //Lese die vorberechnete Paarung aus 
                    var matchConfig=turnier.Spielplan[j];

                    //Setze matchanfrage zusammen 
                    var matchAnfrage={
                        'Datum' : "TO BE SPECIFIED",
                        'Uhrzeit': "TO BE SPECIFIED",
                        'Teilnehmer' : [],
                        'Regelwerk':Regelwerk,
                        'Austragungsort': turnier.Austragungsort,
                        'Status':"vor_beginn"
                    };

                    //Pushe Teams zu den Teilnehmern des Matches 
                    matchAnfrage.Teilnehmer.push(teams[matchConfig.Team1]);
                    matchAnfrage.Teilnehmer.push(teams[matchConfig.Team2]);

                    console.log("Starte Matchanfrage für den Spielplan von Turnier" + req.params.TurnierId);
                    //console.log(util.inspect(matchAnfrage, false, null));

                    //Stelle Match Post-Anfragen 
                    var matchRequest = http.request(optionsMatches, function(matchRequestResponse) {

                        //Wenn die Antwort der letzten Anfrage ankommt
                        matchRequestResponse.on('data',function(){
                            next();
                        });      
                    });

                    matchRequest.on('error',function(e){
                        console.log("Fehler"+e.message);
                    });

                    matchRequest.write(JSON.stringify(matchAnfrage));
                    console.log(matchAnfrage);
                    matchRequest.end();

                }, function(err) {
                    
                    //Antwort für die Abfrage des Turniers 
                    var jsonString;

                    var turnierRequest = http.request(options1, function(externalResponse){
                            externalResponse.on('data',function(turnierAntwort){
                                res.status(200).json(JSON.parse(turnierAntwort)).end();
                            });
                    });
                    turnierRequest.end();
                });
            }
        });
    });
    externalRequest.end();
});










/*
                    for(var i=0;i<turnier.Spielplan.length;i++){

                        //Lese die vorberechnete Paarung aus 
                        var matchConfig=turnier.Spielplan[i];

                        //Setze matchanfrage zusammen 
                        var matchAnfrage={
                            'Datum' : "TO BE SPECIFIED",
                            'Uhrzeit': "TO BE SPECIFIED",
                            'Teilnehmer' : [],
                            'Regelwerk':Regelwerk,
                            'Austragungsort': turnier.Austragungsort,
                            'Status':"vor_beginn"
                        };

                        //Pushe Teams zu den Teilnehmern des Matches 
                        matchAnfrage.Teilnehmer.push(teams[matchConfig.Team1]);
                        matchAnfrage.Teilnehmer.push(teams[matchConfig.Team2]);

                        console.log("Starte Matchanfrage für den Spielplan von Turnier" + req.params.TurnierId);
                        //console.log(util.inspect(matchAnfrage, false, null));

                        //Stelle Match Post-Anfragen 
                        var matchRequest = http.request(optionsMatches, function(matchRequestResponse) {

                            var matchRequestAntwort;

                            matchRequestResponse.on('data',function(chunk){
                                //                             console.log(util.inspect(JSON.parse(chunk), false, null));
                                matchRequestAntwort = JSON.parse(chunk);   
                            });

                            //Wenn die Antwort der letzten Anfrage ankommt
                            matchRequestResponse.on('end',function(){
                                if(i==turnier.Spielplan.length-1){ 
                                    res.status(200).json(matchRequestAntwort).end();
                                }     
                            });      
                        });

                        matchRequest.on('error',function(e){
                            console.log("Fehler"+e.message);
                        });

                        matchRequest.write(JSON.stringify(matchAnfrage));
                        console.log(matchAnfrage);
                        matchRequest.end();
                    }                
                } 
                           });   
            });
            externalRequest.end(); 
        });
        */

        app.get('/:TurnierId', function(req, res) {

            var options1 = {
                host: 'localhost',
                port: 3000,
                path: '/Turnier/'+req.params.TurnierId,
                method: 'GET',
                headers: {
                    accept: 'application/json'
                }
            };

            var options2 = {
                host: "localhost",
                port: 3000,
                path: "/Benutzer",
                method:"GET",
                headers:{
                    accept:"application/json"
                }
            }


            var x = http.request(options1, function(externalResponse){

                var y = http.request(options2, function(externalrep){

                    externalResponse.on("data", function(chunk){

                        var turnier = JSON.parse(chunk);

                        externalrep.on("data", function(chunks){

                            var benutzerAll = JSON.parse(chunks);

                            res.render('pages/einturnier', {
                                turnier: turnier ,benutzerAll:benutzerAll                     
                            });

                            res.end();
                        });
                    });
                });
                y.end();
            });
            x.end();
        });

        app.delete('/:TurnierId', function(req, res) {

            console.log("Springe in DeleteTurnier aufm Dienstntuzer");

            var options1 = {
                host: 'localhost',
                port: 3000,
                path: '/Turnier/'+req.params.TurnierId,
                method: 'DELETE',
                headers: {
                    accept: 'application/json'
                }
            };

            var y = http.request(options1, function(externalrep){

                externalrep.on("data", function(chunks){
                    JSON.parse(chunks);
                    res.status(externalrep.statusCode);
                    res.end();
                });
            });
            y.end();
        });

        app.put('/:TurnierId/Teilnehmer', function(req, res) {

            // Speichert req.body
            var Teilnehmer = req.body;
            console.log(Teilnehmer);
            var turnierId = req.params.TurnierId;

            // HTTP Header setzen
            var headers = {
                'Content-Type': 'application/json'
            };

            // Mit Server verbinden
            var options = {
                host: 'localhost',
                port: 3000,
                path: '/Turnier/'+turnierId+'/Teilnehmer',
                method: 'PUT',
                headers: headers
            };

            var externalRequest = http.request(options, function(externalResponse) {

                if(externalResponse.statusCode == 409){
                    res.status(409).end();
                };

                externalResponse.on('data', function (chunk) {
                    var completeTurnierplan = JSON.parse(chunk);
                    //console.log(util.inspect(completeTurnierplan, false, null));
                    res.json(completeTurnierplan);
                    res.end();
                });
            });
            externalRequest.write(JSON.stringify(Teilnehmer));
            externalRequest.end();
        });

        app.put('/:TurnierId', function(req, res) {

            var TurnierDaten = req.body;
            var turnierId = req.params.TurnierId;
            var responseString = '';
            //console.log(util.inspect(TurnierDaten, false, null));

            // HTTP Header setzen
            var headers = {
                'Content-Type': 'application/json'
            };

            // Mit Server verbinden
            var options = {
                host: 'localhost',
                port: 3000,
                path: '/Turnier/'+turnierId,
                method: 'PUT',
                headers: headers
            };

            var externalRequest = http.request(options, function(externalResponse) {
                externalResponse.on('data', function (chunk) {
                    var completeTurnierplan = JSON.parse(chunk);
                    //console.log(util.inspect(completeTurnierplan, false, null));
                    res.json(completeTurnierplan);
                    res.end();
                });
            });
            externalRequest.write(JSON.stringify(TurnierDaten))
            externalRequest.end();
        });

        module.exports = app;