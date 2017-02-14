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
exports.HtmlViewHelper = exports.HttpViewContext = exports.HttpController = exports.HttpViewResult = exports.HttpFileResult = exports.HttpRedirectResult = exports.HttpXmlResult = exports.HttpJavascriptResult = exports.HttpJsonResult = exports.HttpEmptyResult = exports.HttpContentResult = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _rx = require('rx');

var Rx = _interopRequireDefault(_rx).default;

var _fs = require('fs');

var fs = _interopRequireDefault(_fs).default;

var _util = require('util');

var util = _interopRequireDefault(_util).default;

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _crypto = require('crypto');

var crypto = _interopRequireDefault(_crypto).default;

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _mostXml = require('most-xml');

var xml = _interopRequireDefault(_mostXml).default;

var _errors = require('@themost/common/errors');

var HttpNotFoundError = _errors.HttpNotFoundError;
var HttpForbiddenError = _errors.HttpForbiddenError;
var HttpError = _errors.HttpError;

var _html = require('@themost/common/html');

var HtmlWriter = _html.HtmlWriter;

var _results = require('./results');

var HttpAnyResult = _results.HttpAnyResult;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @classdesc Represents a user-defined HTTP content result, typically an HTML or XML string.
 * @class
 * @augments HttpAnyResult
 * */
var HttpContentResult = exports.HttpContentResult = function (_HttpAnyResult) {
    _inherits(HttpContentResult, _HttpAnyResult);

    /**
     * @constructor
     * @param {string} content
     * @param {string=} contentType
     * @param {string=} contentEncoding
     */
    function HttpContentResult(content, contentType, contentEncoding) {
        _classCallCheck(this, HttpContentResult);

        var _this = _possibleConstructorReturn(this, (HttpContentResult.__proto__ || Object.getPrototypeOf(HttpContentResult)).call(this));

        _this.data = content;
        _this.contentType = contentType || 'text/html';
        _this.contentEncoding = contentEncoding || 'utf8';
        return _this;
    }

    /**
     *
     * @param {HttpContext} context
     */


    _createClass(HttpContentResult, [{
        key: 'execute',
        value: function execute(context) {
            var self = this;
            return Rx.Observable.fromNodeCallback(function (callback) {
                /**
                 * @type ServerResponse
                 * */
                var response = context.response;
                if (_.isNil(self.data)) {
                    response.writeHead(204);
                    return callback();
                } else {
                    response.writeHead(200, { 'Content-Type': self.contentType });
                    response.write(self.data, self.contentEncoding, function (err) {
                        return callback(err);
                    });
                }
            })();
        }
    }]);

    return HttpContentResult;
}(HttpAnyResult);

/**
 * @classdesc Represents an empty HTTP result.
 * @class
 * @augments HttpAnyResult
 */


var HttpEmptyResult = exports.HttpEmptyResult = function (_HttpAnyResult2) {
    _inherits(HttpEmptyResult, _HttpAnyResult2);

    function HttpEmptyResult() {
        _classCallCheck(this, HttpEmptyResult);

        return _possibleConstructorReturn(this, (HttpEmptyResult.__proto__ || Object.getPrototypeOf(HttpEmptyResult)).apply(this, arguments));
    }

    _createClass(HttpEmptyResult, [{
        key: 'execute',

        /**
         * @param context
         * @returns {Observable<T>|IteratorResult<T>|*}
         */
        value: function execute(context) {
            //do nothing
            context.response.writeHead(204);
            return Rx.Observable.return();
        }
    }]);

    return HttpEmptyResult;
}(HttpAnyResult);

/**
 * @param {string} key
 * @param {*} value
 * @returns {*}
 * @private
 */


function _json_ignore_null_replacer(key, value) {
    if (value == null) return undefined;
    return value;
}

/**
 * @classdesc Represents an action that is used to send JSON-formatted content.
 * @class
 * @augments HttpAnyResult
 */

var HttpJsonResult = exports.HttpJsonResult = function (_HttpAnyResult3) {
    _inherits(HttpJsonResult, _HttpAnyResult3);

    /**
     * @constructor
     * @param {*} data
     */
    function HttpJsonResult(data) {
        _classCallCheck(this, HttpJsonResult);

        var _this3 = _possibleConstructorReturn(this, (HttpJsonResult.__proto__ || Object.getPrototypeOf(HttpJsonResult)).call(this));

        if (data instanceof String) _this3.data = data;else {
            _this3.data = JSON.stringify(data, _json_ignore_null_replacer);
        }
        _this3.contentType = 'application/json;charset=utf-8';
        _this3.contentEncoding = 'utf8';
        return _this3;
    }

    /**
     * @param context
     * @returns {Observable<T>|IteratorResult<T>|*}
     */


    _createClass(HttpJsonResult, [{
        key: 'execute',
        value: function execute(context) {
            //do nothing
            context.response.writeHead(204);
            return Rx.Observable.return();
        }
    }]);

    return HttpJsonResult;
}(HttpAnyResult);

