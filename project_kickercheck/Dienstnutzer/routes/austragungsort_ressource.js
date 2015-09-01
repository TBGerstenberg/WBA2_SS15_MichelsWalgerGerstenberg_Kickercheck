var app = express.Router();

//Präsentationslogik 

//Unterseite zum hinzufügen eines Austragungsortes
app.get('/addAustragungsort', function(req, res) {
    res.render('pages/addAustragungsort');
});

//Unterseite die die Liste aller Austragungsorte darstellt
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

//Unterseite die die Ansicht eines Austragungsortes darstellt 
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


//Unterseite die die Daten eines Kickertisches darstellt 
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
                res.render('pages/allekickertische', { kickertische: kickertische, belegungen: belegungen, austragungsort: austragungsort });
            });
        });
    });
});


/*
// Ressourcen des Dienstnutzers ,
// die ebenfalls über REST-methoden zugänglich sind und damit in gewisser weise 
// eine Erweiterung der Dienstgeber Capability zugeschnitten auf Kickersport darstellen
//
//
*/


//Leitet eine POST-Austragungsort Anfrage an den Dienstgeber weiter
app.post('/', function(req, res) {

    // Speichert req.body
    var AustragungsortAnfrage = req.body;


    // HTTP Header setzen
    var headers = {
        'Accept' : 'application/json',
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
            res.json(austragungsort);
            res.end();
        });
    });

    externalRequest.write(JSON.stringify(AustragungsortAnfrage));
    externalRequest.end();
});

//Leitet eine Austragungsort - PUT anfrage an den Dienstgeber weiter 
app.put('/:AustragungsortId', function(req, res) {

    var AustragungsortDaten = req.body;
    var austragungsortId = req.params.AustragungsortId;

    // HTTP Header setzen
    var headers = {
        'Accept' : 'application/json',
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
            res.json(changeAustragungsort);
            res.end();

        });
    });
    externalRequest.write(JSON.stringify(AustragungsortDaten));
    externalRequest.end();
});

//Löscht einen Austragungsort und alle auf dem Dienstntuzer assoziierten Kickertische (Subressource)
app.delete('/:AustragungsortId', function(req, res) {

    var austragungsortId = req.params.AustragungsortId;

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Austragungsort/'+austragungsortId,
        method: 'DELETE'
    };

    //Stelle Delete Request 
    var externalRequest = http.request(options, function(externalResponse) {

        //Warte bis Antwort beendet ist 
        externalResponse.on('end', function() {

            //Listenkey für die Liste aller Kickertische dieses ortes 
            var listenKey="Ort " +austragungsortId+ " Tische";

            //Frage Liste aller Kickertische dieses ortes ab
            client.lrange(listenKey, 0, -1, function(err,items) {

                //Wenn die Liste nicht leer ist  
                if(items.length!=0){

                    //Lösche alle Einträge 
                    items.foreach(function(entry){
                        //Lösche Eintrag aus der DB
                        client.del('Kickertisch ' +entry);
                    });

                    //Lösche den Listenkey 
                    client.del("Ort " +austragungsortId+ " Tische");

                    //Löschen hat Funktioniert , liefere 200
                    res.status(200).end();
                }

                //Liste war leer, löschen hat dennoch funktioniert 
                else {
                    res.status(200).end();
                }
            });
        });
    });
    externalRequest.end();
});


/*
//Subressource Kickertisch 
//
//
//
*/

//Liefert eine Collection aller Kickertische eines Austragungsortes
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
            res.status(200).set("Content-Type","application/json").json(response).end();
        });
    });    
});

