/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-07-16
 */
/**
 * Created by kbarbounakis on 16/7/2014.
 */

/**
 * @ignore
 */
var sprintf = require('sprintf').sprintf,
    _ = require('lodash'),
    natives = require('./natives');

/**
 * @class QueryParameter
 * @constructor
 */
function QueryParameter() {

}

/**
 * @class QueryFieldAggregator
 * @constructor
 */
function QueryFieldAggregator() {
    //
}
/**
 * Wraps the given comparison expression in this aggregate function e.g. wraps { $gt:45 } with $floor aggregate function and returns { $floor: { $gt:45 } }
 * @param {*} comparison
 */
QueryFieldAggregator.prototype.wrapWith = function(comparison) {
    var name = Object.keys(this)[0];
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
};



/**
 * @class QueryExpression
 * @constructor
 */
function QueryExpression()
{
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
    this.privates = function() { };

}
/**
 * @private
 * @param {string|*=} s
 * @returns {string|*}
 */
QueryExpression.prototype.prop = function(s)
{
    if (typeof s === 'undefined') { return this.privates.__prop; }
    if (_.isNil(s)) { delete this.privates.__prop; }
    this.privates.__prop = s;
};

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
QueryExpression.prototype.clone = function()
{
    return _.assign(new QueryExpression(), this);
};

/**
 * Sets the alias of a QueryExpression instance. This alias is going to be used in sub-query operations.
 * @returns {QueryExpression}
 */
QueryExpression.prototype.as = function(alias)
{
    this.$alias = alias;
    return this;
};

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
 * Gets a collection that represents the selected fields of the underlying expression
 * @returns {Array}
 */
