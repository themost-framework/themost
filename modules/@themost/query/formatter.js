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
exports.SqlFormatter = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _utils = require('./utils');

var SqlUtils = _utils.SqlUtils;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _lodash = require('lodash');

var _ = _lodash._;

var _query = require('./query');

var QueryExpression = _query.QueryExpression;
var QueryField = _query.QueryField;

var _utils2 = require('@themost/common/utils');

var Args = _utils2.Args;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var methodsProperty = Symbol('methods');

/**
 * Initializes an SQL formatter class.
 * @class
 */

var SqlFormatter = exports.SqlFormatter = function () {

    /**
     * @constructor
     */
    function SqlFormatter() {
        _classCallCheck(this, SqlFormatter);

        this[methodsProperty] = {};
        //
        this.provider = null;
        /**
         * Gets or sets formatter settings
         * @type {{nameFormat: string}|*}
         */
        this.settings = {
            /**
             * Gets or sets a format that is going to be applied in field expression e.g. AS [$1] or AS '$1'.
             * @type {string}
             */
            nameFormat: '$1',
            /**
             * Gets or sets a boolean that indicates whether field aliases will forcibly be used even if field expression does not have any alias
             * (e.g. SELECT Person.name as name or SELECT Person.name).
             * @type {boolean}
             */
            forceAlias: false
        };
    }

    /**
     * @param {string} name
     * @param {Function} callable
     */


    _createClass(SqlFormatter, [{
        key: 'method',
        value: function method(name, callable) {
            Args.notString(name, 'Name');
            Args.notFunction(name, 'Method');
            if (/^\$/.test(name)) {
                this[methodsProperty][name] = callable;
            } else {
                this[methodsProperty]['' + name] = callable;
            }
        }
        /**
         * @param {string} name
         */

    }, {
        key: 'hasMethod',
        value: function hasMethod(name) {
            if (/^\$/.test(name)) {
                return this[methodsProperty].hasOwnProperty(name);
            } else {
                return this[methodsProperty].hasOwnProperty('' + { name: name });
            }
        }

        /**
         * Formats a JSON comparison object to the equivalent sql expression eg. { $gt: 100} as >100, or { $in:[5, 8] } as IN {5,8} etc
         * @param {*} comparison
         * @returns {string}
         */

    }, {
        key: 'formatComparison',
        value: function formatComparison(comparison) {
            if (_.isNil(comparison)) return '(%s IS NULL)';
            if ((typeof comparison === 'undefined' ? 'undefined' : _typeof(comparison)) === 'object') {
                if (comparison instanceof Date) {
                    return '(%s'.concat(sprintf.sprintf('=%s)', this.escape(comparison)));
                }
                var compares = [];
                for (var key in comparison) {
                    if (comparison.hasOwnProperty(key)) compares.push(key);
                }
                if (compares.length === 0) return '(%s IS NULL)';else {
                    var arr = [],
                        op = '=';
                    for (var i = 0; i < compares.length; i++) {
                        var _key = compares[i];
                        if (QueryExpression.ComparisonOperators[_key] === undefined) throw new Error(sprintf.sprintf('Unknown operator %s.', _key));
                        var escapedValue = this.escape(comparison[_key]);
                        switch (_key) {
                            case '$eq':
                                arr.push('(%s'.concat('=', escapedValue, ')'));break;
                            case '$lt':
                                arr.push('(%s'.concat('<', escapedValue, ')'));break;
                            case '$lte':
                                arr.push('(%s'.concat('<=', escapedValue, ')'));break;
                            case '$gt':
                                arr.push('(%s'.concat('>', escapedValue, ')'));break;
                            case '$gte':
                                arr.push('(%s'.concat('>=', escapedValue, ')'));break;
                            case '$ne':
                                arr.push('(NOT %s'.concat('=', escapedValue, ')'));break;
                            case '$in':
                                arr.push('(%s'.concat('(', escapedValue, '))'));break;
                            case '$nin':
                                arr.push('(NOT %s'.concat('(', escapedValue, '))'));break;
                        }
                    }
                    //join expression
                    if (arr.length === 1) return arr[0];else if (arr.length > 1) {
                        return '('.concat(arr.join(' AND '), ')');
                    } else return '(%s IS NULL)';
                }
            } else {
                return '(%s'.concat(sprintf.sprintf('=%s)', this.escape(comparison)));
            }
        }
    }, {
        key: 'isComparison',
        value: function isComparison(obj) {
            var key = _.findKey(obj);
            return (/^\$(eq|ne|lt|lte|gt|gte|in|nin|text|regex)$/g.test(key)
            );
        }

        /**
         * Escapes an object or a value and returns the equivalent sql value.
         * @param {*} value - A value that is going to be escaped for SQL statements
         * @param {boolean=} unquoted - An optional value that indicates whether the resulted string will be quoted or not.
         * @returns {string} - The equivalent SQL string value
         */

    }, {
        key: 'escape',
        value: function escape(value, unquoted) {
            if (_.isNil(value)) return SqlUtils.escape(null);

            if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
                //add an exception for Date object
                if (value instanceof Date) return SqlUtils.escape(value);
                if (value.hasOwnProperty('$name')) return this.escapeName(value.$name);
            }
            if (unquoted) return value.valueOf();else return SqlUtils.escape(value);
        }

        /**
         * Escapes an object or a value and returns the equivalent sql value.
         * @param {*} value - A value that is going to be escaped for SQL statements
         * @param {boolean=} unquoted - An optional value that indicates whether the resulted string will be quoted or not.
         * returns {string} - The equivalent SQL string value
         */

    }, {
        key: 'escapeConstant',
        value: function escapeConstant(value, unquoted) {
            return this.escape(value, unquoted);
        }

        /**
         * Formats a where expression object and returns the equivalen SQL string expression.
         * @param {*} where - An object that represents the where expression object to be formatted.
         * @returns {string|*}
         */

    }, {
        key: 'formatWhere',
        value: function formatWhere(where) {
            var self = this;

            //get expression (the first property of the object)
            var keys = _.keys(where),
                property = keys[0];
            if (typeof property === 'undefined') return '';
            //get property value
            var propertyValue = where[property];
            switch (property) {
                case '$not':
                    return '(NOT ' + self.formatWhere(propertyValue) + ')';
                    break;
                case '$and':
                case '$or':
                    var separator = property === '$or' ? ' OR ' : ' AND ';
                    //property value must be an array
                    if (!_.isArray(propertyValue)) throw new Error('Invalid query argument. A logical expression must contain one or more comparison expressions.');
                    if (propertyValue.length === 0) return '';
                    return '(' + _.map(propertyValue, function (x) {
                        return self.formatWhere(x);
                    }).join(separator) + ')';
                    break;
                default:
                    var comparison = propertyValue;
                    var op = null,
                        sql = null;
                    if (isQueryField_(comparison)) {
                        op = '$eq';
                        comparison = { $eq: propertyValue };
                    } else if ((typeof comparison === 'undefined' ? 'undefined' : _typeof(comparison)) === 'object' && comparison !== null) {
                        //get comparison operator
                        op = _.keys(comparison)[0];
                    } else {
                        //set default comparison operator to equal
                        op = '$eq';
                        comparison = { $eq: propertyValue };
                    }
                    //escape property name
                    var escapedProperty = this.escapeName(property);
                    switch (op) {
                        case '$text':
                            return self.$text({ $name: property }, comparison.$text.$search);
                        case '$eq':
                            if (_.isNil(comparison.$eq)) return sprintf.sprintf('(%s IS NULL)', escapedProperty);
                            return sprintf.sprintf('(%s=%s)', escapedProperty, self.escape(comparison.$eq));
                        case '$gt':
                            return sprintf.sprintf('(%s>%s)', escapedProperty, self.escape(comparison.$gt));
                        case '$gte':
                            return sprintf.sprintf('(%s>=%s)', escapedProperty, self.escape(comparison.$gte));
                        case '$lt':
                            return sprintf.sprintf('(%s<%s)', escapedProperty, self.escape(comparison.$lt));
                        case '$lte':
                            return sprintf.sprintf('(%s<=%s)', escapedProperty, self.escape(comparison.$lte));
                        case '$ne':
                            if (_.isNil(comparison.$ne)) return sprintf.sprintf('(NOT %s IS NULL)', escapedProperty);
                            if (comparison !== null) return sprintf.sprintf('(NOT %s=%s)', escapedProperty, self.escape(comparison.$ne));else return sprintf.sprintf('(NOT %s IS NULL)', escapedProperty);
                        case '$regex':
                            return this.$regex({ $name: property }, comparison.$regex);
                        case '$in':
                            if (_.isArray(comparison.$in)) {
                                if (comparison.$in.length === 0) return sprintf.sprintf('(%s IN (NULL))', escapedProperty);
                                sql = '('.concat(escapedProperty, ' IN (', _.map(comparison.$in, function (x) {
                                    return self.escape(x !== null ? x : null);
                                }).join(', '), '))');
                                return sql;
                            } else if (_typeof(comparison.$in) === 'object') {
                                //try to validate if comparison.$in is a select query expression (sub-query support)
                                var sq = _.assign(new QueryExpression(), comparison.$in);
                                if (sq.$select) {
                                    //if sub query is a select expression
                                    return sprintf.sprintf('(%s IN (%s))', escapedProperty, self.format(sq));
                                }
                            }
                            //otherwise throw error
                            throw new Error('Invalid query argument. An in statement must contain one or more values.');
                        case '$nin':
                            if (_.isArray(comparison.$nin)) {
                                if (comparison.$nin.length === 0) return sprintf.sprintf('(NOT %s IN (NULL))', escapedProperty);
                                sql = '(NOT '.concat(escapedProperty, ' IN (', _.map(comparison.$nin, function (x) {
                                    return self.escape(x !== null ? x : null);
                                }).join(', '), '))');
                                return sql;
                            } else if (_typeof(comparison.$in) === 'object') {
                                //try to validate if comparison.$nin is a select query expression (sub-query support)
                                var _sq = _.assign(new QueryExpression(), comparison.$in);
                                if (_sq.$select) {
                                    //if sub query is a select expression
                                    return sprintf.sprintf('(NOT %s IN (%s))', escapedProperty, self.format(_sq));
                                }
                            }
                            //otherwise throw error
                            throw new Error('Invalid query argument. An in statement must contain one or more values.');
                        default:
                            //search if current operator (arithmetic, evaluation etc) exists as a formatter function (e.g. function $add(p1,p2) { ... } )
                            //in this case the first parameter is the defined property e.g. Price
                            // and the property value contains an array of all others parameters (if any) and the comparison operator
                            // e.g. { Price: { $add: [5, { $gt:100} ]} } where we are trying to find elements that meet the following query expression: (Price+5)>100
                            // The identifier <Price> is the first parameter, the constant 5 is the second
                            var fn = this[op],
                                p0 = property,
                                p1 = comparison[op];
                            if (typeof fn === 'function') {
                                var args = [];
                                var argn = null;
                                //push identifier
                                args.push({ $name: property });
                                if (_.isArray(p1)) {
                                    //push other parameters
                                    for (var j = 0; j < p1.length - 1; j++) {
                                        args.push(p1[j]);
                                    }
                                    //get comparison argument (last item of the arguments' array)
                                    argn = p1[p1.length - 1];
                                } else {
                                    if (self.isComparison(p1)) {
                                        argn = p1;
                                    } else {
                                        //get comparison argument (equal)
                                        argn = { $eq: p1.valueOf() };
                                    }
                                }
                                //call formatter function
                                var f0 = fn.apply(this, args);
                                return self.formatComparison(argn).replace(/%s/g, f0.replace('$', '\$'));
                            } else {
                                //equal expression
                                if (typeof p1 !== 'undefined' && p1 !== null) return sprintf.sprintf('(%s=%s)', property, self.escape(p1));else return sprintf.sprintf('(%s IS NULL)', property);
                            }

                    }
            }
        }

        /**
         * Implements startsWith(a,b) expression formatter.
         * @param {*} p0
         * @param {*} p1
         * @returns {string}
         */

    }, {
        key: '$startswith',
        value: function $startswith(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            return sprintf.sprintf('(%s REGEXP \'^%s\')', this.escape(p0), this.escape(p1, true));
        }

        /**
         * Implements endsWith(a,b) expression formatter.
         * @param {*} p0
         * @param {*} p1
         * @returns {string}
         */

    }, {
        key: '$endswith',
        value: function $endswith(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            return sprintf.sprintf('(%s REGEXP \'%s$$\')', this.escape(p0), this.escape(p1, true));
        }

        /**
         * Implements regular expression formatting.
         * @param {*} p0
         * @param {string|*} p1
         * @returns {string}
         */

    }, {
        key: '$regex',
        value: function $regex(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            return sprintf.sprintf('(%s REGEXP \'%s\')', this.escape(p0), this.escape(p1, true));
        }

        /**
         * Implements length(a) expression formatter.
         * @param {*} p0
         * @returns {string}
         */

    }, {
        key: '$length',
        value: function $length(p0) {
            return sprintf.sprintf('LEN(%s)', this.escape(p0));
        }

        /**
         * Implements trim(a) expression formatter.
         * @param {*} p0
         * @returns {string}
         */

    }, {
        key: '$trim',
        value: function $trim(p0) {
            return sprintf.sprintf('TRIM(%s)', this.escape(p0));
        }

        /**
         * Implements concat(a,b) expression formatter.
         * @param {*} p0
         * @param {*} p1
         * @returns {string}
         */

    }, {
        key: '$concat',
        value: function $concat(p0, p1) {
            return sprintf.sprintf('CONCAT(%s,%s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements indexOf(str,substr) expression formatter.
         * @param {string} p0 The source string
         * @param {string} p1 The string to search for
         * @returns {string}
         */

    }, {
        key: '$indexof',
        value: function $indexof(p0, p1) {
            return sprintf.sprintf('LOCATE(%s,%s)', this.escape(p1), this.escape(p0));
        }

        /**
         * Implements substring(str,pos) expression formatter.
         * @param {String} p0 The source string
         * @param {Number} pos The starting position
         * @param {Number=} length The length of the resulted string
         * @returns {string}
         */

    }, {
        key: '$substring',
        value: function $substring(p0, pos, length) {
            if (length) return sprintf.sprintf('SUBSTRING(%s,%s,%s)', this.escape(p0), pos.valueOf() + 1, length.valueOf());else return sprintf.sprintf('SUBSTRING(%s,%s)', this.escape(p0), pos.valueOf() + 1);
        }

        /**
         * Implements lower(str) expression formatter.
         * @param {String} p0
         * @returns {string}
         */

    }, {
        key: '$tolower',
        value: function $tolower(p0) {
            return sprintf.sprintf('LOWER(%s)', this.escape(p0));
        }

        /**
         * Implements upper(str) expression formatter.
         * @param {String} p0
         * @returns {string}
         */

    }, {
        key: '$toupper',
        value: function $toupper(p0) {
            return sprintf.sprintf('UPPER(%s)', this.escape(p0));
        }

        /**
         * Implements contains(a,b) expression formatter.
         * @param {*} p0
         * @param {*} p1
         * @returns {string}
         */

    }, {
        key: '$contains',
        value: function $contains(p0, p1) {
            return this.$text(p0, p1);
        }

        /**
         * Implements contains(a,b) expression formatter.
         * @param {string|*} p0
         * @param {string|*} p1
         * @returns {string}
         */

    }, {
        key: '$text',
        value: function $text(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            if (p1.valueOf().toString().length === 0) return '';
            return sprintf.sprintf('(%s REGEXP \'%s\')', this.escape(p0), this.escape(p1, true));
        }
    }, {
        key: '$day',
        value: function $day(p0) {
            return sprintf.sprintf('DAY(%s)', this.escape(p0));
        }
    }, {
        key: '$month',
        value: function $month(p0) {
            return sprintf.sprintf('MONTH(%s)', this.escape(p0));
        }
    }, {
        key: '$year',
        value: function $year(p0) {
            return sprintf.sprintf('YEAR(%s)', this.escape(p0));
        }
    }, {
        key: '$hour',
        value: function $hour(p0) {
            return sprintf.sprintf('HOUR(%s)', this.escape(p0));
        }
    }, {
        key: '$minute',
        value: function $minute(p0) {
            return sprintf.sprintf('MINUTE(%s)', this.escape(p0));
        }
    }, {
        key: '$second',
        value: function $second(p0) {
            return sprintf.sprintf('SECOND(%s)', this.escape(p0));
        }
    }, {
        key: '$date',
        value: function $date(p0) {
            return sprintf.sprintf('DATE(%s)', this.escape(p0));
        }
    }, {
        key: '$floor',
        value: function $floor(p0) {
            return sprintf.sprintf('FLOOR(%s)', this.escape(p0));
        }
    }, {
        key: '$ceiling',
        value: function $ceiling(p0) {
            return sprintf.sprintf('CEILING(%s)', this.escape(p0));
        }

        /**
         * Implements round(a) expression formatter.
         * @param {*} p0
         * @param {*=} p1
         * @returns {string}
         */

    }, {
        key: '$round',
        value: function $round(p0, p1) {
            if (_.isNil(p1)) p1 = 0;
            return sprintf.sprintf('ROUND(%s,%s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements a + b expression formatter.
         * @param {*} p0
         * @param {*} p1
         * @returns {string}
         */

    }, {
        key: '$add',
        value: function $add(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '0';
            return sprintf.sprintf('(%s + %s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Validates whether the given parameter is a field object or not.
         * @param obj
         * @returns {boolean}
         */

    }, {
        key: 'isField',
        value: function isField(obj) {
            if (obj === null || typeof obj === 'undefined') return false;
            if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') if (obj.hasOwnProperty('$name')) return true;
            return false;
        }

        /**
         * Implements a - b expression formatter.
         * @param {*} p0
         * @param {*} p1
         * @returns {string}
         */

    }, {
        key: '$sub',
        value: function $sub(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '0';
            return sprintf.sprintf('(%s - %s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements a * b expression formatter.
         * @param p0 {*}
         * @param p1 {*}
         */

    }, {
        key: '$mul',
        value: function $mul(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '0';
            return sprintf.sprintf('(%s * %s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements [a / b] expression formatter.
         * @param p0 {*}
         * @param p1 {*}
         */

    }, {
        key: '$div',
        value: function $div(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '0';
            return sprintf.sprintf('(%s / %s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements [a mod b] expression formatter.
         * @param p0 {*}
         * @param p1 {*}
         */

    }, {
        key: '$mod',
        value: function $mod(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '0';
            return sprintf.sprintf('(%s % %s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements [a & b] bitwise and expression formatter.
         * @param p0 {*}
         * @param p1 {*}
         */

    }, {
        key: '$bit',
        value: function $bit(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '0';
            return sprintf.sprintf('(%s & %s)', this.escape(p0), this.escape(p1));
        }

        /**
         *
         * @param obj {QueryExpression|*}
         * @returns {string}
         */

    }, {
        key: 'formatSelect',
        value: function formatSelect(obj) {
            var $this = this;
            var sql = '';
            var escapedEntity = void 0;
            if (_.isNil(obj.$select)) throw new Error('Select expression cannot be empty at this context.');
            //get entity name
            var entity = _.findKey(obj.$select);
            var joins = [];
            if (_.isArray(obj.$expand)) {
                joins = _.filter(obj.$expand, function (x) {
                    return _.isObject(x);
                });
            } else if (_.isObject(obj.$expand)) {
                joins.push(obj.$expand);
            }
            //get entity fields
            var fields = obj.fields();
            //if fields is not an array
            if (!_.isArray(fields)) throw new Error('Select expression does not contain any fields or the collection of fields is of the wrong type.');

            //validate entity reference (if any)
            if (obj.$ref && obj.$ref[entity]) {
                var entityRef = obj.$ref[entity];
                //escape entity ref
                escapedEntity = entityRef.$as ? $this.escapeName(entityRef.name) + ' AS ' + $this.escapeName(entityRef.$as) : $this.escapeName(entityRef.name);
            } else {
                //escape entity name
                escapedEntity = $this.escapeName(entity);
            }
            //add basic SELECT statement
            if (obj.$fixed) {
                sql = sql.concat('SELECT * FROM (SELECT ', _.map(fields, function (x) {
                    return $this.format(x, '%f');
                }).join(', '), ') ', escapedEntity);
            } else {
                sql = sql.concat(obj.$distinct ? 'SELECT DISTINCT ' : 'SELECT ', _.map(fields, function (x) {
                    return $this.format(x, '%f');
                }).join(', '), ' FROM ', escapedEntity);
            }

            var table = void 0;

            //add join if any
            _.forEach(joins, function (x) {
                if (x.$entity instanceof QueryExpression) {
                    //get on statement (the join comparison)
                    sql = sql.concat(sprintf.sprintf(' INNER JOIN (%s)', $this.format(x.$entity)));
                    //add alias
                    if (x.$entity.$alias) sql = sql.concat(' AS ').concat($this.escapeName(x.$entity.$alias));
                } else {
                    //get join table name
                    table = _.findKey(x.$entity);
                    //get on statement (the join comparison)
                    var joinType = (x.$entity.$join || 'inner').toUpperCase();
                    sql = sql.concat(' ' + joinType + ' JOIN ').concat($this.escapeName(table));
                    //add alias
                    if (x.$entity.$as) sql = sql.concat(' AS ').concat($this.escapeName(x.$entity.$as));
                }
                if (_.isArray(x.$with)) {
                    if (x.$with.length !== 2) throw new Error('Invalid join comparison expression.');

                    //get left and right expression
                    var left = x.$with[0];

                    var right = x.$with[1];

                    var leftTable = entity;
                    var rightTable = table;

                    if ((typeof left === 'undefined' ? 'undefined' : _typeof(left)) === 'object') {
                        leftTable = _.findKey(left);
                    }
                    if ((typeof right === 'undefined' ? 'undefined' : _typeof(right)) === 'object') {
                        rightTable = _.findKey(right);
                    }
                    var leftFields = [];
                    var rightFields = [];
                    leftFields.push.apply(leftFields, _.isArray(left[leftTable]) ? left[leftTable] : [left[leftTable]]);
                    rightFields.push.apply(rightFields, _.isArray(right[rightTable]) ? right[rightTable] : [right[rightTable]]);

                    for (var i = 0; i < leftFields.length; i++) {
                        var leftExpr = null,
                            rightExpr = null;
                        if (_typeof(leftFields[i]) === 'object') leftExpr = leftFields[i];else {
                            leftExpr = {};
                            leftExpr[leftTable] = leftFields[i];
                        }
                        if (_typeof(rightFields[i]) === 'object') rightExpr = rightFields[i];else {
                            rightExpr = {};
                            rightExpr[rightTable] = rightFields[i];
                        }
                        sql = sql.concat(i === 0 ? ' ON ' : ' AND ', $this.formatField(leftExpr), '=', $this.formatField(rightExpr));
                    }
                } else {
                    sql = sql.concat(' ON ', $this.formatWhere(x.$with));
                }
            });
            //add WHERE statement if any
            if (_.isObject(obj.$where)) {
                if (_.isObject(obj.$prepared)) {
                    var where1 = { $and: [obj.$where, obj.$prepared] };
                    sql = sql.concat(' WHERE ', this.formatWhere(where1));
                } else {
                    sql = sql.concat(' WHERE ', this.formatWhere(obj.$where));
                }
            } else {
                if (_.isObject(obj.$prepared)) sql = sql.concat(' WHERE ', this.formatWhere(obj.$prepared));
            }

            if (_.isObject(obj.$group)) sql = sql.concat(this.formatGroupBy(obj.$group));

            if (_.isObject(obj.$order)) sql = sql.concat(this.formatOrder(obj.$order));

            //finally return statement
            return sql;
        }

        /**
         *
         * @param {QueryExpression} obj
         * @returns {string}
         */

    }, {
        key: 'formatLimitSelect',
        value: function formatLimitSelect(obj) {

            var sql = this.formatSelect(obj);
            if (obj.$take) {
                if (obj.$skip)
                    //add limit and skip records
                    sql = sql.concat(' LIMIT ', obj.$skip.toString(), ', ', obj.$take.toString());else
                    //add only limit
                    sql = sql.concat(' LIMIT ', obj.$take.toString());
            }
            return sql;
        }
    }, {
        key: 'formatField',
        value: function formatField(obj) {
            var self = this;
            if (obj === null) return '';
            if (typeof obj === 'string') return obj;
            if (_.isArray(obj)) {
                return _.map(obj, function (x) {
                    return x.valueOf();
                }).join(', ');
            }
            if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
                //if field is a constant e.g. { $value:1000 }
                if (obj.hasOwnProperty('$value')) return this.escapeConstant(obj['$value']);
                //get table name
                var tableName = _.findKey(obj);
                var fields = [];
                if (!_.isArray(obj[tableName])) {
                    fields.push(obj[tableName]);
                } else {
                    fields = obj[tableName];
                }
                return _.map(fields, function (x) {
                    if (QueryField.fieldNameExpression.test(x.valueOf())) return self.escapeName(tableName.concat('.').concat(x.valueOf()));else return self.escapeName(x.valueOf());
                }).join(', ');
            }
        }

        /**
         * Formats a order object to the equivalent SQL statement
         * @param obj
         * @returns {string}
         */

    }, {
        key: 'formatOrder',
        value: function formatOrder(obj) {
            var self = this;
            if (!_.isArray(obj)) return '';
            var sql = _.map(obj, function (x) {
                var f = x.$desc ? x.$desc : x.$asc;
                if (typeof f === 'undefined' || f === null) throw new Error('An order by object must have either ascending or descending property.');
                if (_.isArray(f)) {
                    return _.map(f, function (a) {
                        return self.format(a, '%ff').concat(x.$desc ? ' DESC' : ' ASC');
                    }).join(', ');
                }
                return self.format(f, '%ff').concat(x.$desc ? ' DESC' : ' ASC');
            }).join(', ');
            if (sql.length > 0) return ' ORDER BY '.concat(sql);
            return sql;
        }

        /**
         * Formats a group by object to the equivalent SQL statement
         * @param obj {Array}
         * @returns {string}
         */

    }, {
        key: 'formatGroupBy',
        value: function formatGroupBy(obj) {
            var self = this;
            if (!_.isArray(obj)) return '';
            var arr = [];
            _.forEach(obj, function (x) {
                arr.push(self.format(x, '%ff'));
            });
            var sql = arr.join(', ');
            if (sql.length > 0) return ' GROUP BY '.concat(sql);
            return sql;
        }

        /**
         * Formats an insert query to the equivalent SQL statement
         * @param obj {QueryExpression|*}
         * @returns {string}
         */

    }, {
        key: 'formatInsert',
        value: function formatInsert(obj) {
            var self = this;
            var sql = '';
            if (_.isNil(obj.$insert)) throw new Error('Insert expression cannot be empty at this context.');
            //get entity name
            var entity = _.findKey(obj.$insert);
            //get entity fields
            var obj1 = obj.$insert[entity];
            var props = [];
            for (var prop in obj1) {
                if (obj1.hasOwnProperty(prop)) props.push(prop);
            }sql = sql.concat('INSERT INTO ', self.escapeName(entity), '(', _.map(props, function (x) {
                return self.escapeName(x);
            }).join(', '), ') VALUES (', _.map(props, function (x) {
                var value = obj1[x];
                return self.escape(value !== null ? value : null);
            }).join(', '), ')');
            return sql;
        }

        /**
         * Formats an update query to the equivalent SQL statement
         * @param obj {QueryExpression|*}
         * @returns {string}
         */

    }, {
        key: 'formatUpdate',
        value: function formatUpdate(obj) {
            var self = this;
            var sql = '';
            if (!_.isObject(obj.$update)) throw new Error('Update expression cannot be empty at this context.');
            //get entity name
            var entity = _.findKey(obj.$update);
            //get entity fields
            var obj1 = obj.$update[entity];
            var props = [];
            for (var prop in obj1) {
                if (obj1.hasOwnProperty(prop)) props.push(prop);
            } //add basic INSERT statement
            sql = sql.concat('UPDATE ', self.escapeName(entity), ' SET ', _.map(props, function (x) {
                var value = obj1[x];
                return self.escapeName(x).concat('=', self.escape(value !== null ? value : null));
            }).join(', '));
            if (_.isObject(obj.$where)) sql = sql.concat(' WHERE ', this.formatWhere(obj.$where));
            return sql;
        }

        /**
         * Formats a delete query to the equivalent SQL statement
         * @param obj {QueryExpression|*}
         * @returns {string}
         */

    }, {
        key: 'formatDelete',
        value: function formatDelete(obj) {
            var sql = '';
            if (obj.$delete === null) throw new Error('Delete expression cannot be empty at this context.');
            //get entity name
            var entity = obj.$delete;
            //add basic INSERT statement
            sql = sql.concat('DELETE FROM ', this.escapeName(entity));
            if (_.isObject(obj.$where)) sql = sql.concat(' WHERE ', this.formatWhere(obj.$where));
            return sql;
        }
    }, {
        key: 'escapeName',
        value: function escapeName(name) {
            if (typeof name === 'string') return name.replace(/(\w+)$|^(\w+)$/g, this.settings.nameFormat);
            return name;
        }

        /**
         * @param obj {QueryField}
         * @param format {string}
         * @returns {string|*}
         */

    }, {
        key: 'formatFieldEx',
        value: function formatFieldEx(obj, format) {

            if (typeof obj === 'undefined' || obj === null) return null;
            if (!isQueryField_(obj)) throw new Error('Invalid argument. An instance of QueryField class is expected.');
            //get property
            var prop = _.findKey(obj);
            if (prop === null) return null;
            var useAlias = format === '%f';
            if (prop === '$name') {
                return this.settings.forceAlias && useAlias ? this.escapeName(obj.$name).concat(' AS ', this.escapeName(obj.name())) : this.escapeName(obj.$name);
            } else {
                var expr = obj[prop];
                if (expr === null) throw new Error('Field definition cannot be empty while formatting.');
                if (typeof expr === 'string') {
                    return useAlias ? this.escapeName(expr).concat(' AS ', this.escapeName(prop)) : expr;
                }
                //get aggregate expression
                var alias = prop;
                prop = _.findKey(expr);
                var name = expr[prop];
                var s = void 0;
                switch (prop) {
                    case '$count':
                        s = sprintf.sprintf('COUNT(%s)', this.escapeName(name));
                        break;
                    case '$min':
                        s = sprintf.sprintf('MIN(%s)', this.escapeName(name));
                        break;
                    case '$max':
                        s = sprintf.sprintf('MAX(%s)', this.escapeName(name));
                        break;
                    case '$avg':
                        s = sprintf.sprintf('AVG(%s)', this.escapeName(name));
                        break;
                    case '$sum':
                        s = sprintf.sprintf('SUM(%s)', this.escapeName(name));
                        break;
                    case '$value':
                        s = this.escapeConstant(name);
                        break;
                    default:
                        var fn = this[prop];
                        if (typeof fn === 'function') {
                            /**
                             * get method arguments
                             * @type {Array}
                             */
                            var args = expr[prop];
                            s = fn.apply(this, args);
                        } else throw new Error('The specified function is not yet implemented.');
                }
                return useAlias ? s.concat(' AS ', this.escapeName(alias)) : s;
            }
        }

        /**
         * Formats a query expression and returns the SQL equivalent string
         * @param obj {QueryExpression|*}
         * @param s {string=}
         * @returns {string|*}
         */

    }, {
        key: 'format',
        value: function format(obj, s) {
            if (obj === null) return null;
            //if a format is defined
            if (s !== undefined) {
                if (s === '%f' || s === '%ff') {
                    //field formatting
                    var field = new QueryField();
                    if (typeof obj === 'string') field.select(obj);else field = _.assign(new QueryField(), obj);
                    return this.formatFieldEx(field, s);
                } else if (s === '%o') {
                    if (obj instanceof QueryExpression) return this.formatOrder(obj.$order);
                    return this.formatOrder(obj);
                }
            }

            /**
             * @type {QueryExpression}
             */
            var query = null;
            //cast object to QueryExpression
            if (obj instanceof QueryExpression) query = obj;else query = _.assign(new QueryExpression(), obj);
            //format query
            if (_.isObject(query.$select)) {
                if (!query.hasPaging()) return this.formatSelect(query);else return this.formatLimitSelect(query);
            } else if (_.isObject(query.$insert)) return this.formatInsert(query);else if (_.isObject(query.$update)) return this.formatUpdate(query);else if (query.$delete !== null) return this.formatDelete(query);else if (query.$where !== null) return this.formatWhere(query.$where);else return null;
        }
    }]);

    return SqlFormatter;
}();

SqlFormatter.prototype.$indexOf = SqlFormatter.prototype.$indexof;

SqlFormatter.prototype.$substr = SqlFormatter.prototype.$substring;

SqlFormatter.prototype.$toLower = SqlFormatter.prototype.$tolower;
SqlFormatter.prototype.$toUpper = SqlFormatter.prototype.$toupper;
SqlFormatter.prototype.$dayOfMonth = SqlFormatter.prototype.$day;
SqlFormatter.prototype.$minutes = SqlFormatter.prototype.$minute;
SqlFormatter.prototype.$seconds = SqlFormatter.prototype.$second;

SqlFormatter.prototype.$subtract = SqlFormatter.prototype.$sub;

SqlFormatter.prototype.$multiply = SqlFormatter.prototype.$mul;

SqlFormatter.prototype.$divide = SqlFormatter.prototype.$div;

function isQueryField_(obj) {
    if (_.isNil(obj)) return false;
    return obj.constructor && obj.constructor.name === 'QueryField';
}
//# sourceMappingURL=formatter.js.map
