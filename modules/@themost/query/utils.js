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
exports.QueryUtils = exports.SqlUtils = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = require('lodash');

var _ = _lodash._;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * SQL Escape global function
 */
/**
 * @param {string} tz
 */

function convertTimezone(tz) {
    if (tz == "Z") return 0;

    var m = tz.match(/([+\-\s])(\d\d):?(\d\d)?/);
    if (m) {
        return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + (m[3] ? parseInt(m[3], 10) : 0) / 60) * 60;
    }
    return false;
}

function zeroPad(number, length) {
    number = number.toString();
    while (number.length < length) {
        number = '0' + number;
    }
    return number;
}

function dateToString(date, timeZone) {
    var dt = new Date(date);

    if (timeZone != 'local') {
        var tz = convertTimezone(timeZone);
        dt.setTime(dt.getTime() + dt.getTimezoneOffset() * 60000);
        if (tz !== false) {
            dt.setTime(dt.getTime() + tz * 60000);
        }
    }

    var year = dt.getFullYear();
    var month = zeroPad(dt.getMonth() + 1, 2);
    var day = zeroPad(dt.getDate(), 2);
    var hour = zeroPad(dt.getHours(), 2);
    var minute = zeroPad(dt.getMinutes(), 2);
    var second = zeroPad(dt.getSeconds(), 2);
    var millisecond = zeroPad(dt.getMilliseconds(), 3);

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
}

function bufferToString(buffer) {
    var hex = '';
    try {
        hex = buffer.toString('hex');
    } catch (err) {
        // node v0.4.x does not support hex / throws unknown encoding error
        for (var i = 0; i < buffer.length; i++) {
            var byte = buffer[i];
            hex += zeroPad(byte.toString(16));
        }
    }

    return "X'" + hex + "'";
}

function objectToValues(obj, timeZone) {
    var values = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var value = obj[key];
            if (typeof value === 'function') {
                continue;
            }
            values.push(escapeId(key) + ' = ' + _escape(value, true, timeZone));
        }
    }
    return values.join(', ');
}

function arrayToList(array, timeZone) {
    return array.map(function (v) {
        if (Array.isArray(v)) return '(' + arrayToList(v, timeZone) + ')';
        return _escape(v, true, timeZone);
    }).join(', ');
}

function escapeId(val, forbidQualified) {
    if (Array.isArray(val)) {
        return val.map(function (v) {
            return escapeId(v, forbidQualified);
        }).join(', ');
    }

    if (forbidQualified) {
        return '`' + val.replace(/`/g, '``') + '`';
    }
    return '`' + val.replace(/`/g, '``').replace(/\./g, '`.`') + '`';
}

var STR_ESCAPE_REGEXP = /[\0\n\r\b\t\\'"\x1a]/g;

function _escape(val, stringifyObjects, timeZone) {
    if (val === undefined || val === null) {
        return 'NULL';
    }

    switch (typeof val === 'undefined' ? 'undefined' : _typeof(val)) {
        case 'boolean':
            return val ? 'true' : 'false';
        case 'number':
            return val + '';
    }

    if (val instanceof Date) {
        val = dateToString(val, timeZone || 'local');
    }

    if (Buffer.isBuffer(val)) {
        return bufferToString(val);
    }

    if (_.isArray(val)) {
        return arrayToList(val, timeZone);
    }

    if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
        if (stringifyObjects) {
            val = val.toString();
        } else {
            return objectToValues(val, timeZone);
        }
    }
    val = val.replace(STR_ESCAPE_REGEXP, function (s) {
        switch (s) {
            case "\0":
                return "\\0";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\b":
                return "\\b";
            case "\t":
                return "\\t";
            case "\x1a":
                return "\\Z";
            default:
                return "\\" + s;
        }
    });
    return "'" + val + "'";
}

function _format(sql, values, stringifyObjects, timeZone) {
    values = values == null ? [] : [].concat(values);
    var index = 0;
    return sql.replace(/\?\??/g, function (match) {
        if (index === values.length) {
            return match;
        }
        var value = values[index++];
        return match === '??' ? escapeId(value) : _escape(value, stringifyObjects, timeZone);
    });
}
/**
 * @class
 */

var SqlUtils = exports.SqlUtils = function () {
    function SqlUtils() {
        _classCallCheck(this, SqlUtils);
    }

    _createClass(SqlUtils, null, [{
        key: 'escape',

        /**
         * @static
         * Escapes the given value and returns an equivalent string which is going to be used in SQL expressions.
         * @param {*} val
         * @returns {*}
         */
        value: function escape(val) {
            return _escape(val);
        }
        /**
         * @static
         * Formats the given SQL expression string and replaces parameters with the given parameters, if any.
         * e.g. * SELECT * FROM User where username=? with values: ['user1'] etc.
         * @param {string} sql
         * @param {*...} values
         * @returns {*}
         */

    }, {
        key: 'format',
        value: function format(sql, values) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (args.length == 0) return sql;
            if (_.isArray(args) && args.length > 1) {
                throw new TypeError('Invalid arguments. Expected array only (for backward compatibility issues)');
            }
            return _format(sql, args);
        }

        /**
         * @static
         * Formats the given SQL expression string and replaces parameters with the given parameters, if any.
         * e.g. * SELECT * FROM User where username=? with values: ['user1'] etc.
         * @param {string} sql
         * @param {*...} values
         * @returns {*}
         */

    }, {
        key: 'prepare',
        value: function prepare(sql, values) {
            return _format.apply(this, Array.prototype.slice.call(arguments));
        }
    }]);

    return SqlUtils;
}();

var QueryUtils = exports.QueryUtils = function () {
    function QueryUtils() {
        _classCallCheck(this, QueryUtils);
    }

    _createClass(QueryUtils, null, [{
        key: 'query',

        /**
         * Initializes a select query expression by specifying the entity name
         * @param {string|*} entity - The name of the entity
         */
        value: function query(entity) {
            return QueryExpression.create(entity);
        }
        /**
         * Initializes a select query expression
         * @param {*...} fields
         */

    }, {
        key: 'select',
        value: function select(fields) {
            var q = new QueryExpression();
            return q.select.apply(q, fields);
        }
        /**
         * Initializes an insert query expression
         * @param {*} obj - The object to insert
         */

    }, {
        key: 'insert',
        value: function insert(obj) {
            var q = new QueryExpression();
            return q.insert(obj);
        }

        /**
         * Initializes an update query expression
         * @param {string|*} entity - The name of the entity
         */

    }, {
        key: 'update',
        value: function update(entity) {
            var q = new QueryExpression();
            return q.update(entity);
        }

        /**
         * Initializes a delete query expression
         * @param {string} entity - The name of the entity
         */

    }, {
        key: 'delete',
        value: function _delete(entity) {
            var q = new QueryExpression();
            return q.delete(entity);
        }
    }]);

    return QueryUtils;
}();
//# sourceMappingURL=utils.js.map
