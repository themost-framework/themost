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
exports.QuerystringConsumer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = require('lodash');

var _ = _lodash._;

var _querystring = require('querystring');

var querystring = _interopRequireDefault(_querystring).default;

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
 * @classdesc @classdesc Default querystring handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
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
                if (request.url.indexOf('?') > 0) _.assign(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
                callback();
            } catch (e) {
                callback(e);
            }
        }
    }]);

    return QuerystringHandler;
}();

var QuerystringConsumer = exports.QuerystringConsumer = function (_HttpConsumer) {
    _inherits(QuerystringConsumer, _HttpConsumer);

    function QuerystringConsumer() {
        _classCallCheck(this, QuerystringConsumer);

        return _possibleConstructorReturn(this, (QuerystringConsumer.__proto__ || Object.getPrototypeOf(QuerystringConsumer)).call(this, function () {
            /**
             * @type {HttpContext}
             */
            var context = this;
            try {
                var handler = new QuerystringHandler();
                return Rx.Observable.bindNodeCallback(handler.beginRequest)(context).flatMap(function () {
                    return HttpNextResult.create().toObservable();
                });
            } catch (err) {
                return Rx.Observable['throw'](err);
            }
        }));
    }

    return QuerystringConsumer;
}(HttpConsumer);
//# sourceMappingURL=querystring.js.map