QueryExpression.prototype.fields = function() {

    if (_.isNil(this.$select))
        return [];
    var entity = Object.key(this.$select);
    var joins = [];
    if (this.$expand!==null)
    {
        if (_.isArray(this.$expand))
            joins=this.$expand;
        else
            joins.push(this.$expand);
    }
    //get entity fields
    var fields = [];
    //get fields
    var re = QueryField.fieldNameExpression, arr = this.$select[entity] || [];
    _.forEach(arr, function(x)
    {
        if (typeof x === 'string') {
            //todo:add entity alias (if (/^[A-Za-z]+$/.test(x))
            re.lastIndex=0;
            if (!re.test(x))
                fields.push(new QueryField(x));
            else {
                var f = new QueryField(x);
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
            var table = Object.key(x.$entity), tableFields = x.$entity[table] || [];
            _.forEach(tableFields, function(y) {
                if (typeof x === 'string') {
                    //todo:add table alias (if (/^[A-Za-z]+$/.test(y))
                    fields.push(new QueryField(y));
                }
                else {
                    fields.push(_.assign(new QueryField(), y));
                }
            });
        }
    });
    return fields;
};

/**
 * Gets a boolean value that indicates whether query expression has a filter statement or not.
 * @returns {boolean}
 */
QueryExpression.prototype.hasFilter = function()
{
    return _.isObject(this.$where);
};
/**
 * @param {Boolean} useOr
 * @returns {QueryExpression}
 */
QueryExpression.prototype.prepare = function(useOr)
{
    if (typeof this.$where === 'object') {
        if (typeof this.$prepared === 'object')
        {
            var preparedWhere = {};
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
};

/**
 * Gets a boolean value that indicates whether query expression has fields or not.
 * @returns {boolean}
 */
QueryExpression.prototype.hasFields = function()
{
    var self = this;
    if (!_.isObject(self.$select))
        return false;
    var entity = Object.key(self.$select);
    var joins = [];
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
    var result = false;
    //enumerate join fields
    _.forEach(joins, function(x)
    {
        var table = Object.key(x.$entity);
        if (_.isArray(x.$entity[table])) {
            if (x.$entity[table].length>0)
                result = true;
        }
    });
    return result;
};


/**
 * Gets a boolean value that indicates whether query expression has paging or not.
 * @returns {boolean}
 */
QueryExpression.prototype.hasPaging = function()
{
    return (typeof this.$take !=='undefined' && this.$take!==null);
};

/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.distinct = function(value)
{
    if (typeof value === 'undefined')
        this.$distinct = true;
    else
        this.$distinct = value || false;
    return this;
};

/**
 * @param name {string|QueryField|*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.where = function(name)
{
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
};

/**
 * Injects the given filter expression into the current query expression
 * @param {*} where - An object that represents a filter expression
 * @returns {QueryExpression}
 */
QueryExpression.prototype.injectWhere = function(where)
{
    if (_.isNil(where))
        return this;
    this.$where = where;
};

/**
 * Initializes a delete query and sets the entity name that is going to be used in this query.
 * @param entity {string}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.delete = function(entity)
{
    if (_.isNil(entity))
        return this;
    this.$delete = entity.valueOf();
    //delete other properties (if any)
    delete this.$insert;
    delete this.$select;
    delete this.$update;
    return this;
};

/**
 * Initializes an insert query and sets the object that is going to be inserted.
 * @param obj {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.insert = function(obj)
{
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
};


QueryExpression.prototype.into = function(entity) {
    if (_.isNil(entity))
        return this;
    if (_.isNil(this.$insert))
        return this;
    var prop = Object.key(this.$insert);
    if (_.isNil(prop))
        return this;
    if (prop===entity)
        return this;
    var value = this.$insert[prop];
    if (_.isNil(value))
        return this;
    this.$insert[entity] = value;
    delete this.$insert[prop];
    return this;
};

/**
 * Initializes an update query and sets the entity name that is going to be used in this query.
 * @param {string} entity
 * @returns {QueryExpression}
 */
QueryExpression.prototype.update = function(entity)
{
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
};
/**
 * Sets the object that is going to be updated through an update expression.
 * @param {*} obj
 * @returns {QueryExpression}
 */
QueryExpression.prototype.set = function(obj)
{
    if (_.isNil(obj))
        return this;
    if (_.isArray(obj) || !_.isObject(obj))
        throw new Error('Invalid argument type. Update expression argument must be an object.');
    //get entity name (by property)
    var prop = Object.key(this.$update);
    if (_.isNil(prop))
        throw new Error('Invalid operation. Update entity cannot be empty at this context.');
    //set object to update
    this.$update[prop] = obj;
    return this;
};

/**
 *
 * @param {Array} props
 * @returns {QueryExpression}
 */
QueryExpression.prototype.select = function(props)
{
    if (_.isNil(props))
        return this;
    var fields = [];
    if (!_.isArray(props))
    {
        if (typeof props === 'string')
            fields.push(props);
        else
            throw new Error('Invalid argument type. Select argument must be an array.');
    }
    else
        fields = props;
    //if entity is already defined
    if (this.privates.__entity)
    {
        //initialize $select property
        this.$select = {};
        //and set array of fields
        this.$select[this.privates.__entity] = fields;
    }
    else
    {
        //otherwise store array of fields in temporary property and wait
        this.privates.__fields = fields;
    }
    //delete other properties (if any)
    delete this.$delete;
    delete this.$insert;
    delete this.$update;
    return this;
};
/**
 * Sets the entity of a select query expression
 * @param entity {string|QueryEntity|*} A string that represents the entity name
 * @returns {QueryExpression}
 */
QueryExpression.prototype.from = function(entity) {

    if (_.isNil(entity))
        return this;
    var name;
    if (entity instanceof QueryEntity) {
        name  = entity.$as || entity.name;
        this.$ref = this.$ref || {};
        this.$ref[name] = entity;
    }
    else {
        name = entity.valueOf();
    }
    if (this.privates.__fields) {
        //initialize $select property
        this.$select = {};
        //and set array of fields
        this.$select[name] = this.privates.__fields;
    }
    else {
        this.privates.__entity = name;
    }
    //delete other properties (if any)
    delete this.$delete;
    delete this.$insert;
    delete this.$update;
    //and return this object
    return this;
};

/**
 * Initializes a join expression with the specified entity
 * @param {*} entity
 * @param {Array=} props
 * @param {String=} alias
 * @returns {QueryExpression}
 */
QueryExpression.prototype.join = function(entity, props, alias) {

    if (_.isNil(entity))
        return this;
    if (_.isNil(this.$select))
        throw new Error('Query entity cannot be empty when adding a join entity.');
    var obj = {};
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
    this.privates.__expand =  { $entity: obj };
    //and return this object
    return this;
};
/**
 * Sets the join expression of the last join entity
 * @param obj {Array|*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.with = function(obj) {

    if (_.isNil(obj))
        return this;
    if (_.isNil(this.privates.__expand))
        throw new Error('Join entity cannot be empty when adding a join expression. Use QueryExpression.join(entity, props) before.');
    if (obj instanceof QueryExpression)
    {
        var expr = obj,
            where = null;
        if (expr.$where)
            where = expr.$prepared ? { $and: [expr.$prepared, expr.$where] } : expr.$where;
        else if (expr.$prepared)
            where = expr.$prepared;
        this.privates.__expand.$with = where;
    }
    else {
        this.privates.__expand.$with = obj;
    }
    if (_.isNil(this.$expand)) {
        this.$expand = this.privates.__expand;
    }
    else {
        if (_.isArray(this.$expand)) {
            this.$expand.push(this.privates.__expand);
        }
        else {
            //get expand object
            var expand = this.$expand;
            //and create array of expand objects
            this.$expand = [expand, this.privates.__expand];
        }
    }
    //destroy temp object
    this.privates.__expand = null;
    //and return QueryExpression
    return this;
};

/**
 * Applies an ascending ordering to a query expression
 * @param name {string|Array}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.orderBy = function(name) {

    if (_.isNil(name))
        return this;
    if (_.isNil(this.$order))
        this.$order = [];
    this.$order.push({ $asc: name });
    return this;
};
/**
 * Applies a descending ordering to a query expression
 * @param name
 * @returns {QueryExpression}
 */
QueryExpression.prototype.orderByDescending = function(name) {

    if (_.isNil(name))
        return this;
    if (_.isNil(this.$order))
        this.$order = [];
    this.$order.push({ $desc: name });
    return this;
};

/**
 * Performs a subsequent ordering in a query expression
 * @param name {string|Array}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.thenBy = function(name) {

    if (_.isNil(name))
        return this;
    if (_.isNil(this.$order))
    //throw exception (?)
        return this;
    this.$order.push({ $asc: name });
    return this;
};

/**
 * Performs a subsequent ordering in a query expression
 * @param name {string|Array}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.thenByDescending = function(name) {

    if (_.isNil(name))
        return this;
    if (_.isNil(this.$order))
    //throw exception (?)
        return this;
    this.$order.push({ $desc: name });
    return this;
};
/**
 *
 * @param name {string|Array}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.groupBy = function(name) {

    if (_.isNil(name))
        return this;
    if (_.isNil(this.$group))
        this.$group = [];
    var self = this;
    if (_.isArray(name)) {
        _.forEach(name, function (x) {
            if (x)
                self.$group.push(x);
        });
    }
    else
        this.$group.push(name);
    return this;
};
/**
 * @param expr
 * @private
 */
QueryExpression.prototype.__append = function(expr) {
    if (!expr)
        return;
    if (!this.$where) {
        this.$where = expr;
    }
    else {
        var op = this.privates.__expr;
        if (op) {
            //get current operator
            var keys = Object.keys(this.$where);
            if (keys[0]===op) {
                this.$where[op].push(expr);
            }
            else {
                var newFilter = {};
                newFilter[op] = [this.$where, expr];
                this.$where = newFilter;
            }
        }
    }
    delete this.privates.__prop;
    delete this.privates.__expr;
    delete this.privates.__aggr;
};
/**
 * @param name {string|QueryField}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.or = function(name)
{
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
    this.privates.__expr = '$or';
    return this;
};
/**
 * @param name {string|QueryField|*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.and = function(name)
{
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
    this.privates.__expr = '$and';
    return this;
};
/**
 * Prepares an equal expression.
 * @example
 * q.where('id').equal(10) //id=10 expression
 * @param {*} value - A value that represents the right part of the prepared expression
 * @returns {QueryExpression}
 */
QueryExpression.prototype.equal = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = value;
        //apply aggregation if any
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, value);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};
/**
 * Prepares an equal expression.
 * @example
 * q.where('id').eq(10) //id=10 expression
 * @param {*} value
 * @returns {QueryExpression}
 */
QueryExpression.prototype.eq = QueryExpression.prototype.equal;
/**
 * Prepares a not equal expression.
 * @example
 * q.where('id').notEqual(10) //id<>10 expression
 * @param {*} value - A value that represents the right part of the prepared expression
 * @returns {QueryExpression}
 */
QueryExpression.prototype.notEqual = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $ne:value };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr,{ $ne:value });
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};

