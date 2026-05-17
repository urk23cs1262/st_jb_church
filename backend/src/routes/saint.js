const router = require('express').Router();
const { getSaint } = require('../controllers/saintController');

router.get('/', getSaint);

module.exports = router;