/**
 * @classdesc Represents an action that is used to send Javascript-formatted content.
 * @class
 * @augments HttpAnyResult
 */


var HttpJavascriptResult = exports.HttpJavascriptResult = function (_HttpAnyResult4) {
    _inherits(HttpJavascriptResult, _HttpAnyResult4);

    /**
     * @constructor
     * @param {*} data
     */
    function HttpJavascriptResult(data) {
        _classCallCheck(this, HttpJavascriptResult);

        var _this4 = _possibleConstructorReturn(this, (HttpJavascriptResult.__proto__ || Object.getPrototypeOf(HttpJavascriptResult)).call(this));

        if (typeof data === 'string') _this4.data = data;
        _this4.contentType = 'text/javascript;charset=utf-8';
        _this4.contentEncoding = 'utf8';
        return _this4;
    }

    return HttpJavascriptResult;
}(HttpAnyResult);

/**
 * @classdesc Represents an action that is used to send XML-formatted content.
 * @class
 * @augments HttpAnyResult
 */


var HttpXmlResult = exports.HttpXmlResult = function (_HttpAnyResult5) {
    _inherits(HttpXmlResult, _HttpAnyResult5);

    /**
     * @constructor
     * @param {*} data
     */
    function HttpXmlResult(data) {
        _classCallCheck(this, HttpXmlResult);

        var _this5 = _possibleConstructorReturn(this, (HttpXmlResult.__proto__ || Object.getPrototypeOf(HttpXmlResult)).call(this));

        _this5.contentType = 'text/xml';
        _this5.contentEncoding = 'utf8';
        if (typeof data === 'undefined' || data == null) return _possibleConstructorReturn(_this5);
        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') _this5.data = xml.serialize(data).outerXML();else _this5.data = data;
        return _this5;
    }

    return HttpXmlResult;
}(HttpAnyResult);

/**
 * @classdesc Represents a redirect action to a specified URI.
 * @class
 * @augments HttpAnyResult
 */


var HttpRedirectResult = exports.HttpRedirectResult = function (_HttpAnyResult6) {
    _inherits(HttpRedirectResult, _HttpAnyResult6);

    /**
     * @constructor
     * @param {string|*} url
     */
    function HttpRedirectResult(url) {
        _classCallCheck(this, HttpRedirectResult);

        var _this6 = _possibleConstructorReturn(this, (HttpRedirectResult.__proto__ || Object.getPrototypeOf(HttpRedirectResult)).call(this));

        _this6.url = url;
        return _this6;
    }

    /**
     *
     * @param {HttpContext} context
     */


    _createClass(HttpRedirectResult, [{
        key: 'execute',
        value: function execute(context) {
            /**
             * @type ServerResponse
             * */
            var response = context.response;
            response.writeHead(302, { 'Location': this.url });
            return Rx.Observable.return();
        }
    }]);

    return HttpRedirectResult;
}(HttpAnyResult);

/**
 * @classdesc Represents a static file result
 * @class
 * @augments HttpAnyResult
 */


