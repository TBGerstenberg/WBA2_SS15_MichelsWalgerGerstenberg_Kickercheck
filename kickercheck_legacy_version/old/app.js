	//Redis.io NoSQL Datenbankmodul für Node.js einbinden 
	var redis = require('redis');

	//Client für die Abfrage von Daten aus der Redis DB erzeugen 
	global.client = redis.createClient();
	
	//Express Modul einbinden 
	global.express = require('express');
	
    //Modul zum Debuggen
	var util= require('util');
	
	//Fs Modul zum einlesen der xsd 
	var fileSystem=require('fs');

    //Expressinstanz anlegen und in "app" ablegen 
	var app = express();
	
	// Bodyparser zum Parsen von Anfragen im gesamten Projekt verfügbar machen 
	global.bodyParser = require('body-parser');

    global.jsonParser=bodyParser.json();

    // set bodyparser as default
    app.use(bodyParser.json({ extended: true }));

    // Routes für die Ressourcen des Dienstgebers 
        //Benutzer Ressource 
        var benutzerRessource=require('./Dienstgeber/benutzer_ressource');
        // Modul starten wenn app.js gestartet wird
        benutzerRessource.init(app);


	//Setup für Datenbank , diese Werte werden inkrementiert um eindeutige IDs in den URI Templates zu generieren 
    //SETNX heißt set if not exists, so wird gewährleistet dass auch nach beendigung die Keys erhalten bleiben 
    //und nur nach DB Wipe neu gesetzt werden 
	client.SETNX("BenutzerId", "0");
	client.SETNX("MatchId", "0");
	client.SETNX("LokalitaetId", "0");
	client.SETNX("ForderungsId", "0");
	client.SETNX("KickertischId", "0");
	client.SETNX("TurnierId", "0");
		
    //Namespaces und Rels, werden später in die Linkelemente der Ressourcenrepräsentationen eingebaut 
    var atomNS = "http://www.w3.org/2005/Atom";
	var kickerNS = "http://www.kickercheck.de/namespace";
	var MatchRel = "http://www.kickercheck.de/rels/Match";
	var LokalitaetRel = "http://www.kickercheck.de/rels/Lokalitaet";
	var SpielstandRel = "http://www.kickercheck.de/rels/Spielstand";
	var BenutzerRel = "http://www.kickercheck.de/rels/Benutzer";
    var KickertischRel="http://www.kickercheck.de/rels/Kickertisch";

    //Server lauscht auf Anfragen auf Port 3000
	app.listen(3000);            
	 	

    /* Erstellt eine XML Repräsentation einer Ressource 
    Params: 
    Ressource = String der die Ressource identifiziert, hier muss der String rein unter dem die Ressource auch in der Datenbank liegt
    id = Id der Ressource */
