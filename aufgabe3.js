// Load required modules
var fs = require('fs')
var chalk = require('chalk')
var skyscraper;

//Read File 
fs.readFile("wolkenkratzer.json", function(err, data){

    //Check for errors
	if(err) throw err;

    //control message 
	console.log('Daten werden eingelesen...');

    //Parse JSON and save into variable
	skyscraper = JSON.parse(data);
    
    //Sort Array, callback gives feedback when sorting is finished
    skyscraper.wolkenkratzer.sort(function (a,b){
        if(a.hoehe == b.hoehe){
            return 0;
        }
        
        else if(a.hoehe < b.hoehe){
            return 1;
        }
        
        else if(a.hoehe > b.hoehe){
            return -1;
        }
    } , console.log("Sortieren beendet"));
    
    //Specify the filename of the outputfile
    var outputFilename="wolkenkratzer_sortiert.json"
    
    //Write sorted array into a JSON file, Callback function 
    fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function(err) {
        
        //Check for writing Errors
        if(err) throw err;
        
        //control message when JSON is saved
        console.log("JSON saved to " + outputFilename);
        
        //Start console output
        console.log("ausgabe beginnt");
    
        for(var i = 0; i < skyscraper.wolkenkratzer.length; i++){
            console.log(chalk.green('Name: '+skyscraper.wolkenkratzer[i].name));
            console.log(chalk.cyan('Stadt: '+skyscraper.wolkenkratzer[i].stadt));
            console.log(chalk.magenta('Hoehe: '+skyscraper.wolkenkratzer[i].hoehe+'m'));
            console.log('--------------------')  
        }
    
        console.log("ausgabe beendet");  
    });     
});	


    
   
  