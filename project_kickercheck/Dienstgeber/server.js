global.express = require('express');
global.redis = require('redis');
global.client = redis.createClient();
// nur zum debug
global.util = require('util');

var app = express();
var bodyParser = require('body-parser');

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json());

app.use('/Benutzer', require('./routes/benutzer_ressource'));
app.use('/Austragungsort', require('./routes/austragungsort_ressource'));
app.use('/Match', require('./routes/match_ressource'));
app.use('/Turnier', require('./routes/turnier_ressource'));

// Start the server
app.listen(app.get('port'), function () {
  console.log('Server is listening on port ' + app.get('port'));
});