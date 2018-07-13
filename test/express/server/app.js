/*eslint-env node*/
import 'source-map-support/register';
import path from 'path';
import express from 'express';
import engine from 'ejs-locals';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import compression from 'compression';
import passport from 'passport';
import index from './routes/index';
import {dataContext,authContext,basicAuthContext} from './data';
import api from './routes/api';
import auth from './routes/auth';
import cors from 'cors';
import cookieSession from 'cookie-session';

const app = express();
//use static files
app.use(express.static('public'));
//use compression
app.use(compression());
//use cors
app.use(cors());
// use ejs-locals for all ejs templates:
app.engine('ejs', engine);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//initialize passport
app.use(passport.initialize());
//use body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//use cookie session
app.use(cookieSession({
  name: '.auth',
  keys: ['516658634e48686f727a787a367873676d385841626d756e774c38364a597a4b']
}));
//use cookie parser
app.use(cookieParser());

//use @themost/data DataContext
/**
 * This middleware extends ExpressJS Request
 * by adding Request.context property which may be used for accessing data
 * through @themost/data ORM module
 */
app.use(dataContext());
//use basic authentication for all requests
app.use(basicAuthContext());
//use @themost/data local authentication strategy
app.use(authContext());

/**
 * Configure Passport
 */

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  return done(null, user);
});



//set routes
app.use('/', auth);
app.use('/', index);
app.use('/api/', api);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  /* eslint-disable no-unused-vars */
  app.use((err, req, res, next) => {
    console.error(err);
    /* eslint-enable no-unused-vars */
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stack traces leaked to user
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  /* eslint-enable no-unused-vars */
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

export default app;