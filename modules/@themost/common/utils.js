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
exports.LangUtils = exports.RandomUtils = exports.TraceUtils = exports.TextUtils = exports.NumberUtils = exports.Args = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _winston = require('winston');

var winston = _interopRequireDefault(_winston).default;

var _lodash = require('lodash');

var _ = _lodash._;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
var HEX_CHARS = 'abcdef1234567890';
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

var DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g;
var BooleanTrueRegex = /^true$/ig;
var BooleanFalseRegex = /^false$/ig;
var NullRegex = /^null$/ig;
var UndefinedRegex = /^undefined$/ig;
var IntegerRegex = /^[-+]?\d+$/g;
var FloatRegex = /^[+-]?\d+(\.\d+)?$/g;

var logger = new winston.Logger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    transports: [new winston.transports.Console({
        timestamp: function timestamp() {
            return new Date().toUTCString();
        },
        formatter: function formatter(options) {
            return '[' + options.timestamp() + '] [' + options.level.toUpperCase() + '] ' + (options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 4) : '');
        }
    })]
});

var Args = exports.Args = function () {
    function Args() {
        _classCallCheck(this, Args);
    }

    _createClass(Args, null, [{
        key: 'check',

        /**
         * Checks the expression and throws an exception if the condition is not met.
         * @param {*} expr
         * @param {string|error} err
         */
        value: function check(expr, err) {
            Args.notNull(expr, "Expression");
            if (typeof expr === 'function') {
                expr.call();
            }
            var res = void 0;
            if (typeof expr === 'function') {
                res = !expr.call();
            } else {
                res = !expr;
            }
            if (res) {
                if (err instanceof Error) {
                    throw err;
                }
                var error = new Error(err);
                error.code = "ECHECK";
                throw error;
            }
        }

        /**
         *
         * @param {*} arg
         * @param {string} name
         */

    }, {
        key: 'notNull',
        value: function notNull(arg, name) {
            if (typeof arg === 'undefined' || arg == null) {
                var err = new Error(name + " may not be null or undefined");
                err.code = "ENULL";
                throw err;
            }
        }

        /**
         * @param {*} arg
         * @param {string} name
         */

    }, {
        key: 'notString',
        value: function notString(arg, name) {
            if (typeof arg !== 'string') {
                var err = new Error(name + " must be a string");
                err.code = "EARG";
                throw err;
            }
        }

        /**
         * @param {*} arg
         * @param {string} name
         */

    }, {
        key: 'notFunction',
        value: function notFunction(arg, name) {
            if (typeof arg !== 'function') {
                var err = new Error(name + " must be a function");
                err.code = "EARG";
                throw err;
            }
        }

        /**
         * @param {*} arg
         * @param {string} name
         */

    }, {
        key: 'notNumber',
        value: function notNumber(arg, name) {
            if (typeof arg !== 'string') {
                var err = new Error(name + " must be number");
                err.code = "EARG";
                throw err;
            }
        }

        /**
         * @param {string|*} arg
         * @param {string} name
         */

    }, {
        key: 'notEmpty',
        value: function notEmpty(arg, name) {
            Args.notNull(arg, name);
            Args.notString(arg, name);
            if (arg.length == 0) {
                var err = new Error(name + " may not be empty");
                err.code = "EEMPTY";
                return err;
            }
        }

        /**
         * @param {number|*} arg
         * @param {string} name
         */

    }, {
        key: 'notNegative',
        value: function notNegative(arg, name) {
            Args.notNumber(arg, name);
            if (arg < 0) {
                var err = new Error(name + " may not be negative");
                err.code = "ENEG";
                return err;
            }
        }

        /**
         * @param {number|*} arg
         * @param {string} name
         */

    }, {
        key: 'positive',
        value: function positive(arg, name) {
            Args.notNumber(arg, name);
            if (arg <= 0) {
                var err = new Error(name + " may not be negative or zero");
                err.code = "EPOS";
                return err;
            }
        }
    }]);

    return Args;
}();

