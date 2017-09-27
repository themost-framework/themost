/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import 'source-map-support/register';
import url from 'url';
import _ from 'lodash';
import async from 'async';
import {Args, TraceUtils} from '@themost/common/utils';
import {HttpError, HttpNotFoundError, HttpMethodNotAllowedError} from '@themost/common/errors';
import {HttpNextResult,HttpResult,HttpAnyResult} from './results';
import {AuthConsumer, BasicAuthConsumer, EncryptionStrategy, DefaultEncyptionStrategy, AuthStrategy} from './consumers/auth';
import {RestrictAccessConsumer,RestrictAccessService} from './consumers/restrict_access';
import {HttpConsumer,HttpRouteConsumer,HttpErrorConsumer} from './consumers';
import {StaticContentConsumer, MapStaticContentConsumer} from './consumers/static';
import {HttpContext} from './context';
import {RoutingStrategy,DefaultRoutingStrategy,RouteConsumer} from './consumers/route';
import {LocalizationStrategy,DefaultLocalizationStrategy} from './localization';
import {CacheStrategy,DefaultCacheStrategy} from './cache';
import {DataConfigurationStrategy} from '@themost/data/config';
import Q from 'q';
import path from 'path';
import http from 'http';
import https from 'https';
import {ViewConsumer} from "./consumers/view";
import {FormatterStrategy, DefaultFormatterStrategy} from "./formatters";
import {QuerystringConsumer} from "./consumers/querystring";
import {ModuleLoaderStrategy, ActiveModuleLoaderStrategy} from "@themost/common/config";
import {HttpConfiguration} from "./config";
import {PostContentConsumer} from "./consumers/post";
import {MultipartContentConsumer} from "./consumers/multipart";
import {JsonContentConsumer} from "./consumers/json";

const HTTP_SERVER_DEFAULT_BIND = '127.0.0.1';
const HTTP_SERVER_DEFAULT_PORT = 3000;

/**
 * Starts current application
 * @private
 * @static
 * @param {*} options
 */
function startInternal(options) {
    /**
     * @type {HttpApplication|*}
     */
    const self = this;
    try {
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

        const server_ = http.createServer((request, response) => {
            const context = self.createContext(request, response);
            //begin request processing
            return Q.nbind(processRequestInternal,self)(context).then(()=> {
                context.finalize(function() {
                    if (context.response) { context.response.end(); }
                });
            }).catch((err)=> {
                return Q.nbind(processErrorInternal,self)(context, err).then((res)=> {
                    context.finalize(function() {
                        if (context.response) { context.response.end(); }
                    });
                }).catch((err)=> {
                    //an error occurred while handling request error
                    TraceUtils.error(err);
                    if (context && context.response) {
                        if (err instanceof HttpError) {
                            const statusCode = err.status || 500;
                            //send a text/plain error (and safely end response)
                            context.response.writeHead(statusCode, {"Content-Type": "text/plain"});
                            context.response.write(statusCode + ' ' + err.message + '\n');
                        }
                        else {
                            //send a text/plain error (and safely end response)
                            context.response.writeHead(500, {"Content-Type": "text/plain"});
                            context.response.write('500 Internal Server Error\n');
                        }

                        if (typeof context.finalize === 'function') {
                            context.finalize(function() {
                                if (context.response) { context.response.end(); }
                            });
                        }
                        else {
                            if (context.response) { context.response.end(); }
                        }

                    }
                });
            });
        });
        self[serverProperty] = server_;
        //start listening
        server_.listen(opts.port, opts.bind);
        TraceUtils.log('Web application is running at http://%s:%s/', opts.bind, opts.port);
    } catch (err) {
        TraceUtils.log(err);
    }
}

/**
 * Processes an HTTP request under current application
 * @private
 * @static
 * @param {HttpContext} context
 * @param {Function} callback
 */
