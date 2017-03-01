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

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DefaultEncyptionStrategy = exports.EncryptionStrategy = exports.DefaultAuthStrategy = exports.AuthStrategy = exports.BasicAuthConsumer = exports.AuthConsumer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _crypto = require('crypto');

var crypto = _interopRequireDefault(_crypto).default;

var _moment = require('moment');

var moment = _interopRequireDefault(_moment).default;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;
var TraceUtils = _utils.TraceUtils;
var LangUtils = _utils.LangUtils;
var RandomUtils = _utils.RandomUtils;

var _consumers = require('./consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _rxjs = require('rxjs');

var Rx = _interopRequireDefault(_rxjs).default;

var _results = require('./results');

var HttpNextResult = _results.HttpNextResult;

var _interfaces = require('./interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _errors = require('@themost/common/errors');

var AbstractClassError = _errors.AbstractClassError;
var AbstractMethodError = _errors.AbstractMethodError;
var HttpForbiddenError = _errors.HttpForbiddenError;
var HttpUnauthorizedError = _errors.HttpUnauthorizedError;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ANONYMOUS_IDENTITY = { name: 'anonymous', authenticationType: 'None' };
/**
 * @classdesc @classdesc Default authentication handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
 */

var AuthHandler = function () {
    function AuthHandler() {
        _classCallCheck(this, AuthHandler);
    }

    _createClass(AuthHandler, [{
        key: 'authenticateRequest',


        /**
         * Authenticates an HTTP request and sets user or anonymous identity.
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function authenticateRequest(context, callback) {
            try {
                if (!context.getApplication().hasService(AuthStrategy)) {
                    return callback();
                }
                var authStrategy = context.getApplication().getService(AuthStrategy);
                var authCookieStr = authStrategy.getAuthCookie(context);
                if (_.isNil(authCookieStr)) {
                    authStrategy.setAuthCookie(context, 'anonymous');
                    context.user = ANONYMOUS_IDENTITY;
                    return callback();
                } else {
                    var authCookie = JSON.parse(authCookieStr);
                    if (authCookie.user) {
                        context.user = { name: authCookie.user, authenticationType: 'Basic' };
                        return callback();
                    } else {
                        authStrategy.setAuthCookie(context, 'anonymous');
                        return callback();
                    }
                }
            } catch (err) {
                return callback(err);
            }
        }
    }]);

    return AuthHandler;
}();

var AuthConsumer = exports.AuthConsumer = function (_HttpConsumer) {
    _inherits(AuthConsumer, _HttpConsumer);

    function AuthConsumer() {
        _classCallCheck(this, AuthConsumer);

        return _possibleConstructorReturn(this, (AuthConsumer.__proto__ || Object.getPrototypeOf(AuthConsumer)).call(this, function () {
            /**
             * @type {HttpContext}
             */
            var context = this;
            try {
                var handler = new AuthHandler();
                return Rx.Observable.bindNodeCallback(handler.authenticateRequest)(context).flatMap(function () {
                    return HttpNextResult.create().toObservable();
                });
            } catch (err) {
                return Rx.Observable['throw'](err);
            }
        }));
    }

    return AuthConsumer;
}(HttpConsumer);

/**
 * @classdesc Default basic authentication handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 */


var BasicAuthHandler = function () {
    function BasicAuthHandler() {
        _classCallCheck(this, BasicAuthHandler);
    }

    _createClass(BasicAuthHandler, [{
        key: 'authenticateRequest',


        /**
         * @param {HttpContext} context
         * @param {Function} callback
         * @returns {*}
         */
        value: function authenticateRequest(context, callback) {
            try {
                if (!context.getApplication().hasService(AuthStrategy)) {
                    return callback();
                }
                /**
                 * @type {{userName: string, userPassword: string}|*}
                 */
                var authorizationArgs = BasicAuthHandler.parseBasicAuthorization(context.request.headers['authorization']);
                if (_.isNil(authorizationArgs)) {
                    return callback();
                }
                /**
                 * @type {AuthStrategy}
                 */
                var authStrategy = context.getApplication().getService(AuthStrategy);
                authStrategy.login(context, authorizationArgs.userName, authorizationArgs.userPassword).subscribe(function () {
                    return callback(null, true);
                }, function (err) {
                    return callback(err);
                });
            } catch (err) {
                return callback(err);
            }
        }
    }], [{
        key: 'parseBasicAuthorization',

        /**
         * @param {string} s
         * @returns {{userName:string, userPassword:string}|undefined}
         * @ignore
         */
        value: function parseBasicAuthorization(s) {
            try {
                if (typeof s !== 'string') return;
                //get authorization type (basic)
                var re = /\s?(Basic)\s+(.*)\s?/ig;
                var match = re.exec(s.replace(/^\s+/g, ''));
                if (match) {
                    //get authorization token
                    var token = match[2];
                    //decode token
                    var buffer = new Buffer(token, 'base64');
                    //get args e.g. username:password
                    var matched = /(.*):(.*)/ig.exec(buffer.toString());
                    if (matched) {
                        return { userName: matched[1], userPassword: matched[2] };
                    }
                }
            } catch (err) {
                TraceUtils.log(err);
            }
        }
    }]);

    return BasicAuthHandler;
}();

BasicAuthHandler.USERNAME_REGEXP = /^[a-zA-Z0-9.@_-]{1,255}$/;

var BasicAuthConsumer = exports.BasicAuthConsumer = function (_HttpConsumer2) {
    _inherits(BasicAuthConsumer, _HttpConsumer2);

    function BasicAuthConsumer() {
        _classCallCheck(this, BasicAuthConsumer);

        return _possibleConstructorReturn(this, (BasicAuthConsumer.__proto__ || Object.getPrototypeOf(BasicAuthConsumer)).call(this, function () {
            /**
             * @type {HttpContext}
             */
            var context = this;
            try {
                var handler = new BasicAuthHandler();
                return Rx.Observable.bindNodeCallback(handler.authenticateRequest)(context).flatMap(function () {
                    return HttpNextResult.create().toObservable();
                });
            } catch (err) {
                return Rx.Observable['throw'](err);
            }
        }));
    }

    return BasicAuthConsumer;
}(HttpConsumer);

var AuthStrategy = exports.AuthStrategy = function (_HttpApplicationServi) {
    _inherits(AuthStrategy, _HttpApplicationServi);

    /**
     * @param {HttpApplication} app
     */
    function AuthStrategy(app) {
        _classCallCheck(this, AuthStrategy);

        Args.check(new.target !== AuthStrategy, new AbstractClassError());
        return _possibleConstructorReturn(this, (AuthStrategy.__proto__ || Object.getPrototypeOf(AuthStrategy)).call(this, app));
    }

    /**
     * Sets the authentication cookie for the given context
     * @param {HttpContext} thisContext
     * @param {string} userName
     * @param {*} options
     */


    _createClass(AuthStrategy, [{
        key: 'setAuthCookie',
        value: function setAuthCookie(thisContext, userName, options) {
            throw new AbstractMethodError();
        }
        /**
         * Gets the authentication cookie of the given context
         * @param {HttpContext} thisContext
         * @returns {*}
         */

    }, {
        key: 'getAuthCookie',
        value: function getAuthCookie(thisContext) {
            throw new AbstractMethodError();
        }

        /**
         * Validates the specified credentials and authorizes the given context by setting the authorization cookie
         * @param thisContext - The current context
         * @param userName - A string which represents the user name
         * @param userPassword - A string which represents the user password
         * @returns {Observable}
         */

    }, {
        key: 'login',
        value: function login(thisContext, userName, userPassword) {
            throw new AbstractMethodError();
        }

        /**
         * Removes any authorization assigned to the given context
         * @param thisContext
         * @returns {Observable}
         */

    }, {
        key: 'logout',
        value: function logout(thisContext) {
            throw new AbstractMethodError();
        }

        /**
         * Gets the unattended execution account
         * @returns {string}
         */

    }, {
        key: 'getUnattendedExecutionAccount',
        value: function getUnattendedExecutionAccount() {
            throw new AbstractMethodError();
        }
    }]);

    return AuthStrategy;
}(HttpApplicationService);

var optionsProperty = Symbol('options');

var DefaultAuthStrategy = exports.DefaultAuthStrategy = function (_HttpApplicationServi2) {
    _inherits(DefaultAuthStrategy, _HttpApplicationServi2);

    /**
     * @param {HttpApplication} app
     */
    function DefaultAuthStrategy(app) {
        _classCallCheck(this, DefaultAuthStrategy);

        //get cookie name (from configuration)
        var _this4 = _possibleConstructorReturn(this, (DefaultAuthStrategy.__proto__ || Object.getPrototypeOf(DefaultAuthStrategy)).call(this, app));

        _this4[optionsProperty] = {
            "name": ".MAUTH",
            "slidingExpiration": false,
            "expirationTimeout": 420,
            "unattendedExecutionAccount": RandomUtils.randomChars(16)
        };
        //get keys
        var keys = _.keys(_this4[optionsProperty]);
        //pick authSetting based on the given keys
        var authSettings = _.pick(app.getConfiguration().settings.auth, keys);
        //and assign properties to default
        _.assign(_this4[optionsProperty], authSettings);
        return _this4;
    }

    _createClass(DefaultAuthStrategy, [{
        key: 'getOptions',
        value: function getOptions() {
            return this[optionsProperty];
        }

        /**
         * Gets the unattended execution account
         * @returns {string}
         */

    }, {
        key: 'getUnattendedExecutionAccount',
        value: function getUnattendedExecutionAccount() {
            return this[optionsProperty].unattendedExecutionAccount;
        }

        /**
         * Sets the authentication cookie for the given context
         * @param {HttpContext} thisContext - The current HTTP context
         * @param {string} userName - The username to authorize
         * @param {*=} options - Any other option we need to include in authorization cookie
         */

    }, {
        key: 'setAuthCookie',
        value: function setAuthCookie(thisContext, userName, options) {
            var defaultOptions = { user: userName, dateCreated: new Date() };
            var value = void 0;
            var expires = void 0;
            if (_.isObject(options)) {
                value = JSON.stringify(_.assign(options, defaultOptions));
                if (_.isDate(options['expires'])) {
                    expires = options['expires'].toUTCString();
                }
            } else {
                value = JSON.stringify(defaultOptions);
            }
            //set default expiration as it has been defined in application configuration
            if (_.isNil(expires) && _.isNumber(this.getOptions().expirationTimeout)) {
                var expirationTimeout = LangUtils.parseInt(this.getOptions().expirationTimeout);
                if (expirationTimeout > 0) {
                    expires = moment(new Date()).add(expirationTimeout, 'minutes').toDate().toUTCString();
                }
            }
            var str = this[optionsProperty].name.concat('=', this.getApplication().encrypt(value)) + ';path=/';
            if (typeof expires === 'string') {
                str += ';expires=' + expires;
            }
            thisContext.response.setHeader('Set-Cookie', str);
        }

        /**
         * Gets the authentication cookie of the given context
         * @param {HttpContext} thisContext
         * @returns {*}
         */

    }, {
        key: 'getAuthCookie',
        value: function getAuthCookie(thisContext) {
            var name = this.getOptions().name;
            var cookie = thisContext.getCookie(name);
            if (cookie) {
                return this.getApplication().decrypt(cookie);
            }
        }

        /**
         * Validates the specified credentials and authorizes the given context by setting the authorization cookie
         * @param thisContext - The current context
         * @param userName - A string which represents the user name
         * @param userPassword - A string which represents the user password
         * @returns {Observable}
         */

    }, {
        key: 'login',
        value: function login(thisContext, userName, userPassword) {
            var self = this;
            return Rx.Observable.bindNodeCallback(function (context, userName, password, callback) {
                try {
                    context.model('user').where('name').equal(userName).select('id', 'enabled').silent().first(function (err, result) {
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
                        model.where('id').equal(result.id).prepare().and('userPassword').equal('{clear}'.concat(userPassword)).or('userPassword').equal('{md5}'.concat(crypto.createHash('md5').update(userPassword).digest('hex'))).or('userPassword').equal('{sha1}'.concat(crypto.createHash('sha1').update(userPassword).digest('hex'))).silent().count().then(function (count) {
                            if (count == 1) {
                                //set cookie
                                self.setAuthCookie(context, userName);
                                context.user = { name: userName, authenticationType: 'Basic' };
                                return callback(null, true);
                            }
                            return callback(new HttpUnauthorizedError('Unknown username or bad password.'));
                        }).catch(function (err) {
                            TraceUtils.log(err);
                            return callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                        });
                    });
                } catch (err) {
                    TraceUtils.log(err);
                    return callback(new Error('Login failed due to internal server error.'));
                }
            })(thisContext, userName, userPassword);
        }

        /**
         * Removes any authorization assigned to the given context
         * @param thisContext
         * @returns {Observable}
         */

    }, {
        key: 'logout',
        value: function logout(thisContext) {
            var self = this;
            return Rx.Observable.bindNodeCallback(function (callback) {
                //set auth cookie
                self.setAuthCookie(thisContext, 'anonymous');
                return callback();
            })();
        }
    }]);

    return DefaultAuthStrategy;
}(HttpApplicationService);

/**
 * @classdesc Represents the encryption strategy of an HTTP application
 * @class
 */


var EncryptionStrategy = exports.EncryptionStrategy = function (_HttpApplicationServi3) {
    _inherits(EncryptionStrategy, _HttpApplicationServi3);

    /**
     * @param {HttpApplication} app
     */
    function EncryptionStrategy(app) {
        _classCallCheck(this, EncryptionStrategy);

        Args.check(new.target !== AuthStrategy, new AbstractClassError());
        return _possibleConstructorReturn(this, (EncryptionStrategy.__proto__ || Object.getPrototypeOf(EncryptionStrategy)).call(this, app));
    }

    /**
     * Encrypts the given data
     * @param {*} data
     * */


    _createClass(EncryptionStrategy, [{
        key: 'encrypt',
        value: function encrypt(data) {
            throw new AbstractMethodError();
        }

        /**
         * Decrypts the given data
         * @param {string} data
         * */

    }, {
        key: 'decrypt',
        value: function decrypt(data) {
            throw new AbstractMethodError();
        }
    }]);

    return EncryptionStrategy;
}(HttpApplicationService);

var cryptoProperty = Symbol('crypto');

/**
 * @classdesc Represents the default encryption strategy of an HTTP application
 * @class
 * @augments EncryptionStrategy
 */

var DefaultEncyptionStrategy = exports.DefaultEncyptionStrategy = function (_EncryptionStrategy) {
    _inherits(DefaultEncyptionStrategy, _EncryptionStrategy);

    /**
     * @param {HttpApplication} app
     */
    function DefaultEncyptionStrategy(app) {
        _classCallCheck(this, DefaultEncyptionStrategy);

        var _this6 = _possibleConstructorReturn(this, (DefaultEncyptionStrategy.__proto__ || Object.getPrototypeOf(DefaultEncyptionStrategy)).call(this, app));

        _this6[cryptoProperty] = {};
        //get
        _.assign(_this6[cryptoProperty], app.getConfiguration().settings.crypto);
        return _this6;
    }

    _createClass(DefaultEncyptionStrategy, [{
        key: 'getOptions',
        value: function getOptions() {
            return this[cryptoProperty];
        }

        /**
         * Encrypts the given data
         * @param {*} data
         * */

    }, {
        key: 'encrypt',
        value: function encrypt(data) {
            if (_.isNil(data)) return;
            Args.check(this.getApplication().hasService(EncryptionStrategy), 'Encryption strategy is missing');
            var options = this.getOptions();
            //validate settings
            Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
            Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
            //encrypt
            var cipher = crypto.createCipher(options.algorithm, options.key);
            return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
        }

        /**
         * Decrypts the given data
         * @param {string} data
         * */

    }, {
        key: 'decrypt',
        value: function decrypt(data) {
            if (_.isNil(data)) return;
            Args.check(this.getApplication().hasService(EncryptionStrategy), 'Encryption strategy is missing');
            //validate settings
            var options = this.getOptions();
            //validate settings
            Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
            Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
            //decrypt
            var decipher = crypto.createDecipher(options.algorithm, options.key);
            return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
        }
    }]);

    return DefaultEncyptionStrategy;
}(EncryptionStrategy);
//# sourceMappingURL=auth.js.map