//Liefert eine Repräsentation eines Tisches eines Austragungsortes 
app.get('/:AustragungsortId/Kickertisch/:TischId', function(req, res) {

    //Extrahiere TischId
    var tischId = req.params.TischId;
    var austragungsortId = req.params.AustragungsortId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

        //Lokalitaet kennt einen Tisch mit dieser TischId
        if (IdExists) {

            var options1 = {
                host: "localhost",
                port: 3000,
                path: "/Benutzer",
                method:"GET",
                headers:{
                    accept:"application/json"
                }
            }

            var y = http.request(options1, function(externalResponse){

                externalResponse.on("data", function(chunk){

                    var benutzerAll = JSON.parse(chunk);

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
                                        res.render('pages/einkickertisch', { tisch: tisch, ort:austr, belegung: belegung, benutzerAll:benutzerAll });
                                        //Antwort beenden        
                                        res.end();
                                        break;

                                }   
                            });              

                        });
                    });

                });
            });
            y.end();
        }

    });
});

//Fügt der Collection aller Kickertische eines Ortes einen weiteren Hinzu 
app.post('/:AustragungsortId/Kickertisch/',function(req, res){

    //Anlegen eines Tisches geht nur mit Content Type application/atom+xml
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage JSON ist 
    if (contentType != "application/json" && contentType != "application/json; charset=UTF-8") {
        res.set("Accepts", "application/json");
        res.status(406).send("Content Type is not supported");
        res.end();
    }

    else {
        //extrahiere Id des Austragungsortes 
        var austragungsortId = req.params.AustragungsortId;

        //Inkrementiere Kickertischids in der DB , atomare Aktion 
        client.incr('KickertischId', function(err, id) {

            //Lese Request Body aus 
            var Kickertisch = req.body;

            //Kickertisch Objekt 
            var kickertischObj={
                //Set von Benutzern required
                'id': id,
                'Hersteller': Kickertisch.Hersteller,
                'Zustand' : Kickertisch.Zustand,
                'Typ': Kickertisch.Typ,
                'Merkmale': Kickertisch.Merkmale
            };

            //Speise Daten des Kickertisches in Datenhaltung des Dienstnutzers ein 
            client.set('Kickertisch ' + id, JSON.stringify(kickertischObj));

            //Füge die ID des Tisches in die Liste aller Tische dieses Ortes ein
            client.LPUSH('Ort '+austragungsortId+' Tische',id);

            //Mit jedem Kickertisch wird auch seine Subressource "Belegung" erzeugt 
            var belegungObj={
                'id' : id,
                'Anzahl' : 0,
                'Teilnehmer' : null,
                'Forderungen' : []
            };

            //Speise Belegung mit der gleichen Id wie der übergeordnete Tisch in die DB ein 
            client.set('Belegung ' + id, JSON.stringify(belegungObj));

            //Setze Contenttype der Antwort auf application/json 
            res.set("Content-Type", 'application/json').set("Location", "/Austragungsort/"+austragungsortId+"/Kickertisch/" + id).status(201).json(kickertischObj).end();
        });
    }
});


//Ändert die Daten eines Kickertisches , es können das Bild eines Kickertischs und/oder seine Zustandsbeschreibung geändert werden*/
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

    //Content type OK 
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

                //Lese aktuellen Zustand des Tisches aus DB 
                client.mget('Kickertisch '+tischId,function(err,tischdata){

                    //Parse Redis Antwort 
                    var Kickertischdaten = JSON.parse(tischdata);

                    //Setze Daten des Tisches 
                    Kickertischdaten.Zustand = Kickertisch.Zustand;

                    //Schreibe Tischdaten zurück 
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

/*
// Subressource Belegungssituation
//
// 
*/

//Liefert eine Repräsentation der Belegungssituation eines Kickertisches 
app.get('/:AustragungsortId/Kickertisch/:TischId/Belegung/', function(req, res) {

    //Extrahiere TischId
    var tischId = req.params.TischId;
    var belegungId = req.params.TischId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

        //Lokalitaet kennt einen Tisch mit dieser TischId
        if (IdExists) {

            client.mget('Belegung '+belegungId,function(err,belegungdaten){
                var belegung = JSON.parse(belegungdaten);
                res.set("Content-Type", 'application/json').status(200).json(belegung).end();                  	        
            });
        }
        else {
            res.status(404).end();    
        }
    });
});

