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

var _errors = require('@themost/common/errors');

var _utils = require('@themost/common/utils');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @classdesc Static File Handler
 * @class
 * @augments HttpHandler
 */
var StaticHandler = function () {
    function StaticHandler() {
        _classCallCheck(this, StaticHandler);
    }

    _createClass(StaticHandler, [{
        key: 'validateRequest',

        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function validateRequest(context, callback) {
            callback = callback || function () {};
            callback.call(context);
        }

        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'mapRequest',
        value: function mapRequest(context, callback) {
            callback = callback || function () {};
            try {
                (function () {
                    //get file path
                    var filePath = context.application.mapPath('/app' + context.request.url);
                    _fs2.default.exists(filePath, function (exists) {
                        if (!exists) {
                            callback(null);
                        } else {
                            _fs2.default.stat(filePath, function (err, stats) {
                                if (err) {
                                    callback(err);
                                } else {
                                    //if file exists
                                    if (stats && stats.isFile()) {
                                        //set request current handler
                                        context.request.currentHandler = new StaticHandler();
                                        //set current execution path
                                        context.request.currentExecutionPath = filePath;
                                        //set file stats
                                        context.request.currentExecutionFileStats = stats;
                                    }
                                    callback(null);
                                }
                            });
                        }
                    });
                })();
            } catch (e) {
                callback(e);
            }
        }
    }, {
        key: 'unmodifiedRequest',
        value: function unmodifiedRequest(context, executionPath, callback) {
            try {
                var _ret2 = function () {
                    var requestETag = context.request.headers['if-none-match'];
                    if (typeof requestETag === 'undefined' || requestETag == null) {
                        callback(null, false);
                        return {
                            v: void 0
                        };
                    }
                    _fs2.default.exists(executionPath, function (exists) {
                        try {
                            if (exists) {
                                _fs2.default.stat(executionPath, function (err, stats) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        if (!stats.isFile()) {
                                            callback(null, false);
                                        } else {
                                            //validate if-none-match
                                            var md5 = _crypto2.default.createHash('md5');
                                            md5.update(stats.mtime.toString());
                                            var responseETag = md5.digest('base64');
                                            return callback(null, requestETag == responseETag);
                                        }
                                    }
                                });
                            } else {
                                callback(null, false);
                            }
                        } catch (e) {
                            _utils.TraceUtils.log(e);
                            callback(null, false);
                        }
                    });
                }();

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            } catch (e) {
                _utils.TraceUtils.log(e);
                callback(null, false);
            }
        }

        /**
         *
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'preflightRequest',
        value: function preflightRequest(context, callback) {
            try {

                if (context && context.request.currentHandler instanceof StaticHandler) {
                    var headerNames = context.response["_headerNames"] || {};
                    if (typeof headerNames["access-control-allow-origin"] === 'undefined') {
                        if (context.request.headers.origin) {
                            context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                        } else {
                            context.response.setHeader("Access-Control-Allow-Origin", "*");
                        }
                    }
                    if (typeof headerNames["access-control-allow-headers"] === 'undefined') context.response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Content-Language, Accept, Accept-Language, Authorization");
                    if (typeof headerNames["access-control-allow-credentials"] === 'undefined') context.response.setHeader("Access-Control-Allow-Credentials", "true");
                    if (typeof headerNames["access-control-allow-methods"] === 'undefined') context.response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                }
                return callback();
            } catch (e) {
                callback(e);
            }
        }

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'postMapRequest',
        value: function postMapRequest(context, callback) {
            return StaticHandler.prototype.preflightRequest.call(this, context, callback);
        }

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         */

    }, {
        key: 'processRequest',
        value: function processRequest(context, callback) {
            callback = callback || function () {};
            try {
                if (context.is('OPTIONS')) {
                    //do nothing
                    return callback();
                }
                //get current execution path and validate once again file presence and MIME type
                var stats = context.request.currentExecutionFileStats;
                if (typeof stats === 'undefined' || stats == null) {
                    callback(new _errors.HttpServerError('Invalid request handler.'));
                    return;
                }
                if (!stats.isFile()) {
                    return callback(new _errors.HttpNotFoundError());
                } else {
                    var _ret3 = function () {
                        //get if-none-match header
                        var requestETag = context.request.headers['if-none-match'];
                        //generate responseETag
                        var md5 = _crypto2.default.createHash('md5');
                        md5.update(stats.mtime.toString());
                        var responseETag = md5.digest('base64');
                        if (requestETag) if (requestETag == responseETag) {
                            //context.response.writeHead(304, { 'Last-Modified':stats.mtime.toUTCString() });
                            context.response.writeHead(304, {});
                            context.response.end();
                            return {
                                v: callback.call(context)
                            };
                        }
                        //get file extension
                        var extensionName = _path2.default.extname(context.request.currentExecutionPath);
                        //get MIME collection
                        var mimes = context.application.config.mimes;
                        var contentType = null,
                            contentEncoding = null;
                        //find MIME type by extension
                        var mime = mimes.filter(function (x) {
                            return x.extension == extensionName;
                        })[0];
                        if (mime) {
                            contentType = mime.type;
                            if (mime.encoding) contentEncoding = mime.encoding;
                        }
                        //throw exception (MIME not found or access denied)
                        if (contentType == null) {
                            callback(new _errors.HttpForbiddenError());
                        } else {
                            //create stream
                            var source = _fs2.default.createReadStream(context.request.currentExecutionPath);
                            //write headers
                            context.response.writeHead(200, { 'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''), 'ETag': responseETag });
                            //response file
                            source.pipe(context.response);
                            //handle end
                            source.on('end', function () {
                                callback();
                            });
                            //handle error
                            source.on('error', function (err) {
                                callback(err);
                            });
                        }
                    }();

                    if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
                }
            } catch (e) {
                callback.call(context, e);
            }
        }
    }]);

    return StaticHandler;
}();

exports.default = StaticHandler;
//# sourceMappingURL=static.js.map
