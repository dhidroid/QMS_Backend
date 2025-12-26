var express = require("express");
var router = express.Router();
const { getPool, sql } = require("../config/db.config");

/* GET home page. */
router.get("/", async function (req, res, next) {
  try {
    const pool = await getPool();
    // Just a health check query or sample data
    const result = await pool.request().query("SELECT TOP 1 * FROM Users");
    console.log("Health check result:", result.recordset);
    res.render("index", { title: "Express API Running" });
  } catch (err) {
    console.error("Homepage DB Error:", err);
    res.render("index", { title: "Express - DB Error" });
  }
});

module.exports = router;
