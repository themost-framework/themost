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
import 'source-map-support/register';
import sprintf from 'sprintf';
import _ from 'lodash';

function _empty(obj) {
    if (typeof obj === 'undefined' || obj === null) { return; }
    _.forEach(_.keys(obj), function(x) { if (obj.hasOwnProperty(x)) { delete obj[x]; }  });
}

/**
 * @class
 */
class QueryParameter {
    constructor() {
        //do nothing
    }
}

/**
 * @class
 */
class QueryFieldAggregator {
    /**
     * Wraps the given comparison expression in this aggregate function e.g. wraps { $gt:45 } with $floor aggregate function and returns { $floor: { $gt:45 } }
     * @param {*} comparison
     */
    wrapWith(comparison) {
        const name = _.keys(this)[0];
        if (name) {
            if (_.isArray(this[name])) {
                //search for query parameter
                for (let i = 0; i < this[name].length; i++) {
                    if (this[name][i] instanceof QueryParameter) {
                        this[name][i] = comparison;
                        return this;
                    }
                }
                throw new Error('Invalid aggregate expression. Parameter is missing.');
            }
            else {
                if (this[name] instanceof QueryParameter) {
                    this[name] = comparison;
                    return this;
                }
                throw new Error('Invalid aggregate expression. Parameter is missing.');
            }
        }
        throw new Error('Invalid aggregate expression. Aggregator is missing.');
    }
}

const privatesProperty = Symbol('privates');

/**
 * @class
 */
export class QueryExpression {
    /**
     * @constructor
     */
    constructor() {
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
        this[privatesProperty] = { };

    }

    /**
     * Creates a new query expression
     * @param {*=} entity
     * @param {Array=} fields
     * @returns {QueryExpression}
     */
    static create(entity, fields) {
        const q = new QueryExpression();
        q.from(entity);
        if (_.isArray(fields)) {
            q.select(fields);
        }
        return q;
    }

