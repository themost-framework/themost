/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var crypto = require('crypto');
var HttpForbiddenError = require('@themost/common/errors').HttpForbiddenError;
var HttpUnauthorizedError = require('@themost/common/errors').HttpUnauthorizedError;
var sprintf = require('sprintf').sprintf;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var RandomUtils = require('@themost/common/utils').RandomUtils;
var LangUtils = require('@themost/common/utils').LangUtils;
var AbstractClassError = require('@themost/common/errors').AbstractClassError;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;
var HttpApplicationStrategy = require('../common').HttpApplicationStrategy;
var Args = require('@themost/common/utils').Args;
var Q = require('q');
var Symbol = require('symbol');
var EncryptionStrategy = require("./encyption").EncryptionStrategy;
var optionsProperty = Symbol('options');

/** @module @themost/web/strategies/auth */

/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @extends HttpApplicationStrategy
 * @abstract
 * @memberOf module:@themost/web/strategies/auth
 */
function AuthStrategy(app) {
    AuthStrategy.super_.bind(this)(app);
    Args.check((this.constructor.name !== 'AuthStrategy'), new AbstractClassError());
}
LangUtils.inherits(AuthStrategy, HttpApplicationStrategy);

/**
 * @param {HttpContext} thisContext
 * @param {string} userName
 * @param {*} options
 * @abstract
 */
AuthStrategy.prototype.setAuthCookie = function(thisContext, userName, options) {
    throw new AbstractMethodError();
};

/**
 * @param {HttpContext} thisContext
 * @abstract
 */
AuthStrategy.prototype.getAuthCookie = function(thisContext) {
    throw new AbstractMethodError();
};

/**
 * Validates the specified credentials and authorizes the given context by setting the authorization cookie
 * @param thisContext - The current context
 * @param userName - A string which represents the user name
 * @param userPassword - A string which represents the user password
 * @returns {Promise}
 * @abstract
 */
AuthStrategy.prototype.login = function(thisContext, userName, userPassword) {
    throw new AbstractMethodError();
};

/**
 * Removes any authorization assigned to the given context
 * @param thisContext
 * @returns {Promise}
 * @abstract
 */
AuthStrategy.prototype.logout = function(thisContext) {
    throw new AbstractMethodError();
};

/**
 * Gets the unattended execution account
 * @returns {string}
 * @abstract
 */
AuthStrategy.prototype.getUnattendedExecutionAccount = function() {
    throw new AbstractMethodError();
};

/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @extends AuthStrategy
 * @memberOf module:@themost/web/strategies/auth
 */
function DefaultAuthStrategy(app) {

    AuthStrategy.super_.bind(this)(app);

    this[optionsProperty] = {
        "name":".MAUTH",
        "slidingExpiration": false,
        "expirationTimeout":0,
        "unattendedExecutionAccount":RandomUtils.randomChars(16)
    };
    //get keys
    const keys = _.keys(this[optionsProperty]);
    //pick authSetting based on the given keys
    const authSettings = _.pick(app.getConfiguration().getSourceAt('settings/auth'), keys);
    //and assign properties to default
    _.assign(this[optionsProperty], authSettings);

}
LangUtils.inherits(DefaultAuthStrategy, HttpApplicationStrategy);

/**
 * @returns {*}
 */
DefaultAuthStrategy.prototype.getOptions = function () {
    return this[optionsProperty]
};

/**
 * Validates the specified credentials and authorizes the given context by setting the authorization cookie
 * @param thisContext - The current context
 * @param userName - A string which represents the user name
 * @param userPassword - A string which represents the user password
 * @returns {Promise}
 * @abstract
 */
