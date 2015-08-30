var app = express.Router();

//Liefert das Servicedokument,  dass die möglichen Interaktionsmöglichkeiten mit dem Service zeigt
//Damit diese Ressource im Kontext von automatischer Service-Discovery und dem Ziel generischer Clients von Bedeutung ist 
//hätte man hier auf ein standardisiertes Protokoll zurückgreifen müssen (z.B das AtomPub). 
app.get('/',function(req,res){
    
    /*Interaktionsmöglichkeiten: 
    // -Links auf die Listenressourcen :
            -Benutzer
            -Matches
            -Turniere
            -Austragungsorte
            
        ggf.
        Links auf Relpages für diese Ressourcen ,die die zu übertragenen Repräsentaionen , sowie die definierten Verben 
        auf den Ressourcen zeigen       
    */
    
    var service={
        "BenutzerCollection":"http://localhost:3000/Benutzer",
        "AustragungsortCollection":"http://localhost:3000/Austragungsort",
        "MatchCollection":"http://localhost:3000/Match",
        "TurnierCollection":"http://localhost:3000/Turnier",
    }
    
    res.status(200).json(service).end();
});

module.exports = app;
