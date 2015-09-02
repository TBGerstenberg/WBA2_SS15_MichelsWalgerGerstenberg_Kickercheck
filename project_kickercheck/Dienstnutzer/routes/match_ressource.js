var app = express.Router();
var clientFaye = new faye.Client("http://localhost:8000/faye");

//Präsentationslogik 

//Unterseite zum hinzufügen eines Matches
app.get('/addMatch', function(req, res) {

    var options1 = {
        host: "localhost",
        port: 3000,
        path: "/Benutzer",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }

    var options2 = {
        host: "localhost",
        port: 3000,
        path: "/Austragungsort",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }

    var x = http.request(options1, function(externalResponse){

        externalResponse.on("data", function(chunks){

               var benutzerAll = JSON.parse(chunks);

            var y = http.request(options2, function(externalrep){

                externalrep.on("data", function(chunk){

                  var austragungsorte = JSON.parse(chunk);



                    var ortTischMapping = [];

                    async.each(austragungsorte, function(listItem, next) {

                        var listenKey="Ort " +listItem.id+ " Tische";

                        //Frage Liste aller Kickertische dieses ortes ab
                        client.lrange(listenKey, 0, -1, function(err,items) {

                            //Wenn die Liste nicht leer ist  
                            if(items.length!=0){

                                ortTischMapping.push({"Ort" : listItem.Name, "Tische": items.length});
                            }
                            next();
                        });
                    }, function(err) {

                        res.render('pages/addMatch',{benutzerAll:benutzerAll,austragungsorte:austragungsorte, ortTischMapping: ortTischMapping});

                    });
                });

            });
            y.end();
        });

    });
    x.end();

});


//Unterseite für alle Matches
app.get('/alleMatches', function(req, res) {

    var options = {
        host: "localhost",
        port: 3000,
        path: "/Match",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }
    var externalRequest = http.request(options, function(externalResponse){

        externalResponse.on("data", function(chunk){

            var matches = JSON.parse(chunk);
            res.render('pages/allematches',{matches:matches});
            res.end();
        });

    });

    externalRequest.end();
});

