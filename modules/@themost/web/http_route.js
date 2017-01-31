'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
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
//# sourceMappingURL=http_route.js.map
