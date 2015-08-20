module.exports = function (app) {

	
app.use('/Kickertisch', require('./routes/kickertisch_ressource'));
app.use('/Liveticker', require('./routes/liveticker_ressource'));

};