const express = require("express");
const router = express.Router();
const formController = require("../controller/formController.js");

router.post("/save", formController.createForm);
router.get("/", formController.getForms);
router.get('/default', formController.getDefaultForm);
router.get("/:id", formController.getFormById);
router.delete('/:id', formController.deleteForm);

module.exports = router;
