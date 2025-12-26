require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var dbMiddleware = require("./middlewares/db.middleware.js");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const authRoutes = require("./routes/auth.js");
const tokenRoutes = require("./routes/token.js");
const adminRoutes = require("./routes/admin.js");
const handlerRoutes = require("./routes/handler.js");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


var cors = require('cors');

// CORS: allow the production frontend and common dev origins
const allowedOrigins = [
  'https://qms-frontend-bice.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(dbMiddleware);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use("/api/auth", authRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/handler", handlerRoutes);


app.post("/api/subscribe", async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint)
    return res.status(400).json({ message: "invalid sub" });
  const { getPool, sql } = require("./db/pool");
  try {
    const pool = await getPool();
    await pool
      .request()
      .input("Endpoint", sql.NVarChar(1000), subscription.endpoint)
      .input(
        "Keys",
        sql.NVarChar(sql.MAX),
        JSON.stringify(subscription.keys || {})
      )
      .execute("sp_AddPushSubscription");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "err" });
  }
});


// const io = sockets.init(server);
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;