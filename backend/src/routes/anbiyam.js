const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/anbiyamController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAll);
router.post('/', protect, create);
router.put('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
