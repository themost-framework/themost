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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mostData = require('most-data');

var _mostData2 = _interopRequireDefault(_mostData);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _utils = require('@themost/common/utils');

var _errors = require('@themost/common/errors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @classdesc Creates an instance of HttpContext class.
 * @class
 * @property {{extension:string,type:string}} mime - Gets an object which represents the mime type associated with this context.
 * @property {string} format - Gets a string which represents the response format of this context (e.g html, json, js etc).
 * @property {HttpApplication} application - Gets the parent HTTP application of the current context.
 * @augments DataContext
 */
var HttpContext = exports.HttpContext = function (_da$classes$DefaultDa) {
    _inherits(HttpContext, _da$classes$DefaultDa);

    /**
     *
     * @constructor
     * @param {ClientRequest} httpRequest
     * @param {ServerResponse} httpResponse
     */
    function HttpContext(httpRequest, httpResponse) {
        _classCallCheck(this, HttpContext);

        /**
         * @type {ClientRequest}
         */
        var _this = _possibleConstructorReturn(this, (HttpContext.__proto__ || Object.getPrototypeOf(HttpContext)).call(this));

        _this.request = httpRequest;
        /**
         *
         * @type {ServerResponse}
         */
        _this.response = httpResponse;

        var __application__ = null;
        Object.defineProperty(_this, 'application', {
            get: function get() {
                return __application__;
            },
            set: function set(value) {
                __application__ = value;
            }, configurable: false, enumerable: false
        });
        /**
         * @returns {HttpApplication}
         */
        _this.getApplication = function () {
            return __application__;
        };

        var self = _this;
        Object.defineProperty(_this, 'mime', {
            get: function get() {
                var res = self.application.resolveMime(self.request.url);
                //if no extension is defined
                if (typeof res === 'undefined' || res == null) {
                    //resolve the defined mime type by filter application mime types
                    if (self.params && self.params.mime) {
                        res = self.application.config.mimes.find(function (x) {
                            return x.type === self.params.mime;
                        });
                    }
                    //or try to get accept header (e.g. text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8)
                    else if (self.request && self.request.headers) {
                            //get and split ACCEPT HTTP header
                            var accept = self.request.headers['accept'],
                                arr = accept.split(';');
                            if (arr[0]) {
                                (function () {
                                    //get acceptable mime types
                                    var mimes = arr[0].split(',');
                                    if (mimes.length > 0) {
                                        //try to find the application mime associated with the first acceptable mime type
                                        res = self.application.config.mimes.find(function (x) {
                                            return x.type === mimes[0];
                                        });
                                    }
                                })();
                            }
                        }
                }
                return res;
            }, configurable: false, enumerable: false
        });

        Object.defineProperty(_this, 'format', {
            get: function get() {
                var uri = _url2.default.parse(self.request.url);
                var result = _path2.default.extname(uri.pathname);
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
            }, configurable: false, enumerable: false
        });

        /**
         * Gets an object that represents HTTP query string variables.
         * @type {*}
         */
        _this.querystring = {};
        /**
         * Gets an object that represents route data variables
         * @type {*}
         */
        _this.data = undefined;
        /**
         * Gets an object that represents HTTP context parameters
         * @type {*}
         */
        _this.params = {};

        var data = null;
        Object.defineProperty(_this, 'data', {
            get: function get() {
                if (data) return data;
                data = {};
                if (self.request && self.request.routeData) {
                    for (var key in self.request.routeData) {
                        if (self.request.routeData.hasOwnProperty(key)) {
                            data[key] = self.request.routeData[key];
                        }
                    }
                }
                return data;
            }, configurable: false, enumerable: false
        });
        /**
         * @property {*} cookies - Gets a collection of HTTP Request cookies
         */
        Object.defineProperty(_this, 'cookies', {
            get: function get() {
                var list = {},
                    rc = self.request.headers.cookie;
                rc && rc.split(';').forEach(function (cookie) {
                    var parts = cookie.split('=');
                    list[parts.shift().trim()] = unescape(parts.join('='));
                });
                return list;
            }, configurable: false, enumerable: false
        });

        var jq = null,
            ng = null,
            doc = void 0;
        /**
         * @property {jQuery|HTMLElement|*} $ - Gets server jQuery module
         */
        Object.defineProperty(_this, '$', {
            get: function get() {
                if (jq) return jq;
                if (typeof doc === 'undefined') doc = self.application.document();
                jq = doc.parentWindow.jQuery;
                return jq;
            }, configurable: false, enumerable: false
        });
        /**
         * @property {angular} angular - Gets server angular module
         */
        Object.defineProperty(_this, 'angular', {
            get: function get() {
                if (ng) return ng;
                if (typeof doc === 'undefined') doc = self.application.document();
                ng = doc.parentWindow.angular;
                return ng;
            }, configurable: false, enumerable: false
        });
        /**
         * Gets or sets the current user identity
         * @type {*}
         */
        _this.user = null;
        /**
         * @type {string}
         * @private
         */
        _this._culture = undefined;
        //call super class constructor
        if (HttpContext.super_) HttpContext.super_.call(_this);

        //class extension initiators
        if (typeof _this.init === 'function') {
            //call init() method
            _this.init();
        }

        return _this;
    }

    _createClass(HttpContext, [{
        key: 'init',
        value: function init() {}
        //


        /**
         * @param {string} name
         * @param {*=} value
         * @param {Date=} expires
         * @param {string=} domain
         * @param {string=} cookiePath
         * @returns {string|undefined}
         */

    }, {
        key: 'cookie',
        value: function cookie(name, value, expires, domain, cookiePath) {

            if (typeof value === 'undefined') {
                if (this.request) {
                    var cookies = _utils.LangUtils.parseCookies(this.request);
                    return cookies[name];
                } else return null;
            } else {
                var cookieValue = void 0;
                if (value != null) {
                    cookieValue = name + '=' + value.toString();
                    if (expires instanceof Date) cookieValue += ';expires=' + expires.toUTCString();
                } else {
                    cookieValue = name + '=;expires=' + new Date('1970-01-01').toUTCString();
                }
                //set default cookie path to root
                cookiePath = cookiePath || '/';
                //set cookie domain
                if (typeof domain === 'string') cookieValue += ';domain=' + domain;
                //set cookie path
                if (typeof cookiePath === 'string') cookieValue += ';path=' + cookiePath;
                //set cookie
                if (this.response) {
                    this.response.setHeader('Set-Cookie', cookieValue);
                }
            }
        }

        /**
         * @param {*} p
         */

    }, {
        key: 'moment',
        value: function moment(p) {
            var moment = require("moment"),
                locale = this.culture();
            return moment(p).locale(locale);
        }

        /**
         * @param {string} name - The name of the cookie to be added
         * @param {string|*} value - The value of the cookie
         * @param {Date=} expires - An optional parameter which sets cookie's expiration date. If this parameters is missing or is null a session cookie will be set.
         * @param {string=} domain - An optional parameter which sets the cookie's domain.
         * @param {string=} cpath - An optional parameter which sets the cookie's path. The default value is the root path.
         * @returns {string|undefined}
         */

    }, {
        key: 'setCookie',
        value: function setCookie(name, value, expires, domain, cpath) {
            if (typeof name !== 'string') throw 'Invalid argument. Argument [name] must be a string.';
            if (typeof value !== 'string') throw 'Invalid argument. Argument [value] must be a string.';
            this.cookie(name, value, expires, domain, cpath);
        }

        /**
         * Set a permanent cookie for user preferred language
         * @param lang - A string which represents the user preferred language e.g. en-US, en-GB etc
         */

    }, {
        key: 'setLangCookie',
        value: function setLangCookie(lang) {
            this.cookie(".LANG", lang);
        }

        /**
         * @param {string} name - The name of the cookie to be deleted
         * @param {string=} domain - An optional parameter which indicates cookie's domain.
         * @param {string=} cpath - An optional parameter which indicates cookie's path. The default value is the root path.
         * @returns {string|undefined}
         */

    }, {
        key: 'removeCookie',
        value: function removeCookie(name, domain, cpath) {
            if (typeof name !== 'string') throw 'Invalid argument. Argument [name] must be a string.';

            this.cookie(name, null, null, domain, cpath);
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
            self.application.config.settings.auth = self.application.config.settings.auth || {};
            var account = self.application.config.settings.auth.unattendedExecutionAccount;
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
                        self.user = _util2.default._extend({}, interactiveUser);
                    }
                    delete self.interactiveUser;
                    delete self._unattended;
                    callback(err, result);
                });
            } catch (e) {
                //restore user
                if (interactiveUser) {
                    self.user = _util2.default._extend({}, interactiveUser);
                }
                delete self.interactiveUser;
                delete self._unattended;
                callback(e);
            }
        }

        /**
         * Gets or sets the current culture
         * @param {String=} value
         */

    }, {
        key: 'culture',
        value: function culture(value) {
            var _this2 = this;

            var self = this;
            if (typeof value === 'undefined') {
                var _ret2 = function () {
                    if (_this2._culture) return {
                            v: _this2._culture
                        };
                    //get available cultures and default culture
                    var cultures = ['en-us'],
                        defaultCulture = 'en-us';
                    if (_this2.application.config.settings) {
                        if (_this2.application.config.settings['localization']) {
                            cultures = _this2.application.config.settings['localization']['cultures'] || cultures;
                            defaultCulture = _this2.application.config.settings['localization']['default'] || defaultCulture;
                        }
                    }
                    var lang = defaultCulture;
                    //1. Check HTTP cookie .LANG value
                    if (typeof self.cookie(".LANG") === "string") {
                        lang = self.cookie(".LANG");
                    }
                    //2. Check [lang] HTTP request param
                    else if (self.params && self.params.lang) {
                            lang = self.params.lang;
                        }
                        //2. Check request HTTP header [accept-language]
                        else if (self.request && self.request.headers && self.request.headers['accept-language']) {
                                var langs = self.request.headers['accept-language'].split(';');
                                if (langs.length > 0) {
                                    lang = langs[0].split(',')[0] || defaultCulture;
                                }
                            }
                    if (lang) {
                        //search application cultures
                        var obj = cultures.find(function (x) {
                            return x == lang.toLowerCase() || x.substr(0, 2) == lang.toLowerCase().substr(0, 2);
                        });
                        //if user culture is valid for this application
                        if (obj) {
                            //set context culture
                            _this2._culture = obj;
                            return {
                                v: _this2._culture
                            };
                        }
                    }
                    //otherwise use default culture
                    _this2._culture = defaultCulture;
                    return {
                        v: _this2._culture
                    };
                }();

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            } else {
                this._culture = value;
            }
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
            if (typeof csrfToken !== 'string') throw new _errors.HttpBadRequestError('Bad request. Invalid cross-site request forgery token.');
            if (csrfToken.length == 0) throw new _errors.HttpBadRequestError('Bad request. Empty cross-site request forgery token.');
            try {
                var cookies = self.cookies;
                var csrfCookieToken = void 0;
                var csrfRequestToken = void 0;
                if (cookies['.CSRF']) {
                    //try to decrypt cookie token
                    try {
                        csrfCookieToken = JSON.parse(self.application.decrypt(cookies['.CSRF']));
                    } catch (e) {
                        throw new _errors.HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
                    }
                    //then try to decrypt the token provided
                    try {
                        csrfRequestToken = JSON.parse(self.application.decrypt(csrfToken));
                    } catch (e) {
                        throw new _errors.HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
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
                                if (self.application.config.settings) if (self.application.config.settings.auth) if (self.application.config.settings.auth['csrfExpiration']) tokenExpiration = parseInt(self.application.config.settings.auth['csrfExpiration']);
                                if (diff > tokenExpiration * 60 * 1000) valid = false;
                            }
                        }
                        if (valid) return;
                    }
                    throw new _errors.HttpBadRequestError('Bad request. A cross-site request forgery was detected.');
                } else {
                    throw new _errors.HttpBadRequestError('Bad request.Missing cross-site request forgery data.');
                }
            } catch (e) {
                if (e.status) throw e;else throw new _errors.HttpServerError('Request validation failed.');
            }
        }
    }, {
        key: 'writeFile',
        value: function writeFile(file) {
            var _this3 = this;

            try {
                (function () {
                    var fs = require("fs");
                    var path = require("path");
                    var app = require('./index');
                    var response = _this3.response;
                    //check if file exists
                    if (!fs.existsSync(file)) throw new _errors.HttpNotFoundError();
                    //get file extension
                    var extensionName = path.extname(file);
                    //and try to find this extension to MIME types

                    //get MIME collection
                    var contentType = null;
                    var mime = _lodash._.find(_this3.application.config.mimes, function (x) {
                        return x.extension == extensionName;
                    });
                    if (_lodash._.isObject(mime)) contentType = mime.type;
                    //throw exception (MIME not found)
                    if (contentType == null) throw new _errors.HttpForbiddenError();

                    fs.readFile(file, "binary", function (err, stream) {
                        if (err) {
                            //todo:raise application asynchronous error
                            response.writeHead(500, { 'Content-Type': 'text/plain' });
                            response.write('500 Internal Server Error');
                            response.end();
                            return;
                        }
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.write(stream, "binary");
                        response.end();
                    });
                })();
            } catch (e) {
                throw e;
            }
        }

        /**
         * Checks whether the HTTP method of the current request is equal or not to the given parameter.
         * @param {String|Array} method - The HTTP method (GET, POST, PUT, DELETE)
         * */

    }, {
        key: 'is',
        value: function is(method) {
            var self = this;
            if (self.request == null) return false;
            if (_util2.default.isArray(method)) {
                return method.filter(function (x) {
                    return self.request.method.toUpperCase() == x.toUpperCase();
                }).length > 0;
            } else {
                if (typeof method !== 'string') return false;
                if (method == '*') return true;
                return self.request.method.toUpperCase() == method.toUpperCase();
            }
        }
    }, {
        key: 'isPost',
        value: function isPost() {
            return this.is('POST');
        }

        /**
         * @param {String|Array} method
         * @param {Function} fn
         * @returns {HttpContext}
         */

    }, {
        key: 'handle',
        value: function handle(method, fn) {
            var self = this;
            if (self.is(method)) {
                self.handled = true;
                process.nextTick(function () {
                    fn.call(self);
                });
            }
            return self;
        }

        /**
         * Handles context error by executing the given callback
         * @param {Function} callback
         */

    }, {
        key: 'catch',
        value: function _catch(callback) {
            var self = this;
            callback = callback || function () {};
            self.once("error", function (ev) {
                return callback.call(self, ev.error);
            });
            return self;
        }

        /**
         * @param {Function} fn
         * @returns {HttpContext}
         */

    }, {
        key: 'unhandle',
        value: function unhandle(fn) {
            if (!this.handled) {
                fn.call(this);
            }
            return this;
        }

        /**
         * Invokes the given function if the current HTTP method is equal to POST
         * @param {Function()} fn
         * @returns {HttpContext}
         */

    }, {
        key: 'handlePost',
        value: function handlePost(fn) {
            return this.handle('POST', fn);
        }

        /**
         * Invokes the given function if the current HTTP method is equal to GET
         * @param {Function()} fn
         * @returns {HttpContext}
         */

    }, {
        key: 'handleGet',
        value: function handleGet(fn) {
            return this.handle('GET', fn);
        }

        /**
         * Invokes the given function if the current HTTP method is equal to PUT
         * @param {Function()} fn
         * @returns {HttpContext}
         */

    }, {
        key: 'handlePut',
        value: function handlePut(fn) {
            return this.handle('PUT', fn);
        }

        /**
         * Invokes the given function if the current HTTP method is equal to PUT
         * @param {Function()} fn
         */

    }, {
        key: 'handleDelete',
        value: function handleDelete(fn) {
            return this.handle('DELETE', fn);
        }

        /**
         * Gets or sets the current HTTP handler
         * @param {Object=} value
         * @returns {Function|Object}
         */

    }, {
        key: 'currentHandler',
        value: function currentHandler(value) {
            if (value === undefined) {
                return this.request.currentHandler;
            } else {
                this.request.currentHandler = value;
            }
        }

        /**
         * Translates the given string to the language specified in this context
         * @param {string} text - The string to translate
         * @param {string=} lib - A string that represents the library which contains the source string. This arguments is optional. If this argument is missing, then the operation will use the default (global) library.
         * @returns {*}
         */

    }, {
        key: 'translate',
        value: function translate(text, lib) {
            try {
                var self = this,
                    app = self.application;
                //ensure locale
                var locale = this.culture();
                //ensure localization library
                lib = lib || 'global';
                //get cached library object if any
                app.config.locales = app.config.locales || {};
                var library = app.config.locales[lib];
                //if library has not been yet initialized
                if (!library) {
                    //get library path
                    var file = app.mapPath('/locales/'.concat(lib, '.', locale, '.json'));
                    //if file does not exist
                    if (!_fs2.default.existsSync(file)) {
                        //return the give text
                        return text;
                    } else {
                        //otherwise create library
                        library = app.config.locales[lib] = {};
                    }
                }
                if (!library[locale]) {
                    var file = app.mapPath('/locales/'.concat(lib, '.', locale, '.json'));
                    if (_fs2.default.existsSync(file)) library[locale] = JSON.parse(_fs2.default.readFileSync(file, 'utf8'));
                }
                var result = text;
                if (library[locale]) result = library[locale][text];
                return result || text;
            } catch (e) {
                _utils.TraceUtils.log(e);
                return text;
            }
        }

        /**
         * Creates an instance of a view engine based on the given extension (e.g. ejs, md etc)
         * @param {string} extension
         * @returns {*}
         */

    }, {
        key: 'engine',
        value: function engine(extension) {
            var item = this.application.config.engines.find(function (x) {
                return x.extension === extension;
            });
            if (item) {
                var engine = require(item.type);
                if (typeof engine.createInstance !== 'function') {
                    throw new Error('Invalid view engine module.');
                }
                return engine.createInstance(this);
            }
        }

        /**
         * Creates a new instance of HttpViewContext class based on this HttpContext instance.
         * @returns {HttpViewContext|*}
         */

    }, {
        key: 'createViewContext',
        value: function createViewContext() {
            var mvc = require("./mvc");
            return new mvc.HttpViewContext(this);
        }
    }]);

    return HttpContext;
}(_mostData2.default.classes.DefaultDataContext);
//# sourceMappingURL=context.js.map
