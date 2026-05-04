const express = require('express');
const router = express.Router();
const { getCombos, seedCombos } = require('../controllers/comboController');

router.get('/', getCombos);
router.get('/seed', seedCombos);

module.exports = router;
