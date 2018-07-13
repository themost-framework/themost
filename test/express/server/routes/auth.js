import express from 'express';
import _ from 'lodash';
import passport from 'passport';
import {BasicStrategy}  from 'passport-http';
import {Strategy}  from 'passport-local';
import {ExpressDataContext} from "./../data";
const router = express.Router();


class LocalAuthenticationStrategy {

  static login(username, password) {
    return new Promise((resolve, reject) => {
      /**
       * @type {ExpressDataContext}
       */
      const context = ExpressDataContext.create();
      context.model('User').where('name').equal(username).silent().select('id','name').getItem().then((user)=> {
        if (_.isNil(user)) {
          return context.finalize(function() {
            return reject(new Error('Wrong username or password'));
          });
        }
        return context.model('UserCredential')
          .where('id').equal(user.id)
          .and('userPassword').equal("{clear}".concat(password)).silent().count().then((exists) => {
            return context.finalize(function() {
              if (exists) {
                return resolve({
                  "name":user.name,
                  "authenticationType":"basic"
                });
              }
              else {
                return reject(new Error('Wrong username or password'));
              }
            });
          });
      }).catch((err)=> {
        context.finalize(function() {
          return reject(err);
        });
      });
    });
  }

  static logout() {
    //do nothing
    return Promise.resolve();
  }
}

passport.use(new Strategy(
  function(username, password, done) {
    LocalAuthenticationStrategy.login(username, password).then((user)=> {
      return done(null, user);
    }).catch((err)=> {
      return done(err);
    });
  }));

passport.use(new BasicStrategy(
  function(username, password, done) {
    LocalAuthenticationStrategy.login(username, password).then((user)=> {
      return done(null, user);
    }).catch((err)=> {
      return done(err);
    });
  }
));

router.get('/login', function(req, res) {
  if (req.session && req.session.passport && req.session.passport.user) {
    return res.redirect('/');
  }
  res.render('login', {
    "action":req.path
  });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.render('login', {
        "action":req.path,
        "error":err
      });
    }
    return res.redirect('/');
  })(req, res, next);
});
  
export default router;