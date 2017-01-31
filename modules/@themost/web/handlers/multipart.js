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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (process.version >= "v6.0.0") {
    (function () {
        var multipart_parser = require('formidable/lib/multipart_parser'),
            MultipartParser = multipart_parser.MultipartParser;
        MultipartParser.prototype.initWithBoundary = function (str) {
            this.boundary = new Buffer(str.length + 4);
            this.boundary.write('\r\n--', 0, 4, 'ascii');
            this.boundary.write(str, 4, str.length, 'ascii');
            this.lookbehind = new Buffer(this.boundary.length + 8);
            this.state = multipart_parser.START;
            this.boundaryChars = {};
            for (var i = 0; i < this.boundary.length; i++) {
                this.boundaryChars[this.boundary[i]] = true;
            }
        };
    })();
}
/**
 * @class
 * @augments HttpHandler
 */

var MultipartHandler = function () {
    function MultipartHandler() {
        _classCallCheck(this, MultipartHandler);
    }

    _createClass(MultipartHandler, [{
        key: 'beginRequest',

        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function beginRequest(context, callback) {
            var request = context.request;
            request.headers = request.headers || {};
            var contentType = request.headers['content-type'];
            if (/^multipart\/form-data/i.test(contentType)) {
                //use formidable to parse request data
                var f = new _formidable2.default.IncomingForm();
                f.parse(request, function (err, form, files) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    try {
                        //add form
                        if (form) {
                            _lodash._.assign(context.params, _utils.LangUtils.parseForm(form));
                        }
                        //add files
                        if (files) _lodash._.assign(context.params, files);
                        callback();
                    } catch (e) {
                        callback(e);
                    }
                });
            } else {
                callback();
            }
        }
    }]);

    return MultipartHandler;
}();

exports.default = MultipartHandler;
//# sourceMappingURL=multipart.js.map
