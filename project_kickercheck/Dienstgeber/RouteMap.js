var router = express.Router();


// Routes /api
// =================

router.use('/Benutzer', require('./routes/benutzer_ressource'));
router.use('/Austragungsort', require('./routes/austragungsort_ressource'));


module.exports = router;