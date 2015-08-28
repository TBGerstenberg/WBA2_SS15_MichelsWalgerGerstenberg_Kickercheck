var app = express.Router();

app.get('/:BenutzerId', function(req, res) {

    //BenutzerId aus der URI extrahieren
    var benutzerId = req.params.BenutzerId;    
    /*
	TODO

	  // hget return 0 wenn key auf false sonst 1 , hier wird geprüft ob der Benutzer nach außen sichtbar sein möchte

        client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {

            //Der Benutzer existiert im System und ist nicht für den Zugriff von außen gesperrt
            if (IdExists == 1 && benutzerValid == 1) {
*/

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Benutzer ' + benutzerId, function(err, IdExists) {


        //Das Match existiert nicht im System 
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.").end();
        }

        //Das Match existiert 
        else  {

            //Headerfeld Accept abfragen
            var acceptedTypes = req.get('Accept');

            //Es wird zunaechst nur text/html 
            switch (acceptedTypes) {

                    //client kann application/json verarbeiten     
                case "application/json":

                    client.mget('Benutzer ' + benutzerId, function(err,benutzerdata){

                        var Benutzerdaten = JSON.parse(benutzerdata);

                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json').status(200).json(Benutzerdaten).end();
                    });
                    break;

                default:
                    //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                    res.status(406).send("Content Type wird nicht unterstuetzt").end();
                    break;
            }
        }

        /*
	TODO
            else if(IdExists == 1 && benutzerValid == 0) {
                //Der Benutzer mit der angefragten ID existiert nicht oder wurde für den Zugriff von außen gesperrt
                res.status(404).send("Die Ressource wurde für den Zugriff von außen gesperrt.").end();
            }


            else {
                //Der Benutzer mit der angefragten ID existiert nicht oder wurde für den Zugriff von außen gesperrt
                res.status(404).send("Die Ressource wurde nicht gefunden.").end();
            }
      */
    });
});


app.post('/', function(req, res) {

    //Content Type der Anfrage abfragen 
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage json ist 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json").status(406).send("Content Type is not supported").end(); 
    } 

    else{


        var Benutzer=req.body;
        //Pflege Daten aus Anfrage in die DB ein

        // BenutzerId in redis erhöhen, atomare Aktion 
        client.incr('BenutzerId', function(err, id) {
            console.log("Die BenutzerId nach hinzufügen eines Benutzers : " + id);

            var benutzerObj={
                'id' : id,
                'Name': Benutzer.Name,
                'Alter': Benutzer.Alter,
                'Bild': Benutzer.Bild,
                'isActive': 1
            };

            client.set('Benutzer ' + id, JSON.stringify(benutzerObj));

            //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json').set("Location", "/Benutzer/" + id).status(201).json(benutzerObj).end();


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

        var benutzerId = req.params.BenutzerId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Benutzer ' + benutzerId, function(err, IdExists) {

            /*

	TODO

            //Checke ob bestehender EIntrag gelöscht bzw für den Zugriff von außen gesperrt wrude 
            client.hget('Benutzer ' + benutzerId, "isActive", function(err, benutzerValid) {

                //client.exists hat false geliefert 
                if (IdExists == 1 && benutzerValid == 0) {
                    res.status(404).send("Die Ressource wurde nicht gefunden.");
                    res.end();
                }

                //Der Benutzer existiert und kann bearbeitet werden 
                else if (IdExists == 1 && benutzerValid == 1) {


                }                  
            });      
*/ 

            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).end();
            } 


            else {

                //Lese aktuellen Zustand des Turniers aus DB
                client.mget('Benutzer '+benutzerId,function(err,benutzerdata){

                    var Benutzerdaten = JSON.parse(benutzerdata);

                    //Aktualisiere änderbare Daten 
                    Benutzerdaten.Name = req.body.Name;
                    Benutzerdaten.Alter = req.body.Alter;


                    //Schreibe Turnierdaten zurück 
                    client.set('Benutzer ' + benutzerId,JSON.stringify(Benutzerdaten));

                    //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
                    res.set("Content-Type", 'application/json').json(Benutzerdaten).status(200).end();
                });  
            }            
        });
    }
});

app.delete('/:BenutzerId', function(req, res) {

    var benutzerId = req.params.BenutzerId;

    client.exists('Benutzer ' + benutzerId, function(err, IdExists) {

        client.mget('Benutzer ' + benutzerId, function(err, benutzerData) {

            var benutzerObj=JSON.parse(benutzerData);

            console.log("Existiert die id?"+IdExists + typeof(IdExists));
            console.log("Ist der benutzer aktiv?"+benutzerObj.isActive + typeof(benutzerObj.isActive));
            console.log("Der key des Benutzers:" + 'Benutzer ' + benutzerId);

            if(IdExists==1 && benutzerObj.isActive ==1) {
                //Setze das isActive Attribut des Benutzers in der Datenbank auf 0 , so bleiben seine Daten für statistische Zwecke erhalten , nach 				   
                //außen ist die Ressource aber nicht mehr erreichbar 
                console.log("Hier spring ich hoffentlich rein ");



                benutzerObj.isActive=0;
                console.log(benutzerObj);
                //Schreibe Turnierdaten zurück 
                client.set('Benutzer ' + benutzerId,JSON.stringify(benutzerObj));

                //Alles ok , sende 200 
                res.set("Content-Type", 'application/json').status(200).json(benutzerObj).end();


            }

            //Es gibt keinen Benutzer mit dieser id
            else {
                res.status(404).end();
            }
        });
    });
});

app.get('/',function(req,res){

    //Speichert die alle Benutzer
    var response=[];    

    //returned ein Array aller Keys die das Pattern Benutzer* matchen 
    client.keys('Benutzer *', function (err, key) {

        if(key.length == 0) {
            res.json(response);
            return;
        }

        client.mget(key, function (err, benutzer) {

            //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
            benutzer.forEach(function (val) {

                var einNutzer = JSON.parse(val);

                if(einNutzer.isActive != 0) {

                    response.push(JSON.parse(val));
                }

            });
            res.status(200).set("Content-Type","application/json").json(response).end();

        });

    });
});


module.exports = app;