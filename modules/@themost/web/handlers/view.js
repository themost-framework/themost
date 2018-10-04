/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

var url = require('url');
var sprintf = require('sprintf').sprintf;
var async = require('async');
var fs = require('fs');
var route = require('../http-route');
var LangUtils = require('@themost/common/utils').LangUtils;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var HttpError = require('@themost/common/errors').HttpError;
var path = require('path');
var _ = require('lodash');
var HttpConsumer = require('../consumers').HttpConsumer;
var HttpResult = require('../mvc').HttpResult;
var Q = require('q');
var accepts = require('accepts');

var STR_CONTROLLER_FILE = './%s-controller.js';
var STR_CONTROLLER_RELPATH = '/controllers/%s-controller.js';


function interopRequireDefault(path) {
    var obj = require(path);
    return obj && obj.__esModule ? obj['default'] : obj;
}

if (process.execArgv.indexOf('ts-node/register')>=0) {
    //change controller resolution to typescript
    STR_CONTROLLER_FILE = './%s-controller.ts';
    STR_CONTROLLER_RELPATH = '/controllers/%s-controller.ts';
}

/**
 *
 * @param s
 * @returns {*}
 * @private
 */
function _dasherize(s) {
    if (_.isString(s))
        return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
    return s;
}


/**
 * @method dasherize
 * @memberOf _
 */

if (typeof _.dasherize !== 'function') {
    _.mixin({'dasherize' : _dasherize});
}

function _isPromise(f) {
    if (typeof f !== 'object') {
        return false;
    }
    return (typeof f.then === 'function') && (typeof f.catch === 'function');
}

/**
 * @method isPromise
 * @memberOf _
 */
if (typeof _.isPromise !== 'function') {
    _.mixin({'isPromise' : _isPromise});
}


/**
 * @class
 * @constructor
 * @implements AuthorizeRequestHandler
 * @implements MapRequestHandler
 * @implements PostMapRequestHandler
 * @implements ProcessRequestHandler
 */
function ViewHandler() {
    //
}
/**
 *
 * @param ctor
 * @param superCtor
 */
Object.inherits = function (ctor, superCtor) {
    if (!ctor.super_) {
        ctor.super_ = superCtor;
        while (superCtor) {
            var superProto = superCtor.prototype;
            var keys = Object.keys(superProto);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (typeof ctor.prototype[key] === 'undefined')
                    ctor.prototype[key] = superProto[key];
            }
            superCtor = superCtor.super_;
        }
    }
};

/**
 *
 * @param {string} controllerName
 * @param {HttpContext} context
 * @param {Function} callback
 */
ViewHandler.queryControllerClass = function(controllerName, context, callback) {

    if (typeof controllerName === 'undefined' || controllerName===null) {
        callback();
    }
    else {
        //get controller class path and model (if any)
        var controllerPath = context.getApplication().mapPath(sprintf(STR_CONTROLLER_RELPATH, _.dasherize(controllerName))),
            controllerModel = context.model(controllerName);
        //if controller does not exists
        fs.exists(controllerPath, function(exists){
            try {
                //if controller class file does not exist in /controllers/ folder
                if (!exists) {
                    //try to find if current controller has a model defined
                    if (controllerModel) {
                        var controllerType = controllerModel.type || 'data';
                        if (controllerModel.hidden || controllerModel.abstract) {
                            controllerType = 'hidden';
                        }
                        //try to find controller based on the model's type in controllers folder (e.g. /library-controller.js)
                        controllerPath = context.getApplication().mapPath(sprintf(STR_CONTROLLER_RELPATH, controllerType));
                        fs.exists(controllerPath, function(exists) {
                           if (!exists) {
                               //get controller path according to related model's type (e.g ./data-controller)
                               controllerPath = sprintf(STR_CONTROLLER_FILE, controllerType);
                               //if controller does not exist
                               controllerPath = path.join(__dirname, controllerPath);
                               fs.exists(controllerPath, function(exists) {
                                   if (!exists)
                                       callback(null, interopRequireDefault('../controllers/base'));
                                   else
                                       callback(null, interopRequireDefault(controllerPath));
                               });
                           }
                           else {
                               callback(null, interopRequireDefault(controllerPath));
                           }
                        });
                    }
                    else {
                        var ControllerCtor = context.getApplication().getConfiguration().controllers[controllerName] || interopRequireDefault('../controllers/base');
                        callback(null, ControllerCtor);
                    }
                }
                else {
                    //return controller class
                    callback(null, interopRequireDefault(controllerPath));
                }
            }
            catch (err) {
                callback(err);
            }
        });
    }
};