//Unterseite für ein einzelnes Match
app.get('/:MatchId', function(req, res) {


    var belegungen=[];   

    // Hole alle Belegungen der Kickertische eines Ortes aus der Datenbank
    client.keys('Belegung *', function (err, key) {

        if(key.length == 0) {
            return;
        }

        client.mget(key,function(err,belegung){


            //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
            belegung.forEach(function (val) {

                belegungen.push(JSON.parse(val));

            });

        });
    });

    var options1 = {
        host: 'localhost',
        port: 3000,
        path: '/Match/'+req.params.MatchId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };

    var x = http.request(options1, function(externalres){


        externalres.on('data', function(chunk){

            var match = JSON.parse(chunk);

            // Wenn das Attribut Austragungsort des Matches nicht "NULL" ist
            if(match.Austragungsort) {

                //  console.log(match.Austragungsort);		

                var ortURI = match.Austragungsort.split("/");		
                var ort = "/"+ortURI[1]+"/"+ortURI[2];		

                //      console.log(ort);		


                // Frage alle Kickertische des Ortes ab
                var options2 = {
                    host: "localhost",
                    port: 3001,
                    path: ort+"/Kickertisch/",
                    method:"GET",
                    headers:{
                        accept:"application/json"
                    }
                }

                // Frage den Austragungsort selber ab
                var options3 = {
                    host: "localhost",
                    port: 3000,
                    path: ort,
                    method:"GET",
                    headers:{
                        accept:"application/json"
                    }
                }

                // Frage den Spielstand eines Matches ab
                var options4 = {
                    host: 'localhost',
                    port: 3001,
                    path: '/Match/'+req.params.MatchId+"/Spielstand",
                    method: 'GET',
                    headers: {
                        accept: 'application/json'
                    }
                };



                var y = http.request(options2, function(externalrep){

                    externalrep.on("data", function(chunks){

                        var kickertische = JSON.parse(chunks);

                        var z = http.request(options3, function(externalrepz){

                            externalrepz.on("data", function(chunkz){

                                var austragungsort = JSON.parse(chunkz);

                                var w = http.request(options4, function(externalrepw){

                                    externalrepw.on("data", function(chunkw){

                                        var spielstand = JSON.parse(chunkw);

                                        var teilnehmerAusMatchAnfrage = [];

                                        if(match.Teilnehmer[0].Team2.Teilnehmer1) {
                                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team2.Teilnehmer1);
                                        }
                                        if(match.Teilnehmer[0].Team2.Teilnehmer2) {
                                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team2.Teilnehmer2);
                                        }
                                        if(match.Teilnehmer[0].Team1.Teilnehmer1) {
                                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team1.Teilnehmer1);
                                        }
                                        if(match.Teilnehmer[0].Team1.Teilnehmer2) {
                                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team1.Teilnehmer2);
                                        }

                                        // console.log(teilnehmerAusMatchAnfrage);

                                        var benutzerAll = [];

                                        var myAgent = new http.Agent({maxSockets: 1});

                                        // Sende für jeden Teilnehmer des Matches eine Anfrage an die Benutzer-Ressource
                                        // um den Namen des Teilnehmers zu erhalten 
                                        async.each(teilnehmerAusMatchAnfrage, function(listItem, next) {

                                            var options = {
                                                host: "localhost",
                                                port: 3000,
                                                agent: myAgent,
                                                path: listItem,
                                                method:"GET",
                                                headers:{
                                                    accept : "application/json"
                                                }
                                            }

                                            var exreq = http.request(options, function(externalrep){

                                                externalrep.on("data", function(chunks){

                                                    var user = JSON.parse(chunks);
                                                    // Pushe jeden erhaltenen Benutzer in das Array benutzerAll
                                                    benutzerAll.push(user);
                                                    next();
                                                });
                                            });

                                            exreq.end();

                                        }, function(err) {

                                            // console.log(match.Teilnehmer);

                                            res.render('pages/einmatch', { benutzerAll : benutzerAll, match: match, kickertische: kickertische, austragungsort: austragungsort, spielstand:spielstand, belegungen: belegungen });	

                                        });


                                    });

                                });
                                w.end();

                            });
                        });
                        z.end();

                    });

                });
                y.end();
            }
            else {

                // Wenn der Match Austragungsort "null" ist

                var options4 = {
                    host: 'localhost',
                    port: 3001,
                    path: '/Match/'+req.params.MatchId+"/Spielstand",
                    method: 'GET',
                    headers: {
                        accept: 'application/json'
                    }
                };

                var w = http.request(options4, function(externalrepw){

                    externalrepw.on("data", function(chunkw){

                        var spielstand = JSON.parse(chunkw);

                        var benutzerAll = [];
                        var teilnehmerAusMatchAnfrage = [];


                        if(match.Teilnehmer[0].Team2.Teilnehmer1) {
                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team2.Teilnehmer1);
                        }
                        if(match.Teilnehmer[0].Team2.Teilnehmer2) {
                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team2.Teilnehmer2);
                        }
                        if(match.Teilnehmer[0].Team1.Teilnehmer1) {
                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team1.Teilnehmer1);
                        }
                        if(match.Teilnehmer[0].Team1.Teilnehmer2) {
                            teilnehmerAusMatchAnfrage.push(match.Teilnehmer[0].Team1.Teilnehmer2);
                        }

                        //  console.log(teilnehmerAusMatchAnfrage);


                        var myAgent = new http.Agent({maxSockets: 1});

                        // Sende für jeden Teilnehmer des Matches eine Anfrage an die Benutzer-Ressource
                        // um den Namen des Teilnehmers zu erhalten 
                        async.each(teilnehmerAusMatchAnfrage, function(listItem, next) {

                            var options = {
                                host: "localhost",
                                port: 3000,
                                agent: myAgent,
                                path: listItem,
                                method:"GET",
                                headers:{
                                    accept : "application/json"
                                }
                            }


                            var exreq = http.request(options, function(externalrep){

                                externalrep.on("data", function(chunks){

                                    var user = JSON.parse(chunks);
                                    // Pushe jeden erhaltenen Benutzer in das Array benutzerAll
                                    benutzerAll.push(user);
                                    next();
                                });


                            });

                            exreq.end();


                        }, function(err) {


                            res.render('pages/einmatch', { benutzerAll : benutzerAll, match: match, spielstand:spielstand });	

                        });


                    });

                });
                w.end();

            }
        });

    });

    x.end();


});

