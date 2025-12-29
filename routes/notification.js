const express = require("express");
const router = express.Router();
const pushController = require("../controller/notification/push.controller.js");

router.post("/subscribe", pushController.subscribe);

module.exports = router;
