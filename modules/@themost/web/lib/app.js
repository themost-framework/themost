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
exports.HttpApplication = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _url = require('url');

var url = _interopRequireDefault(_url).default;

var _lodash = require('lodash');

var _ = _lodash._;

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _crypto = require('crypto');

var crypto = _interopRequireDefault(_crypto).default;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;
var TraceUtils = _utils.TraceUtils;
var RandomUtils = _utils.RandomUtils;

var _errors = require('@themost/common/errors');

var HttpError = _errors.HttpError;
var HttpNotFoundError = _errors.HttpNotFoundError;
var HttpMethodNotAllowedError = _errors.HttpMethodNotAllowedError;

var _results = require('./results');

var HttpNextResult = _results.HttpNextResult;
var HttpResult = _results.HttpResult;
var HttpAnyResult = _results.HttpAnyResult;

var _auth = require('./auth');

var AuthConsumer = _auth.AuthConsumer;
var BasicAuthConsumer = _auth.BasicAuthConsumer;
var EncryptionStrategy = _auth.EncryptionStrategy;
var DefaultEncyptionStrategy = _auth.DefaultEncyptionStrategy;
var AuthStrategy = _auth.AuthStrategy;

var _restrict_access = require('./restrict_access');

var RestrictAccessConsumer = _restrict_access.RestrictAccessConsumer;
var RestrictAccessService = _restrict_access.RestrictAccessService;

var _consumers = require('./consumers');

var HttpConsumer = _consumers.HttpConsumer;
var HttpRouteConsumer = _consumers.HttpRouteConsumer;
var HttpErrorConsumer = _consumers.HttpErrorConsumer;

var _static = require('./static');

var StaticContentConsumer = _static.StaticContentConsumer;

var _context = require('./context');

var HttpContext = _context.HttpContext;

var _route = require('./route');

var RoutingStrategy = _route.RoutingStrategy;
var DefaultRoutingStrategy = _route.DefaultRoutingStrategy;
var RouteConsumer = _route.RouteConsumer;

var _localization = require('./localization');

var LocalizationStrategy = _localization.LocalizationStrategy;
var DefaultLocalizationStrategy = _localization.DefaultLocalizationStrategy;

var _cache = require('./cache');

var CacheStrategy = _cache.CacheStrategy;
var DefaultCacheStrategy = _cache.DefaultCacheStrategy;

var _data = require('./data');

var DataConfigurationStrategy = _data.DataConfigurationStrategy;
var DefaultDataConfigurationStrategy = _data.DefaultDataConfigurationStrategy;

var _rx = require('rx');

var Rx = _rx.Rx;

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _http = require('http');

var http = _interopRequireDefault(_http).default;

var _https = require('https');

var https = _interopRequireDefault(_https).default;

