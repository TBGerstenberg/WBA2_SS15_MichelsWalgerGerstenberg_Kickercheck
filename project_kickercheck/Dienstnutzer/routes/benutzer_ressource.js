var app = express.Router();

//Präsentationslogik 

//Unterseite zum hinzufügen eines Benutzers
app.get('/addBenutzer', function(req, res) {
    res.render('pages/addBenutzer');
});

//Unterseite die die Liste aller Benutzer darstellt
app.get('/alleBenutzer', function(req, res) {

    var options = {
        host: "localhost",
        port: 3000,
        path: "/Benutzer",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }
    var externalRequest = http.request(options, function(externalResponse){

        externalResponse.on("data", function(chunk){

            var benutzerAll = JSON.parse(chunk);
            res.render('pages/allebenutzer',{benutzerAll:benutzerAll});
            res.end();
        });
    });
    externalRequest.end();
});

//Unterseite die die Ansicht eines Benutzers darstellt 
app.get('/:BenutzerId', function(req, res) {

    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer/'+req.params.BenutzerId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };

    var x = http.request(options, function(externalres){
        externalres.on('data', function(chunk){

            var benutzer = JSON.parse(chunk);

            res.render('pages/einbenutzer', { benutzer: benutzer });
        });
    });                     
    x.end();
});

/*
// Ressourcen des Dienstnutzers ,
// die ebenfalls über REST-methoden zugänglich sind und damit in gewisser weise 
// eine Erweiterung der Dienstgeber Capability zugeschnitten auf Kickersport darstellen
//
//
*/

//Leitet eine POST-Benutzer Anfrage an den Dienstgeber weiter
app.post('/', function(req, res) {

    // Speichert req.body
    var BenutzerAnfrage = req.body;


    // HTTP Header setzen
    var headers = {
         'Accept' : 'application/json',
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer',
        method: 'POST',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {

        //console.log(JSON.stringify(externalResponse.headers.location));

        if(externalResponse.statusCode == 400){
            res.status(400).end();
        };

        externalResponse.on('data', function (chunk) {

            var benutzer = JSON.parse(chunk);
            res.json(benutzer);
            res.end();
        });

    });

    externalRequest.write(JSON.stringify(BenutzerAnfrage));
    externalRequest.end();
});

//Leitet eine Benutzer - PUT anfrage an den Dienstgeber weiter 
app.put('/:BenutzerId', function(req, res) {

    var BenutzerDaten = req.body;
    var benutzerId = req.params.BenutzerId;


   // console.log(util.inspect(BenutzerDaten, false, null));

    // HTTP Header setzen
    var headers = {
         'Accept' : 'application/json',
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer/'+benutzerId,
        method: 'PUT',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            var changeBenutzer = JSON.parse(chunk);

         //   console.log(util.inspect(changeBenutzer, false, null));

            res.json(changeBenutzer);
            res.end();


        });

    });

    externalRequest.write(JSON.stringify(BenutzerDaten));

    externalRequest.end();

});

//Löscht einen Benutzer
app.delete('/:BenutzerId', function(req, res) {

    var benutzerId = req.params.BenutzerId;

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        path: '/Benutzer/'+benutzerId,
        port: 3000,
        method: 'delete'
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            console.log('pokpok');
            res.status(200).end();


        });

    });

    externalRequest.end();
});

app.delete('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
    var benutzerId = req.params.BenutzerId;
    //Extrahiere Id aus der Anfrage 
    var HerausforderungId = req.params.HerausforderungId;

    //Prüfe ob Lokalitaet existiert 
    client.exists('Benutzer '+benutzerId+' Herausforderung ' + herausforderungId, function(err, IdExists) {

        //Lokalitaet existiert 
        if(IdExists) {
            console.log("ES IST DA");
            //Entferne EIntrag aus der Datenbank 
            client.del('Benutzer '+benutzerId+' Herausforderung ' + herausforderungId);

            //Alles ok , sende 200 
            res.status(204).send("Das hat funktioniert! Herausforderung gelöscht");

            //Antwort beenden
            res.end();
        }

        else {
            console.log("GAR NICHT MEHR");
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }
    });
    
});

app.get('/:BenutzerId/alleHerausforderungen', function(req, res) {
    
    var benutzerId = req.params.BenutzerId;
    //Speichert alle Herausforderungen
    var response=[];    

    //returned ein Array aller Keys die das Pattern Herausforderung* matchen 
    client.keys('Benutzer '+benutzerId+' Herausforderung *', function (err, key) {

        if(key.length == 0) {
            res.render('pages/alleHerausforderungen',{response:response});
            return;
        }

        client.mget(key, function (err, Herausforderung) {

            //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
            Herausforderung.forEach(function (val) {
                response.push(JSON.parse(val));
            });
            
            
            //res.set("Content-Type","application/json");
            res.render('pages/alleHerausforderungen',{response:response});
            res.end();

        });

    });
    
})


app.get('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
    var herausforderungId = req.params.HerausforderungId;
    var benutzerId = req.params.BenutzerId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Benutzer '+benutzerId+' Herausforderung ' + herausforderungId, function(err, IdExists) {

        //Lokalitaet kennt einen Tisch mit dieser TischId
        if (IdExists) {

            //Ermittle vom Client unterstützte content types 
            var acceptedTypes = req.get('Accept');

            switch (acceptedTypes) {

                    //Client kann application/json verarbeiten 
                case "application/json":
                    
                   
                        client.mget('Benutzer '+benutzerId+' Herausforderung ' + herausforderungId, function(err,HerausforderungDaten){

                        var HerausforderungDaten= JSON.parse(HerausforderungDaten);
                            
                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json').status(200).json(HerausforderungDaten).end();
                    });       
                    break;

                default:

                    //We cannot send a representation that is accepted by the client 
                    res.status(406);
                    res.set("Accepts", "application/json");
                    res.end();

                    break;
            }
        }       
        //Unbekannt
        else {
            res.status(404).send("Die Ressource wurde nicht gefunden herausfor.");
            res.end();
        }
    });
    
});

app.put('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
});

app.post('/:BenutzerId/Herausforderung', function(req, res) {

    var Herausforderung = req.body;
    var benutzerId = req.params.BenutzerId;
    

    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage json ist
    
    if (contentType != "application/json") {
        res.set("Accepts", "application/json");
        res.status(406).send("Content Type is not supported");
        res.end();
    }

    else {

        //Inkrementiere  in der DB , atomare Aktion 
        client.incr('HerausforderungId', function(err, id) {

            var HerausfoderungObj={
                'id' : id,
                'Herausforderer': Herausforderung.Herausforderer,
                'Datum': Herausforderung.Datum,
                'Kurztext' : Herausforderung.Kurztext
            };
            console.log('Benutzer '+benutzerId+' Herausforderung '); 
            client.set('Benutzer '+benutzerId+' Herausforderung ' + id, JSON.stringify(HerausfoderungObj));
            //Pflege Daten über den Kickertisch in die DB ein 

            //Teile dem Client die URI der neu angelegten Ressource mit 
            res.set("Location", "/Benutzer/"+benutzerId+"/Herausforderung/" + id);

            //Setze content type der Antwort 
            res.set("Content-Type","application/json");

            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
            res.json(HerausfoderungObj);

            //Antwort beenden 
            res.end();
        });
    }    
});

module.exports = app;