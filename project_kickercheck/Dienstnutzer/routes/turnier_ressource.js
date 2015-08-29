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
    console.log('put?');
    //Vorgehen: 
    //Stelle Turnieranfrage, extrahiere URI um Matches zu Posten 
    //Stelle Teilnehmerliste Anfrage für das Turnier für das Teilnehmer>Teams mapping 
    //Poste Matches nach dem Spielplan

    var turnierId=req.params.TurnierId;

    console.log("Spielplan für Turnier" + req.params.TurnierId + "angefordert");

    //Benötigt um Anfragen zu loopen

    //Options um die Matchliste 
    var options1 = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier/'+turnierId,
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

            //Turnier ist erfolgreich abgerufen worden 
            //Wenn Austragungsort bekannt ist , 
            //Poste AnzahlTeilnehmer / Teamgröße Matches
            //Der Austragungsort (und damit die Anzahl an verfügbaren Kickertischen) 
            //limitiert wieviele Matches pro Zeitpunkt x abgehalten werden können 
            console.log("Der Austragungsort des Turnieres :" + turnier.Austragungsort); 

            if(turnier.Austragungsort){

                var teilnehmerHeader={
                    'Accept':'application/json'
                };

                //Extrahiere Link um Matches dem Turnier hinzuzufügen und Poste darauf 
                var optionsTeilnehmer = {
                    host: 'localhost',
                    port: 3000,
                    path: "/Turnier/"+turnierId+"/Teilnehmer",
                    method: 'GET',
                    headers: teilnehmerHeader
                };

                console.log("Starte Teilnehmerrequest");

                var teilnehmerRequestJson;

                var teilnehmerRequest=http.request(optionsTeilnehmer, function(teilnehmerRequestResponse) {

                    teilnehmerRequest.on('error',function(e){
                        console.log("Fehler"+e.message);
                    });

                    teilnehmerRequestResponse.on("data",function(chunk){
                        teilnehmerRequestJson = JSON.parse(chunk);
                    })

                    //Wenn die Antwort der letzten Anfrage ankommt
                    teilnehmerRequestResponse.on("end",function(){

                        console.log("KOMMST DU HIER HER JA?");

                        var Teilnehmer = teilnehmerRequestJson;

                        //Bilde die Teams
                        //Beispiel: //https://jsfiddle.net/fwrun1or/
                        var teams=[];
                        var anzahlTeams=turnier.Teilnehmeranzahl / turnier.Teamgroesse;  

                        //Beim Kicker sind nur die Teamgrößen 1 und 2 zulässig
                        //Teilnehmer sind nummeriert durch ihren index im Teilnehmerarray 
                        //Dieser Index wird nun genutzt um Teilnehmer auf Teamnummern aus dem Speilplan abzubilden

                        if(turnier.Teamgroesse == 1) {

                            var i=0;
                            async.each(Teilnehmer, function(listItem, next) {


                                for(var j=0;j<anzahlTeams;j++){

                                    //Name des jeweiligen Teams
                                    var teamName="Team"+j

                                    //Objekt das unter dem Key <teamName> die Tielnehmer enthält
                                    var teamObj={};

                                    //Teilnehmer hinzufügen 
                                    teamObj={
                                        "Teilnehmer1":Teilnehmer[i]
                                    }

                                    //Team dem Teamarray hinzufügen 
                                    teams.push(teamObj);

                                    i++;
                                }

                            }, function(err) {

                            });
                        }
                        else {

                            var i=0;
                            async.each(Teilnehmer, function(listItem, next) {

                                for(var j=0;j<anzahlTeams;j++){

                                    //Objekt das unter dem Key <teamName> die Tielnehmer enthält
                                    var teamObj={}

                                    //Teilnehmer hinzufügen 
                                    teamObj={
                                        "Teilnehmer1":Teilnehmer[i],
                                        "Teilnehmer2":Teilnehmer[i+1]
                                    }

                                    //Team dem Teamarray hinzufügen 
                                    teams.push(teamObj);

                                    i+=2;                                        
                                }

                            }, function(err) {


                            });
                        }

                        // HTTP Header für Match Posts vorbereiten 
                        var matchHeader = {
                            'Accept':'application/json',
                            'Content-Type':'application/json'
                        };

                        console.log("Path für die Matches" + turnier.MatchHinzufuegen);
                        //Benötigt um Anfragen zu loopen
                        var myAgent = new http.Agent({maxSockets: 1});

                        //Extrahiere Link um Matches dem Turnier hinzuzufügen und Poste darauf 
                        var optionsMatches = {
                            host: 'localhost',
                            port: 3000,
                            path: turnier.MatchHinzufuegen,
                            agent:myAgent,
                            method: 'POST',
                            headers: matchHeader
                        };

                        var j = 0;

                        async.each(turnier.Spielplan, function(listItem, next) {

                            //Lese die vorberechnete Paarung aus 
                            var matchConfig=listItem;

                            //Setze matchanfrage zusammen 
                            var matchAnfrage={
                                'Datum' : "TO BE SPECIFIED",
                                'Uhrzeit': "TO BE SPECIFIED",
                                'Teilnehmer' : [],
                                'Regelwerk':Regelwerk,
                                'Austragungsort': turnier.Austragungsort,
                                'Status':"vor_beginn"
                            };

                            var teilnehmerObj={
                                "Team1":teams[matchConfig.Team1],
                                "Team2":teams[matchConfig.Team2],
                            }

                            //Pushe Teams zu den Teilnehmern des Matches 
                            matchAnfrage.Teilnehmer.push(teilnehmerObj);

                            console.log(matchAnfrage.Teilnehmer);

                            console.log("Starte Matchanfrage für den Spielplan von Turnier" + req.params.TurnierId);

                            //Stelle Match Post-Anfragen 
                            var matchRequest = http.request(optionsMatches, function(matchRequestResponse) {

                                //Wenn die Antwort der letzten Anfrage ankommt
                                matchRequestResponse.on('data',function(match){


                                    var matchExpose = JSON.parse(match);

                                    var spielstandAnfrage = {
                                        spielstandT1: 0,
                                        spielstandT2: 0,
                                        Modus: 'Klassisch'
                                    }

                                    // HTTP Header für Match Posts vorbereiten 
                                    var spielstandHeader = {
                                        'Accept':'application/json',
                                        'Content-Type':'application/json'
                                    };


                                    var optionsSpielstand = {
                                        host: 'localhost',
                                        port: 3001,
                                        path: '/Match/'+matchExpose.id+'/Spielstand',
                                        method: 'PUT',
                                        headers: spielstandHeader
                                    };

                                    var spielstandRequest = http.request(optionsSpielstand, function(spielstandResponse) {

                                    });

                                    spielstandRequest.write(JSON.stringify(spielstandAnfrage));
                                    spielstandRequest.end();


                                    //console.log(JSON.parse(match));

                                    next();
                                });      
                            });

                            matchRequest.on('error',function(e){
                                console.log("Fehler"+e.message);
                            });

                            matchRequest.write(JSON.stringify(matchAnfrage));
                            //console.log(matchAnfrage);
                            matchRequest.end();

                        }, function(err) {

                            //Antwort für die Abfrage des Turniers 
                            var jsonString;

                            var matchListeOptions={
                                host: 'localhost',
                                port: 3000,
                                path: "/Turnier/"+req.params.TurnierId+"/Match",
                                method: 'GET',
                                headers: teilnehmerHeader
                            };

                            var matchListeRequest = http.request(matchListeOptions, function(matchListeResponse){
                                matchListeResponse.on('data',function(matchListeData){
                                    res.status(200).json(JSON.parse(matchListeData)).end();
                                });
                            });
                            matchListeRequest.end();
                        });
                    });  
                });
                teilnehmerRequest.end();
            }
        });
    });
    externalRequest.end();
});

