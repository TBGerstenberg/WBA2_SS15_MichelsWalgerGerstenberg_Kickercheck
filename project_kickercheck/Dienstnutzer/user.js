global.express = require('express');
global.redis = require('redis');
global.client = redis.createClient();
global.http = require('http');
global.faye = require('faye');
global.async = require('async');
global.moment = require('moment');
// debug
global.util = require('util');

var app = express();
var server = http.createServer(app);
var bodyParser = require('body-parser');

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.json());

app.use(express.static(__dirname + '/views'));

// set the view engine to ejs
app.set('view engine', 'ejs');

var bayeux = new faye.NodeAdapter({
    mount: '/faye',
})

bayeux.attach(server);

// use res.render to load up an ejs view file

// index page 
app.get('/', function(req, res) {
    res.render('pages/index');
});


app.use('/Benutzer', require('./routes/benutzer_ressource'));
app.use('/Austragungsort', require('./routes/austragungsort_ressource'));
app.use('/Herausforderung', require('./routes/herausforderung_ressource'));
app.use('/Turnier', require('./routes/turnier_ressource'));
app.use('/Match', require('./routes/match_ressource'));


// Objekte erstellen und Demodaten in DB legen
app.route('/startdemo').get(function(req, res) {
    // User
    var benutzer1Obj={
        'id' : 1,
        'Name': 'Otto',
        'Alter': '45',
        'Bild': '',
        'isActive': 1
    };

    var benutzer2Obj={
        'id' : 2,
        'Name': 'Peter',
        'Alter': '23',
        'Bild': '',
        'isActive': 1
    };
    var benutzer3Obj={
        'id' : 3,
        'Name': 'Günther',
        'Alter': '14',
        'Bild': '',
        'isActive': 1
    };
    var benutzer4Obj={
        'id' : 4,
        'Name': 'Hans',
        'Alter': '42',
        'Bild': '',
        'isActive': 1
    };
    var benutzer5Obj={
        'id' : 5,
        'Name': 'Michael',
        'Alter': '30',
        'Bild': '',
        'isActive': 1
    };
    var benutzer6Obj={
        'id' : 6,
        'Name': 'Andreas',
        'Alter': '46',
        'Bild': '',
        'isActive': 1
    };
    var benutzer7Obj={
        'id' : 7,
        'Name': 'Rüdiger',
        'Alter': '22',
        'Bild': '',
        'isActive': 1
    };
    var benutzer8Obj={
        'id' : 8,
        'Name': 'Karl',
        'Alter': '17',
        'Bild': '',
        'isActive': 1
    };

    var austragungsort1Obj={
        'id' : 1,
        'Name': 'Gummersbach',
        'Adresse': 'Steinmüllerallee 1',
        'Beschreibung': 'Eine Austragungsort-Beschreibung'
    };
       var austragungsort2Obj={
        'id' : 2,
        'Name': 'Köln',
        'Adresse': 'Teststr. 39',
        'Beschreibung': 'Eine Austragungsort-Beschreibung'
    };

    client.set('Austragungsort 1', JSON.stringify(austragungsort1Obj));
    client.set('Austragungsort 2', JSON.stringify(austragungsort2Obj));


    client.set('Benutzer 1', JSON.stringify(benutzer1Obj));
    client.set('Benutzer 2', JSON.stringify(benutzer2Obj));
    client.set('Benutzer 3', JSON.stringify(benutzer3Obj));
    client.set('Benutzer 4', JSON.stringify(benutzer4Obj));
    client.set('Benutzer 5', JSON.stringify(benutzer5Obj));
    client.set('Benutzer 6', JSON.stringify(benutzer6Obj));
    client.set('Benutzer 7', JSON.stringify(benutzer7Obj));
    client.set('Benutzer 8', JSON.stringify(benutzer8Obj));

    res.status(200).render('pages/demo');
});

app.use(function(req, res, next) {
    res.status(404).render('pages/404');
});

client.on('error', function (err) {
    console.log(err);
    process.exit(1);  
});

// Start the server
app.listen(app.get('port'), function () {
    console.log('User is listening on port ' + app.get('port'));
});

server.listen(8000, function() {
    console.log("Liveticker listens on Port 8000.");
});