	//Redis.io NoSQL Datenbankmodul für Node.js einbinden 
	var redis =  require('redis');
	
	//Client für die Abfrage von Daten aus der Redis DB erzeugen 
	var client=redis.createClient();
	//Express Modul einbinden 
	var express=require('express');
	var bodyparser = require('body-parser');
	var parseXML = bodyparser.text({type:'application/xml'});
	var libxml = require('libxmljs');
	var xml2js = require('xml2js');
	var xml2jsParser = new xml2js.Parser();

	//Expressinstanz anlegen und in "app" ablegen 
	var app=express();
	
	//Setup für Datenbank
	client.SETNX("BenutzerId","0");
	client.SETNX("ForderungsId","0");
	client.SETNX("KickertischId","0");
	client.SETNX("MatchId","0");
	client.SETNX("StandortId","0");
	client.SETNX("AccountId","0");
	client.SETNX("TurnierId","0");
	
	// ACCOUNT // 
	// ACCOUNT // 
	
	//Account Methoden
	app.get('/Account/:AccountId', function(req, res){
	    
	    var accountId = req.params.AccountId;
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    var account = client.exists(req.params.AccountId);
	    
	    //Angegebener Key existiert nicht
	    if(account == 0){
	        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
	    }
	    
	    else{
	        var acceptedTypes= req.get('Accepts');
	        switch(acceptedTypes){
	        
	            case "text/html":
	                //Html repr. bauen 
	            
	            break;
	              
	            default:
	            //We cannot send a representation that is accepted by the client 
	            req.status(406).send("Content Type wird nicht unterstuetzt");
	    }
	    res.end();
	}
	});
	
	app.post('/Account', function(req, res){
		

	
	});
	
	app.put('/Account/:AccountId', function(req, res){
	
	
	});
	
	app.delete('/Account/:AccountId', function(req, res){
	
	
	});
	
	// / ACCOUNT // 
	// / ACCOUNT // 
	
	//  BENUTZER // 
	//  BENUTZER // 
	
	//Benutzer Methoden
	app.get('/Benutzer/:BenutzerId', function(req,res){
	    
	    
	  	var benutzerId = req.params.BenutzerId;
	   
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Benutzer ' +benutzerId,function(err,IdExists){
		 
		   client.hget('Benutzer ' +benutzerId,"isActive",function(err,benutzerValid) {
	
	        //client.exists hat false geliefert 
	        if(IdExists && benutzerValid == 1){
	
		var acceptedTypes= req.get('Accept');
	        switch(acceptedTypes){
	
	            case "text/html":
	                //Html repr. bauen
	                res.status(200).send("Benutzer: "+benutzerId);
	               
	            break;
	
	
	            default:
	                //We cannot send a representation that is accepted by the client 
	                res.status(406).send("Content Type wird nicht unterstuetzt");
	                break;
	
	        }
	                
	               res.end(); 
	        }
	        
	         else {
		           res.status(404).send("Die Ressource wurde nicht gefunden oder isActive auf 0.");
		            res.end();
	                
	            }
	           
	            });
	            });
	
	});
	
	app.post('/Benutzer',parseXML, function(req,res){
	
	xml2jsParser.parseString(req.body,function(err,xml) {
	
	 //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	    var contentType=req.get('Content-Type');
	    
	    //Check ob der Content Type der Anfrage xml ist 
	    if(contentType != "application/xml"){
	        res.set("Accepts","application/xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    }  
	    else {     
		    
		    client.incr('BenutzerId', function(err, id) {
	  
	  client.hmset('Benutzer ' +id,
	            {'Name':xml["root"]["Benutzer"][0]["Name"],
	            'Alter':xml["root"]["Benutzer"][0]["Alter"],
	            'Position':xml["root"]["Benutzer"][0]["Position"],
	            'Profilbild':xml["root"]["Benutzer"][0]["Profilbild"],
	            'isActive':1
	            });
	  
	  
	   res.set("Location","/Benutzer/"+ id);
	            res.status(201).send("Benutzer angelegt!");
	            //Antwort beenden 
	            res.end();
	  });
	  
	        }
	        });
   
	});
	
	app.put('/Benutzer/:BenutzerId', parseXML,function(req,res){
		
		xml2jsParser.parseString(req.body,function(err,xml) {
	    
	    var benutzerId = req.params.BenutzerId;
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    
	     client.exists('Benutzer '+benutzerId,function(err,IdExists){
		     
	    client.hget('Benutzer ' +benutzerId,"isActive",function(err,benutzerValid) {
	
	        //client.exists hat false geliefert 
	        if(IdExists && benutzerValid == 1){
		        
		         var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	            client.hmset('Benutzer ' +benutzerId,
	           {'Name':xml["root"]["Benutzer"][0]["Name"],
	            'Alter':xml["root"]["Benutzer"][0]["Alter"],
	            'Position':xml["root"]["Benutzer"][0]["Position"],
	            'Profilbild':xml["root"]["Benutzer"][0]["Profilbild"],
	            'isActive':1
	            });	   
	            
	            //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Benutzer geändert");
	                
	                //Antwort beenden
	                res.end();  
	             
		            }
	else {
		 res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
		     
	          }
	});
	   }); 
	   });
	   });
	
	app.delete('/Benutzer/:BenutzerId',parseXML, function(req,res){
	    
	var benutzerId = req.params.BenutzerId;
	  
	   client.exists('Benutzer '+req.params.BenutzerId,function(err,IdExists){
		   
	       
	        if(IdExists){
		        
		         var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	                }
	                
		        client.hmset('Benutzer ' +benutzerId,"isActive",0,function(err,benutzerSet) {
			        console.log(benutzerSet);
			        });
		        
	
	                
	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Benutzer gelöscht");
	                
	                //Antwort beenden
	                res.end();
		        
		       
	            }

	         else {

	                 res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	       
	            }
	            });
	            
	
	});
	
	// / BENUTZER // 
	// / BENUTZER // 
	
	// KICKERTISCH // 
	// KICKERTISCH // 
	
	//Kickertisch Methoden 
	
	app.get('/Kickertisch/:TischId', function(req,res){
	    
		var tischId = req.params.TischId;
		
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Kickertisch ' +tischId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
	
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		         
	                 var acceptedTypes= req.get('Accept');
	        switch(acceptedTypes){
	
	            case "text/html":
	                //Html repr. bauen
	                res.status(200).send("Tischnummer: "+tischId);
	               
	            break;
	
	
	            default:
	                //We cannot send a representation that is accepted by the client 
	                res.status(406).send("Content Type wird nicht unterstuetzt");
	                break;
	
	        }
	                
	               res.end(); 
	            }
	            });
	});
	
	/*Das Verb Post auf der Ressource Kickertisch legt eine neue Kicktisch Ressource an und liefert bei Erolg 
	einen 201 Statuscode mit einem Locationheader der neu erzeugten Ressource */
	app.post('/Kickertisch/',parseXML,function(req,res){
	    
	    xml2jsParser.parseString(req.body,function(err,xml) {
	    
	    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	    var contentType=req.get('Content-Type');
	    
	    //Check ob der Content Type der Anfrage xml ist 
	    if(contentType != "application/xml"){
	        res.set("Accepts","application/xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    }  
	    else {     
		    
		    client.incr('KickertischId', function(err, id) {
	            
	  client.hmset('Kickertisch ' +id,
	            {'Tischhersteller':xml["root"]["Kickertisch"][0]["Tischhersteller"],
	            'Modell':xml["root"]["Kickertisch"][0]["Modell"],
	            'Standort':xml["root"]["Kickertisch"][0]["Standort"],
	            'Zustand':xml["root"]["Kickertisch"][0]["Zustand"],
	            'Bild':xml["root"]["Kickertisch"][0]["Bild"]
	            });
	  
	  
	   res.set("Location","/Kickertisch/"+ id);
	            res.status(201).send("Kickertisch angelegt!");
	            //Antwort beenden 
	            res.end();
	  });
	     
	        }
	  });
	});
	
	/*Mit put kann das Bild eines Kickertischs und/oder seine Zustandsbeschreibung geändert werden*/
	app.put('/Kickertisch/:TischId/', parseXML , function(req,res){
	    
	     xml2jsParser.parseString(req.body,function(err,xml) {
		     
	    var tischId= req.params.TischId;
	    
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Kickertisch '+tischId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
		        
		        var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		         
	               //Kickertisch Information in die Datenbank einfügen 
	            client.hmset('Kickertisch ' +tischId,
	            {'Tischhersteller':xml["root"]["Kickertisch"][0]["Tischhersteller"],
	            'Modell':xml["root"]["Kickertisch"][0]["Modell"],
	            'Standort':xml["root"]["Kickertisch"][0]["Standort"],
	            'Zustand':xml["root"]["Kickertisch"][0]["Zustand"],
	            'Bild':xml["root"]["Kickertisch"][0]["Bild"]
	            });
	                            
	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Aenderungen angenommen");
	                
	                //Antwort beenden
	                res.end();
	            }
	            });
});
	});
	
	app.delete('/Kickertisch/:TischId' , function(req,res){
	    
	    var tischId = req.params.TischId;
	     //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	   client.exists('Kickertisch '+tischId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
		        
		        var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
	                
	        client.del('Kickertisch '+tischId);
	
	                
	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Kickertisch ist weg");
	                
	                //Antwort beenden
	                res.end();
	            }
	            });

	});
	
	
	// / KICKERTISCH // 
	// / KICKERTISCH //
	
	// KICKERTISCH -> FORDERUNGEN // 
	// KICKERTISCH -> FORDERUNGEN //
	
	//Subressource von Kickertisch: Forderungen Methoden
	app.post('/Kickertisch/:TischId/Forderungen',parseXML, function(req,res){
	            
	            xml2jsParser.parseString(req.body,function(err,xml) {
		           
		            
	           var tischId = req.params.TischId;
	            
	            //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	    var contentType=req.get('Content-Type');
	    
	    //Check ob der Content Type der Anfrage xml ist 
	    if(contentType != "application/xml"){
	        res.set("Accepts","application/xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    }  
	    else {    
		    
	        //Warte bis der id Zaehler erhoeht wurde 
	        client.incr('ForderungsId', function(err, fid) {
		        
	             client.hmset('Kickertisch '+tischId+ ' Forderung '+fid,{
	                    'Datum':xml["root"]["Forderung"][0]["Datum"],
	            'Uhrzeit':xml["root"]["Forderung"][0]["Uhrzeit"]}); 
	          
	           // res.set("Location","/Kickertisch/"+tischId+"/Forderungen/"+ fid);
	           
	            res.status(201).send("Forderung für Kickertisch angelegt!");
	            //Antwort beenden 
	            res.end();
	        });
	        }
			});
	});
	
	app.delete('/Kickertisch/:TischId/Forderungen/:ForderungsId/', function(req,res){
	//Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	
		var tischId = req.params.TischId;
		var forderungsId = req.params.ForderungsId;
	
	   client.exists('Kickertisch '+tischId+ ' Forderung '+req.params.ForderungsId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
		        
		        var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		       
			 	
		         client.del('Kickertisch '+tischId+ ' Forderung '+forderungsId); 
			  
				//Alles ok , sende 200 
	               res.status(200).send("Das hat funktioniert! Geloescht.");
	                res.end();

	}
	});
	});
	
	// / KICKERTISCH -> FORDERUNGEN // 
	// / KICKERTISCH -> FORDERUNGEN //
	
	// MATCH // 
	// MATCH //

	//Match Methoden
	app.get('/Match/:MatchId', function(req,res){
		
		var matchId = req.params.MatchId;
		
		 //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match ' +matchId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
	
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		         
	                 var acceptedTypes= req.get('Accept');
	        switch(acceptedTypes){
	
	            case "text/html":
	                //Html repr. bauen
	                res.status(200).send("Match: "+matchId);
	               
	            break;
	
	
	            default:
	                //We cannot send a representation that is accepted by the client 
	                res.status(406).send("Content Type wird nicht unterstuetzt");
	                break;
	
	        }
	                
	               res.end(); 
	            }
	            });
		
		
	});
	app.post('/Match', parseXML, function(req,res){
		
		xml2jsParser.parseString(req.body,function(err,xml) {
		
		 //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
	    var contentType=req.get('Content-Type');
	    
	    //Check ob der Content Type der Anfrage xml ist 
	    if(contentType != "application/xml"){
	        res.set("Accepts","application/xml");
	        res.status(406).send("Content Type is not supported");
	        res.end();
	    }  
	    else {     
		    
		    client.incr('MatchId', function(err, id) {
	  
	  client.hmset('Match ' +id,
	            {'Spieler 1':xml["root"]["Match"][0]["Spieler"][0],
		         'Spieler 2':xml["root"]["Match"][0]["Spieler"][1],
		         'Spieler 3':xml["root"]["Match"][0]["Spieler"][2],
		         'Spieler 4':xml["root"]["Match"][0]["Spieler"][3],
	            'Kickertisch':xml["root"]["Match"][0]["Kickertisch"],
	            'Datum':xml["root"]["Match"][0]["Datum"],
	            'Uhrzeit':xml["root"]["Match"][0]["Uhrzeit"],
	            'Spielstand':xml["root"]["Match"][0]["Spielstand"]
	            });
	  
	  
	   res.set("Location","/Match/"+ id);
	            res.status(201).send("Match angelegt!");
	            //Antwort beenden 
	            res.end();
	  });
	        }
	        });
	});
	app.put('/Match/:MatchId', parseXML,function(req,res){
		
		xml2jsParser.parseString(req.body,function(err,xml) {
			
		 var matchId = req.params.MatchId;
	    
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match '+matchId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
		        
		        var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		         
	               //Kickertisch Information in die Datenbank einfügen 
	            client.hmset('Match ' +matchId,
	            {'Spieler 1':xml["root"]["Match"][0]["Spieler"][0],
		         'Spieler 2':xml["root"]["Match"][0]["Spieler"][1],
		         'Spieler 3':xml["root"]["Match"][0]["Spieler"][2],
		         'Spieler 4':xml["root"]["Match"][0]["Spieler"][3],
	            'Kickertisch':xml["root"]["Match"][0]["Kickertisch"],
	            'Datum':xml["root"]["Match"][0]["Datum"],
	            'Uhrzeit':xml["root"]["Match"][0]["Uhrzeit"],
	            'Spielstand':xml["root"]["Match"][0]["Spielstand"]
	            });
	                            
	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Aenderungen angenommen");
	                
	                //Antwort beenden
	                res.end();
	            }
	            });
	            });
	});
	
	// / MATCH // 
	// / MATCH //
	
	// MATCH -> SPIELSTAND // 
	// MATCH -> SPIELSTAND //
	
	//Subressource von Match: Spielstand Methoden
	app.get('/Match/:MatchId/Spielstand', function(req,res){
		
		 var matchId = req.params.MatchId;
		 
		  //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match '+matchId,function(err,IdExists){
		    
		    client.hget('Match ' +matchId,"Spielstand",function(err,spielstandValid) {
	        
	        //client.exists hat false geliefert 
	        if(IdExists && spielstandValid){
	
	  var acceptedTypes= req.get('Accept');
	        switch(acceptedTypes){
	
	            case "text/html":
	                //Html repr. bauen
	                res.status(200).send("Spielstand: "+spielstandValid);
	               
	            break;
	
	
	            default:
	                //We cannot send a representation that is accepted by the client 
	                res.status(406).send("Content Type wird nicht unterstuetzt");
	                break;
	
	        }
	                
	               res.end(); 
	              
	
	        }
	         else {
		         
		         res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	               
	            }
	            });
	            
	         });
	            
	  	});
	
	app.put('/Match/:MatchId/Spielstand',parseXML, function(req,res){
		
		xml2jsParser.parseString(req.body,function(err,xml) {
	
			
		 var matchId = req.params.MatchId;
	    
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Match '+matchId,function(err,IdExists){
		    
		     client.hget('Match ' +matchId,"Spielstand",function(err,spielstandValid) {
	        
	        //client.exists hat false geliefert 
	       if(IdExists && spielstandValid){
		       
		         client.hmset('Match ' +matchId,
	            {'Spieler 1':xml["root"]["Match"][0]["Spieler"][0],
		         'Spieler 2':xml["root"]["Match"][0]["Spieler"][1],
		         'Spieler 3':xml["root"]["Match"][0]["Spieler"][2],
		         'Spieler 4':xml["root"]["Match"][0]["Spieler"][3],
	            'Kickertisch':xml["root"]["Match"][0]["Kickertisch"],
	            'Datum':xml["root"]["Match"][0]["Datum"],
	            'Uhrzeit':xml["root"]["Match"][0]["Uhrzeit"],
	            'Spielstand':xml["root"]["Match"][0]["Spielstand"]
	            });
	                            
	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Spielstand geändert auf "+xml["root"]["Match"][0]["Spielstand"]);
	                
	                //Antwort beenden
	                res.end();
	
	        }
	         else {
		     
	                var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	          
	            }
	            });
	            });
	});
	});
	
	// / MATCH -> SPIELSTAND // 
	// / MATCH -> SPIELSTAND //
	
	// STANDORT // 
	// STANDORT //
	
	app.get('/Standort/:StandortId', function(req,res){
	    
	   var standortId = req.params.StandortId;
		
		 //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    client.exists('Standort ' +standortId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
	
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		         
	                 var acceptedTypes= req.get('Accept');
	        switch(acceptedTypes){
	
	            case "text/html":
	                //Html repr. bauen
	                res.status(200).send("Standort: "+standortId);
	               
	            break;
	
	
	            default:
	                //We cannot send a representation that is accepted by the client 
	                res.status(406).send("Content Type wird nicht unterstuetzt");
	                break;
	
	        }
	                
	               res.end(); 
	            }
	            });
	    
	});
	
	app.post('/Standort', parseXML, function(req,res){
	    
	    //Abruf eines Benutzer, nur dann wenn client html verarbeiten kann 
	    var contentType=req.get('Content-Type');
	    
	    //Check ob der Content Type der Anfrage xml ist 
	    if(contentType != "application/xml"){
	        res.setHeader("Accepts","application/xml");
	        res.status(406).send("Content Type is not supported");
	    }
	
	    //Id für den neuen Standort
	    var currentId=client.INCR(StandortId);
	
	    //Benutzer Information mit HMSET
	    client.hmset(currentId,"Name", req.body.Name, "Adresse" , req.body.Adresse ,"Beschreibung", req.body.Beschreibung);
	    
	    //Setzen des Statuscodes 201 - created 
	    res.status(201).send("Anfrage zum Anlegen eines Benutzers erfolgreich");
	    
	    //Rueckerhalt eines Locationheaders der neu angelegten Ressource 
	    res.setHeader("Location","/Standort/"+ currentId);
	    
	    //Antwort beenden 
	    res.end();
	    
	});
	
	app.put('/Standort/:StandortId', parseXML, function(req,res){
	    
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    var standort=client.exists(req.params.StandortId);
	    //Speichere StandortId aus der URI in eine Variable
	    var StandortId=client.get(req.params.StandortId);
	    
	    //Angegebener Key existiert nicht
	    if(standort==0){
	        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
	    }
	    
	    //Angegebener Key existiert 
	    else{
	        //Abfrage des contenttypes der Request
	        var contentType=req.get('Content-Type');
	
	        //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	        if(contentType != "application/xml"){
	            res.setHeader("Accepts","application/xml");
	            res.status(406).send("Content Type is not supported");
	        }
	        
	        else{
	            //Ueberschreibe Werte in der Datenbank 
	            client.hmset(StandortId,"Name", req.body.Name, "Adresse" , req.body.Adresse ,"Beschreibung", req.body.Beschreibung);
	        }
	    }
	    
	    res.end();
	
	    
	});
	
	app.delete('/Standort/:StandortId', parseXML, function(req,res){
	    
	    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
	    var standort=client.exists(req.params.StandortId);
	    
	    //Angegebener Key existiert nicht
	    if(standort==0){
	        res.status(404).send("Spezifizierte Ressource wurde nicht gefunden!");
	    }
	    
	    else{
	        var standortID=client.get(req.params.StandortId);
	        client.del(req.params.StandortId);
	    }  
	});
	
	// / STANDORT // 
	// / STANDORT //
	
	// TURNIER // 
	// TURNIER //
	
	//Tunier Methoden
	app.get('/Tunier/:TunierId', function(req,res){
	});
	app.post('/Tunier', parseXML, function(req,res){
	});
	app.put('/Tunier/:TunierId',parseXML, function(req,res){
	});
	app.delete('/Tunier/:TunierId',parseXML, function(req,res){
	});
	
	// / TURNIER // 
	// / TURNIER //

	//Server lauscht auf Anfragen auf Port 3000
	app.listen(3000);
	
	// VALIDIERE XML GEGEN SCHEMA //
	// VALIDIERE XML GEGEN SCHEMA //
	
	/*
		
	var xsd = '<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"> <xsd:element name="root" type="rootTyp" /> <xsd:element name="Benutzer" type="BenutzerTyp"/> <xsd:element name="Forderung" type="ForderungTyp"/> <xsd:complexType name="BenutzerTyp"> <xsd:all> <xsd:element ref="Name"/> <xsd:element ref="Alter"/> <xsd:element ref="Position"/> <xsd:element ref="Profilbild"/> </xsd:all> </xsd:complexType> <xsd:element name="Name" type="xsd:string"/> <xsd:element name="Alter" type="xsd:integer"/> <xsd:element name="Profilbild" type="xsd:base64Binary"/> <xsd:element name="Position" type="PositionTyp"/> <xsd:simpleType name="PositionTyp"> <xsd:restriction base="xsd:string"> <xsd:enumeration value="Sturm"/> <xsd:enumeration value="Verteidigung"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="ForderungTyp"> <xsd:sequence> <xsd:element ref="Datum"/> <xsd:element ref="Uhrzeit"/> </xsd:sequence> </xsd:complexType> <xsd:element name="Datum" type="xsd:date"/> <xsd:element name="Uhrzeit" type="xsd:time"/> <xsd:complexType name="rootTyp"> <xsd:all> <xsd:element ref="Benutzer"/> <xsd:element ref="Forderung"/> </xsd:all> </xsd:complexType> <xsd:element name="Turnier" type="TurnierTyp"/> <xsd:element name="Match" type="MatchTyp"/> <xsd:element name="Kickertisch" type="KickertischTyp"/> <xsd:element name="Standort" type="xsd:string"/> <xsd:element name="Tischhersteller" type="TischherstellerTyp"/> <xsd:element name="Modell" type="ModellTyp"/> <xsd:element name="Zustand" type="xsd:string"/> <xsd:complexType name="TurnierTyp" > <xsd:sequence> <xsd:element ref="Standort"/> <xsd:element ref="Tischhersteller"/> </xsd:sequence> </xsd:complexType> <xsd:complexType name="MatchTyp"> <xsd:sequence> <xsd:element ref="Datum"/> <xsd:element ref="Uhrzeit"/> <xsd:element ref="Kickertisch"/> </xsd:sequence> </xsd:complexType> <xsd:complexType name="KickertischTyp"> <xsd:sequence> <xsd:element ref="Standort"/> <xsd:element ref="Tischhersteller"/> <xsd:element ref="Modell"/> </xsd:sequence> </xsd:complexType> <xsd:simpleType name="TischherstellerTyp"> <xsd:restriction base="xsd:string"> <xsd:enumeration value="Heiku" /> <xsd:enumeration value="Fireball" /> <xsd:enumeration value="Leonhart" /> <xsd:enumeration value="Lettner"/> <xsd:enumeration value="Libero"/> <xsd:enumeration value="Tornado"/> <xsd:enumeration value="Ullrich"/> <xsd:enumeration value="P4P"/> <xsd:enumeration value="Tuniro"/> <xsd:enumeration value="Garlando"/> <xsd:enumeration value="Longoni"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="ModellTyp"> </xsd:complexType> <xsd:complexType name="StandortTyp"> </xsd:complexType> </xsd:schema> ';
	var xsdDoc = libxml.parseXmlString(xsd);
	app.use(express.static(__dirname + '/Assets/XMLValidation'));
	
	
	var parsedXML = libxml.parseXmlString(req.body);
	
	var validateAgXSD = parsedXML.validate(xsdDoc);
	
	if(validateAgXSD) {
		// Verschicktes XML nach XSD Schema gültig
		}
	 else {
		        res.status(404).send("Das Schema war ungültig.");
		            res.end();
	        }
	*/

	// / VALIDIERE XML GEGEN SCHEMA //
	// / VALIDIERE XML GEGEN SCHEMA //
	
	
	// KICKERTISCH -> FORDERUNGEN PUT // 
	// KICKERTISCH -> FORDERUNGEN PUT //
	
	
	/*
	
	app.put('/Kickertisch/:TischId/Forderungen/:ForderungsId/', parseXML , function(req,res){
	    
	    var tischid = req.params.TischId;
	
	    client.exists('Kickertisch '+tischid+ ' Forderung '+req.params.ForderungsId,function(err,IdExists){
	        
	        //client.exists hat false geliefert 
	        if(!IdExists){
		        
		        var contentType=req.get('Content-Type');
	            
	            //Wenn kein XML geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
	            if(contentType != "application/xml"){
	                
	                //Teile dem Client einen unterstuetzten Type mit 
	                res.set("Accepts","application/xml");
	                
	                //Zeige über den Statuscode und eine Nachricht 
	                res.status(406).send("Content Type is not supported");
	                  
	                //Antwort beenden
	                res.end();
	            }
	            
	              res.status(404).send("Die Ressource wurde nicht gefunden.");
		            res.end();
	
	        }
	         else {
		         
	               //Kickertisch Information in die Datenbank einfügen 
	            client.hmset('Kickertisch '+req.params.TischId+ ' Forderung '+req.params.ForderungsId,
	            {'Datum':req.body.root.Datum,'Uhrzeit':req.body.root.Uhrzeit});
	                            
	                //Alles ok , sende 200 
	                res.status(200).send("Das hat funktioniert! Aenderungen angenommen");
	                
	                //Antwort beenden
	                res.end();
	            }
	            });
	
	        //Abfrage des contenttypes der Request
	            
	           
	});
	*/
	
	// / KICKERTISCH -> FORDERUNGEN PUT // 
	// / KICKERTISCH -> FORDERUNGEN PUT //