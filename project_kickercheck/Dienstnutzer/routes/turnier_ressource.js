var app = express.Router();


//Der Dienstnutzer nutzt die Capability Turniere und Matches zu organisieren ,wie sie der Dienstgeber anbietet. Im Dienstgeber ist in jedem Match ein Feld "Regelwerk" vorgesehen  ,dass die 
//Spezifika eines Wettkampfes beschreibt. So ist erreicht ,dass der Dienst für unterschiedlichste Wettkampfarten nutzbar ist.

var Regelwerk=
    {
        "Regelwerk":{
            "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
            "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm",
            "Spielstand":{
                "SpielstandT1":null,
                "SpielstandT2":null
            }
        }
    }


app.get('/addTurnier', function(req, res) {
    res.render('pages/addTurnier');
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
            console.log(util.inspect(turnier, false, null));
            res.setHeader('Location',externalResponse.headers.location);
            res.status(201).json(turnier).end();
        });
    });

    externalRequest.write(JSON.stringify(TurnierAnfrage));
    externalRequest.end();
});


//Generiert den Konkreten Spielplan mit Turnier.Teilnehmerzahl / Turnier.Teamgröße Matches 
app.get('/:TurnierId/Spielplan',function(req,res){

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

    var jsonString='';
    
    var externalRequest = http.request(options1, function(externalResponse){

        externalResponse.on("data", function(chunk){
            jsonString+=chunk;
            
            console.log("Data angekommen , JSON String:" + chunk); 
        });

        externalResponse.on("end",function(){
            
            if(externalResponse.statusCode==404){
                res.status(404).end();
            }

            var turnier = JSON.parse(jsonString);

            console.log("Stelle Turnierrequest für den Spielplan von Turnier" + req.params.TurnierId);

            if(turnier.Teilnehmer.length != turnier.Teilnehmeranzahl){
                console.log("Zu wenig Teilnehmer,der Turnierplan kann nicht gefüllt werden");
                console.log("Die Länge des Teilnehmerarrays" + turnier.Teilnehmer.length + " Teilnehmerzahl" + turnier.Teilnehmeranzahl);
                res.status(409).send("Zu wenig Teilnehmer ").end();
            }

            //Turnier ist erfolgreich abgerufen worden 
            //Wenn Austragungsort bekannt ist , 
            //Poste AnzahlTeilnehmer / Teamgröße Matches
            console.log("Der Austragungsort des Turnieres :" + turnier.Austragungsort); 


            if(turnier.Austragungsort){

                // HTTP Header für Match Posts vorbereiten 
                var matchHeader = {
                    'Accept':'application/json',
                    'Content-Type':'application/json'
                };
                
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

                    //Teilnehmer sind nummeriert durch ihren index im Teilnehmerarray 
                    //Dieser Index wird nun genutzt um Teilnehmer auf Teamnummern aus dem Speilplan abzubilden
                    matchAnfrage.Teilnehmer.push(turnier.Teilnehmer[matchConfig.Team1]);
                    matchAnfrage.Teilnehmer.push(turnier.Teilnehmer[matchConfig.Team2]);


                    console.log("Starte Matchanfrage");
                    console.log(util.inspect(matchAnfrage, false, null));
                    

                    //Stelle Match Post-Anfragen 
                    var matchRequest = http.request(optionsMatches, function(externalResponse) {

                        externalResponse.on('data',function(chunk){
                            console.log(util.inspect(JSON.parse(chunk), false, null));
                        });
                    });

                    matchRequest.on('error',function(e){
                        console.log("Fehler"+e.message); 
                    });

                    matchRequest.write(JSON.stringify(matchAnfrage));
                    matchRequest.end();
                } 
            }
        });   
        
    });
    externalRequest.end(); 
    res.status(200).end();  
});

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
            console.log(util.inspect(completeTurnierplan, false, null));
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
    console.log(util.inspect(TurnierDaten, false, null));

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
            console.log(util.inspect(completeTurnierplan, false, null));
            res.json(completeTurnierplan);
            res.end();
        });
    });
    externalRequest.write(JSON.stringify(TurnierDaten))
    externalRequest.end();
});

module.exports = app;