/**
 * @class
 */


var NumberUtils = exports.NumberUtils = function () {
    function NumberUtils() {
        _classCallCheck(this, NumberUtils);
    }

    _createClass(NumberUtils, null, [{
        key: 'fromBase26',

        //noinspection JSUnusedGlobalSymbols
        /**
         * Converts a base-26 formatted string to the equivalent integer
         * @static
         * @param {string} s A base-26 formatted string e.g. aaaaaaaa for 0, baaaaaaa for 1 etc
         * @return {number} The equivalent integer value
         */
        value: function fromBase26(s) {
            var num = 0;
            if (!/[a-z]{8}/.test(s)) {
                throw new Error('Invalid base-26 format.');
            }
            var a = 'a'.charCodeAt(0);
            for (var i = 7; i >= 0; i--) {
                num = num * 26 + (s[i].charCodeAt(0) - a);
            }
            return num;
        }

        //noinspection JSUnusedGlobalSymbols
        /**
         * Converts an integer to the equivalent base-26 formatted string
         * @static
         * @param {number} x The integer to be converted
         * @return {string} The equivalent string value
         */

    }, {
        key: 'toBase26',
        value: function toBase26(x) {
            //noinspection ES6ConvertVarToLetConst
            var num = parseInt(x);
            if (num < 0) {
                throw new Error('A non-positive integer cannot be converted to base-26 format.');
            }
            if (num > 208827064575) {
                throw new Error('A positive integer bigger than 208827064575 cannot be converted to base-26 format.');
            }
            var out = "";
            var length = 1;
            var a = 'a'.charCodeAt(0);
            while (length <= 8) {
                out += String.fromCharCode(a + num % 26);
                num = Math.floor(num / 26);
                length += 1;
            }
            return out;
        }
    }]);

    return NumberUtils;
}();

/**
 * @class
 */


var TextUtils = exports.TextUtils = function () {
    function TextUtils() {
        _classCallCheck(this, TextUtils);
    }

    _createClass(TextUtils, null, [{
        key: 'toMD5',

        /**
         * Converts the given parameter to MD5 hex string
         * @static
         * @param {*} value
         * @returns {string|undefined}
         */
        value: function toMD5(value) {

            if (typeof value === 'undefined' || value == null) {
                return;
            }
            //browser implementation
            var md5 = void 0,
                md5module = void 0;
            if (typeof window !== 'undefined') {
                md5module = 'blueimp-md5';
                md5 = require(md5module);
                if (typeof value === 'string') {
                    return md5(value);
                } else if (value instanceof Date) {
                    return md5(value.toUTCString());
                } else {
                    return md5(JSON.stringify(value));
                }
            }
            //node.js implementation
            md5module = 'crypto';
            var crypto = require(md5module);
            md5 = crypto.createHash('md5');
            if (typeof value === 'string') {
                md5.update(value);
            } else if (value instanceof Date) {
                md5.update(value.toUTCString());
            } else {
                md5.update(JSON.stringify(value));
            }
            return md5.digest('hex');
        }

        /**
         * Converts the given parameter to SHA1 hex string
         * @static
         * @param {*} value
         * @returns {string|undefined}
         */

    }, {
        key: 'toSHA1',
        value: function toSHA1(value) {

            if (typeof window !== 'undefined') {
                throw new Error('This method is not implemented for this environment');
            }

            var crypto = require('crypto');
            if (typeof value === 'undefined' || value == null) {
                return;
            }
            var sha1 = crypto.createHash('sha1');
            if (typeof value === 'string') {
                sha1.update(value);
            } else if (value instanceof Date) {
                sha1.update(value.toUTCString());
            } else {
                sha1.update(JSON.stringify(value));
            }
            return sha1.digest('hex');
        }

        /**
         * Converts the given parameter to SHA256 hex string
         * @static
         * @param {*} value
         * @returns {string|undefined}
         */

    }, {
        key: 'toSHA256',
        value: function toSHA256(value) {

            if (typeof window !== 'undefined') {
                throw new Error('This method is not implemented for this environment');
            }

            var crypto = require('crypto');
            if (typeof value === 'undefined' || value == null) {
                return;
            }
            var sha256 = crypto.createHash('sha256');
            if (typeof value === 'string') {
                sha256.update(value);
            } else if (value instanceof Date) {
                sha256.update(value.toUTCString());
            } else {
                sha256.update(JSON.stringify(value));
            }
            return sha256.digest('hex');
        }

        /**
         * Returns a random GUID/UUID string
         * @static
         * @returns {string}
         */

    }, {
        key: 'newUUID',
        value: function newUUID() {
            var uuid = [];
            var i = void 0;
            // rfc4122, version 4 form
            var r = void 0,
                n = void 0;
            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';

            // Fill in random data.  At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    n = i == 19 ? r & 0x3 | 0x8 : r;
                    uuid[i] = UUID_CHARS.substring(n, 1);
                }
            }
            return uuid.join('');
        }
    }]);

    return TextUtils;
}();