var _interfaces = require('./interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _view = require('./view');

var ViewConsumer = _view.ViewConsumer;

var _formatters = require('./formatters');

var FormatterStrategy = _formatters.FormatterStrategy;
var DefaultFormatterStrategy = _formatters.DefaultFormatterStrategy;

var _querystring = require('./querystring');

var QuerystringConsumer = _querystring.QuerystringConsumer;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HTTP_SERVER_DEFAULT_BIND = '127.0.0.1';
var HTTP_SERVER_DEFAULT_PORT = 3000;

/**
 * Starts current application
 * @private
 * @static
 * @param {ApplicationOptions|*} options
 */
function startInternal(options) {
    /**
     * @type {HttpApplication|*}
     */
    var self = this;
    try {
        /**
         * @memberof process.env
         * @property {number} PORT
         * @property {string} IP
         * @property {string} NODE_ENV
         */
        var opts = {
            bind: process.env.IP || HTTP_SERVER_DEFAULT_BIND,
            port: process.env.PORT ? process.env.PORT : HTTP_SERVER_DEFAULT_PORT
        };
        //extend options
        _.assign(opts, options);

        var server_ = http.createServer(function (request, response) {
            var context = self.createContext(request, response);
            //begin request processing
            Rx.Observable.fromNodeCallback(processRequestInternal)(context).subscribe(function () {
                context.finalize(function () {
                    if (context.response) {
                        context.response.end();
                    }
                });
            }, function (err) {
                //process error
                Rx.Observable.fromNodeCallback(processErrorInternal)(context, err).subscribe(function (res) {
                    context.finalize(function () {
                        if (context.response) {
                            context.response.end();
                        }
                    });
                }, function (err) {
                    //an error occurred while handling request error
                    TraceUtils.error(err);
                    if (context && context.response) {
                        if (err instanceof HttpError) {
                            var statusCode = err.status || 500;
                            //send a text/plain error (and safely end response)
                            context.response.writeHead(statusCode, { "Content-Type": "text/plain" });
                            context.response.write(statusCode + ' ' + err.message + '\n');
                        } else {
                            //send a text/plain error (and safely end response)
                            context.response.writeHead(500, { "Content-Type": "text/plain" });
                            context.response.write('500 Internal Server Error\n');
                        }

                        if (typeof context.finalize === 'function') {
                            context.finalize(function () {
                                if (context.response) {
                                    context.response.end();
                                }
                            });
                        } else {
                            if (context.response) {
                                context.response.end();
                            }
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
 * Initializes application
 * @private
 * @static
 * @return {HttpApplication}
 */
function initInternal() {

    /**
     * @type {HttpApplication|*}
     */
    var self = this;
    /**
     * Gets or sets application configuration settings
     */
    //get node environment
    var env = process.env['NODE_ENV'] || 'production';

    var str = void 0;
    //first of all try to load environment specific configuration
    try {
        TraceUtils.log('Init: Loading environment specific configuration file (app.%s.json)', env);
        str = path.join(process.cwd(), 'config', 'app.' + env + '.json');
        /**
         * @type {HttpApplicationConfig}
         */
        self[configProperty] = require(str);
        TraceUtils.log('Init: Environment specific configuration file (app.%s.json) was succesfully loaded.', env);
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            TraceUtils.log('Init: Environment specific configuration file (app.%s.json) is missing.', env);
            //try to load default configuration file
            try {
                TraceUtils.log('Init: Loading environment default configuration file (app.json)');
                str = path.join(process.cwd(), 'config', 'app.json');
                /**
                 * @type {HttpApplicationConfig}
                 */
                self.config = require(str);
                TraceUtils.log('Init: Default configuration file (app.json) was succesfully loaded.');
            } catch (err) {
                if (err.code === 'MODULE_NOT_FOUND') {
                    TraceUtils.log('Init: An error occured while loading default configuration (app.json). Configuration cannot be found or is inaccesible.');
                    //load internal configuration file
                    /**
                     * @type {HttpApplicationConfig}
                     */
                    var conf = require('./resources/app.json');
                    conf.settings = conf.settings || {};
                    conf.settings.crypto = {
                        "algorithm": "aes256",
                        "key": RandomUtils.randomHex(32)
                    };
                    this[configProperty] = conf;
                    TraceUtils.log('Init: Internal configuration file (app.json) was succesfully loaded.');
                } else {
                    TraceUtils.log('Init: An error occured while loading default configuration (app.json)');
                    throw err;
                }
            }
        } else {
            TraceUtils.log('Init: An error occured while loading application specific configuration (app).', env);
            throw err;
        }
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
    var self = this,

    /**
     * @type {Array}
     */
    consumers = context.getApplication()[consumersProperty];

    return async.eachSeries(consumers,
    /**
     * @param {HttpConsumer} consumer
     * @param {Function} cb
     */
    function (consumer, cb) {
        consumer.callable.apply(context).subscribe(function (result) {
            //if result is an instance of HttpNextResult
            if (result instanceof HttpNextResult) {
                //continue series execution (call series callback with no error)
                return cb();
            } else if (result instanceof HttpResult) {
                //continue series execution (call series callback with no error)
                return cb(result);
            }
            //else break series execution and return result
            return cb(new HttpAnyResult(result));
        }, function (err) {
            return cb(err);
        });
    }, function (finalRes) {
        if (_.isNil(finalRes)) {
            //get otherwise consumer
            var otherWiseConsumer = self[otherwiseConsumerProperty];
            if (otherWiseConsumer instanceof HttpConsumer) {
                if (!_.isFunction(otherWiseConsumer.callable)) {
                    return callback(new ReferenceError('HTTP consumer callable must be a function.'));
                }
                return otherWiseConsumer.callable.apply(context).subscribe(function (result) {
                    if (result instanceof HttpNextResult) {
                        return callback(new HttpNotFoundError());
                    }
                    if (result instanceof HttpResult) {
                        if (typeof finalRes.execute === 'function') {
                            //execute result
                            return finalRes.execute(context).subscribe(function () {
                                return callback();
                            }, function (err) {
                                return callback(err);
                            });
                        }
                        return callback(null, result);
                    } else {
                        //create an instance of HttpAnyResult class
                        var intermediateRes = new HttpAnyResult(result);
                        return intermediateRes.execute(context).subscribe(function () {
                            callback();
                        }, function (err) {
                            return callback(err);
                        });
                    }
                }, function (err) {
                    return callback(err);
                });
            } else {
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
                if (typeof finalRes.execute === 'function') {
                    //execute result
                    return finalRes.execute(context).subscribe(function () {
                        return callback();
                    }, function (err) {
                        return callback(err);
                    });
                }
                return callback(null, result);
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
     * @type {HttpApplication|*}
     */
    var self = this,

    /**
     * @type {Array}
     */
    errorConsumers = context.getApplication()[errorConsumersProperty];
    if (errorConsumers.length == 0) {
        return callback(error);
    }
    return async.eachSeries(errorConsumers, function (consumer, cb) {
        consumer.callable.call(context, error).subscribe(function (result) {
            if (result instanceof HttpNextResult) {
                return cb();
            }
            return cb(result);
        }, function (err) {
            return cb(err);
        });
    }, function (err) {
        return callback(err);
    });
}

/**
 * Creates a mock-up server request
 * @private
 * @param {*} options
 */
function createRequestInternal(options) {
    var opt = options ? options : {};
    var request = new http.IncomingMessage();
    request.method = opt.method ? opt.method : 'GET';
    request.url = opt.url ? opt.url : '/';
    request.httpVersion = '1.1';
    request.headers = opt.headers ? opt.headers : {
        host: 'localhost',
        'user-agent': 'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/22.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'accept-encoding': 'gzip, deflate',
        connection: 'keep-alive',
        'cache-control': 'max-age=0' };
    if (opt.cookie) request.headers.cookie = opt.cookie;
    request.cookies = opt.cookies ? opt.cookies : {};
    request.session = opt.session ? opt.session : {};
    request.params = opt.params ? opt.params : {};
    request.query = opt.query ? opt.query : {};
    request.form = opt.form ? opt.form : {};
    request.body = opt.body ? opt.body : {};
    request.files = opt.files ? opt.files : {};
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

var currentProperty = Symbol('current');
var consumersProperty = Symbol('consumers');
var errorConsumersProperty = Symbol('errorConsumers');
var otherwiseConsumerProperty = Symbol('otherwise');
var configProperty = Symbol('config');
var serverProperty = Symbol('server');
var servicesProperty = Symbol('services');
var executionPathProperty = Symbol('executionPath');
var configPathProperty = Symbol('configPath');

/**
 * @classdesc Represents an HTTP server application
 * @class
 */

var HttpApplication = exports.HttpApplication = function () {
    /**
     * @constructor
     */
    function HttpApplication() {
        _classCallCheck(this, HttpApplication);

        this[consumersProperty] = [];
        this[errorConsumersProperty] = [];
        this[servicesProperty] = {};
        this[executionPathProperty] = process.cwd();
        this[configPathProperty] = path.join(process.cwd(), 'config');
        this.useStrategy(DataConfigurationStrategy, DefaultDataConfigurationStrategy);
    }

    /**
     * Sets the execution path of the current HTTP application
     * @param {string} executionPath
     * @return {HttpApplication}
     */


    _createClass(HttpApplication, [{
        key: 'setExecutionPath',
        value: function setExecutionPath(executionPath) {
            Args.notEmpty(executionPath, 'Execution Path');
            this[executionPathProperty] = path.resolve(process.cwd(), executionPath);
            this[configPathProperty] = path.join(this[executionPathProperty], 'config');
            return this;
        }

        /**
         * Gets the execution path of the current HTTP application
         * @returns {string}
         */

    }, {
        key: 'getExecutionPath',
        value: function getExecutionPath() {
            return this[executionPathProperty];
        }

        /**
         * Resolves the given path
         * @param {string} arg
         */

    }, {
        key: 'mapExecutionPath',
        value: function mapExecutionPath(arg) {
            Args.check(_.isString(arg), 'Path must be a string');
            return path.resolve(this.getExecutionPath(), arg);
        }

        /**
         * Gets the configuration path of the current HTTP application
         * @returns {string}
         */

    }, {
        key: 'getConfigurationPath',
        value: function getConfigurationPath() {
            return this[configPathProperty];
        }

        /**
         * @returns {HttpApplicationConfig|*}
         */

    }, {
        key: 'getConfiguration',
        value: function getConfiguration() {
            if (typeof this[configProperty] === 'undefined') {
                //load configuration
                try {
                    var env = process.env['NODE_ENV'] || 'production';
                    this[configProperty] = require(path.join(this[configPathProperty], 'app.' + env + '.json'));
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.warn('Data: The environment specific configuration cannot be found or is inaccesible.');
                        try {
                            this[configProperty] = require(path.join(this[configPathProperty], 'app.json'));
                        } catch (err) {
                            if (err.code === 'MODULE_NOT_FOUND') {
                                TraceUtils.warn('Data: The default application configuration cannot be found or is inaccesible.');
                            } else {
                                TraceUtils.error('Data: An error occured while trying to open default application configuration.');
                                TraceUtils.error(err);
                            }
                            this[configProperty] = require('./resources/app.json');
                        }
                    } else {
                        TraceUtils.error('Data: An error occured while trying to open application configuration.');
                        TraceUtils.error(err);
                        this[configProperty] = require('./resources/app.json');
                    }
                }
                try {
                    this[configProperty].routes = require(path.join(this[configPathProperty], 'routes.json'));
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.warn('Data: Route configuration cannot be found or is inaccesible.');
                        this[configProperty].routes = require('./resources/routes.json');
                    } else {
                        TraceUtils.error('Data: An error occured while trying to open route configuration.');
                        TraceUtils.error(err);
                        this[configProperty].routes = require('./resources/routes.json');
                    }
                }
            }
            return this[configProperty];
        }
    }, {
        key: 'getMimeType',
        value: function getMimeType(extension) {
            return _.find(this.getConfiguration().mimes, function (x) {
                return x.extension === extension || x.extension === '.' + extension;
            });
        }

        /**
         * @returns {Server|*}
         */

    }, {
        key: 'getServer',
        value: function getServer() {
            return this[serverProperty];
        }

        /**
         * @param {Function|HttpConsumer} consumer
         * @param {*=} params
         * @returns HttpApplication
         */

    }, {
        key: 'any',
        value: function any(consumer, params) {
            if (consumer instanceof HttpConsumer) {
                this[consumersProperty].push(consumer);
            } else {
                this[consumersProperty].push(new HttpConsumer(consumer, params));
            }
            return this;
        }

        /**
         * @param {Function} consumerConstructor
         * @returns {boolean}
         */

    }, {
        key: 'hasConsumer',
        value: function hasConsumer(consumerConstructor) {
            if (typeof consumerConstructor !== 'function') {
                return false;
            }
            return _.findIndex(this[consumersProperty], function (x) {
                return x instanceof consumerConstructor;
            }) >= 0;
        }

        /**
         * @param {Function|HttpErrorConsumer} consumer
         * @param {*=} params
         * @returns HttpApplication
         */

    }, {
        key: 'error',
        value: function error(consumer, params) {
            if (consumer instanceof HttpErrorConsumer) {
                this[errorConsumersProperty].push(consumer);
            } else {
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

    }, {
        key: 'when',
        value: function when(uri, consumer, params) {
            if (consumer instanceof HttpRouteConsumer) {
                this[consumersProperty].push(consumer);
            } else {
                this[consumersProperty].push(new HttpRouteConsumer(uri, consumer, params));
            }
            return this;
        }

        /**
         * @param {Function|HttpConsumer} consumer
         * @param {*=} params
         * @returns HttpApplication
         */

    }, {
        key: 'otherwise',
        value: function otherwise(consumer, params) {
            if (consumer instanceof HttpConsumer || consumer instanceof HttpErrorConsumer) {
                this[otherwiseConsumerProperty] = consumer;
            } else {
                this[otherwiseConsumerProperty] = new HttpConsumer(consumer, params);
            }
            return this;
        }

        /**
         * Register a service type in application services
         * @param {Function} serviceCtor
         */

    }, {
        key: 'useService',
        value: function useService(serviceCtor) {
            Args.notFunction(serviceCtor, "Service constructor");
            this[servicesProperty]['' + serviceCtor.name] = new serviceCtor(this);
        }

        /**
         * Register a service type in application services
         * @param {Function} serviceCtor
         * @param {Function} strategyCtor
         */

    }, {
        key: 'useStrategy',
        value: function useStrategy(serviceCtor, strategyCtor) {
            Args.notFunction(strategyCtor, "Service constructor");
            Args.notFunction(strategyCtor, "Strategy constructor");
            this[servicesProperty]['' + serviceCtor.name] = new strategyCtor(this);
            return this;
        }

        /**
         * Register a service type in application services
         * @param {Function} serviceCtor
         */

    }, {
        key: 'getService',
        value: function getService(serviceCtor) {
            Args.notFunction(serviceCtor, "Service constructor");
            return this[servicesProperty]['' + serviceCtor.name];
        }

        /**
         * Checks if a service of the given type exists in application services
         * @param {Function} serviceCtor
         * @returns boolean
         */

    }, {
        key: 'hasService',
        value: function hasService(serviceCtor) {
            return this[servicesProperty].hasOwnProperty('' + serviceCtor.name);
        }

        /**
         * Enables application default routing strategy
         * @returns {HttpApplication}
         */

    }, {
        key: 'useRoutingStrategy',
        value: function useRoutingStrategy() {
            return this.useStrategy(RoutingStrategy, DefaultRoutingStrategy);
        }

        /**
         * Enables application default routing strategy
         * @returns {HttpApplication}
         */

    }, {
        key: 'useFormatterStrategy',
        value: function useFormatterStrategy() {
            return this.useStrategy(FormatterStrategy, DefaultFormatterStrategy);
        }

        /**
         * Enables application default routing strategy
         * @returns {HttpApplication}
         */

    }, {
        key: 'useCacheStrategy',
        value: function useCacheStrategy() {
            return this.useStrategy(CacheStrategy, DefaultCacheStrategy);
        }

        /**
         * Enables application default routing strategy
         * @returns {HttpApplication}
         */

    }, {
        key: 'useEncryptionStrategy',
        value: function useEncryptionStrategy() {
            return this.useStrategy(EncryptionStrategy, DefaultEncyptionStrategy);
        }

        /**
         * Enables application default localization strategy
         * @returns {HttpApplication}
         */

    }, {
        key: 'useLocalization',
        value: function useLocalization() {
            return this.useStrategy(LocalizationStrategy, DefaultLocalizationStrategy);
        }

        /**
         * Enables basic authentication
         * @returns {HttpApplication}
         */

    }, {
        key: 'useBasicAuthentication',
        value: function useBasicAuthentication() {
            return this.any(new BasicAuthConsumer());
        }

        /**
         * Enables application authentication
         * @returns {HttpApplication}
         */

    }, {
        key: 'useRestrictAccess',
        value: function useRestrictAccess() {
            this.useService(RestrictAccessService);
            return this.any(new RestrictAccessConsumer());
        }

        /**
         * Enables application authentication
         */

    }, {
        key: 'useAuthentication',
        value: function useAuthentication() {
            this.useStrategy(EncryptionStrategy, DefaultEncyptionStrategy);
            return this.any(new AuthConsumer());
        }

        /**
         * Enables static content requests
         * @param {string=} rootDir
         * @returns {HttpApplication}
         */

    }, {
        key: 'useStaticContent',
        value: function useStaticContent(rootDir) {
            return this.any(new StaticContentConsumer(rootDir));
        }

        /**
         * Enables static content requests
         * @returns {HttpApplication}
         */

    }, {
        key: 'useQuerystring',
        value: function useQuerystring() {
            return this.any(new QuerystringConsumer());
        }

        /**
         * Enables static content requests
         * @param {string=} whenDir
         * @param {string=} rootDir
         * @returns {HttpApplication}
         */

    }, {
        key: 'whenStaticContent',
        value: function whenStaticContent(whenDir, rootDir) {
            return this.any(new StaticContentConsumer(rootDir, whenDir));
        }

        /**
         * Enables static content requests
         * @returns {HttpApplication}
         */

    }, {
        key: 'useViewContent',
        value: function useViewContent() {
            //check if application does not have a service of type RoutingStrategy
            if (!this.hasService(RoutingStrategy)) {
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

    }, {
        key: 'start',
        value: function start(options) {
            initInternal.call(this);
            startInternal.call(this);
            return this;
        }

        /**
         * Creates an instance of HttpContext class.
         * @param {ClientRequest} request
         * @param {ServerResponse} response
         * @returns {HttpContext}
         */

    }, {
        key: 'createContext',
        value: function createContext(request, response) {
            return new HttpContext(this, request, response);
        }

        /**
         * @returns {HttpApplication}
         */

    }, {
        key: 'execute',


        /**
         * Creates a new context and executes the given function
         * @param {Function} fn - A function to execute. The first argument is the current context
         * @returns {Observable}
         */
        value: function execute(fn) {
            var self = this;
            return Rx.Observable.fromNodeCallback(function (callback) {
                //create context
                var request = createRequestInternal.call(self),
                    response = createResponseInternal.call(self, request);
                var context = self.createContext(request, response);
                fn(context).subscribe(function () {
                    return callback();
                }, function (err) {
                    return callback(err);
                });
            });
        }

        /**
         * Creates a new context and executes the given function in unattended mode
         * @param {Function} fn
         * @returns {Observable}
         */

    }, {
        key: 'executeUnattended',
        value: function executeUnattended(fn) {
            var self = this;
            return Rx.Observable.fromNodeCallback(function (callback) {
                //create context
                var request = createRequestInternal.call(self),
                    response = createResponseInternal.call(self, request);
                var context = self.createContext(request, response);
                //get unattended execution account
                if (this.hasService(AuthStrategy)) {
                    var account = this.getService(AuthStrategy).getUnattendedExecutionAccount();
                    if (_.isEmpty(account)) {
                        context.user = { name: account, authenticationType: 'Basic' };
                    }
                }
                fn(context).subscribe(function () {
                    return callback();
                }, function (err) {
                    return callback(err);
                });
            });
        }

        /**
         * Executes and external HTTP request
         * @param {string|*} options
         * @param {*} data
         * @returns {Observable}
         */

    }, {
        key: 'executeExternalRequest',
        value: function executeExternalRequest(options, data) {

            return Rx.Observable.fromNodeCallback(function (callback) {
                //make request
                var https = require('https'),
                    opts = typeof options === 'string' ? url.parse(options) : options,
                    httpModule = opts.protocol === 'https:' ? https : http;
                var req = httpModule.request(opts, function (res) {
                    res.setEncoding('utf8');
                    var data = '';
                    res.on('data', function (chunk) {
                        data += chunk;
                    });
                    res.on('end', function () {
                        return callback(null, { statusCode: res.statusCode,
                            headers: res.headers,
                            body: data,
                            encoding: 'utf8'
                        });
                    });
                });
                req.on('error', function (err) {
                    //return error
                    return callback(err);
                });
                if (data) {
                    if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === "object") req.write(JSON.stringify(data));else req.write(data.toString());
                }
                req.end();
            })();
        }

        /**
         * Executes an external or internal HTTP request
         * @param {*|string} options
         * @returns {Observable}
         */

    }, {
        key: 'executeRequest',
        value: function executeRequest(options) {
            return Rx.Observable.fromNodeCallback(function (callback) {
                var _this = this;

                var requestOptions = {};
                if (typeof options === 'string') {
                    _.assign(requestOptions, { url: options });
                } else {
                    _.assign(requestOptions, options);
                }
                if (_.isNil(requestOptions.url)) {
                    return callback(new Error('Internal request url cannot be empty at this context.'));
                }
                if (requestOptions.url.indexOf('/') != 0) {
                    _.assign(requestOptions, url.parse(requestOptions.url));
                    //execute external request
                    return this.executeExternalRequest(requestOptions, null).subscribe(function (res) {
                        return callback(null, res);
                    }, function (err) {
                        return callback(err);
                    });
                } else {
                    var _ret = function () {
                        //create request and response
                        var request = createRequestInternal.call(_this, requestOptions),
                            response = createResponseInternal.call(_this, request);
                        //set content length header to -1 (for backward compatibility issues)
                        response.setHeader('Content-Length', -1);
                        //create context
                        var requestContext = _this.createContext(request, response);
                        //and finally process context
                        return {
                            v: processRequestInternal.call(_this, requestContext, function (err) {
                                if (err) {
                                    return callback(err);
                                } else {
                                    try {
                                        //get statusCode
                                        var statusCode = response.statusCode;
                                        //get headers
                                        var headers = {};
                                        if (response._header) {
                                            var arr = response._header.split('\r\n');
                                            for (var i = 0; i < arr.length; i++) {
                                                var header = arr[i];
                                                if (header) {
                                                    var k = header.indexOf(':');
                                                    if (k > 0) {
                                                        headers[header.substr(0, k)] = header.substr(k + 1);
                                                    }
                                                }
                                            }
                                        }
                                        //get body
                                        var body = null;
                                        var encoding = null;
                                        if (_.isArray(response.output)) {
                                            if (response.output.length > 0) {
                                                body = response.output[0].substr(response._header.length);
                                                encoding = response.outputEncodings[0];
                                            }
                                        }
                                        //build result (something like ServerResponse)
                                        var _result = {
                                            statusCode: statusCode,
                                            headers: headers,
                                            body: body,
                                            encoding: encoding
                                        };
                                        return callback(null, _result);
                                    } catch (err) {
                                        return callback(err);
                                    }
                                }
                            })
                        };
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                }
            }, this)();
        }
    }], [{
        key: 'getCurrent',
        value: function getCurrent() {
            if (_.isNil(HttpApplication[currentProperty])) {
                HttpApplication[currentProperty] = new HttpApplication();
            }
            return HttpApplication[currentProperty];
        }
    }]);

    return HttpApplication;
}();
//# sourceMappingURL=app.js.map
