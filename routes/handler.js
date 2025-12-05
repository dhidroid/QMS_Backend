const express = require("express");
const { auth } = require("../middlewares/authMiddleware");
const router = express.Router();
const handlerController = require("../controller/tokenHanduler/handlerController.js");

router.post("/update-status", auth("handler"), handlerController.updateStatus);
router.post("/call-next", auth("handler"), handlerController.callNext);

module.exports = router;
