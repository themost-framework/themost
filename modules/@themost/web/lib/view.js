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
exports.ViewConsumer = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('@themost/common/errors');

var HttpError = _errors.HttpError;
var HttpNotFoundError = _errors.HttpNotFoundError;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;
var LangUtils = _utils.LangUtils;

var _results = require('./results');

var HttpNextResult = _results.HttpNextResult;
var HttpEndResult = _results.HttpEndResult;

var _consumers = require('./consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _lodash = require('lodash');

var _ = _lodash._;

var _url = require('url');

var url = _interopRequireDefault(_url).default;

var _util = require('util');

var util = _interopRequireDefault(_util).default;

var _fs = require('fs');

var fs = _interopRequireDefault(_fs).default;

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _mostXml = require('most-xml');

var xml = _interopRequireDefault(_mostXml).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (typeof _.dasherize != 'function') {
    /**
     * @param {string} s
     * @returns string
     */
    _.dasherize = function (s) {
        if (_.isString(s)) return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/, '').toLowerCase();
        return s;
    };
}

/**
 * @classdesc Default view handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 */

var ViewHandler = function () {
    function ViewHandler() {
        _classCallCheck(this, ViewHandler);
    }

    _createClass(ViewHandler, [{
        key: 'mapRequest',


        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */
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
                    var requestUri = url.parse(context.request.url);
                    /**
                     * find route by querying application routes
                     * @type {HttpRoute}
                     */
                    var currentRoute = context.request.route;
                    if (_.isNil(currentRoute)) {
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
                            return callback(null, true);
                        } catch (err) {
                            return callback(err);
                        }
                    });
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } catch (err) {
                callback(err);
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
                                    var doc = xml.loadXML(context.request.body);
                                    obj = xml.deserialize(doc.documentElement);
                                    context.params.data = obj;
                                } catch (err) {
                                    return callback(err);
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
                                    TraceUtils.log(e);
                                    return callback(new Error('Invalid JSON data.'));
                                }
                            }
                        }
                    }
                    return callback();
                });
            } catch (err) {
                callback(err);
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
                            fn = controller[_.camelCase(action)];
                            if (typeof fn !== 'function') fn = controller.action;
                        }
                        if (typeof fn !== 'function') {
                            return callback(new HttpNotFoundError());
                        }
                        //enumerate params
                        var methodParams = LangUtils.getFunctionParams(fn),
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
                                return callback(err);
                            } else {
                                //execute http result
                                result.execute(context, function (err) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null, HttpEndResult.create());
                                });
                            }
                        });
                        //invoke controller method
                        return fn.apply(controller, params);
                    }
                }
                return callback();
            } catch (err) {
                return callback(err);
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
                    var controllerPath = context.application.mapPath(util.format(ViewHandler.STR_CONTROLLER_RELPATH, _.dasherize(controllerName)));

                    var controllerModel = context.model(controllerName);
                    //if controller does not exists
                    fs.exists(controllerPath, function (exists) {
                        try {
                            //if controller class file does not exist in /controllers/ folder
                            if (!exists) {
                                //try to find if current controller has a model defined
                                if (controllerModel) {
                                    (function () {
                                        var controllerType = controllerModel.type || 'data';
                                        //try to find controller based on the model's type in controllers folder (e.g. /library-controller.js)
                                        controllerPath = context.application.mapPath(util.format(ViewHandler.STR_CONTROLLER_RELPATH, controllerType));
                                        fs.exists(controllerPath, function (exists) {
                                            if (!exists) {
                                                //get controller path according to related model's type (e.g ./data-controller)
                                                controllerPath = util.format(ViewHandler.STR_CONTROLLER_FILE, controllerType);
                                                //if controller does not exist
                                                controllerPath = path.join(__dirname, controllerPath);
                                                fs.exists(controllerPath, function (exists) {
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

ViewHandler.STR_CONTROLLERS_FOLDER = 'controllers';
ViewHandler.STR_CONTROLLER_FILE = './controllers/%s-controller.js';
ViewHandler.STR_CONTROLLER_RELPATH = '/controllers/%s-controller.js';

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
    } catch (err) {
        throw err;
    }
}

var ViewConsumer = exports.ViewConsumer = function (_HttpConsumer) {
    _inherits(ViewConsumer, _HttpConsumer);

    function ViewConsumer() {
        _classCallCheck(this, ViewConsumer);

        return _possibleConstructorReturn(this, (ViewConsumer.__proto__ || Object.getPrototypeOf(ViewConsumer)).call(this, function () {
            /**
             * @type {HttpContext}
             */
            var context = this;
            try {
                var _ret4 = function () {
                    var handler = new ViewHandler();
                    //execute mapRequest
                    return {
                        v: Rx.Observable.fromNodeCallback(handler.mapRequest)(context).flatMap(function () {
                            //if request has been mapped
                            if (context.request.currentHandler instanceof ViewHandler) {
                                //execute post map request
                                return Rx.Observable.fromNodeCallback(handler.postMapRequest)(context);
                            }
                            //otherwise return next result
                            return Rx.Observable.return(new HttpNextResult());
                        }).flatMap(function () {
                            //if current handler is an instance of ViewHandler
                            if (context.request.currentHandler instanceof ViewHandler) {
                                //process request
                                return Rx.Observable.fromNodeCallback(handler.processRequest)(context).flatMap(function (res) {
                                    if (res instanceof HttpEndResult) {
                                        return res.toObservable();
                                    }
                                    return Rx.Observable.return(new HttpNextResult());
                                });
                            }
                            return Rx.Observable.return(new HttpNextResult());
                        })
                    };
                }();

                if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
            } catch (err) {
                return Rx.Observable.throw(err);
            }
        }));
    }

    return ViewConsumer;
}(HttpConsumer);
//# sourceMappingURL=view.js.map
