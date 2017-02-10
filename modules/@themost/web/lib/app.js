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
exports.HttpApplication2 = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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
var AbstractClassError = _errors.AbstractClassError;
var AbstractMethodError = _errors.AbstractMethodError;

var _results = require('./results');

var HttpNextResult = _results.HttpNextResult;
var HttpEndResult = _results.HttpEndResult;
var HttpResult = _results.HttpResult;
var HttpAnyResult = _results.HttpAnyResult;

var _auth = require('./auth');

var AuthConsumer = _auth.AuthConsumer;
var BasicAuthConsumer = _auth.BasicAuthConsumer;
var EncryptionStrategy = _auth.EncryptionStrategy;
var DefaultEncyptionStrategy = _auth.DefaultEncyptionStrategy;

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

var _localization = require('./localization');

var LocalizationStrategy = _localization.LocalizationStrategy;
var DefaultLocalizationStrategy = _localization.DefaultLocalizationStrategy;

var _cache = require('./cache');

var CacheStrategy = _cache.CacheStrategy;
var DefaultCacheStrategy = _cache.DefaultCacheStrategy;

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
     * @type {HttpApplication2|*}
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
            Rx.Observable.fromNodeCallback(processRequestInternal)(context).subscribe(function (result) {
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

                        context.finalize(function () {
                            if (context.response) {
                                context.response.end();
                            }
                        });
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
 * @return {HttpApplication2}
 */
function initInternal() {

    /**
     * @type {HttpApplication2|*}
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
     * @type {HttpApplication2|*}
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
                    } else if (result instanceof HttpResult) {
                        //continue series execution (call series callback with no error)
                        return callback(null, finalRes);
                    }
                    //else break series execution and return result
                    return callback(new HttpAnyResult(result));
                }, function (err) {
                    return callback(err);
                });
            } else {
                return callback(new HttpNotFoundError());
            }
        }
        //if result is an error
        if (finalRes instanceof Error) {
            return callback(finalRes);
        }
        return callback(null, finalRes);
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
     * @type {HttpApplication2|*}
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

var currentProperty = Symbol('current');
var consumersProperty = Symbol('consumers');
var errorConsumersProperty = Symbol('errorConsumers');
var otherwiseConsumerProperty = Symbol('otherwise');
var configProperty = Symbol('config');
var serverProperty = Symbol('server');
var servicesProperty = Symbol('services');

/**
 * @classdesc Represents an HTTP server application
 * @class
 */

var HttpApplication2 = exports.HttpApplication2 = function () {
    /**
     * @constructor
     */
    function HttpApplication2() {
        _classCallCheck(this, HttpApplication2);

        this[consumersProperty] = [];
        this[errorConsumersProperty] = [];
        this[configProperty] = {};
        this[servicesProperty] = {};
        this.executionPath = process.cwd();
    }

    /**
     * @returns {HttpApplicationConfig|*}
     */


    _createClass(HttpApplication2, [{
        key: 'getConfiguration',
        value: function getConfiguration() {
            return this[configProperty];
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
         * @returns HttpApplication2
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
         * @param {Function|HttpErrorConsumer} consumer
         * @param {*=} params
         * @returns HttpApplication2
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
         * @returns HttpApplication2
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
         * @returns HttpApplication2
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
         * @returns {HttpApplication2}
         */

    }, {
        key: 'useRoutingStrategy',
        value: function useRoutingStrategy() {
            return this.useStrategy(RoutingStrategy, DefaultRoutingStrategy);
        }

        /**
         * Enables application default routing strategy
         * @returns {HttpApplication2}
         */

    }, {
        key: 'useCacheStrategy',
        value: function useCacheStrategy() {
            return this.useStrategy(CacheStrategy, DefaultCacheStrategy);
        }

        /**
         * Enables application default routing strategy
         * @returns {HttpApplication2}
         */

    }, {
        key: 'useEncryptionStrategy',
        value: function useEncryptionStrategy() {
            return this.useStrategy(EncryptionStrategy, DefaultEncyptionStrategy);
        }

        /**
         * Enables application default localization strategy
         * @returns {HttpApplication2}
         */

    }, {
        key: 'useLocalization',
        value: function useLocalization() {
            return this.useStrategy(LocalizationStrategy, DefaultLocalizationStrategy);
        }

        /**
         * Enables basic authentication
         * @returns {HttpApplication2}
         */

    }, {
        key: 'useBasicAuthentication',
        value: function useBasicAuthentication() {
            return this.any(new BasicAuthConsumer());
        }

        /**
         * Enables application authentication
         * @returns {HttpApplication2}
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
         * @returns {HttpApplication2}
         */

    }, {
        key: 'useStaticContent',
        value: function useStaticContent(rootDir) {
            return this.any(new StaticContentConsumer(rootDir));
        }

        /**
         * Enables static content requests
         * @param {string=} whenDir
         * @param {string=} rootDir
         * @returns {HttpApplication2}
         */

    }, {
        key: 'whenStaticContent',
        value: function whenStaticContent(whenDir, rootDir) {
            return this.any(new StaticContentConsumer(rootDir, whenDir));
        }

        /**
         * Starts the current HTTP application.
         * @param {HttpApplicationOptions=} options
         * @return {HttpApplication2}
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
         * @returns {HttpApplication2}
         */

    }], [{
        key: 'getCurrent',
        value: function getCurrent() {
            if (_.isNil(HttpApplication2[currentProperty])) {
                HttpApplication2[currentProperty] = new HttpApplication2();
            }
            return HttpApplication2[currentProperty];
        }
    }]);

    return HttpApplication2;
}();
//# sourceMappingURL=app.js.map
