/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
import 'source-map-support/register';
import {_} from 'lodash';
import crypto from 'crypto';
import moment from 'moment';
import {Args,TraceUtils,LangUtils,RandomUtils} from '@themost/common/utils';
import {HttpConsumer} from '../consumers';
import {HttpNextResult} from '../results';
import {HttpApplicationService} from "../interfaces";
import {AbstractClassError, AbstractMethodError, HttpForbiddenError, HttpUnauthorizedError} from "@themost/common/errors";
import Q from 'q';

const ANONYMOUS_IDENTITY = { name: 'anonymous', authenticationType:'None' };
/**
 * @classdesc @classdesc Default authentication handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
 */
class AuthHandler {

    /**
     * Authenticates an HTTP request and sets user or anonymous identity.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    authenticateRequest(context, callback) {
        try {
            if (!context.getApplication().hasService(AuthStrategy)) {
                return callback();
            }
            const authStrategy = context.getApplication().getService(AuthStrategy);
            const authCookieStr = authStrategy.getAuthCookie(context);
            if (_.isNil(authCookieStr)) {
                authStrategy.setAuthCookie(context,'anonymous');
                context.user = ANONYMOUS_IDENTITY;
                return callback();
            }
            else {
                const authCookie = JSON.parse(authCookieStr);
                if (authCookie.user)
                {
                    context.user = { name: authCookie.user, authenticationType:'Basic' };
                    return callback();
                }
                else {
                    authStrategy.setAuthCookie(context,'anonymous');
                    return callback();
                }
            }
        }
        catch (err) {
            return callback(err);
        }
    }
}

export class AuthConsumer extends HttpConsumer {
    constructor() {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new AuthHandler();
                return Q.nfbind(handler.authenticateRequest)(context)
                    .then(()=> {
                        return HttpNextResult.create().toPromise();
                    });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}

/**
 * @classdesc Default basic authentication handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 */
class BasicAuthHandler {
    /**
     * @param {string} s
     * @returns {{userName:string, userPassword:string}|undefined}
     * @ignore
     */
    static parseBasicAuthorization(s) {
        try {
            if (typeof s !== 'string')
                return;
            //get authorization type (basic)
            const re = /\s?(Basic)\s+(.*)\s?/ig;
            const match = re.exec(s.replace(/^\s+/g,''));
            if (match) {
                //get authorization token
                const token = match[2];
                //decode token
                const buffer = new Buffer(token, 'base64');
                //get args e.g. username:password
                const matched = /(.*):(.*)/ig.exec(buffer.toString());
                if (matched) {
                    return { userName:matched[1], userPassword:matched[2] };
                }
            }
        }
        catch(err) {
            TraceUtils.log(err);
        }
    }

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     * @returns {*}
     */
    authenticateRequest(context, callback) {
        try {
            if (!context.getApplication().hasService(AuthStrategy)) {
                return callback();
            }
            /**
             * @type {{userName: string, userPassword: string}|*}
             */
            const authorizationArgs = BasicAuthHandler.parseBasicAuthorization(context.request.headers['authorization']);
            if (_.isNil(authorizationArgs)) {
                return callback();
            }
            /**
             * @type {AuthStrategy}
             */
            const authStrategy = context.getApplication().getService(AuthStrategy);
            authStrategy.login(context,authorizationArgs.userName, authorizationArgs.userPassword).then(()=>{
                return callback(null, true);
            }).catch((err)=> {
                return callback(err);
            });
        }
        catch(err) {
            return callback(err);
        }
    }
}

BasicAuthHandler.USERNAME_REGEXP = /^[a-zA-Z0-9.@_-]{1,255}$/;

export class BasicAuthConsumer extends HttpConsumer {
    constructor() {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new BasicAuthHandler();
                return Q.nfbind(handler.authenticateRequest)(context)
                    .then(()=> {
                        return HttpNextResult.create().toPromise();
                    });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}

export class AuthStrategy extends HttpApplicationService {
    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
        Args.check(new.target !== AuthStrategy, new AbstractClassError());
        super(app);
    }

    /**
     * Sets the authentication cookie for the given context
     * @param {HttpContext} thisContext
     * @param {string} userName
     * @param {*} options
     */
    setAuthCookie(thisContext, userName, options) {
        throw new AbstractMethodError();
    }
    /**
     * Gets the authentication cookie of the given context
     * @param {HttpContext} thisContext
     * @returns {*}
     */
    getAuthCookie(thisContext) {
        throw new AbstractMethodError();
    }

    /**
     * Validates the specified credentials and authorizes the given context by setting the authorization cookie
     * @param thisContext - The current context
     * @param userName - A string which represents the user name
     * @param userPassword - A string which represents the user password
     * @returns {Promise}
     */
    login(thisContext, userName, userPassword) {
        throw new AbstractMethodError();
    }

