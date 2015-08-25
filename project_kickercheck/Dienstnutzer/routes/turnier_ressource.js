var app = express.Router();

app.get('/addTurnier', function(req, res) {
    
    res.render('pages/addTurnier');
});

app.get('/alleTurniere', function(req, res) {
	
      var options = {
        host: "localhost",
        port: 3000,
        path: "/Turnier",
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      var externalRequest = http.request(options, function(externalResponse){
      
            externalResponse.on("data", function(chunk){

                var turniere = JSON.parse(chunk);
                res.render('pages/alleturniere',{turniere:turniere});
                res.end();
            });
    
  });
         
      externalRequest.end();
});
	

app.post('/', function(req, res) {
	
    // Speichert req.body
    var TurnierAnfrage = req.body;
    
    /*
	    
	    BODY:
	    
	    {
	"Teilnehmeranzahl":10,
	"Teamgroesse":2,
	"Typ":"Kickerturnier"
	}   
	    
	    
	    */
   

    // HTTP Header setzen
    var headers = {
      'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/Turnier',
      method: 'POST',
      headers: headers
    };
    
    var externalRequest = http.request(options, function(externalResponse) {

if(externalResponse.statusCode == 400){
	 res.status(400).end();
	 };
	 
  externalResponse.on('data', function (chunk) {
    
   var turnierplan = JSON.parse(chunk);

  console.log(util.inspect(turnierplan, false, null));
   
    res.json(turnierplan);
    res.end();
   

});

 });
 
externalRequest.write(JSON.stringify(TurnierAnfrage));

externalRequest.end();

});

app.get('/:TurnierId', function(req, res) {
	
	 var options1 = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier/'+req.params.TurnierId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };
	
	 var options2 = {
        host: "localhost",
        port: 3000,
        path: "/Benutzer",
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      
      
         var x = http.request(options1, function(externalResponse){
	         
      var y = http.request(options2, function(externalrep){
	      
	    
      
            externalResponse.on("data", function(chunk){

				
				 var turnier = JSON.parse(chunk);
				 

                
            externalrep.on("data", function(chunks){

                var benutzerAll = JSON.parse(chunks);
                
                 res.render('pages/einturnier', {
                turnier: turnier ,benutzerAll:benutzerAll                     
            });
                     res.end();
                
                        
            
             
            });
    
  });

            });
                   
    
      y.end();
    
  });
    x.end();
  
   
});

app.put('/:TurnierId/Teilnehmer', function(req, res) {
	
    // Speichert req.body
    var Teilnehmer = req.body;
 console.log(Teilnehmer);
    var turnierId = req.params.TurnierId;

    // HTTP Header setzen
    var headers = {
      'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/Turnier/'+turnierId+'/Teilnehmer',
      method: 'PUT',
      headers: headers
    };
    
    var externalRequest = http.request(options, function(externalResponse) {

 if(externalResponse.statusCode == 409){
	 res.status(409).end();
	 };
	 
  externalResponse.on('data', function (chunk) {
    
   var completeTurnierplan = JSON.parse(chunk);

  console.log(util.inspect(completeTurnierplan, false, null));
   
    res.json(completeTurnierplan);
    res.end();
   

});

 });
 
externalRequest.write(JSON.stringify(Teilnehmer));

externalRequest.end();

});

	app.put('/:TurnierId', function(req, res) {

		var TurnierDaten = req.body;
		var turnierId = req.params.TurnierId;
		
		 /*
	    
	    BODY:
	    
	 {
	"Austragungszeitraum":"10.11.2015",
	"Status":"aktiv"
}   
	    
	    
	    */
    
   console.log(util.inspect(TurnierDaten, false, null));

    var responseString = '';

    // HTTP Header setzen
    var headers = {
      'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/Turnier/'+turnierId,
      method: 'PUT',
      headers: headers
    };
    
      var externalRequest = http.request(options, function(externalResponse) {

	 
  externalResponse.on('data', function (chunk) {
    
   var completeTurnierplan = JSON.parse(chunk);

  console.log(util.inspect(completeTurnierplan, false, null));
   
    res.json(completeTurnierplan);
    res.end();
   

});

 });
 
externalRequest.write(JSON.stringify(TurnierDaten));

externalRequest.end();

	   	});

module.exports = app;