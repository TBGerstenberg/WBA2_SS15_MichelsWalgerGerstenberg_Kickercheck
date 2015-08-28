var app = express.Router();

app.get('/addAustragungsort', function(req, res) {
    res.render('pages/addAustragungsort');
});

app.get('/alleAustragungsorte', function(req, res) {

    var options = {
        host: "localhost",
        port: 3000,
        path: "/Austragungsort",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }
    var externalRequest = http.request(options, function(externalResponse){

        externalResponse.on("data", function(chunk){

            var austragungsorte = JSON.parse(chunk);
            res.render('pages/alleaustragungsorte',{austragungsorte:austragungsorte});
        });

    });

    externalRequest.end();
});


app.get('/:AustragungsortId', function(req, res) {

    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Austragungsort/'+req.params.AustragungsortId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };

    var x = http.request(options, function(externalres){

        externalres.on('data', function(chunk){

            var austragungsort = JSON.parse(chunk);


            res.render('pages/einaustragungsort', { austragungsort: austragungsort });
        });
    });                     
    x.end();
});

app.post('/', function(req, res) {

    // Speichert req.body
    var AustragungsortAnfrage = req.body;


    // HTTP Header setzen
    var headers = {
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Austragungsort',
        method: 'POST',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {

        if(externalResponse.statusCode == 400){
            res.status(400).end();
        };

        externalResponse.on('data', function (chunk) {

            var austragungsort = JSON.parse(chunk);

            console.log(util.inspect(austragungsort, false, null));

            res.json(austragungsort);
            res.end();


        });

    });


    externalRequest.write(JSON.stringify(AustragungsortAnfrage));
    externalRequest.end();
});

app.put('/:AustragungsortId', function(req, res) {

    var AustragungsortDaten = req.body;
    var austragungsortId = req.params.AustragungsortId;


    console.log(util.inspect(AustragungsortDaten, false, null));

    // HTTP Header setzen
    var headers = {
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Austragungsort/'+austragungsortId,
        method: 'PUT',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            var changeAustragungsort = JSON.parse(chunk);

            console.log(util.inspect(changeAustragungsort, false, null));

            res.json(changeAustragungsort);
            res.end();


        });

    });

    externalRequest.write(JSON.stringify(AustragungsortDaten));

    externalRequest.end();

});

// KICKERTISCH

app.get('/:AustragungsortId/Kickertisch', function(req, res) {

    var kickertische = []; 
    var belegungen = [];


    var austragungsortId = req.params.AustragungsortId;

    // Ermittle den Key unter dem die Linkliste dieser Lokalitaet in der DB abgelegt ist 
    var listenKey="Ort " +austragungsortId+ " Tische";


    client.mget('Austragungsort '+austragungsortId,function(err,ort){

        var austragungsort = JSON.parse(ort);


        client.lrange(listenKey, 0, -1, function(err,items) {

            var i = 0;

            async.each(items, function(listItem, next) {

                listItem.position = i;

                client.mget('Kickertisch '+listItem,function(err,resp){

                    client.mget('Belegung '+listItem,function(err,bel){

                        kickertische.push(JSON.parse(resp));
                        belegungen.push(JSON.parse(bel));


                        i++;

                        next();

                    });
                });

            }, function(err) {

                // all data has been updated
                // do whatever you want

                res.render('pages/allekickertische', { kickertische: kickertische, belegungen: belegungen, austragungsort: austragungsort });

            });

        });

    });

});


app.get('/:AustragungsortId/allekickertische',function(req,res){


    var response=[];    
    var kickertische=[];


    var austragungsortId = req.params.AustragungsortId;

    var listenKey="Ort " +austragungsortId+ " Tische";
    client.lrange(listenKey, 0, -1, function(err,items) {

        var i = 0;

        async.each(items, function(listItem, next) {

            listItem.position = i;

            client.mget('Kickertisch '+listItem,function(err,resp){

                response.push(JSON.parse(resp));
                i++;

                next();

            });

        }, function(err) {

            // all data has been updated
            // do whatever you want
            res.status(200).set("Content-Type","application/json").json(response).end();

        });


    });    

});



