var app = express.Router();

 //Listenressource Community 
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
            res.status(200);

            //Setze content type der Antwort auf application/json 
            res.set("Content-Type","application/json");

            //Schreibe XML in Antwort 
            res.write(JSON.stringify(response));

            //Beende Antwort 
            res.end();
            
});

module.exports = app;