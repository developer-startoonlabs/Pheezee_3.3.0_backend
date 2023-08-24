var createError = require('http-errors');
/**
*Provides a robust set of features for web and mobile applications
*
*@module express
*
*/
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const ejsMate = require('ejs-mate');
const User = require('./repo/user');

const passport = require('passport');
const LocalStrategy = require('passport-local');
// const User = require('./repo/userModel');



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');
const flash = require('connect-flash')

var app = express();

// view engine setup
/**
*Setting up the view engine as ejs.
*
*@module ejs
*
*/
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: false,limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

console.log(app.settings.env);
/**
*Redirect all default request to indexRouter.
*/
// Passport credentials for securing routes 
app.use(
  require("express-session")({
    secret: "jfdkjfdlakjnfdjknfKJNSFSIEFUJDKSFJADKFJSKDNjslbalsbadsljslakdjaskdbksjd",
    resave: false,
    saveUninitialized: false
  })
);
app.locals.moment = require("moment");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(req.ip);
  next(createError(404));
});

/**
*
*Handles all the errors occured.
*/
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  console.log(err);
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
