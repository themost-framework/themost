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
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RouteConsumer = exports.DefaultRoutingStrategy = exports.RoutingStrategy = exports.HttpRoute = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;
var Args = _utils.Args;

var _errors = require('@themost/common/errors');

var AbstractMethodError = _errors.AbstractMethodError;
var AbstractClassError = _errors.AbstractClassError;

var _lodash = require('lodash');

var _ = _lodash._;

var _url = require('url');

var url = _interopRequireDefault(_url).default;

var _interfaces = require('./interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _consumers = require('./consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _rxjs = require('rxjs');

var Rx = _interopRequireDefault(_rxjs).default;

var _results = require('./results');

var HttpNextResult = _results.HttpNextResult;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @classdesc HttpRoute class provides routing functionality to HTTP requests
 * @class
 * */
var HttpRoute = exports.HttpRoute = function () {
    /**
     * @constructor
     * @param {string|*=} route - A formatted string or an object which represents an HTTP route response url (e.g. /pages/:name.html, /user/edit.html).
     */
    function HttpRoute(route) {
        _classCallCheck(this, HttpRoute);

        if (typeof route === 'string') {
            this.route = { url: route };
        } else if ((typeof route === 'undefined' ? 'undefined' : _typeof(route)) === 'object') {
            this.route = route;
        }
        this.routeData = {};

        this.patterns = {
            int: function int() {
                return "^[1-9]([0-9]*)$";
            },
            boolean: function boolean() {
                return "^true|false$";
            },
            decimal: function decimal() {
                return "^\d*\.?\d*$";
            },
            float: function float() {
                return "^\d*\.?\d*$";
            },
            guid: function guid() {
                return "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$";
            }
        };
    }

    /**
     * @param {string} urlToMatch
     * @return {boolean}
     */


    _createClass(HttpRoute, [{
        key: 'isMatch',
        value: function isMatch(urlToMatch) {
            var self = this;
            if (typeof self.route === 'undefined' || self.route == null) {
                throw new Error("Route may not be null");
            }
            self.routeData = self.routeData || {};
            if (typeof urlToMatch !== 'string') return false;
            if (urlToMatch.length == 0) return false;
            var str1 = urlToMatch,
                patternMatch = void 0;
            var k = urlToMatch.indexOf('?');
            if (k >= 0) str1 = urlToMatch.substr(0, k);
            var re = /(\{([\w\[\]]+)(?::\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*})+))?})|((:)([\w\[\]]+))/ig;
            var match = re.exec(this.route.url);
            var params = [];
            while (match) {
                if (typeof match[2] === 'undefined') {
                    //parameter with colon (e.g. :id)
                    params.push({
                        name: match[6]
                    });
                } else if (typeof match[3] !== 'undefined') {
                    //common expressions
                    patternMatch = match[3];
                    if (typeof self.patterns[match[3]] === 'function') {
                        patternMatch = self.patterns[match[3]]();
                    }
                    params.push({
                        name: match[2],
                        pattern: new RegExp(patternMatch, "ig")
                    });
                } else {
                    params.push({
                        name: match[2]
                    });
                }
                match = re.exec(this.route.url);
            }
            var str = this.route.url.replace(re, "([\\w-]+)"),
                matcher = new RegExp("^" + str + "$", "ig");
            match = matcher.exec(str1);
            if (typeof match === 'undefined' || match == null) {
                return false;
            }
            for (var i = 0; i < params.length; i++) {
                var param = params[i];
                if (typeof param.pattern !== 'undefined') {
                    if (!param.pattern.test(match[i + 1])) {
                        return false;
                    }
                }
                param.value = match[i + 1];
            }
            params.forEach(function (x) {
                self.routeData[x.name] = x.value;
            });
            if (self.route.hasOwnProperty("controller")) {
                self.routeData["controller"] = self.route["controller"];
            }
            if (self.route.hasOwnProperty("action")) {
                self.routeData["action"] = self.route["action"];
            }
            return true;
        }

        /**
         * @param {string|*=} route - A formatted string or an object which represents an HTTP route response url (e.g. /pages/:name.html, /user/edit.html).
         * @returns {HttpRoute}
         */

    }], [{
        key: 'create',
        value: function create(route) {
            return new HttpRoute(route);
        }
    }]);

    return HttpRoute;
}();

/**
 * @classdesc Extends context parameters by adding the context params that are defined on the current route, if any (implemented on version 1.x of MOST Web Framework)
 * @class
 */


