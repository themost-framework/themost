'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JsonContentConsumer = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


require('source-map-support/register');

var _consumers = require('../consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _bodyParser = require('body-parser');

var bodyParser = _interopRequireDefault(_bodyParser).default;

var _results = require('../results');

var HttpNextResult = _results.HttpNextResult;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var jsonParser = void 0;
/**
 * @classdesc Default JSON content handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
 */

var JsonHandler = function () {
    function JsonHandler() {
        _classCallCheck(this, JsonHandler);
    }

    _createClass(JsonHandler, [{
        key: 'beginRequest',

        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function beginRequest(context, callback) {
            var request = context.request,
                response = context.response;
            request.headers = request.headers || {};
            var contentType = request.headers['content-type'];
            if (/^application\/json/i.test(contentType)) {
                //change: 15-Feb 2016
                //description get json body limit from application configuration (settings#json.limit)
                if (typeof jsonParser === 'undefined') {
                    //ensure settings
                    var conf = context.getApplication().getConfiguration();
                    conf.settings = conf.settings || {};
                    //ensure json settings (the default limit is 100kb)
                    conf.settings.json = conf.settings.json || { limit: 102400 };
                    //get json parser
                    jsonParser = bodyParser.json(conf.settings.json);
                }
                //parse request data
                jsonParser(request, response, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        try {
                            if (request.body) {
                                //try parse
                                if (request.body instanceof Buffer) {
                                    context.params.data = JSON.parse(request.body);
                                } else if (_typeof(request.body) === 'object') {
                                    context.params.data = request.body;
                                }
                                callback();
                            }
                        } catch (err) {
                            callback(err);
                        }
                    }
                });
            } else {
                callback();
            }
        }
    }]);

    return JsonHandler;
}();

/**
 * @class
 */


var JsonContentConsumer = exports.JsonContentConsumer = function (_HttpConsumer) {
    _inherits(JsonContentConsumer, _HttpConsumer);

    function JsonContentConsumer() {
        _classCallCheck(this, JsonContentConsumer);

        return _possibleConstructorReturn(this, (JsonContentConsumer.__proto__ || Object.getPrototypeOf(JsonContentConsumer)).call(this, function (context) {
            try {
                var handler = new JsonHandler();
                return Q.nfbind(handler.beginRequest)(context).then(function () {
                    return HttpNextResult.create().toPromise();
                });
            } catch (err) {
                return Q.reject(err);
            }
        }));
    }

    return JsonContentConsumer;
}(HttpConsumer);
//# sourceMappingURL=json.js.map