/**
 * Prepares an in statement expression
 * @example
 * q.where('id').in([10, 11, 12]) //id in (10,11,12) expression
 * @param {Array} values - An array of values that represents the right part of the prepared expression
 * @returns {QueryExpression}
 */
QueryExpression.prototype.in = function(values)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $in : values };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};
/**
 * Prepares a not in statement expression
 * @example
 * q.where('id').notIn([10, 11, 12]) //id in (10,11,12) expression
 * @param {Array} values - An array of values that represents the right part of the prepared expression
 * @returns {QueryExpression}
 */
QueryExpression.prototype.notIn = function(values)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $nin : values };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr,{ $nin : values });
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};
/**
 * @param {*} value The value to be compared
 * @param {Number} result The result of modulo expression
 * @returns {QueryExpression}
 */
QueryExpression.prototype.mod = function(value, result)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $mod : [ value, result] };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};

/**
 * @param {*} value The value to be compared
 * @param {Number} result The result of a bitwise and expression
 * @returns {QueryExpression}
 */
QueryExpression.prototype.bit = function(value, result)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $bit : [ value, result] };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};


QueryExpression.prototype.ne = QueryExpression.prototype.notEqual;
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.greaterThan = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $gt:value };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};

/**
 * @param value {RegExp|*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.startsWith = function(value)
{
    var p0 = this.prop(), r;
    if (p0) {
        if (typeof value === 'string' || value instanceof String) {
            r = new RegExp('^' + value,'i');
        }
        else {
            throw new Error('Invalid argument. Expected string.')
        }
        var comparison = { $regex : '^' + value, $options:'i' };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr,{ $regex : '^' + value, $options:'i' });
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};

/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.endsWith = function(value)
{
    var p0 = this.prop(), r;
    if (p0) {
        if (typeof value === 'string' || value instanceof String) {
            //validate regular expression
            r = new RegExp(value + '$','i');
        }
        else {
            throw new Error('Invalid argument. Expected string.')
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, { $regex : value + '$', $options:'i' });
        this.__append(expr);
    }
    return this;
};

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
QueryExpression.prototype.contains = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $text: { $search: value } };
        //apply aggregation if any
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison );
        this.__append(expr);
    }
    return this;
};

QueryExpression.prototype.notContains = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $text: { $search: value } };
        //apply aggregation if any
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = { $not: QueryFieldComparer.prototype.compareWith.call(p0, comparison) };
        this.__append(expr);
    }
    return this;
};

QueryExpression.prototype.gt = QueryExpression.prototype.greaterThan;
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.lowerThan = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $lt:value };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.lt = QueryExpression.prototype.lowerThan;
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.lowerOrEqual = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $lte:value };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};

QueryExpression.prototype.lte = QueryExpression.prototype.lowerOrEqual;
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.greaterOrEqual = function(value)
{
    var p0 = this.prop();
    if (p0) {
        var comparison = { $gte:value };
        if (typeof this.__aggr === 'object') {
            comparison = QueryFieldAggregator.prototype.wrapWith.call(this.__aggr, comparison);
            delete this.__aggr;
        }
        var expr = QueryFieldComparer.prototype.compareWith.call(p0, comparison);
        this.__append(expr);
    }
    return this;
};

/**
 * @param {*} value1
 * @param {*} value2
 * @returns {QueryExpression}
 */
