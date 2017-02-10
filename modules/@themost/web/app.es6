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
         *
         * @type {{html, text, json, unauthorized}|*}
         */
        this.errors = httpApplicationErrors(this);

    }

    /**
     * @param {HttpContext} context
     * @param {string} executionPath
     * @param {Function} callback
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
     * Executes an internal process
     * @param {Function} fn
     */
    execute(fn) {
        const request = createRequestInternal.call(this);
        fn.call(this, this.createContext(request, createResponseInternal.call(this,request)));
    }

    /**
     * Executes an unattended internal process
     * @param {Function} fn
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