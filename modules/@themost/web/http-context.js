/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-10
 */
'use strict';
/**
 * @ignore
 */
var path = require('path'),
    util = require('util'),
    fs = require('fs'),
    da = require('most-data'),
    url = require('url'),
    _ = require('lodash'),
    common = require('@themost/common');
/**
 * Creates an instance of HttpContext class.
 * @class
 * @property {{extension:string,type:string}} mime - Gets an object which represents the mime type associated with this context.
 * @property {string} format - Gets a string which represents the response format of this context (e.g html, json, js etc).
 * @constructor
 * @augments DataContext
 * @augments EventEmitter2
 * @param {ClientRequest} httpRequest
 * @param {ServerResponse} httpResponse
 * @returns {HttpContext}
 */
function HttpContext(httpRequest, httpResponse) {
    /**
     * @type {ClientRequest}
     */
    this.request = httpRequest;
    /**
     *
     * @type {ServerResponse}
     */
    this.response = httpResponse;
    /**
     *@type {HttpApplication}
     */
    this.application = undefined;
    var __application__ = null;
    Object.defineProperty(this, 'application', {
        get: function () {
            return __application__;
        },
        set: function (value) {
            __application__ = value;
        }, configurable: false, enumerable: false
    });
    var self = this;
    Object.defineProperty(this, 'mime', {
        get: function () {
            var res = self.application.resolveMime(self.request.url);
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
                    var accept = self.request.headers['accept'], arr = accept.split(';');
                    if (arr[0]) {
                        //get acceptable mime types
                        var mimes = arr[0].split(',');
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
            var uri = url.parse(self.request.url);
            var result = path.extname(uri.pathname);
            if (result) {
                return result.substr(1).toLowerCase();
            }
            else {
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

    var data = null;
    Object.defineProperty(this, 'data', {
        get: function () {
            if (data)
                return data;
            data = { };
            if (self.request && self.request.routeData) {
                for(var key in self.request.routeData) {
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
            var list = {},
                rc = self.request.headers.cookie;
            rc && rc.split(';').forEach(function( cookie ) {
                var parts = cookie.split('=');
                list[parts.shift().trim()] = unescape(parts.join('='));
            });
            return list;
        }, configurable: false, enumerable: false
    });

    var jq = null, ng = null, doc;
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
//todo: set HttpContext inheritance from configuration
util.inherits(HttpContext, da.classes.DefaultDataContext);

HttpContext.prototype.init = function() {
    //
};
/**
 * @param {string} name
 * @param {*=} value
 * @param {Date=} expires
 * @param {string=} domain
 * @param {string=} cookiePath
 * @returns {string|undefined}
 */
HttpContext.prototype.cookie = function(name, value, expires, domain, cookiePath) {

    if (typeof value==='undefined')
    {
        if (this.request) {
            var cookies = common.parseCookies(this.request);
            return cookies[name];
        }
        else
            return null;
    }
    else {
        var cookieValue;
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
};

/**
 * @param {*} p
 */
HttpContext.prototype.moment = function(p) {
    var moment = require("moment"), locale = this.culture();
    return moment(p).locale(locale);
};

/**
 * @param {string} name - The name of the cookie to be added
 * @param {string|*} value - The value of the cookie
 * @param {Date=} expires - An optional parameter which sets cookie's expiration date. If this parameters is missing or is null a session cookie will be set.
 * @param {string=} domain - An optional parameter which sets the cookie's domain.
 * @param {string=} cpath - An optional parameter which sets the cookie's path. The default value is the root path.
 * @returns {string|undefined}
 */
HttpContext.prototype.setCookie = function(name, value, expires, domain, cpath) {
    if (typeof name !== 'string')
        throw 'Invalid argument. Argument [name] must be a string.';
    if (typeof value !== 'string')
        throw 'Invalid argument. Argument [value] must be a string.';
    this.cookie(name, value, expires, domain, cpath);
};

/**
 * Set a permanent cookie for user preferred language
 * @param lang - A string which represents the user preferred language e.g. en-US, en-GB etc
 */
HttpContext.prototype.setLangCookie = function(lang) {
    this.cookie(".LANG", lang);
};

/**
 * @param {string} name - The name of the cookie to be deleted
 * @param {string=} domain - An optional parameter which indicates cookie's domain.
 * @param {string=} cpath - An optional parameter which indicates cookie's path. The default value is the root path.
 * @returns {string|undefined}
 */
HttpContext.prototype.removeCookie = function(name, domain, cpath) {
    if (typeof name !== 'string')
        throw 'Invalid argument. Argument [name] must be a string.';

    this.cookie(name, null, null , domain, cpath);
};
/**
 * Executes the specified code in unattended mode.
 * @param {function(function(Error=, *=))} fn
 * @param {function(Error=, *=)} callback
 */
HttpContext.prototype.unattended = function(fn, callback) {
    var self = this, interactiveUser;
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
    var account = self.application.config.settings.auth.unattendedExecutionAccount;
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
};


/**
 * Gets or sets the current culture
 * @param {String=} value
 */
HttpContext.prototype.culture = function(value) {
    var self = this;
    if (typeof value === 'undefined') {
        if (this._culture)
            return this._culture;
        //get available cultures and default culture
        var cultures = ['en-us'], defaultCulture = 'en-us';
        if (this.application.config.settings) {
            if (this.application.config.settings['localization']) {
                cultures = this.application.config.settings['localization']['cultures'] || cultures;
                defaultCulture = this.application.config.settings['localization']['default'] || defaultCulture;
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
            if (langs.length>0) {
                lang = langs[0].split(',')[0] || defaultCulture;
            }
        }
        if (lang) {
            //search application cultures
            var obj = cultures.find(function(x) {
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
};
/**
 * Performs cross-site request forgery validation against the specified token
 * @param {string=} csrfToken
 */
HttpContext.prototype.validateAntiForgeryToken = function(csrfToken) {
    var self = this;
    if (typeof csrfToken === 'undefined') {
        //try to get token from params
        if (typeof self.params !== 'undefined')
            csrfToken = self.params['_CSRFToken'];
    }
    if (typeof csrfToken !== 'string')
        throw new common.HttpBadRequest('Bad request. Invalid cross-site request forgery token.');
    if (csrfToken.length==0)
        throw new common.HttpBadRequest('Bad request. Empty cross-site request forgery token.');
    try {
        var cookies = self.cookies, csrfCookieToken, csrfRequestToken;
        if (cookies['.CSRF']) {
            //try to decrypt cookie token
            try {
                csrfCookieToken = JSON.parse(self.application.decrypt(cookies['.CSRF']));
            }
            catch(e) {
                throw new common.HttpBadRequest('Bad request.Invalid cross-site request forgery data.');
            }
            //then try to decrypt the token provided
            try {
                csrfRequestToken = JSON.parse(self.application.decrypt(csrfToken));
            }
            catch(e) {
                throw new common.HttpBadRequest('Bad request.Invalid cross-site request forgery data.');
            }
            if ((typeof csrfCookieToken === 'object') && (typeof csrfRequestToken === 'object')) {

                var valid = true, tokenExpiration = 60;
                //1. validate token equality
                for(var key in csrfCookieToken) {
                    if (csrfCookieToken.hasOwnProperty(key)) {
                        if (csrfCookieToken[key]!==csrfRequestToken[key]) {
                            valid = false;
                            break;
                        }
                    }
                }
                if (valid==true) {
                    //2. validate timestamp
                    var timestamp = new Date(csrfCookieToken.date);
                    var diff = Math.abs((new Date())-timestamp);
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
            throw new common.HttpBadRequest('Bad request. A cross-site request forgery was detected.');
        }
        else {
            throw new common.HttpBadRequest('Bad request.Missing cross-site request forgery data.');
        }
    }
    catch(e) {
        if (e.status)
            throw e;
        else
            throw new common.HttpServerError('Request validation failed.');
    }
};

HttpContext.prototype.writeFile = function (file) {
    try {
        var fs = require("fs");
        var path = require("path");
        var app = require('./index');
        var response = this.response;
        //check if file exists
        if (!fs.existsSync(file))
            throw new app.common.HttpNotFoundException();
        //get file extension
        var extensionName = path.extname(file);
        //and try to find this extension to MIME types

        //get MIME collection
        var contentType = null;
        var mime = _.find(app.current.config.mimes, function (x) {
            return (x.extension == extensionName);
        });
        if (_.isObject(mime))
            contentType = mime.type;
        //throw exception (MIME not found)
        if (contentType == null)
            throw new app.common.HttpForbiddenException();

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
        console.log(e.message);
        throw e;
    }
};
/**
 * Checks whether the HTTP method of the current request is equal or not to the given parameter.
 * @param {String|Array} method - The HTTP method (GET, POST, PUT, DELETE)
 * */
HttpContext.prototype.is = function (method) {
    var self = this;
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

};

HttpContext.prototype.isPost = function () {
    return this.is('POST');
};
/**
 * @param {String|Array} method
 * @param {Function} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handle = function(method, fn) {
    var self = this;
    if (self.is(method)) {
        self.handled = true;
        process.nextTick(function () {
            fn.call(self);
        });
    }
    return self;
};
/**
 * Handles context error by executing the given callback
 * @param {Function} callback
 */
HttpContext.prototype.catch = function(callback) {
    var self = this;
    callback = callback || function() {};
    self.once("error", function(ev) {
        return callback.call(self, ev.error);
    });
    return self;
};

/**
 * @param {Function} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.unhandle = function(fn) {
    if (!this.handled) {
        fn.call(this);
    }
    return this;
};

/**
 * Invokes the given function if the current HTTP method is equal to POST
 * @param {Function()} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handlePost = function(fn) {
    return this.handle('POST', fn);
};

/**
 * Invokes the given function if the current HTTP method is equal to GET
 * @param {Function()} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handleGet = function(fn) {
    return this.handle('GET', fn);
};


/**
 * Invokes the given function if the current HTTP method is equal to PUT
 * @param {Function()} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handlePut = function(fn) {
    return this.handle('PUT', fn);
};

/**
 * Invokes the given function if the current HTTP method is equal to PUT
 * @param {Function()} fn
 */
HttpContext.prototype.handleDelete = function(fn) {
    return this.handle('DELETE', fn);
};

/**
 * Gets or sets the current HTTP handler
 * @param {Object=} value
 * @returns {Function|Object}
 */
HttpContext.prototype.currentHandler = function (value) {
    if (value === undefined) {
        return this.request.currentHandler;
    }
    else {
        this.request.currentHandler = value;
    }
};
/**
 * Translates the given string to the language specified in this context
 * @param {string} text - The string to translate
 * @param {string=} lib - A string that represents the library which contains the source string. This arguments is optional. If this argument is missing, then the operation will use the default (global) library.
 * @returns {*}
 */
HttpContext.prototype.translate = function(text, lib) {
    try {
        var self = this, app = self.application;
        //todo::get current HTTP context locale
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
        var result = text;
        if (library[locale])
                result = library[locale][text];
        return result || text;
    }
    catch (e) {
        console.log(e);
        return text;
    }
};
/**
 * Translates the given string to the language specified in this context
 * @param {string} text - The string to translate
 * @param {string=} lib - A string that represents the library which contains the source string. This arguments is optional. If this argument is missing, then the operation will use the default (global) library.
 * @returns {*}
 */
HttpContext.prototype.t = HttpContext.prototype.translate;

/**
 * Creates an instance of a view engine based on the given extension (e.g. ejs, md etc)
 * @param {string} extension
 * @returns {*}
 */
HttpContext.prototype.engine = function(extension) {
    var item = this.application.config.engines.find(function(x) { return x.extension===extension; });
    if (item) {
        var engine = require(item.type);
        if (typeof engine.createInstance !== 'function') {
            throw new Error('Invalid view engine module.')
        }
        return engine.createInstance(this);
    }
};

/**
 * Creates a new instance of HttpViewContext class based on this HttpContext instance.
 * @returns {HttpViewContext|*}
 */
HttpContext.prototype.createViewContext = function() {
    var mvc = require("./http-mvc");
    return new mvc.HttpViewContext(this);
};

if (typeof exports !== 'undefined')
    module.exports = {
        /**
         * @class HttpContext
         */
        HttpContext:HttpContext,
        /**
         * Creates an instance of HttpContext class.
         * @param {ClientRequest} request
         * @param {ServerResponse} response
         * @returns {HttpContext}
         */
        createInstance: function (request, response) {

            return new HttpContext(request, response);
        }
    };
