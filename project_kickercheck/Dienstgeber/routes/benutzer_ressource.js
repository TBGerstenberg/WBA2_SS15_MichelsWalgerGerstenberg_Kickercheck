var app = express.Router();

app.get('/:BenutzerId', function(req, res) {

    //BenutzerId aus der URI extrahieren
    var benutzerId = req.params.BenutzerId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Benutzer ' + benutzerId, function(err, IdExists) {

        // hget return 0 wenn key auf false sonst 1 , hier wird geprüft ob der Benutzer nach außen sichtbar sein möchte
        client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {

            //Der Benutzer existiert im System und ist nicht für den Zugriff von außen gesperrt
            if (IdExists == 1 && benutzerValid == 1) {

                //Headerfeld Accept abfragen
                var acceptedTypes = req.get('Accept');

                //Es wird zunaechst nur text/html 
                switch (acceptedTypes) {

                        //client kann application/json verarbeiten     
                    case "application/json":

                        client.hgetall('Benutzer ' + benutzerId, function(err,BenutzerDaten){

                            //Setze Contenttype der Antwort auf application/json
                            res.set("Content-Type", 'application/json').status(200).json(BenutzerDaten).end();
                        });

                        break;

                    default:
                        //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                        res.status(406).send("Content Type wird nicht unterstuetzt").end();
                        break;
                }
            }
            else if(IdExists == 1 && benutzerValid == 0) {
                //Der Benutzer mit der angefragten ID existiert nicht oder wurde für den Zugriff von außen gesperrt
                res.status(404).send("Die Ressource wurde für den Zugriff von außen gesperrt.").end();
            }

            else {
                //Der Benutzer mit der angefragten ID existiert nicht oder wurde für den Zugriff von außen gesperrt
                res.status(404).send("Die Ressource wurde nicht gefunden.").end();
            }
        });
    });
});


app.post('/', function(req, res) {

    var Benutzer = req.body;
    //Content Type der Anfrage abfragen 
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage json ist 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json").status(406).send("Content Type is not supported").end(); 
    } 
    
    if(req.get('Accept') != "application/json"){
        res.status(406).send("Content Type wird nicht unterstuetzt").end();
    }

    else{
        // BenutzerId in redis erhöhen, atomare Aktion 
        client.incr('BenutzerId', function(err, id) {
            console.log("Die BenutzerId nach hinzufügen eines Benutzers : " + id);

            // Setze Hashset auf Key "Benutzer BenutzerId" 
            client.hmset('Benutzer ' + id,{
                'Name': Benutzer.Name,
                'Alter': Benutzer.Alter,
                'Bild': Benutzer.Bild,
                'isActive': 1
            });

            //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json').set("Location", "/Benutzer/" + id).status(201).json(req.body).end();
        });
    }
});

app.put('/:BenutzerId', function(req, res) {

    var contentType = req.get('Content-Type');

    //Wenn kein json geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json").status(406).send("Content Type is not supported").end(); 
    } 

    else {
        
        //extrahiere BenutzerId aus Anfrage 
        var benutzerId = req.params.BenutzerId;

        //Checke ob ein Eintrag in der DB unter dieser ID existiert 
        client.exists('Benutzer ' + benutzerId, function(err, IdExists) {

            //Checke ob bestehender EIntrag gelöscht bzw für den Zugriff von außen gesperrt wrude 
            client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {

                //client.exists hat false geliefert 
                if (IdExists == 1 && benutzerValid == 0) {
                    res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }

                //Der Benutzer existiert und kann bearbeitet werden 
                else if (IdExists == 1 && benutzerValid == 1) {
                    
                    var Benutzer = req.body;

                    client.hmset('Benutzer ' + benutzerId, {
                        'Name': Benutzer.Name,
                        'Alter': Benutzer.Alter,
                        'Bild': Benutzer.Bild,
                        'isActive': 1
                    });  

                    //Setze Contenttype der Antwort auf application/atom+xml
                    res.set("Content-Type", 'application/json').status(200).json(req.body).end();
                }                  
            });       
        });  
    }            
});

app.delete('/:BenutzerId', function(req, res) {

    var benutzerId = req.params.BenutzerId;

    client.exists('Benutzer ' + benutzerId, function(err, IdExists) {

        client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {

            if(IdExists == 1 && benutzerValid == 1) {
                //Setze das isActive Attribut des Benutzers in der Datenbank auf 0 , so bleiben seine Daten für statistische Zwecke erhalten , nach 				   
                //außen ist die Ressource aber nicht mehr erreichbar 
                client.hmset('Benutzer ' + benutzerId, "isActive", 0);

                //Alles ok , sende 200 
                res.status(204).send("Das hat funktioniert! Benutzer gelöscht");

                //Antwort beenden
                res.end();
            }

            //Es gab nie einen Benutzer mit dieser Id
            else if(IdExists == 1 && benutzerValid == 0) {
                res.status(404).send("Die Ressource wurde nicht gefunden.");
                res.end();
            }

            //Der Benutzer wurde für den Zugriff von außen gesperrt 
            else {
                res.status(404).send("Die Ressource wurde nicht gefunden.");
                res.end();
            }
        });
    });
});

//Listenressource Benutzer 
app.get('/',function(req,res){

    //Speichert die alle Benutzer
    var response=[];    

    //returned ein Array aller Keys die das Pattern Benutzer* matchen 
    client.keys('Benutzer *', function (err, benutzerKeys) {
	   
        //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
        benutzerKeys.forEach(function (key, pos) {
	       
            client.hgetall(key, function (err, user) {
	           
                response.push(user);
            });
        });
    });

    //Abruf war erfolgreich , antworte mit Statuscode 200 
    res.status(200).set("Content-Type","application/json").json(response).end();
});

module.exports = app;