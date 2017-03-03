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
exports.HttpContext = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

var _url = require('url');

var url = _interopRequireDefault(_url).default;

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _mvc = require('./mvc');

var HttpViewContext = _mvc.HttpViewContext;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;
var TraceUtils = _utils.TraceUtils;

var _errors = require('@themost/common/errors');

var HttpBadRequestError = _errors.HttpBadRequestError;

var _localization = require('./localization');

var LocalizationStrategy = _localization.LocalizationStrategy;

var _context = require('@themost/data/context');

var DefaultDataContext = _context.DefaultDataContext;

var _config = require('@themost/data/config');

var DataConfigurationStrategy = _config.DataConfigurationStrategy;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function parseCookies(request) {
    var list = {};
    if (request && request.headers && request.headers.cookie) {
        var rc = request.headers.cookie;
        if (!_.isEmpty(rc)) {
            _.forEach(rc.split(';'), function (cookie) {
                var parts = cookie.split('=');
                list[parts.shift().trim()] = unescape(parts.join('='));
            });
        }
    }
    return list;
}

var cultureProperty = Symbol('culture');
var applicationProperty = Symbol('application');

/**
 * @class
 * @property {*} params
 * @property {ClientRequest} request - Gets or sets the HTTP request of the current context
 * @property {ServerResponse} response - Gets or sets the HTTP response of the current context
 * @augments DefaultDataContext
 */

