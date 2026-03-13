const express = require("express");
const router = express.Router();
const { register, login, googleAuth, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../validators/validators");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/google", googleAuth);
router.get("/me", protect, getMe);

module.exports = router;
