'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MultipartContentConsumer = undefined;

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

var _formidable = require('formidable');

var formidable = _interopRequireDefault(_formidable).default;

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _utils = require('@themost/common/utils');

var LangUtils = _utils.LangUtils;

var _consumers = require('../consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _results = require('../results');

var HttpNextResult = _results.HttpNextResult;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (process.version >= "v6.0.0") {
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
}
/**
 * @classdesc Default multipart content handler (as it has been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
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
                var f = new formidable.IncomingForm();
                f.parse(request, function (err, form, files) {
                    if (err) {
                        return callback(err);
                    }
                    try {
                        //add form
                        if (form) {
                            _.assign(context.params, LangUtils.parseForm(form));
                        }
                        //add files
                        if (files) _.assign(context.params, files);
                        return callback();
                    } catch (err) {
                        callback(err);
                    }
                });
            } else {
                return callback();
            }
        }
    }]);

    return MultipartHandler;
}();
/**
 * @class
 */


var MultipartContentConsumer = exports.MultipartContentConsumer = function (_HttpConsumer) {
    _inherits(MultipartContentConsumer, _HttpConsumer);

    function MultipartContentConsumer() {
        _classCallCheck(this, MultipartContentConsumer);

        return _possibleConstructorReturn(this, (MultipartContentConsumer.__proto__ || Object.getPrototypeOf(MultipartContentConsumer)).call(this, function (context) {
            try {
                var handler = new MultipartHandler();
                return Q.nfbind(handler.beginRequest)(context).then(function () {
                    return HttpNextResult.create().toPromise();
                });
            } catch (err) {
                return Q.reject(err);
            }
        }));
    }

    return MultipartContentConsumer;
}(HttpConsumer);
//# sourceMappingURL=multipart.js.map