function processRequestInternal(context, callback) {
    /**
     * @type {HttpApplication|*}
     */
    const self = this,
        /**
         * @type {Array}
         */
        consumers = context.getApplication()[consumersProperty];

    return async.eachSeries(consumers,
        /**
         * @param {HttpConsumer} consumer
         * @param {Function} cb
         */
        (consumer, cb) => {
            try {
                consumer.run(context).then((result)=> {
                    //if result is an instance of HttpNextResult
                    if (result instanceof HttpNextResult) {
                        //continue series execution (call series callback with no error)
                        return cb();
                    }
                    else if (result instanceof HttpResult) {
                        //continue series execution (call series callback with no error)
                        return cb(result);
                    }
                    //else break series execution and return result
                    return cb(new HttpAnyResult(result));
                }).catch((err)=> {
                    return cb(err);
                });
            }
            catch(err) {
                return cb(err);
            }

        }, (finalRes) => {
            if (_.isNil(finalRes)) {
                //get otherwise consumer
                const otherWiseConsumer = self[otherwiseConsumerProperty];
                if (otherWiseConsumer instanceof HttpConsumer) {
                    if (!_.isFunction(otherWiseConsumer.callable)) {
                        return callback(new ReferenceError('HTTP consumer callable must be a function.'));
                    }
                    return otherWiseConsumer.run(context).then(result=> {
                        if (result instanceof HttpNextResult) {
                            return callback(new HttpNotFoundError());
                        }
                        if (result instanceof HttpResult) {
                            if (typeof finalRes.execute === 'function') {
                                //execute result
                                return finalRes.execute(context).then(() => {
                                    return callback();
                                }).catch((err) => {
                                    return callback(err);
                                });
                            }
                            return callback(null, result);
                        }
                        else {
                            //create an instance of HttpAnyResult class
                            const intermediateRes = new HttpAnyResult(result);
                            return intermediateRes.execute(context).then(() => {
                                callback();
                            }).catch((err) => {
                                return callback(err);
                            });
                        }
                    }).catch((err) => {
                        return callback(err);
                    });
                }
                else {
                    return callback(new HttpNotFoundError());
                }
            }
            ///////////////////////
            //Final Execution
            ///////////////////////
            //handle error
            if (finalRes instanceof Error) {
                return callback(finalRes);
            }
            //handle HttpAnyResult
            else if (finalRes instanceof HttpResult) {
                try {
                    if (typeof finalRes.execute === 'function') {
                        //execute result
                        return finalRes.execute(context).then(() => {
                            return callback();
                        }).catch((err) => {
                            return callback(err);
                        });
                    }
                }
                catch(err) {
                    return callback(err);
                }

                return callback(null, finalRes);
            }
            //throw exception
            return callback(new HttpMethodNotAllowedError());

        });
}


/**
 * Processes HTTP errors under current application
 * @param {HttpContext} context
 * @param {Error|*} error
 * @param {Function} callback
 */
function processErrorInternal(context, error, callback) {
  /**
   * @type {Array}
   */
  const errorConsumers = context.getApplication()[errorConsumersProperty];
    if (errorConsumers.length===0) {
        return callback(error);
    }
    return async.eachSeries(errorConsumers, (consumer, cb) => {
        consumer.callable.call(context, error).then(result=> {
            if (result instanceof HttpNextResult) {
                return cb();
            }
            return cb(result);
        }).catch((err)=> {
            return cb(err);
        });
    }, (err) => {
        return callback(err);
    });
}

/**
 * Creates a mock-up server request
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

const currentProperty = Symbol('current');
const consumersProperty = Symbol('consumers');
const errorConsumersProperty = Symbol('errorConsumers');
const otherwiseConsumerProperty = Symbol('otherwise');
const configProperty = Symbol('config');
const serverProperty = Symbol('server');
const servicesProperty = Symbol('services');
const executionPathProperty = Symbol('executionPath');
const configPathProperty = Symbol('configPath');

/**
 * @classdesc Represents an HTTP server application
 * @class
 */
export class HttpApplication {
    /**
     * @param {string=} executionPath
     * @constructor
     */
    constructor(executionPath) {
        this[consumersProperty] = [];
        this[errorConsumersProperty] = [];
        this[servicesProperty] = {};
        this[executionPathProperty] = _.isNil(executionPath) ? process.cwd() : path.resolve(executionPath);
        const config = new HttpConfiguration(path.join(this[executionPathProperty],'config'));
        config.useStrategy(DataConfigurationStrategy, ()=> {
            return new DataConfigurationStrategy(config);
        });
        if (process.env.NODE_ENV==='development') {
            //load active module watcher strategy
            config.useStrategy(ModuleLoaderStrategy, ActiveModuleLoaderStrategy);
        }
        //change module loader strategy
        this[configProperty] = config;
        //load default consumers
        this.useQuerystring();
    }
    /**
     * @param {string=} executionPath
     * @returns HttpApplication
     */
    static create(executionPath) {
        return new HttpApplication(executionPath);
    }

    /**
     * Gets the execution path of the current HTTP application
     * @returns {string}
     */
    getExecutionPath() {
        return this[executionPathProperty];
    }

