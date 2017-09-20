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
exports.DataQueryable = exports.DataAttributeResolver = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _lodash = require('lodash');

var _ = _lodash._;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _rxjs = require('rxjs');

var Rx = _interopRequireDefault(_rxjs).default;

var _types = require('./types');

var DataAssociationMapping = _types.DataAssociationMapping;

var _errors = require('@themost/common/errors');

var DataError = _errors.DataError;

var _query = require('@themost/query/query');

var QueryExpression = _query.QueryExpression;
var QueryField = _query.QueryField;
var QueryFieldUtils = _query.QueryFieldUtils;
var QueryEntity = _query.QueryEntity;

var _utils = require('@themost/common/utils');

var TextUtils = _utils.TextUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @constructor
 * @ignore
 */
var DataAttributeResolver = exports.DataAttributeResolver = function () {
    function DataAttributeResolver() {
        _classCallCheck(this, DataAttributeResolver);
    }

    _createClass(DataAttributeResolver, [{
        key: 'orderByNestedAttribute',
        value: function orderByNestedAttribute(attr) {
            var nestedAttribute = DataAttributeResolver.prototype.testNestedAttribute(attr);
            if (nestedAttribute) {
                var matches = /^(\w+)\((\w+)\/(\w+)\)$/i.exec(nestedAttribute.name);
                if (matches) {
                    return DataAttributeResolver.prototype.selectAggregatedAttribute.call(this, matches[1], matches[2] + "/" + matches[3]);
                }
                matches = /^(\w+)\((\w+)\/(\w+)\/(\w+)\)$/i.exec(nestedAttribute.name);
                if (matches) {
                    return DataAttributeResolver.prototype.selectAggregatedAttribute.call(this, matches[1], matches[2] + "/" + matches[3] + "/" + matches[4]);
                }
            }
            return DataAttributeResolver.prototype.resolveNestedAttribute.call(this, attr);
        }
    }, {
        key: 'selecteNestedAttribute',
        value: function selecteNestedAttribute(attr, alias) {
            var expr = DataAttributeResolver.prototype.resolveNestedAttribute.call(this, attr);
            if (expr) {
                if (_.isNil(alias)) expr.as(attr.replace(/\//g, '_'));else expr.as(alias);
            }
            return expr;
        }
        /**
         * @param {string} aggregation
         * @param {string} attribute
         * @param {string=} alias
         * @returns {*}
         */

    }, {
        key: 'selectAggregatedAttribute',
        value: function selectAggregatedAttribute(aggregation, attribute, alias) {
            var self = this;
            var result = void 0;
            if (DataAttributeResolver.prototype.testNestedAttribute(attribute)) {
                result = DataAttributeResolver.prototype.selecteNestedAttribute.call(self, attribute, alias);
            } else {
                result = self.resolveField(attribute);
            }
            var sAlias = result.as();
            var name = result.name();
            var expr = void 0;
            if (sAlias) {
                expr = result[sAlias];
                result[sAlias] = {};
                result[sAlias]['$' + aggregation] = expr;
            } else {
                expr = result.$name;
                result[name] = {};
                result[name]['$' + aggregation] = expr;
            }
            return result;
        }
    }, {
        key: 'resolveNestedAttribute',
        value: function resolveNestedAttribute(attr) {
            var self = this;
            if (typeof attr === 'string' && /\//.test(attr)) {
                var member = attr.split('/');
                var expr = void 0;
                var arr = void 0;
                var obj = void 0;
                var select = void 0;
                //change: 18-Feb 2016
                //description: Support many to many (junction) resolving
                var mapping = self.model.inferMapping(member[0]);
                if (mapping && mapping.associationType === 'junction') {
                    var expr1 = DataAttributeResolver.prototype.resolveJunctionAttributeJoin.call(self.model, attr);
                    //select field
                    select = expr1.$select;
                    //get expand
                    expr = expr1.$expand;
                } else {
                    expr = DataAttributeResolver.prototype.resolveNestedAttributeJoin.call(self.model, attr);
                    //select field
                    if (member.length > 2) select = QueryField.create(member[2]).from(member[1]);else select = QueryField.create(member[1]).from(member[0]);
                }
                if (expr) {
                    if (typeof this.query.$expand === 'undefined' || null) {
                        this.query.$expand = expr;
                    } else {
                        arr = [];
                        if (!_.isArray(self.query.$expand)) {
                            arr.push(self.query.$expand);
                            this.query.$expand = arr;
                        }
                        arr = [];
                        if (_.isArray(expr)) arr.push.apply(arr, expr);else arr.push(expr);
                        arr.forEach(function (y) {
                            obj = self.query.$expand.find(function (x) {
                                if (x.$entity && x.$entity.$as) {
                                    return x.$entity.$as === y.$entity.$as;
                                }
                                return false;
                            });
                            if (typeof obj === 'undefined') self.query.$expand.push(y);
                        });
                    }
                    return select;
                } else {
                    throw new Error('Member join expression cannot be empty at this context');
                }
            }
        }

        /**
         *
         * @param {string} memberExpr - A string that represents a member expression e.g. user/id or article/published etc.
         * @returns {*} - An object that represents a query join expression
         */

    }, {
        key: 'resolveNestedAttributeJoin',
        value: function resolveNestedAttributeJoin(memberExpr) {
            var self = this;
            var res = void 0,
                expr = void 0,
                entity = void 0;
            if (/\//.test(memberExpr)) {
                //if the specified member contains '/' e.g. user/name then prepare join
                var arrMember = memberExpr.split('/');
                var attrMember = self.field(arrMember[0]);
                if (_.isNil(attrMember)) {
                    throw new Error('The target model does not have an attribute named as ' + arrMember[0]);
                }
                //search for field mapping
                var mapping = self.inferMapping(arrMember[0]);
                if (_.isNil(mapping)) {
                    throw new Error('The target model does not have an association defined for attribute named ' + arrMember[0]);
                }
                if (mapping.childModel === self.name && mapping.associationType === 'association') {
                    //get parent model
                    var parentModel = self.context.model(mapping.parentModel);
                    if (_.isNil(parentModel)) {
                        throw new Error('Association parent model (' + mapping.parentModel + ') cannot be found.');
                    }
                    /**
                     * store temp query expression
                     * @type QueryExpression
                     */
                    res = QueryExpression.create(self.viewAdapter).select('*');
                    expr = QueryExpression.create().where(QueryField.create(mapping.childField).from(self._alias || self.viewAdapter)).equal(QueryField.create(mapping.parentField).from(mapping.childField));
                    entity = QueryEntity.create(parentModel.viewAdapter).as(mapping.childField).left();
                    res.join(entity).with(expr);
                    if (arrMember.length > 2) {
                        parentModel._alias = mapping.childField;
                        expr = DataAttributeResolver.prototype.resolveNestedAttributeJoin.call(parentModel, arrMember[1] + '/' + arrMember[2]);
                        var arr = [];
                        arr.push(res.$expand);
                        arr.push(expr);
                        return arr;
                    }
                    return res.$expand;
                } else if (mapping.parentModel === self.name && mapping.associationType === 'association') {
                    var childModel = self.context.model(mapping.childModel);
                    if (_.isNil(childModel)) {
                        throw new Error('Association child model (' + mapping.childModel + ') cannot be found.');
                    }
                    res = QueryExpression.create('Unknown').select('*');
                    expr = QueryExpression.create().where(QueryField.create(mapping.parentField).from(self.viewAdapter)).equal(QueryField.create(mapping.childField).from(arrMember[0]));
                    entity = QueryEntity.create(childModel.viewAdapter).as(arrMember[0]).left();
                    res.join(entity).with(expr);
                    return res.$expand;
                } else {
                    throw new Error('The association type between ' + mapping.parentModel + ' and ' + mapping.childModel + ' model is not supported for filtering, grouping or sorting data.');
                }
            }
        }

        /**
         * @param {string} s
         * @returns {*}
         */

    }, {
        key: 'testAttribute',
        value: function testAttribute(s) {
            if (typeof s !== 'string') return;
            /**
             * @private
             */
            var matches = void 0;
            /**
             * attribute aggregate function with alias e.g. f(x) as a
             * @ignore
             */
            matches = /^(\w+)\((\w+)\)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '(' + matches[2] + ')', property: matches[3] };
            }
            /**
             * attribute aggregate function with alias e.g. x as a
             * @ignore
             */
            matches = /^(\w+)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { name: matches[1], property: matches[2] };
            }
            /**
             * attribute aggregate function with alias e.g. f(x)
             * @ignore
             */
            matches = /^(\w+)\((\w+)\)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '(' + matches[2] + ')' };
            }
            // only attribute e.g. x
            if (/^(\w+)$/.test(s)) {
                return { name: s };
            }
        }

        /**
         * @param {string} s
         * @returns {*}
         */

    }, {
        key: 'testAggregatedNestedAttribute',
        value: function testAggregatedNestedAttribute(s) {
            if (typeof s !== 'string') return;
            /**
             * @private
             */
            var matches = void 0;
            /**
             * nested attribute aggregate function with alias e.g. f(x/b) as a
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { aggr: matches[1], name: matches[2] + '/' + matches[3], property: matches[4] };
            }
            /**
             * nested attribute aggregate function with alias e.g. f(x/b/c) as a
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\/(\w+)\)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { aggr: matches[1], name: matches[2] + '/' + matches[3] + '/' + matches[4], property: matches[5] };
            }
            /**
             * nested attribute aggregate function with alias e.g. f(x/b)
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\)$/i.exec(s);
            if (matches) {
                return { aggr: matches[1], name: matches[2] + '/' + matches[3] };
            }
            /**
             * nested attribute aggregate function with alias e.g. f(x/b/c)
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\/(\w+)\)$/i.exec(s);
            if (matches) {
                return { aggr: matches[1], name: matches[2] + '/' + matches[3] + '/' + matches[4] };
            }
        }

        /**
         * @param {string} s
         * @returns {*}
         */

    }, {
        key: 'testNestedAttribute',
        value: function testNestedAttribute(s) {
            if (typeof s !== 'string') return;
            /**
             * @private
             */
            var matches = void 0;
            /**
             * nested attribute aggregate function with alias e.g. f(x/b) as a
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '(' + matches[2] + '/' + matches[3] + ')', property: matches[4] };
            }
            /**
             * nested attribute aggregate function with alias e.g. f(x/b/c) as a
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\/(\w+)\)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '(' + matches[2] + '/' + matches[3] + '/' + matches[4] + ')', property: matches[5] };
            }
            /**
             * nested attribute with alias e.g. x/b as a
             * @ignore
             */
            matches = /^(\w+)\/(\w+)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '/' + matches[2], property: matches[3] };
            }
            /**
             * nested attribute with alias e.g. x/b/c as a
             * @ignore
             */
            matches = /^(\w+)\/(\w+)\/(\w+)\sas\s(\w+)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '/' + matches[2] + '/' + matches[3], property: matches[4] };
            }
            /**
             * nested attribute aggregate function with alias e.g. f(x/b)
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '(' + matches[2] + '/' + matches[3] + ')' };
            }
            /**
             * nested attribute aggregate function with alias e.g. f(x/b/c)
             * @ignore
             */
            matches = /^(\w+)\((\w+)\/(\w+)\/(\w+)\)$/i.exec(s);
            if (matches) {
                return { name: matches[1] + '(' + matches[2] + '/' + matches[3] + '/' + matches[4] + ')' };
            }
            /**
             * nested attribute with alias e.g. x/b
             * @ignore
             */
            matches = /^(\w+)\/(\w+)$/.exec(s);
            if (matches) {
                return { name: s };
            }

            /**
             * nested attribute with alias e.g. x/b/c
             * @ignore
             */
            matches = /^(\w+)\/(\w+)\/(\w+)$/.exec(s);
            if (matches) {
                return { name: s };
            }
        }

        /**
         * @param {string} attr
         * @returns {*}
         */

    }, {
        key: 'resolveJunctionAttributeJoin',
        value: function resolveJunctionAttributeJoin(attr) {
            var self = this,
                member = attr.split("/");
            //get the data association mapping
            var mapping = self.inferMapping(member[0]);
            //if mapping defines a junction between two models
            if (mapping && mapping.associationType === "junction") {
                //get field
                var field = self.field(member[0]);

                var entity = void 0;
                var expr = void 0;
                var q = void 0;
                //first approach (default association adapter)
                //the underlying model is the parent model e.g. Group > Group Members
                if (mapping.parentModel === self.name) {

                    var parentField = "parentId",
                        valueField = "valueId";
                    if (typeof mapping.childModel === 'undefined') {
                        parentField = "object";valueField = "value";
                    }
                    q = QueryExpression.create(self.viewAdapter).select('*');
                    //init an entity based on association adapter (e.g. GroupMembers as members)
                    entity = QueryEntity.create(mapping.associationAdapter).as(field.name);
                    //init join expression between association adapter and current data model
                    //e.g. Group.id = GroupMembers.parentId
                    expr = QueryExpression.create().where(QueryField.create(mapping.parentField).from(self.viewAdapter)).equal(QueryField.create(parentField).from(field.name));
                    //append join
                    q.join(entity).with(expr);
                    //data object tagging
                    if (typeof mapping.childModel === 'undefined') {
                        return {
                            $expand: [q.$expand],
                            $select: QueryField.create(valueField).from(field.name)
                        };
                    }

                    //return the resolved attribute for futher processing e.g. members.id
                    if (member[1] === mapping.childField) {
                        return {
                            $expand: [q.$expand],
                            $select: QueryField.create(valueField).from(field.name)
                        };
                    } else {
                        //get child model
                        var childModel = self.context.model(mapping.childModel);
                        if (_.isNil(childModel)) {
                            throw new DataError("EJUNC", "The associated model cannot be found.");
                        }
                        //create new join
                        var alias = field.name + "_" + childModel.name;
                        entity = QueryEntity.create(childModel.viewAdapter).as(alias);
                        expr = QueryExpression.create().where(QueryField.create("valueId").from(field.name)).equal(QueryField.create(mapping.childField).from(alias));
                        //append join
                        q.join(entity).with(expr);
                        return {
                            $expand: q.$expand,
                            $select: QueryField.create(member[1]).from(alias)
                        };
                    }
                } else {
                    q = QueryExpression.create(self.viewAdapter).select('*');
                    //the underlying model is the child model
                    //init an entity based on association adapter (e.g. GroupMembers as groups)
                    entity = QueryEntity.create(mapping.associationAdapter).as(field.name);
                    //init join expression between association adapter and current data model
                    //e.g. Group.id = GroupMembers.parentId
                    expr = QueryExpression.create().where(QueryField.create(mapping.childField).from(self.viewAdapter)).equal(QueryField.create("valueId").from(field.name));
                    //append join
                    q.join(entity).with(expr);
                    //return the resolved attribute for futher proccesing e.g. members.id
                    if (member[1] === mapping.parentField) {
                        return {
                            $expand: [q.$expand],
                            $select: QueryField.create("parentId").from(field.name)
                        };
                    } else {
                        //get parent model
                        var parentModel = self.context.model(mapping.parentModel);
                        if (_.isNil(parentModel)) {
                            throw new DataError("EJUNC", "The associated model cannot be found.");
                        }
                        //create new join
                        var parentAlias = field.name + "_" + parentModel.name;
                        entity = QueryEntity.create(parentModel.viewAdapter).as(parentAlias);
                        expr = QueryExpression.create().where(QueryField.create("parentId").from(field.name)).equal(QueryField.create(mapping.parentField).from(parentAlias));
                        //append join
                        q.join(entity).with(expr);
                        return {
                            $expand: q.$expand,
                            $select: QueryField.create(member[1]).from(parentAlias)
                        };
                    }
                }
            } else {
                throw new DataError("EJUNC", "The target model does not have a many to many association defined by the given attribute.", "", self.name, attr);
            }
        }
    }]);

    return DataAttributeResolver;
}();

