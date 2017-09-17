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
exports.OpenDataQuery = exports.QueryField = exports.QueryFieldUtils = exports.QueryValue = exports.QueryEntity = exports.QueryExpression = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _lodash = require('lodash');

var _ = _lodash._;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _empty(obj) {
    if (typeof obj === 'undefined' || obj === null) {
        return;
    }
    _.forEach(_.keys(obj), function (x) {
        if (obj.hasOwnProperty(x)) {
            delete obj[x];
        }
    });
}

/**
 * @class
 */

var QueryParameter = function QueryParameter() {
    //do nothing

    _classCallCheck(this, QueryParameter);
};

/**
 * @class
 */


var QueryFieldAggregator = function () {
    function QueryFieldAggregator() {
        _classCallCheck(this, QueryFieldAggregator);
    }

    _createClass(QueryFieldAggregator, [{
        key: 'wrapWith',

        /**
         * Wraps the given comparison expression in this aggregate function e.g. wraps { $gt:45 } with $floor aggregate function and returns { $floor: { $gt:45 } }
         * @param {*} comparison
         */
        value: function wrapWith(comparison) {
            var name = _.keys(this)[0];
            if (name) {
                if (_.isArray(this[name])) {
                    //search for query parameter
                    for (var i = 0; i < this[name].length; i++) {
                        if (this[name][i] instanceof QueryParameter) {
                            this[name][i] = comparison;
                            return this;
                        }
                    }
                    throw new Error('Invalid aggregate expression. Parameter is missing.');
                } else {
                    if (this[name] instanceof QueryParameter) {
                        this[name] = comparison;
                        return this;
                    }
                    throw new Error('Invalid aggregate expression. Parameter is missing.');
                }
            }
            throw new Error('Invalid aggregate expression. Aggregator is missing.');
        }
    }]);

    return QueryFieldAggregator;
}();

var privatesProperty = Symbol('privates');

/**
 * @class
 */

