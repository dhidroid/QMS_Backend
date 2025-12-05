var express = require("express");
var router = express.Router();
const { getPool, sql } = require("../config/db.config");

/* GET home page. */
router.get("/", async function (req, res, next) {
  res.render("index", { title: "Express" });

//   DB_USER=
// DB_PASSWORD=Strong@123
// DB_SERVER=localhost
// DB_DATABASE=QMS_WEB_DB
// DB_PORT=1433
// DB_ENCRYPT=true
// DB_TRUST_SERVER_CERTIFICATE=true
  const config = {
    user: "sa",
    password: "Strong@123",
    server: "localhost",
    database: "QMS_WEB_DB",
    port: 1433,
    options: {
      encrypt: process.env.DB_ENCRYPT === "true",
      trustServerCertificate:
        process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
  const pool = sql.connect(config);
  const result = await pool.then((p) =>
    p.request().query("SELECT TOP 10 * FROM Users")
  );
  console.log(result.recordset);
});

module.exports = router;
