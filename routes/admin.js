const express = require("express");
const { auth } = require("../middlewares/authMiddleware");
const router = express.Router();
const adminController = require("../controller/auth/adminController.js");

// require admin role
router.get("/tokens", auth("admin"), adminController.getTokensByDate);
router.post("/create-user", adminController.createUser);
router.get("/push-subs", auth("admin"), adminController.getPushSubs);

module.exports = router;
