global.express = require('express');
global.redis = require('redis');
global.client = redis.createClient();
// nur zum debug
global.http = require('http');
global.faye = require('faye');
global.util = require('util');
// global.fs = require('fs');
// global.ejs = require("ejs");
global.async = require('async');

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

var client = new faye.Client('http://localhost:8000/faye');

// use res.render to load up an ejs view file

// index page 
app.get('/', function(req, res) {
    res.render('pages/index');
});


app.use('/Benutzer', require('./routes/benutzer_ressource'));
app.use('/Austragungsort', require('./routes/austragungsort_ressource'));
app.use('/Liveticker', require('./routes/liveticker_ressource'));
app.use('/Community', require('./routes/community_ressource'));
app.use('/Herausforderung', require('./routes/herausforderung_ressource'));
app.use('/Turnier', require('./routes/turnier_ressource'));
app.use('/Match', require('./routes/match_ressource'));
app.use('/Regelwerk', require('./routes/regelwerk_ressource'));


// Start the server
app.listen(app.get('port'), function () {
  console.log('Server is listening on port ' + app.get('port'));
});

server.listen(8000, function() {
    console.log("Server listens on Port 8000.");
});