var modelProperty = Symbol('model');
var queryProperty = Symbol('query');
var expandProperty = Symbol('expand');
var flattenProperty = Symbol('flatten');
var silentProperty = Symbol('silent');
var viewProperty = Symbol('view');

/**
 * @classdesc Represents a dynamic query helper for filtering, paging, grouping and sorting data associated with an instance of DataModel class.
 * @class
 * @property {QueryExpression|*} query - Gets the query expression
 * @property {DataModel|*} model - Gets the data model associated with this queryable
 * @augments DataContextEmitter
 */

var DataQueryable = exports.DataQueryable = function () {
    /**
     * @constructor
     * @param {DataModel} model
     */
    function DataQueryable(model) {
        _classCallCheck(this, DataQueryable);

        this[modelProperty] = model;
        //get silent property
        if (model) this.silent(model.$silent);
    }

    /**
     *
     * @returns {QueryExpression}
     */


    _createClass(DataQueryable, [{
        key: 'clone',


        /**
         * Clones the current DataQueryable instance.
         * @returns {DataQuerable|*} - The cloned object.
         */
        value: function clone() {
            var result = new DataQueryable(this.model);
            //set view if any
            result.$view = this.$view;
            //set silent property
            result.$silent = this.$silent;
            //set silent property
            result.$levels = this.$levels;
            //set flatten property
            result.$flatten = this.$flatten;
            //set expand property
            result.$expand = this.$expand;
            //set query
            _.assign(result.query, this.query);
            return result;
        }

        /**
         * Ensures data queryable context and returns the current data context. This function may be overriden.
         * @returns {DataContext}
         * @ignore
         */

    }, {
        key: 'ensureContext',
        value: function ensureContext() {
            if (this.model != null) if (this.model.context != null) return this.model.context;
            return null;
        }

        /**
         * Serializes the underlying query and clears current filter expression for further filter processing. This operation may be used in complex filtering.
         * @param {Boolean=} useOr - Indicates whether an or statement will be used in the resulted statement.
         * @returns {DataQueryable}
         * @example
         //retrieve a list of order
         context.model('Order')
         .where('orderStatus').equal(1).and('paymentMethod').equal(2)
         .prepare().where('orderStatus').equal(2).and('paymentMethod').equal(2)
         .prepare(true)
         //(((OrderData.orderStatus=1) AND (OrderData.paymentMethod=2)) OR ((OrderData.orderStatus=2) AND (OrderData.paymentMethod=2)))
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'prepare',
        value: function prepare(useOr) {
            this.query.prepare(useOr);
            return this;
        }

        /**
         * Initializes a where expression
         * @param attr {string} - A string which represents the field name that is going to be used as the left operand of this expression
         * @returns {DataQueryable}
         * @example
         context.model('Person')
         .where('user/name').equal('user1@exampl.com')
         .select('description')
         .first().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'where',
        value: function where(attr) {
            if (typeof attr === 'string' && /\//.test(attr)) {
                this.query.where(DataAttributeResolver.prototype.resolveNestedAttribute.call(this, attr));
                return this;
            }
            this.query.where(this.resolveField(attr));
            return this;
        }

        /**
         * Initializes a full-text search expression
         * @param {string} text - A string which represents the text we want to search for
         * @returns {DataQueryable}
         * @example
         context.model('Person')
         .search('Peter')
         .select('description')
         .take(25).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'search',
        value: function search(text) {
            var self = this;
            var options = { multiword: true };
            var terms = [];
            if (typeof text !== 'string') {
                return self;
            }
            var re = /("(.*?)")|(\w+)/g;
            var match = void 0;
            while (match = re.exec(text)) {
                if (match[2]) {
                    terms.push(match[2]);
                } else {
                    terms.push(match[0]);
                }
            }
            if (terms.length === 0) {
                return self;
            }
            self.prepare();
            var stringTypes = ["Text", "URL", "Note"];
            self.model.attributes.forEach(function (x) {
                if (x.many) {
                    return;
                }
                var mapping = self.model.inferMapping(x.name);
                if (mapping) {
                    if (mapping.associationType === 'association' && mapping.childModel === self.model.name) {
                        var parentModel = self.model.context.model(mapping.parentModel);
                        if (parentModel) {
                            parentModel.attributes.forEach(function (z) {
                                if (stringTypes.indexOf(z.type) >= 0) {
                                    terms.forEach(function (w) {
                                        if (!/^\s+$/.test(w)) self.or(x.name + '/' + z.name).contains(w);
                                    });
                                }
                            });
                        }
                    }
                }
                if (stringTypes.indexOf(x.type) >= 0) {
                    terms.forEach(function (y) {
                        if (!/^\s+$/.test(y)) self.or(x.name).contains(y);
                    });
                }
            });
            self.prepare();
            return self;
        }
    }, {
        key: 'join',
        value: function join(model) {
            var self = this;
            if (_.isNil(model)) return this;
            /**
             * @type {DataModel}
             */
            var joinModel = self.model.context.model(model);
            //validate joined model
            if (_.isNil(joinModel)) throw new Error(sprintf.sprintf("The %s model cannot be found", model));
            var arr = self.model.attributes.filter(function (x) {
                return x.type == joinModel.name;
            });
            if (arr.length == 0) throw new Error(sprintf.sprintf("An internal error occured. The association between %s and %s cannot be found", this.model.name, model));
            var mapping = self.model.inferMapping(arr[0].name);
            var expr = QueryExpression.create();
            expr.where(self.resolveField(mapping.childField)).equal(joinModel.resolveField(mapping.parentField));
            /**
             * @type DataAssociationMapping
             */
            var entity = QueryEntity.create(joinModel.viewAdapter).left();
            //set join entity (without alias and join type)
            self.select().query.join(entity).with(expr);
            return self;
        }

        /**
         * Prepares a logical AND expression
         * @param attr {string} - The name of field that is going to be used in this expression
         * @returns {DataQueryable}
         * @example
         context.model('Order').where('customer').equal(298)
         .and('orderStatus').equal(1)
         .list().then(function(result) {
                //SQL: WHERE ((OrderData.customer=298) AND (OrderData.orderStatus=1)
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'and',
        value: function and(attr) {
            if (typeof attr === 'string' && /\//.test(attr)) {
                this.query.and(DataAttributeResolver.prototype.resolveNestedAttribute.call(this, attr));
                return this;
            }
            this.query.and(this.resolveField(attr));
            return this;
        }

        /**
         * Prepares a logical OR expression
         * @param attr {string} - The name of field that is going to be used in this expression
         * @returns {DataQueryable}
         * @example
         //((OrderData.orderStatus=1) OR (OrderData.orderStatus=2)
         context.model('Order').where('orderStatus').equal(1)
         .or('orderStatus').equal(2)
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'or',
        value: function or(attr) {
            if (typeof attr === 'string' && /\//.test(attr)) {
                this.query.or(DataAttributeResolver.prototype.resolveNestedAttribute.call(this, attr));
                return this;
            }
            this.query.or(this.resolveField(attr));
            return this;
        }

        /**
         * Performs an equality comparison.
         * @param obj {*} - The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders with order status equal to 1
         context.model('Order').where('orderStatus').equal(1)
         .list().then(function(result) {
                //WHERE (OrderData.orderStatus=1)
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'equal',
        value: function equal(obj) {
            if (_.isArray(obj)) {
                this.query.in(obj);
                return this;
            }
            this.query.equal(obj);
            return this;
        }

        /**
         * Performs an equality comparison.
         * @param obj {*} - The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve a person with id equal to 299
         context.model('Person').where('id').is(299)
         .first().then(function(result) {
                //WHERE (PersonData.id=299)
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'is',
        value: function is(obj) {
            return this.equal(obj);
        }

        /**
         * Prepares a not equal comparison.
         * @param obj {*} - The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders with order status different than 1
         context.model('Order')
         .where('orderStatus').notEqual(1)
         .orderByDescending('orderDate')
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'notEqual',
        value: function notEqual(obj) {
            if (_.isArray(obj)) {
                this.query;
            }
            this.query.notEqual(obj);
            return this;
        }

        /**
         * Prepares a greater than comparison.
         * @param obj {*} - The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders where product price is greater than 800
         context.model('Order')
         .where('orderedItem/price').greaterThan(800)
         .orderByDescending('orderDate')
         .select('id','orderedItem/name as productName', 'orderedItem/price as productPrice', 'orderDate')
         .take(5)
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Results:
         id   productName                                   productPrice  orderDate
         ---  --------------------------------------------  ------------  -----------------------------
         304  Apple iMac (27-Inch, 2013 Version)            1336.27       2015-11-27 23:49:17.000+02:00
         322  Dell B1163w Mono Laser Multifunction Printer  842.86        2015-11-27 20:16:52.000+02:00
         167  Razer Blade (2013)                            1553.43       2015-11-27 04:17:08.000+02:00
         336  Apple iMac (27-Inch, 2013 Version)            1336.27       2015-11-26 07:25:35.000+02:00
         89   Nvidia GeForce GTX 650 Ti Boost               1625.49       2015-11-21 17:29:21.000+02:00
         */

    }, {
        key: 'greaterThan',
        value: function greaterThan(obj) {
            this.query.greaterThan(obj);
            return this;
        }

        /**
         * Prepares a greater than or equal comparison.
         * @param obj {*} The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders where product price is greater than or equal to 800
         context.model('Order')
         .where('orderedItem/price').greaterOrEqual(800)
         .orderByDescending('orderDate')
         .take(5)
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'greaterOrEqual',
        value: function greaterOrEqual(obj) {
            this.query.greaterOrEqual(obj);
            return this;
        }

        /**
         * Prepares a bitwise and comparison.
         * @param {*} value - The right operand of the express
         * @param {Number=} result - The result of a bitwise and expression
         * @returns {DataQueryable}
         * @example
         //retrieve a list of permissions for model Person and insert permission mask (2)
         context.model('Permission')
         //prepare bitwise AND (((PermissionData.mask & 2)=2)
         .where('mask').bit(2)
         .and('privilege').equal('Person')
         .and('parentPrivilege').equal(null)
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         *
         */

    }, {
        key: 'bit',
        value: function bit(value, result) {
            if (_.isNil(result)) this.query.bit(value, value);else this.query.bit(value, result);
            return this;
        }

        /**
         * Prepares a lower than comparison
         * @param obj {*}
         * @returns {DataQueryable}
         */

    }, {
        key: 'lowerThan',
        value: function lowerThan(obj) {
            this.query.lowerThan(obj);
            return this;
        }

        /**
         * Prepares a lower than or equal comparison.
         * @param obj {*} - The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve orders based on payment due date
         context.model('Order')
         .orderBy('paymentDue')
         .where('paymentDue').lowerOrEqual(moment().subtract('days',-7).toDate())
         .and('paymentDue').greaterThan(new Date())
         .take(10).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'lowerOrEqual',
        value: function lowerOrEqual(obj) {
            this.query.lowerOrEqual(obj);
            return this;
        }

        /**
         * Prepares an ends with comparison
         * @param obj {*} - The string to be searched for at the end of a field.
         * @returns {DataQueryable}
         * @example
         //retrieve people whose given name starts with 'D'
         context.model('Person')
         .where('givenName').startsWith('D')
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Results:
         id   givenName  familyName
         ---  ---------  ----------
         257  Daisy      Lambert
         275  Dustin     Brooks
         333  Dakota     Gallagher
         */

    }, {
        key: 'startsWith',
        value: function startsWith(obj) {
            this.query.startsWith(obj);
            return this;
        }

        /**
         * Prepares an ends with comparison
         * @param obj {*} - The string to be searched for at the end of a field.
         * @returns {DataQueryable}
         * @example
         //retrieve people whose given name ends with 'y'
         context.model('Person')
         .where('givenName').endsWith('y')
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Results
         id   givenName  familyName
         ---  ---------  ----------
         257  Daisy      Lambert
         287  Zachary    Field
         295  Anthony    Berry
         339  Brittney   Hunt
         341  Kimberly   Wheeler
         */

    }, {
        key: 'endsWith',
        value: function endsWith(obj) {
            this.query.endsWith(obj);
            return this;
        }

        /**
         * Prepares a typical IN comparison.
         * @param objs {Array} - An array of values which represents the values to be used in expression
         * @returns {DataQueryable}
         * @example
         //retrieve orders with order status 1 or 2
         context.model('Order').where('orderStatus').in([1,2])
         .list().then(function(result) {
                //WHERE (OrderData.orderStatus IN (1, 2))
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'in',
        value: function _in(objs) {
            this.query.in(objs);
            return this;
        }

        /**
         * Prepares a typical NOT IN comparison.
         * @param objs {Array} - An array of values which represents the values to be used in expression
         * @returns {DataQueryable}
         * @example
         //retrieve orders with order status 1 or 2
         context.model('Order').where('orderStatus').notIn([1,2])
         .list().then(function(result) {
                //WHERE (NOT OrderData.orderStatus IN (1, 2))
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'notIn',
        value: function notIn(objs) {
            this.query.notIn(objs);
            return this;
        }

        /**
         * Prepares a modular arithmetic operation
         * @param {*} obj The value to be compared
         * @param {Number} result The result of modular expression
         * @returns {DataQueryable}
         */

    }, {
        key: 'mod',
        value: function mod(obj, result) {
            this.query.mod(obj, result);
            return this;
        }

        /**
         * Prepares a contains comparison (e.g. a string contains another string).
         * @param value {*} - The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve person where the given name contains
         context.model('Person').select(['id','givenName','familyName'])
         .where('givenName').contains('ex')
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //The result set of this example may be:
         id   givenName  familyName
         ---  ---------  ----------
         297  Alex       Miles
         353  Alexis     Rees
         */

    }, {
        key: 'contains',
        value: function contains(value) {
            this.query.contains(value);
            return this;
        }

        /**
         * Prepares a not contains comparison (e.g. a string contains another string).
         * @param value {*} - The right operand of the expression
         * @returns {DataQueryable}
         * @example
         //retrieve persons where the given name not contains 'ar'
         context.model('Person').select(['id','givenName','familyName'])
         .where('givenName').notContains('ar')
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //The result set of this example may be:
         id   givenName  familyName
         ---  ---------  ----------
         257  Daisy      Lambert
         259  Peter      French
         261  Kylie      Jordan
         263  Maxwell    Hall
         265  Christian  Marshall
         */

    }, {
        key: 'notContains',
        value: function notContains(value) {
            this.query.notContains(value);
            return this;
        }

        /**
         * Prepares a comparison where the left operand is between two values
         * @param {*} value1 - The minimum value
         * @param {*} value2 - The maximum value
         * @returns {DataQueryable}
         * @example
         //retrieve products where price is between 150 and 250
         context.model('Product')
         .where('price').between(150,250)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //The result set of this example may be:
         id   name                                        model   price
         ---  ------------------------------------------  ------  ------
         367  Asus Transformer Book T100                  HD2895  224.52
         380  Zotac Zbox Nano XS AD13 Plus                WC5547  228.05
         384  Apple iPad Air                              ZE6015  177.44
         401  Intel Core i7-4960X Extreme Edition         SM5853  194.61
         440  Bose SoundLink Bluetooth Mobile Speaker II  HS5288  155.27
         */

    }, {
        key: 'between',
        value: function between(value1, value2) {
            this.query.between(value1, value2);
            return this;
        }

        /**
         * Selects a field or a collection of fields of the current model.
         * @param {...string} attr  An array of fields, a field or a view name
         * @returns {DataQueryable}
         * @example
         //retrieve the last 5 orders
         context.model('Order').select('id','customer','orderDate','orderedItem')
         .orderBy('orderDate')
         .take(5).list().then(function(result) {
                console.table(result.records);
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         * @example
         //retrieve the last 5 orders by getting the associated customer name and product name
         context.model('Order').select('id','customer/description as customerName','orderDate','orderedItem/name as productName')
         .orderBy('orderDate')
         .take(5).list().then(function(result) {
                console.table(result.records);
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //The result set of this example may be:
         id   customerName         orderDate                      orderedItemName
         ---  -------------------  -----------------------------  ----------------------------------------------------
         46   Nicole Armstrong     2014-12-31 13:35:41.000+02:00  LaCie Blade Runner
         288  Cheyenne Hudson      2015-01-01 13:24:21.000+02:00  Canon Pixma MG5420 Wireless Photo All-in-One Printer
         139  Christian Whitehead  2015-01-01 23:21:24.000+02:00  Olympus OM-D E-M1
         3    Katelyn Kelly        2015-01-02 04:42:58.000+02:00  Kobo Aura
         59   Cheyenne Hudson      2015-01-02 10:47:53.000+02:00  Google Nexus 7 (2013)
          @example
         //retrieve the best customers by getting the associated customer name and a count of orders made by the customer
         context.model('Order').select('customer/description as customerName','count(id) as orderCount')
         .orderBy('count(id)')
         .groupBy('customer/description')
         .take(3).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //The result set of this example may be:
         customerName      orderCount
         ----------------  ----------
         Miranda Bird      19
         Alex Miles        16
         Isaiah Morton     16
         */

    }, {
        key: 'select',
        value: function select(attr) {
            var self = this;
            var arr = void 0;
            var expr = void 0;
            var arg = arguments.length > 1 ? Array.prototype.slice.call(arguments) : attr;

            if (typeof arg === 'string') {
                if (arg === "*") {
                    //delete select
                    delete self.query.$select;
                    return this;
                }
                //validate field or model view
                var field = self.model.field(arg);
                if (field) {
                    //validate field
                    if (field.many || field.mapping && field.mapping.associationType === 'junction') {
                        self.expand(field.name);
                    } else {
                        arr = [];
                        arr.push(self.resolveField(field.name));
                    }
                } else {
                    //get data view
                    self.$view = self.model.getDataView(arg);
                    //if data view was found
                    if (self.$view) {
                        arr = [];
                        var name = void 0;
                        self.$view.fields.forEach(function (x) {
                            name = x.name;
                            field = self.model.field(name);
                            //if a field with the given name exists in target model
                            if (field) {
                                //check if this field has an association mapping
                                if (field.many || field.mapping && field.mapping.associationType === 'junction') self.expand(field.name);else arr.push(self.resolveField(field.name));
                            } else {
                                var b = DataAttributeResolver.prototype.testAggregatedNestedAttribute.call(self, name);
                                if (b) {
                                    expr = DataAttributeResolver.prototype.selectAggregatedAttribute.call(self, b.aggr, b.name);
                                    if (expr) {
                                        arr.push(expr);
                                    }
                                } else {
                                    b = DataAttributeResolver.prototype.testNestedAttribute.call(self, name);
                                    if (b) {
                                        expr = DataAttributeResolver.prototype.selecteNestedAttribute.call(self, b.name, x.property);
                                        if (expr) {
                                            arr.push(expr);
                                        }
                                    } else {
                                        b = DataAttributeResolver.prototype.testAttribute.call(self, name);
                                        if (b) {
                                            arr.push(self.resolveField(b.name, x.property));
                                        } else if (/\./g.test(name)) {
                                            name = name.split('.')[0];
                                            arr.push(self.resolveField(name));
                                        } else {
                                            arr.push(self.resolveField(name));
                                        }
                                    }
                                }
                            }
                        });
                    }
                    //select a field from a joined entity
                    else {
                            expr = select_.call(self, arg);
                            if (expr) {
                                arr = arr || [];
                                arr.push(expr);
                            }
                        }
                }
                if (_.isArray(arr)) {
                    if (arr.length === 0) arr = null;
                }
            } else {
                //get array of attributes
                if (_.isArray(arg)) {
                    arr = [];
                    //check if field is a model dataview
                    if (arg.length === 1 && typeof arg[0] === 'string') {
                        if (self.model.getDataView(arg[0])) {
                            return self.select(arg[0]);
                        }
                    }
                    arg.forEach(function (x) {
                        if (typeof x === 'string') {
                            var _field = self.model.field(x);
                            if (_field) {
                                if (_field.many || _field.mapping && _field.mapping.associationType === 'junction') self.expand(_field.name);else arr.push(self.resolveField(_field.name));
                            }
                            //test nested attribute and simple attribute expression
                            else {
                                    expr = select_.call(self, x);
                                    if (expr) {
                                        arr = arr || [];
                                        arr.push(expr);
                                    }
                                }
                        } else {
                            //validate if x is an object (QueryField)
                            arr.push(x);
                        }
                    });
                }
            }
            if (_.isNil(arr)) {
                if (!self.query.hasFields()) {
                    //enumerate fields
                    var fields = self.model.attributes.filter(function (x) {
                        return !(x.many || x.mapping && x.mapping.associationType === 'junction');
                    }).map(function (x) {
                        var f = QueryField.create(x.name).from(self.model.viewAdapter);
                        if (x.property) f.as(x.property);
                        return f;
                    });
                    //and select fields
                    self.select.apply(self, fields);
                }
            } else {
                self.query.select(arr);
            }

            return this;
        }

        /**
         * Adds a field or an array of fields to select statement
         * @param {String|Array|DataField|*} attr
         * @return {DataQueryable}
         * @deprecated
         */

    }, {
        key: 'alsoSelect',
        value: function alsoSelect(attr) {
            var self = this;
            if (!self.query.hasFields()) {
                return self.select(attr);
            } else {
                if (_.isNil(attr)) return self;
                var arr = [];
                if (typeof attr === 'string') {
                    arr.push(attr);
                } else if (_.isArray(attr)) {
                    arr = attr.slice(0);
                } else if ((typeof attr === 'undefined' ? 'undefined' : _typeof(attr)) === 'object') {
                    arr.push(attr);
                }
                var $select = self.query.$select;
                arr.forEach(function (x) {
                    var field = self.resolveField(x);
                    if (_.isArray($select[self.model.viewAdapter])) $select[self.model.viewAdapter].push(field);
                });
                return self;
            }
        }

        /**
         * @param attr {string|*}
         * @param alias {string=}
         * @returns {DataQueryable|QueryField|*}
         */

    }, {
        key: 'resolveField',
        value: function resolveField(attr, alias) {

            if (typeof attr === 'undefined' || attr === null) return attr;
            if (typeof attr !== 'string') return attr;
            var matches = /(count|avg|sum|min|max)\((.*?)\)/i.exec(attr),
                res = void 0,
                field = void 0,
                aggr = void 0,
                prop = void 0;
            if (matches) {
                //get field
                field = this.model.field(matches[2]);
                //get aggregate function
                aggr = matches[1].toLowerCase();
                //test nested attribute aggregation
                if (_.isNil(field) && /\//.test(matches[2])) {
                    //resolve nested attribute
                    var nestedAttr = DataAttributeResolver.prototype.resolveNestedAttribute.call(this, matches[2]);
                    //if nested attribute exists
                    if (nestedAttr) {
                        if (_.isNil(alias)) {
                            var nestedMatches = /as\s(\w+)$/i.exec(attr);
                            alias = _.isNil(nestedMatches) ? aggr.concat('Of_', matches[2].replace(/\//g, "_")) : nestedMatches[1];
                        }
                        /**
                         * @type {Function}
                         */
                        var aggregateFunc = QueryFieldUtils[aggr];
                        if (typeof aggregateFunc !== 'function') {
                            throw new ReferenceError('The specified aggregate function is not implemented');
                        }
                        //return query field
                        return aggregateFunc(nestedAttr.$name).as(alias);
                    }
                }
                if (typeof field === 'undefined' || field === null) throw new Error(sprintf.sprintf('The specified field %s cannot be found in target model.', matches[2]));
                if (_.isNil(alias)) {
                    matches = /as\s(\w+)$/i.exec(attr);
                    if (matches) {
                        alias = matches[1];
                    } else {
                        alias = aggr.concat('Of', field.name);
                    }
                }
                if (aggr === 'count') return QueryField.create().count(field.name).from(this.model.viewAdapter).as(alias);else if (aggr === 'avg') return QueryField.create().average(field.name).from(this.model.viewAdapter).as(alias);else if (aggr === 'sum') return QueryField.create().sum(field.name).from(this.model.viewAdapter).as(alias);else if (aggr === 'min') return QueryField.create().min(field.name).from(this.model.viewAdapter).as(alias);else if (aggr === 'max') return QueryField.create().max(field.name).from(this.model.viewAdapter).as(alias);
            } else {
                matches = /(\w+)\((.*?)\)/i.exec(attr);
                if (matches) {
                    res = {};
                    field = this.model.field(matches[2]);
                    aggr = matches[1];
                    if (typeof field === 'undefined' || field === null) throw new Error(sprintf.sprintf('The specified field %s cannot be found in target model.', matches[2]));
                    if (_.isNil(alias)) {
                        matches = /as\s(\w+)$/i.exec(attr);
                        if (matches) {
                            alias = matches[1];
                        }
                    }
                    prop = alias || field.property || field.name;
                    res[prop] = {};res[prop]['$' + aggr] = [QueryField.create(field.name).from(this.model.viewAdapter)];
                    return res;
                } else {
                    //matches expression [field] as [alias] e.g. itemType as type
                    matches = /^(\w+)\s+as\s+(.*?)$/i.exec(attr);
                    if (matches) {
                        field = this.model.field(matches[1]);
                        if (typeof field === 'undefined' || field === null) throw new Error(sprintf.sprintf('The specified field %s cannot be found in target model.', attr));
                        alias = matches[2];
                        prop = alias || field.property || field.name;
                        return QueryField.create(field.name).from(this.model.viewAdapter).as(prop);
                    } else {
                        //try to match field with expression [field] as [alias] or [nested]/[field] as [alias]
                        field = this.model.field(attr);
                        if (typeof field === 'undefined' || field === null) throw new Error(sprintf.sprintf('The specified field %s cannot be found in target model.', attr));
                        var f = QueryField.create(field.name).from(this.model.viewAdapter);
                        if (field.property) return f.as(field.property);
                        return f;
                    }
                }
            }
            return this;
        }

        /**
         * Prepares an ascending sorting operation
         * @param {string} attr - The field name to use for sorting results
         * @returns {DataQueryable}
         */

    }, {
        key: 'orderBy',
        value: function orderBy(attr) {
            if (typeof attr === 'string' && /\//.test(attr)) {
                this.query.orderBy(DataAttributeResolver.prototype.orderByNestedAttribute.call(this, attr));
                return this;
            }
            this.query.orderBy(this.resolveField(attr));
            return this;
        }

        /**
         * Prepares a group by expression
         * @param {...string} attr - A param array of string that represents the attributes which are going to be used in group by expression
         * @returns {DataQueryable}
         * @example
         //retrieve products with highest sales during last month
         context.model('Order')
         .select('orderedItem/model as productModel', 'orderedItem/name as productName','count(id) as orderCount')
         .where('orderDate').greaterOrEqual(moment().startOf('month').toDate())
         .groupBy('orderedItem')
         .orderByDescending('count(id)')
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Results
         productModel  productName                              orderCount
         ------------  ---------------------------------------  ----------
         SM5111        Brother MFC-J6920DW                      3
         FY8135        LaCie Blade Runner                       3
         HA6910        Apple iMac (27-Inch, 2013 Version)       2
         LD4238        Dell XPS 18                              2
         HR6205        Samsung Galaxy Note 10.1 (2014 Edition)  2
         */

    }, {
        key: 'groupBy',
        value: function groupBy(attr) {
            var arr = [],
                arg = arguments.length > 1 ? Array.prototype.slice.call(arguments) : attr;
            if (_.isArray(arg)) {
                for (var i = 0; i < arg.length; i++) {
                    var x = arg[i];
                    if (DataAttributeResolver.prototype.testNestedAttribute.call(this, x)) {
                        //nested group by
                        arr.push(DataAttributeResolver.prototype.orderByNestedAttribute.call(this, x));
                    } else {
                        arr.push(this.resolveField(x));
                    }
                }
            } else {
                if (DataAttributeResolver.prototype.testNestedAttribute.call(this, arg)) {
                    //nested group by
                    arr.push(DataAttributeResolver.prototype.orderByNestedAttribute.call(this, arg));
                } else {
                    arr.push(this.resolveField(arg));
                }
            }
            if (arr.length > 0) {
                this.query.groupBy(arr);
            }
            return this;
        }

        /**
         * Continues a ascending sorting operation
         * @param {string} attr - The field to use for sorting results
         * @returns {DataQueryable}
         */

    }, {
        key: 'thenBy',
        value: function thenBy(attr) {
            if (typeof attr === 'string' && /\//.test(attr)) {
                this.query.thenBy(DataAttributeResolver.prototype.orderByNestedAttribute.call(this, attr));
                return this;
            }
            this.query.thenBy(this.resolveField(attr));
            return this;
        }

        /**
         * Prepares a descending sorting operation
         * @param {string} attr - The field name to use for sorting results
         * @returns {DataQueryable}
         */

    }, {
        key: 'orderByDescending',
        value: function orderByDescending(attr) {
            if (typeof attr === 'string' && /\//.test(attr)) {
                this.query.orderByDescending(DataAttributeResolver.prototype.orderByNestedAttribute.call(this, attr));
                return this;
            }
            this.query.orderByDescending(this.resolveField(attr));
            return this;
        }

        /**
         * Continues a descending sorting operation
         * @param {string} attr - The field name to use for sorting results
         * @returns {DataQueryable}
         */

    }, {
        key: 'thenByDescending',
        value: function thenByDescending(attr) {
            if (typeof attr === 'string' && /\//.test(attr)) {
                this.query.thenByDescending(DataAttributeResolver.prototype.orderByNestedAttribute.call(this, attr));
                return this;
            }
            this.query.thenByDescending(this.resolveField(attr));
            return this;
        }

        /**
         * Executes the specified query against the underlying model and returns the first item.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise. The second argument will contain the result.
         * @returns {Promise|*}
         * @example
         //retrieve an order by id
         context.model('Order')
         .where('id').equal(302)
         .first().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'first',
        value: function first(callback) {
            var _this = this;

            if (typeof callback === 'function') {
                return firstInternal.call(this, callback);
            }
            return Q.promise(function (resolve, reject) {
                return firstInternal.bind(_this)(function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
            });
        }

        /**
         * Executes the specified query and returns all objects which satisfy the specified criteria.
         * @param {Function=} callback
         * @returns {Promise|*}
         */

    }, {
        key: 'all',
        value: function all(callback) {
            var _this2 = this;

            if (typeof callback === 'function') {
                return allInternal.call(this, callback);
            }
            return Q.promise(function (resolve, reject) {
                return allInternal.bind(_this2)(function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
            });
        }

        /**
         * Prepares a paging operation by skipping the specified number of records
         * @param n {number} - The number of records to be skipped
         * @returns {DataQueryable}
         * @example
         //retrieve a list of products
         context.model('Product')
         .skip(10)
         .take(10)
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'skip',
        value: function skip(n) {
            this.query.$skip = n;
            return this;
        }

        /**
         * Prepares a data paging operation by taking the specified number of records
         * @param {Number} n - The number of records to take
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {DataQueryable|*} - If callback function is missing returns a promise.
         */

    }, {
        key: 'take',
        value: function take(n, callback) {
            if (typeof callback !== 'function') {
                this.query.take(n);
                return this;
            } else {
                takeInternal.call(this, n, callback);
            }
        }

        /**
         * Represents the callback function of DataQueryable.list() method.
         * @callback DataQueryable~ListCallback
         * @param {Error=} err
         * @param {DataResultSet} result
         */

        /**
         * Executes current query and returns a result set based on the specified paging parameters.
         * <p>
         *     The result is an instance of <a href="DataResultSet.html">DataResultSet</a>. The returned records may contain nested objects
         *     based on the definition of the current model (expandable fields).
         *     This operation is one of the common data operations on MOST Data Applications
         *     where the affected records may have nested objects which contain the associated objects of each object.
         * </p>
         <pre class="prettyprint"><code>
         {
            "total": 242,
            "records": [
                ...
                {
                    "id": 46,
                    "orderDate": "2014-12-31 13:35:41.000+02:00",
                    "orderedItem": {
                        "id": 413,
                        "additionalType": "Product",
                        "category": "Storage and Networking Gear",
                        "price": 647.13,
                        "model": "FY8135",
                        "releaseDate": "2015-01-15 18:07:42.000+02:00",
                        "name": "LaCie Blade Runner",
                        "dateCreated": "2015-11-23 14:53:04.927+02:00",
                        "dateModified": "2015-11-23 14:53:04.934+02:00"
                    },
                    "orderNumber": "DEF193",
                    "orderStatus": {
                        "id": 7,
                        "name": "Problem",
                        "alternateName": "OrderProblem",
                        "description": "Representing that there is a problem with the order."
                    },
                    "paymentDue": "2015-01-20 13:35:41.000+02:00",
                    "paymentMethod": {
                        "id": 7,
                        "name": "PayPal",
                        "alternateName": "PayPal",
                        "description": "Payment via the PayPal payment service."
                    },
                    "additionalType": "Order",
                    "description": null,
                    "dateCreated": "2015-11-23 21:00:18.306+02:00",
                    "dateModified": "2015-11-23 21:00:18.307+02:00"
                }
                ...
            ]
        }
         </code></pre>
         * @param {DataQueryable~ListCallback=} callback - A callback function with arguments (err, result) where the first argument is the error, if any
         * and the second argument is an object that represents a result set
         * @returns {Deferred|*} - If callback is missing returns a promise.
         @example
         //retrieve products list order by price
         context.model('Product')
         .where('category').equal('LCDs and Peripherals')
         .orderByDescending('price')
         .take(3).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'list',
        value: function list(callback) {
            if (typeof callback !== 'function') {
                var d = Q.defer();
                listInternal.call(this, function (err, result) {
                    if (err) {
                        return d.reject(err);
                    }
                    d.resolve(result);
                });
                return d.promise;
            } else {
                return listInternal.call(this, callback);
            }
        }

        /**
         * Executes the specified query and returns an array of objects which satisfy the specified criteria.
         * @returns {Promise|*}
         */

    }, {
        key: 'getItems',
        value: function getItems() {
            var self = this,
                d = Q.defer();
            process.nextTick(function () {
                delete self.query.$inlinecount;
                if ((parseInt(self.query.$take) || 0) < 0) {
                    delete self.query.$take;
                    delete self.query.$skip;
                }
                if (!self.query.hasFields()) {
                    self.select();
                }
                execute_.call(self, function (err, result) {
                    if (err) {
                        return d.reject(err);
                    }
                    return d.resolve(result);
                });
            });
            return d.promise;
        }

        /**
         * Executes the query against the current model and returns the count of items found.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result, if any.
         * @returns {Deferred|*} - If callback parameter is missing then returns a Deferred object.
         * @example
         //retrieve the number of a product's orders
         context.model('Order')
         .where('orderedItem').equal(302)
         .count().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'count',
        value: function count(callback) {
            if (typeof callback !== 'function') {
                var d = Q.defer();
                countInternal.call(this, function (err, result) {
                    if (err) {
                        return d.reject(err);
                    }
                    d.resolve(result);
                });
                return d.promise;
            } else {
                return countInternal.call(this, callback);
            }
        }

        /**
         * Executes the query against the current model and returns the maximum value of the given attribute.
         * @param {string} attr - A string that represents a field of the current model
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result, if any.
         * @returns {Deferred|*} - If callback parameter is missing then returns a Deferred object.
         * @example
         //retrieve the maximum price of products sold during last month
         context.model('Order')
         .where('orderDate').greaterOrEqual(moment().startOf('month').toDate())
         .max('orderedItem/price').then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'max',
        value: function max(attr, callback) {
            if (typeof callback !== 'function') {
                var d = Q.defer();
                maxInternal.call(this, attr, function (err, result) {
                    if (err) {
                        return d.reject(err);
                    }
                    d.resolve(result);
                });
                return d.promise;
            } else {
                return maxInternal.call(this, attr, callback);
            }
        }

        /**
         * Executes the query against the current model and returns the average value of the given attribute.
         * @param {string} attr - A string that represents a field of the current model
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result, if any.
         * @returns {Deferred|*} - If callback parameter is missing then returns a Deferred object.
         * @example
         //retrieve the mininum price of products sold during last month
         context.model('Order')
         .where('orderDate').greaterOrEqual(moment().startOf('month').toDate())
         .min('orderedItem/price').then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'min',
        value: function min(attr, callback) {
            if (typeof callback !== 'function') {
                var d = Q.defer();
                minInternal.call(this, attr, function (err, result) {
                    if (err) {
                        return d.reject(err);
                    }
                    d.resolve(result);
                });
                return d.promise;
            } else {
                return minInternal.call(this, attr, callback);
            }
        }

        /**
         * Executes the query against the current model and returns the average value of the given attribute.
         * @param {string} attr - A string that represents a field of the current model
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result, if any.
         * @returns {Deferred|*} - If callback parameter is missing then returns a Deferred object.
         * @example
         //retrieve the average price of products sold during last month
         context.model('Order')
         .where('orderDate').greaterOrEqual(moment().startOf('month').toDate())
         .average('orderedItem/price').then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'average',
        value: function average(attr, callback) {
            if (typeof callback !== 'function') {
                var d = Q.defer();
                averageInternal_.call(this, attr, function (err, result) {
                    if (err) {
                        return d.reject(err);
                    }
                    d.resolve(result);
                });
                return d.promise;
            } else {
                return averageInternal_.call(this, attr, callback);
            }
        }

        /**
         * Migrates the underlying data model
         * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
         */

    }, {
        key: 'migrate',
        value: function migrate(callback) {
            var self = this;
            try {
                //ensure context
                self.ensureContext();
                if (self.model) {
                    self.model.migrate(function (err) {
                        callback(err);
                    });
                } else {
                    callback();
                }
            } catch (e) {
                callback(e);
            }
        }
    }, {
        key: 'postExecute',
        value: function postExecute(result, callback) {
            callback();
        }

        /**
         * Disables permission listeners and executes the underlying query without applying any permission filters
         * @param {Boolean=} value - A boolean which represents the silent flag. If value is missing the default parameter is true.
         * @returns {DataQueryable}
         * @example
         //retrieve user
         context.model('User')
         .where('name').equal('other@example.com')
         .silent()
         .first().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'silent',
        value: function silent(value) {
            /**
             * @type {boolean}
             * @private
             */
            this.$silent = false;
            if (typeof value === 'undefined') {
                this.$silent = true;
            } else {
                this.$silent = value;
            }
            return this;
        }

        /**
         * Generates a MD5 hashed string for this DataQueryable instance
         * @returns {string}
         */

    }, {
        key: 'toMD5',
        value: function toMD5() {
            var q = { query: this.query };
            if (typeof this.$expand !== 'undefined') {
                q.$expand = this.$expand;
            }
            if (typeof this.$levels !== 'undefined') {
                q.$levels = this.$levels;
            }
            if (typeof this.$flatten !== 'undefined') {
                q.$flatten = this.$flatten;
            }
            if (typeof this.$silent !== 'undefined') {
                q.$silent = this.$silent;
            }
            if (typeof this.$asArray !== 'undefined') {
                q.$asArray = this.$asArray;
            }
            return TextUtils.toMD5(q);
        }

        /**
         * @param {Boolean=} value
         * @returns {DataQueryable}
         */

    }, {
        key: 'asArray',
        value: function asArray(value) {
            /**
             * @type {boolean}
             * @private
             */
            this.$asArray = false;
            if (typeof value === 'undefined') {
                this.$asArray = true;
            } else {
                this.$asArray = value;
            }
            return this;
        }

        /**
         * Gets or sets query data. This data may be used in before and after execute listeners.
         * @param {string=} name
         * @param {*=} value
         * @returns {DataQueryable|*}
         */

    }, {
        key: 'data',
        value: function data(name, value) {
            this.query.data = this.query.data || {};
            if (typeof name === 'undefined') {
                return this.query.data;
            }
            if (typeof value === 'undefined') {
                return this.query.data[name];
            } else {
                this.query.data[name] = value;
            }
            return this;
        }

        /**
         * Gets or sets a string which represents the title of this DataQueryable instance. This title may be used in caching operations
         * @param {string=} value - The title of this DataQueryable instance
         * @returns {string|DataQueryable}
         */

    }, {
        key: 'title',
        value: function title(value) {
            return this.data('title', value);
        }

        /**
         * Gets or sets a boolean which indicates whether results should be cached or not. This parameter is valid for models which have caching mechanisms.
         * @param {boolean=} value
         * @returns {string|DataQueryable}
         */

    }, {
        key: 'cache',
        value: function cache(value) {
            return this.data('cache', value);
        }

        /**
         * Sets an expandable field or collection of fields. An expandable field produces nested objects based on the association between two models.
         * @param {...string|*} attr - A param array of strings which represents the field or the array of fields that are going to be expanded.
         * If attr is missing then all the previously defined expandable fields will be removed.
         * @returns {DataQueryable}
         * @example
         //retrieve an order and expand customer field
         context.model('Order')
         //note: the field [orderedItem] is defined as expandable in model definition and it will produce a nested object for each order
         .select('id','orderedItem','customer')
         .expand('customer')
         .where('id').equal(46)
         .first().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Result:
         {
            "id": 46,
            "orderedItem": {
                "id": 413,
                "additionalType": "Product",
                "category": "Storage and Networking Gear",
                "price": 647.13,
                "model": "FY8135",
                "releaseDate": "2015-01-15 18:07:42.000+02:00",
                "name": "LaCie Blade Runner",
                "dateCreated": "2015-11-23 14:53:04.927+02:00",
                "dateModified": "2015-11-23 14:53:04.934+02:00"
            },
            "customer": {
                "id": 317,
                "additionalType": "Person",
                "alternateName": null,
                "description": "Nicole Armstrong",
                "image": "https://s3.amazonaws.com/uifaces/faces/twitter/zidoway/128.jpg",
                "dateCreated": "2015-11-23 14:52:57.886+02:00",
                "dateModified": "2015-11-23 14:52:57.917+02:00"
            }
        }
         @example //retrieve an order and do not expand customer field
         {
            "id": 46,
            "orderedItem": {
                "id": 413,
                "additionalType": "Product",
                "category": "Storage and Networking Gear",
                "price": 647.13,
                "model": "FY8135",
                "releaseDate": "2015-01-15 18:07:42.000+02:00",
                "name": "LaCie Blade Runner",
                "dateCreated": "2015-11-23 14:53:04.927+02:00",
                "dateModified": "2015-11-23 14:53:04.934+02:00"
            },
            "customer": 317
        }
         */

    }, {
        key: 'expand',
        value: function expand(attr) {
            var self = this,
                arg = arguments.length > 1 ? Array.prototype.slice.call(arguments) : attr;
            if (_.isNil(arg)) {
                delete self.$expand;
            } else {
                if (!_.isArray(this.$expand)) self.$expand = [];
                if (_.isArray(arg)) {
                    arg.forEach(function (x) {
                        if (_.isNil(x)) {
                            return;
                        }
                        if (typeof x === 'string' || (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' && x.hasOwnProperty('name')) {
                            self.$expand.push(x);
                        } else {
                            throw new Error("Expand option may be a string or a named object.");
                        }
                    });
                } else {
                    self.$expand.push(arg);
                }
            }
            return self;
        }

        /**
         * Disables expandable fields
         * @param {boolean=} value - If the value is true the result will contain only flat objects -without any nested associated object-,
         * even if model definition contains expandable fields. If value is missing, the default parameter is true
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders
         context.model('Order')
         .flatten()
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Results:
         id  customer  orderStatus  paymentMethod
         --  --------  -----------  -------------
         1   299       5            6
         2   337       7            5
         3   309       3            3
         4   257       2            4
         5   285       5            2
         */

    }, {
        key: 'flatten',
        value: function flatten(value) {

            if (value || typeof value === 'undefined') {
                //delete expandable data (if any)
                delete this.$expand;
                this.$flatten = true;
            } else {
                delete this.$flatten;
            }
            if (this.$flatten) {
                this.$levels = 0;
            }
            return this;
        }

        /**
         * Prepares an addition (e.g. ([field] + 4))
         * @param {number|*} x - The
         * @returns {DataQueryable}
         * @example
         //retrieve a list of products
         context.model('Product')
         .select('id','name', 'price')
         //perform ((ProductData.price + 100)>300)
         .where('price').add(100).lowerThan(300)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'add',
        value: function add(x) {
            this.query.add(x);return this;
        }

        /**
         * Prepares a subtraction (e.g. ([field] - 4))
         * @param {number|*} x
         * @returns {DataQueryable}
         //retrieve a list of orders
         context.model('Product')
         .select('id','name', 'price')
         //perform ((ProductData.price - 50)<150)
         .where('price').subtract(50).lowerThan(150)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'subtract',
        value: function subtract(x) {
            this.query.subtract(x);return this;
        }

        /**
         * Prepares a multiplication (e.g. ([field] * 0.2))
         * @param {number} x
         * @returns {DataQueryable}
         @example
         //retrieve a list of orders
         context.model('Product')
         .select('id','name', 'price')
         //perform ((ProductData.price * 0.2)<50)
         .where('price').multiply(0.2).lowerThan(50)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'multiply',
        value: function multiply(x) {
            this.query.multiply(x);return this;
        }

        /**
         * Prepares a division (e.g. ([field] / 0.2))
         * @param {number} x
         * @returns {DataQueryable}
         @example
         //retrieve a list of orders
         context.model('Product')
         .select('id','name', 'price')
         //perform ((ProductData.price / 0.8)>500)
         .where('price').divide(0.8).greaterThan(500)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'divide',
        value: function divide(x) {
            this.query.divide(x);return this;
        }

        /**
         * * Prepares a round mathematical expression
         * @param {number=} n
         * @returns {DataQueryable}
         */

    }, {
        key: 'round',
        value: function round(n) {
            this.query.round(n);return this;
        }

        /**
         * Prepares a substring comparison
         * @param {number} start - The position where to start the extraction. First character is at index 0
         * @param {number=} length - The number of characters to extract
         * @returns {DataQueryable}
         * @example
         //retrieve a list of persons
         context.model('Person')
         .select('givenName')
         .where('givenName').substr(0,4).equal('Alex')
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Results:
         givenName
         ---------
         Alex
         Alexis
         */

    }, {
        key: 'substr',
        value: function substr(start, length) {
            this.query.substr(start, length);return this;
        }

        /**
         * Prepares a string concatenation expression
         * @param {string} s
         * @returns {DataQueryable}
         */

    }, {
        key: 'concat',
        value: function concat(s) {
            this.query.concat(s);return this;
        }

        /**
         * Prepares a string trimming expression
         * @returns {DataQueryable}
         */

    }, {
        key: 'trim',
        value: function trim() {
            this.query.trim();return this;
        }

        /**
         * Prepares a string length expression
         * @returns {DataQueryable}
         * @example
         //retrieve a list of persons
         context.model('Person')
         .select('givenName')
         .where('givenName').length().equal(5)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         @example //Results:
         givenName
         ---------
         Daisy
         Peter
         Kylie
         Colin
         Lydia
         */

    }, {
        key: 'length',
        value: function length() {
            this.query.length();return this;
        }

        /**
         * Prepares an expression by getting the date only value of a datetime field
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders
         context.model('Order')
         .select('id','paymentDue', 'orderDate')
         .where('orderDate').getDate().equal('2015-01-16')
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'getDate',
        value: function getDate() {
            this.query.getDate();return this;
        }

        /**
         * Prepares an expression by getting the year of a datetime field
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders made during 2015
         context.model('Order')
         .where('orderDate').getYear().equal(2015)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'getYear',
        value: function getYear() {
            this.query.getYear();return this;
        }

        /**
         * Prepares an expression by getting the year of a datetime field
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders made during 2015
         context.model('Order')
         .where('orderDate').getYear().equal(2015)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'getFullYear',
        value: function getFullYear() {
            this.query.getYear();return this;
        }

        /**
         * Prepares an expression by getting the month (from 1 to 12) of a datetime field.
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders made during October 2015
         context.model('Order')
         .where('orderDate').getYear().equal(2015)
         .and('orderDate').getMonth().equal(10)
          .take(5).list().then(function(result) {
                console.table(result.records);
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'getMonth',
        value: function getMonth() {
            this.query.getMonth();return this;
        }

        /**
         * Prepares an expression by getting the day of the month of a datetime field
         * @returns {DataQueryable}
         * @example
         //retrieve a list of orders
         context.model('Order')
         .where('orderDate').getYear().equal(2015)
         .and('orderDate').getMonth().equal(1)
         .and('orderDate').getDay().equal(16)
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'getDay',
        value: function getDay() {
            this.query.getDay();return this;
        }

        /**
         * Prepares an expression by getting the hours (from 0 to 23) a datetime field
         * @returns {DataQueryable}
         */

    }, {
        key: 'getHours',
        value: function getHours() {
            this.query.getHours();return this;
        }

        /**
         * Prepares an expression by getting the minutes (from 0 to 59) a datetime field
         * @returns {DataQueryable}
         */

    }, {
        key: 'getMinutes',
        value: function getMinutes() {
            this.query.getMinutes();return this;
        }

        /**
         * Prepares an expression by getting the seconds (from 0 to 59) a datetime field
         * @returns {DataQueryable}
         */

    }, {
        key: 'getSeconds',
        value: function getSeconds() {
            this.query.getSeconds();return this;
        }

        /**
         * Prepares a floor mathematical expression
         * @returns {DataQueryable}
         */

    }, {
        key: 'floor',
        value: function floor() {
            this.query.floor();return this;
        }

        /**
         * Prepares a ceil mathematical expression
         * @returns {DataQueryable}
         */

    }, {
        key: 'ceil',
        value: function ceil() {
            this.query.ceil();return this;
        }

        /**
         * Prepares a lower case string comparison
         * @returns {DataQueryable}
         */

    }, {
        key: 'toLocaleLowerCase',
        value: function toLocaleLowerCase() {
            this.query.toLocaleLowerCase();return this;
        }

        /**
         * Prepares a lower case string comparison
         * @returns {DataQueryable}
         * @example
         //retrieve a list of persons
         context.model('Person')
         .where('givenName').toLocaleLowerCase().equal('alexis')
         .take(5).list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'toLowerCase',
        value: function toLowerCase() {
            return this.toLocaleLowerCase();
        }

        /**
         * Prepares an upper case string comparison
         * @returns {DataQueryable}
         */

    }, {
        key: 'toLocaleUpperCase',
        value: function toLocaleUpperCase() {
            this.query.toLocaleUpperCase();return this;
        }

        /**
         * Prepares an upper case string comparison
         * @returns {DataQueryable}
         */

    }, {
        key: 'toUpperCase',
        value: function toUpperCase() {
            return this.toLocaleUpperCase();
        }

        /**
         * Executes the underlying query and a single value.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {Deferred|*}
         * @example
         //retrieve the full name (description) of a person
         context.model('Person')
         .where('user').equal(330)
         .select('description')
         .value().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'value',
        value: function value(callback) {
            if (typeof callback !== 'function') {
                var d = Q.defer();
                valueInternal.call(this, function (err, result) {
                    if (err) {
                        return d.reject(err);
                    }
                    d.resolve(result);
                });
                return d.promise;
            } else {
                return valueInternal.call(this, callback);
            }
        }

        /**
         * Sets the number of levels of the expandable attributes.
         * The default value is 1 which means that any expandable attribute will be flat (without any other nested attribute).
         * If the value is greater than 1 then the nested objects may contain other nested objects and so on.
         * @param {Number=} value - A number which represents the number of levels which are going to be used in expandable attributes.
         * @returns {DataQueryable}
         * @example
         //get orders, expand customer and get customer's nested objects if any.
         context.model('Order')
         .orderByDescending('dateCreated)
         .expand('customer')
         .levels(2)
         .getItems().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'levels',
        value: function levels(value) {
            /**
             * @type {number}
             * @private
             */
            this.$levels = 1;
            if (typeof value === 'undefined') {
                this.$levels = 1;
            } else if (typeof value === 'number') {
                this.$levels = parseInt(value);
            }
            //set flatten property (backward compatibility issue)
            this.$flatten = this.$levels < 1;
            return this;
        }

        /**
         * Gets the number of levels of the expandable objects
         * @returns {number}
         */

    }, {
        key: 'getLevels',
        value: function getLevels() {
            if (typeof this.$levels === 'number') {
                return this.$levels;
            }
            return 1;
        }

        /**
         * Converts a DataQueryable instance to an object which is going to be used as parameter in DataQueryable.expand() method
         *  @param {String} attr - A string which represents the attribute of a model which is going to be expanded with the options specified in this instance of DataQueryable.
         *
         *  @example
         //get customer and customer orders with options (e.g. select specific attributes and sort orders by order date)
         context.model("Person")
         .search("Daisy")
         .expand(context.model("Order").select("id", "customer","orderStatus", "orderDate", "orderedItem").levels(2).orderByDescending("orderDate").take(10).toExpand("orders"))
         .take(3)
         .getItems()
         .then(function (result) {
                console.log(JSON.stringify(result));
                done();
            }).catch(function (err) {
            done(err);
        });
         *
         */

    }, {
        key: 'toExpand',
        value: function toExpand(attr) {
            if (typeof attr === 'string' && attr.length > 0) {
                return {
                    name: attr,
                    options: this
                };
            }
            throw new Error("Invalid parameter. Expected not empty string.");
        }

        /**
         * Executes the specified query and returns the first object which satisfy the specified criteria.
         * @returns {Observable|*}
         */

    }, {
        key: 'getItem',
        value: function getItem() {
            return this.first();
        }

        /**
         * Gets an instance of DataObject by executing the defined query.
         * @returns {Promise|*}
         */

    }, {
        key: 'getTypedItem',
        value: function getTypedItem() {
            var self = this;
            return Q.promise(function (resolve, reject) {
                return self.getItem().then(function (result) {
                    return resolve(self.model.convert(result));
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        /**
         * Gets a collection of DataObject instances by executing the defined query.
         * @returns {Promise|*}
         */

    }, {
        key: 'getTypedItems',
        value: function getTypedItems() {
            var self = this;
            return Q.promise(function (resolve, reject) {
                return self.getItems().then(function (result) {
                    return resolve(self.model.convert(result));
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        /**
         * Executes current query and returns a result set based on the specified paging parameters.
         * @returns {Promise|*}
         */

    }, {
        key: 'getList',
        value: function getList() {
            return this.list();
        }

        /**
         * Gets a result set that contains a collection of DataObject instances by executing the defined query.
         * @returns {Promise|*}
         */

    }, {
        key: 'getTypedList',
        value: function getTypedList() {
            var self = this,
                d = Q.defer();
            process.nextTick(function () {
                self.list().then(function (result) {
                    result.records = self.model.convert(result.records.slice(0));
                    return d.resolve(result);
                }).catch(function (err) {
                    return d.reject(err);
                });
            });
            return d.promise;
        }

        /**
         * Executes the specified query and returns all objects which satisfy the specified criteria.
         * @returns {Promise|*}
         */

    }, {
        key: 'getAllItems',
        value: function getAllItems() {
            return this.all();
        }

        /**
         * Executes the specified query and returns all objects which satisfy the specified criteria.
         * @returns {Promise|*}
         */

    }, {
        key: 'getAllTypedItems',
        value: function getAllTypedItems() {
            return this.skip(0).take(-1).getTypedItems();
        }
    }, {
        key: 'query',
        get: function get() {
            if (_.isNil(this[queryProperty])) {
                if (this.model) {
                    this[queryProperty] = QueryExpression.create(this.model.viewAdapter);
                    return this[queryProperty];
                }
                throw new Error('Model cannot be empty at this context');
            }
            return this[queryProperty];
        }

        /**
         *
         * @returns {DataModel}
         */

    }, {
        key: 'model',
        get: function get() {
            return this[modelProperty];
        }
    }]);

    return DataQueryable;
}();

function select_(arg) {
    var self = this;
    if (typeof arg === 'string' && arg.length === 0) {
        return;
    }
    var a = DataAttributeResolver.prototype.testAggregatedNestedAttribute.call(self, arg);
    if (a) {
        return DataAttributeResolver.prototype.selectAggregatedAttribute.call(self, a.aggr, a.name, a.property);
    } else {
        a = DataAttributeResolver.prototype.testNestedAttribute.call(self, arg);
        if (a) {
            return DataAttributeResolver.prototype.selecteNestedAttribute.call(self, a.name, a.property);
        } else {
            a = DataAttributeResolver.prototype.testAttribute.call(self, arg);
            if (a) {
                return self.resolveField(a.name, a.property);
            } else {
                return self.resolveField(arg);
            }
        }
    }
}

/**
 * @private
 * @param {Function} callback
 */
function firstInternal(callback) {
    var self = this;
    callback = callback || function () {};
    self.skip(0).take(1, function (err, result) {
        if (err) {
            callback(err);
        } else {
            if (result.length > 0) callback(null, result[0]);else callback(null);
        }
    });
}

/**
 * @private
 * @param {Function} callback
 */
function allInternal(callback) {
    var self = this;
    //remove skip and take
    delete this.query.$skip;
    delete this.query.$take;
    //validate already selected fields
    if (!self.query.hasFields()) {
        self.select();
    }
    callback = callback || function () {};
    //execute select
    execute_.call(self, callback);
}

/**
 * @private
 * @param {Number} n - Defines the number of items to take
 * @param {function=} callback
 * @returns {*} - A collection of objects that meet the query provided
 */
function takeInternal(n, callback) {
    var self = this;
    self.query.take(n);
    callback = callback || function () {};
    //validate already selected fields
    if (!self.query.hasFields()) {
        self.select();
    }
    //execute select
    execute_.call(self, callback);
}

/**
 * @private
 * @param {Function} callback
 */
function listInternal(callback) {
    var self = this;
    try {
        callback = callback || function () {};
        //ensure take attribute
        var take = self.query.$take || 25;
        //ensure that fields are already selected (or select all)
        self.select();
        //clone object
        var q1 = self.clone();
        //take objects
        self.take(take, function (err, result) {
            if (err) {
                callback(err);
            } else {
                // get count of records
                q1.count(function (err, total) {
                    if (err) {
                        callback(err);
                    } else {
                        //and finally create result set
                        var res = { total: total, skip: parseInt(self.query.$skip) || 0, records: result || [] };
                        callback(null, res);
                    }
                });
            }
        });
    } catch (e) {
        callback(e);
    }
}

/**
 * @private
 * @param callback {Function}
 * @returns {*} - A collection of objects that meet the query provided
 */
function countInternal(callback) {
    var self = this;
    callback = callback || function () {};
    //add a count expression
    var field = self.model.attributes[0];
    if (field === null) return callback.call(this, new Error('Queryable collection does not have any property.'));
    //normalize query and remove skip
    delete self.query.$skip;
    delete self.query.$take;
    delete self.query.$order;
    delete self.query.$group;
    //append count expression
    self.query.select(QueryField.create().count(field.name).from(self.model.viewAdapter));
    //execute select
    execute_.call(self, function (err, result) {
        if (err) {
            callback.call(self, err, result);return;
        }
        var value = null;
        if (_.isArray(result)) {
            //get first value
            if (result.length > 0) value = result[0][field.name];
        }
        callback.call(self, err, value);
    });
}

/**
 * @private
 * @param {string} attr
 * @param callback {Function}
 */
function maxInternal(attr, callback) {
    var self = this;
    delete self.query.$skip;
    var field = DataAttributeResolver.prototype.selectAggregatedAttribute.call(self, 'max', attr);
    self.select(field).flatten().value(function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
}

/**
 * @private
 * @param attr {String}
 * @param callback {Function}
 */
function minInternal(attr, callback) {
    var self = this;
    delete self.query.$skip;
    var field = DataAttributeResolver.prototype.selectAggregatedAttribute.call(self, 'min', attr);
    self.select(field).flatten().value(function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
}

/**
 * @private
 * @param {string} attr
 * @param {Function} callback
 */
function averageInternal_(attr, callback) {
    var self = this;
    delete self.query.$skip;
    var field = DataAttributeResolver.prototype.selectAggregatedAttribute.call(self, 'avg', attr);
    self.select(field).flatten().value(function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
}

/**
 * @private
 * @param {Function} callback
 */
function executeCount_(callback) {
    try {
        var self = this,
            context = self.ensureContext();
        var clonedQuery = self.query.clone();
        //delete properties
        delete clonedQuery.$skip;
        delete clonedQuery.$take;
        //add wildcard field
        clonedQuery.select(QueryField.create().count('*'));
        //execute count
        context.db.execute(clonedQuery, null, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            callback(err, result.length > 0 ? result[0] : 0);
        });
    } catch (e) {
        callback(e);
    }
}

/**
 * Executes the underlying query statement.
 * @param {function(Error,*=)} callback
 * @private
 */
function execute_(callback) {
    var self = this,
        context = self.ensureContext();
    self.migrate(function (err) {
        if (err) {
            callback(err);return;
        }
        var e = { model: self.model, query: self.query, type: 'select' };
        var flatten = self.$flatten || self.getLevels() === 0;
        if (!flatten) {
            //get expandable fields
            var expandables = self.model.attributes.filter(function (x) {
                return x.expandable;
            });
            //get selected fields
            var selected = self.query.$select[self.model.viewAdapter];
            if (_.isArray(selected)) {
                //remove hidden fields
                var hiddens = self.model.attributes.filter(function (x) {
                    return x.hidden;
                });
                if (hiddens.length > 0) {
                    var _loop = function _loop(_i) {
                        var x = selected[_i];
                        var hiddenField = hiddens.find(function (y) {
                            var f = x instanceof QueryField ? x : new QueryField(x);
                            return f.name() === y.name;
                        });
                        if (hiddenField) {
                            selected.splice(_i, 1);
                            _i -= 1;
                        }
                        i = _i;
                    };

                    for (var i = 0; i < selected.length; i++) {
                        _loop(i);
                    }
                }
                //expand fields
                if (expandables.length > 0) {
                    selected.forEach(function (x) {
                        //get field
                        var field = expandables.find(function (y) {
                            var f = x instanceof QueryField ? x : new QueryField(x);
                            return f.name() === y.name;
                        });
                        //add expandable models
                        if (field) {
                            var mapping = self.model.inferMapping(field.name);
                            if (mapping) {
                                self.$expand = self.$expand || [];
                                var expand1 = self.$expand.find(function (x) {
                                    return x.name === field.name;
                                });
                                if (typeof expand1 === 'undefined') {
                                    self.expand(mapping);
                                }
                            }
                        }
                    });
                }
            }
        }

        //merge view filter. if any
        if (self.$view) {
            self.model.filter({ $filter: self.$view.filter, $order: self.$view.order, $group: self.$view.group }, function (err, q) {
                if (err) {
                    if (err) {
                        callback(err);
                    }
                } else {
                    //prepare current filter
                    if (q.query.$prepared) {
                        if (e.query.$where) e.query.prepare();
                        e.query.$where = q.query.$prepared;
                    }
                    if (q.query.$group)
                        //replace group fields
                        e.query.$group = q.query.$group;
                    //add order fields
                    if (q.query.$order) {
                        if (_.isArray(e.query.$order)) {
                            q.query.$order.forEach(function (x) {
                                e.query.$order.push(x);
                            });
                        } else {
                            e.query.$order = q.query.$order;
                        }
                    }
                    //execute query
                    finalExecuteInternal_.call(self, e, callback);
                }
            });
        } else {
            //execute query
            finalExecuteInternal_.call(self, e, callback);
        }
    });
}

/**
 * @private
 * @param {*} e
 * @param {Function} callback
 */
function finalExecuteInternal_(e, callback) {
    var self = this,
        context = self.ensureContext();
    //pass data queryable to event
    e.emitter = this;
    var afterListenerCount = self.model.listeners('after.execute').length;
    self.model.emit('before.execute', e, function (err) {
        if (err) {
            callback(err);
        } else {
            //if command has been completed, do not execute the command against the underlying database
            if (typeof e['result'] !== 'undefined') {
                //call after execute
                var result = e['result'];
                afterExecute_.call(self, result, function (err, result) {
                    if (err) {
                        return callback(err);
                    }
                    if (afterListenerCount === 0) {
                        return callback(null, result);
                    }
                    //raise after execute event
                    self.model.emit('after.execute', e, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, result);
                    });
                });
                return;
            }
            context.db.execute(e.query, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                afterExecute_.call(self, result, function (err, result) {
                    if (err) {
                        return callback(err);
                    }
                    if (afterListenerCount === 0) {
                        return callback(null, result);
                    }
                    //raise after execute event
                    e.result = result;
                    self.model.emit('after.execute', e, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, result);
                    });
                });
            });
        }
    });
}

/**
 * @param {*} result
 * @param {Function} callback
 * @private
 */
function afterExecute_(result, callback) {
    /**
     * @type {DataQueryable|*}
     */
    var self = this;
    var field = void 0,
        parentField = void 0,
        junction = void 0;
    if (self.$expand) {
        //get distinct values
        var expands = _.uniqBy(self.$expand, function (x) {
            return x;
        });
        async.eachSeries(expands, function (expand, cb) {
            var mapping = void 0,
                options = {};
            try {
                /**
                 * get mapping
                 * @type {DataAssociationMapping|*}
                 */
                if (expand instanceof DataAssociationMapping) {
                    mapping = expand;
                    if (typeof expand.select !== 'undefined' && expand.select !== null) {
                        if (typeof expand.select === 'string') options["$select"] = expand.select;else if (_.isArray(expand.select)) options["$select"] = expand.select.join(",");
                    }
                    //get expand options
                    if (typeof expand.options !== 'undefined' && expand.options !== null) {
                        _.assign(options, expand.options);
                    }
                } else {
                    //get mapping from expand attribute
                    var expandAttr = void 0;
                    if (typeof expand === 'string') {
                        //get expand attribute as string
                        expandAttr = expand;
                    } else if ((typeof expand === 'undefined' ? 'undefined' : _typeof(expand)) === 'object' && expand.hasOwnProperty('name')) {
                        //get expand attribute from Object.name property
                        expandAttr = expand.name;
                        //get expand options
                        if (typeof expand.options !== 'undefined' && expand.options !== null) {
                            options = expand.options;
                        }
                    } else {
                        //invalid expand parameter
                        return callback(new Error("Invalid expand option. Expected string or a named object."));
                    }
                    field = self.model.field(expandAttr);
                    if (typeof field === 'undefined') field = self.model.attributes.find(function (x) {
                        return x.type === expandAttr;
                    });
                    if (field) {
                        mapping = self.model.inferMapping(field.name);
                        if (expands.find(function (x) {
                            return x.parentField === mapping.parentField && x.parentModel === mapping.parentModel && x.childField === mapping.childField && x.childModel === mapping.childModel;
                        })) {
                            return cb();
                        }
                        if (mapping) {
                            mapping.refersTo = mapping.refersTo || field.name;
                            if (_.isObject(mapping.options)) {
                                _.assign(options, mapping.options);
                            } else if (_.isArray(mapping.select) && mapping.select.length > 0) {
                                options['$select'] = mapping.select.join(",");
                            }
                        }
                    }
                }
                if (options instanceof DataQueryable) {
                    // do nothing
                } else {
                    //set default $top option to -1 (backward compatibility issue)
                    if (!options.hasOwnProperty("$top")) {
                        options["$top"] = -1;
                    }
                    //set default $levels option to 1 (backward compatibility issue)
                    if (!options.hasOwnProperty("$levels")) {
                        if (typeof self.$levels === 'number') {
                            options["$levels"] = self.getLevels() - 1;
                        }
                    }
                }
            } catch (e) {
                return cb(e);
            }

            if (mapping) {
                var MappingExtensions = require('./mapping-extensions').MappingExtensions;
                //clone mapping
                var thisMapping = _.assign({}, mapping);
                thisMapping.options = options;
                if (mapping.associationType === 'association' || mapping.associationType === 'junction') {
                    if (mapping.parentModel === self.model.name && mapping.associationType === 'association') {
                        return MappingExtensions.extend(thisMapping).for(self).getAssociatedChilds_v1(result).then(function () {
                            return cb();
                        }).catch(function (err) {
                            return cb(err);
                        });
                    } else if (mapping.childModel === self.model.name && mapping.associationType === 'junction') {
                        return MappingExtensions.extend(thisMapping).for(self).getParents_v1(result).then(function () {
                            return cb();
                        }).catch(function (err) {
                            return cb(err);
                        });
                    } else if (mapping.parentModel === self.model.name && mapping.associationType === 'junction') {
                        return MappingExtensions.extend(thisMapping).for(self).getChilds_v1(result).then(function () {
                            return cb();
                        }).catch(function (err) {
                            return cb(err);
                        });
                    } else if (mapping.childModel === self.model.name && mapping.associationType === 'association') {
                        return MappingExtensions.extend(thisMapping).for(self).getAssociatedParents_v1(result).then(function () {
                            return cb();
                        }).catch(function (err) {
                            return cb(err);
                        });
                    }
                } else {
                    return cb(new Error("Not yet implemented"));
                }
            } else {
                console.log(sprintf.sprintf('Data assocication mapping (%s) for %s cannot be found or the association between these two models defined more than once.', expand, self.model.title));
                return cb(null);
            }
        }, function (err) {
            if (err) {
                callback(err);
            } else {
                toArrayCallback.call(self, result, callback);
            }
        });
    } else {
        toArrayCallback.call(self, result, callback);
    }
}

/**
 * @private
 * @param {Array|*} result
 * @param {Function} callback
 */
function toArrayCallback(result, callback) {
    try {
        var self = this;
        if (self.$asArray) {
            if (typeof self.query === 'undefined') {
                return callback(null, result);
            }
            var fields = self.query.fields();
            if (!_.isArray(fields)) {
                return callback(null, result);
            }
            if (fields.length === 1) {
                var arr = [];
                result.forEach(function (x) {
                    if (_.isNil(x)) return;
                    var key = Object.keys(x)[0];
                    if (x[key]) arr.push(x[key]);
                });
                return callback(null, arr);
            } else {
                return callback(null, result);
            }
        } else {
            return callback(null, result);
        }
    } catch (e) {
        return callback(e);
    }
}

/**
 * @private
 * @param {Function} callback
 */
function valueInternal(callback) {
    if (_.isNil(this.query.$select)) {
        this.select(this.model.primaryKey);
    }
    firstInternal.call(this, function (err, result) {
        if (err) {
            return callback(err);
        }
        if (_.isNil(result)) {
            return callback();
        }
        var key = Object.keys(result)[0];
        if (typeof key === 'undefined') {
            return callback();
        }
        callback(null, result[key]);
    });
}
//# sourceMappingURL=queryable.js.map