var RouteHandler = function () {
    function RouteHandler() {
        _classCallCheck(this, RouteHandler);
    }

    _createClass(RouteHandler, [{
        key: 'mapRequest',

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function mapRequest(context, callback) {
            if (_.isNil(context.request)) {
                return callback();
            }
            /**
             * @type {RoutingStrategy}
             */
            var routeStrategy = context.getApplication().getService(RoutingStrategy);
            if (_.isNil(routeStrategy)) {
                return callback();
            }
            var route = routeStrategy.exec(context.request.url);
            if (_.isNil(route)) {
                return callback();
            }
            //extend params
            context.params = context.params || {};
            //assign route to current request for further execution
            context.request.route = route;
            //assign route data to current request for further execution
            context.request.routeData = route.routeData || {};

            if (_typeof(route.params) === 'object' && route.params != null) {
                //assign route params
                _.assign(context.params, route.params);
            }
            //assign route data to params (override any existed property)
            if (_.isObject(context.request.routeData)) {
                _.assign(context.params, context.request.routeData);
            }
            return callback();
        }
    }]);

    return RouteHandler;
}();
/**
 * @classdesc An abstract class which represents the route strategy of an HTTP application.
 * @class
 */


var RoutingStrategy = exports.RoutingStrategy = function (_HttpApplicationServi) {
    _inherits(RoutingStrategy, _HttpApplicationServi);

    /**
     * @param {HttpApplication} app
     */
    function RoutingStrategy(app) {
        _classCallCheck(this, RoutingStrategy);

        Args.check(new.target !== RoutingStrategy, new AbstractClassError());
        return _possibleConstructorReturn(this, (RoutingStrategy.__proto__ || Object.getPrototypeOf(RoutingStrategy)).call(this, app));
    }

    /**
     * @abstract
     * @returns {Array}
     */


    _createClass(RoutingStrategy, [{
        key: 'getRoutes',
        value: function getRoutes() {
            throw new AbstractMethodError();
        }

        /**
         *
         * @param {string} requestURL
         * @returns {*}
         */

    }, {
        key: 'isMatch',
        value: function isMatch(requestURL) {
            return this.exec(requestURL) instanceof HttpRoute;
        }
        /**
         * Returns the HTTP route that matches the given URL
         * @param {string} requestURL
         * @returns {*}
         */

    }, {
        key: 'exec',
        value: function exec(requestURL) {
            if (_.isNil(requestURL)) {
                return;
            }
            var uri = url.parse(requestURL);
            var routes = this.getRoutes();
            if (_.isArray(routes) && routes.length > 0) {
                //enumerate registered routes
                var httpRoute = new HttpRoute();
                for (var i = 0; i < routes.length; i++) {
                    httpRoute.route = routes[i];
                    //if uri path is matched
                    if (httpRoute.isMatch(uri.pathname)) {
                        return httpRoute;
                    }
                }
            }
        }
    }]);

    return RoutingStrategy;
}(HttpApplicationService);

var routesProperty = Symbol('routes');

/**
 * @classdesc Represents the default route strategy of an HTTP application.
 */

var DefaultRoutingStrategy = exports.DefaultRoutingStrategy = function (_RoutingStrategy) {
    _inherits(DefaultRoutingStrategy, _RoutingStrategy);

    /**
     * @param {HttpApplication} app
     */
    function DefaultRoutingStrategy(app) {
        _classCallCheck(this, DefaultRoutingStrategy);

        var _this2 = _possibleConstructorReturn(this, (DefaultRoutingStrategy.__proto__ || Object.getPrototypeOf(DefaultRoutingStrategy)).call(this, app));

        _this2[routesProperty] = _this2.getApplication().getConfiguration().routes || [];
        return _this2;
    }

    /**
     * @returns {Array}
     */


    _createClass(DefaultRoutingStrategy, [{
        key: 'getRoutes',
        value: function getRoutes() {
            return this[routesProperty];
        }
    }]);

    return DefaultRoutingStrategy;
}(RoutingStrategy);

/**
 * @class
 */


var RouteConsumer = exports.RouteConsumer = function (_HttpConsumer) {
    _inherits(RouteConsumer, _HttpConsumer);

    function RouteConsumer() {
        _classCallCheck(this, RouteConsumer);

        return _possibleConstructorReturn(this, (RouteConsumer.__proto__ || Object.getPrototypeOf(RouteConsumer)).call(this, function () {
            /**
             * @type {HttpContext}
             */
            var context = this;
            try {
                var handler = new RouteHandler();
                return Rx.Observable.bindNodeCallback(handler.mapRequest)(context).flatMap(function () {
                    return HttpNextResult.create().toObservable();
                });
            } catch (err) {
                return Rx.Observable['throw'](err);
            }
        }));
    }

    return RouteConsumer;
}(HttpConsumer);
//# sourceMappingURL=route.js.map
