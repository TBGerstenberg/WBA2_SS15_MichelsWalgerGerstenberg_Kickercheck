global.express = require('express');
global.redis = require('redis');
global.app = express();
global.client = redis.createClient();

var bodyParser     = require('body-parser');

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.json());

// Routes are in app/routes.js
app.use('/', require('./RouteMap.js'));


// Start the server
app.listen(app.get('port'), function () {
  console.log('Server is listening on port ' + app.get('port'));
});

module.exports.express = app;