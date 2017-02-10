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
exports.HtmlViewHelper = exports.HttpViewContext = exports.HttpViewEngineReference = exports.HttpViewEngine = exports.HttpController = exports.HttpViewResult = exports.HttpFileResult = exports.HttpRedirectResult = exports.HttpXmlResult = exports.HttpJavascriptResult = exports.HttpJsonResult = exports.HttpEmptyResult = exports.HttpContentResult = exports.HttpResult = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

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

var _emitter = require('@themost/common/emitter');

var SequentialEventEmitter = _emitter.SequentialEventEmitter;

var _html = require('@themost/common/html');

var HtmlWriter = _html.HtmlWriter;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @classdesc Represents an HTTP result
 * @class
 * @property {*} data - Gets or sets the data associated with the HTTP result
 */
var HttpResult = function () {
    function HttpResult() {
        _classCallCheck(this, HttpResult);

        this.contentType = 'text/html';
        this.contentEncoding = 'utf8';
    }

    /**
     *
     * @param {Number=} status
     */


    _createClass(HttpResult, [{
        key: 'status',
        value: function status(_status) {
            this.responseStatus = _status;
            return this;
        }

        /**
         * Executes an HttpResult instance against an existing HttpContext.
         * @param {HttpContext} context
         * @param {Function} callback
         * */

    }, {
        key: 'execute',
        value: function execute(context, callback) {
            var self = this;
            callback = callback || function () {};
            try {
                var response = context.response;
                if (_.isNil(self.data)) {
                    response.writeHead(204);
                    return callback.call(context);
                }
                response.writeHead(this.responseStatus || 200, { "Content-Type": this.contentType });
                response.write(self.data, this.contentEncoding);
                return callback.call(context);
            } catch (err) {
                callback.call(context, err);
            }
        }
    }]);

    return HttpResult;
}();

/**
 * @classdesc Represents a user-defined HTTP content result, typically an HTML or XML string.
 * @class
 * @augments HttpResult
 * */


exports.HttpResult = HttpResult;

var HttpContentResult = exports.HttpContentResult = function (_HttpResult) {
    _inherits(HttpContentResult, _HttpResult);

    /**
     * @constructor
     * @param {string} content
     */
    function HttpContentResult(content) {
        _classCallCheck(this, HttpContentResult);

        var _this = _possibleConstructorReturn(this, (HttpContentResult.__proto__ || Object.getPrototypeOf(HttpContentResult)).call(this));

        _this.data = content;
        _this.contentType = 'text/html';
        _this.contentEncoding = 'utf8';
        return _this;
    }

    return HttpContentResult;
}(HttpResult);

/**
 * @classdesc Represents an empty HTTP result.
 * @class
 * @augments HttpResult
 */


var HttpEmptyResult = exports.HttpEmptyResult = function (_HttpResult2) {
    _inherits(HttpEmptyResult, _HttpResult2);

    function HttpEmptyResult() {
        _classCallCheck(this, HttpEmptyResult);

        return _possibleConstructorReturn(this, (HttpEmptyResult.__proto__ || Object.getPrototypeOf(HttpEmptyResult)).apply(this, arguments));
    }

    _createClass(HttpEmptyResult, [{
        key: 'execute',
        value: function execute(context, callback) {
            //do nothing
            callback = callback || function () {};
            callback.call(context);
        }
    }]);

    return HttpEmptyResult;
}(HttpResult);

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
 * @augments HttpResult
 */

var HttpJsonResult = exports.HttpJsonResult = function (_HttpResult3) {
    _inherits(HttpJsonResult, _HttpResult3);

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

    return HttpJsonResult;
}(HttpResult);

/**
 * @classdesc Represents an action that is used to send Javascript-formatted content.
 * @class
 * @augments HttpResult
 */


var HttpJavascriptResult = exports.HttpJavascriptResult = function (_HttpResult4) {
    _inherits(HttpJavascriptResult, _HttpResult4);

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
}(HttpResult);

/**
 * @classdesc Represents an action that is used to send XML-formatted content.
 * @class
 * @augments HttpResult
 */


var HttpXmlResult = exports.HttpXmlResult = function (_HttpResult5) {
    _inherits(HttpXmlResult, _HttpResult5);

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
        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') _this5.data = xml.serialize(data, { item: 'Item' }).outerXML();else _this5.data = data;
        return _this5;
    }

    return HttpXmlResult;
}(HttpResult);

/**
 * @classdesc Represents a redirect action to a specified URI.
 * @class
 * @augments HttpResult
 */