    /**
     * @private
     * @param {string|*=} s
     * @returns {string|*}
     */
    prop(s) {
        if (typeof s === 'undefined') { return this[privatesProperty].prop; }
        if (s === null) { delete this[privatesProperty].prop; }
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
    clone() {
        return _.assign(new QueryExpression(), this);
    }

    /**
     * Sets the alias of a QueryExpression instance. This alias is going to be used in sub-query operations.
     * @returns {QueryExpression}
     */
    as(alias) {
        this.$alias = alias;
        return this;
    }

    /**
     * Gets a collection that represents the selected fields of the underlying expression
     * @returns {Array}
     */
    fields() {

        if (_.isNil(this.$select))
            return [];
        const entity = _.findKey(this.$select);
        let joins = [];
        if (_.isArray(this.$expand))
        {
            joins=_.filter(this.$expand, (x)=>{
                return _.isObject(x);
            });
        }
        else if (_.isObject(this.$expand)) {
            joins.push(this.$expand);
        }
        //get entity fields
        const fields = [];
        //get fields
        const re = QueryField.fieldNameExpression, arr = this.$select[entity] || [];
        _.forEach(arr, function(x)
        {
            if (typeof x === 'string') {
                re.lastIndex=0;
                if (!re.test(x))
                    fields.push(new QueryField(x));
                else {
                    const f = new QueryField(x);
                    fields.push(f.from(entity));
                }
            }
            else {
                fields.push(_.assign(new QueryField(), x));
            }
        });
        //enumerate join fields
        _.forEach(joins, function(x)
        {
            if (x.$entity instanceof QueryExpression) {
                //todo::add fields if any
            }
            else {
                const table = _.findKey(x.$entity), tableFields = x.$entity[table] || [];
                _.forEach(tableFields, function(y) {
                    if (typeof x === 'string') {
                        fields.push(new QueryField(y));
                    }
                    else {
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
    hasFilter() {
        return _.isObject(this.$where);
    }

    /**
     * @param {Boolean} useOr
     * @returns {QueryExpression}
     */
    prepare(useOr) {
        if (typeof this.$where === 'object') {
            if (typeof this.$prepared === 'object')
            {
                let preparedWhere = {};
                if (useOr)
                    preparedWhere = { $or: [this.$prepared, this.$where] };
                else
                    preparedWhere = { $and: [this.$prepared, this.$where] };
                this.$prepared = preparedWhere;
            }
            else {
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
    hasFields() {
        const self = this;
        if (!_.isObject(self.$select))
            return false;
        const entity = _.findKey(self.$select);
        let joins = [];
        if (self.$expand!==null)
        {
            if (_.isArray(self.$expand))
                joins=self.$expand;
            else
                joins.push(self.$expand);
        }
        //search for fields
        if (_.isArray(self.$select[entity])) {
            if (self.$select[entity].length>0)
                return true;
        }
        let result = false;
        //enumerate join fields
        _.forEach(joins, function(x)
        {
            const table = _.findKey(x.$entity);
            if (_.isArray(x.$entity[table])) {
                if (x.$entity[table].length>0)
                    result = true;
            }
        });
        return result;
    }

    /**
     * Gets a boolean value that indicates whether query expression has paging or not.
     * @returns {boolean}
     */
    hasPaging() {
        return (typeof this.$take !=='undefined' && this.$take!==null);
    }

    /**
     * @returns {QueryExpression}
     */
    distinct(value) {
        if (typeof value === 'undefined')
            this.$distinct = true;
        else
            this.$distinct = value || false;
        return this;
    }

    /**
     * @param name {string|QueryField|*}
     * @returns {QueryExpression}
     */
    where(name) {
        if (_.isNil(name))
            throw new Error('Left operand cannot be empty. Expected string or object.');
        delete this.$where;
        if (typeof name === 'string') {
            this.prop(name);
        }
        else if (typeof name === 'object') {
            this.prop(QueryField.prototype.nameOf.call(name))
        }
        else {
            throw new Error('Invalid left operand. Expected string or object.');
        }
        return this;
    }

    /**
     * Injects the given filter expression into the current query expression
     * @param {*} where - An object that represents a filter expression
     * @returns {QueryExpression}
     */
    injectWhere(where) {
        if (_.isNil(where))
            return this;
        this.$where = where;
        return this;
    }

    /**
     * Initializes a delete query and sets the entity name that is going to be used in this query.
     * @param entity {string}
     * @returns {QueryExpression}
     */
    delete(entity) {
        if (_.isNil(entity))
            return this;
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
    insert(obj) {
        if (_.isNil(obj))
            return this;
        if (_.isArray(obj) || _.isObject(obj)) {
            this.$insert = { table1: obj };
            //delete other properties (if any)
            delete this.$delete;
            delete this.$select;
            delete this.$update;
            return this;
        }
        else {
            throw new Error('Invalid argument. Object must be an object or an array of objects');
        }
    }

    into(entity) {
        if (_.isNil(entity))
            return this;
        if (_.isNil(this.$insert))
            return this;
        const prop = _.findKey(this.$insert);
        if (_.isNil(prop))
            return this;
        if (prop===entity)
            return this;
        const value = this.$insert[prop];
        if (_.isNil(value))
            return this;
        this.$insert[entity] = value;
        delete this.$insert[prop];
        return this;
    }

    /**
     * Initializes an update query and sets the entity name that is going to be used in this query.
     * @param {string} entity
     * @returns {QueryExpression}
     */
    update(entity) {
        if (_.isNil(entity))
            return this;
        if (typeof entity !== 'string')
            throw new Error('Invalid argument type. Update entity argument must be a string.');
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
    set(obj) {
        if (_.isNil(obj))
            return this;
        if (_.isArray(obj) || !_.isObject(obj))
            throw new Error('Invalid argument type. Update expression argument must be an object.');
        //get entity name (by property)
        const prop = _.findKey(this.$update);
        if (_.isNil(prop))
            throw new Error('Invalid operation. Update entity cannot be empty at this context.');
        //set object to update
        this.$update[prop] = obj;
        return this;
    }

    /**
     *
     * @param props {...*}
     * @returns {QueryExpression}
     */
    select(props) {

        const args = Array.prototype.slice.call(arguments);
        if (args.length===0)
            return this;
        if (_.isArray(args[0]) && args.length>1) {
            throw new TypeError('Invalid arguments. Expected array only (for backward compatibility issues)')
        }
        let fields = [];
        if (_.isArray(args[0])) {
            //validate parameters
            fields = args[0]
        }
        else {
            fields = args;
        }
        //if entity is already defined
        if (this[privatesProperty].entity)
        {
            //initialize $select property
            this.$select = {};
            //and set array of fields
            this.$select[this[privatesProperty].entity] = fields;
        }
        else
        {
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
    from(entity) {

        if (_.isNil(entity))
            return this;
        let name;
        if (entity instanceof QueryEntity) {
            name  = entity.$as || entity.name;
            this.$ref = this.$ref || {};
            this.$ref[name] = entity;
        }
        else {
            name = entity.valueOf();
        }
        if (this[privatesProperty].fields) {
            //initialize $select property
            this.$select = {};
            //and set array of fields
            this.$select[name] = this[privatesProperty].fields;
        }
        else {
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
    join(entity, props, alias) {

        if (_.isNil(entity))
            return this;
        // if (_.isNil(this.$select))
        //     throw new Error('Query entity cannot be empty when adding a join entity.');
        let obj = {};
        if (entity instanceof QueryEntity) {
            //do nothing (clone object)
            obj = entity;
        }
        else if (entity instanceof QueryExpression) {
            //do nothing (clone object)
            obj = entity;
        }
        else {
            obj[entity] = props || [];
            if (typeof alias === 'string')
                obj.$as=alias;
        }
        this[privatesProperty].expand =  { $entity: obj };
        //and return this object
        return this;
    }

    /**
     * Sets the join expression of the last join entity
     * @param obj {Array|*}
     * @returns {QueryExpression}
     */
    with(obj) {

        if (_.isNil(obj))
            return this;
        if (_.isNil(this[privatesProperty].expand))
            throw new Error('Join entity cannot be empty when adding a join expression. Use QueryExpression.join(entity, props) before.');
        if (obj instanceof QueryExpression)
        {
            /**
             * @type {QueryExpression}
             */
            const expr = obj;
            let where = null;
            if (expr.$where)
                where = expr.$prepared ? { $and: [expr.$prepared, expr.$where] } : expr.$where;
            else if (expr.$prepared)
                where = expr.$prepared;
            this[privatesProperty].expand.$with = where;
        }
        else {
            this[privatesProperty].expand.$with = obj;
        }

        //copy expand
        const expand = [];
        if (_.isArray(this.$expand)) {
            expand.push.apply(expand, this.$expand);
        }
        else if (_.isObject(this.$expand)) {
            expand.push(this.$expand);
        }
        //finally add new expand item
        expand.push(this[privatesProperty].expand);
        this.$expand = expand;
        //destroy temp object
        delete this[privatesProperty].expand;
        //and return QueryExpression
        return this;
    }

    /**
     * Applies an ascending ordering to a query expression
     * @param name {string}
     * @returns {QueryExpression}
     */
    orderBy(name) {

        if (_.isNil(name))
            return this;
        this.$order = this.$order || [];
        this.$order.push({ $asc: name });
        return this;
    }

    /**
     * Applies a descending ordering to a query expression
     * @param name
     * @returns {QueryExpression}
     */
    orderByDescending(name) {

        if (_.isNil(name))
            return this;
        this.$order = this.$order || [];
        this.$order.push({ $desc: name });
        return this;
    }

    /**
     * Performs a subsequent ordering in a query expression
     * @param name {string|Array}
     * @returns {QueryExpression}
     */
    thenBy(name) {

        if (_.isNil(name))
            return this;
        this.$order = this.$order || [];
        this.$order.push({ $asc: name });
        return this;
    }

    /**
     * Performs a subsequent ordering in a query expression
     * @param name {string|Array}
     * @returns {QueryExpression}
     */
    thenByDescending(name) {

        if (_.isNil(name))
            return this;
        this.$order = this.$order || [];
        this.$order.push({ $desc: name });
        return this;
    }

    /**
     *
     * @param name {string|Array}
     * @returns {QueryExpression}
     */
    groupBy(name) {

        if (_.isNil(name))
            return this;
        if (this.$group===null)
            this.$group = [];
        const self = this;
        if (_.isArray(name)) {
            _.forEach(name, function (x) {
                if (x)
                    self.$group.push(x);
            });
        }
        else
            this.$group.push(name);
        return this;
    }

    /**
     * @param expr
     * @private
     */
    __append(expr) {
        if (!expr)
            return;
        if (!this.$where) {
            this.$where = expr;
        }
        else {
            const op = this[privatesProperty].expr;
            if (op) {
                //get current operator
                const keys = _.keys(this.$where);
                if (keys[0]===op) {
                    this.$where[op].push(expr);
                }
                else {
                    const newFilter = {};
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
    or(name) {
        if (_.isNil(name))
            throw new Error('Left operand cannot be empty. Expected string or object.');
        if (typeof name === 'string') {
            this.prop(name);
        }
        else if (typeof name === 'object') {
            this.prop(QueryField.prototype.nameOf.call(name))
        }
        else {
            throw new Error('Invalid left operand. Expected string or object.');
        }
        this[privatesProperty].expr = '$or';
        return this;
    }

    /**
     * @param name {string|QueryField|*}
     * @returns {QueryExpression}
     */
    and(name) {
        if (_.isNil(name))
            throw new Error('Left operand cannot be empty. Expected string or object.');
        if (typeof name === 'string') {
            this.prop(name);
        }
        else if (typeof name === 'object') {
            this.prop(QueryField.prototype.nameOf.call(name))
        }
        else {
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
    equal(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = value;
            //apply aggregation if any
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, value);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
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
    notEqual(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $ne:value };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr,{ $ne:value });
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
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
    in(values) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $in : values };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
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
    notIn(values) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $nin : values };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr,{ $nin : values });
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param {*} value The value to be compared
     * @param {Number} result The result of modulo expression
     * @returns {QueryExpression}
     */
    mod(value, result) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $mod : [ value, result] };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param {*} value The value to be compared
     * @param {Number} result The result of a bitwise and expression
     * @returns {QueryExpression}
     */
    bit(value, result) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $bit : [ value, result] };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    greaterThan(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $gt:value };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param {string} value
     * @returns {QueryExpression}
     */
    startsWith(value) {
        const p0 = this.prop();
        let r;
        if (p0) {
            if (!_.isString(value)) {
                throw new Error('Invalid argument. Expected string.')
            }
            let comparison = { $regex : '^' + value, $options:'i' };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr,{ $regex : '^' + value, $options:'i' });
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    endsWith(value) {
        const p0 = this.prop();
        if (p0) {
            if (!_.isString(value)) {
                throw new Error('Invalid argument. Expected string.');
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, { $regex : value + '$', $options:'i' });
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
    contains(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $text: { $search: value } };
            //apply aggregation if any
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison );
            this.__append(expr);
        }
        return this;
    }

    notContains(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $text: { $search: value } };
            //apply aggregation if any
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = { $not: QueryFieldComparer.prototype.compareWith.call(p0, comparison) };
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    lowerThan(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $lt:value };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    lowerOrEqual(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $lte:value };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param value {*}
     * @returns {QueryExpression}
     */
    greaterOrEqual(value) {
        const p0 = this.prop();
        if (p0) {
            let comparison = { $gte:value };
            if (typeof this.aggr === 'object') {
                comparison = QueryFieldAggregator.prototype.wrapWith.call(this.aggr, comparison);
                delete this.aggr;
            }
            const expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
            this.__append(expr);
        }
        return this;
    }

    /**
     * @param {*} value1
     * @param {*} value2
     * @returns {QueryExpression}
     */
    between(value1, value2) {
        const p0 = this.prop();
        if (p0) {
            let comparison1 = { $gte:value1}, comparison2 = { $lte:value2 };
            if (typeof this.aggr === 'object') {
                comparison1 = QueryFieldAggregator.prototype.wrapWith({ $gte:value1} );
                comparison2 = QueryFieldAggregator.prototype.wrapWith({ $lte:value2} );
                delete this.aggr
            }
            const comp1 = QueryFieldComparer.prototype.compareWith.call(p0, comparison1);
            const comp2 = QueryFieldComparer.prototype.compareWith.call(p0, comparison2);
            const expr = {};
            expr['$and'] = [ comp1, comp2 ];
            this.__append(expr);
        }
        return this;
    }

    /**
     * Skips the specified number of objects during select.
     * @param {Number} n
     * @returns {QueryExpression}
     */
    skip(n) {
        this.$skip = isNaN(n) ? 0 : n;
        return this;
    }

    /**
     * Takes the specified number of objects during select.
     * @param {Number} n
     * @returns {QueryExpression}
     */
    take(n) {
        this.$take = isNaN(n) ? 0 : n;
        return this;
    }

    /**
     * @private
     * @param {number|*} number
     * @param {number} length
     * @returns {*}
     */
    static zeroPad(number, length) {
        number = number || 0;
        let res = number.toString();
        while (res.length < length) {
            res = '0' + res;
        }
        return res;
    }

    /**
     * @param {number|*} x
     * @returns {QueryExpression}
     */
    add(x) {
        this.aggr = { $add:[ x, new QueryParameter() ] };
        return this;
    }

    /**
     * @param {number|*} x
     * @returns {QueryExpression}
     */
    subtract(x) {
        this.aggr = { $subtract:[ x, new QueryParameter() ] };
        return this;
    }

    /**
     * @param {number} x
     * @returns {QueryExpression}
     */
    multiply(x) {
        this.aggr = { $multiply:[ x, new QueryParameter() ] };
        return this;
    }

    /**
     * @param {number} x
     * @returns {QueryExpression}
     */
    divide(x) {
        this.aggr = { $divide:[ x, new QueryParameter() ] };
        return this;
    }

    /**
     * @param {number=} n
     * @returns {QueryExpression}
     */
    round(n) {
        this.aggr = { $round:[ n, new QueryParameter() ] };
        return this;
    }

    /**
     * @param {number} start
     * @param {number=} length
     * @returns {QueryExpression}
     */
    substr(start, length) {
        this.aggr = { $substr:[ start, length, new QueryParameter() ] };
        return this;
    }

    /**
     * @param {string} s
     * @returns {QueryExpression}
     */
    indexOf(s) {
        this.aggr = { $indexOf:[ s, new QueryParameter() ] };
        return this;
    }

    /**
     * @param {string|*} s
     * @returns {QueryExpression}
     */
    concat(s) {
        this.aggr = { $concat:[ s, new QueryParameter()] };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    trim() {
        this.aggr = { $trim: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    length() {
        this.aggr = { $length: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    getDate() {
        this.aggr = { $date: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    getYear() {
        this.aggr = { $year: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    getMonth() {
        this.aggr = { $month: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    getDay() {
        this.aggr = { $dayOfMonth: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    getHours() {
        this.aggr = { $hour: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    getMinutes() {
        this.aggr = { $minutes: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    getSeconds() {
        this.aggr = { $seconds: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    floor() {
        this.aggr = { $floor: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    ceil() {
        this.aggr = { $ceiling: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    toLocaleLowerCase() {
        this.aggr = { $toLower: new QueryParameter() };
        return this;
    }

    /**
     * @returns {QueryExpression}
     */
    toLocaleUpperCase() {
        this.aggr = { $toUpper: new QueryParameter() };
        return this;
    }

    static escape(val) {
        if (val === undefined || val === null) {
            return 'null';
        }

        switch (typeof val) {
            case 'boolean': return (val) ? 'true' : 'false';
            case 'number': return val+'';
        }

        if (val instanceof Date) {
            const dt = new Date(val);
            const year   = dt.getFullYear();
            const month  = QueryExpression.zeroPad(dt.getMonth() + 1, 2);
            const day    = QueryExpression.zeroPad(dt.getDate(), 2);
            const hour   = QueryExpression.zeroPad(dt.getHours(), 2);
            const minute = QueryExpression.zeroPad(dt.getMinutes(), 2);
            const second = QueryExpression.zeroPad(dt.getSeconds(), 2);
            const millisecond = QueryExpression.zeroPad(dt.getMilliseconds(), 3);
            val = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
        }

        if (typeof val === 'object' && Object.prototype.toString.call(val) === '[object Array]') {
            const values = [];
            _.forEach(val, function(x) {
                QueryExpression.escape(x);
            });
            return values.join(',');
        }

        if (typeof val === 'object') {
            if (val.hasOwnProperty('$name'))
            //return field identifier
                return val['$name'];
            else
                return this.escape(val.valueOf())
        }

        val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
            switch(s) {
                case "\0": return "\\0";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\b": return "\\b";
                case "\t": return "\\t";
                case "\x1a": return "\\Z";
                default: return "\\"+s;
            }
        });
        return "'"+val+"'";
    }
}

/**
 * Represents an enumeration of comparison query operators
 * @type {*}
 */
QueryExpression.ComparisonOperators = { $eq:'$eq', $ne:'$ne', $gt:'$gt',$gte:'$gte', $lt:'$lt',$lte:'$lte', $in: '$in', $nin:'$nin' };
/**
 * Represents an enumeration of logical query operators
 * @type {*}
 */
QueryExpression.LogicalOperators = { $or:'$or', $and:'$and', $not:'$not', $nor:'$not' };
/**
 * Represents an enumeration of evaluation query operators
 * @type {*}
 */
QueryExpression.EvaluationOperators = { $mod:'$mod', $add:'$add', $sub:'$sub', $mul:'$mul', $div:'$div' };

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
export class QueryEntity {
    /**
     * @constructor
     * @param {string|*} obj
     */
    constructor(obj) {
        const entity = obj || 'Table';
        this[entity] = [];
        Object.defineProperty(this, 'name', {
            get: function() {
                return entity;
            }, configurable:false, enumerable:false
        });
        const self = this;
        Object.defineProperty(this, 'props', {
            get: function() {
                return self[entity];
            }, configurable:false, enumerable:false
        });
    }
    /**
     * Creates an entity reference that is going to be used in query expressions.
     * @param {string} entity - The entity name
     * @param {Array=} fields - An array that represents the entity's field collection to be used.
     * @returns {QueryEntity|*}
     */
    static create(entity, fields) {
        const obj = new QueryEntity(entity);
        obj[entity] = fields || [];
        return obj;
    }

    select(name) {
        const f = new QueryField(name);
        return f.from(this.$as ? this.$as : this.name);
    }

    as(alias) {
        this.$as = alias;
        return this;
    }

    inner() {
        this.$join = 'inner';
        return this;
    }

    left() {
        this.$join = 'left';
        return this;
    }

    right() {
        this.$join = 'right';
        return this;
    }
}
/**
 * @class
 * @property $value - The underlying value
 */
export class QueryValue {

    /**
     * @constructor
     * @param {*=} value
     */
    constructor(value) {
        this.$value = value;
    }

    /**
     * Creates a new query value
     * @param value
     * @returns {QueryValue}
     */
    static create(value) {
        return new QueryValue(value);
    }

}

export class QueryFieldUtils {
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    static select(name) {
        return new QueryField(name);
    }

    /**
     * @param name {string}
     * @returns {QueryField}
     */
    static count(name) {
        const f = new QueryField();
        return f.count(name);
    }

    /**
     * @param name {string}
     * @returns {QueryField}
     */
    static min(name) {
        const f = new QueryField();
        return f.min(name);
    }

    /**
     * @param name {string}
     * @returns {QueryField}
     */
    static max(name) {
        const f = new QueryField();
        return f.max(name);
    }

    /**
     * @param name {string}
     * @returns {QueryField}
     */
    static average(name) {
        const f = new QueryField();
        return f.average(name);
    }

    /**
     * @param name {string}
     * @returns {QueryField}
     */
    static avg(name) {
        return QueryFieldUtils.average(name);
    }

    /**
     * @param name {string}
     * @returns {QueryField}
     */
    static sum(name) {
        const f = new QueryField();
        return f.sum(name);
    }
    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static floor(name) {
        const f = { };
        f[name] = { $floor:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }
    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static ceil(name) {
        const f = { };
        f[name] = { $ceiling:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }
    /**
     * @param {string} name
     * @param {number=} divider
     * @returns {QueryField}
     */
    static modulo(name, divider) {
        const f = { };
        f[name] = { $mod:[ QueryFieldUtils.select(name), divider ] };
        return _.assign(new QueryField(), f);
    }
    /**
     * @param {string} name
     * @param {number=} x
     * @returns {QueryField}
     */
    static add(name, x) {
        const f = { };
        f[name] = { $add:[ QueryFieldUtils.select(name), x ] };
        return _.assign(new QueryField(), f);
    }
    /**
     * @param {string} name
     * @param {number=} x
     * @returns {QueryField}
     */
    static subtract(name, x) {
        const f = { };
        f[name] = { $subtract:[ QueryFieldUtils.select(name), x ] };
        return _.assign(new QueryField(), f);
    }
    /**
     * @param {string} name
     * @param {number=} divider
     * @returns {QueryField}
     */
    static divide(name, divider) {
        const f = { };
        f[name] = { $divide:[ QueryFieldUtils.select(name), divider ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @param {number=} multiplier
     * @returns {QueryField}
     */
    static multiply(name, multiplier) {
        const f = { };
        f[name] = { $multiply:[ QueryFieldUtils.select(name), multiplier ] };
        return _.assign(new QueryField(), f);
    }
    /**
     * @param {string} name
     * @param {number=} n
     * @returns {QueryField}
     */
    static round(name, n) {
        const f = { };
        if (typeof n !== 'number') { n=2; }
        f[name] = { $round:[ QueryFieldUtils.select(name), n ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static month(name) {
        const f = { };
        f[name] = { $month:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static year(name) {
        const f = { };
        f[name] = { $year:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static day(name) {
        const f = { };
        f[name] = { $day:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static hour(name) {
        const f = { };
        f[name] = { $hour:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static minute(name) {
        const f = { };
        f[name] = { $minute:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static second(name) {
        const f = { };
        f[name] = { $second:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static date(name) {
        const f = { };
        f[name] = { $date:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static length(name) {
        const f = { };
        f[name] = { $length:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }

    /**
     * @param {string} name
     * @returns {QueryField}
     */
    static trim(name) {
        const f = { };
        f[name] = { $trim:[ QueryFieldUtils.select(name) ] };
        return _.assign(new QueryField(), f);
    }
}

/**
 * @class
 */
export class QueryField {
    /**
     * @constructor
     * @param {string=} obj
     */
    constructor(obj) {
        if (typeof  obj === 'string') {
            this.$name = obj;
        }
        else if (typeof obj === 'object' && obj!==null) {
            _.assign(this, obj);
        }
    }

    /**
     * Creates a query field of the given entity
     * @param {string=} fieldName
     * @param {string=} fromEntity
     * @returns {QueryField}
     */
    static create(fieldName, fromEntity) {
        const f = new QueryField(fieldName);
        if (_.isNil(fromEntity)) {
            return f;
        }
        return f.from(fromEntity);
    }

    /**
     * @param name {string} The name of the field that is going to be selected
     * @returns {QueryField}
     */
    select(name) {
        if (typeof name !== 'string')
            throw  new Error('Invalid argument. Expected string');
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
    from(entity) {
        let name;
        if (typeof entity !== 'string')
            throw  new Error('Invalid argument. Expected string');
        //get property
        if (!_.isNil(this.$name))
        {
            if (typeof this.$name === 'string') {
                //check if an entity is already defined
                name = this.$name;
                if (QueryField.fieldNameExpression.test(name))
                //if not append entity name
                    this.$name = entity.concat('.', name);
                else
                //split field name and add entity
                    this.$name = entity.concat('.', name.split('.')[1]);
            }
            else
                throw new Error("Invalid field definition.");
        }
        else {
            //get default property
            const alias = _.findKey(this);
            if (_.isNil(alias))
                throw new Error("Field definition cannot be empty at this context");
            //get field expression
            const expr = this[alias];
            //get field name
            const aggregate = _.findKey(expr);
            if (_.isNil(aggregate))
                throw new Error("Field expression cannot be empty at this context");
            name = expr[aggregate];
            if (QueryField.fieldNameExpression.test(name))
            //if not append entity name
                expr[aggregate] = entity.concat('.', name);
            else
            //split field name and add entity
                expr[aggregate] = entity.concat('.', name.split('.')[1]);
        }
        return this;
    }

    count(name) {
        if (typeof name !== 'string')
            throw  new Error('Invalid argument. Expected string');
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
    concat(strings) {
        return this.$name.concat(strings)
    }

    sum(name) {
        if (typeof name !== 'string')
            throw  new Error('Invalid argument. Expected string');
        //clear object
        _empty(this);
        // field as aggregate function e.g. { price: { $sum: 'price' } }
        this[name] = { $sum: name };
        return this;
    }

    min(name) {
        if (typeof name !== 'string')
            throw  new Error('Invalid argument. Expected string');
        //clear object
        _empty(this);
        // field as aggregate function e.g. { price: { $min: 'price' } }
        this[name] = { $min: name };
        return this;
    }

    average(name) {
        if (typeof name !== 'string')
            throw  new Error('Invalid argument. Expected string');
        //clear object
        _empty(this);
        // field as aggregate function e.g. { price: { $avg: 'price' } }
        this[name] = { $avg: name };
        return this;
    }

    max(name) {
        if (typeof name !== 'string')
            throw  new Error('Invalid argument. Expected string');
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
    as(alias) {
        if (typeof alias === 'undefined')
        {
            if (typeof this.$name !== 'undefined')
                return null;
            const keys = _.keys(this);
            if (keys.length === 0)
                return null;
            else
                return keys[0];
        }
        if (typeof alias !== 'string')
            throw  new Error('Invalid argument. Expected string');
        //get first property
        const prop = _.findKey(this);
        if (prop === null)
            throw  new Error('Invalid object state. Field is not selected.');
        const value = this[prop];
        if (prop!==alias) {
            this[alias] = value;
            delete this[prop];
        }
        return this;
    }

    name() {
        let name = null;
        if (typeof this.$name === 'string') {
            name = this.$name
        }
        else {
            const prop = _.findKey(this);
            if (prop) {
                name = this[prop];
            }
        }
        if (typeof name === 'string') {
            //check if an entity is already defined
            const re = new RegExp(QueryField.fieldNameExpression.source);
            if (re.test(name))
                return name;
            else
                return name.split('.')[1];
        }
        return null;
    }

    /**
     * @returns {string}
     */
    getName() {
        return this.name();
    }

    nameOf() {

        if ((typeof this === 'string') || (this instanceof String)) {
            return this;
        }
        let alias;
        if (typeof this.as === 'function')
            alias = this.as();
        else
            alias = QueryField.prototype.as.call(this);

        if (alias) {
            return this[alias];
        }
        else {
            return this.$name;
        }
    }

    valueOf() {
        return this.$name;
    }


}

QueryField.fieldNameExpression = /^[A-Za-z_0-9]+$/;

/**
 * @class
 */
class QueryFieldComparer {
    /**
     *
     * @param {*} comparison
     * @returns {*}
     */
    compareWith(comparison) {
        const expr = { };
        if ((typeof this === 'string') || (this instanceof String)) {
            expr[this] = comparison;
            return expr;
        }

        //get aggregate function
        const aggr = _.findKey(this);

        let name;
        if (_.isArray(this[aggr])) {
            //get first element (the field name)
            name = QueryField.prototype.nameOf.call(this[aggr][0]);
        }
        else {
            //get element (the field name)
            name = QueryField.prototype.nameOf.call(this[aggr]);
        }
        expr[name] = { };
        expr[name][aggr] = comparison;
        return expr;
    }

    wrapWithAggregate(aggr, comparison) {
    }
}

/**
 * @class
 * @property {string} $model - Gets or sets a string which represents the target model
 * @property {string} $filter - Gets or sets a string which represents a filter statement assigned to the current data query
 * @property {number} $top - Gets or sets an integer which represents the number of records to get
 * @property {number} $skip - Gets or sets an integer which represents the number of records to skip
 */
export class OpenDataQuery {
    /**
     * @constructor
     */
    constructor() {

        /**
         * @private
         */
        this[privatesProperty] = {};
    }

    /**
     * @private
     * @returns OpenDataQuery
     */
    append() {
        let exprs;
        const self = this;
        if (self[privatesProperty].left) {
            let expr = null;

            if (self[privatesProperty].op==='in') {
                if (_.isArray(self[privatesProperty].right)) {
                    //expand values
                    exprs = [];
                    _.forEach(self[privatesProperty].right, function(x) {
                        exprs.push(self[privatesProperty].left + ' eq ' + QueryExpression.escape(x));
                    });
                    if (exprs.length>0)
                        expr = '(' + exprs.join(' or ') + ')';
                }
            }
            else if (self[privatesProperty].op==='nin') {
                if (_.isArray(self[privatesProperty].right)) {
                    //expand values
                    exprs = [];
                    _.forEach(self[privatesProperty].right, function(x) {
                        exprs.push(self[privatesProperty].left + ' ne ' + QueryExpression.escape(x));
                    });
                    if (exprs.length>0)
                        expr = '(' + exprs.join(' and ') + ')';
                }
            }
            else
                expr = self[privatesProperty].left + ' ' + self[privatesProperty].op + ' ' + QueryExpression.escape(self[privatesProperty].right);
            if (expr) {
                if (_.isNil(self.$filter))
                    self.$filter = expr;
                else {
                    self[privatesProperty].lop = self[privatesProperty].lop || 'and';
                    self[privatesProperty]._lop = self[privatesProperty]._lop || self[privatesProperty].lop;
                    if (self[privatesProperty]._lop === self[privatesProperty].lop)
                        self.$filter = self.$filter + ' ' + self[privatesProperty].lop + ' ' + expr;
                    else
                        self.$filter = '(' + self.$filter + ') ' + self[privatesProperty].lop + ' ' + expr;
                    self[privatesProperty]._lop = self[privatesProperty].lop;
                }
            }
        }
        delete self[privatesProperty].lop;delete self[privatesProperty].left; delete self[privatesProperty].op; delete self[privatesProperty].right;
        return this;
    }

    /**
     * @param {Array|String} attr
     * @returns OpenDataQuery
     */
    select(attr) {
        if (_.isArray(attr)) {
            this.$select = attr.join(',');
        }
        else
            this.$select = attr;
    }

    /**
     * @param {number} val
     * @returns OpenDataQuery
     */
    take(val) {
        this.$top = isNaN(val) ? 0 : val;
        return this;
    }

    /**
     * @param {number} val
     * @returns OpenDataQuery
     */
    skip(val) {
        this.$skip = isNaN(val) ? 0 : val;
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    orderBy(name) {
        if (typeof name !=='undefined' || name!==null)
            this.$orderby = name.toString();
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    orderByDescending(name) {
        if (typeof name !=='undefined' || name!==null)
            this.$orderby = name.toString() + ' desc';
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    thenBy(name) {
        if (typeof name !=='undefined' || name!==null) {
                this.$orderby += (this.$orderby ? ',' + name.toString() : name.toString());
        }
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    thenByDescending(name) {
        if (typeof name !=='undefined' || name!==null) {
            this.$orderby += (this.$orderby ? ',' + name.toString() : name.toString()) + ' desc';
        }
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    where(name) {
        this[privatesProperty].left = name;
        return this;
    }

    /**
     * @param {String=} name
     * @returns OpenDataQuery
     */
    and(name) {
        this[privatesProperty].lop = 'and';
        if (typeof name !== 'undefined')
            this[privatesProperty].left = name;
        return this;
    }

    /**
     * @param {String=} name
     * @returns OpenDataQuery
     */
    or(name) {
        this[privatesProperty].lop = 'or';
        if (typeof name !== 'undefined')
            this[privatesProperty].left = name;
        return this;
    }

    /**
     * @param {*} value
     * @returns OpenDataQuery
     */
    equal(value) {
        this[privatesProperty].op = 'eq';this[privatesProperty].right = value; return this.append();
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    indexOf(name) {
        this[privatesProperty].left = 'indexof(' + name + ')';
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    andIndexOf(name) {
        this[privatesProperty].lop = 'and';
        return this.indexOf(name);
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    orIndexOf(name) {
        this[privatesProperty].lop = 'or';
        return this.indexOf(name);
    }

    /**
     * @param {*} name
     * @param {*} s
     * @returns OpenDataQuery
     */
    endsWith(name, s) {
        this[privatesProperty].left = sprintf.sprintf('endswith(%s,%s)',name,QueryExpression.escape(s));
        return this;
    }

    /**
     * @param {*} name
     * @param {*} s
     * @returns OpenDataQuery
     */
    startsWith(name, s) {
        this[privatesProperty].left = sprintf.sprintf('startswith(%s,%s)',name,QueryExpression.escape(s));
        return this;
    }

    /**
     * @param {*} name
     * @param {*} s
     * @returns OpenDataQuery
     */
    substringOf(name, s) {
        this[privatesProperty].left = sprintf.sprintf('substringof(%s,%s)',name,QueryExpression.escape(s));
        return this;
    }

    /**
     * @param {*} name
     * @param {number} pos
     * @param {number} length
     * @returns OpenDataQuery
     */
    substring(name, pos, length) {
        this[privatesProperty].left = sprintf.sprintf('substring(%s,%s,%s)',name,pos,length);
        return this;
    }

    /**
     * @param {*} name
     * @returns OpenDataQuery
     */
    length(name) {
        this[privatesProperty].left = sprintf.sprintf('length(%s)',name);
        return this;
    }

    /**
     * @param {*} name
     * @returns OpenDataQuery
     */
    toLower(name) {
        this[privatesProperty].left = sprintf.sprintf('tolower(%s)',name);
        return this;
    }

    /**
     * @param {*} name
     * @returns OpenDataQuery
     */
    toUpper(name) {
        this[privatesProperty].left = sprintf.sprintf('toupper(%s)',name);
        return this;
    }

    /**
     * @param {*} name
     * @returns OpenDataQuery
     */
    trim(name) {
        this[privatesProperty].left = sprintf.sprintf('trim(%s)',name);
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
    concat(s0, s1, s2, s3, s4) {
        this[privatesProperty].left = 'concat(' + QueryExpression.escape(s0) + ',' + QueryExpression.escape(s1);
        if (typeof s2 !== 'undefined')
            this[privatesProperty].left +=',' + QueryExpression.escape(s2);
        if (typeof s3 !== 'undefined')
            this[privatesProperty].left +=',' + QueryExpression.escape(s3)
        if (typeof s4 !== 'undefined')
            this[privatesProperty].left +=',' + QueryExpression.escape(s4)
        this[privatesProperty].left +=')';
        return this;
    }

    field(name) {
        return { "$name":name }
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    day(name) {
        this[privatesProperty].left = sprintf.sprintf('day(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    hour(name) {
        this[privatesProperty].left = sprintf.sprintf('hour(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    minute(name) {
        this[privatesProperty].left = sprintf.sprintf('minute(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    month(name) {
        this[privatesProperty].left = sprintf.sprintf('month(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    second(name) {
        this[privatesProperty].left = sprintf.sprintf('second(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    year(name) {
        this[privatesProperty].left = sprintf.sprintf('year(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    round(name) {
        this[privatesProperty].left = sprintf.sprintf('round(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    floor(name) {
        this[privatesProperty].left = sprintf.sprintf('floor(%s)',name);
        return this;
    }

    /**
     * @param {String} name
     * @returns OpenDataQuery
     */
    ceiling(name) {
        this[privatesProperty].left = sprintf.sprintf('ceil(%s)',name);
        return this;
    }

    /**
     * @param {*} value
     * @returns OpenDataQuery
     */
    notEqual(value) {
        this[privatesProperty].op = 'ne';this[privatesProperty].right = value; return this.append();
    }

    /**
     * @param {*} value
     * @returns OpenDataQuery
     */
    greaterThan(value) {
        this[privatesProperty].op = 'gt';this[privatesProperty].right = value; return this.append();
    }

    /**
     * @param {*} value
     * @returns OpenDataQuery
     */
    greaterOrEqual(value) {
        this[privatesProperty].op = 'ge';this[privatesProperty].right = value; return this.append();
    }

    /**
     * @param {*} value
     * @returns OpenDataQuery
     */
    lowerThan(value) {
        this[privatesProperty].op = 'lt';this[privatesProperty].right = value; return this.append();
    }

    /**
     * @param {*} value
     * @returns OpenDataQuery
     */
    lowerOrEqual(value) {
        this[privatesProperty].op = 'le';this[privatesProperty].right = value; return this.append();
    }

    /**
     * @param {Array} values
     * @returns OpenDataQuery
     */
    in(values) {
        this[privatesProperty].op = 'in';this[privatesProperty].right = values; return this.append();
    }

    /**
     * @param {Array} values
     * @returns OpenDataQuery
     */
    notIn(values) {
        this[privatesProperty].op = 'nin';this[privatesProperty].right = values; return this.append();
    }
}
