global.express = require('express');
global.redis = require('redis');
global.client = redis.createClient();
// nur zum debug
global.http = require('http');
global.util = require('util');
// global.fs = require('fs');
// global.ejs = require("ejs");

var app = express();
var bodyParser = require('body-parser');

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.json());

app.use(express.static(__dirname + '/views'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page 
app.get('/', function(req, res) {
    res.render('pages/index');
});


app.use('/Kickertisch', require('./routes/kickertisch_ressource'));
app.use('/Liveticker', require('./routes/liveticker_ressource'));
app.use('/Community', require('./routes/community_ressource'));
app.use('/Herausforderung', require('./routes/herausforderung_ressource'));
app.use('/Turnier', require('./routes/turnier_ressource'));
app.use('/Match', require('./routes/match_ressource'));


// Start the server
app.listen(app.get('port'), function () {
  console.log('Server is listening on port ' + app.get('port'));
});

