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

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var jsonParser = void 0;
/**
 * @class
 * @augments HttpHandler
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
                    context.application.config.settings = context.application.config.settings || {};
                    //ensure json settings (the default limit is 100kb)
                    context.application.config.settings.json = context.application.config.settings.json || { limit: 102400 };
                    //get json parser
                    jsonParser = _bodyParser2.default.json(context.application.config.settings.json);
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
                        } catch (e) {
                            callback(e);
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

exports.default = JsonHandler;
//# sourceMappingURL=json.js.map
