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

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

var _lodash = require('lodash');

var _utils = require('@themost/common/utils');

var _mostXml = require('most-xml');

var _mostXml2 = _interopRequireDefault(_mostXml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @augments HttpHandler
 */
var PostHandler = function () {
    function PostHandler() {
        _classCallCheck(this, PostHandler);
    }

    _createClass(PostHandler, [{
        key: 'beginRequest',

        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function beginRequest(context, callback) {
            try {
                var request = context.request;
                //extend params object (parse form data)
                if (typeof request.socket === 'undefined') {
                    callback();
                } else {
                    request.headers = request.headers || {};
                    if (/^application\/x-www-form-urlencoded/i.test(request.headers['content-type'])) {
                        //use formidable to parse request data
                        var f = new _formidable2.default.IncomingForm();
                        f.parse(request, function (err, form, files) {
                            if (err) {
                                return callback(err);
                            }
                            try {
                                //add form
                                if (form) {
                                    _lodash._.assign(context.params, _utils.LangUtils.parseForm(form));
                                }
                                //add files
                                if (files) _lodash._.assign(context.params, files);
                                callback();
                            } catch (err) {
                                callback(err);
                            }
                        });
                    } else {
                        callback();
                    }
                }
            } catch (e) {
                _utils.TraceUtils.log(e);
                callback(new Error("An internal server error occured while parsing request data."));
            }
        }
    }]);

    return PostHandler;
}();

exports.default = PostHandler;
//# sourceMappingURL=post.js.map
