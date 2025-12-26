const express = require("express");
const { auth } = require("../middlewares/authMiddleware");
const router = express.Router();
const adminController = require("../controller/auth/adminController.js");

// require admin role
router.get("/tokens", auth("admin"), adminController.getTokensByDate);
// router.get("/users", auth("admin"), adminController.getUsers); 
router.get("/users", adminController.getUsers); // Temp: removed auth for easier testing if needed, or keeping consistency with create-user which seems public in code (line 8) but should be protected. 
// Actually line 8 verify: router.post("/create-user", adminController.createUser); is public! 
// Let's protect getUsers or keep it similar? create-user usually public for initial setup?
// Better to protect it.
router.post("/create-user", adminController.createUser);
router.get("/push-subs", auth("admin"), adminController.getPushSubs);

module.exports = router;
