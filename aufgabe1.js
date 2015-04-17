var fs = require('fs')

var skyscraper;

fs.readFile("wolkenkratzer.json", function(err, data){

	if(err) throw err;

	console.log('Datei wird eingelesen...');
	console.log();

	skyscraper = JSON.parse(data);

	for(var i = 0; i < skyscraper.wolkenkratzer.length; i++)
	{
		console.log('Name: '+skyscraper.wolkenkratzer[i].name);
		console.log('Stadt: '+skyscraper.wolkenkratzer[i].stadt);
		console.log('Hoehe: '+skyscraper.wolkenkratzer[i].hoehe+'m');
		console.log('--------------------')
	}

});