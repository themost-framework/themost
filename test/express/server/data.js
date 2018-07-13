import path from 'path';
import _ from 'lodash';
import {ConfigurationBase} from '@themost/common/config';
import {DataConfigurationStrategy} from '@themost/data/data-configuration';
import {ODataModelBuilder,ODataConventionModelBuilder} from '@themost/data/odata';
import {DefaultDataContext} from '@themost/data/data-context';

//initialize @themost/data configuration by setting configuration base at ./server/config
const config = new ConfigurationBase(path.resolve(__dirname, "config"));
//use default data configuration strategy
config.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
//use OData model convention builder (this builder is going to be used for OData v4 REST Services)
config.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);

/**
 * Represents a data context used alongside with an ExpressJS application
 */
export class ExpressDataContext extends DefaultDataContext {
  /**
   * @param {ConfigurationBase=} configuration
   */
  constructor(configuration) {
    super();
    this.getConfiguration = ()=> configuration;
  }
  /**
   * @param {Function} strategyCtor 
   */
  getStrategy(strategyCtor) {
    return this.getConfiguration().getStrategy(strategyCtor);
  }

  /**
   * @returns {ExpressDataContext}
   */
  static create() {
    return new ExpressDataContext(config);
  }
}


/**
 * ExpressJS middleware for using @themost DataContext
 * @returns {Function}
 */
export function dataContext() {
  return function dataContextMiddleware(req, res, next) {
    /**
     * @name context
     * @type {ExpressDataContext}
     * @memberOf req
     */
    req.context = ExpressDataContext.create();
    req.on('end', ()=> {
      //on end
      if (req.context) {
        //finalize data context
        return req.context.finalize(()=> {
          //
        });
      }
    });
    return next();
  }
}

export function authContext() {
  return function authContextMiddleware(req, res, next) {
    if (req.session && req.session.passport && req.session.passport.user) {
      //get user
      return req.context.model('User').where('name').equal(req.session.passport.user.name).silent().expand("groups").cache(true).getTypedItem().then((user)=> {
        if (_.isNil(user)) {
          return next(new Error("User not found"));
        }
        req.context.user = user;
        return next();
      }).catch((err)=> {
        return next(err);
      });
    }
    return next();
  };
}

export function basicAuthContext() {
  return function basicAuthContextMiddleware(req, res, next) {
    if (req.header("authorization", { "session":false }) && /^Basic/.test(req.header("authorization"))) {
      const passport = require('passport');
      return passport.authenticate('basic')(req, res, function (err) {
        if (err) {
          return next(err);
        }
        return next();
      });
    }
    return next();
  };
}

export function bearerAuthContext() {
  return function bearerAuthContextMiddleware(req, res, next) {
    if (req.token) {
      //
    }
    return next();
  };
}