var HttpFileResult = exports.HttpFileResult = function (_HttpAnyResult7) {
    _inherits(HttpFileResult, _HttpAnyResult7);

    /**
     *
     * @constructor
     * @param {string} physicalPath
     * @param {string=} fileName
     */
    function HttpFileResult(physicalPath, fileName) {
        _classCallCheck(this, HttpFileResult);

        var _this7 = _possibleConstructorReturn(this, (HttpFileResult.__proto__ || Object.getPrototypeOf(HttpFileResult)).call(this));

        _this7.physicalPath = physicalPath;
        _this7.fileName = fileName;
        return _this7;
    }

    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */


    _createClass(HttpFileResult, [{
        key: 'execute',
        value: function execute(context, callback) {
            callback = callback || function () {};
            var physicalPath = this.physicalPath,
                fileName = this.fileName;
            fs.exists(physicalPath, function (exists) {
                if (!exists) {
                    callback(new HttpNotFoundError());
                } else {
                    try {
                        fs.stat(physicalPath, function (err, stats) {
                            if (err) {
                                callback(err);
                            } else {
                                if (!stats.isFile()) {
                                    callback(new HttpNotFoundError());
                                } else {
                                    var _ret = function () {
                                        //get if-none-match header
                                        var requestETag = context.request.headers['if-none-match'];
                                        //generate responseETag
                                        var md5 = crypto.createHash('md5');
                                        md5.update(stats.mtime.toString());
                                        var responseETag = md5.digest('base64');
                                        if (requestETag) {
                                            if (requestETag == responseETag) {
                                                context.response.writeHead(304);
                                                context.response.end();
                                                callback();
                                                return {
                                                    v: void 0
                                                };
                                            }
                                        }
                                        var contentType = null;
                                        //get file extension
                                        var extensionName = path.extname(fileName || physicalPath);
                                        //get MIME collection
                                        var mimes = context.getApplication().config.mimes;
                                        var contentEncoding = null;
                                        //find MIME type by extension
                                        var mime = mimes.filter(function (x) {
                                            return x.extension == extensionName;
                                        })[0];
                                        if (mime) {
                                            contentType = mime.type;
                                            if (mime.encoding) contentEncoding = mime.encoding;
                                        }

                                        //throw exception (MIME not found or access denied)
                                        if (_.isNil(contentType)) {
                                            callback(new HttpForbiddenError());
                                        } else {
                                            //create read stream
                                            var source = fs.createReadStream(physicalPath);
                                            //add Content-Disposition: attachment; filename="<file name.ext>"
                                            context.response.writeHead(200, {
                                                'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''),
                                                'ETag': responseETag
                                            });
                                            //copy file
                                            source.pipe(context.response);
                                            source.on('end', function () {
                                                callback();
                                            });
                                            source.on('error', function (err) {
                                                callback(err);
                                            });
                                        }
                                    }();

                                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                                }
                            }
                        });
                    } catch (e) {
                        callback(e);
                    }
                }
            });
        }
    }]);

    return HttpFileResult;
}(HttpAnyResult);

/**
 * @param controller
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */


function queryDefaultViewPath(controller, view, extension, callback) {
    return queryAbsoluteViewPath.call(this, this.getApplication().mapExecutionPath('views'), controller, view, extension, callback);
}
/**
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */
function querySharedViewPath(view, extension, callback) {
    return queryAbsoluteViewPath.call(this, this.getApplication().mapExecutionPath('views'), 'shared', view, extension, callback);
}

/**
 * @param search
 * @param controller
 * @param view
 * @param extension
 * @param callback
 * @private
 */
function queryAbsoluteViewPath(search, controller, view, extension, callback) {
    var result = path.resolve(search, util.format('%s/%s.html.%s', controller, view, extension));
    fs.exists(result, function (exists) {
        if (exists) return callback(null, result);
        //search for capitalized controller name e.g. person as Person
        var capitalizedController = controller.charAt(0).toUpperCase() + controller.substring(1);
        result = path.resolve(search, util.format('%s/%s.html.%s', capitalizedController, view, extension));
        fs.exists(result, function (exists) {
            if (exists) return callback(null, result);
            callback();
        });
    });
}
/**
 * @param {string} p
 * @returns {boolean}
 * @private
 */
function isAbsolute(p) {
    //var re = new RegExp('^' + p, 'i');
    //return re.test(path.resolve(process.cwd(), p));
    return path.normalize(p + '/') === path.normalize(path.resolve(p) + '/');
}

/**
 * Represents a class that is used to render a view.
 * @class
 * @param {string=} name - The name of the view.
 * @param {Array=} data - The data that are going to be used to render the view.
 * @augments HttpAnyResult
 */

