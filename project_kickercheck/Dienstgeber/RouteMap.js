var express = require('express');
var router = express.Router();


// Routes /api
// =================

router.use('/Benutzer', require('./routes/benutzer_ressource'));


module.exports = router;