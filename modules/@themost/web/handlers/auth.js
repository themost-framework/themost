/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var TraceUtils = require('@themost/common/utils').TraceUtils;
var RandomUtils = require('@themost/common/utils').RandomUtils;
var AbstractClassError = require('@themost/common/errors').AbstractClassError;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;
var HttpUnauthorizedError = require('@themost/common/errors').HttpUnauthorizedError;
var HttpForbiddenError = require('@themost/common/errors').HttpForbiddenError;
var LangUtils = require('@themost/common/utils').LangUtils;
var Args = require('@themost/common/utils').Args;
var HttpApplicationService = require('./../types').HttpApplicationService;
var Symbol = require('symbol');
var _ = require('lodash');
var moment = require('moment');
var crypto = require('crypto');
var Q = require('q');

var optionsProperty = Symbol('options');

/**
 * @class
 * @constructor
 * @implements AuthenticateRequestHandler
 * @implements PreExecuteResultHandler
 */
function AuthHandler() {
    //
}
/**
  * @param {IncomingMessage|ClientRequest} request
 * @returns {*}
 */
AuthHandler.parseCookies = function(request) {
    var list = {},
        rc = request.headers.cookie;
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });
    return list;
};

AuthHandler.ANONYMOUS_IDENTITY = { name: 'anonymous', authenticationType:'None' };

/**
 * Authenticates an HTTP request and sets user or anonymous identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
AuthHandler.prototype.authenticateRequest = function (context, callback) {
    try {
        callback = callback || function() {};
        var cookies = {}, model = context.model('User');
        var config = context.getApplication().getConfiguration();
        var settings = config.settings ? (config.settings.auth || { }) : { } ;
        settings.name = settings.name || '.MAUTH';
        if (context && context.request)
            cookies = AuthHandler.parseCookies(context.request);
        if (cookies[settings.name]) {
            var str = null;
            try {
                str =context.getApplication().getEncryptionStrategy().decrypt(cookies[settings.name]);
            }
            catch (err) {
                TraceUtils.log(err);
            }
            //and continue
            var userName = null;
            if (str) {
                var authCookie = JSON.parse(str);
                //validate authentication cookie
                if (authCookie.user)
                    userName = authCookie.user;
            }
            if (typeof model === 'undefined' || model === null) {
                //no authentication provider is defined
                context.user = { name: userName || 'anonymous', authenticationType:'Basic' };
                return callback();
            }
            //search for user
            if (userName) {
                //set user identity
                context.user = model.convert({ name: userName, authenticationType:'Basic' });
            }
            else {
                //an auth cookie was found but user data or user model does not exist
                //set anonymous identity
                context.user = model.convert(AuthHandler.ANONYMOUS_IDENTITY);
            }
            return callback();
        }
        else {
            //set anonymous identity
            if (model)
                context.user = model.convert(AuthHandler.ANONYMOUS_IDENTITY);
            else
                context.user = AuthHandler.ANONYMOUS_IDENTITY;
            //no auth cookie was found on request
            return callback();
        }
    }
    catch (err) {
        return callback(err);
    }
};
/**
 *
 * @param {PreExecuteResultArgs} args
 * @param {Function} callback
 */
AuthHandler.prototype.preExecuteResult = function (args, callback) {
    try {
        callback = callback || function() {};
        var context = args.context, model = context.model('User');
        if (typeof model === 'undefined' || model === null) {
            return callback();
        }
        var authenticationType = context.user.authenticationType;
        model.where('name').equal(context.user.name).expand('groups').silent().first(function(err, result) {
           if (err) { return callback(err); }
            if (result) {
                //replace context.user with data object
                context.user = model.convert(result);
                context.user.authenticationType = authenticationType;
                return callback();
            }
            else if (context.user.name!=='anonymous') {
                model.where('name').equal('anonymous').expand('groups').silent().first(function(err, result) {
                    if (err) {
                        return callback(err);
                    }
                    if (result) {
                        context.user = model.convert(result);
                        context.user.authenticationType = authenticationType;
                    }
                    return callback();
                });
            }
            else {
                //do nothing
                return callback();
            }
        });
    }
    catch (err) {
        callback(err);
    }
};

/**
 * Creates a new instance of AuthHandler class
 * @returns {AuthHandler}
 */
AuthHandler.createInstance = function() {
   return new AuthHandler();
};

/**
 * @abstract
 * @class
 * @constructor
 * @augments HttpApplicationService
 * @param {HttpApplication} app
 */
function AuthStrategy(app) {
    AuthStrategy.super_.bind(this)(app);
    if (this.constructor === AuthStrategy.prototype.constructor) {
        throw new AbstractClassError();
    }
}
LangUtils.inherits(AuthStrategy, HttpApplicationService);

// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Sets the authentication cookie for the given context
 * @param {HttpContext} thisContext
 * @param {string} userName
 * @param {*} options
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
AuthStrategy.prototype.setAuthCookie = function(thisContext, userName, options) {
    throw new AbstractMethodError();
};
// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Gets the authentication cookie of the given context
 * @param {HttpContext} thisContext
 * @returns {*}
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
AuthStrategy.prototype.getAuthCookie = function(thisContext) {
    throw new AbstractMethodError();
};

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
/**
 * Validates the specified credentials and authorizes the given context by setting the authorization cookie
 * @param {HttpContext} thisContext - The current context
 * @param userName - A string which represents the user name
 * @param userPassword - A string which represents the user password
 * @returns {Promise}
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
AuthStrategy.prototype.login = function(thisContext, userName, userPassword) {
    throw new AbstractMethodError();
};

// noinspection JSUnusedGlobalSymbols
// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Removes any authorization assigned to the given context
 * @param {HttpContext} thisContext
 * @returns {Promise}
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
AuthStrategy.prototype.logout = function(thisContext) {
    throw new AbstractMethodError();
};
// noinspection JSUnusedGlobalSymbols
/**
 * Gets the unattended execution account
 * @returns {string}
 * @abstract
 */
AuthStrategy.prototype.getUnattendedExecutionAccount = function() {
    throw new AbstractMethodError();
};
// noinspection JSUnusedGlobalSymbols
/**
 * Gets the options of this authentication strategy
 * @abstract
 * @returns {*}
 */
AuthStrategy.prototype.getOptions = function() {
    throw new AbstractMethodError();
};

/**
 * @class
 * @constructor
 * @augments AuthStrategy
 * @param {HttpApplication} app
 */
function DefaultAuthStrategy(app) {
    DefaultAuthStrategy.super_.bind(this)(app);
    //get cookie name (from configuration)
    this[optionsProperty] = {
        "name":".MAUTH",
        "slidingExpiration": false,
        "expirationTimeout":420,
        "unattendedExecutionAccount":RandomUtils.randomChars(16)
    };
    //get keys
    var keys = _.keys(this[optionsProperty]);
    //pick authSetting based on the given keys
    var authSettings = _.pick(app.getConfiguration().settings.auth, keys);
    //and assign properties to default
    _.assign(this[optionsProperty], authSettings);
}
LangUtils.inherits(DefaultAuthStrategy, AuthStrategy);

/**
 * Gets the options of this authentication strategy
 * @abstract
 * @returns {*}
 */
DefaultAuthStrategy.prototype.getOptions = function() {
    return this[optionsProperty];
};
/**
 * Sets the authentication cookie for the given context
 * @param {HttpContext} thisContext - The current HTTP context
 * @param {string} userName - The username to authorize
 * @param {*=} options - Any other option we need to include in authorization cookie
 */
DefaultAuthStrategy.prototype.setAuthCookie = function(thisContext, userName, options) {
    var defaultOptions = { user:userName, dateCreated:new Date()};
    var value;
    var expires;
    if (_.isObject(options)) {
        value = JSON.stringify(_.assign(options, defaultOptions));
        if (_.isDate(options['expires'])) {
            expires = options['expires'].toUTCString();
        }
    }
    else {
        value = JSON.stringify(defaultOptions);
    }
    //set default expiration as it has been defined in application configuration
    if (_.isNil(expires) && _.isNumber(this.getOptions().expirationTimeout)) {
        var expirationTimeout = LangUtils.parseInt(this.getOptions().expirationTimeout);
        if (expirationTimeout>0) {
            expires = moment(new Date()).add(expirationTimeout,'minutes').toDate().toUTCString();
        }
    }
    var str = this[optionsProperty].name.concat('=', this.getApplication().getEncryptionStrategy().encrypt(value)) + ';path=/';
    if (typeof expires === 'string') {
        str +=';expires=' + expires;
    }
    thisContext.response.setHeader('Set-Cookie',str);
};

// noinspection JSUnusedGlobalSymbols
/**
 * Validates the specified credentials and authorizes the given context by setting the authorization cookie
 * @param thisContext - The current context
 * @param userName - A string which represents the user name
 * @param userPassword - A string which represents the user password
 * @returns {Promise|*}
 */
DefaultAuthStrategy.prototype.login = function(thisContext, userName, userPassword) {
    var self = this;
    return Q.nfbind(function(context, userName, password, callback) {
        try {
            context.model('user').where('name').equal(userName).select('id','enabled').silent().first(function(err, result) {
                if (err) {
                    return callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                }
                if (_.isNil(result)) {
                    return callback(new HttpUnauthorizedError('Unknown username. Please try again.'));
                }
                if (!result.enabled) {
                    return callback(new HttpForbiddenError('The account is disabled. Please contact your system administrator.'));
                }
                //user was found
                var model = context.model('UserCredential');
                if (typeof model === 'undefined' || model === null) {
                    TraceUtils.log('UserCredential model is missing.');
                    return callback(new Error('Login failed due to server error.'));
                }
                model.where('id').equal(result.id).prepare()
                    .and('userPassword').equal('{clear}'.concat(userPassword))
                    .or('userPassword').equal('{md5}'.concat(crypto.createHash('md5').update(userPassword).digest('hex')))
                    .or('userPassword').equal('{sha1}'.concat(crypto.createHash('sha1').update(userPassword).digest('hex')))
                    .silent().count().then(function(count) {
                    if (count===1) {
                        //set cookie
                        self.setAuthCookie(context, userName);
                        context.user = { name: userName, authenticationType:'Basic' };
                        return callback(null, true);
                    }
                    return callback(new HttpUnauthorizedError('Unknown username or bad password.'));
                }).catch(function(err) {
                    TraceUtils.log(err);
                    return callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                });
            });
        }
        catch (err) {
            TraceUtils.log(err);
            return callback(new Error('Login failed due to internal server error.'));
        }

    })(thisContext, userName, userPassword);

};