var HttpViewResult = exports.HttpViewResult = function (_HttpAnyResult8) {
    _inherits(HttpViewResult, _HttpAnyResult8);

    function HttpViewResult(name, data) {
        _classCallCheck(this, HttpViewResult);

        var _this8 = _possibleConstructorReturn(this, (HttpViewResult.__proto__ || Object.getPrototypeOf(HttpViewResult)).call(this));

        _this8.name = name;
        _this8.data = data == undefined ? [] : data;
        _this8.contentType = 'text/html;charset=utf-8';
        _this8.contentEncoding = 'utf8';
        return _this8;
    }

    /**
     * Sets or changes the name of this HttpViewResult instance.
     * @param {string} s
     * @returns {HttpViewResult}
     */


    _createClass(HttpViewResult, [{
        key: 'setName',
        value: function setName(s) {
            this.name = s;
            return this;
        }

        /**
         * @param {HttpContext} context
         * @param {Function} callback
         * */

    }, {
        key: 'execute',
        value: function execute(context, callback) {
            var self = this;
            callback = callback || function () {};
            var util = require('util'),
                fs = require('fs');
            /**
             * @type ServerResponse
             * */
            var response = context.response;
            //if the name is not defined get the action name of the current controller
            if (!this.name)
                //get action name
                this.name = context.request.routeData['action'];
            //validate [path] route param in order to load a view that is located in a views' sub-directory (or in another absolute path)
            var routePath = void 0;
            if (context.request.route) {
                routePath = context.request.route.path;
            }
            //get view name
            var viewName = this.name;
            if (/^partial/.test(viewName)) {
                //partial view
                viewName = viewName.substr(7).replace(/^-/, '');
                context.request.route.partial = true;
            }

            //and of course controller's name
            var controllerName = context.request.routeData['controller'];
            //enumerate existing view engines e.g /views/controller/index.[html].ejs or /views/controller/index.[html].xform etc.
            /**
             * {HttpViewEngineReference|*}
             */
            var viewPath = void 0,
                viewEngine = void 0;
            async.eachSeries(context.getApplication().getConfiguration().engines, function (engine, cb) {
                if (viewPath) {
                    cb();return;
                }
                if (routePath && isAbsolute(routePath)) {
                    queryAbsoluteViewPath.call(context, routePath, controllerName, viewName, engine.extension, function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        if (result) {
                            viewPath = result;
                            viewEngine = engine;
                            return cb();
                        } else {
                            return cb();
                        }
                    });
                } else {
                    (function () {
                        var searchViewName = viewName;
                        if (routePath) {
                            searchViewName = path.join(routePath, viewName);
                        }
                        //search by relative path
                        queryDefaultViewPath.call(context, controllerName, searchViewName, engine.extension, function (err, result) {
                            if (err) {
                                return cb(err);
                            }
                            if (result) {
                                viewPath = result;
                                viewEngine = engine;
                                return cb();
                            } else {
                                querySharedViewPath.call(context, searchViewName, engine.extension, function (err, result) {
                                    if (err) {
                                        return cb(err);
                                    }
                                    if (result) {
                                        viewPath = result;
                                        viewEngine = engine;
                                        return cb();
                                    }
                                    cb();
                                });
                            }
                        });
                    })();
                }
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                if (viewEngine) {
                    var EngineCtor = require(viewEngine.type);
                    if (typeof EngineCtor !== 'function') {
                        return callback(new ReferenceError(util.format('The specified engine %s module does not export default class', viewEngine.type)));
                    }
                    /**
                     * @type {HttpViewEngine|*}
                     */
                    var engineInstance = new EngineCtor(context);
                    return engineInstance.render(viewPath, self.data, function (err, result) {
                        if (err) {
                            return callback(err);
                        } else {
                            response.writeHead(200, { "Content-Type": self.contentType });
                            response.write(result, self.contentEncoding);
                            return callback();
                        }
                    });
                } else {
                    var err1 = new HttpNotFoundError();
                    if (context.request && context.request.url) {
                        err1.resource = context.request.url;
                    }
                    return callback(err1);
                }
            });
        }
    }]);

    return HttpViewResult;
}(HttpAnyResult);

/**
 * @classdesc Provides methods that respond to HTTP requests that are made to a web application
 * @class
 * @constructor
 * @param {HttpContext} context - The executing HTTP context.
 * @property {HttpContext} context - Gets or sets the HTTP context associated with this controller
 * @property {string} name - Gets or sets the internal name for this controller
 * */


