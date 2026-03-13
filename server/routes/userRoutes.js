const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validate, updateProfileSchema, changePasswordSchema } = require('../validators/validators');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/password', validate(changePasswordSchema), changePassword);
router.delete('/account', deleteAccount);

module.exports = router;