ViewHandler.RestrictedLocations = [
    { "path":"^/controllers/", "description":"Most web framework server controllers" },
    { "path":"^/models/", "description":"Most web framework server models" },
    { "path":"^/extensions/", "description":"Most web framework server extensions" },
    { "path":"^/handlers/", "description":"Most web framework server handlers" },
    { "path":"^/views/", "description":"Most web framework server views" }
];

ViewHandler.prototype.authorizeRequest = function (context, callback) {
    try {
        var uri = url.parse(context.request.url);
        for (var i = 0; i < ViewHandler.RestrictedLocations.length; i++) {
            /**
             * @type {*|LocationSetting}
             */
            var location = ViewHandler.RestrictedLocations[i],
                /**
                 * @type {RegExp}
                 */
                re = new RegExp(location.path,'ig');
            if (re.test(uri.pathname)) {
                callback(new HttpError(403, 'Forbidden'));
                return;
            }
        }
        callback();
    }
    catch(e) {
        callback(e);
    }
};
/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
ViewHandler.validateMediaType = function(context, callback) {
    if (typeof context === 'undefined' || context === null) {
        return callback();
    }
    //validate mime type and route format
    let accept = accepts(context.request);
    if (context.request.route && context.request.route.format) {
        if (accept.type(context.request.route.format)) {
            return callback();
        }
        return callback(new HttpError(415));
    }
    return callback();
};