var QueryExpression = exports.QueryExpression = function () {
    /**
     * @constructor
     */
    function QueryExpression() {
        _classCallCheck(this, QueryExpression);

        /**
         * Gets or sets an object or an array of objects that represents the entity where a select query will be applied.
         * e.g. $select : { products: ['id', 'title', 'price'] },
         * $select : [{ products: ['id', 'title', 'price'] }, { manufacturer:[ 'id', 'title', 'location'] }]
         * @type {*}
         * @private
         */
        this.$select = undefined;
        /**
         * Gets or sets an object or an array of objects that represents the entity where a delete query will be applied.
         * e.g. { $delete : 'products', $where : { id :100 } }
         * @type {*}
         * @private
         */
        this.$delete = undefined;
        /**
         Gets or sets an object or an array of objects that represents the entity where an update query will be applied.
         * e.g. $update : { products: {title: 'string #1', price: 100}, $where: { id:100 } }
         * @type {*}
         * @private
         */
        this.$update = undefined;
        /**
         * Gets or sets an object or an array of objects that represents the entity where an insert query will be applied.
         * e.g. $insert : { products: { title: 'string #1', price: 100} }
         * @type {*}
         * @private
         */
        this.$insert = undefined;
        /**
         * Gets or sets the order statement of this query
         * e.g. $order: [{ $asc: 'price' }, { $desc: 'dateCreated' }] or $order: [{ $asc: ['price', 'dateCreated'] }]
         * @type {*}
         * @private
         */
        this.$order = undefined;
        /**
         * Gets or sets the group by statement of this query
         * e.g. $group: ['price', 'dateCreated']
         * @type {*}
         * @private
         */
        this.$group = undefined;
        /**
         * @type {*}
         * @private
         */
        this.$expand = undefined;
        /**
         * Represents the filter statement of this query expression
         * e.g. $where : { { price: 100} }
         * @type {*}
         * @private
         */
        this.$where = undefined;
        /**
         * Represents a prepared filter that
         * e.g. $where : { { price: 100} }
         * @type {*}
         * @private
         */
        this.$prepared = undefined;
        /**
         * Represents a select query with only fixed values e.g. SELECT * FROM (SELECT 1 AS id,'test' AS title) t0
         * @type {*}
         * @private
         */
        this.$fixed = undefined;
        /**
         * @private
         */
        this[privatesProperty] = {};
    }

    /**
     * Creates a new query expression
     * @param {*=} entity
     * @param {Array=} fields
     * @returns {QueryExpression}
     */


    _createClass(QueryExpression, [{
        key: 'prop',


        /**
         * @private
         * @param {string|*=} s
         * @returns {string|*}
         */
        value: function prop(s) {
            if (typeof s === 'undefined') {
                return this[privatesProperty].prop;
            }
            if (s == null) {
                delete this[privatesProperty].prop;
            }
            this[privatesProperty].prop = s;
        }

        /**
         * Clones the current expression and returns a new QueryExpression object.
         * @example
         * var q = new QueryExpression();
         * //do some stuff
         * //...
         * //clone expression
         * var q1 = q.clone();
         * @returns {QueryExpression}
         */

    }, {
        key: 'clone',
        value: function clone() {
            return _.assign(new QueryExpression(), this);
        }

        /**
         * Sets the alias of a QueryExpression instance. This alias is going to be used in sub-query operations.
         * @returns {QueryExpression}
         */

    }, {
        key: 'as',
        value: function as(alias) {
            this.$alias = alias;
            return this;
        }

        /**
         * Gets a collection that represents the selected fields of the underlying expression
         * @returns {Array}
         */

    }, {
        key: 'fields',
        value: function fields() {

            if (typeof this.$select === 'undefined' || this.$select == null) return [];
            var entity = _.findKey(this.$select);
            var joins = [];
            if (this.$expand != null) {
                if (_.isArray(this.$expand)) joins = this.$expand;else joins.push(this.$expand);
            }
            //get entity fields
            var fields = [];
            //get fields
            var re = QueryField.fieldNameExpression,
                arr = this.$select[entity] || [];
            _.forEach(arr, function (x) {
                if (typeof x === 'string') {
                    re.lastIndex = 0;
                    if (!re.test(x)) fields.push(new QueryField(x));else {
                        var f = new QueryField(x);
                        fields.push(f.from(entity));
                    }
                } else {
                    fields.push(_.assign(new QueryField(), x));
                }
            });
            //enumerate join fields
            _.forEach(joins, function (x) {
                if (x.$entity instanceof QueryExpression) {
                    //todo::add fields if any
                } else {
                    var table = _.findKey(x.$entity),
                        tableFields = x.$entity[table] || [];
                    _.forEach(tableFields, function (y) {
                        if (typeof x === 'string') {
                            fields.push(new QueryField(y));
                        } else {
                            fields.push(_.assign(new QueryField(), y));
                        }
                    });
                }
            });
            return fields;
        }

        /**
         * Gets a boolean value that indicates whether query expression has a filter statement or not.
         * @returns {boolean}
         */

    }, {
        key: 'hasFilter',
        value: function hasFilter() {
            return _.isObject(this.$where);
        }

        /**
         * @param {Boolean} useOr
         * @returns {QueryExpression}
         */

    }, {
        key: 'prepare',
        value: function prepare(useOr) {
            if (_typeof(this.$where) === 'object') {
                if (_typeof(this.$prepared) === 'object') {
                    var preparedWhere = {};
                    if (useOr) preparedWhere = { $or: [this.$prepared, this.$where] };else preparedWhere = { $and: [this.$prepared, this.$where] };
                    this.$prepared = preparedWhere;
                } else {
                    this.$prepared = this.$where;
                }
                delete this.$where;
            }
            return this;
        }

        /**
         * Gets a boolean value that indicates whether query expression has fields or not.
         * @returns {boolean}
         */

    }, {
        key: 'hasFields',
        value: function hasFields() {
            var self = this;
            if (!_.isObject(self.$select)) return false;
            var entity = _.findKey(self.$select);
            var joins = [];
            if (self.$expand != null) {
                if (_.isArray(self.$expand)) joins = self.$expand;else joins.push(self.$expand);
            }
            //search for fields
            if (_.isArray(self.$select[entity])) {
                if (self.$select[entity].length > 0) return true;
            }
            var result = false;
            //enumerate join fields
            _.forEach(joins, function (x) {
                var table = _.findKey(x.$entity);
                if (_.isArray(x.$entity[table])) {
                    if (x.$entity[table].length > 0) result = true;
                }
            });
            return result;
        }

        /**
         * Gets a boolean value that indicates whether query expression has paging or not.
         * @returns {boolean}
         */

    }, {
        key: 'hasPaging',
        value: function hasPaging() {
            return typeof this.$take !== 'undefined' && this.$take != null;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'distinct',
        value: function distinct(value) {
            if (typeof value === 'undefined') this.$distinct = true;else this.$distinct = value || false;
            return this;
        }

        /**
         * @param name {string|QueryField|*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'where',
        value: function where(name) {
            if (_.isNil(name)) throw new Error('Left operand cannot be empty. Expected string or object.');
            delete this.$where;
            if (typeof name === 'string') {
                this.prop(name);
            } else if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
                this.prop(QueryField.prototype.nameOf.call(name));
            } else {
                throw new Error('Invalid left operand. Expected string or object.');
            }
            return this;
        }

        /**
         * Injects the given filter expression into the current query expression
         * @param {*} where - An object that represents a filter expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'injectWhere',
        value: function injectWhere(where) {
            if (_.isNil(where)) return this;
            this.$where = where;
            return this;
        }

        /**
         * Initializes a delete query and sets the entity name that is going to be used in this query.
         * @param entity {string}
         * @returns {QueryExpression}
         */

    }, {
        key: 'delete',
        value: function _delete(entity) {
            if (entity == null) return this;
            this.$delete = entity.valueOf();
            //delete other properties (if any)
            delete this.$insert;
            delete this.$select;
            delete this.$update;
            return this;
        }

        /**
         * Initializes an insert query and sets the object that is going to be inserted.
         * @param obj {*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'insert',
        value: function insert(obj) {
            if (obj == null) return this;
            if (_.isArray(obj) || _.isObject(obj)) {
                this.$insert = { table1: obj };
                //delete other properties (if any)
                delete this.$delete;
                delete this.$select;
                delete this.$update;
                return this;
            } else {
                throw new Error('Invalid argument. Object must be an object or an array of objects');
            }
        }
    }, {
        key: 'into',
        value: function into(entity) {
            if (entity == null) return this;
            if (this.$insert == null) return this;
            var prop = _.findKey(this.$insert);
            if (prop == null) return this;
            if (prop == entity) return this;
            var value = this.$insert[prop];
            if (value == null) return this;
            this.$insert[entity] = value;
            delete this.$insert[prop];
            return this;
        }

        /**
         * Initializes an update query and sets the entity name that is going to be used in this query.
         * @param {string} entity
         * @returns {QueryExpression}
         */

    }, {
        key: 'update',
        value: function update(entity) {
            if (entity == null) return this;
            if (typeof entity !== 'string') throw new Error('Invalid argument type. Update entity argument must be a string.');
            this.$update = {};
            this.$update[entity] = {};
            //delete other properties (if any)
            delete this.$delete;
            delete this.$select;
            delete this.$insert;
            return this;
        }

        /**
         * Sets the object that is going to be updated through an update expression.
         * @param {*} obj
         * @returns {QueryExpression}
         */

    }, {
        key: 'set',
        value: function set(obj) {
            if (obj == null) return this;
            if (_.isArray(obj) || !_.isObject(obj)) throw new Error('Invalid argument type. Update expression argument must be an object.');
            //get entity name (by property)
            var prop = _.findKey(this.$update);
            if (prop == null) throw new Error('Invalid operation. Update entity cannot be empty at this context.');
            //set object to update
            this.$update[prop] = obj;
            return this;
        }

        /**
         *
         * @param props {...*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'select',
        value: function select(props) {

            var args = Array.prototype.slice.call(arguments);
            if (args.length == 0) return this;
            if (_.isArray(args[0]) && args.length > 1) {
                throw new TypeError('Invalid arguments. Expected array only (for backward compatibility issues)');
            }
            var fields = [];
            if (_.isArray(args[0])) {
                //validate parameters
                fields = args[0];
            } else {
                fields = args;
            }
            //if entity is already defined
            if (this[privatesProperty].entity) {
                //initialize $select property
                this.$select = {};
                //and set array of fields
                this.$select[this[privatesProperty].entity] = fields;
            } else {
                //otherwise store array of fields in temporary property and wait
                this[privatesProperty].fields = fields;
            }
            //delete other properties (if any)
            delete this.$delete;
            delete this.$insert;
            delete this.$update;
            return this;
        }

        /**
         * Sets the entity of a select query expression
         * @param entity {string|QueryEntity|*} A string that represents the entity name
         * @returns {QueryExpression}
         */

    }, {
        key: 'from',
        value: function from(entity) {

            if (_.isNil(entity)) return this;
            var name = void 0;
            if (entity instanceof QueryEntity) {
                name = entity.$as || entity.name;
                this.$ref = this.$ref || {};
                this.$ref[name] = entity;
            } else {
                name = entity.valueOf();
            }
            if (this[privatesProperty].fields) {
                //initialize $select property
                this.$select = {};
                //and set array of fields
                this.$select[name] = this[privatesProperty].fields;
            } else {
                this[privatesProperty].entity = name;
            }
            //delete other properties (if any)
            delete this.$delete;
            delete this.$insert;
            delete this.$update;
            //and return this object
            return this;
        }

        /**
         * Initializes a join expression with the specified entity
         * @param {*} entity
         * @param {Array=} props
         * @param {String=} alias
         * @returns {QueryExpression}
         */

    }, {
        key: 'join',
        value: function join(entity, props, alias) {

            if (entity == null) return this;
            if (this.$select == null) throw new Error('Query entity cannot be empty when adding a join entity.');
            var obj = {};
            if (entity instanceof QueryEntity) {
                //do nothing (clone object)
                obj = entity;
            } else if (entity instanceof QueryExpression) {
                //do nothing (clone object)
                obj = entity;
            } else {
                obj[entity] = props || [];
                if (typeof alias === 'string') obj.$as = alias;
            }
            this[privatesProperty].expand = { $entity: obj };
            //and return this object
            return this;
        }

        /**
         * Sets the join expression of the last join entity
         * @param obj {Array|*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'with',
        value: function _with(obj) {

            if (obj == null) return this;
            if (this[privatesProperty].expand == null) throw new Error('Join entity cannot be empty when adding a join expression. Use QueryExpression.join(entity, props) before.');
            if (obj instanceof QueryExpression) {
                /**
                 * @type {QueryExpression}
                 */
                var expr = obj;

                var where = null;
                if (expr.$where) where = expr.$prepared ? { $and: [expr.$prepared, expr.$where] } : expr.$where;else if (expr.$prepared) where = expr.$prepared;
                this[privatesProperty].expand.$with = where;
            } else {
                this[privatesProperty].expand.$with = obj;
            }
            if (this.$expand == null) {
                this.$expand = this[privatesProperty].expand;
            } else {
                if (_.isArray(this.$expand)) {
                    this.$expand.push(this[privatesProperty].expand);
                } else {
                    //get expand object
                    var expand = this.$expand;
                    //and create array of expand objects
                    this.$expand = [expand, this[privatesProperty].expand];
                }
            }
            //destroy temp object
            this[privatesProperty].expand = null;
            //and return QueryExpression
            return this;
        }

        /**
         * Applies an ascending ordering to a query expression
         * @param name {string|Array}
         * @returns {QueryExpression}
         */

    }, {
        key: 'orderBy',
        value: function orderBy(name) {

            if (name == null) return this;
            if (this.$order == null) this.$order = [];
            this.$order.push({ $asc: name });
            return this;
        }

        /**
         * Applies a descending ordering to a query expression
         * @param name
         * @returns {QueryExpression}
         */

    }, {
        key: 'orderByDescending',
        value: function orderByDescending(name) {

            if (name == null) return this;
            if (this.$order == null) this.$order = [];
            this.$order.push({ $desc: name });
            return this;
        }

        /**
         * Performs a subsequent ordering in a query expression
         * @param name {string|Array}
         * @returns {QueryExpression}
         */

    }, {
        key: 'thenBy',
        value: function thenBy(name) {

            if (name == null) return this;
            if (this.$order == null)
                //throw exception (?)
                return this;
            this.$order.push({ $asc: name });
            return this;
        }

        /**
         * Performs a subsequent ordering in a query expression
         * @param name {string|Array}
         * @returns {QueryExpression}
         */

    }, {
        key: 'thenByDescending',
        value: function thenByDescending(name) {

            if (name == null) return this;
            if (this.$order == null)
                //throw exception (?)
                return this;
            this.$order.push({ $desc: name });
            return this;
        }

        /**
         *
         * @param name {string|Array}
         * @returns {QueryExpression}
         */

    }, {
        key: 'groupBy',
        value: function groupBy(name) {

            if (name == null) return this;
            if (this.$group == null) this.$group = [];
            var self = this;
            if (_.isArray(name)) {
                _.forEach(name, function (x) {
                    if (x) self.$group.push(x);
                });
            } else this.$group.push(name);
            return this;
        }

        /**
         * @param expr
         * @private
         */

    }, {
        key: '__append',
        value: function __append(expr) {
            if (!expr) return;
            if (!this.$where) {
                this.$where = expr;
            } else {
                var op = this[privatesProperty].expr;
                if (op) {
                    //get current operator
                    var keys = _.keys(this.$where);
                    if (keys[0] == op) {
                        this.$where[op].push(expr);
                    } else {
                        var newFilter = {};
                        newFilter[op] = [this.$where, expr];
                        this.$where = newFilter;
                    }
                }
            }
            delete this[privatesProperty].prop;
            delete this[privatesProperty].expr;
            delete this[privatesProperty].aggr;
        }

        /**
         * @param name {string|QueryField}
         * @returns {QueryExpression}
         */

    }, {
        key: 'or',
        value: function or(name) {
            if (_.isNil(name)) throw new Error('Left operand cannot be empty. Expected string or object.');
            if (typeof name === 'string') {
                this.prop(name);
            } else if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
                this.prop(QueryField.prototype.nameOf.call(name));
            } else {
                throw new Error('Invalid left operand. Expected string or object.');
            }
            this[privatesProperty].expr = '$or';
            return this;
        }

        /**
         * @param name {string|QueryField|*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'and',
        value: function and(name) {
            if (_.isNil(name)) throw new Error('Left operand cannot be empty. Expected string or object.');
            if (typeof name === 'string') {
                this.prop(name);
            } else if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
                this.prop(QueryField.prototype.nameOf.call(name));
            } else {
                throw new Error('Invalid left operand. Expected string or object.');
            }
            this[privatesProperty].expr = '$and';
            return this;
        }

        /**
         * Prepares an equal expression.
         * @example
         * q.where('id').equal(10) //id=10 expression
         * @param {*} value - A value that represents the right part of the prepared expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'equal',
        value: function equal(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = value;
                //apply aggregation if any
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, value);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * Prepares a not equal expression.
         * @example
         * q.where('id').notEqual(10) //id<>10 expression
         * @param {*} value - A value that represents the right part of the prepared expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'notEqual',
        value: function notEqual(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $ne: value };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, { $ne: value });
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * Prepares an in statement expression
         * @example
         * q.where('id').in([10, 11, 12]) //id in (10,11,12) expression
         * @param {Array} values - An array of values that represents the right part of the prepared expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'in',
        value: function _in(values) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $in: values };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * Prepares a not in statement expression
         * @example
         * q.where('id').notIn([10, 11, 12]) //id in (10,11,12) expression
         * @param {Array} values - An array of values that represents the right part of the prepared expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'notIn',
        value: function notIn(values) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $nin: values };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, { $nin: values });
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param {*} value The value to be compared
         * @param {Number} result The result of modulo expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'mod',
        value: function mod(value, result) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $mod: [value, result] };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param {*} value The value to be compared
         * @param {Number} result The result of a bitwise and expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'bit',
        value: function bit(value, result) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $bit: [value, result] };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param value {*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'greaterThan',
        value: function greaterThan(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $gt: value };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param {string} value
         * @returns {QueryExpression}
         */

    }, {
        key: 'startsWith',
        value: function startsWith(value) {
            var p0 = this.prop();
            var r = void 0;
            if (p0) {
                if (!_.isString(value)) {
                    throw new Error('Invalid argument. Expected string.');
                }
                var comparison = { $regex: '^' + value, $options: 'i' };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, { $regex: '^' + value, $options: 'i' });
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param value {*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'endsWith',
        value: function endsWith(value) {
            var p0 = this.prop();
            var r = void 0;
            if (p0) {
                if (!_.isString(value)) {
                    throw new Error('Invalid argument. Expected string.');
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, { $regex: value + '$', $options: 'i' });
                this.__append(expr);
            }
            return this;
        }

        /**
         * Prepares a contains expression.
         * @example
         * var qry = require('most-query');
         * var q = qry.query('Person').where('first').contains('om').select(['id','first', 'last']);
         * var formatter = new qry.classes.SqlFormatter();
         * console.log(formatter.format(q));
         * //returns SELECT Person.id, Person.first, Person.last FROM Person WHERE ((first REGEXP 'om')=true)
         * @param  {*} value - A value that represents the right part of the expression
         * @returns {QueryExpression}
         */

    }, {
        key: 'contains',
        value: function contains(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $text: { $search: value } };
                //apply aggregation if any
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }
    }, {
        key: 'notContains',
        value: function notContains(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $text: { $search: value } };
                //apply aggregation if any
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = { $not: QueryFieldComparer.prototype.compareWith.call(p0, comparison) };
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param value {*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'lowerThan',
        value: function lowerThan(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $lt: value };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param value {*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'lowerOrEqual',
        value: function lowerOrEqual(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $lte: value };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param value {*}
         * @returns {QueryExpression}
         */

    }, {
        key: 'greaterOrEqual',
        value: function greaterOrEqual(value) {
            var p0 = this.prop();
            if (p0) {
                var comparison = { $gte: value };
                if (_typeof(this.aggr) === 'object') {
                    comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                    delete this.aggr;
                }
                var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
                this.__append(expr);
            }
            return this;
        }

        /**
         * @param {*} value1
         * @param {*} value2
         * @returns {QueryExpression}
         */

    }, {
        key: 'between',
        value: function between(value1, value2) {
            var p0 = this.prop();
            if (p0) {
                var comparison1 = { $gte: value1 },
                    comparison2 = { $lte: value2 };
                if (_typeof(this.aggr) === 'object') {
                    comparison1 = QueryFieldAggregator.prototype.wrapWith({ $gte: value1 });
                    comparison2 = QueryFieldAggregator.prototype.wrapWith({ $lte: value2 });
                    delete this.aggr;
                }
                var comp1 = QueryFieldComparer.prototype.compareWith.call(p0, comparison1);
                var comp2 = QueryFieldComparer.prototype.compareWith.call(p0, comparison2);
                var expr = {};
                expr['$and'] = [comp1, comp2];
                this.__append(expr);
            }
            return this;
        }

        /**
         * Skips the specified number of objects during select.
         * @param {Number} n
         * @returns {QueryExpression}
         */

    }, {
        key: 'skip',
        value: function skip(n) {
            this.$skip = isNaN(n) ? 0 : n;
            return this;
        }

        /**
         * Takes the specified number of objects during select.
         * @param {Number} n
         * @returns {QueryExpression}
         */

    }, {
        key: 'take',
        value: function take(n) {
            this.$take = isNaN(n) ? 0 : n;
            return this;
        }

        /**
         * @private
         * @param {number|*} number
         * @param {number} length
         * @returns {*}
         */

    }, {
        key: 'add',


        /**
         * @param {number|*} x
         * @returns {QueryExpression}
         */
        value: function add(x) {
            this.aggr = { $add: [x, new QueryParameter()] };
            return this;
        }

        /**
         * @param {number|*} x
         * @returns {QueryExpression}
         */

    }, {
        key: 'subtract',
        value: function subtract(x) {
            this.aggr = { $subtract: [x, new QueryParameter()] };
            return this;
        }

        /**
         * @param {number} x
         * @returns {QueryExpression}
         */

    }, {
        key: 'multiply',
        value: function multiply(x) {
            this.aggr = { $multiply: [x, new QueryParameter()] };
            return this;
        }

        /**
         * @param {number} x
         * @returns {QueryExpression}
         */

    }, {
        key: 'divide',
        value: function divide(x) {
            this.aggr = { $divide: [x, new QueryParameter()] };
            return this;
        }

        /**
         * @param {number=} n
         * @returns {QueryExpression}
         */

    }, {
        key: 'round',
        value: function round(n) {
            this.aggr = { $round: [n, new QueryParameter()] };
            return this;
        }

        /**
         * @param {number} start
         * @param {number=} length
         * @returns {QueryExpression}
         */

    }, {
        key: 'substr',
        value: function substr(start, length) {
            this.aggr = { $substr: [start, length, new QueryParameter()] };
            return this;
        }

        /**
         * @param {string} s
         * @returns {QueryExpression}
         */

    }, {
        key: 'indexOf',
        value: function indexOf(s) {
            this.aggr = { $indexOf: [s, new QueryParameter()] };
            return this;
        }

        /**
         * @param {string|*} s
         * @returns {QueryExpression}
         */

    }, {
        key: 'concat',
        value: function concat(s) {
            this.aggr = { $concat: [s, new QueryParameter()] };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'trim',
        value: function trim() {
            this.aggr = { $trim: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'length',
        value: function length() {
            this.aggr = { $length: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'getDate',
        value: function getDate() {
            this.aggr = { $date: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'getYear',
        value: function getYear() {
            this.aggr = { $year: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'getMonth',
        value: function getMonth() {
            this.aggr = { $month: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'getDay',
        value: function getDay() {
            this.aggr = { $dayOfMonth: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'getHours',
        value: function getHours() {
            this.aggr = { $hour: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'getMinutes',
        value: function getMinutes() {
            this.aggr = { $minutes: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'getSeconds',
        value: function getSeconds() {
            this.aggr = { $seconds: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'floor',
        value: function floor() {
            this.aggr = { $floor: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'ceil',
        value: function ceil() {
            this.aggr = { $ceiling: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'toLocaleLowerCase',
        value: function toLocaleLowerCase() {
            this.aggr = { $toLower: new QueryParameter() };
            return this;
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'toLocaleUpperCase',
        value: function toLocaleUpperCase() {
            this.aggr = { $toUpper: new QueryParameter() };
            return this;
        }
    }], [{
        key: 'create',
        value: function create(entity, fields) {
            var q = new QueryExpression();
            q.from(entity);
            if (_.isArray(fields)) {
                q.select(fields);
            }
            return q;
        }
    }, {
        key: 'zeroPad',
        value: function zeroPad(number, length) {
            number = number || 0;
            var res = number.toString();
            while (res.length < length) {
                res = '0' + res;
            }
            return res;
        }
    }, {
        key: 'escape',
        value: function escape(val) {
            if (val === undefined || val === null) {
                return 'null';
            }

            switch (typeof val === 'undefined' ? 'undefined' : _typeof(val)) {
                case 'boolean':
                    return val ? 'true' : 'false';
                case 'number':
                    return val + '';
            }

            if (val instanceof Date) {
                var dt = new Date(val);
                var year = dt.getFullYear();
                var month = QueryExpression.zeroPad(dt.getMonth() + 1, 2);
                var day = QueryExpression.zeroPad(dt.getDate(), 2);
                var hour = QueryExpression.zeroPad(dt.getHours(), 2);
                var minute = QueryExpression.zeroPad(dt.getMinutes(), 2);
                var second = QueryExpression.zeroPad(dt.getSeconds(), 2);
                var millisecond = QueryExpression.zeroPad(dt.getMilliseconds(), 3);
                val = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
            }

            if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' && Object.prototype.toString.call(val) === '[object Array]') {
                var values = [];
                _.forEach(val, function (x) {
                    QueryExpression.escape(x);
                });
                return values.join(',');
            }

            if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
                if (val.hasOwnProperty('$name'))
                    //return field identifier
                    return val['$name'];else return this.escape(val.valueOf());
            }

            val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (s) {
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
    }]);

    return QueryExpression;
}();

/**
 * Represents an enumeration of comparison query operators
 * @type {*}
 */


QueryExpression.ComparisonOperators = { $eq: '$eq', $ne: '$ne', $gt: '$gt', $gte: '$gte', $lt: '$lt', $lte: '$lte', $in: '$in', $nin: '$nin' };
/**
 * Represents an enumeration of logical query operators
 * @type {*}
 */
QueryExpression.LogicalOperators = { $or: '$or', $and: '$and', $not: '$not', $nor: '$not' };
/**
 * Represents an enumeration of evaluation query operators
 * @type {*}
 */
QueryExpression.EvaluationOperators = { $mod: '$mod', $add: '$add', $sub: '$sub', $mul: '$mul', $div: '$div' };

/**
 * Prepares an equal expression.
 * @example
 * q.where('id').eq(10) //id=10 expression
 * @param {*} value
 * @returns {QueryExpression}
 */
QueryExpression.prototype.eq = QueryExpression.prototype.equal;

QueryExpression.prototype.ne = QueryExpression.prototype.notEqual;

QueryExpression.prototype.gt = QueryExpression.prototype.greaterThan;
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.lt = QueryExpression.prototype.lowerThan;

QueryExpression.prototype.lte = QueryExpression.prototype.lowerOrEqual;
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.gte = QueryExpression.prototype.greaterOrEqual;

/**
 * @class
 */

var QueryEntity = exports.QueryEntity = function () {
    /**
     * @constructor
     * @param {string|*} obj
     */
    function QueryEntity(obj) {
        _classCallCheck(this, QueryEntity);

        var entity = obj || 'Table';
        this[entity] = [];
        Object.defineProperty(this, 'name', {
            get: function get() {
                return entity;
            }, configurable: false, enumerable: false
        });
        var self = this;
        Object.defineProperty(this, 'props', {
            get: function get() {
                return self[entity];
            }, configurable: false, enumerable: false
        });
    }
    /**
     * Creates an entity reference that is going to be used in query expressions.
     * @param {string} entity - The entity name
     * @param {Array=} fields - An array that represents the entity's field collection to be used.
     * @returns {QueryEntity|*}
     */


    _createClass(QueryEntity, [{
        key: 'select',
        value: function select(name) {
            var f = new QueryField(name);
            return f.from(this.$as ? this.$as : this.name);
        }
    }, {
        key: 'as',
        value: function as(alias) {
            this.$as = alias;
            return this;
        }
    }, {
        key: 'inner',
        value: function inner() {
            this.$join = 'inner';
            return this;
        }
    }, {
        key: 'left',
        value: function left() {
            this.$join = 'left';
            return this;
        }
    }, {
        key: 'right',
        value: function right() {
            this.$join = 'right';
            return this;
        }
    }], [{
        key: 'create',
        value: function create(entity, fields) {
            var obj = new QueryEntity(entity);
            obj[entity] = fields || [];
            return obj;
        }
    }]);

    return QueryEntity;
}();
/**
 * @class
 * @property $value - The underlying value
 */


var QueryValue = exports.QueryValue = function () {

    /**
     * @constructor
     * @param {*=} value
     */
    function QueryValue(value) {
        _classCallCheck(this, QueryValue);

        this.$value = value;
    }

    /**
     * Creates a new query value
     * @param value
     * @returns {QueryValue}
     */


    _createClass(QueryValue, null, [{
        key: 'create',
        value: function create(value) {
            return new QueryValue(value);
        }
    }]);

    return QueryValue;
}();

var QueryFieldUtils = exports.QueryFieldUtils = function () {
    function QueryFieldUtils() {
        _classCallCheck(this, QueryFieldUtils);
    }

    _createClass(QueryFieldUtils, null, [{
        key: 'select',

        /**
         * @param name {string}
         * @returns {QueryField}
         */
        value: function select(name) {
            return new QueryField(name);
        }

        /**
         * @param name {string}
         * @returns {QueryField}
         */

    }, {
        key: 'count',
        value: function count(name) {
            var f = new QueryField();
            return f.count(name);
        }

        /**
         * @param name {string}
         * @returns {QueryField}
         */

    }, {
        key: 'min',
        value: function min(name) {
            var f = new QueryField();
            return f.min(name);
        }

        /**
         * @param name {string}
         * @returns {QueryField}
         */

    }, {
        key: 'max',
        value: function max(name) {
            var f = new QueryField();
            return f.max(name);
        }

        /**
         * @param name {string}
         * @returns {QueryField}
         */

    }, {
        key: 'average',
        value: function average(name) {
            var f = new QueryField();
            return f.average(name);
        }

        /**
         * @param name {string}
         * @returns {QueryField}
         */

    }, {
        key: 'avg',
        value: function avg(name) {
            return QueryFieldUtils.average(name);
        }

        /**
         * @param name {string}
         * @returns {QueryField}
         */

    }, {
        key: 'sum',
        value: function sum(name) {
            var f = new QueryField();
            return f.sum(name);
        }
        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'floor',
        value: function floor(name) {
            var f = {};
            f[name] = { $floor: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }
        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'ceil',
        value: function ceil(name) {
            var f = {};
            f[name] = { $ceiling: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }
        /**
         * @param {string} name
         * @param {number=} divider
         * @returns {QueryField}
         */

    }, {
        key: 'modulo',
        value: function modulo(name, divider) {
            var f = {};
            f[name] = { $mod: [QueryFieldUtils.select(name), divider] };
            return _.assign(new QueryField(), f);
        }
        /**
         * @param {string} name
         * @param {number=} x
         * @returns {QueryField}
         */

    }, {
        key: 'add',
        value: function add(name, x) {
            var f = {};
            f[name] = { $add: [QueryFieldUtils.select(name), x] };
            return _.assign(new QueryField(), f);
        }
        /**
         * @param {string} name
         * @param {number=} x
         * @returns {QueryField}
         */

    }, {
        key: 'subtract',
        value: function subtract(name, x) {
            var f = {};
            f[name] = { $subtract: [QueryFieldUtils.select(name), x] };
            return _.assign(new QueryField(), f);
        }
        /**
         * @param {string} name
         * @param {number=} divider
         * @returns {QueryField}
         */

    }, {
        key: 'divide',
        value: function divide(name, divider) {
            var f = {};
            f[name] = { $divide: [QueryFieldUtils.select(name), divider] };
            return _.assign(new QueryField(), f);
        }
        /**
         * @param {string} name
         * @param {number=} divider
         * @returns {QueryField}
         */

    }, {
        key: 'multiply',
        value: function multiply(name, multiplier) {
            var f = {};
            f[name] = { $multiply: [QueryFieldUtils.select(name), multiplier] };
            return _.assign(new QueryField(), f);
        }
        /**
         * @param {string} name
         * @param {number=} n
         * @returns {QueryField}
         */

    }, {
        key: 'round',
        value: function round(name, n) {
            var f = {};
            if (typeof n !== 'number') {
                n = 2;
            }
            f[name] = { $round: [QueryFieldUtils.select(name), n] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'month',
        value: function month(name) {
            var f = {};
            f[name] = { $month: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'year',
        value: function year(name) {
            var f = {};
            f[name] = { $year: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'day',
        value: function day(name) {
            var f = {};
            f[name] = { $day: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'hour',
        value: function hour(name) {
            var f = {};
            f[name] = { $hour: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'minute',
        value: function minute(name) {
            var f = {};
            f[name] = { $minute: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'second',
        value: function second(name) {
            var f = {};
            f[name] = { $second: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'date',
        value: function date(name) {
            var f = {};
            f[name] = { $date: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'length',
        value: function length(name) {
            var f = {};
            f[name] = { $length: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }

        /**
         * @param {string} name
         * @returns {QueryField}
         */

    }, {
        key: 'trim',
        value: function trim(name) {
            var f = {};
            f[name] = { $trim: [QueryFieldUtils.select(name)] };
            return _.assign(new QueryField(), f);
        }
    }]);

    return QueryFieldUtils;
}();

/**
 * @class
 */


var QueryField = exports.QueryField = function () {
    /**
     * @constructor
     * @param {string=} obj
     */
    function QueryField(obj) {
        _classCallCheck(this, QueryField);

        if (typeof obj === 'string') {
            this.$name = obj;
        } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj != null) {
            _.assign(this, obj);
        }
    }

    /**
     * Creates a query field of the given entity
     * @param {string=} fieldName
     * @param {string=} fromEntity
     * @returns {QueryField}
     */


    _createClass(QueryField, [{
        key: 'select',


        /**
         * @param name {string} The name of the field that is going to be selected
         * @returns {QueryField}
         */
        value: function select(name) {
            if (typeof name != 'string') throw new Error('Invalid argument. Expected string');
            //clear object
            _empty(this);
            // field as string e.g. { $name: 'price' }
            this.$name = name;
            return this;
        }

        /**
         * Sets the entity of the current field
         * @param entity {string}
         * @returns {QueryField}
         */

    }, {
        key: 'from',
        value: function from(entity) {
            var name = void 0;
            if (typeof entity !== 'string') throw new Error('Invalid argument. Expected string');
            //get property
            if (!_.isNil(this.$name)) {
                if (typeof this.$name === 'string') {
                    //check if an entity is already defined
                    name = this.$name;
                    if (QueryField.fieldNameExpression.test(name))
                        //if not append entity name
                        this.$name = entity.concat('.', name);else
                        //split field name and add entity
                        this.$name = entity.concat('.', name.split('.')[1]);
                } else throw new Error("Invalid field definition.");
            } else {
                //get default property
                var alias = _.findKey(this);
                if (_.isNil(alias)) throw new Error("Field definition cannot be empty at this context");
                //get field expression
                var expr = this[alias];
                //get field name
                var aggregate = _.findKey(expr);
                if (_.isNil(aggregate)) throw new Error("Field expression cannot be empty at this context");
                name = expr[aggregate];
                if (QueryField.fieldNameExpression.test(name))
                    //if not append entity name
                    expr[aggregate] = entity.concat('.', name);else
                    //split field name and add entity
                    expr[aggregate] = entity.concat('.', name.split('.')[1]);
            }
            return this;
        }
    }, {
        key: 'count',
        value: function count(name) {
            if (typeof name != 'string') throw new Error('Invalid argument. Expected string');
            //clear object
            _empty(this);
            // field as aggregate function e.g. { price: { $count: 'price' } }
            this[name] = { $count: name };
            return this;
        }

        /**
         * @param {...string} [strings]
         * @return {string}
         */

    }, {
        key: 'concat',
        value: function concat(strings) {
            return this.$name.concat(strings);
        }
    }, {
        key: 'sum',
        value: function sum(name) {
            if (typeof name != 'string') throw new Error('Invalid argument. Expected string');
            //clear object
            _empty(this);
            // field as aggregate function e.g. { price: { $sum: 'price' } }
            this[name] = { $sum: name };
            return this;
        }
    }, {
        key: 'min',
        value: function min(name) {
            if (typeof name != 'string') throw new Error('Invalid argument. Expected string');
            //clear object
            _empty(this);
            // field as aggregate function e.g. { price: { $min: 'price' } }
            this[name] = { $min: name };
            return this;
        }
    }, {
        key: 'average',
        value: function average(name) {
            if (typeof name != 'string') throw new Error('Invalid argument. Expected string');
            //clear object
            _empty(this);
            // field as aggregate function e.g. { price: { $avg: 'price' } }
            this[name] = { $avg: name };
            return this;
        }
    }, {
        key: 'max',
        value: function max(name) {
            if (typeof name != 'string') throw new Error('Invalid argument. Expected string');
            //clear object
            _empty(this);
            // field as aggregate function e.g. { price: { $max: 'price' } }
            this[name] = { $max: name };
            return this;
        }

        /**
         *
         * @param {String=} alias
         * @returns {QueryField|String}
         */

    }, {
        key: 'as',
        value: function as(alias) {
            if (typeof alias === 'undefined') {
                if (typeof this.$name !== 'undefined') return null;
                var keys = _.keys(this);
                if (keys.length == 0) return null;else return keys[0];
            }
            if (typeof alias != 'string') throw new Error('Invalid argument. Expected string');
            //get first property
            var prop = _.findKey(this);
            if (prop == null) throw new Error('Invalid object state. Field is not selected.');
            var value = this[prop];
            if (prop != alias) {
                this[alias] = value;
                delete this[prop];
            }
            return this;
        }
    }, {
        key: 'name',
        value: function name() {
            var name = null;
            if (typeof this.$name === 'string') {
                name = this.$name;
            } else {
                var prop = _.findKey(this);
                if (prop) {
                    name = this[prop];
                }
            }
            if (typeof name === 'string') {
                //check if an entity is already defined
                var re = new RegExp(QueryField.fieldNameExpression.source);
                if (re.test(name)) return name;else return name.split('.')[1];
            }
            return null;
        }

        /**
         * @returns {string}
         */

    }, {
        key: 'getName',
        value: function getName() {
            return this.name();
        }
    }, {
        key: 'nameOf',
        value: function nameOf() {

            if (typeof this === 'string' || this instanceof String) {
                return this;
            }
            var alias = void 0;
            if (typeof this.as === 'function') alias = this.as();else alias = QueryField.prototype.as.call(this);

            if (alias) {
                return this[alias];
            } else {
                return this.$name;
            }
        }
    }, {
        key: 'valueOf',
        value: function valueOf() {
            return this.$name;
        }
    }], [{
        key: 'create',
        value: function create(fieldName, fromEntity) {
            var f = new QueryField(fieldName);
            if (_.isNil(fromEntity)) {
                return f;
            }
            return f.from(fromEntity);
        }
    }]);

    return QueryField;
}();

QueryField.fieldNameExpression = /^[A-Za-z_0-9]+$/;

/**
 * @class
 */

var QueryFieldComparer = function () {
    function QueryFieldComparer() {
        _classCallCheck(this, QueryFieldComparer);
    }

    _createClass(QueryFieldComparer, [{
        key: 'compareWith',

        /**
         *
         * @param {*} comparison
         * @returns {*}
         */
        value: function compareWith(comparison) {
            var expr = {};
            if (typeof this === 'string' || this instanceof String) {
                expr[this] = comparison;
                return expr;
            }

            //get aggregate function
            var aggr = _.findKey(this);

            var name = void 0;
            if (_.isArray(this[aggr])) {
                //get first element (the field name)
                name = QueryField.prototype.nameOf.call(this[aggr][0]);
            } else {
                //get element (the field name)
                name = QueryField.prototype.nameOf.call(this[aggr]);
            }
            expr[name] = {};
            expr[name][aggr] = comparison;
            return expr;
        }
    }, {
        key: 'wrapWithAggregate',
        value: function wrapWithAggregate(aggr, comparison) {}
    }]);

    return QueryFieldComparer;
}();

/**
 * @class
 * @property {string} $model - Gets or sets a string which represents the target model
 * @property {string} $filter - Gets or sets a string which represents a filter statement assigned to the current data query
 * @property {number} $top - Gets or sets an integer which represents the number of records to get
 * @property {number} $skip - Gets or sets an integer which represents the number of records to skip
 */


var OpenDataQuery = exports.OpenDataQuery = function () {
    /**
     * @constructor
     */
    function OpenDataQuery() {
        _classCallCheck(this, OpenDataQuery);

        /**
         * @private
         */
        this[privatesProperty] = {};
    }

    /**
     * @private
     * @returns OpenDataQuery
     */


    _createClass(OpenDataQuery, [{
        key: 'append',
        value: function append() {
            var exprs = void 0;
            var self = this;
            if (self[privatesProperty].left) {
                var expr = null;

                if (self[privatesProperty].op == 'in') {
                    if (_.isArray(self[privatesProperty].right)) {
                        //expand values
                        exprs = [];
                        _.forEach(self[privatesProperty].right, function (x) {
                            exprs.push(self[privatesProperty].left + ' eq ' + QueryExpression.escape(x));
                        });
                        if (exprs.length > 0) expr = '(' + exprs.join(' or ') + ')';
                    }
                } else if (self[privatesProperty].op == 'nin') {
                    if (_.isArray(self[privatesProperty].right)) {
                        //expand values
                        exprs = [];
                        _.forEach(self[privatesProperty].right, function (x) {
                            exprs.push(self[privatesProperty].left + ' ne ' + QueryExpression.escape(x));
                        });
                        if (exprs.length > 0) expr = '(' + exprs.join(' and ') + ')';
                    }
                } else expr = self[privatesProperty].left + ' ' + self[privatesProperty].op + ' ' + QueryExpression.escape(self[privatesProperty].right);
                if (expr) {
                    if (_.isNil(self.$filter)) self.$filter = expr;else {
                        self[privatesProperty].lop = self[privatesProperty].lop || 'and';
                        self[privatesProperty]._lop = self[privatesProperty]._lop || self[privatesProperty].lop;
                        if (self[privatesProperty]._lop == self[privatesProperty].lop) self.$filter = self.$filter + ' ' + self[privatesProperty].lop + ' ' + expr;else self.$filter = '(' + self.$filter + ') ' + self[privatesProperty].lop + ' ' + expr;
                        self[privatesProperty]._lop = self[privatesProperty].lop;
                    }
                }
            }
            delete self[privatesProperty].lop;delete self[privatesProperty].left;delete self[privatesProperty].op;delete self[privatesProperty].right;
            return this;
        }

        /**
         * @param {Array|String} attr
         * @returns OpenDataQuery
         */

    }, {
        key: 'select',
        value: function select(attr) {
            if (_.isArray(attr)) {
                this.$select = attr.join(',');
            } else this.$select = attr;
        }

        /**
         * @param {number} val
         * @returns OpenDataQuery
         */

    }, {
        key: 'take',
        value: function take(val) {
            this.$top = isNaN(val) ? 0 : val;
            return this;
        }

        /**
         * @param {number} val
         * @returns OpenDataQuery
         */

    }, {
        key: 'skip',
        value: function skip(val) {
            this.$skip = isNaN(val) ? 0 : val;
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'orderBy',
        value: function orderBy(name) {
            if (typeof name !== 'undefined' || name != null) this.$orderby = name.toString();
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'orderByDescending',
        value: function orderByDescending(name) {
            if (typeof name !== 'undefined' || name != null) this.$orderby = name.toString() + ' desc';
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'thenBy',
        value: function thenBy(name) {
            if (typeof name !== 'undefined' || name != null) {
                this.$orderby += this.$orderby ? ',' + name.toString() : name.toString();
            }
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'thenByDescending',
        value: function thenByDescending(name) {
            if (typeof name !== 'undefined' || name != null) {
                this.$orderby += (this.$orderby ? ',' + name.toString() : name.toString()) + ' desc';
            }
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'where',
        value: function where(name) {
            this[privatesProperty].left = name;
            return this;
        }

        /**
         * @param {String=} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'and',
        value: function and(name) {
            this[privatesProperty].lop = 'and';
            if (typeof name !== 'undefined') this[privatesProperty].left = name;
            return this;
        }

        /**
         * @param {String=} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'or',
        value: function or(name) {
            this[privatesProperty].lop = 'or';
            if (typeof name !== 'undefined') this[privatesProperty].left = name;
            return this;
        }

        /**
         * @param {*} value
         * @returns OpenDataQuery
         */

    }, {
        key: 'equal',
        value: function equal(value) {
            this[privatesProperty].op = 'eq';this[privatesProperty].right = value;return this.append();
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'indexOf',
        value: function indexOf(name) {
            this[privatesProperty].left = 'indexof(' + name + ')';
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'andIndexOf',
        value: function andIndexOf(name) {
            this[privatesProperty].lop = 'and';
            return this.indexOf(name);
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'orIndexOf',
        value: function orIndexOf(name) {
            this[privatesProperty].lop = 'or';
            return this.indexOf(name);
        }

        /**
         * @param {*} name
         * @param {*} s
         * @returns OpenDataQuery
         */

    }, {
        key: 'endsWith',
        value: function endsWith(name, s) {
            this[privatesProperty].left = sprintf.sprintf('endswith(%s,%s)', name, QueryExpression.escape(s));
            return this;
        }

        /**
         * @param {*} name
         * @param {*} s
         * @returns OpenDataQuery
         */

    }, {
        key: 'startsWith',
        value: function startsWith(name, s) {
            this[privatesProperty].left = sprintf.sprintf('startswith(%s,%s)', name, QueryExpression.escape(s));
            return this;
        }

        /**
         * @param {*} name
         * @param {*} s
         * @returns OpenDataQuery
         */

    }, {
        key: 'substringOf',
        value: function substringOf(name, s) {
            this[privatesProperty].left = sprintf.sprintf('substringof(%s,%s)', name, QueryExpression.escape(s));
            return this;
        }

        /**
         * @param {*} name
         * @param {number} pos
         * @param {number} length
         * @returns OpenDataQuery
         */

    }, {
        key: 'substring',
        value: function substring(name, pos, length) {
            this[privatesProperty].left = sprintf.sprintf('substring(%s,%s,%s)', name, pos, length);
            return this;
        }

        /**
         * @param {*} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'length',
        value: function length(name) {
            this[privatesProperty].left = sprintf.sprintf('length(%s)', name);
            return this;
        }

        /**
         * @param {*} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'toLower',
        value: function toLower(name) {
            this[privatesProperty].left = sprintf.sprintf('tolower(%s)', name);
            return this;
        }

        /**
         * @param {*} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'toUpper',
        value: function toUpper(name) {
            this[privatesProperty].left = sprintf.sprintf('toupper(%s)', name);
            return this;
        }

        /**
         * @param {*} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'trim',
        value: function trim(name) {
            this[privatesProperty].left = sprintf.sprintf('trim(%s)', name);
            return this;
        }

        /**
         * @param {*} s0
         * @param {*} s1
         * @param {*=} s2
         * @param {*=} s3
         * @param {*=} s4
         * @returns OpenDataQuery
         */

    }, {
        key: 'concat',
        value: function concat(s0, s1, s2, s3, s4) {
            this[privatesProperty].left = 'concat(' + QueryExpression.escape(s0) + ',' + QueryExpression.escape(s1);
            if (typeof s2 !== 'undefined') this[privatesProperty].left += ',' + QueryExpression.escape(s2);
            if (typeof s3 !== 'undefined') this[privatesProperty].left += ',' + QueryExpression.escape(s3);
            if (typeof s4 !== 'undefined') this[privatesProperty].left += ',' + QueryExpression.escape(s4);
            this[privatesProperty].left += ')';
            return this;
        }
    }, {
        key: 'field',
        value: function field(name) {
            return { "$name": name };
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'day',
        value: function day(name) {
            this[privatesProperty].left = sprintf.sprintf('day(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'hour',
        value: function hour(name) {
            this[privatesProperty].left = sprintf.sprintf('hour(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'minute',
        value: function minute(name) {
            this[privatesProperty].left = sprintf.sprintf('minute(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'month',
        value: function month(name) {
            this[privatesProperty].left = sprintf.sprintf('month(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'second',
        value: function second(name) {
            this[privatesProperty].left = sprintf.sprintf('second(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'year',
        value: function year(name) {
            this[privatesProperty].left = sprintf.sprintf('year(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'round',
        value: function round(name) {
            this[privatesProperty].left = sprintf.sprintf('round(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'floor',
        value: function floor(name) {
            this[privatesProperty].left = sprintf.sprintf('floor(%s)', name);
            return this;
        }

        /**
         * @param {String} name
         * @returns OpenDataQuery
         */

    }, {
        key: 'ceiling',
        value: function ceiling(name) {
            this[privatesProperty].left = sprintf.sprintf('ceil(%s)', name);
            return this;
        }

        /**
         * @param {*} value
         * @returns OpenDataQuery
         */

    }, {
        key: 'notEqual',
        value: function notEqual(value) {
            this[privatesProperty].op = 'ne';this[privatesProperty].right = value;return this.append();
        }

        /**
         * @param {*} value
         * @returns OpenDataQuery
         */

    }, {
        key: 'greaterThan',
        value: function greaterThan(value) {
            this[privatesProperty].op = 'gt';this[privatesProperty].right = value;return this.append();
        }

        /**
         * @param {*} value
         * @returns OpenDataQuery
         */

    }, {
        key: 'greaterOrEqual',
        value: function greaterOrEqual(value) {
            this[privatesProperty].op = 'ge';this[privatesProperty].right = value;return this.append();
        }

        /**
         * @param {*} value
         * @returns OpenDataQuery
         */

    }, {
        key: 'lowerThan',
        value: function lowerThan(value) {
            this[privatesProperty].op = 'lt';this[privatesProperty].right = value;return this.append();
        }

        /**
         * @param {*} value
         * @returns OpenDataQuery
         */

    }, {
        key: 'lowerOrEqual',
        value: function lowerOrEqual(value) {
            this[privatesProperty].op = 'le';this[privatesProperty].right = value;return this.append();
        }

        /**
         * @param {Array} values
         * @returns OpenDataQuery
         */

    }, {
        key: 'in',
        value: function _in(values) {
            this[privatesProperty].op = 'in';this[privatesProperty].right = values;return this.append();
        }

        /**
         * @param {Array} values
         * @returns OpenDataQuery
         */

    }, {
        key: 'notIn',
        value: function notIn(values) {
            this[privatesProperty].op = 'nin';this[privatesProperty].right = values;return this.append();
        }
    }]);

    return OpenDataQuery;
}();
//# sourceMappingURL=query.js.map
