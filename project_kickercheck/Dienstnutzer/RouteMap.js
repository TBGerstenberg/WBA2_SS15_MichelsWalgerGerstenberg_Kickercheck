var router = express.Router();

// Routes /api
// =================

router.use('/Kickertisch', require('./routes/kickertisch_ressource'));


module.exports = router;