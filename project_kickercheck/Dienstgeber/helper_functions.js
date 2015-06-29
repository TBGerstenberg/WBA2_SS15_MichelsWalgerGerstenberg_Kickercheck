/*Generates a Link Object that containt the attributes title , rel and href */                               
function generateLinkELementFromHref(title,rel,href){
    
    var linkElement={
        link:{
        '#text':' ',
        '@title':title,
        '@rel':rel,
        '@href':href
        }
    }                
    return linkElement;
}   

/*Generiert XML-Payloads die übermittelt werden falls ein Request malformed war 
, diese Dokumente enthalten Links auf die Rel-Seiten des Dienstes 
um einem Client die korrekte Formatierung einer Anfrage 
aufzuzeigen
Parameter : Ressource Typ : String  */
function generateHelpForMalformedRequests(Ressource,callback){
    
    if (typeof Ressource != 'string' && !(Ressource instanceof String)){
        console.trace();
        throw "Ressourcenname in generateHelpForMalformedRequests ist kein String";
        return;
    }
    
    
    
     //Setze ein Linkelement in den Body, dass dem Client die richtige Verwendung einer Benutzerrepräsentation zeigt
     var linkElement =generateLinkELementFromHref("korrekte Form einer " + Ressource +  " Anfrage" ,eval(Ressource+"Rel"),eval(Ressource+"Rel"));
    console.log(eval(Ressource+"Rel"));
               
    //Parse als XML 
    var RessourceXML = builder.create(Ressource,{version: '1.0', encoding: 'UTF-8'}).att('xmlns:kickercheck',kickerNS).ele(linkElement).end({ pretty: true }); 

    console.log(RessourceXML);
    
    //Rufe Callback Function mit dem Ergebnis auf 
    callback(RessourceXML);    
}