    /**
     * Resolves the given path
     * @param {string} arg
     */
    mapExecutionPath(arg) {
        Args.check(_.isString(arg),'Path must be a string');
        return path.resolve(this.getExecutionPath(), arg);
    }

    /**
     * Gets the configuration path of the current HTTP application
     * @returns {string}
     */
    getConfigurationPath() {
        return this[configPathProperty];
    }

    /**
     * @returns {HttpConfiguration}
     */
    getConfiguration() {
        return this[configProperty];
    }

    /**
     *
     * @returns {HttpConfiguration}
     */
    getApplicationConfiguration() {
        return this.getConfiguration().getStrategy(HttpConfiguration);
    }

    getMimeType(extension) {
        return _.find(this.getConfiguration().getSourceAt('mimes'),function(x) {
            return (x.extension===extension) || (x.extension==='.'+extension);
        });
    }

    /**
     * @returns {Server|*}
     */
    getServer() {
        return this[serverProperty];
    }

    /**
     * @param {Function|HttpConsumer} consumer
     * @param {*=} params
     * @returns HttpApplication
     */
    any(consumer, params) {
        if (consumer instanceof HttpConsumer) {
            this[consumersProperty].push(consumer);
        }
        else {
            this[consumersProperty].push(new HttpConsumer(consumer, params));
        }
        return this;
    }

    /**
     * @param {Function} consumerConstructor
     * @returns {boolean}
     */
    hasConsumer(consumerConstructor) {
        if (typeof consumerConstructor !== 'function') {
            return false;
        }
        return _.findIndex(this[consumersProperty],(x)=> {
            return x instanceof consumerConstructor;
        })>=0;
    }

    /**
     * @param {Function|HttpErrorConsumer} consumer
     * @param {*=} params
     * @returns HttpApplication
     */
    error(consumer, params) {
        if (consumer instanceof HttpErrorConsumer) {
            this[errorConsumersProperty].push(consumer);
        }
        else {
            this[errorConsumersProperty].push(new HttpErrorConsumer(consumer, params));
        }
        return this;
    }

    /**
     * @param {string} uri
     * @param {Function|HttpConsumer} consumer
     * @param {*=} params
     * @returns HttpApplication
     */
    when(uri, consumer, params) {
        if (consumer instanceof HttpRouteConsumer) {
            this[consumersProperty].push(consumer);
        }
        else {
            this[consumersProperty].push(new HttpRouteConsumer(uri,consumer, params));
        }
        return this;
    }

    /**
     * @param {Function|HttpConsumer} consumer
     * @param {*=} params
     * @returns HttpApplication
     */
    otherwise(consumer, params) {
        if ((consumer instanceof HttpConsumer) || (consumer instanceof HttpErrorConsumer)) {
            this[otherwiseConsumerProperty] = consumer;
        }
        else {
            this[otherwiseConsumerProperty] = new HttpConsumer(consumer, params);
        }
        return this;
    }

    /**
     * Register a service type in application services
     * @param {Function} serviceCtor
     * @returns HttpApplication
     */
    useService(serviceCtor) {
        Args.notFunction(serviceCtor,"Service constructor");
        this[servicesProperty][`${serviceCtor.name}`] = new serviceCtor(this);
        return this;
    }

    /**
     * Register a service type in application services
     * @param {Function} serviceCtor
     * @param {Function} strategyCtor
     * @returns HttpApplication
     */
    useStrategy(serviceCtor, strategyCtor) {
        Args.notFunction(strategyCtor,"Service constructor");
        Args.notFunction(strategyCtor,"Strategy constructor");
        this[servicesProperty][`${serviceCtor.name}`] = new strategyCtor(this);
        return this;
    }

    /**
     * Register a service type in application services
     * @param {Function} serviceCtor
     */
    getService(serviceCtor) {
        Args.notFunction(serviceCtor,"Service constructor");
        return this[servicesProperty][`${serviceCtor.name}`];
    }

    /**
     * Checks if a service of the given type exists in application services
     * @param {Function} serviceCtor
     * @returns boolean
     */
    hasService(serviceCtor) {
        return this[servicesProperty].hasOwnProperty(`${serviceCtor.name}`);
    }


    /**
     * Enables application default routing strategy
     * @returns {HttpApplication}
     */
    useRoutingStrategy() {
        return this.useStrategy(RoutingStrategy, DefaultRoutingStrategy);
    }