/**
 * @class
 * @constructor
 */


var TraceUtils = exports.TraceUtils = function () {
    function TraceUtils() {
        _classCallCheck(this, TraceUtils);
    }

    _createClass(TraceUtils, null, [{
        key: 'log',

        /**
         * @static
         * @param {...*} data
         */
        value: function log(data) {
            var args = Array.prototype.slice.call(arguments);
            if (args.length == 0) {
                return;
            }
            if (data instanceof Error) {
                return TraceUtils.error.apply(this, args);
            }
            if (_.isObject(data)) {
                return logger.info.call(logger, JSON.stringify(data, null, 2));
            }
            return logger.info.apply(logger, args);
        }

        /**
         * @static
         * @param {...*} data
         */

    }, {
        key: 'error',
        value: function error(data) {
            var args = Array.prototype.slice.call(arguments);
            if (args.length == 0) {
                return;
            }
            if (data instanceof Error) {
                if (data.stack) {
                    return logger.error(data.stack);
                } else {
                    return logger.error.apply(logger, args);
                }
            }
            return logger.error.apply(logger, args);
        }

        /**
         *
         * @static
         * @param {...*} data
         */

    }, {
        key: 'info',
        value: function info(data) {
            var args = Array.prototype.slice.call(arguments);
            if (args.length == 0) {
                return;
            }
            return logger.info.apply(logger, args);
        }

        /**
         *
         * @static
         * @param {*} data
         */

    }, {
        key: 'warn',
        value: function warn(data) {
            var args = Array.prototype.slice.call(arguments);
            if (args.length == 0) {
                return;
            }
            return logger.warn.apply(logger, args);
        }

        /**
         *
         * @static
         * @param {...*} data
         */

    }, {
        key: 'debug',
        value: function debug(data) {
            var args = Array.prototype.slice.call(arguments);
            if (args.length == 0) {
                return;
            }
            return logger.debug.apply(logger, args);
        }
    }]);

    return TraceUtils;
}();
/**
 * @class
 */


var RandomUtils = exports.RandomUtils = function () {
    function RandomUtils() {
        _classCallCheck(this, RandomUtils);
    }

    _createClass(RandomUtils, null, [{
        key: 'randomChars',

        /**
         * Returns a random string based on the length specified
         * @param {Number} length
         */
        value: function randomChars(length) {
            length = length || 8;
            var chars = "abcdefghkmnopqursuvwxz2456789ABCDEFHJKLMNPQURSTUVWXYZ";
            var str = "";
            for (var i = 0; i < length; i++) {
                str += chars.substr(this.randomInt(0, chars.length - 1), 1);
            }
            return str;
        }

        /**
         * Returns a random integer between a minimum and a maximum value
         * @param {number} min
         * @param {number} max
         */

    }, {
        key: 'randomInt',
        value: function randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        /**
         * Returns a random string based on the length specified
         * @static
         * @param {number} length
         * @returns {string}
         */

    }, {
        key: 'randomHex',
        value: function randomHex(length) {
            length = (length || 8) * 2;
            var str = "";
            for (var i = 0; i < length; i++) {
                str += HEX_CHARS.substr(this.randomInt(0, HEX_CHARS.length - 1), 1);
            }
            return str;
        }
    }]);

    return RandomUtils;
}();

