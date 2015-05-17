//Express Modul einbinden 
var express=require('express');
//bodyParser modul einbinden und in "bodyparser" ablegen
var bodyParser= require('body-parser');
//jsonParser inszanziieren und in "jsonParser" ablegen 
var jsonParser=bodyParser.json();
//Expressinstanz anlegen und in "app" ablegen 
var app=express();
//Id Counter 
var id_counter=0;

//app.use(jsonParser);

//Datenstruktur zum zwischenspeichern von Spielerprofil-Objekten
var data=[

]

//Repräsentation einer Spielerliste abrufen 
app.get('/spielerprofil_liste',function(req,res){
    
    //Festlegen welche Repräsentationsformen angefragt werden können
    var acceptedTypes=req.accepts(['html','json']);
    switch(acceptedTypes){
    
            case 'html':
                var spielerProfilListe_html="";
                for(var i=0; i<data.length ; i++){
                    spielerProfilListe_html+=profileToHTML(data[i]);
                }
                res.type('html').send(spielerProfilListe_html);
            break;
            
            case 'json':
                res.type('json').send(data);
            break;

            default:req.status(406).send("accepted types are html or json");
    }
    res.end();
});

//Anlegen eines Spielerprofils
//Bei einem Post auf die Ressource Spielerprofil wird ein user-Objekt konstruiert und intern abgelegt
app.post('/spielerprofil',jsonParser,function(req,res){
        
    var user={
              id:id_counter+1,
              name:req.body.name,
              email:req.body.email
    };
    
    //User fortlaufend nummerieren
    id_counter++;
    
    //Kontrollausgabe
    console.log(user);
    
    // User Objekt in ein Array pushen 
    data.push(user);

    res.end();
});

//Funktion um ein Spielerprofil in eine HTML-Repräsentation umzuwandeln 
function profileToHTML(profile){
   var HTMLrep="<h1>"+profile.name+"</h1><br /><p>"+profile.email+"<p><br />";
   return HTMLrep;
}

//Server lauscht auf Anfragen auf Port 3000
app.listen(3000);
