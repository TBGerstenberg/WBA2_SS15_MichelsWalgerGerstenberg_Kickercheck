global.express = require('express');
global.redis = require('redis');
global.client = redis.createClient();
// nur zum debug
global.http = require('http');
global.faye = require('faye');
global.util = require('util');
// global.fs = require('fs');
// global.ejs = require("ejs");

var app = express();
var server = http.createServer();
var bodyParser = require('body-parser');

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.json());

app.use(express.static(__dirname + '/views'));

// set the view engine to ejs
app.set('view engine', 'ejs');

var bayeux = new faye.NodeAdapter({
	mount: '/faye'
})

bayeux.on('handshake', function(clientId) {
    console.log('Client connected', clientId);
});


bayeux.attach(server);

var client = new faye.Client('http://localhost:3001/faye');

var subscription = client.subscribe('/news', function(message) {
	console.log('Ereignis'+message.author+' : '+message.content);
})

app.post('/news',function(req,res) {
	
	var publication = client.publish('/news',{
		'author' : req.body.author,
		'content' : req.body.content });
		
		publication.then (
			function() {
				console.log('Nachricht gesendet');
				res.writeHead(200,"OK");
				res.write('gesendet');
				res.end();
			},
			function(error) {
				console.log('leidernein');
				next(error);
			}
		);

});

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

