var app = express.Router();

app.get('/addBenutzer', function(req, res) {
    res.render('pages/addBenutzer');
});

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

app.delete('/:BenutzerId', function(req, res) {

    var benutzerId = req.params.BenutzerId;

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer/'+benutzerId,
        method: 'DELETE'
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            res.end();


        });

    });

    externalRequest.end();
});

module.exports = app;