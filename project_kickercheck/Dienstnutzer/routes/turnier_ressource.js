var app = express.Router();


//Der Dienstnutzer nutzt die Capability Turniere und Matches zu organisieren ,wie sie der Dienstgeber anbietet. Im Dienstgeber ist in jedem Match ein Feld "Regelwerk" vorgesehen  ,dass die 
//Spezifika eines Wettkampfes beschreibt. So ist erreicht ,dass der Dienst für unterschiedlichste Wettkampfarten nutzbar ist.
var Regelwerk =
    {
        "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
        "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm"
    }

//Präsentationslogik

//Unterseite zum hinzufügen eines Turnieres
app.get('/addTurnier', function(req, res) {
    
    //Die Seite benötigt ein für das Dropdown Menü die Liste aller Austragungsorte
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

//Unterseite für alle Turniere
app.get('/alleTurniere', function(req, res) {
    
    //Die Seite zeigt daten aller Turniere
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

//Unterseite für ein einzelnes Turnier
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

//Liefert eine Repräsentation einer Ligatabelle eines Turnieres 
app.get('/:TurnierId/Ligatabelle',function(req,res){

    var turnierId=req.params.TurnierId;

    //Existiert das Angefragte Turnier? 
    client.exists('Turnier ' + turnierId, function(err, IdExists) {

        //Turnier existiert 
        if(IdExists){

            //Lese ligatabelle des betroffenen Turnieres
            client.mget('einTurnier '+turnierId + ' ligatabelle',function(err,ligatabelle){

                var tabelle = JSON.parse(ligatabelle);
                
                res.render('pages/eineLigatabelle', {
                    ligatabelle:tabelle
                });
            });
        }
        else{
            res.status(404).end();
        }
    });
});

//Leitet eine Turnier-POST anfrage an den Dienstgeber weiter
app.post('/', function(req, res) {

    // Speichert req.body
    var TurnierAnfrage = req.body;

    // HTTP Header für Anfragen vorbereiten 
    var headers = {
        'Accept' : 'application/json',
        'Content-Type': 'application/json'
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

//Leitet eine Turnier-PUT anfrage an den Dienstgeber weiter
app.put('/:TurnierId', function(req, res) {

    var TurnierDaten = req.body;
    var turnierId = req.params.TurnierId;
    var responseString = '';


    // HTTP Header setzen
    var headers = {
        'Accept' : 'application/json',
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

//Leitet eine Turnier-Delete anfrage an den Dienstgeber weiter
app.delete('/:TurnierId', function(req, res) {

    console.log("Springe in DeleteTurnier aufm Dienstntuzer");

    var options1 = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier/'+req.params.TurnierId,
        method: 'DELETE'
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

//Generiert den Konkreten Spielplan mit Turnier.Teilnehmerzahl / Turnier.Teamgröße Matches 
//Durch wiederholte Anfragen auf Turnier/Id/Match beim Dienstgeber 
//Die konkrete ausgestaltung eines Matches (Anzahl Teams, Teinehemer=>Teams Mapping usw..) übernimmt
//dabei der Dienstnutzer.
//Diese Operation verändert den Server-State und ist daher ein Put , kein Get 
//Per Definition ist Put Idempotent , liefert also bei wiederholter Ausführung immer das selbse 
//Ergebnis, so ist erreicht, dass der Spielplan beliebig oft geupdated werden kann 
app.put('/:TurnierId/Spielplan',function(req,res){
    //Vorgehen: 
    //Stelle Turnieranfrage, extrahiere URI um Matches zu Posten 
    //Stelle Teilnehmerliste Anfrage für das Turnier für das Teilnehmer>Teams mapping 
    //Stelle Teams zusammen 
    //Poste Matches mit den nach dem Spielplan zusammengestellten Teams 

    var turnierId=req.params.TurnierId;

    console.log("Spielplan für Turnier" + req.params.TurnierId + "angefordert");

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
        });

        //Wenn der Turnierrequest beendet ist
        externalResponse.on("end",function(){

            //Parse die Antwort
            var turnier = jsonString;

            //Turnier ist erfolgreich abgerufen worden 
            //Wenn Austragungsort bekannt ist , 
            //Poste <AnzahlTeilnehmer / Teamgröße> Matches
            //Der Austragungsort (und damit die Anzahl an verfügbaren Kickertischen) 
            //limitiert wieviele Matches pro Zeitpunkt x abgehalten werden können 
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

                //Speichert die Antwort auf die Abfrage aller Teilnehmer
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
                        var Teilnehmer = teilnehmerRequestJson;

                        //Bilde die Teams
                        //Beispiel: //https://jsfiddle.net/fwrun1or/
                        var teams=[];
                        var anzahlTeams=turnier.Teilnehmeranzahl / turnier.Teamgroesse; 

                        //Der Ligaplan ordnet jedem Team einen Punktestand zu
                        var ligatabelleObj={
                            "Teams":[],
                        }

                        //Beim Kicker sind nur die Teamgrößen 1 und 2 zulässig
                        //Teilnehmer sind nummeriert durch ihren index im Teilnehmerarray 
                        //Dieser Index wird nun genutzt um Teilnehmer auf Teamnummern aus dem Speilplan abzubilden
                        if(turnier.Teamgroesse == 1) {

                            //Index in der Teilnehmerliste
                            var i=0;

                            for(var j=0;j<anzahlTeams;j++){
                                //Name des jeweiligen Teams
                                var teamName="Team"+j

                                //Dieses Team wird später für das Match verwendet 
                                //Teilnehmer werden 1-1 von der Teilnehmerliste in die Teams übernommen
                                var teamObj={
                                    "Teilnehmer1":Teilnehmer[i]
                                };

                                //Teamnamen vergeben , der Ligaplan hat zusätzlich Teamnamen  
                                var teamLigaplan ={
                                    "teamName":teamName,
                                    "Team":teamObj,
                                    "Punkte":0
                                }

                                //Füge Team dem Ligaplan hinzu 
                                ligatabelleObj.Teams.push(teamLigaplan);

                                //Team dem Teamarray hinzufügen 
                                teams.push(teamObj);

                                i++;
                            }
                        }
                        else {

                            //Index in der Teilnehmerliste
                            var i=0;

                            for(var j=0;j<anzahlTeams;j++){

                                //Name des jeweiligen Teams
                                var teamName="Team"+j

                                //Team das später in die Matchrepräsenttion als Teilnehmer eingesetzt wird 
                                var teamObj={
                                    "Teilnehmer1":Teilnehmer[i],
                                    "Teilnehmer2":Teilnehmer[i+1]
                                }

                                //Team für den Ligaplan 
                                var teamLigaplan={
                                    "teamName":teamName,
                                    "Teilnehmer":teamObj,
                                    "Punkte":0
                                }

                                //Team dem Teamarray hinzufügen 
                                teams.push(teamObj);

                                //Füge Team dem Ligaplan hinzu 
                                ligatabelleObj.Teams.push(teamLigaplan);

                                //Teilnehmer werden 2 zu 1 auf die Teams abgebildet 
                                i+=2;
                            }
                        }

                        console.log(util.inspect(ligatabelleObj, false, null));

                        //Füge das Ligaplanobjekt in die Datenbank ein 
                        client.set("einTurnier "+turnierId+" ligatabelle",JSON.stringify(ligatabelleObj));


                        //Teams und Ligaplan sind aufgestellt ,Poste Matches 
                        //An den Dienstgeber 

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

                            //Lese die vorberechnete Paarung aus dem Spielplan
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

                                //Für jedes Match muss außerdem auf dem Dienstnutzer ein SPielstand angelegt werden
                                matchRequestResponse.on('data',function(match){

                                    var matchExpose = JSON.parse(match);

                                    //Bei Turnieren wird nach offiziellen Regeln immer bis 6 (Modus: Klassisch) gespielt 
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

                                    //Setze Spielstandrequest ab
                                    var spielstandRequest = http.request(optionsSpielstand, function(spielstandResponse) {

                                    });

                                    spielstandRequest.write(JSON.stringify(spielstandAnfrage));
                                    spielstandRequest.end();
                                    next();
                                });      
                            });

                            matchRequest.on('error',function(e){
                                console.log("Fehler"+e.message);
                            });

                            matchRequest.write(JSON.stringify(matchAnfrage));
                            matchRequest.end();

                            //Alle Match Posts sind abgesetzt 
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

                            //Frage Matches ab und liefere Sie als Antwort auf diesen Request
                            var matchListeRequest = http.request(matchListeOptions, function(matchListeResponse){
                                matchListeResponse.on('data',function(matchListeData){
                                   res.json(matchListeData);
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

//Leitet eine Turnier-Teilnehmer PUT anfrage an den Dienstgeber weiter 
app.put('/:TurnierId/Teilnehmer', function(req, res) {

    // Speichert req.body
    var Teilnehmer = req.body;

    var turnierId = req.params.TurnierId;

    // HTTP Header setzen
    var headers = {
        'Accept' : 'application/json',
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
            //   console.log(util.inspect(completeTurnierplan, false, null));
            res.json(completeTurnierplan).end();
        });
    });
    externalRequest.write(JSON.stringify(Teilnehmer));
    externalRequest.end();
});

module.exports = app;