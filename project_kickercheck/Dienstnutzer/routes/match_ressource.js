var app = express.Router();

app.get('/addMatch', function(req, res) {
	
	 var options1 = {
        host: "localhost",
        port: 3000,
        path: "/Benutzer",
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      
       var options2 = {
        host: "localhost",
        port: 3000,
        path: "/Austragungsort",
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      
      var x = http.request(options1, function(externalResponse){
	      
	       var y = http.request(options2, function(externalrep){
      
            externalResponse.on("data", function(chunk){

                var benutzerAll = JSON.parse(chunk);
                
                
            externalrep.on("data", function(chunks){

                var austragungsorte = JSON.parse(chunks);
                
                   res.render('pages/addMatch',{benutzerAll:benutzerAll,austragungsorte:austragungsorte});
       
                res.end();
            
             
            });
    
  });

            });
                   
    
      y.end();
    
  });
    x.end();
  
});

app.get('/alleMatches', function(req, res) {
	
      var options = {
        host: "localhost",
        port: 3000,
        path: "/Match",
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      var externalRequest = http.request(options, function(externalResponse){
      
            externalResponse.on("data", function(chunk){

                var matches = JSON.parse(chunk);
                res.render('pages/allematches',{matches:matches});
                res.end();
            });
    
  });
         
      externalRequest.end();
});
	

app.get('/:MatchId', function(req, res) {
	
	 var belegungen=[];   
    
      client.keys('Belegung *', function (err, key) {

	client.mget(key,function(err,belegung){
	
		     
        //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
       belegung.forEach(function (val) {
	
       belegungen.push(JSON.parse(val));
       
            });
	
	  
    var options1 = {
        host: 'localhost',
        port: 3000,
        path: '/Match/'+req.params.MatchId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };
          
  var x = http.request(options1, function(externalres){
	  
	 
      
             externalres.on('data', function(chunk){
           
     var match = JSON.parse(chunk);
     
  

	 var ortURI = match.Austragungsort.split("/");
	 var ort = "/"+ortURI[1]+"/"+ortURI[2];
	 
     console.log(ort);
  
        var options2 = {
        host: "localhost",
        port: 3001,
        path: ort+"/allekickertische/",
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      
          var options3 = {
        host: "localhost",
        port: 3000,
        path: ort,
        method:"GET",
        headers:{
          accept:"application/json"
        }
      }
      
 
	      
	       var y = http.request(options2, function(externalrep){
                
            externalrep.on("data", function(chunks){

                var kickertische = JSON.parse(chunks);
                
                  var z = http.request(options3, function(externalrepz){
                
            externalrepz.on("data", function(chunkz){

                var austragungsort = JSON.parse(chunkz);
                
               res.render('pages/einmatch', { match: match, kickertische: kickertische, austragungsort: austragungsort, belegungen: belegungen });
       
             
            });
    
  });
  	z.end();
            });
  });
    y.end(); 
});

});
x.end();
});
	});
	
	});

app.post('/', function(req, res) {
	
    // Speichert req.body
    var MatchAnfrage = req.body;
    
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
      path: '/Match',
      method: 'POST',
      headers: headers
    };
    
    var externalRequest = http.request(options, function(externalResponse) {

if(externalResponse.statusCode == 400){
	 res.status(400).end();
	 };
	 
  externalResponse.on('data', function (chunk) {
    
   var match = JSON.parse(chunk);

  console.log(util.inspect(match, false, null));
   
    res.json(match);
    res.end();
   

});

 });
 
 var Regelwerk=
    {
            "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
            "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm",
            "Spielstand":{
                "SpielstandT1":0,
                "SpielstandT2":0
            }
    }
    
    MatchAnfrage.Regelwerk = Regelwerk;
 
externalRequest.write(JSON.stringify(MatchAnfrage));

externalRequest.end();

});

app.put('/:MatchId', function(req, res) {

		var MatchDaten = req.body;
		var matchId = req.params.MatchId;
		
    
   console.log(util.inspect(MatchDaten, false, null));

    // HTTP Header setzen
    var headers = {
      'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/Match/'+matchId,
      method: 'PUT',
      headers: headers
    };
    
      var externalRequest = http.request(options, function(externalResponse) {

	 
  externalResponse.on('data', function (chunk) {
    
   var changeMatch = JSON.parse(chunk);

  console.log(util.inspect(changeMatch, false, null));
  
   
    res.json(changeMatch);
    res.end();
   

});

 });
 
  var Regelwerk=
    {
            "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
            "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm",
            "Spielstand":{
                "SpielstandT1":MatchDaten.spielstand1,
                "SpielstandT2":MatchDaten.spielstand2
            }
    }
    
    MatchDaten.Regelwerk = Regelwerk;
    
 
externalRequest.write(JSON.stringify(MatchDaten));

externalRequest.end();

	   	});

module.exports = app;