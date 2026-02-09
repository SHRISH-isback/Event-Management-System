const express = require("express");
const router = express.Router();
const { register, login, changePassword } = require("../controllers/auth.controllers");
const { requireAuth } = require("../middleware/auth");
const { loginRateLimiter, registerRateLimiter } = require("../middleware/rateLimit");
const { captchaMiddleware } = require("../middleware/captcha");

router.post("/register", registerRateLimiter, captchaMiddleware, register);
router.post("/login", loginRateLimiter, captchaMiddleware, login);
router.put("/change-password", requireAuth, changePassword);

module.exports = router;