/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
ViewHandler.prototype.mapRequest = function (context, callback) {
    callback = callback || function () { };
    //try to map request
    try {
        //first of all check if a request handler is already defined
        if (typeof context.request.currentHandler !== 'undefined') {
            //do nothing (exit mapping)
            return callback();
        }
        var requestUri = url.parse(context.request.url);
        /**
         * find route by querying application routes
         * @type {HttpRoute}
         */
        var currentRoute = queryRoute(requestUri, context);
        if (typeof currentRoute === 'undefined' || currentRoute === null) {
            return callback();
        }
        //query controller
        var controllerName = currentRoute["controller"] || currentRoute.routeData["controller"] || queryController(requestUri);
        if (typeof controllerName === 'undefined' || controllerName === null) {
            return callback();
        }
        //try to find controller class
        ViewHandler.queryControllerClass(controllerName, context, function(err, ControllerClass) {
            if (err) {
                return callback(err);
            }
            try {
                //initialize controller
                var controller = new ControllerClass();
                //set controller's name
                controller.name = controllerName.toLowerCase();
                //set controller's context
                controller.context = context;
                //set request handler
                var handler = new ViewHandler();
                handler.controller = controller;
                context.request.currentHandler = handler;
                //set route data
                context.request.route = _.assign({ },currentRoute.route);
                context.request.routeData = currentRoute.routeData;
                //set route data as params
                for(var prop in currentRoute.routeData) {
                    if (currentRoute.routeData.hasOwnProperty(prop)) {
                        context.params[prop] = currentRoute.routeData[prop];
                    }
                }
                return ViewHandler.validateMediaType(context, function(err) {
                   return callback(err);
                });
            }
            catch(err) {
                return callback(err);
            }
        });

    }
    catch (e) {
        callback(e);
    }

};
/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
ViewHandler.prototype.postMapRequest = function (context, callback) {
    try {
        ViewHandler.prototype.preflightRequest.call(this, context, function(err) {
            if (err) { return callback(err); }
            var obj;
            if (context.is('POST')) {
                if (context.format==='json') {
                    if (typeof context.request.body === 'string') {
                        //parse json data
                        try {
                            obj = JSON.parse(context.request.body);
                            //set context data
                            context.params.data = obj;
                        }
                        catch(err) {
                            TraceUtils.log(err);
                            return callback(new Error('Invalid JSON data.'));
                        }
                    }
                }
            }
            return callback();
        });
    }
    catch(e) {
        callback(e);
    }
};
ViewHandler.prototype.preflightRequest = function (context, callback) {
    try {
        if (context && (context.request.currentHandler instanceof ViewHandler)) {
            //set the default origin (with wildcard)
            var allowCredentials = true,
                allowOrigin="*",
                allowHeaders = "Origin, X-Requested-With, Content-Type, Content-Language, Accept, Accept-Language, Authorization",
                allowMethods = "GET, OPTIONS, PUT, POST, PATCH, DELETE";
            /**
             * @private
             * @type {{allowOrigin:string,allowHeaders:string,allowCredentials:Boolean,allowMethods:string,allow:string}|*}
             */
            var route = context.request.route;
            if (route) {
                if (typeof route.allowOrigin !== 'undefined')
                    allowOrigin = route.allowOrigin;
                if (typeof route.allowHeaders !== 'undefined')
                    allowHeaders = route.allowHeaders;
                if (typeof route.allowCredentials !== 'undefined')
                    allowCredentials = route.allowCredentials;
                if ((typeof route.allowMethods !== 'undefined') || (typeof route.allow !== 'undefined'))
                    allowMethods = route.allow || route.allowMethods;
            }
            //ensure header names
            var headerNames = context.response["_headerNames"] || { };
            //1. Access-Control-Allow-Origin
            if (typeof headerNames["access-control-allow-origin"] === 'undefined') {
                //if request contains origin header
                if (context.request.headers.origin) {
                    if (allowOrigin === "*") {
                        //set access-control-allow-origin header equal to request origin header
                        context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                    }
                    else if (allowOrigin.indexOf(context.request.headers.origin)>-1) {
                        context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                    }
                }
                else {
                    //set access-control-allow-origin header equal to the predefined origin header
                    context.response.setHeader("Access-Control-Allow-Origin", "*");
                }
            }
            //2. Access-Control-Allow-Origin
            if (typeof headerNames["access-control-allow-credentials"] === 'undefined') {
                context.response.setHeader("Access-Control-Allow-Credentials", allowCredentials);
            }

            //3. Access-Control-Allow-Headers
            if (typeof headerNames["access-control-allow-headers"] === 'undefined') {
                context.response.setHeader("Access-Control-Allow-Headers", allowHeaders);
            }

            //4. Access-Control-Allow-Methods
            if (typeof headerNames["access-control-allow-methods"] === 'undefined') {
                context.response.setHeader("Access-Control-Allow-Methods", allowMethods);
            }
        }
        if (typeof callback === 'undefined') { return; }
        return callback();
    }
    catch(e) {
        if (typeof callback === 'undefined') { throw e; }
        callback(e);
    }

};
/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
ViewHandler.prototype.processRequest = function (context, callback) {
    var self = this;
    callback = callback || function () { };
    try {
        if (context.is('OPTIONS')) {
            //do nothing
            return callback();
        }
        //validate request controller
        var controller = self.controller;
        if (controller) {
            /**
             * try to find action
             * @type {String}
             */
            var action = context.request.routeData["action"];
            if (action) {
                //execute action
                var fn, useHttpMethodNamingConvention = false;
                if (controller.constructor['httpController']) {
                    fn = queryControllerAction(controller, action);
                    if (typeof fn === 'function') {
                        useHttpMethodNamingConvention = true;
                    }
                }
                else {
                    fn = controller[action];
                    if (typeof fn !== 'function') {
                        fn = controller[_.camelCase(action)];
                    }
                }
                if (typeof fn !== 'function') {
                    fn = controller.action;
                }
                //enumerate params
                var functionParams = LangUtils.getFunctionParams(fn), params =[];
                if (functionParams.length>0) {
                    if (!useHttpMethodNamingConvention) {
                        //remove last parameter (the traditional callback function)
                        functionParams.pop();
                    }
                }
                //execute action handler decorators
                var actionConsumers = _.filter(_.keys(fn), function(x) {
                    return (fn[x] instanceof HttpConsumer);
                });
                return async.eachSeries(actionConsumers, function(actionConsumer, cb) {
                    try {
                        var source = fn[actionConsumer].run(context);
                        if (!_.isPromise(source)) {
                            return cb(new Error("Invalid type. Action consumer result must be a promise."));
                        }
                        return source.then(function() {
                            return cb();
                        }).catch(function(err) {
                            return cb(err);
                        });
                    }
                    catch(err) {
                        return cb(err);
                    }
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    try {
                        if (functionParams.length>0) {
                            var k = 0;
                            while (k < functionParams.length) {
                                if (typeof context.getParam === 'function') {
                                    params.push(context.getParam(functionParams[k]));
                                }
                                else {
                                    params.push(context.params[functionParams[k]]);
                                }
                                k+=1;
                            }
                        }
                        if (useHttpMethodNamingConvention) {
                            var source = fn.apply(controller, params);
                            //if action result is an instance of HttpResult
                            if (source instanceof HttpResult) {
                                //execute http result
                                return source.execute(context, callback);
                            }
                            var finalSource = _.isPromise(source) ? source : Q.resolve(source);
                            //if action result is a promise
                            return finalSource.then(function(result) {
                                if (result instanceof HttpResult) {
                                    //execute http result
                                    return result.execute(context, callback);
                                }
                                else {
                                    //convert result (any result) to an instance HttpResult
                                    if (typeof controller.result === 'function') {
                                        var httpResult = controller.result(result);
                                        //and finally execute result
                                        return httpResult.execute(context, callback);
                                    }
                                    else {
                                        return callback(new TypeError('Invalid controller prototype.'));
                                    }
                                }
                            }).catch(function(err) {
                                return callback.bind(context)(err);
                            });

                        }
                        else {
                            params.push(function (err, result) {
                                if (err) {
                                    //throw error
                                    callback.call(context, err);
                                }
                                else {
                                    //execute http result
                                    return result.execute(context, callback);
                                }
                            });
                            //invoke controller method
                            return fn.apply(controller, params);
                        }
                    }
                    catch(err) {
                        return callback(err);
                    }
                });
            }
        }
        else {
            return callback();
        }

    }
    catch (error) {
        callback(error);
    }
};

