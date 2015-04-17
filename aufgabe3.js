//Include filesystem module
var fs = require('fs')

// Variable to store parsed JSON
var skyscraper;

//Read the File at a spcified path , function in Parameters 
//gets fired when the input is finished
fs.readFile("wolkenkratzer.json", function(err, data){

	if(err) throw err;

	console.log('Datei wird eingelesen...');
	console.log();
    
    //data contains the content of the specified file,
    // convert the JSON to a    JS object
	skyscraper = JSON.parse(data);
    
    //Sortieren 
    

    //Loop over all Skyscrapers and display their properties
	for(var i = 0; i < skyscraper.wolkenkratzer.length; i++)
	{
		console.log('Name: '+skyscraper.wolkenkratzer[i].name);
		console.log('Stadt: '+skyscraper.wolkenkratzer[i].stadt);
		console.log('Hoehe: '+skyscraper.wolkenkratzer[i].hoehe+'m');
		console.log('--------------------')
	}

});