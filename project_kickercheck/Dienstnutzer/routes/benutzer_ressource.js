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


//Löscht eine Herausforderung an einen Nutzer
app.delete('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
    //Extrahiere Id's aus der Anfrage 
    var benutzerId = req.params.BenutzerId;
    var HerausforderungId = req.params.HerausforderungId;

    //Prüfe ob die Herausforderung existiert
    client.exists('einBenutzer '+benutzerId+' Herausforderung ' + HerausforderungId, function(err, IdExists) {

        if(IdExists) {
            //Entferne Eintrag aus der Datenbank 
            client.del('einBenutzer '+benutzerId+' Herausforderung ' + HerausforderungId);

            //Löschen hat geklappt , sende 204 
            res.status(204).end();
        }
        
        // Die Herausforderung existiert nicht
        else {
            res.status(404).end();
        }
    });
    
});


app.get('/:BenutzerId/addHerausforderung', function(req, res) {
    
       var options1 = {
        host: "localhost",
        port: 3000,
        path: "/Benutzer",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }
    
    var x = http.request(options1, function(externalResponse){
        
        externalResponse.on("data", function(chunk){

                var benutzerAll = JSON.parse(chunk);
            
            res.render('pages/addHerausforderung',{benutzerAll:benutzerAll});

            res.end();
        });
    })
    x.end();
});

//Liefert alle Herausforderungen für einen Bestimmten Benutzer
app.get('/:BenutzerId/alleHerausforderungen', function(req, res) {
    
    //Id's extrahieren
    var benutzerId = req.params.BenutzerId;
    //Speichert alle Herausforderungen
    var response=[];    

    //returned ein Array aller Keys die das Pattern einBenutzerBenuterIDHerausforderung* matchen 
    client.keys('einBenutzer '+benutzerId+' Herausforderung *', function (err, key) {

        //Wenn kein Key das Pattern Herausforderung* gematcht hat
        if(key.length == 0) {
            res.render('pages/alleHerausforderungen',{response:response});
            return;
        }

        client.mget(key, function (err, Herausforderung) {

            //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
            Herausforderung.forEach(function (val) {
                response.push(JSON.parse(val));
            });

            res.render('pages/alleHerausforderungen',{response:response});
            res.end();

        });
    });
})

app.get('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
    //Extrahiere Id's
    var herausforderungId = req.params.HerausforderungId;
    var benutzerId = req.params.BenutzerId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('einBenutzer '+benutzerId+' Herausforderung ' + herausforderungId, function(err, IdExists) {

        //Lokalitaet kennt einen Tisch mit dieser TischId
        if (IdExists) {

            //Ermittle vom Client unterstützte content types 
            var acceptedTypes = req.get('Accept');

            switch (acceptedTypes) {

                //Client kann application/json verarbeiten 
                case "application/json":
                
                    client.mget('einBenutzer '+benutzerId+' Herausforderung ' + herausforderungId, function(err,HerausforderungDaten){
                        var HerausforderungDaten= JSON.parse(HerausforderungDaten);
                        //Setze Contenttype der Antwort auf application/json, sende Statuscode 200.
                        res.set("Content-Type", 'application/json').status(200).json(HerausforderungDaten).end();
                        
                    });       
                    break;

                default:
                    //We cannot send a representation that is accepted by the client 
                    res.status(406).set("Accepts", "application/json").end();
                    break;
            }
        }       
        //Es gibt die angefragte Herausforderung nicht
        else {
            res.status(404).end();
        }
    });
    
});

//Poste eine Herausforderung
app.post('/:BenutzerId/Herausforderung', function(req, res) {

    var Herausforderung = req.body;
    var benutzerId = req.params.BenutzerId;
    

    var contentType = req.get('Content-Type');

    
    //Check ob der Content Type der Anfrage json ist
    if (contentType != "application/json") {
        res.set("Accepts", "application/json").status(406).end();
    }

    else {

        //Inkrementiere  in der DB , atomare Aktion 
        client.incr('HerausforderungId', function(err, id) {

            //Baue JSON zusammen
            var HerausfoderungObj={
                'id' : id,
                'Herausforderer': Herausforderung.Herausforderer,
                'Datum': Herausforderung.Datum,
                'Kurztext' : Herausforderung.Kurztext
            };

            //Pflege Daten über den Kickertisch in die DB ein 
            client.set('einBenutzer '+benutzerId+' Herausforderung ' + id, JSON.stringify(HerausfoderungObj));

            //Teile dem Client die URI der neu angelegten Ressource mit, Setze Content-Type der Antwort
            res.set("Location", "/Benutzer/"+benutzerId+"/Herausforderung/" + id).set("Content-Type","application/json");

            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an, und Schreibe JSON in den Body 
            res.json.(HerausfoderungObj).status(201).end();
        });
    }    
});

module.exports = app;