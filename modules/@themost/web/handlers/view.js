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
exports.default = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('@themost/common/errors');

var _utils = require('@themost/common/utils');

var _lodash = require('lodash');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mostXml = require('most-xml');

var _mostXml2 = _interopRequireDefault(_mostXml);

var _http_route = require('./../http_route');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (typeof _lodash._.dasherize != 'function') {
    /**
     * @param {string} s
     * @returns string
     */
    _lodash._.dasherize = function (s) {
        if (_lodash._.isString(s)) return _lodash._.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/, '').toLowerCase();
        return s;
    };
}

/**
 * @class
 * @augments HttpHandler
 */

var ViewHandler = function () {
    function ViewHandler() {
        _classCallCheck(this, ViewHandler);
    }

    _createClass(ViewHandler, [{
        key: 'authorizeRequest',


        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function authorizeRequest(context, callback) {
            try {
                var uri = _url2.default.parse(context.request.url);
                for (var i = 0; i < ViewHandler.RestrictedLocations.length; i++) {
                    /**
                     * @type {*|LocationSetting}
                     */
                    var location = ViewHandler.RestrictedLocations[i],

                    /**
                     * @type {RegExp}
                     */
                    re = new RegExp(location.path, 'ig');
                    if (re.test(uri.pathname)) {
                        callback(new _errors.HttpError(403, 'Forbidden'));
                        return;
                    }
                }
                callback();
            } catch (e) {
                callback(e);
            }
        }

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'mapRequest',
        value: function mapRequest(context, callback) {
            callback = callback || function () {};
            //try to map request
            try {
                var _ret = function () {
                    //first of all check if a request handler is already defined
                    if (typeof context.request.currentHandler !== 'undefined') {
                        //do nothing (exit mapping)
                        return {
                            v: callback()
                        };
                    }
                    var requestUri = _url2.default.parse(context.request.url);
                    /**
                     * find route by querying application routes
                     * @type {HttpRoute}
                     */
                    var currentRoute = queryRoute(context, requestUri);
                    if (typeof currentRoute === 'undefined' || currentRoute == null) {
                        return {
                            v: callback()
                        };
                    }
                    //query controller
                    var controllerName = currentRoute["controller"] || currentRoute.routeData["controller"] || queryController(requestUri);
                    if (typeof controllerName === 'undefined' || controllerName == null) {
                        return {
                            v: callback()
                        };
                    }
                    //try to find controller class
                    ViewHandler.queryControllerClass(controllerName, context, function (err, ControllerClass) {
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
                            context.request.route = _util2.default._extend({}, currentRoute.route);
                            context.request.routeData = currentRoute.routeData;
                            //set route data as params
                            for (var prop in currentRoute.routeData) {
                                if (currentRoute.routeData.hasOwnProperty(prop)) {
                                    context.params[prop] = currentRoute.routeData[prop];
                                }
                            }
                            return callback();
                        } catch (e) {
                            return callback(e);
                        }
                    });
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } catch (e) {
                callback(e);
            }
        }

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'postMapRequest',
        value: function postMapRequest(context, callback) {
            try {
                ViewHandler.prototype.preflightRequest.call(this, context, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    var obj = void 0;
                    if (context.is('POST')) {
                        if (context.format == 'xml') {
                            //get current model
                            if (context.request.body) {
                                //load xml
                                try {
                                    var doc = _mostXml2.default.loadXML(context.request.body);
                                    obj = _mostXml2.default.deserialize(doc.documentElement);
                                    context.params.data = obj;
                                } catch (e) {
                                    return callback(e);
                                }
                            }
                        } else if (context.format == 'json') {
                            if (typeof context.request.body === 'string') {
                                //parse json data
                                try {
                                    obj = JSON.parse(context.request.body);
                                    //set context data
                                    context.params.data = obj;
                                } catch (e) {
                                    //otherwise raise error
                                    _utils.TraceUtils.log(e);
                                    return callback(new Error('Invalid JSON data.'));
                                }
                            }
                        }
                    }
                    return callback();
                });
            } catch (e) {
                callback(e);
            }
        }

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'preflightRequest',
        value: function preflightRequest(context, callback) {
            try {
                if (context && context.request.currentHandler instanceof ViewHandler) {
                    //set the default origin (with wildcard)
                    var allowCredentials = true,
                        allowOrigin = "*",
                        allowHeaders = "Origin, X-Requested-With, Content-Type, Content-Language, Accept, Accept-Language, Authorization",
                        allowMethods = "GET, OPTIONS, PUT, POST, DELETE";

                    /**
                     * @private
                     * @type {{allowOrigin:string,allowHeaders:string,allowCredentials:Boolean,allowMethods:string,allow:string}|*}
                     */
                    var route = context.request.route;
                    if (route) {
                        if (typeof route.allowOrigin !== 'undefined') allowOrigin = route.allowOrigin;
                        if (typeof route.allowHeaders !== 'undefined') allowHeaders = route.allowHeaders;
                        if (typeof route.allowCredentials !== 'undefined') allowCredentials = route.allowCredentials;
                        if (typeof route.allowMethods !== 'undefined' || typeof route.allow !== 'undefined') allowMethods = route.allow || route.allowMethods;
                    }
                    //ensure header names
                    var headerNames = context.response["_headerNames"] || {};
                    //1. Access-Control-Allow-Origin
                    if (typeof headerNames["access-control-allow-origin"] === 'undefined') {
                        //if request contains origin header
                        if (context.request.headers.origin) {
                            if (allowOrigin === "*") {
                                //set access-control-allow-origin header equal to request origin header
                                context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                            } else if (allowOrigin.indexOf(context.request.headers.origin) > -1) {
                                context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                            }
                        } else {
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
                if (typeof callback === 'undefined') {
                    return;
                }
                return callback();
            } catch (e) {
                if (typeof callback === 'undefined') {
                    throw e;
                }
                callback(e);
            }
        }

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'processRequest',
        value: function processRequest(context, callback) {
            var self = this;
            callback = callback || function () {};
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
                            fn = controller[_lodash._.camelCase(action)];
                            if (typeof fn !== 'function') fn = controller.action;
                        }
                        if (typeof fn !== 'function') {
                            return callback(new _errors.HttpNotFoundError());
                        }
                        //enumerate params
                        var methodParams = _utils.LangUtils.getFunctionParams(fn),
                            params = [];
                        /*
                        * so if method has more than one parameter
                        * enumerate method parameters and check if a parameter with the same name
                        * exists in request's parameters.
                        * note: the last parameter (in this version) must be a callback function
                        * */
                        if (methodParams.length > 1) {
                            var k = 0;
                            while (k < methodParams.length - 1) {
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
                            } else {
                                //execute http result
                                result.execute(context, callback);
                            }
                        });
                        //invoke controller method
                        return fn.apply(controller, params);
                    }
                }
                callback.call(context);
            } catch (e) {
                callback.call(context, e);
            }
        }
    }], [{
        key: 'queryControllerClass',
        value: function queryControllerClass(controllerName, context, callback) {

            if (typeof controllerName === 'undefined' || controllerName == null) {
                callback();
            } else {
                (function () {
                    //get controller class path and model (if any)
                    var controllerPath = context.application.mapPath(_util2.default.format(ViewHandler.STR_CONTROLLER_RELPATH, _lodash._.dasherize(controllerName)));

                    var controllerModel = context.model(controllerName);
                    //if controller does not exists
                    _fs2.default.exists(controllerPath, function (exists) {
                        try {
                            //if controller class file does not exist in /controllers/ folder
                            if (!exists) {
                                //try to find if current controller has a model defined
                                if (controllerModel) {
                                    (function () {
                                        var controllerType = controllerModel.type || 'data';
                                        //try to find controller based on the model's type in controllers folder (e.g. /library-controller.js)
                                        controllerPath = context.application.mapPath(_util2.default.format(ViewHandler.STR_CONTROLLER_RELPATH, controllerType));
                                        _fs2.default.exists(controllerPath, function (exists) {
                                            if (!exists) {
                                                //get controller path according to related model's type (e.g ./data-controller)
                                                controllerPath = _util2.default.format(ViewHandler.STR_CONTROLLER_FILE, controllerType);
                                                //if controller does not exist
                                                controllerPath = _path2.default.join(__dirname, controllerPath);
                                                _fs2.default.exists(controllerPath, function (exists) {
                                                    if (!exists) callback(null, require('./../controllers/base').default);else callback(null, require(controllerPath).default);
                                                });
                                            } else {
                                                callback(null, require(controllerPath).default);
                                            }
                                        });
                                    })();
                                } else {
                                    var ControllerCtor = context.application.config.controllers[controllerName] || require('./../controllers/base').default;
                                    callback(null, ControllerCtor);
                                }
                            } else {
                                //return controller class
                                callback(null, require(controllerPath).default);
                            }
                        } catch (e) {
                            callback(e);
                        }
                    });
                })();
            }
        }
    }]);

    return ViewHandler;
}();