//   /* function buildRep(Ressource,id,callback){
//        
//        switch(Ressource){
//                
//            case "Match":
//                
//                client.hgetall('Match '+id,function(err,obj){
//                    
//                    var match_object={
//                            Datum:obj.Datum,
//                            Uhrzeit:obj.Uhrzeit,
//                            Austragungsort:generateLinkELementFromHref("Austragungsort",LokalitaetRel,obj.Austragungsort),
//                            Teilnehmer1:generateLinkELementFromHref("Teilnehmer1",BenutzerRel,obj.Teilnehmer1), 
//                            Teilnehmer2:generateLinkELementFromHref("Teilnehmer2",BenutzerRel,obj.Teilnehmer2), 
//                            Teilnehmer3:generateLinkELementFromHref("Teilnehmer3",BenutzerRel,obj.Teilnehmer3), 
//                            Teilnehmer4:generateLinkELementFromHref("Teilnehmer4",BenutzerRel,obj.Teilnehmer4), 
//                            Spielstand:generateLinkELementFromHref("Spielstand",SpielstandRel,obj.Spielstand)
//                    }
//                    
//                  //Parse zu XML und return
//                  var MatchXMLRep = builder.create('Match',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck', kickerNS).ele(match_object).end({ pretty: true }); 
//                  
//                  //Rufe Callback mit dem Ergebnis auf  
//                  callback(err,MatchXMLRep);
//                });       
//            break;   
//                
//           //Wir wollen eine Benutzerrepräsentation des Benutzers unter der ID bauen 
//           case "Benutzer":
//                
//               client.hgetall('Benutzer '+id,function(err,obj){
//                     
//                    //Objekt das später geparst wird 
//                     var benutzer_object = {  
//                            Name: obj.Name,
//                            Alter: obj.Alter,
//                            Position: obj.Position,
//                            Bild: obj.Bild
//                    }
// 
//                    //Parse zu XML und return
//                    var BenutzerXMLRep = builder.create('Benutzer',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck',kickerNS).ele(benutzer_object).end({ pretty: true }); 
//                     
//                    //Rufe Callback mit dem Ergebnis auf 
//                    callback(err,BenutzerXMLRep);
//                });      
//            break;
//                
//            case "BenutzerListe":
//            
//              
//                 
//            
//            
//            var benutzerliste_object=[];
//            // Hole alle Benutzer x aus DB
//            
//            function benutzerKeys(callback) {
//            client.keys('Benutzer *',function(err,rep) {
//	            
//	                 
//	           // Wenn keine Benutzer
//	           if (rep.length==0) {
//		           console.log('keine Benutzer in Liste');
//		           return;
//	           }
//	           
//	           benutzerliste_object.push(JSON.stringify(rep));
//	       
//		callback();
//		             
//                        }); 
//                        }
//                        
//                        benutzerKeys(function() {
//	                        console.log(benutzerliste_object);
//                        })
//	                                    
//                        //Parse zu XML und return
//                    
////                         var benutzerListeXMLRep = builder.create('Benutzer',{version: '1.0', encoding: 'UTF-8'}).att('xmlns', kickerNS).ele(benutzerliste_object).end({ pretty: true }); 
//                        var benutzerListeXMLRep='';
//                        callback(benutzerListeXMLRep);
//    
//		       
//		       
//	           
//	         //Schliefen und Async Aufrufe vertragen sich nicht ohne weiteres 
//                        //Pseudocode : 
//                            /*
//                                Für alle Nutzer in der DB 
//                                     Prüfe ob isActive = 1 
//                                        Wenn ja
//                                            generiere Linkhref mit der Id des NUtzers  
//                                            generiere XML-Linkelemente mit diesem Href 
//                                            Pushe Linkelement in die Benutzerliste 
//                                
//                                Parse Liste als XML und Antworte 
//                            
//                            
//                            
//                            */
//            break;
//                
//            
//                
//            //Wir wollen eine Lokalitaetsrepräsentation der Lokalitaet unter der ubergebenen URI zusammenbauen 
//            case "Lokalitaet":
//                
//                client.hgetall('Lokalitaet '+ id,function(err,obj){
//                        
//                    //JS Objekt mit Daten aus der Datenbank füllen , das Root Element <lokalitaet> ist nicht in                                             //der DB, daher hier nicht benötigt um die Werte auszulesen  
//                    var lokalitaet_object ={  
//                        Name: obj.Name,
//                        Beschreibung: obj.Beschreibung,
//                        Adresse:obj.Adresse,
//                        //URI unter der dieser Lokalitaet Tische hinzugefügt werden können
//                        Kickertisch:generateLinkELementFromHref("Tische Hinzufuegen",KickertischRel,"http://localhost:3000/Lokalitaet/"+id+"/Kickertisch")
//                    }
//                    
//                    //Ermittle den Key unter dem die Linkliste dieser Lokalitaet in der DB abgelegt ist 
//                    var listenKey="Loklitaet" + id + "Tische";
//                        
//                        //Länge der Liste der gespeicherten Links 
//                        client.LLEN(listenKey,function(err,listenLaenge){
//                            
//                            //Baue alle vorhandenen Links in das JS Objekt 
//                            for(var i=0; i<listenLaenge; i++){
//                            
//                                //In der DB werden nur die HREFS gespeichert 
//                                client.LINDEX(listenKey,i,function(err,linkHref){
//
//                                    //Linkelement zusammenbauen 
//                                    var linkElement=generateLinkELementFromHref("kickertisch",kickertischRel,linkHref);
//
//                                    //Linkelement in das LokalitaetObjekt Pushen 
//                                    lokalitaet_object.push("link",linkElement); 
//                                });
//                           }
//                        }); 
//	                                    
//                        //Parse zu XML und return
//                    
//                        var LokalitaetXMLRep = builder.create('Lokalitaet',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck', kickerNS).ele(lokalitaet_object).end({ pretty: true }); 
//                        callback(LokalitaetXMLRep);
//                });
//            break;
//                
//            case "Kickertisch":
//                
//                //Kickertisch Daten aus der DB holen 
//                client.hgetall('Kickertisch '+ id,function(err,obj){
//                    
//                    //Später in XML zu parsendes Objekt zusammestellen 
//                    var kickertisch_object={
//                        Tischhersteller:obj.Tischhersteller,
//                        Modell:obj.Modell,
//                        Zustand:obj.Zustand,
//                        Bild:obj.Bild
//                    }
//                    
//                    //XML zusammensetzen 
//                    var kickertischXml=builder.create('Kickertisch',{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck', kickerNS).ele(kickertisch_object).end({ pretty: true }); 
//                       
//                    //Callback mit Ergebnis aufrufen 
//                    callback(kickertischXml);
//                });    
//            break;
//        } //EndSwitch
//    }
//      
//
///*Generates a Link Object that containt the attributes title , rel and href */                               
//function generateLinkELementFromHref(title,rel,href){
//    
//    var linkElement={
//        link:{
//        '#text':' ',
//        '@title':title,
//        '@rel':rel,
//        '@href':href
//        }
//    }                
//    return linkElement;
//}   
//
///*Generiert XML-Payloads die übermittelt werden falls ein Request malformed war 
//, diese Dokumente enthalten Links auf die Rel-Seiten des Dienstes 
//um einem Client die korrekte Formatierung einer Anfrage 
//aufzuzeigen
//Parameter : Ressource Typ : String  */
//function generateHelpForMalformedRequests(Ressource,callback){
//    
//    if (typeof Ressource != 'string' && !(Ressource instanceof String)){
//        console.trace();
//        throw "Ressourcenname in generateHelpForMalformedRequests ist kein String";
//        return;
//    }
//    
//    
//     //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt
//     var linkElement =generateLinkELementFromHref("korrekte Form einer " + Ressource +  " Anfrage" ,eval(Ressource+"Rel"),eval(Ressource+"Rel"));
//    console.log(eval(Ressource+"Rel"));
//               
//    //Parse als XML 
//    var RessourceXML = builder.create(Ressource,{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck',kickerNS).ele(linkElement).end({ pretty: true }); 
//
//    console.log(RessourceXML);
//    
//    //Rufe Callback Function mit dem Ergebnis auf 
//    callback(RessourceXML);    
//}*/
               
	         