//Leitet eine Match-POST anfrage an den Dienstgeber weiter
app.post('/', function(req, res) {

    // Speichert req.body
    var MatchAnfrage = req.body;

    // HTTP Header setzen
    var headers = {
        'Accept' : 'application/json',
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Match',
        method: 'POST',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {

        if(externalResponse.statusCode == 400){
            res.status(400).end();
        };

        externalResponse.on('data', function (chunk) {

            var match = JSON.parse(chunk);

            //  console.log(util.inspect(match, false, null));

            // Extrahiere aus dem Antwort-Header die ID des Matches und erstelle auf dem Dienstnutzer einen Spielstand für
            // dieses Match
            var loc = externalResponse.headers.location.split("/");

            var idm = loc[2];

            var MatchSpielstand = {
                spielstandT1 : 0,
                spielstandT2: 0,
                Modus: 'Klassisch',
                Gewinner: null
            }

            //Schreibe Turnierdaten zurück 
            client.set('Spielstand ' + idm,JSON.stringify(MatchSpielstand));


            res.json(match).end();

        });

    });

    // Schreibe das Kicker-spezifische Regelwerk für das Match in die Repräsentation
    var Regelwerk=
        {
            "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
            "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm"
        }

    MatchAnfrage.Regelwerk = Regelwerk;

    externalRequest.write(JSON.stringify(MatchAnfrage));

    externalRequest.end();

});

//Leitet eine Match-PUT anfrage an den Dienstgeber weiter
app.put('/:MatchId', function(req, res) {

    var MatchDaten = req.body;
    var matchId = req.params.MatchId;


    // console.log(util.inspect(MatchDaten, false, null));

    // HTTP Header setzen
    var headers = {
        'Accept' : 'application/json',
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Match/'+matchId,
        method: 'PUT',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            var changeMatch = JSON.parse(chunk);

            // console.log(util.inspect(changeMatch, false, null));

            res.json(changeMatch);
            res.end();


        });

    });

    // Schreibe das Kicker-spezifische Regelwerk für das Match in die Repräsentation
    var Regelwerk=
        {
            "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
            "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm"
        }

    MatchDaten.Regelwerk = Regelwerk;

    externalRequest.write(JSON.stringify(MatchDaten));

    externalRequest.end();

});


app.get('/:MatchId/Spielstand', function(req, res) {

    var matchId = req.params.MatchId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Match ' + matchId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }

        //Ressource existiert     
        else {


            var spielstandId = req.params.MatchId;

            //Lese aktuellen Zustand des Turniers aus DB
            client.mget('Spielstand '+spielstandId,function(err,spielstanddata){

                var spielstand = JSON.parse(spielstanddata);

                //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                res.set("Content-Type", 'application/json').status(200).json(spielstand).end();

            });
        }

    });

});

app.get('/:MatchId/Liveticker', function(req, res) {
    res.render('pages/einliveticker');
});