    /**
     * Removes any authorization assigned to the given context
     * @param thisContext
     * @returns {Promise}
     */
    logout(thisContext) {
        throw new AbstractMethodError();
    }

    /**
     * Gets the unattended execution account
     * @returns {string}
     */
    getUnattendedExecutionAccount() {
        throw new AbstractMethodError();
    }

}

const optionsProperty = Symbol('options');

export class DefaultAuthStrategy extends HttpApplicationService {
    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
        super(app);
        //get cookie name (from configuration)
        this[optionsProperty] = {
            "name":".MAUTH",
            "slidingExpiration": false,
            "expirationTimeout":420,
            "unattendedExecutionAccount":RandomUtils.randomChars(16)
        };
        //get keys
        const keys = _.keys(this[optionsProperty]);
        //pick authSetting based on the given keys
        const authSettings = _.pick(app.getConfiguration().settings.auth, keys);
        //and assign properties to default
        _.assign(this[optionsProperty], authSettings);
    }

    getOptions() {
        return this[optionsProperty];
    }

    /**
     * Gets the unattended execution account
     * @returns {string}
     */
    getUnattendedExecutionAccount() {
        return this[optionsProperty].unattendedExecutionAccount;
    }

    /**
     * Sets the authentication cookie for the given context
     * @param {HttpContext} thisContext - The current HTTP context
     * @param {string} userName - The username to authorize
     * @param {*=} options - Any other option we need to include in authorization cookie
     */
    setAuthCookie(thisContext, userName, options) {
        const defaultOptions = { user:userName, dateCreated:new Date()};
        let value;
        let expires;
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
            const expirationTimeout = LangUtils.parseInt(this.getOptions().expirationTimeout);
            if (expirationTimeout>0) {
                expires = moment(new Date()).add(expirationTimeout,'minutes').toDate().toUTCString();
            }
        }
        let str = this[optionsProperty].name.concat('=', this.getApplication().encrypt(value)) + ';path=/';
        if (typeof expires === 'string') {
            str +=';expires=' + expires;
        }
        thisContext.response.setHeader('Set-Cookie',str);
    }

    /**
     * Gets the authentication cookie of the given context
     * @param {HttpContext} thisContext
     * @returns {*}
     */
    getAuthCookie(thisContext) {
        const name = this.getOptions().name;
        const cookie = thisContext.getCookie(name);
        if (cookie) {
            return this.getApplication().decrypt(cookie);
        }
    }

    /**
     * Validates the specified credentials and authorizes the given context by setting the authorization cookie
     * @param thisContext - The current context
     * @param userName - A string which represents the user name
     * @param userPassword - A string which represents the user password
     * @returns {Promise}
     */
    login(thisContext, userName, userPassword) {
        const self = this;
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
                    const model = context.model('UserCredential');
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

    }

    /**
     * Removes any authorization assigned to the given context
     * @param thisContext
     * @returns {Promise}
     */
    logout(thisContext) {
        const self = this;
        return Q.nfbind(function(callback) {
            //set auth cookie
            self.setAuthCookie(thisContext,'anonymous');
            return callback();
        })();
    }

}

/**
 * @classdesc Represents the encryption strategy of an HTTP application
 * @class
 */
export class EncryptionStrategy extends HttpApplicationService {

    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
        Args.check(new.target !== AuthStrategy, new AbstractClassError());
        super(app);
    }

    /**
     * Encrypts the given data
     * @param {*} data
     * */
    encrypt(data) {
        throw new AbstractMethodError();
    }

    /**
     * Decrypts the given data
     * @param {string} data
     * */
    decrypt(data) {
        throw new AbstractMethodError();
    }

}

const cryptoProperty = Symbol('crypto');

/**
 * @classdesc Represents the default encryption strategy of an HTTP application
 * @class
 * @augments EncryptionStrategy
 */
export class DefaultEncyptionStrategy extends EncryptionStrategy {
    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
        super(app);
        this[cryptoProperty] = { };
        //get
        _.assign(this[cryptoProperty], app.getConfiguration().settings.crypto);
    }

    getOptions() {
        return this[cryptoProperty];
    }

    /**
     * Encrypts the given data
     * @param {*} data
     * */
    encrypt(data) {
        if (_.isNil(data))
            return;
        Args.check(this.getApplication().hasService(EncryptionStrategy),'Encryption strategy is missing');
        const options = this.getOptions();
        //validate settings
        Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
        Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
        //encrypt
        const cipher = crypto.createCipher(options.algorithm, options.key);
        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    }

    /**
     * Decrypts the given data
     * @param {string} data
     * */
    decrypt(data) {
        if (_.isNil(data))
            return;
        Args.check(this.getApplication().hasService(EncryptionStrategy),'Encryption strategy is missing');
        //validate settings
        const options = this.getOptions();
        //validate settings
        Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
        Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
        //decrypt
        const decipher = crypto.createDecipher(options.algorithm, options.key);
        return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
    }


}