app.get('/:AustragungsortId/Kickertisch/:TischId', function(req, res) {


    //Extrahiere TischId
    var tischId = req.params.TischId;
    var austragungsortId = req.params.AustragungsortId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

        //Lokalitaet kennt einen Tisch mit dieser TischId
        if (IdExists) {



            client.mget('Austragungsort '+austragungsortId,function(err,resp){

                var austr = JSON.parse(resp);

                client.mget('Belegung '+tischId,function(err,bel){

                    var belegung = JSON.parse(bel);

                    client.mget('Kickertisch ' + tischId, function(err,kickertischdata){

                        var tisch = JSON.parse(kickertischdata);


                        var acceptedTypes = req.get('Accept');

                        switch (acceptedTypes) {

                                //Client erwartet content type application/json
                            case "application/json":

                                //Setze Contenttype der Antwort auf application/json
                                res.set("Content-Type", 'application/json').status(200).json(tisch).end();


                                break;

                            default:
                                res.render('pages/einkickertisch', { tisch: tisch, ort:austr, belegung: belegung });
                                //Antwort beenden        
                                res.end();
                                break;

                        }   
                    });              

                });
            });

        }       

    });
});



app.post('/:AustragungsortId/Kickertisch/',function(req, res){


    //Anlegen eines Tisches geht nur mit Content Type application/atom+xml
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage xml ist 
    if (contentType != "application/json" && contentType != "application/json; charset=UTF-8") {
        res.set("Accepts", "application/json");
        res.status(406).send("Content Type is not supported");
        res.end();
    }

    else {

        var austragungsortId = req.params.AustragungsortId;

        //Inkrementiere Kickertischids in der DB , atomare Aktion 
        client.incr('KickertischId', function(err, id) {


            var Kickertisch = req.body;

            var kickertischObj={
                //Set von Benutzern required
                'id': id,
                'Hersteller': Kickertisch.Hersteller,
                'Zustand' : Kickertisch.Zustand,
                'Typ': Kickertisch.Typ,
                'Merkmale': Kickertisch.Merkmale
            };

            client.set('Kickertisch ' + id, JSON.stringify(kickertischObj));

            client.LPUSH('Ort '+austragungsortId+' Tische', 
                         id
                        );

            var belegungObj={
                'id' : id,
                'Anzahl' : 0,
                'Teilnehmer' : null,
                'Herausforderungen' : null
            };


            client.set('Belegung ' + id, JSON.stringify(belegungObj));

            //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json').set("Location", "/Austragungsort/"+austragungsortId+"/Kickertisch/" + id).status(201).json(kickertischObj).end();


        });
    }

});

/*Mit put kann das Bild eines Kickertischs und/oder seine Zustandsbeschreibung geändert werden*/
app.put('/:AustragungsortId/Kickertisch/:TischId/', function(req, res) {



    var contentType = req.get('Content-Type');

    //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json" && contentType != "application/json; charset=UTF-8") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json");
        //Zeige über den Statuscode und eine Nachricht 
        res.status(406).send("Content Type is not supported");
        //Antwort beenden
        res.end();
    }

    else {

        var tischId = req.params.TischId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Kickertisch ' + tischId, function(err, IdExists) {

            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).send("Die Ressource wurde nicht gefunden.");
                res.end();
            }

            //Ressource existiert     
            else {

                var Kickertisch = req.body;

                //Lese aktuellen Zustand des Turniers aus DB
                client.mget('Kickertisch '+tischId,function(err,tischdata){

                    var Kickertischdaten = JSON.parse(tischdata);

                    Kickertischdaten.Zustand = Kickertisch.Zustand;


                    //Schreibe Turnierdaten zurück 
                    client.set('Kickertisch ' + tischId,JSON.stringify(Kickertischdaten));


                    //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                    res.set("Content-Type", 'application/json').status(200).json(Kickertischdaten).end();


                });
            }
        });

    }
});

