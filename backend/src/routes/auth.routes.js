const express = require("express");
const router = express.Router();
const { register, login, changePassword } = require("../controllers/auth.controllers");
const { requireAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.put("/change-password", requireAuth, changePassword);

module.exports = router;