var HttpRedirectResult = exports.HttpRedirectResult = function (_HttpResult6) {
    _inherits(HttpRedirectResult, _HttpResult6);

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
     * @param {Function} callback
     */


    _createClass(HttpRedirectResult, [{
        key: 'execute',
        value: function execute(context, callback) {
            /**
             * @type ServerResponse
             * */
            var response = context.response;
            response.writeHead(302, { 'Location': this.url });
            //response.end();
            callback.call(context);
        }
    }]);

    return HttpRedirectResult;
}(HttpResult);

/**
 * @classdesc Represents a static file result
 * @class
 * @augments HttpResult
 */


var HttpFileResult = exports.HttpFileResult = function (_HttpResult7) {
    _inherits(HttpFileResult, _HttpResult7);

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
                fileName = this.fileName,
                app = require('./index');
            fs.exists(physicalPath, function (exists) {
                if (!exists) {
                    callback(new app.HttpNotFoundError());
                } else {
                    try {
                        fs.stat(physicalPath, function (err, stats) {
                            if (err) {
                                callback(err);
                            } else {
                                if (!stats.isFile()) {
                                    callback(new app.HttpNotFoundError());
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
                                            callback(new app.HttpForbiddenError());
                                        } else {
                                            /*//finally process request
                                            fs.readFile(physicalPath, 'binary', function (err, data) {
                                                if (err) {
                                                    callback(e);
                                                }
                                                else {
                                                    //add Content-Disposition: attachment; filename="<file name.ext>"
                                                    context.response.writeHead(200, {
                                                        'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''),
                                                        'ETag': responseETag
                                                    });
                                                    context.response.write(data, "binary");
                                                    callback();
                                                }
                                            });*/
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
}(HttpResult);

/**
 * @param controller
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */


function queryDefaultViewPath(controller, view, extension, callback) {
    return queryAbsoluteViewPath.call(this, this.application.mapPath('/views'), controller, view, extension, callback);
}
/**
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */
function querySharedViewPath(view, extension, callback) {
    return queryAbsoluteViewPath.call(this, this.application.mapPath('/views'), 'shared', view, extension, callback);
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
 * @augments HttpResult
 */

var HttpViewResult = exports.HttpViewResult = function (_HttpResult8) {
    _inherits(HttpViewResult, _HttpResult8);

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
            var app = require('./index'),
                util = require('util'),
                fs = require('fs');
            /**
             * @type ServerResponse
             * */
            var response = context.response;
            //if the name is not defined get the action name of the current controller
            if (!this.name)
                //get action name
                this.name = context.data['action'];
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
            var controllerName = context.data['controller'];
            //enumerate existing view engines e.g /views/controller/index.[html].ejs or /views/controller/index.[html].xform etc.
            /**
             * {HttpViewEngineReference|*}
             */
            var viewPath = void 0,
                viewEngine = void 0;
            async.eachSeries(context.application.config.engines, function (engine, cb) {
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
                    callback(err);return;
                }
                if (viewEngine) {
                    var _ret3 = function () {
                        var engine = require(viewEngine.type);
                        var EngineCtor = engine.default;
                        if (typeof EngineCtor !== 'function') {
                            return {
                                v: callback(new ReferenceError(util.format('The specified engine %s module does not export default class', viewEngine.type)))
                            };
                        }
                        /**
                         * @type {HttpViewEngine|*}
                         */
                        var engineInstance = new EngineCtor(context);
                        //render
                        var e = { context: context, target: self };
                        context.emit('preExecuteResult', e, function (err) {
                            if (err) {
                                callback(err);
                            } else {
                                engineInstance.render(viewPath, self.data, function (err, result) {
                                    if (err) {
                                        callback.call(context, err);
                                    } else {
                                        //HttpViewResult.result or data (?)
                                        self.result = result;
                                        context.emit('postExecuteResult', e, function (err) {
                                            if (err) {
                                                callback.call(context, err);
                                            } else {
                                                response.writeHead(200, { "Content-Type": self.contentType });
                                                response.write(self.result, self.contentEncoding);
                                                callback.call(context);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }();

                    if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
                } else {
                    var er = new HttpNotFoundError();
                    if (context.request && context.request.url) {
                        er.resource = context.request.url;
                    }
                    callback.call(context, er);
                }
            });
        }
    }]);

    return HttpViewResult;
}(HttpResult);

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
     * @returns {HttpViewResult}
     */


    _createClass(HttpController, [{
        key: 'view',
        value: function view(data) {
            return new HttpViewResult(null, data);
        }

        /**
         * Creates a view result based on the context content type
         * @param {*=} data
         * @returns HttpViewResult
         * */

    }, {
        key: 'result',
        value: function result(data) {
            if (this.context) {
                var fn = this[this.context.format];
                if (typeof fn !== 'function') throw new HttpError(400, 'Not implemented.');
                return fn.call(this, data);
            } else throw new Error('Http context cannot be empty at this context.');
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
         * @returns HttpResult
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
         * @param {Function} callback
         */

    }, {
        key: 'action',
        value: function action(callback) {
            callback(null, this.view());
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
         * @returns {HttpFileResult|HttpResult}
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
 * @classdesc An abstract class which represents a view engine
 * @abstract
 * @class
 * @property {HttpContext} context
 * @augments {EventEmitter}
 */

var HttpViewEngine = exports.HttpViewEngine = function (_SequentialEventEmitt) {
    _inherits(HttpViewEngine, _SequentialEventEmitt);

    /**
     * @constructor
     * @param {HttpContext=} context
     */
    function HttpViewEngine(context) {
        _classCallCheck(this, HttpViewEngine);

        var _this9 = _possibleConstructorReturn(this, (HttpViewEngine.__proto__ || Object.getPrototypeOf(HttpViewEngine)).call(this));

        if (new.target === HttpViewEngine) {
            throw new TypeError("Cannot construct abstract instances directly");
        }
        _this9.context = context;
        return _this9;
    }

    /**
     * Renders the specified view with the options provided
     * @param {string} url
     * @param {*} options
     * @param {Function} callback
     */


    _createClass(HttpViewEngine, [{
        key: 'render',
        value: function render(url, options, callback) {
            //
        }
    }]);

    return HttpViewEngine;
}(SequentialEventEmitter);

/**
 * @classdesc Represents an HTTP view engine in application configuration
 * @abstract
 * @class
 * @property {string} type - Gets or sets the class associated with an HTTP view engine
 * @property {string} name - Gets or sets the name of an HTTP view engine
 * @property {string} extension - Gets or sets the layout extension associated with an HTTP view engine
 */


var HttpViewEngineReference =
/**
 * @constructor
 */
exports.HttpViewEngineReference = function HttpViewEngineReference() {
    _classCallCheck(this, HttpViewEngineReference);

    if (new.target === HttpViewEngineReference) {
        throw new TypeError("Cannot construct abstract instances directly");
    }
};

/**
 * Encapsulates information that is related to rendering a view.
 * @class
 * @param {HttpContext} context
 * @property {DataModel} model
 * @property {HtmlViewHelper} html
 * @constructor
 * @augments {EventEmitter}
 */


var HttpViewContext = exports.HttpViewContext = function (_SequentialEventEmitt2) {
    _inherits(HttpViewContext, _SequentialEventEmitt2);

    function HttpViewContext(context) {
        _classCallCheck(this, HttpViewContext);

        /**
         * Gets or sets the body of the current view
         * @type {String}
         */
        var _this10 = _possibleConstructorReturn(this, (HttpViewContext.__proto__ || Object.getPrototypeOf(HttpViewContext)).call(this));

        _this10.body = '';
        /**
         * Gets or sets the title of the page if the view will be fully rendered
         * @type {String}
         */
        _this10.title = '';
        /**
         * Gets or sets the view layout page if the view will be fully rendered
         * @type {String}
         */
        _this10.layout = null;
        /**
         * Gets or sets the view data
         * @type {String}
         */
        _this10.data = null;
        /**
         * Represents the current HTTP context
         * @type {HttpContext}
         */
        _this10.context = context;

        /**
         * @type {HtmlWriter}
         */
        _this10.writer = undefined;

        var writer = null;
        Object.defineProperty(_this10, 'writer', {
            get: function get() {
                if (writer) return writer;
                writer = new HtmlWriter();
                writer.indent = false;
                return writer;
            }, configurable: false, enumerable: false
        });

        var self = _this10;
        Object.defineProperty(_this10, 'model', {
            get: function get() {
                if (self.context.params) if (self.context.params.controller) return self.context.model(self.context.params.controller);
                return null;
            }, configurable: false, enumerable: false
        });

        _this10.html = new HtmlViewHelper(_this10);
        //class extension initiators
        if (typeof _this10.init === 'function') {
            //call init() method
            _this10.init();
        }
        return _this10;
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
            var app = require('./index');
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
         *
         * @param {String} s
         * @param {String=} lib
         * @returns {String}
         */

    }, {
        key: '$T',
        value: function $T(s, lib) {
            return this.translate(s, lib);
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
}(SequentialEventEmitter);

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