//Holt ein einzelnes Turnier und seine Teilnehmer
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

                var options3 = {
                    host: "localhost",
                    port: 3000,
                    path: turnier.Austragungsort,
                    method:"GET",
                    headers:{
                        accept:"application/json"
                    }
                }


                var z = http.request(options3, function(externalrepo){


                    externalrepo.on("data", function(chunko){

                        var austragungsort = JSON.parse(chunko);



                        externalrep.on("data", function(chunks){

                            var benutzerAll = JSON.parse(chunks);

                            var options4 = {
                                host: "localhost",
                                port: 3000,
                                path: "/Turnier/"+req.params.TurnierId+"/Match",
                                method:"GET",
                                headers:{
                                    accept:"application/json"
                                }
                            }

                            var matchesReq = http.request(options4, function(externalmatches){


                                externalmatches.on("data", function(chunkv){

                                    var matches = JSON.parse(chunkv);

                                    var options5 = {
                                        host: "localhost",
                                        port: 3000,
                                        path: "/Turnier/"+req.params.TurnierId+"/Teilnehmer",
                                        method:"GET",
                                        headers:{
                                            accept:"application/json"
                                        }
                                    }

                                    var turnierTeilnehmerReq = http.request(options5, function(turnierteilnehmerdata){


                                        turnierteilnehmerdata.on("data", function(chunkturn){

                                            var turnierTeilnehmer = JSON.parse(chunkturn);


                                            res.render('pages/einturnier', {
                                                turnier: turnier ,benutzerAll:benutzerAll, austragungsort: austragungsort, matches: matches, turnierTeilnehmer : turnierTeilnehmer                   
                                            });


                                        });
                                    });
                                    turnierTeilnehmerReq.end();

                                });

                            });
                            matchesReq.end();  
                        });


                    });
                });
                z.end();

            });
        });
        y.end();
    });
    x.end();
});

//Löscht ein einzelnes Turnier
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

//Fügt einem bestehenden Turnier einen Teilnehmer hinzu 
app.put('/:TurnierId/Teilnehmer', function(req, res) {

    // Speichert req.body
    var Teilnehmer = req.body;

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
            console.log(util.inspect(completeTurnierplan, false, null));
            res.json(completeTurnierplan).end();
        });
    });
    externalRequest.write(JSON.stringify(Teilnehmer));
    externalRequest.end();
});

app.get('/:TurnierId/Teams',function(req,res){

    //Hole alle Teamliste aus DB 







});

//Ändert die Daten eines Turnieres
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