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
exports.PostContentConsumer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _formidable = require('formidable');

var formidable = _interopRequireDefault(_formidable).default;

var _lodash = require('lodash');

var _ = _lodash._;

var _utils = require('@themost/common/utils');

var LangUtils = _utils.LangUtils;
var TraceUtils = _utils.TraceUtils;

var _mostXml = require('most-xml');

var xml = _interopRequireDefault(_mostXml).default;

var _consumers = require('../consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _rxjs = require('rxjs');

var Rx = _interopRequireDefault(_rxjs).default;

var _results = require('../results');

var HttpNextResult = _results.HttpNextResult;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @classdesc Default post content handler (as it has been implemented for version 1.x of MOST Web Framework)
 * @class
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
                    return callback();
                } else {
                    request.headers = request.headers || {};
                    if (/^application\/x-www-form-urlencoded/i.test(request.headers['content-type'])) {
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
                                return callback(err);
                            }
                        });
                    } else {
                        return callback();
                    }
                }
            } catch (e) {
                TraceUtils.log(e);
                return callback(new Error("An internal server error occured while parsing request data."));
            }
        }
    }]);

    return PostHandler;
}();

/**
 * @class
 */


var PostContentConsumer = exports.PostContentConsumer = function (_HttpConsumer) {
    _inherits(PostContentConsumer, _HttpConsumer);

    function PostContentConsumer() {
        _classCallCheck(this, PostContentConsumer);

        return _possibleConstructorReturn(this, (PostContentConsumer.__proto__ || Object.getPrototypeOf(PostContentConsumer)).call(this, function () {
            /**
             * @type {HttpContext}
             */
            var context = this;
            try {
                var handler = new PostHandler();
                return Rx.Observable.bindNodeCallback(handler.beginRequest)(context).flatMap(function () {
                    return HttpNextResult.create().toObservable();
                });
            } catch (err) {
                return Rx.Observable['throw'](err);
            }
        }));
    }

    return PostContentConsumer;
}(HttpConsumer);
//# sourceMappingURL=post.js.map
