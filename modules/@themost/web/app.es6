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
import {_} from 'lodash';
import util from 'util';
import http from 'http';
import path from 'path';
import fs from 'fs';
import url from 'url';
import async from 'async';
import querystring from 'querystring';
import crypto from 'crypto';
import {SequentialEventEmitter} from '@themost/common/emitter';
import {TraceUtils,RandomUtils,LangUtils} from '@themost/common/utils';
import {HttpError,HttpServerError,HttpNotFoundError} from '@themost/common/errors';
import {HttpContext} from './context';
import da from 'most-data';


const HTTP_SERVER_DEFAULT_BIND = '127.0.0.1';
const HTTP_SERVER_DEFAULT_PORT = 3000;

/**
 * @private
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @param callback
 */
function handleRequestInternal(request, response, callback)
{
    const self = this, context = self.createContext(request, response);
    //add query string
    if (request.url.indexOf('?') > 0)
        _.assign(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
    //add form
    if (request.form)
        _.assign(context.params, request.form);
    //add files
    if (request.files)
        _.assign(context.params, request.files);

    self.processRequest(context, function (err) {
        if (err) {
            if (self.listeners('error').length == 0) {
                self.onError(context, err, function () {
                    response.end();
                    callback();
                });
            }
            else {
                //raise application error event
                self.emit('error', { context:context, error:err } , function () {
                    response.end();
                    callback();
                });
            }
        }
        else {
            context.finalize(function() {
                response.end();
                callback();
            });
        }
    });
}
/**
 * @private
 * @param {*} options
 */
function createRequestInternal(options) {
    const opt = options ? options : {};
    const request = new http.IncomingMessage();
    request.method = (opt.method) ? opt.method : 'GET';
    request.url = (opt.url) ? opt.url : '/';
    request.httpVersion = '1.1';
    request.headers = (opt.headers) ? opt.headers : {
            host: 'localhost',
            'user-agent': 'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/22.0',
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.5',
            'accept-encoding': 'gzip, deflate',
            connection: 'keep-alive',
            'cache-control': 'max-age=0' };
    if (opt.cookie)
        request.headers.cookie = opt.cookie;
    request.cookies = (opt.cookies) ? opt.cookies : {};
    request.session = (opt.session) ? opt.session : {};
    request.params = (opt.params) ? opt.params : {};
    request.query = (opt.query) ? opt.query : {};
    request.form = (opt.form) ? opt.form : {};
    request.body = (opt.body) ? opt.body : {};
    request.files = (opt.files) ? opt.files : {};
    return request;
}

/**
 * Creates a mock-up server response
 * @param {ClientRequest} req
 * @returns {ServerResponse|*}
 * @private
 */
function createResponseInternal(req) {
    return new http.ServerResponse(req);
}

/**
 *
 * @param {HttpContext} context
 * @param {Error|*} err
 * @param {function(Error=)} callback
 * @private
 */
function htmlErrorInternal(context, err, callback) {
    try {
        if (_.isNil(context)) {
            callback(err);
            return;
        }
        const request = context.request, response = context.response, ejs = require('ejs');
        if (_.isNil(request) || _.isNil(response)) {
            callback(err);
            return;
        }
        //HTML custom errors
        if (/text\/html/g.test(request.headers.accept)) {
            fs.readFile(path.join(__dirname, './resources/http-error.html.ejs'), 'utf8', function (readErr, data) {
                if (readErr) {
                    //log process error
                    TraceUtils.log(readErr);
                    //continue error execution
                    callback(err);
                    return;
                }
                //compile data
                let str;
                try {
                    if (err instanceof HttpError) {
                        str = ejs.render(data, { error:err });
                    }
                    else {
                        const httpErr = new HttpError(500, null, err.message);
                        httpErr.stack = err.stack;
                        str = ejs.render(data, {error: httpErr});
                    }
                }
                catch (e) {
                    TraceUtils.log(e);
                    //continue error execution
                    callback(err);
                    return;
                }
                //write status header
                response.writeHead(err.status || 500 , { "Content-Type": "text/html" });
                response.write(str);
                response.end();
                callback();
            });
        }
        else {
            callback(err);
        }
    }
    catch (e) {
        //log process error
        TraceUtils.log(e);
        //and continue execution
        callback(err);
    }

}




/**
 * @private
 * @param {Function=} callback
 * @param {ApplicationOptions|*} options
 */
function startInternal(options, callback) {
    const self = this;
    callback = callback || function() { };
    try {
        //validate options

        if (self.config == null)
            self.init();
        /**
         * @memberof process.env
         * @property {number} PORT
         * @property {string} IP
         * @property {string} NODE_ENV
         */
        const opts = {
            bind:(process.env.IP || HTTP_SERVER_DEFAULT_BIND),
            port:(process.env.PORT ? process.env.PORT: HTTP_SERVER_DEFAULT_PORT)
        };
        //extend options
        _.assign(opts, options);

        const server_ = http.createServer(function (request, response) {
            const context = self.createContext(request, response);
            //begin request processing
            self.processRequest(context, function (err) {
                if (err) {
                    //handle context error event
                    if (context.listeners('error').length>0) {
                        return context.emit('error', { error:err }, function() {
                            context.finalize(function() {
                                if (context.response) { context.response.end(); }
                            });
                        });
                    }
                    if (self.listeners('error').length == 0) {
                        self.onError(context, err, function () {
                            if (typeof context === 'undefined' || context == null) { return; }
                            context.finalize(function() {
                                if (context.response) { context.response.end(); }
                            });
                        });
                    }
                    else {
                        //raise application error event
                        self.emit('error', { context:context, error:err }, function() {
                            if (typeof context === 'undefined' || context == null) { return; }
                            context.finalize(function() {
                                if (context.response) { context.response.end(); }
                            });
                        });
                    }
                }
                else {
                    if (typeof context === 'undefined' || context == null) { return; }
                    context.finalize(function() {
                        if (context.response) { context.response.end(); }
                    });
                }
            });
        });
        /**
         * @memberof {HttpApplication}
         * @returns {Server|*}
         */
        self.getServer = function() {
            return server_;
        };

        //start listening
        server_.listen(opts.port, opts.bind);
        TraceUtils.log(util.format('Web application is running at http://%s:%s/', opts.bind, opts.port));
        //do callback
        callback.call(self);
    } catch (e) {
        TraceUtils.log(e);
    }
}

/**
 * @param {HttpApplication} application
 * @returns {{html: Function, text: Function, json: Function, unauthorized: Function}}
 * @private
 */
function httpApplicationErrors(application) {
    const self = application;
    return {
        html: function(context, error, callback) {
            callback = callback || function () { };
            onHtmlError(context, error, function(err) {
                callback.call(self, err);
            });
        },
        text: function(context, error, callback) {
            callback = callback || function () { };
            /**
             * @type {ServerResponse}
             */
            const response = context.response;
            if (error) {
                //send plain text
                response.writeHead(error.status || 500, {"Content-Type": "text/plain"});
                //if error is an HTTP Exception
                if (error instanceof HttpError) {
                    response.write(error.status + ' ' + error.message + "\n");
                }
                else {
                    //otherwise send status 500
                    response.write('500 ' + error.message + "\n");
                }
                //send extra data (on development)
                if (process.env.NODE_ENV === 'development') {
                    if (!_.isEmpty(error.innerMessage)) {
                        response.write(error.innerMessage + "\n");
                    }
                    if (!_.isEmpty(error.stack)) {
                        response.write(error.stack + "\n");
                    }
                }
            }
            callback.call(this);
        },
        json: function(context, error, callback) {
            callback = callback || function () { };
            context.request.headers = context.request.headers || { };
            if (/application\/json/g.test(context.request.headers.accept)) {
                //prepare JSON result
                let result;
                if ((err instanceof HttpError) || (typeof err.status !== 'undefined')) {
                    result = new mvc.HttpJsonResult({ status:error.status, code:error.code, message:error.message, innerMessage: error.innerMessage });
                }
                else if (process.env.NODE_ENV === 'development') {
                    result = new mvc.HttpJsonResult(err);
                }
                else {
                    result = new mvc.HttpJsonResult(new HttpServerError());
                }
                //execute redirect result
                result.execute(context, function(err) {
                    callback.call(self, err);
                });
                return;
            }
            //go to next error if any
            callback.call(self, error);
        },
        unauthorized: function(context, error, callback) {
            if (_.isNil(context) || _.isNil(context)) {
                return callback.call(self);
            }
            if (error.status != 401) {
                //go to next error if any
                return callback.call(self, error);
            }
            context.request.headers = context.request.headers || { };
            if (/text\/html/g.test(context.request.headers.accept)) {
                if (self.config.settings) {
                    if (self.config.settings.auth) {
                        //get login page from configuration
                        const page = self.config.settings.auth.loginPage || '/login.html';
                        //prepare redirect result
                        const result = new mvc.HttpRedirectResult(page.concat('?returnUrl=', encodeURIComponent(context.request.url)));
                        //execute redirect result
                        result.execute(context, function(err) {
                            callback.call(self, err);
                        });
                        return;
                    }
                }
            }
            //go to next error if any
            callback.call(self, error);
        }
    }
}


/**
 * @classdesc An abstract class that represents an HTTP Handler
 * @class
 * @abstract
 */
export class HttpHandler {
    /**
     * Occurs as the first event in the HTTP execution
     * @constructor
     * @param {HttpContext} context
     * @param {Function} callback
     */
    beginRequest(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when a handler is going to validate current HTTP request.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    validateRequest(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when a handler is going to set current user identity.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    authenticateRequest(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when a handler has established the identity of the current user.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    /*HttpHandler.prototype.postAuthenticateRequest = function(context, callback) {
     callback = callback || function() {};
     callback.call(context);
     };*/


    /**
     * Occurs when a handler has verified user authorization.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    authorizeRequest(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when the handler is selected to respond to the request.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    mapRequest(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when application has mapped the current request to the appropriate handler.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    postMapRequest(context, callback) {
        callback = callback || function() {};
        callback.call(context);
    }

    /**
     * Occurs just before application starts executing a handler.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    /*HttpHandler.prototype.preRequestHandlerExecute = function(context, callback) {
     callback = callback || function() {};
     callback.call(context);
     };*/

    /**
     * Occurs when application starts processing current HTTP request.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    processRequest(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when application starts executing an HTTP Result.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    preExecuteResult(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when application was succesfully executes an HTTP Result.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    postExecuteResult(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }

    /**
     * Occurs when the handler finishes execution.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    /*HttpHandler.prototype.postRequestHandlerExecute = function(context, callback) {
     callback = callback || function() {};
     callback.call(context);
     };*/

    /**
     * Occurs as the last event in the HTTP execution
     * @param {HttpContext} context
     * @param {Function} callback
     */
    endRequest(context, callback) {
        callback = callback || function () {
            };
        callback.call(context);
    }
}


/**
 * @type {string[]}
 * @private
 */
HttpHandler.Events = ['beginRequest', 'validateRequest', 'authenticateRequest',
    'authorizeRequest', 'mapRequest', 'postMapRequest', 'preExecuteResult', 'postExecuteResult', 'endRequest'];

/**
 * @class
 * @classdesc Abstract class that represents a data context
 * @abstract
 */
export class HttpDataContext {
    /**
     * @returns {AbstractAdapter}
     */
    db() {
        return null;
    }

    /**
     * @param {string} name
     * @returns {DataModel}
     */
    model(name) {
        return null;
    }

    /**
     * @param {string} type
     * @returns {*}
     */
    dataTypes(type) {
        return null;
    }
}


/**
 * @classdesc ApplicationOptions class describes the startup options of a MOST Web Framework application.
 * @class
 * @property {number} port - The HTTP binding port number.
 * The default value is either PORT environment variable or 3000.
 * @property {string} bind - The HTTP binding ip address or hostname.
 * The default value is either IP environment variable or 127.0.0.1.
 * @property {number|string} cluster - A number which represents the number of clustered applications.
 * The default value is zero (no clustering). If cluster is 'auto' then the number of clustered applications
 * depends on hardware capabilities (number of CPUs).
 @example
 import {HttpApplication} from '@themost/web/app';
 var app = new HttpApplication();
 app.start({ port:80, bind:"0.0.0.0",cluster:'auto' });
 @example
 //Environment variables already set: IP=198.51.100.0 PORT=80
 import {HttpApplication} from '@themost/web/app';
 var app = new HttpApplication();
 app.start();
 */
export class ApplicationOptions {
    constructor() {

    }
}
/**
 * @classdesc Represents HttpApplication configuration
 * @class
 */
export class ApplicationConfig {
    constructor() {
        /**
         * Gets an array of data adapters.
         * @type {Array}
         */
        this.adapters = [];
        /**
         * Gets an array of HTTP view engines configuration
         * @type {Array}
         */
        this.engines = [];
        /**
         *  Gets an array of all registered MIME types
         * @type {Array}
         */
        this.mimes = [];
        /**
         * Gets an array of all registered HTTP handlers.
         * @type {Array}
         */
        this.handlers = [];
        /**
         * Gets an array of all registered HTTP routes.
         * @type {Array}
         */
        this.routes = [];
        /**
         * Gets or sets a collection of data adapter types that are going to be use in data operation
         * @type {Array}
         */
        this.adapterTypes = null;
        /**
         * Gets or sets a collection of data types that are going to be use in data operation
         * @type {Array}
         */
        this.dataTypes = null;
        /**
         * Gets or sets an object that holds application settings
         * @type {Array}
         */
        this.settings = { };
        /**
         * Gets or sets an object that holds application locales
         * @type {*}
         */
        this.locales = { };
    }
}

/**
 * @class
 * @property {string} executionPath - Gets or sets a string which represents the current execution path
 * @property {string} configPath - Gets or sets a string which represents the current configuration path
 * @augments EventEmitter
 */
export class HttpApplication extends SequentialEventEmitter {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.executionPath = path.join(process.cwd(), 'app');
        /**
         * Gets the current application configuration path
         * @type {*}
         */
        this.configPath = path.join(process.cwd(), 'app');
        /**
         * Gets or sets application configuration settings
         * @type {ApplicationConfig}
         */
        this.config = null;
        /**
         * Gets or sets a collection of application handlers
         * @type {Array}
         */
        this.handlers = [];

        //initialize angular server module
        const ng = require('./angular/server_module');
        /**
         * @type {AngularServerModule}
         */
        this.module = null;
        //init module
        ng.init(this);
        //register auth service
        const self = this;
        self.module.service('$auth', function($context) {
            try {
                //ensure settings
                self.config.settings.auth = self.config.settings.auth || { };
                let providerPath = self.config.settings.auth.provider || './services/auth';
                //get auth provider
                if (providerPath.indexOf('/')==0)
                    providerPath = self.mapPath(providerPath);
                const svc = require(providerPath);
                if (typeof svc.createInstance !== 'function')
                    throw new Error('Invalid authentication provider module.');
                return svc.createInstance($context);
            }
            catch (e) {
                throw e;
            }
        });
        /**
         * @type {HttpCache}
         */
        let $cache;
        self.module.service('$cache', function() {
            try {
                return self.cache;
            }
            catch (e) {
                throw e;
            }
        });


        Object.defineProperty(self, 'cache', {
            get: function () {
                if (!_.isNil($cache))
                    return $cache;
                const HttpCache = require( "./services/cache" );
                /**
                 * @type {HttpCache|*}
                 */
                $cache = new HttpCache();
                return $cache;
            },
            set: function(value) {
                $cache = value;
            },
            configurable: false,
            enumerable: false
        });
        /**
         * Gets or sets a boolean that indicates whether the application is in development mode
         * @type {string}
         */
        this.development = (process.env.NODE_ENV === 'development');
        /**
         *
         * @type {{html, text, json, unauthorized}|*}
         */
        this.errors = httpApplicationErrors(this);




    }

    /**
     * Initializes application configuration.
     * @return {HttpApplication}
     */
    init() {
        /**
         * Gets or sets application configuration settings
         */
            //get node environment
        const env = process.env['NODE_ENV'] || 'production';

        let str;
        //first of all try to load environment specific configuration
        try {
            TraceUtils.log(util.format('Init: Loading environment specific configuration file (app.%s.json)', env));
            str = path.join(process.cwd(), 'config', 'app.' + env + '.json');
            /**
             * @type {ApplicationConfig}
             */
            this.config = require(str);
            TraceUtils.log(util.format('Init: Environment specific configuration file (app.%s.json) was succesfully loaded.', env));
        }
        catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                TraceUtils.log(util.format('Init: Environment specific configuration file (app.%s.json) is missing.', env));
                //try to load default configuration file
                try {
                    TraceUtils.log('Init: Loading environment default configuration file (app.json)');
                    str = path.join(process.cwd(), 'config', 'app.json');
                    /**
                     * @type {ApplicationConfig}
                     */
                    this.config = require(str);
                    TraceUtils.log('Init: Default configuration file (app.json) was succesfully loaded.');
                }
                catch (e) {
                    if (e.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.log('Init: An error occured while loading default configuration (app.json). Configuration cannot be found or is inaccesible.');
                        //load internal configuration file
                        /**
                         * @type {ApplicationConfig}
                         */
                        this.config = require('./resources/app.json');
                        this.config.settings.crypto = {
                            "algorithm": "aes256",
                            "key": RandomUtils.randomHex(32)
                        };
                        TraceUtils.log('Init: Internal configuration file (app.json) was succesfully loaded.');
                    }
                    else {
                        TraceUtils.log('Init: An error occured while loading default configuration (app.json)');
                        throw e;
                    }
                }
            }
            else {
                TraceUtils.log(util.format('Init: An error occured while loading application specific configuration (app).', env));
                throw e;
            }
        }
        //load routes (if empty)
        if (_.isNil(this.config.routes)) {
            try {
                this.config.routes = require(path.join(process.cwd(),'config/routes.json'));
            }
            catch(e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    //load internal default route file
                    TraceUtils.log('Init: Application specific routes configuration cannot be found. The default routes configuration will be loaded instead.');
                    this.config.routes = require('./resources/routes.json');
                }
                else {
                    TraceUtils.log('Init: An error occured while trying to load application routes configuration.');
                    throw e;
                }
            }
        }
        //load data types (if empty)
        if (_.isNil(this.config.dataTypes))
        {
            try {
                this.config.dataTypes = da.cfg.current.dataTypes;
            }
            catch(e) {
                TraceUtils.log('Init: An error occured while trying to load application data types configuration.');
                throw e;
            }
        }

        //set settings default
        this.config.settings = this.config.settings || {};

        //initialize handlers list
        //important note: Applications handlers are static classes (they will be initialized once),
        //so they should not hold information about http context and execution lifecycle.
        const self = this;

        const handlers = self.config.handlers || [], defaultApplicationConfig = require('./resources/app.json');
        //default handlers
        const defaultHandlers = defaultApplicationConfig.handlers;
        for (let i = 0; i < defaultHandlers.length; i++) {
            (function(item) {
                if (typeof handlers.filter(function(x) { return x.name === item.name; })[0] === 'undefined') {
                    handlers.push(item);
                }
            })(defaultHandlers[i]);
        }
        _.forEach(handlers, function (h) {
            try {
                let handlerPath = h.type;
                if (handlerPath.indexOf('/')==0)
                    handlerPath = self.mapPath(handlerPath);
                const handlerModule = require(handlerPath);
                let handler = null;
                if (handlerModule) {
                    if (typeof handlerModule.default != 'function') {
                        TraceUtils.log(util.format('The specified handler (%s) cannot be instantiated. The module does not export default constructor.', h.name));
                        return;
                    }
                    const HandlerCtor = handlerModule.default;
                    handler = new HandlerCtor();
                    if (handler)
                        self.handlers.push(handler);
                }
            }
            catch (e) {
                throw new Error(util.format('The specified handler (%s) cannot be loaded. %s', h.name, e.message));
            }
        });
        //initialize basic directives collection
        const directives = require("./angular/server_directives");
        directives.apply(this);
        return this;
    }

    /**
     * Returns the path of a physical file based on a given URL.
     */
    mapPath(s) {
        const uri = url.parse(s).pathname;
        return path.join(this.executionPath, uri);
    }

    /**
     * Resolves ETag header for the given file. If the specifed does not exist or is invalid returns null.
     * @param {string=} file - A string that represents the file we want to query
     * @param {function(Error,string=)} callback
     */
    resolveETag(file, callback) {
        fs.exists(file, function(exists) {
            try {
                if (exists) {
                    fs.stat(file, function(err, stats) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            if (!stats.isFile()) {
                                callback(null);
                            }
                            else {
                                //validate if-none-match
                                const md5 = crypto.createHash('md5');
                                md5.update(stats.mtime.toString());
                                const result = md5.digest('base64');
                                callback(null, result);

                            }
                        }
                    });
                }
                else {
                    callback(null);
                }
            }
            catch (e) {
                callback(null);
            }
        });
    }

    /**
     * @param {HttpContext} context
     * @param {string} executionPath
     * @param {function(Error, Boolean)} callback
     */
    unmodifiedRequest(context, executionPath, callback) {
        try {
            const requestETag = context.request.headers['if-none-match'];
            if (typeof requestETag === 'undefined' || requestETag == null) {
                callback(null, false);
                return;
            }
            HttpApplication.prototype.resolveETag(executionPath, function(err, result) {
                callback(null, (requestETag==result));
            });
        }
        catch (e) {
            TraceUtils.log(e);
            callback(null, false);
        }
    }

    /**
     * @param request {String|IncomingMessage}
     * */
    resolveMime(request) {
        if (typeof request=== 'string') {
            //get file extension
            var extensionName = path.extname(request);
            var arr = this.config.mimes.filter(function(x) {
                return (x.extension == extensionName);
            });
            if (arr.length>0)
                return arr[0];
            return null;
        }
        else if (typeof request=== 'object') {
            //get file extension
            var extensionName = path.extname(request.url);
            var arr = this.config.mimes.filter(function(x) {
                return (x.extension == extensionName);
            });
            if (arr.length>0)
                return arr[0];
            return null;
        }
    }

    /**
     * Encrypts the given data
     * */
    encrypt(data) {
        if (typeof data === 'undefined' || data==null)
            return null;
        //validate settings
        if (!this.config.settings.crypto)
            throw new Error('Data encryption configuration section is missing. The operation cannot be completed');
        if (!this.config.settings.crypto.algorithm)
            throw new Error('Data encryption algorithm is missing. The operation cannot be completed');
        if (!this.config.settings.crypto.key)
            throw new Error('Data encryption key is missing. The operation cannot be completed');
        //encrypt
        const cipher = crypto.createCipher(this.config.settings.crypto.algorithm, this.config.settings.crypto.key);
        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    }

    /**
     * Decrypts the given data.
     * */
    decrypt(data) {
        if (typeof data === 'undefined' || data==null)
            return null;
        //validate settings
        if (!this.config.settings.crypto)
            throw new Error('Data encryption configuration section is missing. The operation cannot be completed');
        if (!this.config.settings.crypto.algorithm)
            throw new Error('Data encryption algorithm is missing. The operation cannot be completed');
        if (!this.config.settings.crypto.key)
            throw new Error('Data encryption key is missing. The operation cannot be completed');
        //decrypt
        const decipher = crypto.createDecipher(this.config.settings.crypto.algorithm, this.config.settings.crypto.key);
        return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
    }

    /**
     * Sets the authentication cookie that is associated with the given user.
     * @param {HttpContext} context
     * @param {String} username
     * @param {*=} options
     */
    setAuthCookie(context, username, options) {
        const defaultOptions = { user:username, dateCreated:new Date()};
        let value;
        let expires;
        if (typeof options !== 'undefined' && options != null) {
            value = JSON.stringify(util._extend(options, defaultOptions));
            if (util.isDate(options.expires)) {
                expires = options.expires.toUTCString();
            }
        }
        else {
            value = JSON.stringify(defaultOptions);
        }
        const settings = this.config.settings ? (this.config.settings.auth || { }) : { };
        settings.name = settings.name || '.MAUTH';
        let str = settings.name.concat('=', this.encrypt(value)) + ';path=/';
        if (typeof expires === 'string') {
            str +=';expires=' + expires;
        }
        context.response.setHeader('Set-Cookie',str);
    }

    /**
     * Sets the authentication cookie that is associated with the given user.
     * @param {HttpContext} context
     * @param {String} username
     */
    getAuthCookie(context) {
        try {
            const settings = this.config.settings ? (this.config.settings.auth || { }) : { };
            settings.name = settings.name || '.MAUTH';
            const cookie = context.cookie(settings.name);
            if (cookie) {
                return this.decrypt(cookie);
            }
            return null;
        }
        catch(e) {
            TraceUtils.log('GetAuthCookie failed.');
            TraceUtils.log(e.message);
            return null;
        }
    }

    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    processRequest(context, callback) {
        const self = this;
        if (typeof context === 'undefined' || context == null) {
            callback.call(self);
        }
        else {
            //1. beginRequest
            context.emit('beginRequest', context, function (err) {
                if (err) {
                    callback.call(context, err);
                }
                else {
                    //2. validateRequest
                    context.emit('validateRequest', context, function (err) {
                        if (err) {
                            callback.call(context, err);
                        }
                        else {
                            //3. authenticateRequest
                            context.emit('authenticateRequest', context, function (err) {
                                if (err) {
                                    callback.call(context, err);
                                }
                                else {
                                    //4. authorizeRequest
                                    context.emit('authorizeRequest', context, function (err) {
                                        if (err) {
                                            callback.call(context, err);
                                        }
                                        else {
                                            //5. mapRequest
                                            context.emit('mapRequest', context, function (err) {
                                                if (err) {
                                                    callback.call(context, err);
                                                }
                                                else {
                                                    //5b. postMapRequest
                                                    context.emit('postMapRequest', context, function(err) {
                                                        if (err) {
                                                            callback.call(context, err);
                                                        }
                                                        else {
                                                            //process HEAD request
                                                            if (context.request.method==='HEAD') {
                                                                //7. endRequest
                                                                context.emit('endRequest', context, function (err) {
                                                                    callback.call(context, err);
                                                                });
                                                            }
                                                            else {
                                                                //6. processRequest
                                                                if (context.request.currentHandler != null)
                                                                    context.request.currentHandler.processRequest(context, function (err) {
                                                                        if (err) {
                                                                            callback.call(context, err);
                                                                        }
                                                                        else {
                                                                            //7. endRequest
                                                                            context.emit('endRequest', context, function (err) {
                                                                                callback.call(context, err);
                                                                            });
                                                                        }
                                                                    });
                                                                else {
                                                                    const er = new HttpNotFoundError();
                                                                    if (context.request && context.request.url) {
                                                                        er.resource = context.request.url;
                                                                    }
                                                                    callback.call(context, er);
                                                                }
                                                            }

                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    /**
     * Gets the default data context based on the current configuration
     * @returns {AbstractAdapter}
     */
    db() {
        if ((this.config.adapters == null) || (this.config.adapters.length == 0))
            throw new Error('Data adapters configuration settings are missing or cannot be accessed.');
        let adapter = null;
        if (this.config.adapters.length == 1) {
            //there is only one adapter so try to instantiate it
            adapter = this.config.adapters[0];
        }
        else {
            adapter = _.find(this.config.adapters, function (x) {
                return x.default;
            });
        }
        if (_.isEmpty(adapter))
            throw new Error('There is no default data adapter or the configuration is incorrect.');
        //try to instantiate adapter
        if (!adapter.invariantName)
            throw new Error('The default data adapter has no invariant name.');
        const adapterType = this.config.adapterTypes[adapter.invariantName];
        if (adapterType == null)
            throw new Error('The default data adapter type cannot be found.');
        if (typeof adapterType.createInstance === 'function') {
            return adapterType.createInstance(adapter.options);
        }
        else if (adapterType.require) {
            const m = require(adapterType.require);
            if (typeof m.createInstance === 'function') {
                return m.createInstance(adapter.options);
            }
            throw new Error('The default data adapter cannot be instantiated. The module provided does not export a function called createInstance().')
        }
    }

    /**
     * Creates an instance of HttpContext class.
     * @param {ClientRequest} request
     * @param {ServerResponse} response
     * @returns {HttpContext}
     */
    createContext(request, response) {
        const context = new HttpContext(request, response);
        //set context application
        context.application = this;
        //set handler events
        for (let i = 0; i < HttpHandler.Events.length; i++) {
            const ev = HttpHandler.Events[i];
            for (let j = 0; j < this.handlers.length; j++) {
                const handler = this.handlers[j];
                if (typeof handler[ev] === 'function') {
                    context.on(ev, handler[ev]);
                }

            }
        }
        return context;
    }

    /**
     * @param {*} options
     * @param {*} data
     * @param {Function} callback
     */
    executeExternalRequest(options, data, callback) {
        //make request
        const https = require('https'), opts = (typeof options==='string') ? url.parse(options) : options, httpModule = (opts.protocol === 'https:') ? https : http;
        const req = httpModule.request(opts, function(res) {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function(){
                const result = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body:data,
                    encoding:'utf8'
                };
                /**
                 * destroy sockets (manually close an unused socket) ?
                 */
                callback(null, result);
            });
        });
        req.on('error', function(e) {
            //return error
            callback(e);
        });
        if(data)
        {
            if (typeof data ==="object" )
                req.write(JSON.stringify(data));
            else
                req.write(data.toString());
        }
        req.end();
    }

    /**
     * Executes an internal process
     * @param {function(HttpContext)} fn
     */
    execute(fn) {
        const request = createRequestInternal.call(this);
        fn.call(this, this.createContext(request, createResponseInternal.call(this,request)));
    }

    /**
     * Executes an unattended internal process
     * @param {function(HttpContext)} fn
     */
    unattended(fn) {
        //create context
        const request = createRequestInternal.call(this), context =  this.createContext(request, createResponseInternal.call(this,request));
        //get unattended account
        /**
         * @type {{unattendedExecutionAccount:string}|*}
         */
        this.config.settings.auth = this.config.settings.auth || {};
        const account = this.config.settings.auth.unattendedExecutionAccount;
        //set unattended execution account
        if (typeof account !== 'undefined' || account!==null) {
            context.user = { name: account, authenticationType: 'Basic'};
        }
        //execute internal process
        fn.call(this, context);
    }

    /**
     * Load application extension
     */
    extend(extension) {
        if (typeof extension === 'undefined')
        {
            //register all application extensions
            const extensionFolder = this.mapPath('/extensions');
            if (fs.existsSync(extensionFolder)) {
                const arr = fs.readdirSync(extensionFolder);
                for (let i = 0; i < arr.length; i++) {
                    if (path.extname(arr[i])=='.js')
                        require(path.join(extensionFolder, arr[i]));
                }
            }
        }
        else {
            //register the specified extension
            if (typeof extension === 'string') {
                const extensionPath = this.mapPath(util.format('/extensions/%s.js', extension));
                if (fs.existsSync(extensionPath)) {
                    //load extension
                    require(extensionPath);
                }
            }
        }
        return this;
    }

    /**
     *
     * @param {*|string} options
     * @param {Function} callback
     */
    executeRequest(options, callback) {
        const opts = { };
        if (typeof options === 'string') {
            util._extend(opts, { url:options });
        }
        else {
            util._extend(opts, options);
        }
        const request = createRequestInternal.call(this,opts), response = createResponseInternal.call(this,request);
        if (!opts.url) {
            callback(new Error('Internal request url cannot be empty at this context.'));
            return;
        }
        if (opts.url.indexOf('/')!=0)
        {
            const uri = url.parse(opts.url);
            opts.host = uri.host;
            opts.hostname = uri.hostname;
            opts.path = uri.path;
            opts.port = uri.port;
            //execute external request
            this.executeExternalRequest(opts,null, callback);
        }
        else {
            //todo::set cookie header (for internal requests)
            /*
             IMPORTANT: set response Content-Length to -1 in order to force the default HTTP response format.
             if the content length is unknown (server response does not have this header)
             in earlier version of node.js <0.11.9 the response contains by default a hexademical number that
             represents the content length. This number appears exactly after response headers and before response body.
             If the content length is defined the operation omits this hexademical value
             e.g. the wrong or custom formatted response
             HTTP 1.1 Status OK
             Content-Type: text/html
             ...
             Connection: keep-alive

             6b8

             <html><body>
             ...
             </body></html>
             e.g. the standard format
             HTTP 1.1 Status OK
             Content-Type: text/html
             ...
             Connection: keep-alive


             <html><body>
             ...
             </body></html>
             */
            response.setHeader('Content-Length',-1);
            handleRequestInternal.call(this, request, response, function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    try {
                        //get statusCode
                        const statusCode = response.statusCode;
                        //get headers
                        const headers = {};
                        if (response._header) {
                            const arr = response._header.split('\r\n');
                            for (let i = 0; i < arr.length; i++) {
                                const header = arr[i];
                                if (header) {
                                    const k = header.indexOf(':');
                                    if (k>0) {
                                        headers[header.substr(0,k)] = header.substr(k+1);
                                    }
                                }
                            }
                        }
                        //get body
                        let body = null;
                        let encoding = null;
                        if (util.isArray(response.output)) {
                            if (response.output.length>0) {
                                body = response.output[0].substr(response._header.length);
                                encoding = response.outputEncodings[0];
                            }
                        }
                        //build result (something like ServerResponse)
                        const result = {
                            statusCode: statusCode,
                            headers: headers,
                            body:body,
                            encoding:encoding
                        };
                        callback(null, result);
                    }
                    catch (e) {
                        callback(e);
                    }
                }
            });
        }
    }

    /**
     *
     * @param {HttpContext} context
     * @param {Error|HttpError} err
     * @param {function()} callback
     */
    onError(context, err, callback) {
        callback = callback || function () { };
        try {
            if (err instanceof Error) {
                //always log error
                TraceUtils.log(err);
                //get response object
                const response = context.response, ejs = require('ejs');
                if (_.isNil(response)) {
                    callback.call(this);
                }
                if (response._headerSent) {
                    callback.call(this);
                    return;
                }
                htmlErrorInternal(context, err, function(err) {
                    if (err) {
                        //send plain text
                        response.writeHead(err.status || 500, {"Content-Type": "text/plain"});
                        //if error is an HTTP Exception
                        if (err instanceof HttpError) {
                            response.write(err.status + ' ' + err.message + "\n");
                        }
                        else {
                            //otherwise send status 500
                            response.write('500 ' + err.message + "\n");
                        }
                        //send extra data (on development)
                        if (process.env.NODE_ENV === 'development') {
                            if (!_.isEmpty(err.innerMessage)) {
                                response.write(err.innerMessage + "\n");
                            }
                            if (!_.isEmpty(err.stack)) {
                                response.write(err.stack + "\n");
                            }
                        }
                    }
                    callback.call(this);
                });


            }
            else {
                callback.call(this);
            }
        }
        catch (e) {
            TraceUtils.log(e);
            if (context.response) {
                context.response.writeHead(500, {"Content-Type": "text/plain"});
                context.response.write("500 Internal Server Error");
                callback.call(this);
            }
        }
    }

    /**
     * @param {*=} options
     * @param {Function=} callback
     */
    start(options, callback) {
        callback = callback || function() { };
        options = options || {};
        if (options.cluster) {
            let clusters = 1;
            //check if options.cluster="auto"
            if (/^auto$/i.test(options.cluster)) {
                clusters = require('os').cpus().length;
            }
            else {
                //get cluster number
                clusters = LangUtils.parseInt(options.cluster);
            }
            if (clusters>1) {
                const cluster = require('cluster');
                if (cluster.isMaster) {
                    //get debug argument (if any)
                    const debug = process.execArgv.filter(function(x) { return /^--debug(-brk)?=\d+$/.test(x); })[0];

                    let debugPort;
                    if (debug) {
                        //get debug port
                        debugPort = parseInt(/^--debug(-brk)?=(\d+)$/.exec(debug)[2]);
                        cluster.setupMaster({
                            execArgv: process.execArgv.filter(function(x) { return !/^--debug(-brk)?=\d+$/.test(x); })
                        });
                    }
                    for (let i = 0; i < clusters; i++) {
                        if (debug) {
                            if (/^--debug-brk=/.test(debug))
                                cluster.settings.execArgv.push('--debug-brk=' + (debugPort + i));
                            else
                                cluster.settings.execArgv.push('--debug=' + (debugPort + i));
                        }
                        cluster.fork();
                        if (debug) cluster.settings.execArgv.pop();
                    }
                } else {
                    startInternal.call(this,options, callback);
                }
            }
            else {
                startInternal.call(this,options, callback);
            }
        }
        else {
            startInternal.call(this,options, callback);
        }
    }

    /**
     * @param {string} name
     * @param {function=} ctor - The class constructor associated with this controller
     * @returns {HttpApplication|function()}
     */
    service(name, ctor) {
        if (typeof ctor === 'undefined')
            return this.module.service(name);
        this.module.service(name, ctor);
        return this;
    }

    /**
     * @param {string} name
     * @param {function} ctor - The class constructor associated with this controller
     * @returns {HttpApplication|function()}
     */
    directive(name, ctor) {
        this.module.directive(name, ctor);
        return this;
    }

    /**
     * Get or sets an HTTP controller
     * @param {string} name
     * @param {Function|*} ctor
     * @returns {*}
     */
    controller(name, ctor) {
        this.config.controllers = this.config.controllers || {};
        let er;
        if (typeof ctor === 'undefined') {
            const c = this.config.controllers[name];
            if (typeof c === 'string') {
                return require(c);
            }
            else if (typeof c === 'function') {
                return c;
            }
            else {
                er =  new Error('Invalid HTTP Controller constructor. Expected string or function.'); er.code='EARG';
                throw er;
            }
        }
        //if ctor is not a function (constructor) throw invalid argument exception
        if (typeof ctor !== 'function') {
            er =  new Error('Invalid HTTP Controller constructor. Expected function.'); er.code='EARG';
            throw er;
        }
        //append controller to application constroller (or override an already existing controller)
        this.config.controllers[name] = ctor;
        return this;
    }
}

/**
 * @type HttpApplication
 * @private
 */
let __current__ = null;

if (typeof global !== 'undefined' && global!=null) {
    if (typeof global.application === 'undefined') {
        //set current application as global property (globals.application)
        Object.defineProperty(global, 'application', {
            get: function () {
                return HttpApplication.current;
            },
            configurable: false,
            enumerable: false
        });
    }
}

Object.defineProperty(HttpApplication, 'current', {
    get: function () {
        if (__current__ != null)
            return __current__;
        //instantiate HTTP application
        __current__ = new HttpApplication();
        //initialize current application
        if (__current__.config == null)
            __current__.init();
        //extend current application
        __current__.extend();
        //and finally return it
        return __current__;
    },
    configurable: false,
    enumerable: false
});