    /**
     * Enables application default routing strategy
     * @returns {HttpApplication}
     */
    useFormatterStrategy() {
        return this.useStrategy(FormatterStrategy, DefaultFormatterStrategy);
    }

    /**
     * Enables application default routing strategy
     * @returns {HttpApplication}
     */
    useCacheStrategy() {
        return this.useStrategy(CacheStrategy, DefaultCacheStrategy);
    }

    /**
     * Enables application default routing strategy
     * @returns {HttpApplication}
     */
    useEncryptionStrategy() {
        return this.useStrategy(EncryptionStrategy, DefaultEncyptionStrategy);
    }

    /**
     * Enables application default localization strategy
     * @returns {HttpApplication}
     */
    useLocalization() {
        return this.useStrategy(LocalizationStrategy, DefaultLocalizationStrategy);
    }

    /**
     * Enables basic authentication
     * @returns {HttpApplication}
     */
    useBasicAuthentication() {
        return this.any(new BasicAuthConsumer());
    }

    /**
     * Enables application authentication
     * @returns {HttpApplication}
     */
    useRestrictAccess() {
        this.useService(RestrictAccessService);
        return this.any(new RestrictAccessConsumer());
    }

    /**
     * Enables application authentication based on the registered authentication strategy
     * @returns {HttpApplication}
     */
    useAuthentication() {
        this.useStrategy(EncryptionStrategy, DefaultEncyptionStrategy);
        return this.any(new AuthConsumer());
    }

    /**
     * Enables static content requests
     * @param {string=} rootDir
     * @returns {HttpApplication}
     */
    useStaticContent(rootDir) {
        return this.any(new StaticContentConsumer(rootDir));
    }

    /**
     * Enables static content requests
     * @returns {HttpApplication}
     */
    useQuerystring() {
        return this.any(new QuerystringConsumer());
    }

    /**
     * Enables HTTP application/x-www-form-urlencoded request processing
     * @returns {HttpApplication}
     */
    usePostContent() {
        return this.any(new PostContentConsumer());
    }

    /**
     * Enables HTTP multipart/form-data request processing
     * @returns {HttpApplication}
     */
    useMultipartContent() {
        return this.any(new MultipartContentConsumer());
    }

    /**
     * Enables HTTP application/json request processing
     * @returns {HttpApplication}
     */
    useJsonContent() {
        return this.any(new JsonContentConsumer());
    }

    /**
     * Enables static content requests
     * @param {string=} whenDir
     * @param {string=} rootDir
     * @returns {HttpApplication}
     */
    mapStaticContent(whenDir, rootDir) {
        return this.any(new MapStaticContentConsumer(whenDir, rootDir));
    }

    /**
     * Enables static content requests
     * @returns {HttpApplication}
     */
    useViewContent() {
        //check if application does not have a service of type RoutingStrategy
        if (!this.hasService(RoutingStrategy))  {
            this.useStrategy(RoutingStrategy, DefaultRoutingStrategy);
        }
        //check if application does not have a consumer of type RouteConsumer
        if (!this.hasConsumer(RouteConsumer))
            //and add it
            this.any(new RouteConsumer());
        //check if application does not have a consumer of type ViewConsumer
        if (!this.hasConsumer(ViewConsumer))
            //and add it
            return this.any(new ViewConsumer());
    }

    /**
     * Starts the current HTTP application.
     * @param {HttpApplicationOptions=} options
     * @return {HttpApplication}
     */
    start(options) {
        startInternal.bind(this)(options);
        return this;
    }

    /**
     * Creates an instance of HttpContext class.
     * @param {ClientRequest} request
     * @param {ServerResponse} response
     * @returns {HttpContext}
     */
    createContext(request, response) {
        return new HttpContext(this, request, response);
    }

    /**
     * @returns {HttpApplication}
     */
    static getCurrent() {
        if (_.isNil(HttpApplication[currentProperty])) {
            HttpApplication[currentProperty] = new HttpApplication();
        }
        return HttpApplication[currentProperty];
    }

    /**
     * Creates a new context and executes the given function
     * @param {Function} fn - A function to execute. The first argument is the current context
     * @returns {Promise}
     */
    execute(fn) {
        const self = this;
        return Q.nfcall(function(callback) {
            //create context
            const request = createRequestInternal.call(self),
                response = createResponseInternal.call(self,request);
            let context = self.createContext(request, response);
            fn(context).then(()=>{
                return callback();
            }).catch((err) => {
                return callback(err);
            });
        });
    }