DefaultAuthStrategy.prototype.login = function (thisContext, userName, userPassword) {
    return Q.promise(function(resolve, reject) {
        try {
            thisContext.model('user').where('name').equal(userName).select(['id','enabled']).silent().first(function(err, result) {
                if (err) {
                    return reject(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                }
                else {
                    if (result) {
                        if (!result.enabled) {
                            return reject(new HttpForbiddenError('The account is disabled. Please contact your system administrator.'));
                        }
                        //user was found
                        var model = thisContext.model('UserCredential');
                        if (typeof model === 'undefined' || model === null) {
                            TraceUtils.log('UserCredential model is missing.');
                            return reject(new Error('Login failed due to server error.'));
                        }
                        model.where('id').equal(result.id).silent().first(function (err, creds) {
                            if (err) {
                                TraceUtils.log(err);
                                return reject(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                            }
                            else {
                                if (creds) {
                                    var authenticated = false;
                                    //user credentials were found
                                    //1. clear text
                                    if (/^\{clear\}/i.test(creds.userPassword)) {
                                        authenticated = (creds.userPassword.replace(/^\{clear\}/i, '') === userPassword)
                                    }
                                    //2. md5 text
                                    else if (/^\{md5\}/i.test(creds.userPassword)) {
                                        var md5password = crypto.createHash('md5').update(userPassword).digest('hex');
                                        authenticated = (creds.userPassword.replace(/^\{md5\}/i, '') === md5password)
                                    }
                                    //3. sha1 text
                                    else if (/^\{sha1\}/i.test(creds.userPassword)) {
                                        var sha1password = crypto.createHash('sha1').update(userPassword).digest('hex');
                                        authenticated = (creds.userPassword.replace(/^\{sha1\}/i, '') === sha1password)
                                    }
                                    if (authenticated) {
                                        //set cookie
                                        thisContext.application.setAuthCookie(thisContext, userName);
                                        thisContext.user = model.convert({ name: userName, authenticationType:'Basic' });
                                        return resolve();
                                    }
                                    else {
                                        return reject(new HttpUnauthorizedError('Unknown username or bad password.'));
                                    }
                                }
                                else {
                                    TraceUtils.log(sprintf('User credentials cannot be found (%s).', userName));
                                    return reject(new HttpUnauthorizedError('Unknown username or bad password.'));
                                }
                            }
                        });
                    }
                    else {
                        //user was not found
                        return reject(new HttpUnauthorizedError('Unknown username. Please try again.'));
                    }
                }
            });
        }
        catch (err) {
            TraceUtils.log(err);
            return reject(new Error('Login failed due to internal server error.'));
        }
    });
};

/**
 *
 * @param {HttpContext} thisContext
 * @returns {Promise}
 */
DefaultAuthStrategy.prototype.logout = function (thisContext) {
    return Q.promise(function(resolve, reject) {
        var anonymousIdentity = { name: 'anonymous', authenticationType:'None' };
        try {
            //get user model, if any
            var model = thisContext.model('User');
            //set auth cookie to anonymous
            thisContext.application.setAuthCookie(thisContext, 'anonymous');
            //check user model and set HttpContext.user property
            if (model)
                thisContext.user = model.convert(anonymousIdentity);
            else
                thisContext.user = anonymousIdentity;
            return resolve();
        }
        catch(err) {
            TraceUtils.log(e);
            if (thisContext) {
                thisContext.user = anonymousIdentity;
            }
            return reject(err);
        }
    });

};
/**
 * Sets the authentication cookie that is associated with the given user.
 * @param {HttpContext} thisContext
 * @param {String} userName
 * @param {*=} options
 */
DefaultAuthStrategy.prototype.setAuthCookie = function (thisContext, userName, options) {

    var defaultOptions = { user:userName, dateCreated:new Date()}, value, expires;
    if (_.isNumber(this.getOptions().expirationTimeout) && this.getOptions().expirationTimeout>0) {
        var now = moment(new Date());
        expires = now.add('minutes',this.getOptions().expirationTimeout).toDate().toUTCString();
    }
    if (_.isObject(options)) {
        value = JSON.stringify(_.assign(options, defaultOptions));
        if (_.isDate(options.expires)) {
            expires = options.expires.toUTCString();
        }
    }
    else {
        value = JSON.stringify(defaultOptions);
    }
    var name = this.getOptions().name || '.MAUTH';
    var str = name.concat('=', this.getApplication().getStrategy(EncryptionStrategy).encrypt(value)) + ';path=/';
    if (typeof expires === 'string') {
        str +=';expires=' + expires;
    }
    thisContext.response.setHeader('Set-Cookie',str);

};
/**
 * @returns {string}
 */
DefaultAuthStrategy.prototype.getUnattendedExecutionAccount = function () {
    return this.getOptions().unattendExecutionAccount;
};
/**
 * Gets the authentication cookie that is associated with the given user.
 * @param {HttpContext} thisContext
 */
DefaultAuthStrategy.prototype.getAuthCookie = function (thisContext) {
    try {
        var name = this.getOptions().name || '.MAUTH';
        var cookie = thisContext.cookie(name);
        if (cookie) {
            return this.getApplication().getStrategy(EncryptionStrategy).decrypt(cookie);
        }
    }
    catch(err) {
        TraceUtils.log('GetAuthCookie failed.');
        TraceUtils.log(err.message);
    }
};


if (typeof exports !== 'undefined') {
    module.exports.AuthStrategy = AuthStrategy;
    module.exports.DefaultAuthStrategy = DefaultAuthStrategy;
}