var HttpController = function () {
    function HttpController(context) {
        _classCallCheck(this, HttpController);

        this.context = context;
    }

    /**
     * Creates a view result object for the given request.
     * @param {*=} data
     * @returns {Observable}
     */


    _createClass(HttpController, [{
        key: 'view',
        value: function view(data) {
            return new HttpViewResult(null, data).toObservable();
        }
    }, {
        key: 'forbidden',
        value: function forbidden(callback) {
            callback(new HttpForbiddenError());
        }
        /**
         * Creates a view result object for the given request.
         * @param {*=} data
         * @returns HttpViewResult
         * */

    }, {
        key: 'html',
        value: function html(data) {
            return new HttpViewResult(null, data);
        }

        /**
         * Creates a view result object for the given request.
         * @param {*=} data
         * @returns HttpViewResult
         * */

    }, {
        key: 'htm',
        value: function htm(data) {
            return new HttpViewResult(null, data);
        }

        /**
         * Creates a view result object for the given request.
         * @param {String=} data
         * @returns HttpJavascriptResult
         * */

    }, {
        key: 'js',
        value: function js(data) {
            return new HttpJavascriptResult(data);
        }

        /**
         * Creates a view result object that represents a client javascript object.
         * This result may be used for sharing specific objects stored in memory or server filesystem
         * e.g. serve a *.json file as a client variable with name window.myVar1 or
         * serve user settings object ({ culture: 'en-US', notifyMe: false}) as a variable with name window.settings
         * @param {String} name
         * @param {String|*} obj
         * @returns HttpAnyResult
         * */

    }, {
        key: 'jsvar',
        value: function jsvar(name, obj) {
            if (typeof name !== 'string') return new HttpEmptyResult();
            if (name.length == 0) return new HttpEmptyResult();
            if (typeof obj === 'undefined' || obj == null) return new HttpJavascriptResult(name.concat(' = null;'));else if (obj instanceof Date) return new HttpJavascriptResult(name.concat(' = new Date(', obj.valueOf(), ');'));else if (typeof obj === 'string') return new HttpJavascriptResult(name.concat(' = ', obj, ';'));else return new HttpJavascriptResult(name.concat(' = ', JSON.stringify(obj), ';'));
        }

        /**
         * Invokes a default action and returns an HttpViewResult instance
         * @returns {Observable}
         */

    }, {
        key: 'action',
        value: function action() {
            return this.view();
        }

        /**
         * Creates a content result object by using a string.
         * @returns HttpContentResult
         * */

    }, {
        key: 'content',
        value: function content(_content) {
            return new HttpContentResult(_content);
        }

        /**
         * Creates a JSON result object by using the specified data.
         * @returns HttpJsonResult
         * */

    }, {
        key: 'json',
        value: function json(data) {
            return new HttpJsonResult(data);
        }

        /**
         * Creates a XML result object by using the specified data.
         * @returns HttpXmlResult
         * */

    }, {
        key: 'xml',
        value: function xml(data) {
            return new HttpXmlResult(data);
        }

        /**
         * Creates a binary file result object by using the specified path.
         * @param {string}  physicalPath
         * @param {string=}  fileName
         * @returns {HttpFileResult|HttpAnyResult}
         * */

    }, {
        key: 'file',
        value: function file(physicalPath, fileName) {
            return new HttpFileResult(physicalPath, fileName);
        }

        /**
         * Creates a redirect result object that redirects to the specified URL.
         * @returns HttpRedirectResult
         * */

    }, {
        key: 'redirect',
        value: function redirect(url) {
            return new HttpRedirectResult(url);
        }

        /**
         * Creates an empty result object.
         * @returns HttpEmptyResult
         * */

    }, {
        key: 'empty',
        value: function empty() {
            return new HttpEmptyResult();
        }
    }]);

    return HttpController;
}();

/**
 * Creates a view result object for the given request.
 * @param {*=} data
 * @returns HttpViewResult
 * */


exports.HttpController = HttpController;
HttpController.prototype.htm = HttpController.prototype.html;

/**
 * Encapsulates information that is related to rendering a view.
 * @class
 * @param {HttpContext} context
 * @property {DataModel} model
 * @property {HtmlViewHelper} html
 * @constructor
 * @augments {EventEmitter}
 */

