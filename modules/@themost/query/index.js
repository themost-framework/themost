/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
/**
 * @ignore
 */
var _ = require('lodash'),
    odata = require('./odata'),
    frmt = require('./formatter'),
    closures = require('./closures'),
    sqlutils = require('./sql-utils'),
    qryq = require('./query'),
    QueryExpression = qryq.QueryExpression,
    QueryField = qryq.QueryField,
    QueryEntity = qryq.QueryEntity,
    OpenDataQuery = qryq.OpenDataQuery;

/**
 * @exports most-query
 */
var qry = { };

qry.classes = {
    QueryExpression:QueryExpression,
    QueryField:QueryField,
    QueryEntity:QueryEntity,
    SqlFormatter:frmt.SqlFormatter,
    OpenDataQuery:OpenDataQuery
};
/**
 * Escapes the given value to an equivalent string which is going to used in SQL expressions
 * @param {*} val
 * @returns {string}
 */
qry.escape = function(val) {
    return sqlutils.escape(val);
};
/**
 * @returns {QueryExpression}
 * @param {string=} entity - The entity that is going to be used in this operation
 */
qry.query = function(entity) {
    var q = new QueryExpression();
    q.from(entity);
    return q;
};

/**
 * Initializes a QueryExpression instance.
 * @returns {QueryExpression}
 * @param  {String|*} obj
 */
qry.where = function(obj) {
    var q = new QueryExpression();
    return q.where(obj);
};

/**
 * Initializes a select query expression from the specified entity
 * @returns {QueryExpression}
 * @param entity {string} - The entity that is going to be used in this operation
 */
qry.selectFrom = function(entity) {

    var q = new QueryExpression();
    q.from(entity);
    return q;
};

/**
 * Initializes a delete query expression from the specified entity
 * @param entity {string}
 * @returns {QueryExpression}
 */
qry.deleteFrom = function(entity) {
    var q = new QueryExpression();
    q.delete(entity);
    return q;
};
/**
 * @param {*} obj
 * @returns {QueryExpression|*}
 */
qry.insert = function(obj) {
    var q = new QueryExpression();
    return q.insert(obj);
};

/**
 * @param {string} entity
 * @returns {QueryExpression|*}
 */
qry.update = function(entity) {
    var q = new QueryExpression();
    return q.update(entity);
};
/**
 * Formats the given value and returns an equivalent string which is going to be used in SQL expressions.
 * @param {QueryExpression|*} query
 * @param {string=} s
 * @returns {string}
 */
qry.format = function(query, s) {
    var formatter = new SqlFormatter();
    return formatter.format(query, s);
};
/**
 * Formats the given SQL expression string and replaces parameters with the given parameters, if any.
 * e.g. * SELECT * FROM User where username=? with values: ['user1'] etc.
 * @param {string} query
 * @param {*=} values
 * @returns {string}
 */
qry.prepare = function(query, values) {
    if (typeof values === 'undefined' || values===null)
        return query;
    return sqlutils.format(query,values);
};
/**
 * Creates an entity reference that is going to be used in query expressions.
 * @param {string} entity The entity name
 * @param {Array=} fields An array that represents the entity's field collection to be used.
 * @returns {QueryEntity|*}
 */
qry.createEntity = function(entity, fields) {
    var obj = new QueryEntity(entity);
    obj[entity] = fields || [];
    return obj;
};
/**
 * Creates an entity reference that is going to be used in query expressions.
 * @param {string} entity - The entity name
 * @param {Array=} fields - An array that represents the entity's field collection to be used.
 * @returns {QueryEntity|*}
 */
qry.entity = function(entity, fields) {
    var obj = new QueryEntity(entity);
    obj[entity] = fields || [];
    return obj;
};
/**
 * Creates a field reference that is going to be used in query expressions (like join statements etc).
 * @param {string} entity - The entity name
 * @param {string} name - The field name
 */
qry.createField = function(entity, name) {
    var f = {};
    f[entity] = [name];
    return f;
};
/**
 * Creates an field reference that is going to be used in query expressions (like join statements etc).
 * @param value {*} The field name
 */
qry.createValue = function(value) {
    return { $value:value };
};

qry.fields = {
    /**
     * @param {string} name
     * @returns {QueryField}
     */
    select: function(name) {
        return new QueryField(name);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    count:function(name) {
        var f = new QueryField();
        return f.count(name);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    min:function(name) {
        var f = new QueryField();
        return f.min(name);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    floor:function(name) {
        var f = { };
        f[name] = { $floor:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    ceil:function(name) {
        var f = { };
        f[name] = { $ceiling:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param {string} name
     * @param {number|*} divider
     * @returns {QueryField}
     */
    modulo:function(name, divider) {
        var f = { };
        f[name] = { $mod:[ qry.fields.select(name), divider ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param {string} name
     * @param {number|*} x
     * @returns {QueryField}
     */
    add:function(name, x) {
        var f = { };
        f[name] = { $add:[ qry.fields.select(name), x ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param {string} name
     * @param {number|*} x
     * @returns {QueryField}
     */
    subtract:function(name, x) {
        var f = { };
        f[name] = { $subtract:[ qry.fields.select(name), x ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param {string} name
     * @param {number|*} divider
     * @returns {QueryField}
     */
    divide:function(name, divider) {
        var f = { };
        f[name] = { $divide:[ qry.fields.select(name), divider ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param {string} name
     * @param {number|*} multiplier
     * @returns {QueryField}
     */
    multiply:function(name, multiplier) {
        var f = { };
        f[name] = { $multiply:[ qry.fields.select(name), multiplier ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param {string} name
     * @param {number=} n
     * @returns {QueryField}
     */
    round:function(name, n) {
        var f = { };
        f[name] = { $round:[ qry.fields.select(name), 2 ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    month:function(name) {
        var f = { };
        f[name] = { $month:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    length:function(name) {
        var f = { };
        f[name] = { $length:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    trim:function(name) {
        var f = { };
        f[name] = { $trim:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    year:function(name) {
        var f = { };
        f[name] = { $year:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    day:function(name) {
        var f = { };
        f[name] = { $day:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    date:function(name) {
        var f = { };
        f[name] = { $date:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    hour:function(name) {
        var f = { };
        f[name] = { $hour:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    minute:function(name) {
        var f = { };
        f[name] = { $minute:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    second:function(name) {
        var f = { };
        f[name] = { $second:[ qry.fields.select(name) ] };
        return _.assign(new QueryField(), f);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    max:function(name) {
        var f = new QueryField();
        return f.max(name);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    average:function(name) {
        var f = new QueryField();
        return f.average(name);
    },
    /**
     * @param name {string}
     * @returns {QueryField}
     */
    sum:function(name) {
        var f = new QueryField();
        return f.sum(name);
    }
};

qry.openData = {
    /**
     * @param {String} str The open data filter expression
     * @param {function} callback The callback function
     * @returns {QueryExpression} The equivalent query expression
     */
    parse:function(str, callback) {
        return odata.parse(str, callback);
    },
    /**
     * Creates a new instance of OData parser
     * @returns {OpenDataParser}
     */
    createParser: function() {
        return odata.createParser();
    }
};

qry.closures = closures;


if (typeof exports !== 'undefined')
{
    module.exports = qry;
}
