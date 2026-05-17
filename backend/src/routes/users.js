const router = require('express').Router();
const { getAllUsers, getUserById, updateProfile, updateUser, deleteUser, changePassword } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, (req, res, next) => { req.uploadFolder = 'profiles'; next(); }, upload.single('photo'), updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