    /**
     * Creates a new context and executes the given function in unattended mode
     * @param {Function} fn
     * @returns {Promise}
     */
    executeUnattended(fn) {
        const self = this;
        return Q.nfcall(function(callback) {
            //create context
            const request = createRequestInternal.bind(self)(),
                response = createResponseInternal.bind(self)(request);
            let context = self.createContext(request, response);
            //get unattended execution account
            if (this.hasService(AuthStrategy)) {
                const account = this.getService(AuthStrategy).getUnattendedExecutionAccount();
                if (_.isEmpty(account)) {
                    context.user = { name: account, authenticationType: 'Basic'};
                }
            }
            fn(context).then(()=>{
                return callback();
            }).catch((err) => {
                return callback(err);
            });
        });
    }

    /**
     * Executes and external HTTP request
     * @param {string|*} options
     * @param {*} data
     * @returns {Promise}
     */
    executeExternalRequest(options, data) {

        return Q.nfcall(function(callback) {
            //make request
            const https = require('https'),
                opts = (typeof options==='string') ? url.parse(options) : options,
                httpModule = (opts.protocol === 'https:') ? https : http;
            const req = httpModule.request(opts, (res) => {
                res.setEncoding('utf8');
                let data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', () => {
                    return callback(null,
                        { statusCode: res.statusCode,
                            headers: res.headers,
                            body:data,
                            encoding:'utf8'
                        });
                });
            });
            req.on('error', (err)=> {
                //return error
                return callback(err);
            });
            if(data)
            {
                if (typeof data ==="object" )
                    req.write(JSON.stringify(data));
                else
                    req.write(data.toString());
            }
            req.end();
        });


    }

    /**
     * Executes an external or internal HTTP request
     * @param {*|string} options
     * @returns {Promise|*}
     */
    executeRequest(options) {
        const self = this;
        return Q.nbind((callback) => {
            const requestOptions = { };
            if (typeof options === 'string') {
                _.assign(requestOptions, { url:options });
            }
            else {
                _.assign(requestOptions, options);
            }
            if (_.isNil(requestOptions.url)) {
                return callback(new Error('Internal request url cannot be empty at this context.'));
            }
            if (requestOptions.url.indexOf('/')!==0)
            {
                _.assign(requestOptions, url.parse(requestOptions.url));
                //execute external request
                return this.executeExternalRequest(requestOptions,null).then((res)=> {
                    return callback(null, res);
                }).catch((err)=> {
                    return callback(err);
                });
            }
            else {
                //create request and response
                const request = createRequestInternal.bind(this)(requestOptions),
                    response = createResponseInternal.bind(this)(request);
                //set content length header to -1 (for backward compatibility issues)
                response.setHeader('Content-Length',-1);
                //create context
                const requestContext = this.createContext(request, response);
                //and finally process context
                return processRequestInternal.call(self, requestContext, function(err) {
                    if (err) {
                        return callback(err);
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
                            if (_.isArray(response.output)) {
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
                            return callback(null, result);
                        }
                        catch (err) {
                            return callback(err);
                        }
                    }
                });
            }
        },this)();


    }

    /**
     * Returns an express framework middleware.
     * This method may used when @themost application is going to be used alongside with express
     * @returns {Function}
     * @example
     *
     const theApp = new HttpApplication("./test/express/");
     //init application
     theApp.useQuerystring()
         .useFormatterStrategy()
         .useAuthentication()
         .useViewContent();
     const app = express();
     //register application as middleware
     app.use(theApp.runtime());
     //start server
     app.listen(process.env.PORT || 3000);
     */
    runtime() {
        const self = this;
        return function runtimeParser(req, res, next) {
            //create context
            const context = self.createContext(req, res);
            context.request.on('close', () => {
                //client was disconnected abnormally
                if (_.isObject(context)) {
                    context.finalize(function () {
                        if (context.response) {
                            //if response is alive
                            if (context.response.finished === false)
                            //end response
                                context.response.end();
                        }
                    });
                }
            });
            processRequestInternal.bind(self)(context, (err)=> {
                return context.finalize(()=> {
                    //if error is an instance of HttpNotFoundError continue execution
                    if (err instanceof HttpNotFoundError) {
                        return next();
                    }
                    //if error is an instance of HttpError and status is 404 NOT FOUND continue execution
                    else if ((err instanceof HttpError) && err.status === 404) {
                        return next();
                    }
                    //otherwise continue execution with error
                    else if (err) {
                        return next(err);
                    }
                    if (context.response) {
                        context.response.end();
                    }
                });
            });

        };
    }

}