/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-05-07
 */
/**
 * Routing HTTP Handler
 */
/**
 * @ignore
 */
var url = require('url'),
    util = require('util'),
    fs = require('fs'),
    route = require('./../http-route'),
    xml = require('most-xml'),
    path=require('path'),
    _ = require('lodash'),
    common = require('@themost/common');

if (typeof _.dasherize != 'function') {
    /**
     * @param {string} s
     * @returns string
     */
    _.dasherize = function (s) {
        if (_.isString(s))
            return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
        return s;
    }
}

/**
 * @class ViewHandler
 * @constructor
 * @augments HttpHandler
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
ViewHandler.STR_CONTROLLERS_FOLDER = 'controllers';
ViewHandler.STR_CONTROLLER_FILE = './controllers/%s-controller.js';
ViewHandler.STR_CONTROLLER_RELPATH = '/controllers/%s-controller.js';

ViewHandler.queryControllerClass = function(controllerName, context, callback) {

    if (typeof controllerName === 'undefined' || controllerName==null) {
        callback();
    }
    else {
        //get controller class path and model (if any)
        var controllerPath = context.application.mapPath(util.format(ViewHandler.STR_CONTROLLER_RELPATH, _.dasherize(controllerName))),
            controllerModel = context.model(controllerName);
        //if controller does not exists
        fs.exists(controllerPath, function(exists){
            try {
                //if controller class file does not exist in /controllers/ folder
                if (!exists) {
                    //try to find if current controller has a model defined
                    if (controllerModel) {
                        var controllerType = controllerModel.type || 'data';
                        //try to find controller based on the model's type in controllers folder (e.g. /library-controller.js)
                        controllerPath = context.application.mapPath(util.format(ViewHandler.STR_CONTROLLER_RELPATH, controllerType));
                        fs.exists(controllerPath, function(exists) {
                           if (!exists) {
                               //get controller path according to related model's type (e.g ./data-controller)
                               controllerPath = util.format(ViewHandler.STR_CONTROLLER_FILE, controllerType);
                               //if controller does not exist
                               controllerPath = path.join(__dirname, controllerPath);
                               fs.exists(controllerPath, function(exists) {
                                   if (!exists)
                                       callback(null, require('./../controllers/base-controller'));
                                   else
                                       callback(null, require(controllerPath));
                               });
                           }
                           else {
                               callback(null, require(controllerPath));
                           }
                        });
                    }
                    else {
                        var ControllerCtor = context.application.config.controllers[controllerName] || require('./../controllers/base-controller');
                        callback(null, ControllerCtor);
                    }
                }
                else {
                    //return controller class
                    callback(null, require(controllerPath));
                }
            }
            catch (e) {
                callback(e);
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
                callback(new common.HttpException(403, 'Forbidden'));
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
        var currentRoute = queryRoute(context, requestUri);
        if (typeof currentRoute === 'undefined' || currentRoute == null) {
            return callback();
        }
        //query controller
        var controllerName = currentRoute["controller"] || currentRoute.routeData["controller"] || queryController(requestUri);
        if (typeof controllerName === 'undefined' || controllerName == null) {
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
                context.request.route = util._extend({ },currentRoute.route);
                context.request.routeData = currentRoute.routeData;
                //set route data as params
                for(var prop in currentRoute.routeData) {
                    if (currentRoute.routeData.hasOwnProperty(prop)) {
                        context.params[prop] = currentRoute.routeData[prop];
                    }
                }
                return callback();
            }
            catch(e) {
                return callback(e);
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
                if (context.format=='xml') {
                    //get current model
                    if (context.request.body) {
                        //load xml
                        try {
                            var doc = xml.loadXML(context.request.body);
                            obj = xml.deserialize(doc.documentElement);
                            context.params.data = obj;
                        }
                        catch (e) {
                            return callback(e);
                        }
                    }
                }
                else if (context.format=='json') {
                    if (typeof context.request.body === 'string') {
                        //parse json data
                        try {
                            obj = JSON.parse(context.request.body);
                            //set context data
                            context.params.data = obj;
                        }
                        catch(e) {
                            //otherwise raise error
                            common.log(e);
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
                allowMethods = "GET, OPTIONS, PUT, POST, DELETE";

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
                var fn = controller[action];
                if (typeof fn !== 'function') {
                    fn = controller[_.camelCase(action)];
                    if (typeof fn !== 'function')
                        fn = controller.action;
                }
                if (typeof fn !== 'function') {
                    return callback(new common.HttpNotFoundException());
                }
                //enumerate params
                var methodParams = common.getFunctionParams(fn),
                    params = [];
                /*
                * so if method has more than one parameter
                * enumerate method parameters and check if a parameter with the same name
                * exists in request's parameters.
                * note: the last parameter (in this version) must be a callback function
                * */
                if (methodParams.length>1) {
                    var k=0;
                    while (k<methodParams.length-1) {
                        //get context parameter
                        params.push(context.params.attr(methodParams[k]));
                        k++;
                    }
                }
                //and finally push callback function parameter
                /**
                 * @type HttpResult
                 * */
                params.push(function (err, result) {
                    if (err) {
                        //throw error
                        return callback.call(context, err);
                    }
                    else {
                        //execute http result
                        result.execute(context, callback);
                    }
                });
                //invoke controller method
                return fn.apply(controller, params);
            }
        }
        callback.call(context);
    }
    catch (e) {
        callback.call(context, e);
    }
};

/**
 *
 * @param {HttpContext} context
 * @param {string|*} requestUri
 * @returns {HttpRoute}
 * @private
 */
function queryRoute(context, requestUri) {
    try {
        /**
         * @type Array
         * */
        var routes = context.application.config.routes;
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
    catch (e) {
        throw e;
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
        if (segments.length == 2)
            return 'root';
        else
        //e.g /pages/about where segments are ['','pages','about']
        //and the controller of course is always the second segment.
            return segments[1];
        //todo:validate workspaces (e.g. /my-workspace/pages/about) where controller segment differs based on the workspace url.

    }
    catch (e) {
        throw e;
    }
}

/**
 * @returns ViewHandler
 * */
ViewHandler.prototype.createInstance = function () {
    return new ViewHandler();
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') module.exports = ViewHandler.prototype.createInstance();