/**
 * @class
 */


var LangUtils = exports.LangUtils = function () {
    function LangUtils() {
        _classCallCheck(this, LangUtils);
    }

    _createClass(LangUtils, null, [{
        key: 'getFunctionParams',

        /**
         * Returns an array of strings which represents the arguments' names of the given function
         * @param {Function} fn
         * @returns {Array}
         */
        value: function getFunctionParams(fn) {
            if (!_.isFunction(fn)) return [];
            var fnStr = fn.toString().replace(STRIP_COMMENTS, '');
            var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
            if (result === null) result = [];
            return result;
        }
        /**
         * @param {string} value
         */

    }, {
        key: 'convert',
        value: function convert(value) {
            var result = void 0;
            if (typeof value === 'string') {
                if (value.length == 0) {
                    result = value;
                }
                if (value.match(BooleanTrueRegex)) {
                    result = true;
                } else if (value.match(BooleanFalseRegex)) {
                    result = false;
                } else if (value.match(NullRegex) || value.match(UndefinedRegex)) {
                    result = null;
                } else if (value.match(IntegerRegex)) {
                    result = parseInt(value);
                } else if (value.match(FloatRegex)) {
                    result = parseFloat(value);
                } else if (value.match(DateTimeRegex)) {
                    result = new Date(Date.parse(value));
                } else {
                    result = value;
                }
            } else {
                result = value;
            }
            return result;
        }

        /**
         *
         * @param {*} origin
         * @param {string} expr
         * @param {string} value
         * @param {*=} options
         * @returns {*}
         */

    }, {
        key: 'extend',
        value: function extend(origin, expr, value, options) {

            options = options || { convertValues: false };
            //find base notation
            var match = /(^\w+)\[/.exec(expr),
                name = void 0,
                descriptor = void 0,
                expr1 = void 0;
            if (match) {
                //get property name
                name = match[1];
                //validate array property
                if (/^\d+$/g.test(name)) {
                    //property is an array
                    if (!_.isArray(origin.value)) origin.value = [];
                    // get new expression
                    expr1 = expr.substr(match.index + match[1].length);
                    LangUtils.extend(origin, expr1, value);
                } else {
                    //set property value (unknown)
                    origin[name] = origin[name] || new LangUtils();
                    descriptor = new UnknownPropertyDescriptor(origin, name);
                    // get new expression
                    expr1 = expr.substr(match.index + match[1].length);
                    LangUtils.extend(descriptor, expr1, value);
                }
            } else if (expr.indexOf('[') == 0) {
                //get property
                var re = /\[(.*?)\]/g;
                match = re.exec(expr);
                if (match) {
                    name = match[1];
                    // get new expression
                    expr1 = expr.substr(match.index + match[0].length);
                    if (/^\d+$/g.test(name)) {
                        //property is an array
                        if (!_.isArray(origin.value)) origin.value = [];
                    }
                    if (expr1.length == 0) {
                        if (origin.value instanceof LangUtils) {
                            origin.value = {};
                        }
                        var typedValue = void 0;
                        //convert string value
                        if (typeof value === 'string' && options.convertValues) {
                            typedValue = LangUtils.convert(value);
                        } else {
                            typedValue = value;
                        }
                        if (_.isArray(origin.value)) origin.value.push(typedValue);else origin.value[name] = typedValue;
                    } else {
                        if (origin.value instanceof LangUtils) {
                            origin.value = {};
                        }
                        origin.value[name] = origin.value[name] || new LangUtils();
                        descriptor = new UnknownPropertyDescriptor(origin.value, name);
                        LangUtils.extend(descriptor, expr1, value);
                    }
                } else {
                    throw new Error('Invalid object property notation. Expected [name]');
                }
            } else if (/^\w+$/.test(expr)) {
                if (options.convertValues) origin[expr] = LangUtils.convert(value);else origin[expr] = value;
            } else {
                throw new Error('Invalid object property notation. Expected property[name] or [name]');
            }
            return origin;
        }

        /**
         *
         * @param {*} form
         * @returns {*}
         */

    }, {
        key: 'parseForm',
        value: function parseForm(form) {
            var result = {};
            if (typeof form === 'undefined' || form == null) return result;
            var keys = Object.keys(form);
            keys.forEach(function (key) {
                if (form.hasOwnProperty(key)) {
                    LangUtils.extend(result, key, form[key]);
                }
            });
            return result;
        }
        /**
         * Parses any value or string and returns the resulted object.
         * @param {*} any
         * @returns {*}
         */

    }, {
        key: 'parseValue',
        value: function parseValue(any) {
            return LangUtils.convert(any);
        }
        /**
         * Parses any value and returns the equivalent integer.
         * @param {*} any
         * @returns {*}
         */

    }, {
        key: 'parseInt',
        value: function (_parseInt) {
            function parseInt(_x) {
                return _parseInt.apply(this, arguments);
            }

            parseInt.toString = function () {
                return _parseInt.toString();
            };

            return parseInt;
        }(function (any) {
            return parseInt(any) || 0;
        })
        /**
         * Parses any value and returns the equivalent float number.
         * @param {*} any
         * @returns {*}
         */

    }, {
        key: 'parseFloat',
        value: function (_parseFloat) {
            function parseFloat(_x2) {
                return _parseFloat.apply(this, arguments);
            }

            parseFloat.toString = function () {
                return _parseFloat.toString();
            };

            return parseFloat;
        }(function (any) {
            return parseFloat(any) || 0;
        })
        /**
         * Parses any value and returns the equivalent boolean.
         * @param {*} any
         * @returns {*}
         */

    }, {
        key: 'parseBoolean',
        value: function parseBoolean(any) {
            if (typeof any === 'undefined' || any == null) return false;else if (typeof any === 'number') return any != 0;else if (typeof any === 'string') {
                if (any.match(LangUtils.IntegerRegex) || any.match(LangUtils.FloatRegex)) {
                    return parseInt(any, 10) != 0;
                } else if (any.match(LangUtils.BooleanTrueRegex)) return true;else if (any.match(LangUtils.BooleanFalseRegex)) return false;else if (/^yes$|^on$|^y$|^valid$/i.test(any)) return true;else if (/^no$|^off$|^n$|^invalid$/i.test(any)) return false;else return false;
            } else if (typeof any === 'boolean') return any;else {
                return (parseInt(any) || 0) != 0;
            }
        }
    }]);

    return LangUtils;
}();

LangUtils.DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g;
LangUtils.BooleanTrueRegex = /^true$/ig;
LangUtils.BooleanFalseRegex = /^false$/ig;
LangUtils.NullRegex = /^null$/ig;
LangUtils.UndefinedRegex = /^undefined$/ig;
LangUtils.IntegerRegex = /^[-+]?\d+$/g;
LangUtils.FloatRegex = /^[+-]?\d+(\.\d+)?$/g;
/**
 * @class
 * @constructor
 */
function UnknownPropertyDescriptor(obj, name) {
    Object.defineProperty(this, 'value', { configurable: false, enumerable: true, get: function get() {
            return obj[name];
        }, set: function set(value) {
            obj[name] = value;
        } });
    Object.defineProperty(this, 'name', { configurable: false, enumerable: true, get: function get() {
            return name;
        } });
}
//# sourceMappingURL=utils.js.map
