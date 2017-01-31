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

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @classdesc Extends context parameters by adding the default context params that are defined on the current route, if any
 * @class
 * @augments HttpHandler
 */
var RouteParamsHandler = function () {
    function RouteParamsHandler() {
        _classCallCheck(this, RouteParamsHandler);
    }

    _createClass(RouteParamsHandler, [{
        key: 'mapRequest',

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function mapRequest(context, callback) {
            if (_lodash._.isNil(context.request)) {
                callback();
            } else if (_lodash._.isNil(context.request.route)) {
                callback();
            } else {
                (function () {
                    var route = context.request.route;
                    //extend params
                    context.params = context.params || {};
                    if (_typeof(route.params) === 'object' && route.params != null) {
                        var keys = Object.keys(route.params);
                        keys.forEach(function (key) {
                            context.params[key] = route.params[key];
                        });
                    }
                    callback();
                })();
            }
        }
    }]);

    return RouteParamsHandler;
}();

exports.default = RouteParamsHandler;
//# sourceMappingURL=route.js.map