app.put('/:MatchId/Spielstand', function(req, res) {

    var matchId = req.params.MatchId;
    var spielstandId = req.params.MatchId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Match ' + matchId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }

        //Ressource existiert     
        else {

            client.mget('Match ' + matchId, function(err, matchdaten) {

                var dieseMatch = JSON.parse(matchdaten);

                var MatchSpielstand = req.body;

                if(MatchSpielstand.Modus == 'Klassisch') {

                    if(MatchSpielstand.spielstandT1 < 6 && MatchSpielstand.spielstandT2 < 6) {

                        //Path of the Topic
                        var path = "/liveticker/"+matchId;

                        //Publish to the specific topic path  
                        var publication = clientFaye.publish(path,{
                            'SpielstandT1': MatchSpielstand.spielstandT1,
                            'SpielstandT2': MatchSpielstand.spielstandT2,
                        });


                        //Schreibe Turnierdaten zurück 
                        client.set('Spielstand ' + spielstandId,JSON.stringify(MatchSpielstand));


                        //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                        res.set("Content-Type", 'application/json').status(200).json(MatchSpielstand).end();

                    }
                    else if(MatchSpielstand.spielstandT1 == 6 && MatchSpielstand.spielstandT2 < 6) {


                        if(dieseMatch.Teilnehmer[0].Team1.Teilnehmer1 && dieseMatch.Teilnehmer[0].Team1.Teilnehmer2) {


                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team1.Teilnehmer1, dieseMatch.Teilnehmer[0].Team1.Teilnehmer2];

                        }
                        else {
                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team1.Teilnehmer1];

                        }

                        //Path of the Topic
                        var path = "/liveticker/"+matchId;

                        //Publish to the specific topic path  
                        var publication = clientFaye.publish(path,{
                            'SpielstandT1': MatchSpielstand.spielstandT1,
                            'SpielstandT2': MatchSpielstand.spielstandT2,
                            'Winner': 'Team1'
                        });


                        //Schreibe Turnierdaten zurück 
                        client.set('Spielstand ' + spielstandId,JSON.stringify(MatchSpielstand));
                        //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                        res.set("Content-Type", 'application/json').status(200).json(MatchSpielstand).end();


                    }
                    else if(MatchSpielstand.spielstandT2 == 6 && MatchSpielstand.spielstandT1 < 6 ) {

                        if(dieseMatch.Teilnehmer[0].Team2.Teilnehmer1 && dieseMatch.Teilnehmer[0].Team2.Teilnehmer2) {

                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team2.Teilnehmer1, dieseMatch.Teilnehmer[0].Team2.Teilnehmer2];

                        }
                        else {
                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team2.Teilnehmer1];


                        }

                        //Path of the Topic
                        var path = "/liveticker/"+matchId;

                        //Publish to the specific topic path  
                        var publication = clientFaye.publish(path,{
                            'SpielstandT1': MatchSpielstand.spielstandT1,
                            'SpielstandT2': MatchSpielstand.spielstandT2,
                            'Winner': 'Team2'
                        });


                        //Schreibe Turnierdaten zurück 
                        client.set('Spielstand ' + spielstandId,JSON.stringify(MatchSpielstand));
                        //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                        res.set("Content-Type", 'application/json').status(200).json(MatchSpielstand).end();

                    }
                    else {
                        res.status(403).end();
                    }

                }

                if(MatchSpielstand.Modus == 'Variation') {

                    if(MatchSpielstand.spielstandT1 < 10 && MatchSpielstand.spielstandT2 < 10) {

                        //Path of the Topic
                        var path = "/liveticker/"+matchId;

                        //Publish to the specific topic path  
                        var publication = clientFaye.publish(path,{
                            'SpielstandT1': MatchSpielstand.spielstandT1,
                            'SpielstandT2': MatchSpielstand.spielstandT2,
                        });


                        //Schreibe Turnierdaten zurück 
                        client.set('Spielstand ' + spielstandId,JSON.stringify(MatchSpielstand));


                        //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                        res.set("Content-Type", 'application/json').status(200).json(MatchSpielstand).end();
                    }

                    else if(MatchSpielstand.spielstandT1 == 10 && MatchSpielstand.spielstandT2 < 10) {

                        if(dieseMatch.Teilnehmer[0].Team1.Teilnehmer1 && dieseMatch.Teilnehmer[0].Team1.Teilnehmer2) {

                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team1.Teilnehmer1, dieseMatch.Teilnehmer[0].Team1.Teilnehmer2];

                        }
                        else {
                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team1.Teilnehmer1];

                        }


                        //Path of the Topic
                        var path = "/liveticker/"+matchId;

                        //Publish to the specific topic path  
                        var publication = clientFaye.publish(path,{
                            'SpielstandT1': MatchSpielstand.spielstandT1,
                            'SpielstandT2': MatchSpielstand.spielstandT2,
                            'Winner': 'Team1'
                        });

                        //Schreibe Turnierdaten zurück 
                        client.set('Spielstand ' + spielstandId,JSON.stringify(MatchSpielstand));


                        //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                        res.set("Content-Type", 'application/json').status(200).json(MatchSpielstand).end();

                    }
                    else if(MatchSpielstand.spielstandT2 == 10 && MatchSpielstand.spielstandT1 < 10 ) {

                        if(dieseMatch.Teilnehmer[0].Team2.Teilnehmer1 && dieseMatch.Teilnehmer[0].Team2.Teilnehmer2) {

                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team2.Teilnehmer1, dieseMatch.Teilnehmer[0].Team2.Teilnehmer2];

                        }
                        else {
                            MatchSpielstand.Gewinner = [dieseMatch.Teilnehmer[0].Team2.Teilnehmer1];

                        }


                        //Path of the Topic
                        var path = "/liveticker/"+matchId;

                        //Publish to the specific topic path  
                        var publication = clientFaye.publish(path,{
                            'SpielstandT1': MatchSpielstand.spielstandT1,
                            'SpielstandT2': MatchSpielstand.spielstandT2,
                            'Winner': 'Team2'
                        });

                        //Schreibe Turnierdaten zurück 
                        client.set('Spielstand ' + spielstandId,JSON.stringify(MatchSpielstand));


                        //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                        res.set("Content-Type", 'application/json').status(200).json(MatchSpielstand).end();

                    }
                    else {
                        res.status(403).end();
                    }
                }



            });

        }

    });

});


module.exports = app;