var HttpViewContext = exports.HttpViewContext = function () {
    function HttpViewContext(context) {
        _classCallCheck(this, HttpViewContext);

        /**
         * Gets or sets the body of the current view
         * @type {String}
         */
        this.body = '';
        /**
         * Gets or sets the title of the page if the view will be fully rendered
         * @type {String}
         */
        this.title = '';
        /**
         * Gets or sets the view layout page if the view will be fully rendered
         * @type {String}
         */
        this.layout = null;
        /**
         * Gets or sets the view data
         * @type {String}
         */
        this.data = null;
        /**
         * Represents the current HTTP context
         * @type {HttpContext}
         */
        this.context = context;

        /**
         * @type {HtmlWriter}
         */
        this.writer = undefined;

        var writer = null;
        Object.defineProperty(this, 'writer', {
            get: function get() {
                if (writer) return writer;
                writer = new HtmlWriter();
                writer.indent = false;
                return writer;
            }, configurable: false, enumerable: false
        });

        var self = this;
        Object.defineProperty(this, 'model', {
            get: function get() {
                if (self.context.params) if (self.context.params.controller) return self.context.model(self.context.params.controller);
                return null;
            }, configurable: false, enumerable: false
        });

        this.html = new HtmlViewHelper(this);
        //class extension initiators
        if (typeof this.init === 'function') {
            //call init() method
            this.init();
        }
    }

    /**
     * @param {string} url
     * @param {Function} callback
     * @returns {string}
     */


    _createClass(HttpViewContext, [{
        key: 'render',
        value: function render(url, callback) {
            callback = callback || function () {};
            //get response cookie, if any
            var requestCookie = this.context.response.getHeader('set-cookie');
            if (typeof this.context.request.headers.cookie !== 'undefined') requestCookie = this.context.request.headers.cookie;
            this.context.application.executeRequest({ url: url, cookie: requestCookie }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result.body);
                }
            });
        }
    }, {
        key: 'init',
        value: function init() {}
        //


        /**
         *
         * @param {String} s
         * @param {String=} lib
         * @returns {String}
         */

    }, {
        key: 'translate',
        value: function translate(s, lib) {
            return this.context.translate(s, lib);
        }

        /**
         * @param {HttpViewContext} $view
         * @returns {*}
         * @private
         */

    }], [{
        key: 'HtmlViewHelper',
        value: function HtmlViewHelper($view) {
            var doc = void 0;
            return {
                antiforgery: function antiforgery() {
                    //create token
                    var context = $view.context,
                        value = context.application.encrypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url: context.request.url, date: new Date() }));
                    //try to set cookie
                    context.response.setHeader('Set-Cookie', '.CSRF='.concat(value));
                    return $view.writer.writeAttribute('type', 'hidden').writeAttribute('id', '_CSRFToken').writeAttribute('name', '_CSRFToken').writeAttribute('value', value).writeFullBeginTag('input').toString();
                },
                element: function element(obj) {
                    if (typeof doc === 'undefined') {
                        doc = $view.context.application.document();
                    }
                    return doc.parentWindow.angular.element(obj);
                },
                lang: function lang() {
                    var context = $view.context,
                        c = context.culture();
                    if (typeof c === 'string') {
                        if (c.length >= 2) {
                            return c.toLowerCase().substring(0, 2);
                        }
                    }
                    //in all cases return default culture
                    return 'en';
                }
            };
        }
    }]);

    return HttpViewContext;
}();

/**
 * @classdesc A helper class for an instance of HttpViewContext class
 * @class
 * @property {HttpViewContext} parent - The parent HTTP View Context
 * @property {HTMLDocument|*} document - The in-process HTML Document
 */


var HtmlViewHelper = exports.HtmlViewHelper = function () {
    /**
     * @constructor
     * @param {HttpViewContext} view
     */
    function HtmlViewHelper(view) {
        _classCallCheck(this, HtmlViewHelper);

        var document = void 0;
        var self = this;
        Object.defineProperty(this, 'parent', {
            get: function get() {
                return view;
            }, configurable: false, enumerable: false
        });
        Object.defineProperty(this, 'document', {
            get: function get() {
                if (typeof document !== 'undefined') {
                    return document;
                }
                document = self.view.context.application.document();
                return document;
            }, configurable: false, enumerable: false
        });
    }

    _createClass(HtmlViewHelper, [{
        key: 'antiforgery',
        value: function antiforgery() {
            var $view = this.parent;
            //create token
            var context = $view.context,
                value = context.application.encrypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url: context.request.url, date: new Date() }));
            //try to set cookie
            context.response.setHeader('Set-Cookie', '.CSRF='.concat(value));
            return $view.writer.writeAttribute('type', 'hidden').writeAttribute('id', '_CSRFToken').writeAttribute('name', '_CSRFToken').writeAttribute('value', value).writeFullBeginTag('input').toString();
        }
    }, {
        key: 'element',
        value: function element(obj) {
            return this.document.parentWindow.angular.element(obj);
        }
    }, {
        key: 'lang',
        value: function lang() {
            var $view = this.parent;
            var context = $view.context,
                c = context.culture();
            if (typeof c === 'string') {
                if (c.length >= 2) {
                    return c.toLowerCase().substring(0, 2);
                }
            }
            //in all cases return default culture
            return 'en';
        }
    }]);

    return HtmlViewHelper;
}();
//# sourceMappingURL=mvc.js.map