var HttpContext = exports.HttpContext = function (_DefaultDataContext) {
    _inherits(HttpContext, _DefaultDataContext);

    /**
     *
     * @constructor
     * @param {HttpApplication} app
     * @param {ClientRequest} request
     * @param {ServerResponse} response
     */
    function HttpContext(app, request, response) {
        _classCallCheck(this, HttpContext);

        var _this = _possibleConstructorReturn(this, (HttpContext.__proto__ || Object.getPrototypeOf(HttpContext)).call(this));

        _this[applicationProperty] = app;
        /**
         * Gets or sets the HTTP request of the current context
         * @type {ClientRequest}
         */
        _this.request = request;
        /**
         * Gets or sets the HTTP response of the current context
         * @type {ServerResponse}
         */
        _this.response = response;
        return _this;
    }

    /**
     * @returns {DataConfigurationStrategy}
     */


    _createClass(HttpContext, [{
        key: 'getConfiguration',
        value: function getConfiguration() {
            return this.getApplication().getConfiguration().getStrategy(DataConfigurationStrategy);
        }

        /**
         * @returns {HttpApplication}
         */

    }, {
        key: 'getApplication',
        value: function getApplication() {
            return this[applicationProperty];
        }

        /**
         * Gets the MIME extension of the current HTTP request
         * @returns {*}
         */

    }, {
        key: 'getFormat',
        value: function getFormat() {
            var uri = url.parse(this.request.url);
            var result = path.extname(uri.pathname);
            if (result) {
                return result.substr(1).toLowerCase();
            } else {
                //get mime type
                var mime = self.mime;
                if (mime) {
                    //and return the extension associated with this mime
                    return mime.extension.substr(1).toLowerCase();
                }
            }
        }

        /**
         * Creates a new instance of HttpViewContext class based on this HttpContext instance.
         * @returns {HttpViewContext}
         */

    }, {
        key: 'createViewContext',
        value: function createViewContext() {
            return new HttpViewContext(this);
        }

        /**
         * Gets an HTTP request cookie with the specified name
         * @param {string} name
         * @returns {*}
         */

    }, {
        key: 'getCookie',
        value: function getCookie(name) {
            Args.notNull(this.request, "HTTP Request");
            var cookies = parseCookies(this.request);
            if (_.isNil(cookies)) {
                return;
            }
            return cookies[name];
        }

        /**
         * Sets a cookie with the specified name and value. If the value is missing or is null the cookie will be removed.
         * @param {string} name
         * @param {*=} value
         * @param {Date=} expires
         * @param {string=} domain
         * @param {string=} cookiePath
         */

    }, {
        key: 'setCookie',
        value: function setCookie(name, value, expires, domain, cookiePath) {
            Args.notEmpty(name, 'Name');
            Args.notNull(this.response, 'HTTP Response');
            var cookieValue = void 0;
            if (!_.isNil(value)) {
                cookieValue = '{name}={value.toString()}';
                if (expires instanceof Date) cookieValue += ';expires={expires.toUTCString()}';
            } else {
                cookieValue = '{name}=;expires={new Date(\'1970-01-01\').toUTCString()}';
            }
            //set default cookie path to root
            cookiePath = cookiePath || '/';
            //set cookie domain
            if (_.isString(domain)) cookieValue += ';domain={domain}';
            //set cookie path
            if (_.isString(cookiePath)) cookieValue += ';path={cookiePath}';
            //set cookie
            this.response.setHeader('Set-Cookie', cookieValue);
        }

        /**
         * Set a permanent cookie for user preferred language
         * @param lang - A string which represents the user preferred language e.g. en-US, en-GB etc
         */

    }, {
        key: 'setLangCookie',
        value: function setLangCookie(lang) {
            this.setCookie(".LANG", lang);
        }

        /**
         * Checks whether the HTTP method of the current request is equal or not to the given parameter.
         * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, OPTIONS, HEAD)
         * */

    }, {
        key: 'is',
        value: function is(method) {
            Args.notNull(this.request, 'HTTP Request');
            if (_.isNil(method)) {
                return false;
            }
            Args.notString(this.request.method, 'HTTP Method');
            return this.request.method.toUpperCase() == method.toUpperCase();
        }
        /**
         * Gets the current culture
         */

    }, {
        key: 'getCulture',
        value: function getCulture() {
            if (this[cultureProperty]) return this[cultureProperty];
            /**
             * @type {LocalizationStrategy}
             */
            var localizationStrategy = this.getApplication().getService(LocalizationStrategy);
            if (_.isNil(localizationStrategy)) {
                return 'en-us';
            }
            var lang = localizationStrategy.getDefaultCulture();
            //1. Check HTTP cookie .LANG value
            if (typeof this.getCookie(".LANG") === "string") {
                lang = this.getCookie(".LANG");
            }
            //2. Check [lang] HTTP request param
            else if (this.params && this.params.lang) {
                    lang = this.params.lang;
                }
                //2. Check request HTTP header [accept-language]
                else if (this.request && this.request.headers && this.request.headers['accept-language']) {
                        var langs = this.request.headers['accept-language'].split(';');
                        if (langs.length > 0) {
                            lang = langs[0].split(',')[0] || localizationStrategy.getDefaultCulture();
                        }
                    }
            if (lang) {
                //search application cultures
                var obj = _.find(localizationStrategy.getCultures(), function (x) {
                    return x == lang.toLowerCase() || x.substr(0, 2) == lang.toLowerCase().substr(0, 2);
                });
                //if user culture is valid for this application
                if (obj) {
                    //set context culture
                    this[cultureProperty] = obj;
                    return this[cultureProperty];
                }
            }
            //otherwise use default culture
            this[cultureProperty] = localizationStrategy.getDefaultCulture();
            return this[cultureProperty];
        }

        /**
         * Sets the current culture
         * @param value
         */

    }, {
        key: 'setCulture',
        value: function setCulture(value) {
            Args.notEmpty(value, 'culture');
            this[cultureProperty] = value;
        }

        /**
         * Performs cross-site request forgery validation against the specified token
         * @param {string=} csrfToken
         */

    }, {
        key: 'validateAntiForgeryToken',
        value: function validateAntiForgeryToken(csrfToken) {
            var self = this;
            if (typeof csrfToken === 'undefined') {
                //try to get token from params
                if (typeof self.params !== 'undefined') csrfToken = self.params['_CSRFToken'];
            }
            if (typeof csrfToken !== 'string') throw new HttpBadRequestError('Bad request. Invalid cross-site request forgery token.');
            if (csrfToken.length == 0) throw new HttpBadRequestError('Bad request. Empty cross-site request forgery token.');
            var cookies = self.cookies;
            var csrfCookieToken = void 0;
            var csrfRequestToken = void 0;
            if (cookies['.CSRF']) {
                //try to decrypt cookie token
                try {
                    csrfCookieToken = JSON.parse(self.getApplication().decrypt(cookies['.CSRF']));
                } catch (e) {
                    throw new HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
                }
                //then try to decrypt the token provided
                try {
                    csrfRequestToken = JSON.parse(self.application.decrypt(csrfToken));
                } catch (e) {
                    throw new HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
                }
                if ((typeof csrfCookieToken === 'undefined' ? 'undefined' : _typeof(csrfCookieToken)) === 'object' && (typeof csrfRequestToken === 'undefined' ? 'undefined' : _typeof(csrfRequestToken)) === 'object') {

                    var valid = true,
                        tokenExpiration = 60;
                    //1. validate token equality
                    for (var key in csrfCookieToken) {
                        if (csrfCookieToken.hasOwnProperty(key)) {
                            if (csrfCookieToken[key] !== csrfRequestToken[key]) {
                                valid = false;
                                break;
                            }
                        }
                    }
                    if (valid == true) {
                        //2. validate timestamp
                        var timestamp = new Date(csrfCookieToken.date);
                        var diff = Math.abs(new Date() - timestamp);
                        if (diff < 0) {
                            valid = false;
                        }
                        if (valid) {
                            if (self.getApplication().getConfiguration().settings) if (self.getApplication().getConfiguration().settings.auth) if (self.getApplication().getConfiguration().settings.auth['csrfExpiration']) tokenExpiration = parseInt(self.getApplication().getConfiguration().auth['csrfExpiration']);
                            if (diff > tokenExpiration * 60 * 1000) valid = false;
                        }
                    }
                    if (valid) return;
                }
                throw new HttpBadRequestError('Bad request. A cross-site request forgery was detected.');
            } else {
                throw new HttpBadRequestError('Bad request.Missing cross-site request forgery data.');
            }
        }

        /**
         * Translates the given string to the language specified in this context
         * @param {string} text - The string to translate
         * @param {string=} lib - A string that represents the library which contains the source string. This arguments is optional. If this argument is missing, then the operation will use the default (global) library.
         * @returns {*}
         */

    }, {
        key: 'getLocaleString',
        value: function getLocaleString(text, lib) {
            /**
             * @type {LocalizationStrategy}
             */
            var localizationStrategy = this.getApplication().getService(LocalizationStrategy);
            if (_.isNil(localizationStrategy)) {
                TraceUtils.warn('The current application does not have a valid localization strategy. Define one in order to properly use localization methods.');
                return text;
            }
            localizationStrategy.getLocaleString(this.getCulture(), text, lib);
        }

        /**
         * Executes the specified code in unattended mode.
         * @param {Function} fn
         * @param {Function} callback
         */

    }, {
        key: 'unattended',
        value: function unattended(fn, callback) {
            var self = this;
            var interactiveUser = void 0;
            callback = callback || function () {};
            fn = fn || function () {};
            if (self._unattended) {
                try {
                    fn.call(self, function (err, result) {
                        callback(err, result);
                    });
                } catch (e) {
                    callback(e);
                }
                return;
            }
            //get unattended execution account
            var config = self.getApplication().getConfiguration();
            var account = config.getSourceAt('settings/auth/unattendedExecutionAccount');
            //get interactive user
            if (this.user) {
                interactiveUser = { name: this.user.name, authenticationType: this.user.authenticationType };
                //setting interactive user
                self.interactiveUser = interactiveUser;
            }
            if (account) {
                self.user = { name: account, authenticationType: 'Basic' };
            }
            try {
                self._unattended = true;
                fn.call(self, function (err, result) {
                    //restore user
                    if (interactiveUser) {
                        self.user = _.assign({}, interactiveUser);
                    }
                    delete self.interactiveUser;
                    delete self._unattended;
                    callback(err, result);
                });
            } catch (e) {
                //restore user
                if (interactiveUser) {
                    self.user = _.assign({}, interactiveUser);
                }
                delete self.interactiveUser;
                delete self._unattended;
                callback(e);
            }
        }
    }]);

    return HttpContext;
}(DefaultDataContext);
//# sourceMappingURL=context.js.map