QueryExpression.prototype.between = function(value1, value2)
{
    var p0 = this.prop();
    if (p0) {
        var comparison1 = { $gte:value1}, comparison2 = { $lte:value2 };
        if (typeof this.__aggr === 'object') {
            comparison1 = QueryFieldAggregator.prototype.wrapWith({ $gte:value1} );
            comparison2 = QueryFieldAggregator.prototype.wrapWith({ $lte:value2} );
            delete this.__aggr
        }
        var comp1 = QueryFieldComparer.prototype.compareWith.call(p0, comparison1);
        var comp2 = QueryFieldComparer.prototype.compareWith.call(p0, comparison2);
        var expr = {};
        expr['$and'] = [ comp1, comp2 ];
        this.__append(expr);
    }
    return this;
};

/**
 * Skips the specified number of objects during select.
 * @param {Number} n
 * @returns {QueryExpression}
 */
QueryExpression.prototype.skip = function(n)
{
    this.$skip = isNaN(n) ? 0 : n;
    return this;
};

/**
 * Takes the specified number of objects during select.
 * @param {Number} n
 * @returns {QueryExpression}
 */
QueryExpression.prototype.take = function(n)
{
    this.$take = isNaN(n) ? 0 : n;
    return this;
};
/**
 * @param value {*}
 * @returns {QueryExpression}
 */
QueryExpression.prototype.gte = QueryExpression.prototype.greaterOrEqual;
/**
 * @private
 * @param {number|*} number
 * @param {number} length
 * @returns {*}
 */
QueryExpression.zeroPad = function(number, length) {
    number = number || 0;
    var res = number.toString();
    while (res.length < length) {
        res = '0' + res;
    }
    return res;
};
/**
 * @param {number|*} x
 * @returns {QueryExpression}
 */
QueryExpression.prototype.add = function(x) {
    this.__aggr = { $add:[ x, new QueryParameter() ] };
    return this;
};
/**
 * @param {number|*} x
 * @returns {QueryExpression}
 */
QueryExpression.prototype.subtract = function(x) {
    this.__aggr = { $subtract:[ x, new QueryParameter() ] };
    return this;
};
/**
 * @param {number} x
 * @returns {QueryExpression}
 */
