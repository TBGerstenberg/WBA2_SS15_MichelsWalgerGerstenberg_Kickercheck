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

//
app.get('/spielerprofil_liste',function(req,res){
    /*Festlegen welche Repräsentationsformen angefragt werden können
    var acceptedTypes=req.accepts(['html','json']);
    switch(acceptedTypes){
    
            case 'html':
             res.type=('html').send();
    
    
    }*/
    
    
    res.send(data);
});

//Bei einem Post auf die Ressource Spielerprofil wird ein user-Objekt konstruiert und intern abgelegt
app.post('/spielerprofil',jsonParser,function(req,res){
        
    var user={
              id:id_counter+1,
              name:req.body.name,
              email:req.body.email
    };

    id_counter++;
    
    //Kontrollausgabe
    //console.log(user);
    
    data.push(user);

    res.end();
});



//Server lauscht auf Anfragen auf Port 3000
app.listen(3000);

