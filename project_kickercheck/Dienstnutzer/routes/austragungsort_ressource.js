var app = express.Router();

app.get('/addAustragungsort', function(req, res) {
    res.render('pages/addAustragungsort');
});

app.get('/alleAustragungsorte', function(req, res) {
	
      var options = {
        host: "localhost",
        port: 3000,
        path: "/Austragungsort",
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      var externalRequest = http.request(options, function(externalResponse){
      
            externalResponse.on("data", function(chunk){

                var austragungsorte = JSON.parse(chunk);
                res.render('pages/alleaustragungsorte',{austragungsorte:austragungsorte});
                res.end();
            });
    
  });
         
      externalRequest.end();
});
	

app.get('/:AustragungsortId', function(req, res) {
  
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Austragungsort/'+req.params.AustragungsortId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };
    
    var x = http.request(options, function(externalres){
        externalres.on('data', function(chunk){
           
            var austragungsort = JSON.parse(chunk);
  
			console.log('ort:'+austragungsort);
			
             console.log(util.inspect(austragungsort, false, null));
             
            res.render('pages/einaustragungsort', { austragungsort: austragungsort });
        });
    });                     
    x.end();
});

app.post('/', function(req, res) {
	
    // Speichert req.body
    var AustragungsortAnfrage = req.body;
   

    // HTTP Header setzen
    var headers = {
      'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/Austragungsort',
      method: 'POST',
      headers: headers
    };
    
    var externalRequest = http.request(options, function(externalResponse) {

if(externalResponse.statusCode == 400){
	 res.status(400).end();
	 };
	 
  externalResponse.on('data', function (chunk) {
    
   var austragungsort = JSON.parse(chunk);

  console.log(util.inspect(austragungsort, false, null));
   
    res.json(austragungsort);
    res.end();
   

});

 });
 
 
externalRequest.write(JSON.stringify(AustragungsortAnfrage));

externalRequest.end();

});

app.put('/:AustragungsortId', function(req, res) {

		var AustragungsortDaten = req.body;
		var austragungsortId = req.params.AustragungsortId;
		
    
   console.log(util.inspect(AustragungsortDaten, false, null));

    // HTTP Header setzen
    var headers = {
      'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/Austragungsort/'+austragungsortId,
      method: 'PUT',
      headers: headers
    };
    
      var externalRequest = http.request(options, function(externalResponse) {

	 
  externalResponse.on('data', function (chunk) {
    
   var changeAustragungsort = JSON.parse(chunk);

  console.log(util.inspect(changeAustragungsort, false, null));
   
    res.json(changeAustragungsort);
    res.end();
   

});

 });
 
externalRequest.write(JSON.stringify(AustragungsortDaten));

externalRequest.end();

	   	});

module.exports = app;