QueryExpression.prototype.multiply = function(x) {
    this.__aggr = { $multiply:[ x, new QueryParameter() ] };
    return this;
};
/**
 * @param {number} x
 * @returns {QueryExpression}
 */
QueryExpression.prototype.divide = function(x) {
    this.__aggr = { $divide:[ x, new QueryParameter() ] };
    return this;
};
/**
 * @param {number=} n
 * @returns {QueryExpression}
 */
QueryExpression.prototype.round = function(n) {
    this.__aggr = { $round:[ n, new QueryParameter() ] };
    return this;
};
/**
 * @param {number} start
 * @param {number=} length
 * @returns {QueryExpression}
 */
QueryExpression.prototype.substr = function(start,length) {
    this.__aggr = { $substr:[ start, length, new QueryParameter() ] };
    return this;
};
/**
 * @param {string} s
 * @returns {QueryExpression}
 */
QueryExpression.prototype.indexOf = function(s) {
    this.__aggr = { $indexOf:[ s, new QueryParameter() ] };
    return this;
};
/**
 * @param {string|*} s
 * @returns {QueryExpression}
 */
QueryExpression.prototype.concat = function(s) {
    this.__aggr = { $concat:[ s, new QueryParameter()] };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.trim = function() {
    this.__aggr = { $trim: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.length = function() {
    this.__aggr = { $length: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.getDate = function() {
    this.__aggr = { $date: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.getYear = function() {
    this.__aggr = { $year: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.getMonth = function() {
    this.__aggr = { $month: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.getDay = function() {
    this.__aggr = { $dayOfMonth: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.getHours = function() {
    this.__aggr = { $hour: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.getMinutes = function() {
    this.__aggr = { $minutes: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.getSeconds = function() {
    this.__aggr = { $seconds: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.floor = function() {
    this.__aggr = { $floor: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.ceil = function() {
    this.__aggr = { $ceiling: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.toLocaleLowerCase = function() {
    this.__aggr = { $toLower: new QueryParameter() };
    return this;
};
/**
 * @returns {QueryExpression}
 */
QueryExpression.prototype.toLocaleUpperCase = function() {
    this.__aggr = { $toUpper: new QueryParameter() };
    return this;
};

QueryExpression.escape = function(val)
{
    if (_.isNil(val)) {
        return 'null';
    }

    switch (typeof val) {
        case 'boolean': return (val) ? 'true' : 'false';
        case 'number': return val+'';
    }

    if (val instanceof Date) {
        var dt = new Date(val);
        var year   = dt.getFullYear();
        var month  = QueryExpression.zeroPad(dt.getMonth() + 1, 2);
        var day    = QueryExpression.zeroPad(dt.getDate(), 2);
        var hour   = QueryExpression.zeroPad(dt.getHours(), 2);
        var minute = QueryExpression.zeroPad(dt.getMinutes(), 2);
        var second = QueryExpression.zeroPad(dt.getSeconds(), 2);
        var millisecond = QueryExpression.zeroPad(dt.getMilliseconds(), 3);
        val = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
    }

    if (typeof val === 'object' && Object.prototype.toString.call(val) === '[object Array]') {
        var values = [];
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
};



/**
 * @class QueryEntity
 * @param {string|*} obj
 * @constructor
 */
function QueryEntity(obj) {
    var entity = obj || 'Table';
    this[entity] = [];
    Object.defineProperty(this, 'name', {
        get: function() {
            return entity;
        }, configurable:false, enumerable:false
    });
    var self = this;
    Object.defineProperty(this, 'props', {
        get: function() {
            return self[entity];
        }, configurable:false, enumerable:false
    });
}

QueryEntity.prototype.select = function(name) {
    var f = new QueryField(name);
    return f.from(this.$as ? this.$as : this.name);
};

QueryEntity.prototype.as = function(alias) {
    this.$as = alias;
    return this;
};

QueryEntity.prototype.inner = function() {
    this.$join = 'inner';
    return this;
};

QueryEntity.prototype.left = function() {
    this.$join = 'left';
    return this;
};
QueryEntity.prototype.right = function() {
    this.$join = 'right';
    return this;
};

/**
 * @class QueryField
 * @param obj {string=}
 * @constructor
 */
function QueryField(obj) {
    if (typeof  obj === 'string') {
        this.$name = obj;
    }
    else if (typeof obj === 'object' && obj!==null) {
        _.assign(this, obj);
    }
}
/**
 * @param name {string} The name of the field that is going to be selected
 * @returns {QueryField}
 */
QueryField.prototype.select = function(name)
{
    if (typeof name !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //clear object
    Object.clear(this);
    // field as string e.g. { $name: 'price' }
    this.$name = name;
    return this;
};

QueryField.fieldNameExpression = /^[A-Za-z_0-9]+$/;

/**
 * Sets the entity of the current field
 * @param entity {string}
 * @returns {QueryField}
 */
QueryField.prototype.from = function(entity)
{
    if (typeof entity !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //get property
    if (!_.isNil(this.$name))
    {
        if (typeof this.$name === 'string') {
            //check if an entity is already defined
            var name = this.$name;
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
        var alias = Object.key(this);
        if (_.isNil(alias))
            throw new Error("Field definition cannot be empty at this context");
        //get field expression
        var expr = this[alias];
        //get field name
        var aggregate = Object.key(expr);
        if (_.isNil(aggregate))
            throw new Error("Field expression cannot be empty at this context");
        var name = expr[aggregate];
        if (QueryField.fieldNameExpression.test(name))
        //if not append entity name
            expr[aggregate] = entity.concat('.', name);
        else
        //split field name and add entity
            expr[aggregate] = entity.concat('.', name.split('.')[1]);
    }
    return this;
};


QueryField.prototype.count = function(name) {
    if (typeof name !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //clear object
    Object.clear(this);
    // field as aggregate function e.g. { price: { $count: 'price' } }
    this[name] = { $count: name };
    return this;
};
/**
 * @param {...string} [strings]
 * @return {string}
 */
QueryField.prototype.concat = function(strings) {
    return this.$name.concat(strings)
};

QueryField.prototype.sum = function(name) {
    if (typeof name !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //clear object
    Object.clear(this);
    // field as aggregate function e.g. { price: { $sum: 'price' } }
    this[name] = { $sum: name };
    return this;
};

QueryField.prototype.min = function(name) {
    if (typeof name !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //clear object
    Object.clear(this);
    // field as aggregate function e.g. { price: { $min: 'price' } }
    this[name] = { $min: name };
    return this;
};

QueryField.prototype.average = function(name) {
    if (typeof name !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //clear object
    Object.clear(this);
    // field as aggregate function e.g. { price: { $avg: 'price' } }
    this[name] = { $avg: name };
    return this;
};

QueryField.prototype.max = function(name) {
    if (typeof name !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //clear object
    Object.clear(this);
    // field as aggregate function e.g. { price: { $max: 'price' } }
    this[name] = { $max: name };
    return this;
};

/**
 *
 * @param {String=} alias
 * @returns {QueryField|String}
 */
QueryField.prototype.as = function(alias) {
    if (typeof alias === 'undefined')
    {
        if (typeof this.$name !== 'undefined')
            return null;
        var keys = Object.keys(this);
        if (keys.length===0)
            return null;
        else
            return keys[0];
    }
    if (typeof alias !== 'string')
        throw  new Error('Invalid argument. Expected string');
    //get first property
    var prop = Object.key(this);
    if (_.isNil(prop))
        throw  new Error('Invalid object state. Field is not selected.');
    var value = this[prop];
    if (prop!==alias) {
        this[alias] = value;
        delete this[prop];
    }
    return this;
};


QueryField.prototype.name = function() {
    var name = null;
    if (typeof this.$name === 'string') {
        name = this.$name
    }
    else {
        var prop = Object.key(this);
        if (prop) {
            name = this[prop];
        }
    }
    if (typeof name === 'string') {
        //check if an entity is already defined
        var re = new RegExp(QueryField.fieldNameExpression.source);
        if (re.test(name))
            return name;
        else
            return name.split('.')[1];
    }
    return null;
};

QueryField.prototype.nameOf = function() {

    if ((typeof this === 'string') || (this instanceof String)) {
        return this;
    }
    var alias;
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
};

QueryField.prototype.valueOf = function() {
    return this.$name;
};
/**
 * @param name {string}
 * @returns {QueryField}
 */
QueryField.select = function(name) {
    return new QueryField(name);
};
/**
 * @param name {string}
 * @returns {QueryField}
 */
QueryField.count = function(name) {
    var f = new QueryField();
    return f.count(name);
};

/**
 * @param name {string}
 * @returns {QueryField}
 */
QueryField.min = function(name) {
    var f = new QueryField();
    return f.min(name);
};
/**
 * @param name {string}
 * @returns {QueryField}
 */
QueryField.max = function(name) {
    var f = new QueryField();
    return f.max(name);
};
/**
 * @param name {string}
 * @returns {QueryField}
 */
QueryField.average = function(name) {
    var f = new QueryField();
    return f.average(name);
};
/**
 * @param name {string}
 * @returns {QueryField}
 */
QueryField.sum = function(name) {
    var f = new QueryField();
    return f.sum(name);
};
/**
 * @class QueryFieldComparer
 * @constructor
 */
function QueryFieldComparer() {
    //
}
/**
 *
 * @param {*} comparison
 * @returns {*}
 */
QueryFieldComparer.prototype.compareWith = function(comparison) {
    var expr = { };
    if ((typeof this === 'string') || (this instanceof String)) {
        expr[this] = comparison;
        return expr;
    }
    //get aggregate function
    var aggr = Object.key(this), name;
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
};

QueryFieldComparer.prototype.wrapWithAggregate = function(aggr, comparison) {
};
/**
 * @class OpenDataQuery
 * @constructor
 */
function OpenDataQuery() {
    /**
     * Gets or sets a string that represents the target model
     * @private
     * @type {String}
     */
    this.$model = undefined;
    /**
     * @type {String}
     * @private
     */
    this.$filter = undefined;
    /**
     * @type {number}
     * @private
     */
    this.$top = undefined;
    /**
     * @private
     * @type {number}
     */
    this.$skip = undefined;
    /**
     * @private
     */
    this.privates = function() {};
}
/**
 * @private
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.append = function() {

    var self = this;
    if (self.privates.left) {
        var expr = null;

        if (self.privates.op==='in') {
            if (_.isArray(self.privates.right)) {
                //expand values
                var exprs = [];
                _.forEach(self.privates.right, function(x) {
                    exprs.push(self.privates.left + ' eq ' + QueryExpression.escape(x));
                });
                if (exprs.length>0)
                    expr = '(' + exprs.join(' or ') + ')';
            }
        }
        else if (self.privates.op==='nin') {
            if (_.isArray(self.privates.right)) {
                //expand values
                var exprs = [];
                _.forEach(self.privates.right, function(x) {
                    exprs.push(self.privates.left + ' ne ' + QueryExpression.escape(x));
                });
                if (exprs.length>0)
                    expr = '(' + exprs.join(' and ') + ')';
            }
        }
        else
            expr = self.privates.left + ' ' + self.privates.op + ' ' + QueryExpression.escape(self.privates.right);
        if (expr) {
            if (_.isNil(self.$filter))
                self.$filter = expr;
            else {
                self.privates.lop = self.privates.lop || 'and';
                self.privates._lop = self.privates._lop || self.privates.lop;
                if (self.privates._lop === self.privates.lop)
                    self.$filter = self.$filter + ' ' + self.privates.lop + ' ' + expr;
                else
                    self.$filter = '(' + self.$filter + ') ' + self.privates.lop + ' ' + expr;
                self.privates._lop = self.privates.lop;
            }
        }
    }
    delete self.privates.lop;delete self.privates.left; delete self.privates.op; delete self.privates.right;
    return this;
};

/**
 * @param {Array|String} attr
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.select = function(attr) {
    if (_.isArray(attr)) {
        this.$select = attr.join(',');
    }
    else
        this.$select = attr;
};

/**
 * @param {number} val
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.take = function(val) {
    this.$top = isNaN(val) ? 0 : val;
    return this;
};
/**
 * @param {number} val
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.skip = function(val) {
    this.$skip = isNaN(val) ? 0 : val;
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.orderBy = function(name) {
    if (typeof name !=='undefined' || name!==null)
        this.$orderby = name.toString();
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.orderByDescending = function(name) {
    if (typeof name !=='undefined' || name!==null)
        this.$orderby = name.toString() + ' desc';
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.thenBy = function(name) {
    if (typeof name !=='undefined' || name!==null) {
            this.$orderby += (this.$orderby ? ',' + name.toString() : name.toString());
    }
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.thenByDescending = function(name) {
    if (typeof name !=='undefined' || name!==null) {
        this.$orderby += (this.$orderby ? ',' + name.toString() : name.toString()) + ' desc';
    }
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.where = function(name) {
    this.privates.left = name;
    return this;
};

/**
 * @param {String=} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.and = function(name) {
    this.privates.lop = 'and';
    if (typeof name !== 'undefined')
        this.privates.left = name;
    return this;
};

/**
 * @param {String=} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.or = function(name) {
    this.privates.lop = 'or';
    if (typeof name !== 'undefined')
        this.privates.left = name;
    return this;
};

/**
 * @param {*} value
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.equal = function(value) {
    this.privates.op = 'eq';this.privates.right = value; return this.append();
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.indexOf = function(name) {
    this.privates.left = 'indexof(' + name + ')';
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.andIndexOf = function(name) {
    this.privates.lop = 'and';
    return this.indexOf(name);
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.orIndexOf = function(name) {
    this.privates.lop = 'or';
    return this.indexOf(name);
};

/**
 * @param {*} name
 * @param {*} s
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.endsWith = function(name, s) {
    this.privates.left = sprintf('endswith(%s,%s)',name,QueryExpression.escape(s));
    return this;
};

/**
 * @param {*} name
 * @param {*} s
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.startsWith = function(name, s) {
    this.privates.left = sprintf('startswith(%s,%s)',name,QueryExpression.escape(s));
    return this;
};

/**
 * @param {*} name
 * @param {*} s
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.substringOf = function(name, s) {
    this.privates.left = sprintf('substringof(%s,%s)',name,QueryExpression.escape(s));
    return this;
};

/**
 * @param {*} name
 * @param {number} pos
 * @param {number} length
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.substring = function(name, pos, length) {
    this.privates.left = sprintf('substring(%s,%s,%s)',name,pos,length);
    return this;
};

/**
 * @param {*} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.length = function(name) {
    this.privates.left = sprintf('length(%s)',name);
    return this;
};

/**
 * @param {*} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.toLower = function(name) {
    this.privates.left = sprintf('tolower(%s)',name);
    return this;
};

/**
 * @param {*} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.toUpper = function(name) {
    this.privates.left = sprintf('toupper(%s)',name);
    return this;
};

/**
 * @param {*} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.trim = function(name) {
    this.privates.left = sprintf('trim(%s)',name);
    return this;
};

/**
 * @param {*} s0
 * @param {*} s1
 * @param {*=} s2
 * @param {*=} s3
 * @param {*=} s4
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.concat = function(s0, s1, s2, s3, s4) {
    this.privates.left = 'concat(' + QueryExpression.escape(s0) + ',' + QueryExpression.escape(s1);
    if (typeof s2 !== 'undefined')
        this.privates.left +=',' + QueryExpression.escape(s2);
    if (typeof s3 !== 'undefined')
        this.privates.left +=',' + QueryExpression.escape(s3);
    if (typeof s4 !== 'undefined')
        this.privates.left +=',' + QueryExpression.escape(s4);
    this.privates.left +=')';
    return this;
};

OpenDataQuery.prototype.field = function(name) {
    return { "$name":name }
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.day = function(name) {
    this.privates.left = sprintf('day(%s)',name);
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.day = function(name) {
    this.privates.left = sprintf('hour(%s)',name);
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.minute = function(name) {
    this.privates.left = sprintf('minute(%s)',name);
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.month = function(name) {
    this.privates.left = sprintf('month(%s)',name);
    return this;
};


/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.second = function(name) {
    this.privates.left = sprintf('second(%s)',name);
    return this;
};


/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.year = function(name) {
    this.privates.left = sprintf('year(%s)',name);
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.round = function(name) {
    this.privates.left = sprintf('round(%s)',name);
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.floor = function(name) {
    this.privates.left = sprintf('floor(%s)',name);
    return this;
};

/**
 * @param {String} name
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.ceiling = function(name) {
    this.privates.left = sprintf('floor(%s)',name);
    return this;
};

/**
 * @param {*} value
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.notEqual = function(value) {
    this.privates.op = 'ne';this.privates.right = value; return this.append();
};


/**
 * @param {*} value
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.greaterThan = function(value) {
    this.privates.op = 'gt';this.privates.right = value; return this.append();
};

/**
 * @param {*} value
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.greaterOrEqual = function(value) {
    this.privates.op = 'ge';this.privates.right = value; return this.append();
};

/**
 * @param {*} value
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.lowerThan = function(value) {
    this.privates.op = 'lt';this.privates.right = value; return this.append();
};

/**
 * @param {*} value
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.lowerOrEqual = function(value) {
    this.privates.op = 'le';this.privates.right = value; return this.append();
};

/**
 * @param {Array} values
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.in = function(values) {
    this.privates.op = 'in';this.privates.right = values; return this.append();
};

/**
 * @param {Array} values
 * @returns OpenDataQuery
 */
OpenDataQuery.prototype.notIn = function(values) {
    this.privates.op = 'nin';this.privates.right = values; return this.append();
};

var qryq = {
    /**
     * @constructs QueryExpression
     */
    QueryExpression : QueryExpression,
    /**
     * @constructs QueryField
     */
    QueryField : QueryField,
    /**
     * @constructs OpenDataQuery
     */
    QueryEntity : QueryEntity,
    /**
     * @constructs OpenDataQuery
     * @constructor
     */
    OpenDataQuery : OpenDataQuery
};

if (typeof exports !== 'undefined') {
    module.exports = qryq;
}