/**
 *
 * @param {string|*} requestUri
 * @param {HttpContext} context
 * @returns {HttpRoute}
 * @private
 */
function queryRoute(requestUri,context) {
    /**
     * @type Array
     * */
    var routes = context.getApplication().getConfiguration().routes;
    //enumerate registered routes
    var httpRoute = route.createInstance();
    for (var i = 0; i < routes.length; i++) {
        httpRoute.route = routes[i];
        //if uri path is matched
        if (httpRoute.isMatch(requestUri.pathname)) {
            return httpRoute;
        }
    }
}
/**
 * @function
 * @private
 * @param {HttpController|*} controller
 * @param {string} action
 * @returns {boolean}
 */
function isValidControllerAction(controller, action) {
    var httpMethodDecorator = _.camelCase('http-' + controller.context.request.method);
    if (typeof controller[action] === 'function') {
        //get httpAction decorator
        if ((typeof controller[action].httpAction === 'undefined') ||
            (controller[action].httpAction===action)) {
            //and supports current request method (see http decorators)
            if (controller[action][httpMethodDecorator]) {
                //return this action
                return true;
            }
        }
    }
    return false;
}

function getControllerPropertyNames_(obj) {
    if (typeof obj === 'undefined' || obj === null) {
        return [];
    }
    var ownPropertyNames = [];
    //get object methods
    var proto = obj;
    while(proto) {
        ownPropertyNames = ownPropertyNames.concat(Object.getOwnPropertyNames(proto).filter( function(x) {
            return ownPropertyNames.indexOf(x)<0;
        }));
        proto = Object.getPrototypeOf(proto);
    }
    return ownPropertyNames;
}

/**
 * @function
 * @private
 * @param {HttpController|*} controller
 * @param {string} action
 * @returns {Function}
 */
function queryControllerAction(controller, action) {
    var httpMethodDecorator = _.camelCase('http-' + controller.context.request.method),
         method = _.camelCase(action);
    var controllerPrototype = Object.getPrototypeOf(controller);
    var controllerPropertyNames = getControllerPropertyNames_(controllerPrototype);
    if (controllerPrototype) {
        //query controller methods that support current http request
        var protoActionMethods = _.filter(controllerPropertyNames, function(x) {
            return (typeof controller[x] === 'function')
                && (controller[x].httpAction === action)
                && controller[x][httpMethodDecorator];
        });
        //if an action was found for the given criteria
        if (protoActionMethods.length===1) {
            return controller[protoActionMethods[0]];
        }
    }
    //if an action with the given name is a method of current controller
    if (isValidControllerAction(controller, action)) {
        return controller[action];
    }
    //if a camel cased action with the given name is a method of current controller
    if (isValidControllerAction(controller, method)) {
        return controller[method];
    }
}

/**
 * Gets the controller of the given url
 * @param {string|*} requestUri - A string that represents the url we want to parse.
 * @private
 * */
function queryController(requestUri) {
    try {
        if (requestUri === undefined)
            return null;
        //split path
        var segments = requestUri.pathname.split('/');
        //put an exception for root controller
        //maybe this is unnecessary exception but we need to search for root controller e.g. /index.html, /about.html
        if (segments.length === 2)
            return 'root';
        else
        //e.g /pages/about where segments are ['','pages','about']
        //and the controller of course is always the second segment.
            return segments[1];
    }
    catch (e) {
        throw e;
    }
}

if (typeof exports !== 'undefined') {
    module.exports.ViewHandler = ViewHandler;
    module.exports.createInstance = function() {
        return new ViewHandler();
    };
}

