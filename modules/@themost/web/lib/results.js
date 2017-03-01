'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HttpErrorResult = exports.HttpEndResult = exports.HttpNextResult = exports.HttpAnyResult = exports.HttpResult = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require('rxjs');

var Rx = _interopRequireDefault(_rxjs).default;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

var _lodash = require('lodash');

var _ = _lodash._;

var _formatters = require('./formatters');

var FormatterStrategy = _formatters.FormatterStrategy;

var _errors = require('@themost/common/errors');

var HttpMethodNotAllowedError = _errors.HttpMethodNotAllowedError;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @abstract
 */
var HttpResult = exports.HttpResult = function () {
    /**
     * @constructor
     */
    function HttpResult() {
        _classCallCheck(this, HttpResult);

        if (new.target === HttpResult) {
            throw new TypeError("Cannot construct abstract instances directly");
        }
    }

    _createClass(HttpResult, [{
        key: 'toObservable',
        value: function toObservable() {
            return Rx.Observable.of(this);
        }
    }]);

    return HttpResult;
}();

/**
 * @class
 */


var HttpAnyResult = exports.HttpAnyResult = function (_HttpResult) {
    _inherits(HttpAnyResult, _HttpResult);

    /**
     * @constructor
     * @param {*} data
     */
    function HttpAnyResult(data) {
        _classCallCheck(this, HttpAnyResult);

        var _this = _possibleConstructorReturn(this, (HttpAnyResult.__proto__ || Object.getPrototypeOf(HttpAnyResult)).call(this));

        _this.data = data;
        _this.contentType = 'text/html';
        _this.contentEncoding = 'utf8';
        return _this;
    }

    /**
     * Creates an instance of HTTP next result
     * @param {*} data
     * @returns {HttpAnyResult}
     */


    _createClass(HttpAnyResult, [{
        key: 'execute',


        /**
         * Executes an HttpResult instance against an existing HttpContext.
         * @param {HttpContext} context
         * @returns {Observable}
         * */
        value: function execute(context) {
            var self = this;
            return Rx.Observable.bindNodeCallback(function (callback) {
                try {
                    /**
                     * @type {FormatterStrategy}
                     */
                    var formatterStrategy = context.getApplication().getService(FormatterStrategy),

                    /**
                     * @type {ServerResponse}
                     */
                    response = context.response;

                    if (_.isNil(self.data)) {
                        response.writeHead(204);
                        return callback();
                    }

                    if (_.isNil(formatterStrategy)) {
                        return callback(new HttpMethodNotAllowedError());
                    }

                    var formatter = formatterStrategy.find(context);
                    if (_.isNil(formatter)) {
                        return callback(new HttpMethodNotAllowedError());
                    }
                    return formatter.execute(context, self.data).subscribe(function () {
                        return callback();
                    }, function (err) {
                        return callback(err);
                    });
                } catch (err) {
                    callback(err);
                }
            })();
        }
    }], [{
        key: 'create',
        value: function create(data) {
            return new HttpAnyResult(data);
        }
    }]);

    return HttpAnyResult;
}(HttpResult);

/**
 * @class
 */


var HttpNextResult = exports.HttpNextResult = function (_HttpResult2) {
    _inherits(HttpNextResult, _HttpResult2);

    /**
     * @constructor
     */
    function HttpNextResult() {
        _classCallCheck(this, HttpNextResult);

        return _possibleConstructorReturn(this, (HttpNextResult.__proto__ || Object.getPrototypeOf(HttpNextResult)).call(this));
    }

    /**
     * Creates an instance of HTTP next result
     * @returns {HttpNextResult}
     */


    _createClass(HttpNextResult, null, [{
        key: 'create',
        value: function create() {
            return new HttpNextResult();
        }
    }]);

    return HttpNextResult;
}(HttpResult);

/**
 * @class
 */


var HttpEndResult = exports.HttpEndResult = function (_HttpResult3) {
    _inherits(HttpEndResult, _HttpResult3);

    /**
     * @constructor
     */
    function HttpEndResult() {
        _classCallCheck(this, HttpEndResult);

        return _possibleConstructorReturn(this, (HttpEndResult.__proto__ || Object.getPrototypeOf(HttpEndResult)).call(this));
    }

    /**
     * Creates an instance of HTTP next result
     * @returns {HttpEndResult}
     */


    _createClass(HttpEndResult, null, [{
        key: 'create',
        value: function create() {
            return new HttpEndResult();
        }
    }]);

    return HttpEndResult;
}(HttpResult);

/**
 * @class
 */


var HttpErrorResult = exports.HttpErrorResult = function (_HttpResult4) {
    _inherits(HttpErrorResult, _HttpResult4);

    /**
     * @constructor
     */
    function HttpErrorResult(statusCode) {
        _classCallCheck(this, HttpErrorResult);

        return _possibleConstructorReturn(this, (HttpErrorResult.__proto__ || Object.getPrototypeOf(HttpErrorResult)).call(this));
    }

    /**
     * Creates an instance of HTTP next result
     * @param {number} statusCode
     * @returns {HttpErrorResult}
     */


    _createClass(HttpErrorResult, null, [{
        key: 'create',
        value: function create(statusCode) {
            return new HttpErrorResult(statusCode);
        }
    }]);

    return HttpErrorResult;
}(HttpResult);
//# sourceMappingURL=results.js.map
