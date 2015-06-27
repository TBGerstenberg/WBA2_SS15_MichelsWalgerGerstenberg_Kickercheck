		   /* 														*
			*						TODO							*
			*														*
			*				XSD Validierung checken					*
			*		funktioniert nicht mit xml vom Dienstnutzer		
            
                    Problem liegt einfach an falscher Form , 
                    valide Anfrage : 

                    <?xml version="1.0" encoding="UTF-8" ?>
                    <Match xmlns="http://www.kickercheck.de/namespace">
                        <Datum>2012-04-12</Datum>
                        <Uhrzeit>12:25:00</Uhrzeit>
                        <Austragungsort><link title="Austragungsort" rel="http://www.kickercheck.de/rels/Lokalitaet" href="" /></Austragungsort>
 		                <link title="Teilnehmer 1" rel="http://www.kickercheck.de/rels/Benutzer" href=""/>
  		                <link title="Teilnehmer 2" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/2" />
      	                <link title="Teilnehmer 3" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/3" />
  		                <link title="Teilnehmer 4" rel="http://www.kickercheck.de/rels/Benutzer" href="http://localhost:3000/Benutzer/4" />
   		                <link title="Spielstand" rel="http://www.kickercheck.de/rels/Spielstand" href=""/>
                    </Match>
                    
                    Abgeschickte Form ignoriert einfach die Linkelemente und arbeitet bisher nur mit Hrefs 
                    BTW: Xpath erlaubt Navigation durch XML dokumente ohne sie vorher in JSON zu wanden 
            */
 

// server.js
// Externe includes 
var http = require('http');
var util= require('util');
var express = require('express');
var fs = require('fs');
var ejs = require('ejs');
var bodyparser = require('body-parser');
var jsonParser = bodyparser.json();

//Zusatzmodul zum erstellen von xml-Repräsentationen 
var builder = require('xmlbuilder');
//Namespace des Service
var kickerNS = "http://www.kickercheck.de/namespace";
// xml2js für XML-JS Parsing
var xml2js = require('xml2js');
//Parser von xml2js 
var xml2jsParser = new xml2js.Parser();
//Express Modul instanziieren
var app = express();

app.use(express.static(__dirname + '/views'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page 
app.get('/', function(req, res) {
    res.render('pages/index');
});

// about page 
app.get('/Match', function(req, res) {
    res.render('pages/match');
});

app.post('/Match', jsonParser, function(req, res) {
	
    // Speichert req.body
    var store = '';

    function matchAnlegen(callback) {

     var responseString = '';

    // HTTP Header setzen
    var headers = {
      'Content-Type': 'application/atom+xml'
    };

    // Mit Server verbinden
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/Match',
      method: 'POST',
      headers: headers
    };

    // Request an Server
    var anfrage = http.request(options, function(res){

      res.on('data', function(data) {
        responseString += data;
      });

      res.on('end', function() {
        callback(responseString);
      });


       anfrage.on('error', function(e) {
        console.log(e);
       });			
    });


    // AJAX Post Daten Allocate Funktion
    function matchPost(callback) {

        req.on('data', function(data) 
        {
            store += data;
        });
        req.on('end', function() 
        {  
           callback(store);
        });    
    }

    // Callback Funktion für AJAX POST Daten Allocate
    matchPost(function(store) {

        var result = JSON.parse(store);

    var match_object = {  
       Datum: result.datum ,
        Uhrzeit: result.uhrzeit ,
        Austragungsort: {'@href':result.austragungsort},
         "Teilnehmer1" : {'@href':result.spieler1} ,
         "Teilnehmer2" : {'@href':result.spieler2}, 
         "Teilnehmer3" : {'@href':result.spieler3},
         "Teilnehmer4" : {'@href':result.spieler4} 
        };


         var match_template = builder.create('Match',{version: '1.0', encoding: 'UTF-8'}).att("xmlns:kickercheck",kickerNS)
    .ele(match_object)
    .end({ pretty: true});

     console.log(util.inspect(match_template, {showHidden: false, depth: null}));


        anfrage.write(match_template); 
            anfrage.end();	   
        });

    }

    // Callback Funktion für Request an Server 
    matchAnlegen(function (responseString) {
        res.write(responseString);
        res.end();
    });
});

app.listen(3001, function(){
console.log("Server listen on Port 3001");
});