global.express = require('express');
global.redis = require('redis');
global.client = redis.createClient();

var app = express();
var bodyParser = require('body-parser');

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.json());

app.use('/Kickertisch', require('./routes/kickertisch_ressource'));
app.use('/Liveticker', require('./routes/liveticker_ressource'));
app.use('/Community', require('./routes/community_ressource'));
app.use('/Herausforderung', require('./routes/herausforderung_ressource'));


// Start the server
app.listen(app.get('port'), function () {
  console.log('Server is listening on port ' + app.get('port'));
});

