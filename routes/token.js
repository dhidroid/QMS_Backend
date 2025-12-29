const express = require("express");
const router = express.Router();
const tokenController = require("../controller/tokenController/tokenController.js");

router.post("/create", tokenController.createToken); // guest or handleless test
router.get("/by-guid/:guid", tokenController.getTokenByGuid);
router.get("/display-status", tokenController.getDisplayStatus);
router.post("/submit-feedback", tokenController.submitFeedback);
router.post("/search", tokenController.searchToken);

module.exports = router;