app.delete('/:AustragungsortId/Kickertisch/:TischId/', function(req, res) {

    var tischId = req.params.TischId;
    var austragungsortId = req.params.AustragungsortId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

        //client.exists hat false geliefert 
        if (!IdExists) {

            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();

        } else {

            var listenKey="Ort " +austragungsortId+ " Tische";

            client.lrem(listenKey,-1,tischId);

            client.del('Kickertisch ' + tischId);


            //Alles ok , sende 200 
            res.status(200).send("Das hat funktioniert! Kickertisch ist weg");

            //Antwort beenden
            res.end();
        }
    });
});

// Subressource Belegungssituation


app.get('/:AustragungsortId/Kickertisch/:TischId/Belegung/', function(req, res) {


    //Extrahiere TischId
    var tischId = req.params.TischId;
    var belegungId = req.params.TischId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

        //Lokalitaet kennt einen Tisch mit dieser TischId
        if (IdExists) {

            client.exists('Belegung ' + belegungId, function(err, IdExists) {

                if(IdExists) {

                    client.mget('Belegung '+belegungId,function(err,belegungdaten){

                        var belegung = JSON.parse(belegungdaten);

                        res.set("Content-Type", 'application/json').status(200).json(belegung).end();                  	        

                    });

                }
                else {
                    res.status(404).end();    
                }

            });
        }    

    });

});


/*Mit put kann das Bild eines Kickertischs und/oder seine Zustandsbeschreibung geändert werden*/
app.put('/:AustragungsortId/Kickertisch/:TischId/Belegung/', function(req, res) {

    console.log(req.body);
    var contentType = req.get('Content-Type');

    //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json" && contentType != "application/json; charset=UTF-8") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json");
        //Zeige über den Statuscode und eine Nachricht 
        res.status(406).send("Content Type is not supported");
        //Antwort beenden
        res.end();
    }

    else {

        var tischId = req.params.TischId;
        var belegungsId = req.params.TischId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Kickertisch ' + tischId, function(err, IdExists) {

            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).send("Die Ressource wurde nicht gefunden.");
                res.end();
            }

            //Ressource existiert     
            else {

                var Belegung = req.body;

                console.log(Belegung);

                var belegungObj={
                    //Set von Benutzern required
                    'id': belegungsId,
                    'Anzahl' : Belegung.anzahl,
                    'Teilnehmer' : Belegung.teilnehmer,
                    'Herausforderungen' : null
                };

                console.log(belegungObj);

                client.set('Belegung ' + belegungsId, JSON.stringify(belegungObj));

                //Setze Contenttype der Antwort auf application/atom+xml
                res.set("Content-Type", 'application/json').status(200).json(belegungObj).end();



            }
        });

    }

});


module.exports = app;

/*
	app.post('/:AustragungsortId/Kickertisch/:TischId/Belegung',function(req, res){


	    var contentType = req.get('Content-Type');

         //Check ob der Content Type der Anfrage xml ist 
        if (contentType != "application/json" && contentType != "application/json; charset=UTF-8") {
	       res.set("Accepts", "application/json");
	       res.status(406).send("Content Type is not supported");
	       res.end();
	    }

        else {

	        var tischId = req.params.TischId;
	         var austragungsortId = req.params.AustragungsortId;

	         client.mget('Kickertisch '+tischId,function(err,tischdaten){

				var tisch = JSON.parse(tischdaten);

             var Belegung = req.body;

            tisch.Belegung = Belegung;

             client.set('Kickertisch ' + tischId, JSON.stringify(tisch));

              //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json').set("Location", "/Austragungsort/"+austragungsortId+"/Kickertisch/" + tischId+ "/Belegung").status(201).json(Belegung).end();


         });
       }
    });
*/