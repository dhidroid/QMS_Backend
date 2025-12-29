const express = require("express");
const router = express.Router();
const { login, getProfile, updateProfile } = require("../controller/auth/auth.controller.js");
const { auth } = require("../middlewares/authMiddleware");

router.post("/login", login);
router.get("/profile", auth(), getProfile);
router.put("/profile", auth(), updateProfile);

module.exports = router;
