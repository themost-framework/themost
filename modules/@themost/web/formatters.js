/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HtmlOutputFormatter = exports.XmlOutputFormatter = exports.JsonOutputFormatter = exports.OutputFormatter = exports.DefaultFormatterStrategy = exports.FormatterStrategy = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _interfaces = require('./interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _errors = require('@themost/common/errors');

var AbstractClassError = _errors.AbstractClassError;
var AbstractMethodError = _errors.AbstractMethodError;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

var _lodash = require('lodash');

var _ = _lodash._;

var _rxjs = require('rxjs');

var Rx = _interopRequireDefault(_rxjs).default;

var _accepts = require('accepts');

var accepts = _interopRequireDefault(_accepts).default;

var _mostXml = require('most-xml');

var xml = _interopRequireDefault(_mostXml).default;

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _url = require('url');

var url = _interopRequireDefault(_url).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var formattersProperty = Symbol('formatters');

var FormatterStrategy = exports.FormatterStrategy = function (_HttpApplicationServi) {
    _inherits(FormatterStrategy, _HttpApplicationServi);

    function FormatterStrategy(app) {
        _classCallCheck(this, FormatterStrategy);

        Args.check(new.target !== FormatterStrategy, new AbstractClassError());

        var _this = _possibleConstructorReturn(this, (FormatterStrategy.__proto__ || Object.getPrototypeOf(FormatterStrategy)).call(this, app));

        _this[formattersProperty] = [];
        return _this;
    }

    /**
     * Adds a formatter into the collection of application formatters
     * @param {Function} formatterCtor
     */


    _createClass(FormatterStrategy, [{
        key: 'add',
        value: function add(formatterCtor) {
            Args.check(typeof formatterCtor === 'function', 'Formatter constructor mub be a function');
            this[formattersProperty].push(new formatterCtor());
        }

        /**
         * Inserts a formatter into the collection at the specified index
         * @param {number} index
         * @param {Function} formatterCtor
         */

    }, {
        key: 'insert',
        value: function insert(index, formatterCtor) {
            Args.check(typeof formatterCtor === 'function', 'Formatter constructor mub be a function');
            this[formattersProperty].splice(index, 0, new formatterCtor());
        }

        /**
         * Gets a formatter based on the given type
         * @param {Function} formatterCtor
         */

    }, {
        key: 'get',
        value: function get(formatterCtor) {
            Args.check(typeof formatterCtor === 'function', 'Formatter constructor mub be a function');
            return _.find(this[formattersProperty], function (x) {
                return x instanceof formatterCtor;
            });
        }

        /**
         * Finds a formatter for the given HTTP context
         * @param {HttpContext} context
         * @returns {OutputFormatter}
         */

    }, {
        key: 'find',
        value: function find(context) {
            return _.find(this[formattersProperty], function (x) {
                return x.isMatch(context);
            });
        }
    }]);

    return FormatterStrategy;
}(HttpApplicationService);

var DefaultFormatterStrategy = exports.DefaultFormatterStrategy = function (_FormatterStrategy) {
    _inherits(DefaultFormatterStrategy, _FormatterStrategy);

    function DefaultFormatterStrategy(app) {
        _classCallCheck(this, DefaultFormatterStrategy);

        var _this2 = _possibleConstructorReturn(this, (DefaultFormatterStrategy.__proto__ || Object.getPrototypeOf(DefaultFormatterStrategy)).call(this, app));

        _this2.add(HtmlOutputFormatter);
        _this2.add(JsonOutputFormatter);
        _this2.add(XmlOutputFormatter);
        return _this2;
    }

    /**
     * Finds a formatter for the given HTTP context
     * @param context
     * @returns {OutputFormatter}
     */


    _createClass(DefaultFormatterStrategy, [{
        key: 'find',
        value: function find(context) {
            var formatters = this[formattersProperty];
            var mimeType = context.getApplication().getMimeType(path.extname(url.parse(context.request.url).pathname));
            if (typeof mimeType === 'undefined') {
                //get available formatters (as array of types)
                var types = _.map(this[formattersProperty], function (x) {
                    return x.getType();
                });
                var accept = accepts(context.request);
                var acceptedType = accept.type(types);
                if (_.isNil(acceptedType)) {
                    return;
                }
                return _.find(this[formattersProperty], function (x) {
                    return x.getType() === acceptedType;
                });
            }
            return _.find(this[formattersProperty], function (x) {
                if (mimeType) {
                    return x.getType() === mimeType.extension.substr(1);
                }
                return false;
            });
        }
    }]);

    return DefaultFormatterStrategy;
}(FormatterStrategy);
/**
 * @class
 */


var OutputFormatter = exports.OutputFormatter = function () {
    function OutputFormatter() {
        _classCallCheck(this, OutputFormatter);

        Args.check(new.target !== OutputFormatter, new AbstractClassError());
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */


    _createClass(OutputFormatter, [{
        key: 'getMediaType',
        value: function getMediaType() {
            throw new AbstractMethodError();
        }

        /**
         * Gets the content type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getContentType',
        value: function getContentType() {
            throw new AbstractMethodError();
        }

        /**
         * Gets the type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getType',
        value: function getType() {
            throw new AbstractMethodError();
        }

        /**
         * Check if the given HTTP context accepts formatting
         * @param {HttpContext} context
         */

    }, {
        key: 'isMatch',
        value: function isMatch(context) {
            var accept = accepts(context.request);
            return accept.type([this.getType()]);
        }

        /**
         * Executes formatter against the given HTTP context
         * @param {HttpContext} context
         * @param {*} data
         * @returns {Observable}
         */

    }, {
        key: 'execute',
        value: function execute(context, data) {
            throw new AbstractMethodError();
        }
    }]);

    return OutputFormatter;
}();

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

var JsonOutputFormatter = exports.JsonOutputFormatter = function (_OutputFormatter) {
    _inherits(JsonOutputFormatter, _OutputFormatter);

    function JsonOutputFormatter() {
        _classCallCheck(this, JsonOutputFormatter);

        var _this3 = _possibleConstructorReturn(this, (JsonOutputFormatter.__proto__ || Object.getPrototypeOf(JsonOutputFormatter)).call(this));

        _this3.options = {
            "ignoreNullValues": true
        };
        return _this3;
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */


    _createClass(JsonOutputFormatter, [{
        key: 'getMediaType',
        value: function getMediaType() {
            return 'application/json';
        }

        /**
         * Gets the content type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getContentType',
        value: function getContentType() {
            return 'application/json;charset=utf-8';
        }

        /**
         * Gets the type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getType',
        value: function getType() {
            return 'json';
        }

        /**
         *
         * @param {HttpContext} context
         * @param {*} data
         * @returns {Observable}
         */

    }, {
        key: 'execute',
        value: function execute(context, data) {
            var _this4 = this;

            return Rx.Observable.bindNodeCallback(function (callback) {
                if (_.isNil(data)) {
                    //return 204 (no content)
                    context.response.writeHead(204);
                    return callback();
                }
                if (data instanceof Error) {
                    //send error in JSON format
                    context.response.writeHead(data.status || 500, { "Content-Type": _this4.getContentType() });
                } else {
                    context.response.writeHead(200, { "Content-Type": _this4.getContentType() });
                }
                if (_this4.options.ignoreNullValues) {
                    context.response.write(JSON.stringify(data, _json_ignore_null_replacer), 'utf8');
                } else {
                    context.response.write(JSON.stringify(data), 'utf8');
                }
                return callback();
            })();
        }
    }]);

    return JsonOutputFormatter;
}(OutputFormatter);

var XmlOutputFormatter = exports.XmlOutputFormatter = function (_OutputFormatter2) {
    _inherits(XmlOutputFormatter, _OutputFormatter2);

    function XmlOutputFormatter() {
        _classCallCheck(this, XmlOutputFormatter);

        var _this5 = _possibleConstructorReturn(this, (XmlOutputFormatter.__proto__ || Object.getPrototypeOf(XmlOutputFormatter)).call(this));

        _this5.options = {
            "ignoreNullValues": true
        };
        return _this5;
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */


    _createClass(XmlOutputFormatter, [{
        key: 'getMediaType',
        value: function getMediaType() {
            return 'application/xml';
        }
        /**
         * Gets the type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getType',
        value: function getType() {
            return 'xml';
        }

        /**
         * Gets the content type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getContentType',
        value: function getContentType() {
            return 'application/xml;charset=utf-8';
        }

        /**
         * Executes formatter against the given HTTP context
         * @param {HttpContext} context
         * @param {*} data
         * @returns {Observable}
         */

    }, {
        key: 'execute',
        value: function execute(context, data) {
            var _this6 = this;

            return Rx.Observable.bindNodeCallback(function (callback) {
                if (_.isNil(data)) {
                    //return 204 (no content)
                    context.response.writeHead(204);
                    return callback();
                }
                if (data instanceof Error) {
                    //send error in JSON format
                    context.response.writeHead(data.status || 500, { "Content-Type": _this6.getContentType() });
                } else {
                    context.response.writeHead(200, { "Content-Type": _this6.getContentType() });
                }
                context.response.write(xml.serialize(data).outerXML(), 'utf8');
                return callback();
            })();
        }
    }]);

    return XmlOutputFormatter;
}(OutputFormatter);

var HtmlOutputFormatter = exports.HtmlOutputFormatter = function (_OutputFormatter3) {
    _inherits(HtmlOutputFormatter, _OutputFormatter3);

    function HtmlOutputFormatter() {
        _classCallCheck(this, HtmlOutputFormatter);

        var _this7 = _possibleConstructorReturn(this, (HtmlOutputFormatter.__proto__ || Object.getPrototypeOf(HtmlOutputFormatter)).call(this));

        _this7.options = {
            "ignoreNullValues": true
        };
        return _this7;
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */


    _createClass(HtmlOutputFormatter, [{
        key: 'getMediaType',
        value: function getMediaType() {
            return 'text/html';
        }
        /**
         * Gets the type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getType',
        value: function getType() {
            return 'html';
        }

        /**
         * Gets the content type associated with an output formatter
         * @returns {string}
         */

    }, {
        key: 'getContentType',
        value: function getContentType() {
            return 'text/html;charset=utf-8';
        }

        /**
         * Executes formatter against the given HTTP context
         * @param {HttpContext} context
         * @param {*} data
         * @returns {Observable}
         */

    }, {
        key: 'execute',
        value: function execute(context, data) {
            var _this8 = this;

            return Rx.Observable.bindNodeCallback(function (callback) {
                if (_.isNil(data)) {
                    //return 204 (no content)
                    context.response.writeHead(204);
                    return callback();
                }
                if (data instanceof Error) {
                    var statusCode = data.status || 500;
                    //send error in JSON format
                    context.response.writeHead(statusCode, { "Content-Type": _this8.getContentType() });
                    context.response.write(statusCode + ' ' + data.message, 'utf8');
                } else {
                    var HttpViewResult = require('./mvc').HttpViewResult;
                    var result = new HttpViewResult(null, data);
                    return result.execute(context, function (err) {
                        return callback(err);
                    });
                }
                return callback();
            })();
        }
    }]);

    return HtmlOutputFormatter;
}(OutputFormatter);
//# sourceMappingURL=formatters.js.map
