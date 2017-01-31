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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = require('lodash');

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides a case insensitive attribute getter
 * @param name
 * @returns {*}
 * @private
 */
function caseInsensitiveAttribute(name) {
    var _this = this;

    if (typeof name === 'string') {
        var _ret = function () {
            if (_this[name]) return {
                    v: _this[name]
                };
            //otherwise make a case insensitive search
            var re = new RegExp('^' + name + '$', 'i');
            var p = Object.keys(_this).filter(function (x) {
                return re.test(x);
            })[0];
            if (p) return {
                    v: _this[p]
                };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
    return null;
}
/**
 * @class
 * @augments HttpHandler
 */

var QuerystringHandler = function () {
    function QuerystringHandler() {
        _classCallCheck(this, QuerystringHandler);
    }

    _createClass(QuerystringHandler, [{
        key: 'beginRequest',

        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function beginRequest(context, callback) {
            context = context || {};
            callback = callback || function () {};
            var request = context.request;
            if (typeof request === 'undefined') {
                callback();
                return;
            }
            try {
                context.params = context.params || {};
                //apply case insensitivity search in params object
                context.params.attr = caseInsensitiveAttribute;
                //add query string params
                if (request.url.indexOf('?') > 0) _lodash._.assign(context.params, _querystring2.default.parse(request.url.substring(request.url.indexOf('?') + 1)));
                callback();
            } catch (e) {
                callback(e);
            }
        }
    }]);

    return QuerystringHandler;
}();

exports.default = QuerystringHandler;
//# sourceMappingURL=querystring.js.map
