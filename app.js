var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors')

const mongoUri = process.env.MONGO_URI;
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:8000', 'https://badminton-queue-h1zt.vercel.app', 'https://badminton-queue-gilt.vercel.app'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['OPTIONS', 'GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Add required headers
  exposedHeaders: ['Content-Length'],               // Add exposed headers if needed
  credentials: true,
};

mongoose.Promise = global.Promise
mongoose.connect(mongoUri).then((res) => {
  console.log('connect success');
}).catch((err) => {
  console.log(`error ${err}`);
})

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const playersRouter = require('./routes/players');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//set port

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsOptions))

//access path
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/players', playersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
