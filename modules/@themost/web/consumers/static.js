'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MapStaticContentConsumer = exports.StaticContentConsumer = undefined;

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

var _errors = require('@themost/common/errors');

var HttpServerError = _errors.HttpServerError;
var HttpNotFoundError = _errors.HttpNotFoundError;
var HttpForbiddenError = _errors.HttpForbiddenError;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _fs = require('fs');

var fs = _interopRequireDefault(_fs).default;

var _url = require('url');

var url = _interopRequireDefault(_url).default;

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _crypto = require('crypto');

var crypto = _interopRequireDefault(_crypto).default;

var _consumers = require('../consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _results = require('../results');

var HttpNextResult = _results.HttpNextResult;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @classdesc Default static content handler (as it has been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
 */
var StaticHandler = function () {

    /**
     *
     * @param {string=} rootDir
     */
    function StaticHandler(rootDir) {
        _classCallCheck(this, StaticHandler);

        this.rootDir = rootDir || './app';
        this.whenDir = '/';
    }

    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */


    _createClass(StaticHandler, [{
        key: 'mapRequest',
        value: function mapRequest(context, callback) {
            callback = callback || function () {};
            try {
                var uri = url.parse(context.request.url).pathname;
                if (_.isString(this.whenDir) && this.whenDir !== '/') {
                    var re = new RegExp('^' + _.escapeRegExp(this.whenDir), 'ig');
                    if (!re.test(uri)) {
                        return callback(null, false);
                    } else {
                        uri = uri.replace(re, '');
                    }
                }
                var filePath = path.join(this.rootDir, uri);
                fs.exists(filePath, function (exists) {
                    if (!exists) {
                        return callback(null, false);
                    } else {
                        fs.stat(filePath, function (err, stats) {
                            if (err) {
                                return callback(err);
                            }
                            //if file exists
                            if (stats && stats.isFile()) {
                                //set request current handler
                                context.request.currentHandler = new StaticHandler();
                                //set current execution path
                                context.request.currentExecutionPath = filePath;
                                //set file stats
                                context.request.currentExecutionFileStats = stats;
                                //return true
                                return callback(null, true);
                            }
                            return callback(null, false);
                        });
                    }
                });
            } catch (err) {
                return callback(err);
            }
        }
    }, {
        key: 'unmodifiedRequest',
        value: function unmodifiedRequest(context, executionPath, callback) {
            try {
                var requestETag = context.request.headers['if-none-match'];
                if (typeof requestETag === 'undefined' || requestETag === null) {
                    callback(null, false);
                    return;
                }
                fs.exists(executionPath, function (exists) {
                    try {
                        if (exists) {
                            fs.stat(executionPath, function (err, stats) {
                                if (err) {
                                    callback(err);
                                } else {
                                    if (!stats.isFile()) {
                                        callback(null, false);
                                    } else {
                                        //validate if-none-match
                                        var md5 = crypto.createHash('md5');
                                        md5.update(stats.mtime.toString());
                                        var responseETag = md5.digest('base64');
                                        return callback(null, requestETag === responseETag);
                                    }
                                }
                            });
                        } else {
                            callback(null, false);
                        }
                    } catch (e) {
                        TraceUtils.log(e);
                        callback(null, false);
                    }
                });
            } catch (e) {
                TraceUtils.log(e);
                callback(null, false);
            }
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
                if (_.isNil(stats)) {
                    return callback(new HttpServerError('Invalid request handler.'));
                }
                if (!stats.isFile()) {
                    return callback(new HttpNotFoundError());
                } else {
                    //get if-none-match header
                    var requestETag = context.request.headers['if-none-match'];
                    //generate responseETag
                    var md5 = crypto.createHash('md5');
                    md5.update(stats.mtime.toString());
                    var responseETag = md5.digest('base64');
                    if (requestETag) if (requestETag === responseETag) {
                        //context.response.writeHead(304, { 'Last-Modified':stats.mtime.toUTCString() });
                        context.response.writeHead(304, {});
                        context.response.end();
                        return callback();
                    }
                    //get file extension
                    var extensionName = path.extname(context.request.currentExecutionPath);
                    //get MIME collection
                    var contentType = null,
                        contentEncoding = null;
                    //find MIME type by extension
                    var mime = context.getApplication().getConfiguration().getMimeType(extensionName);
                    if (mime) {
                        contentType = mime.type;
                        if (mime.encoding) contentEncoding = mime.encoding;
                    }
                    //throw exception (MIME not found or access denied)
                    if (contentType === null) {
                        return callback(new HttpForbiddenError());
                    } else {
                        //create stream
                        var source = fs.createReadStream(context.request.currentExecutionPath);
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
                }
            } catch (err) {
                return callback(err);
            }
        }
    }]);

    return StaticHandler;
}();

var StaticContentConsumer = exports.StaticContentConsumer = function (_HttpConsumer) {
    _inherits(StaticContentConsumer, _HttpConsumer);

    /**
     * @param {string=} rootDir
     * @constructor
     */
    function StaticContentConsumer(rootDir) {
        _classCallCheck(this, StaticContentConsumer);

        return _possibleConstructorReturn(this, (StaticContentConsumer.__proto__ || Object.getPrototypeOf(StaticContentConsumer)).call(this, function (context) {
            try {
                var handler = new StaticHandler(rootDir);
                return Q.nfbind(handler.mapRequest.bind(handler))(context).then(function (res) {
                    if (res) {
                        return Q.nfbind(handler.processRequest.bind(handler))(context);
                    }
                    return HttpNextResult.create().toPromise();
                });
            } catch (err) {
                return Q.reject(err);
            }
        }));
    }

    return StaticContentConsumer;
}(HttpConsumer);

var MapStaticContentConsumer = exports.MapStaticContentConsumer = function (_HttpConsumer2) {
    _inherits(MapStaticContentConsumer, _HttpConsumer2);

    /**
     * @param {string=} whenDir
     * @param {string=} rootDir
     * @constructor
     */
    function MapStaticContentConsumer(whenDir, rootDir) {
        _classCallCheck(this, MapStaticContentConsumer);

        return _possibleConstructorReturn(this, (MapStaticContentConsumer.__proto__ || Object.getPrototypeOf(MapStaticContentConsumer)).call(this, function (context) {
            try {
                var handler = new StaticHandler(rootDir);
                handler.whenDir = whenDir;
                return Q.nfbind(handler.mapRequest.bind(handler))(context).then(function (res) {
                    if (res) {
                        return Q.nfbind(handler.processRequest.bind(handler))(context);
                    }
                    return HttpNextResult.create().toPromise();
                });
            } catch (err) {
                return Q.reject(err);
            }
        }));
    }

    return MapStaticContentConsumer;
}(HttpConsumer);
//# sourceMappingURL=static.js.map