// noinspection JSUnusedGlobalSymbols
/**
 * Removes any authorization assigned to the given context
 * @param thisContext
 * @returns {Promise|*}
 */
DefaultAuthStrategy.prototype.logout = function(thisContext) {
    var self = this;
    return Q.nfbind(function(callback) {
        //set auth cookie
        self.setAuthCookie(thisContext,'anonymous');
        return callback();
    })();
};
// JSUnusedGlobalSymbols
// noinspection JSUnusedGlobalSymbols
/**
 * Gets the authentication cookie of the given context
 * @param {HttpContext} thisContext
 * @returns {*}
 */
DefaultAuthStrategy.prototype.getAuthCookie = function(thisContext) {
    var name = this.getOptions().name;
    var cookie = thisContext.getCookie(name);
    if (cookie) {
        return this.getApplication().getEncryptionStrategy().decrypt(cookie);
    }
};

// noinspection JSUnusedGlobalSymbols
/**
 * Gets the unattended execution account
 * @returns {string}
 */
DefaultAuthStrategy.prototype.getUnattendedExecutionAccount = function() {
    return this[optionsProperty].unattendedExecutionAccount;
};

/**
 * @abstract
 * @class
 * @constructor
 * @augments HttpApplicationService
 * @param {HttpApplication} app
 */
function EncryptionStrategy(app) {
    EncryptionStrategy.super_.bind(this)(app);
    if (this.constructor === EncryptionStrategy.prototype.constructor) {
        throw new AbstractClassError();
    }
}
LangUtils.inherits(EncryptionStrategy, HttpApplicationService);

// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Encrypts the given data
 * @abstract
 * @param {*} data
 * @returns {*}
 * */
// eslint-disable-next-line no-unused-vars
EncryptionStrategy.prototype.encrypt = function(data) {
    throw new AbstractMethodError();
};

// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * @abstract
 * Decrypts the given data
 * @param {string} data
 * @returns {*}
 * */
// eslint-disable-next-line no-unused-vars
EncryptionStrategy.prototype.decrypt = function(data) {
    throw new AbstractMethodError();
};

var cryptoProperty = Symbol('crypto');

/**
 * @class
 * @constructor
 * @augments HttpApplicationService
 * @param {HttpApplication} app
 */
function DefaultEncryptionStrategy(app) {
    DefaultEncryptionStrategy.super_.bind(this)(app);
    this[cryptoProperty] = { };
    _.assign(this[cryptoProperty], app.getConfiguration().settings.crypto);
}
LangUtils.inherits(DefaultEncryptionStrategy, EncryptionStrategy);
/**
 * @returns {*}
 */
DefaultEncryptionStrategy.prototype.getOptions = function() {
    return this[cryptoProperty];
};
// noinspection JSUnusedGlobalSymbols
/**
 * Encrypts the given data
 * @param {*} data
 * @returns {*}
 * */
DefaultEncryptionStrategy.prototype.encrypt = function(data) {
    if (_.isNil(data)) {
        return;
    }
    Args.check(this.getApplication().hasService(EncryptionStrategy),'Encryption strategy is missing');
    var options = this.getOptions();
    //validate settings
    Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
    Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
    //encrypt
    var cipher = crypto.createCipher(options.algorithm, options.key);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};

// noinspection JSUnusedGlobalSymbols
/**
 * Decrypts the given data
 * @param {string} data
 * @returns {*}
 * */
DefaultEncryptionStrategy.prototype.decrypt = function(data) {
    if (_.isNil(data))
        return;
    Args.check(this.getApplication().hasService(EncryptionStrategy),'Encryption strategy is missing');
    //validate settings
    var options = this.getOptions();
    //validate settings
    Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
    Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
    //decrypt
    var decipher = crypto.createDecipher(options.algorithm, options.key);
    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
};


if (typeof exports !== 'undefined') {
    module.exports.AuthHandler = AuthHandler;
    /**
     * @returns {AuthHandler}
     */
    module.exports.createInstance = function () {
        return AuthHandler.createInstance()
    };
    module.exports.AuthStrategy = AuthStrategy;
    module.exports.DefaultAuthStrategy = DefaultAuthStrategy;
    module.exports.EncryptionStrategy = EncryptionStrategy;
    module.exports.DefaultEncryptionStrategy = DefaultEncryptionStrategy;
}
