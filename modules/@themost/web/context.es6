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

import path from 'path';
import util from 'util';
import fs from 'fs';
import da from 'most-data';
import url from 'url';
import {_} from 'lodash';
import {LangUtils,TraceUtils} from '@themost/common/utils';
import {HttpBadRequestError,HttpForbiddenError,HttpServerError,HttpNotFoundError} from '@themost/common/errors';


/**
 * @classdesc Creates an instance of HttpContext class.
 * @class
 * @property {{extension:string,type:string}} mime - Gets an object which represents the mime type associated with this context.
 * @property {string} format - Gets a string which represents the response format of this context (e.g html, json, js etc).
 * @property {HttpApplication} application - Gets the parent HTTP application of the current context.
 * @augments DataContext
 */
export class HttpContext extends da.classes.DefaultDataContext {
    /**
     *
     * @constructor
     * @param {ClientRequest} httpRequest
     * @param {ServerResponse} httpResponse
     */
    constructor(httpRequest, httpResponse) {
        super();
        /**
         * @type {ClientRequest}
         */
        this.request = httpRequest;
        /**
         *
         * @type {ServerResponse}
         */
        this.response = httpResponse;

        let __application__ = null;
        Object.defineProperty(this, 'application', {
            get: function () {
                return __application__;
            },
            set: function (value) {
                __application__ = value;
            }, configurable: false, enumerable: false
        });
        /**
         * @returns {HttpApplication}
         */
        this.getApplication = function() {
            return __application__;
        };

        const self = this;
        Object.defineProperty(this, 'mime', {
            get: function () {
                let res = self.application.resolveMime(self.request.url);
                //if no extension is defined
                if (typeof res === 'undefined' || res == null) {
                    //resolve the defined mime type by filter application mime types
                    if (self.params && self.params.mime) {
                        res = self.application.config.mimes.find(function(x) {
                           return x.type === self.params.mime;
                        });
                    }
                    //or try to get accept header (e.g. text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8)
                    else if (self.request && self.request.headers) {
                        //get and split ACCEPT HTTP header
                        const accept = self.request.headers['accept'], arr = accept.split(';');
                        if (arr[0]) {
                            //get acceptable mime types
                            const mimes = arr[0].split(',');
                            if (mimes.length>0) {
                                //try to find the application mime associated with the first acceptable mime type
                                res = self.application.config.mimes.find(function(x) {
                                    return x.type === mimes[0];
                                });
                            }
                        }
                    }
                }
                return res;
            }, configurable: false, enumerable: false
        });

        Object.defineProperty(this, 'format', {
            get: function () {
                const uri = url.parse(self.request.url);
                const result = path.extname(uri.pathname);
                if (result) {
                    return result.substr(1).toLowerCase();
                }
                else {
                    //get mime type
                    const mime = self.mime;
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
        this.querystring = {};
        /**
         * Gets an object that represents route data variables
         * @type {*}
         */
        this.data = undefined;
        /**
         * Gets an object that represents HTTP context parameters
         * @type {*}
         */
        this.params = {};

        let data = null;
        Object.defineProperty(this, 'data', {
            get: function () {
                if (data)
                    return data;
                data = { };
                if (self.request && self.request.routeData) {
                    for(const key in self.request.routeData) {
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
        Object.defineProperty(this, 'cookies', {
            get: function () {
                const list = {}, rc = self.request.headers.cookie;
                rc && rc.split(';').forEach(function( cookie ) {
                    const parts = cookie.split('=');
                    list[parts.shift().trim()] = unescape(parts.join('='));
                });
                return list;
            }, configurable: false, enumerable: false
        });

        let jq = null, ng = null, doc;
        /**
         * @property {jQuery|HTMLElement|*} $ - Gets server jQuery module
         */
        Object.defineProperty(this, '$', {
            get: function () {
                if (jq)
                    return jq;
                if (typeof doc === 'undefined')
                    doc = self.application.document();
                jq =  doc.parentWindow.jQuery;
                return jq;
            }, configurable: false, enumerable: false
        });
        /**
         * @property {angular} angular - Gets server angular module
         */
        Object.defineProperty(this, 'angular', {
            get: function () {
                if (ng)
                    return ng;
                if (typeof doc === 'undefined')
                    doc = self.application.document();
                ng =  doc.parentWindow.angular;
                return ng;
            }, configurable: false, enumerable: false
        });
        /**
         * Gets or sets the current user identity
         * @type {*}
         */
        this.user = null;
        /**
         * @type {string}
         * @private
         */
        this._culture = undefined;
        //call super class constructor
        if (HttpContext.super_)
            HttpContext.super_.call(this);

        //class extension initiators
        if (typeof this.init === 'function') {
            //call init() method
            this.init();
        }
        

    }

    init() {
        //
    }

    /**
     * @param {string} name
     * @param {*=} value
     * @param {Date=} expires
     * @param {string=} domain
     * @param {string=} cookiePath
     * @returns {string|undefined}
     */
    cookie(name, value, expires, domain, cookiePath) {

        if (typeof value==='undefined')
        {
            if (this.request) {
                const cookies = LangUtils.parseCookies(this.request);
                return cookies[name];
            }
            else
                return null;
        }
        else {
            let cookieValue;
            if (value!=null) {
                cookieValue = name + '=' + value.toString();
                if (expires instanceof Date)
                    cookieValue += ';expires=' + expires.toUTCString();
            }
            else {
                cookieValue = name + '=;expires=' + new Date('1970-01-01').toUTCString();
            }
            //set default cookie path to root
            cookiePath = cookiePath || '/';
            //set cookie domain
            if (typeof domain === 'string')
                cookieValue += ';domain=' + domain;
            //set cookie path
            if (typeof cookiePath === 'string')
                cookieValue += ';path=' + cookiePath;
            //set cookie
            if (this.response) {
                this.response.setHeader('Set-Cookie',cookieValue);
            }
        }
    }

    /**
     * @param {*} p
     */
    moment(p) {
        const moment = require("moment"), locale = this.culture();
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
    setCookie(name, value, expires, domain, cpath) {
        if (typeof name !== 'string')
            throw 'Invalid argument. Argument [name] must be a string.';
        if (typeof value !== 'string')
            throw 'Invalid argument. Argument [value] must be a string.';
        this.cookie(name, value, expires, domain, cpath);
    }

    /**
     * Set a permanent cookie for user preferred language
     * @param lang - A string which represents the user preferred language e.g. en-US, en-GB etc
     */
    setLangCookie(lang) {
        this.cookie(".LANG", lang);
    }

    /**
     * @param {string} name - The name of the cookie to be deleted
     * @param {string=} domain - An optional parameter which indicates cookie's domain.
     * @param {string=} cpath - An optional parameter which indicates cookie's path. The default value is the root path.
     * @returns {string|undefined}
     */
    removeCookie(name, domain, cpath) {
        if (typeof name !== 'string')
            throw 'Invalid argument. Argument [name] must be a string.';

        this.cookie(name, null, null , domain, cpath);
    }

    /**
     * Executes the specified code in unattended mode.
     * @param {function(function(Error=, *=))} fn
     * @param {function(Error=, *=)} callback
     */
    unattended(fn, callback) {
        const self = this;
        let interactiveUser;
        callback = callback || function() {};
        fn = fn || function() {};
        if (self._unattended) {
            try {
                fn.call(self, function(err, result) {
                    callback(err, result);
                });
            }
            catch(e) {
                callback(e);
            }
            return;
        }
        //get unattended execution account
        self.application.config.settings.auth = self.application.config.settings.auth || {};
        const account = self.application.config.settings.auth.unattendedExecutionAccount;
        //get interactive user
        if (this.user) {
            interactiveUser = { name:this.user.name,authenticationType: this.user.authenticationType };
            //setting interactive user
            self.interactiveUser = interactiveUser;
        }
        if (account) {
            self.user = { name:account, authenticationType:'Basic' };
        }
        try {
            self._unattended = true;
            fn.call(self, function(err, result) {
                //restore user
                if (interactiveUser) {
                    self.user = util._extend({ }, interactiveUser);
                }
                delete self.interactiveUser;
                delete self._unattended;
                callback(err, result);
            });
        }
        catch(e) {
            //restore user
            if (interactiveUser) {
                self.user = util._extend({ }, interactiveUser);
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
    culture(value) {
        const self = this;
        if (typeof value === 'undefined') {
            if (this._culture)
                return this._culture;
            //get available cultures and default culture
            let cultures = ['en-us'], defaultCulture = 'en-us';
            if (this.application.config.settings) {
                if (this.application.config.settings['localization']) {
                    cultures = this.application.config.settings['localization']['cultures'] || cultures;
                    defaultCulture = this.application.config.settings['localization']['default'] || defaultCulture;
                }
            }
            let lang = defaultCulture;
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
                const langs = self.request.headers['accept-language'].split(';');
                if (langs.length>0) {
                    lang = langs[0].split(',')[0] || defaultCulture;
                }
            }
            if (lang) {
                //search application cultures
                const obj = cultures.find(function(x) {
                    return (x == lang.toLowerCase()) || (x.substr(0,2) == lang.toLowerCase().substr(0,2));
                });
                //if user culture is valid for this application
                if (obj) {
                    //set context culture
                    this._culture=obj;
                    return this._culture;
                }
            }
            //otherwise use default culture
            this._culture = defaultCulture;
            return this._culture;
        }
        else {
            this._culture = value;
        }
    }

    /**
     * Performs cross-site request forgery validation against the specified token
     * @param {string=} csrfToken
     */
    validateAntiForgeryToken(csrfToken) {
        const self = this;
        if (typeof csrfToken === 'undefined') {
            //try to get token from params
            if (typeof self.params !== 'undefined')
                csrfToken = self.params['_CSRFToken'];
        }
        if (typeof csrfToken !== 'string')
            throw new HttpBadRequestError('Bad request. Invalid cross-site request forgery token.');
        if (csrfToken.length==0)
            throw new HttpBadRequestError('Bad request. Empty cross-site request forgery token.');
        try {
            const cookies = self.cookies;
            let csrfCookieToken;
            let csrfRequestToken;
            if (cookies['.CSRF']) {
                //try to decrypt cookie token
                try {
                    csrfCookieToken = JSON.parse(self.application.decrypt(cookies['.CSRF']));
                }
                catch(e) {
                    throw new HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
                }
                //then try to decrypt the token provided
                try {
                    csrfRequestToken = JSON.parse(self.application.decrypt(csrfToken));
                }
                catch(e) {
                    throw new HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
                }
                if ((typeof csrfCookieToken === 'object') && (typeof csrfRequestToken === 'object')) {

                    let valid = true, tokenExpiration = 60;
                    //1. validate token equality
                    for(const key in csrfCookieToken) {
                        if (csrfCookieToken.hasOwnProperty(key)) {
                            if (csrfCookieToken[key]!==csrfRequestToken[key]) {
                                valid = false;
                                break;
                            }
                        }
                    }
                    if (valid==true) {
                        //2. validate timestamp
                        const timestamp = new Date(csrfCookieToken.date);
                        const diff = Math.abs((new Date())-timestamp);
                        if (diff<0) {
                            valid=false;
                        }
                        if (valid) {
                            if (self.application.config.settings)
                                if (self.application.config.settings.auth)
                                    if (self.application.config.settings.auth['csrfExpiration'])
                                         tokenExpiration = parseInt(self.application.config.settings.auth['csrfExpiration']);
                            if (diff>tokenExpiration*60*1000)
                                valid=false;
                        }
                    }
                    if (valid)
                        return;

                }
                throw new HttpBadRequestError('Bad request. A cross-site request forgery was detected.');
            }
            else {
                throw new HttpBadRequestError('Bad request.Missing cross-site request forgery data.');
            }
        }
        catch(e) {
            if (e.status)
                throw e;
            else
                throw new HttpServerError('Request validation failed.');
        }
    }

    writeFile(file) {
        try {
            const fs = require("fs");
            const path = require("path");
            const app = require('./index');
            const response = this.response;
            //check if file exists
            if (!fs.existsSync(file))
                throw new HttpNotFoundError();
            //get file extension
            const extensionName = path.extname(file);
            //and try to find this extension to MIME types

            //get MIME collection
            let contentType = null;
            const mime = _.find(this.application.config.mimes, function (x) {
                return (x.extension == extensionName);
            });
            if (_.isObject(mime))
                contentType = mime.type;
            //throw exception (MIME not found)
            if (contentType == null)
                throw new HttpForbiddenError();

            fs.readFile(file, "binary", function (err, stream) {
                if (err) {
                    //todo:raise application asynchronous error
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.write('500 Internal Server Error');
                    response.end();
                    return;
                }
                response.writeHead(200, {'Content-Type': contentType});
                response.write(stream, "binary");
                response.end();
            });

        } catch (e) {
            throw e;
        }
    }

    /**
     * Checks whether the HTTP method of the current request is equal or not to the given parameter.
     * @param {String|Array} method - The HTTP method (GET, POST, PUT, DELETE)
     * */
    is(method) {
        const self = this;
        if (self.request == null)
            return false;
        if (util.isArray(method)) {
            return (method.filter(function(x) { return self.request.method.toUpperCase() == x.toUpperCase(); }).length>0);
        }
        else {
            if (typeof method !== 'string')
                return false;
            if (method=='*')
                return true;
            return (self.request.method.toUpperCase() == method.toUpperCase());
        }

    }

    isPost() {
        return this.is('POST');
    }

    /**
     * @param {String|Array} method
     * @param {Function} fn
     * @returns {HttpContext}
     */
    handle(method, fn) {
        const self = this;
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
    catch(callback) {
        const self = this;
        callback = callback || function() {};
        self.once("error", function(ev) {
            return callback.call(self, ev.error);
        });
        return self;
    }

    /**
     * @param {Function} fn
     * @returns {HttpContext}
     */
    unhandle(fn) {
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
    handlePost(fn) {
        return this.handle('POST', fn);
    }

    /**
     * Invokes the given function if the current HTTP method is equal to GET
     * @param {Function()} fn
     * @returns {HttpContext}
     */
    handleGet(fn) {
        return this.handle('GET', fn);
    }

    /**
     * Invokes the given function if the current HTTP method is equal to PUT
     * @param {Function()} fn
     * @returns {HttpContext}
     */
    handlePut(fn) {
        return this.handle('PUT', fn);
    }

    /**
     * Invokes the given function if the current HTTP method is equal to PUT
     * @param {Function()} fn
     */
    handleDelete(fn) {
        return this.handle('DELETE', fn);
    }

    /**
     * Gets or sets the current HTTP handler
     * @param {Object=} value
     * @returns {Function|Object}
     */
    currentHandler(value) {
        if (value === undefined) {
            return this.request.currentHandler;
        }
        else {
            this.request.currentHandler = value;
        }
    }

    /**
     * Translates the given string to the language specified in this context
     * @param {string} text - The string to translate
     * @param {string=} lib - A string that represents the library which contains the source string. This arguments is optional. If this argument is missing, then the operation will use the default (global) library.
     * @returns {*}
     */
    translate(text, lib) {
        try {
            const self = this, app = self.application;
            //ensure locale
            const locale = this.culture();
            //ensure localization library
            lib = lib || 'global';
            //get cached library object if any
            app.config.locales = app.config.locales || {};
            let library = app.config.locales[lib];
            //if library has not been yet initialized
            if (!library) {
                //get library path
                var file = app.mapPath('/locales/'.concat(lib,'.',locale,'.json'));
                //if file does not exist
                if (!fs.existsSync(file))
                {
                    //return the give text
                    return text;
                }
                else {
                    //otherwise create library
                    library = app.config.locales[lib] = {};
                }
            }
            if (!library[locale]) {
                var file = app.mapPath('/locales/'.concat(lib,'.',locale,'.json'));
                if (fs.existsSync(file))
                    library[locale] = JSON.parse(fs.readFileSync(file,'utf8'));
            }
            let result = text;
            if (library[locale])
                    result = library[locale][text];
            return result || text;
        }
        catch (e) {
            TraceUtils.log(e);
            return text;
        }
    }

    /**
     * Creates an instance of a view engine based on the given extension (e.g. ejs, md etc)
     * @param {string} extension
     * @returns {*}
     */
    engine(extension) {
        const item = this.application.config.engines.find(function(x) { return x.extension===extension; });
        if (item) {
            const engine = require(item.type);
            if (typeof engine.createInstance !== 'function') {
                throw new Error('Invalid view engine module.')
            }
            return engine.createInstance(this);
        }
    }

    /**
     * Creates a new instance of HttpViewContext class based on this HttpContext instance.
     * @returns {HttpViewContext|*}
     */
    createViewContext() {
        const mvc = require("./mvc");
        return new mvc.HttpViewContext(this);
    }
}