/* Ändert die Belegungssituation eines Kickertisches */
app.put('/:AustragungsortId/Kickertisch/:TischId/Belegung/', function(req, res) {

    var contentType = req.get('Content-Type');

    //Wenn kein JSON geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json" && contentType != "application/json; charset=UTF-8") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).send("Content Type is not supported").end();
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

                //Lese Belgung aus DB
                client.mget('Belegung '+belegungsId,function(err,belegungdaten){

                    //Parse Redis Antwort 
                    var belegung = JSON.parse(belegungdaten);

                    //Lese neue Belegung aus 
                    var BelegungNeu = req.body;

                    //Aktualisiere Zustand der Ressource 
                    var belegungObj={
                        //Set von Benutzern required
                        'id': belegungsId,
                        'Anzahl' : BelegungNeu.anzahl,
                        'Teilnehmer' : BelegungNeu.teilnehmer,
                        'Forderungen' : belegung.Forderungen
                    };

                    //Schreibe Daten zurück 
                    client.set('Belegung ' + belegungsId, JSON.stringify(belegungObj));

                    //Setze Contenttype der Antwort auf application/json , zeige Erfolg mit Status 200 und liefere Geänderte Repräsentation
                    res.set("Content-Type", 'application/json').status(200).json(belegungObj).end();
                });
            }
        });
    }
});

/*
//Subressource Forderung
//
//
//
*/

//Liefert eine Repräsentation einer auf einem Kickertisch gestellten Forderung
app.get('/:AustragungsortId/Kickertisch/:TischId/Forderung/:ForderungId', function(req, res) {

    //Extrahiere TischId
    var tischId = req.params.TischId;
    var forderungId = req.params.ForderungId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Kickertisch ' + tischId, function(err, IdExists) {

        //Austragungsort kennt einen Tisch mit dieser TischId
        if (IdExists) {

            //Gibt es die Forderung mit <Forderungsid>? 
            client.exists('Forderung ' + forderungId, function(err, IdExists) {

                //Forderung existiert 
                if(IdExists) {

                    //Lese daten der Forderung aus DB
                    client.mget('Forderung '+forderungId,function(err,forderungdaten){
                        
                        //Parse Redis Antwort 
                        var forderung = JSON.parse(forderungdaten);
                        
                        //Liefere geänderte Repräsentation...
                        res.set("Content-Type", 'application/json').status(200).json(forderung).end();                  	        
                    });
                }
                
                //Forderung nicht vorhanden 
                else {
                    res.status(404).end();    
                }
            });
        }    
    });
});


//Ändert den Zustand einer Forderung 
app.put('/:AustragungsortId/Kickertisch/:TischId/Forderung/', function(req, res) {

    var contentType = req.get('Content-Type');

    //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json" && contentType != "application/json; charset=UTF-8") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json").status(415).send("Content Type is not supported").end();
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

                var Forderung = req.body;

                client.mget('Belegung '+tischId,function(err,belegungdaten){

                    var belegung = JSON.parse(belegungdaten);

                    client.incr('ForderungId', function(err, id) {

                        var timestamp = moment().format();

                        var forderungObj={
                            //Set von Benutzern required
                            'id': id,
                            'Benutzer':Forderung.Benutzer,
                            'Timestamp': timestamp
                        };
                        
                       

                        for(var i=0;i<belegung.Forderungen.length;i++) {
                            
                            if(Forderung.Benutzer == belegung.Forderungen[i].Benutzer) {
                                 res.status(409).end();
                                return;
                            }
                        }
                        if(belegung.Teilnehmer != null) {
                        for(var i=0;i<belegung.Teilnehmer.length;i++) {
                            if( Forderung.Benutzer == belegung.Teilnehmer[i]) {
                                res.status(409).end();
                                return;
                            }
                        }
                        }

                        client.set('Forderung ' + id, JSON.stringify(forderungObj));

                        belegung.Forderungen.push({Benutzer : Forderung.Benutzer, Timestamp: timestamp});

                        client.set('Belegung ' + tischId, JSON.stringify(belegung));

                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json').status(200).json(forderungObj).end();
                    });
                });
            }
        });
    }
});


module.exports = app;