exports.default = ViewHandler;


ViewHandler.STR_CONTROLLERS_FOLDER = 'controllers';
ViewHandler.STR_CONTROLLER_FILE = './controllers/%s-controller.js';
ViewHandler.STR_CONTROLLER_RELPATH = '/controllers/%s-controller.js';

ViewHandler.RestrictedLocations = [{ "path": "^/controllers/", "description": "Most web framework server controllers" }, { "path": "^/models/", "description": "Most web framework server models" }, { "path": "^/extensions/", "description": "Most web framework server extensions" }, { "path": "^/handlers/", "description": "Most web framework server handlers" }, { "path": "^/views/", "description": "Most web framework server views" }];

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
        var httpRoute = new _http_route.HttpRoute();
        for (var i = 0; i < routes.length; i++) {
            httpRoute.route = routes[i];
            //if uri path is matched
            if (httpRoute.isMatch(requestUri.pathname)) {
                return httpRoute;
            }
        }
    } catch (e) {
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
        if (requestUri === undefined) return null;
        //split path
        var segments = requestUri.pathname.split('/');
        //put an exception for root controller
        //maybe this is unnecessary exception but we need to search for root controller e.g. /index.html, /about.html
        if (segments.length == 2) return 'root';else
            //e.g /pages/about where segments are ['','pages','about']
            //and the controller of course is always the second segment.
            return segments[1];
    } catch (e) {
        throw e;
    }
}
//# sourceMappingURL=view.js.map
