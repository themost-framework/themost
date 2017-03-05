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
exports.DataModel = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _odata = require('@themost/query/odata');

var OpenDataParser = _odata.OpenDataParser;

var _query = require('@themost/query/query');

var QueryExpression = _query.QueryExpression;

var _emitter = require('@themost/common/emitter');

var SequentialEventEmitter = _emitter.SequentialEventEmitter;

var _errors = require('@themost/common/errors');

var DataError = _errors.DataError;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;
var PathUtils = _utils.PathUtils;

var _types = require('./types');

var DataAssociationMapping = _types.DataAssociationMapping;
var DataModelMigration = _types.DataModelMigration;
var ParserUtils = _types.ParserUtils;

var _validators = require('./validators');

var RequiredValidator = _validators.RequiredValidator;
var MaxLengthValidator = _validators.MaxLengthValidator;
var DataTypeValidator = _validators.DataTypeValidator;

var _listeners = require('./listeners');

var CalculatedValueListener = _listeners.CalculatedValueListener;
var NotNullConstraintListener = _listeners.NotNullConstraintListener;
var DefaultValueListener = _listeners.DefaultValueListener;
var UniqueConstraintListener = _listeners.UniqueConstraintListener;
var DataModelSeedListener = _listeners.DataModelSeedListener;
var DataModelCreateViewListener = _listeners.DataModelCreateViewListener;
var DataCachingListener = _listeners.DataCachingListener;
var DataNestedObjectListener = _listeners.DataNestedObjectListener;
var DataStateValidatorListener = _listeners.DataStateValidatorListener;

var _associations = require('./associations');

var DataObjectAssociationListener = _associations.DataObjectAssociationListener;

var _queryable = require('./queryable');

var DataQueryable = _queryable.DataQueryable;
var DataAttributeResolver = _queryable.DataAttributeResolver;

var _view = require('./view');

var DataModelView = _view.DataModelView;

var _filterResolver = require('./filter-resolver');

var DataFilterResolver = _filterResolver.DataFilterResolver;

var _config = require('./config');

var ModelClassLoaderStrategy = _config.ModelClassLoaderStrategy;
var ListenerLoaderStrategy = _config.ListenerLoaderStrategy;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @memberOf DataModel
 * @param {DataField} field
 * @private
 */
function inferTagMapping_(field) {
    /**
     * @type {DataModel|*}
     */
    var self = this;
    //validate field argument
    if (_.isNil(field)) {
        return;
    }
    //validate DataField.many attribute
    if (!(field.hasOwnProperty('many') && field.many == true)) {
        return;
    }
    //check if the type of the given field is a primitive data type
    //(a data type that is defined in the collection of data types)
    var conf = self.context.getConfiguration(),
        dataType = conf.dataTypes[field.type];
    if (_.isNil(dataType)) {
        return;
    }
    //get associated model name
    var name = self.name.concat(_.upperFirst(field.name));
    var primaryKey = self.key();
    return new DataAssociationMapping({
        "associationType": "junction",
        "associationAdapter": name,
        "cascade": "delete",
        "parentModel": self.name,
        "parentField": primaryKey.name,
        "refersTo": field.name
    });
}

/**
 * @ignore
 * @class
 * @augments QueryExpression
 */

var EmptyQueryExpression = function EmptyQueryExpression() {
    _classCallCheck(this, EmptyQueryExpression);
};

/**
 * @classdesc DataModel class extends a JSON data model and performs all data operations (select, insert, update and delete) in MOST Data Applications.
 <p>
     These JSON schemas are in config/models folder:
 </p>
 <pre class="prettyprint"><code>
 /
 + config
   + models
     - User.json
     - Group.json
     - Account.json
     ...
 </code></pre>
 <p class="pln">
 The following JSON schema presents a typical User model with fields, views, privileges, constraints, listeners, and seeding:
 </p>
 <pre class="prettyprint"><code>
 {
     "name": "User", "id": 90, "title": "Application Users", "inherits": "Account", "hidden": false, "sealed": false, "abstract": false, "version": "1.4",
     "fields": [
         {
             "name": "id", "title": "Id", "description": "The identifier of the item.",
             "type": "Integer",
             "nullable": false,
             "primary": true
         },
         {
             "name": "accountType",  "title": "Account Type", "description": "Contains a set of flags that define the type and scope of an account object.",
             "type": "Integer",
             "readonly":true,
             "value":"javascript:return 0;"
         },
         {
             "name": "lockoutTime", "title": "Lockout Time", "description": "The date and time that this account was locked out.",
             "type": "DateTime",
             "readonly": true
         },
         {
             "name": "logonCount", "title": "Logon Count", "description": "The number of times the account has successfully logged on.",
             "type": "Integer",
             "value": "javascript:return 0;",
             "readonly": true
         },
         {
             "name": "enabled", "title": "Enabled", "description": "Indicates whether a user is enabled or not.",
             "type": "Boolean",
             "nullable": false,
             "value": "javascript:return true;"
         },
         {
             "name": "lastLogon", "title": "Last Logon", "description": "The last time and date the user logged on.",
             "type": "DateTime",
             "readonly": true
         },
         {
             "name": "groups", "title": "User Groups", "description": "A collection of groups where user belongs.",
             "type": "Group",
             "expandable": true,
             "mapping": {
                 "associationAdapter": "GroupMembers", "parentModel": "Group",
                 "parentField": "id", "childModel": "User", "childField": "id",
                 "associationType": "junction", "cascade": "delete",
                 "select": [
                     "id",
                     "name",
                     "alternateName"
                 ]
             }
         },
         {
             "name": "additionalType",
             "value":"javascript:return this.model.name;",
             "readonly":true
         },
         {
             "name": "accountType",
             "value": "javascript:return 0;"
         }
     ], "privileges":[
         { "mask":1, "type":"self", "filter":"id eq me()" },
         { "mask":15, "type":"global", "account":"*" }
     ],
     "constraints":[
         {
             "description": "User name must be unique across different records.",
             "type":"unique",
             "fields": [ "name" ]
         }
     ],
     "views": [
         {
             "name":"list", "title":"Users", "fields":[
                 { "name":"id", "hidden":true },
                 { "name":"description" },
                 { "name":"name" },
                 { "name":"enabled" , "format":"yesno" },
                 { "name":"dateCreated", "format":"moment : 'LLL'" },
                 { "name":"dateModified", "format":"moment : 'LLL'" }
             ], "order":"dateModified desc"
         }
     ],
     "eventListeners": [
         { "name":"New User Credentials Provider", "type":"/app/controllers/user-credentials-listener" }
     ],
     "seed":[
         {
             "name":"anonymous",
             "description":"Anonymous User",
             "groups":[
                 { "name":"Guests" }
             ]
         },
         {
             "name":"admin@example.com",
             "description":"Site Administrator",
             "groups":[
                 { "name":"Administrators" }
             ]
         }
     ]
 }
 </code></pre>
 *
 * @class
 * @property {string} classPath - Gets or sets a string which represents the path of the DataObject subclass associated with this model.
 * @property {string} name - Gets or sets a string that represents the name of the model.
 * @property {number} id - Gets or sets an integer that represents the internal identifier of the model.
 * @property {boolean} hidden - Gets or sets a boolean that indicates whether the current model is hidden or not. The default value is false.
 * @property {string} title - Gets or sets a title for this data model.
 * @property {boolean} sealed - Gets or sets a boolean that indicates whether current model is sealed or not. A sealed model cannot be migrated.
 * @property {boolean} abstract - Gets or sets a boolean that indicates whether current model is an abstract model or not.
 * @property {string} version - Gets or sets the version of this data model.
 * @property {string} type - Gets or sets an internal type for this model.
 * @property {DataCachingType|string} caching - Gets or sets a string that indicates the caching type for this model. The default value is none.
 * @property {string} inherits - Gets or sets a string that contains the model that is inherited by the current model.
 * @property {DataField[]} fields - Gets or sets an array that represents the collection of model fields.
 * @property {DataModelEventListener[]} eventListeners - Gets or sets an array that represents the collection of model listeners.
 * @property {Array} constraints - Gets or sets the array of constraints which are defined for this model
 * @property {DataModelView[]} views - Gets or sets the array of views which are defined for this model
 * @property {DataModelPrivilege[]} privileges - Gets or sets the array of privileges which are defined for this model
 * @property {string} source - Gets or sets a string which represents the source database object for this model.
 * @property {string} view - Gets or sets a string which represents the view database object for this model.
 * @property {DataContext|*} - Gets or sets the data context of this model.
 * @property {DataField[]} attributes - Gets an array of DataField objects which represents the collection of model fields (including fields which are inherited from the base model).
 * @property {Array} seed - An array of objects which represents a collection of items to be seeded when the model is being generated for the first time
 * @constructor
 * @augments SequentialEventEmitter
 * @param {*=} obj An object instance that holds data model attributes. This parameter is optional.
 */
var DataModel = exports.DataModel = function (_SequentialEventEmitt) {
    _inherits(DataModel, _SequentialEventEmitt);

    function DataModel(obj) {
        _classCallCheck(this, DataModel);

        var _this = _possibleConstructorReturn(this, (DataModel.__proto__ || Object.getPrototypeOf(DataModel)).call(this));

        _this.hidden = false;
        _this.sealed = false;
        _this.abstract = false;
        _this.version = '0.1';
        _this.type = 'data';
        _this.caching = 'none';
        _this.fields = [];
        _this.eventListeners = [];
        _this.constraints = [];
        _this.views = [];
        _this.privileges = [];
        //extend model if obj parameter is defined
        if (obj) {
            if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') _.assign(_this, obj);
        }

        /**
         * Gets or sets the underlying data adapter
         * @type {DataContext}
         * @private
         */
        var context_ = null;
        var self = _this;
        Object.defineProperty(_this, 'context', { get: function get() {
                return context_;
            }, set: function set(value) {
                context_ = value;
            }, enumerable: false, configurable: false });

        Object.defineProperty(_this, 'sourceAdapter', { get: function get() {
                return _.isNil(self.source) ? self.name.concat('Base') : self.source;
            }, enumerable: false, configurable: false });

        Object.defineProperty(_this, 'viewAdapter', { get: function get() {
                return _.isNil(self.view) ? self.name.concat('Data') : self.view;
            }, enumerable: false, configurable: false });

        var silent_ = false;
        /**
         * Prepares a silent data operation (for query, update, insert, delete etc).
         * In a silent execution, permission check will be omitted.
         * Any other listeners which are prepared for using silent execution will use this parameter.
         * @param {Boolean=} value
         * @returns DataModel
         */
        _this.silent = function (value) {
            if (typeof value === 'undefined') silent_ = true;else silent_ = !!value;
            return this;
        };

        Object.defineProperty(_this, '$silent', { get: function get() {
                return silent_;
            }, enumerable: false, configurable: false });

        var pluralExpression = /([a-zA-Z]+?)([e']s|[^aiou]s)$/;
        /**
         * @type {Array}
         */
        var attributes = void 0;
        /**
         * @private
         */
        _this._clearAttributes = function () {
            attributes = null;
        };

        /**
         * Gets an array of objects that represents the collection of fields for this model.
         * This collection contains the fields defined in the current model and its parent.
         * @type {Array}
         *
         */
        Object.defineProperty(_this, 'attributes', { get: function get() {
                //validate self field collection
                if (typeof attributes !== 'undefined' && attributes != null) return attributes;
                //init attributes collection
                attributes = [];

                //get base model (if any)
                var baseModel = self.base();

                var field = void 0;
                //enumerate fields
                self.fields.forEach(function (x) {
                    if (typeof x.many === 'undefined') {
                        if (typeof self.context.getConfiguration().dataTypes[x.type] === 'undefined')
                            //set one-to-many attribute (based on a naming convention)
                            x.many = pluralExpression.test(x.name) || x.mapping && x.mapping.associationType === 'junction';else
                            //otherwise set one-to-many attribute to false
                            x.many = false;
                    }
                    //re-define field model attribute
                    if (typeof x.model === 'undefined') x.model = self.name;
                    var clone = x;
                    //if base model exists and current field is not primary key field
                    if (baseModel && !x.primary) {
                        //get base field
                        field = baseModel.field(x.name);
                        if (field) {
                            //clone field
                            clone = {};
                            //get all inherited properties
                            _.assign(clone, field);
                            //get all overridden properties
                            _.assign(clone, x);
                            //set field model
                            clone.model = field.model;
                            //set cloned attribute
                            clone.cloned = true;
                        }
                    }
                    //finally push field
                    attributes.push(clone);
                });
                if (baseModel) {
                    baseModel.attributes.forEach(function (x) {
                        if (!x.primary) {
                            //check if member is overridden by the current model
                            field = self.fields.find(function (y) {
                                return y.name == x.name;
                            });
                            if (typeof field === 'undefined') attributes.push(x);
                        }
                    });
                }
                return attributes;
            }, enumerable: false, configurable: false });
        /**
         * Gets the primary key name
         * @type String
        */
        _this.primaryKey = undefined;
        //local variable for DateModel.primaryKey
        var primaryKey_ = void 0;
        Object.defineProperty(_this, 'primaryKey', { get: function get() {
                return self.getPrimaryKey();
            }, enumerable: false, configurable: false });

        _this.getPrimaryKey = function () {
            if (typeof primaryKey_ !== 'undefined') {
                return primaryKey_;
            }
            var p = self.fields.find(function (x) {
                return x.primary == true;
            });
            if (p) {
                primaryKey_ = p.name;
                return primaryKey_;
            }
        };

        /**
         * Gets an array that contains model attribute names
         * @type Array
        */
        _this.attributeNames = undefined;
        Object.defineProperty(_this, 'attributeNames', { get: function get() {
                return self.attributes.map(function (x) {
                    return x.name;
                });
            }, enumerable: false, configurable: false });
        Object.defineProperty(_this, 'constraintCollection', { get: function get() {
                var arr = [];
                if (_.isArray(self.constraints)) {
                    //apend constraints to collection
                    self.constraints.forEach(function (x) {
                        arr.push(x);
                    });
                }
                //get base model
                var baseModel = self.base();
                if (baseModel) {
                    //get base model constraints
                    var baseArr = baseModel.constraintCollection;
                    if (_.isArray(baseArr)) {
                        //apend to collection
                        baseArr.forEach(function (x) {
                            arr.push(x);
                        });
                    }
                }
                return arr;
            }, enumerable: false, configurable: false });

        //register listeners
        registerListeners_.call(_this);
        //call initialize method
        if (typeof _this.initialize === 'function') _this.initialize();
        return _this;
    }

    /**
     * Initializes the current data model. This method is used for extending the behaviour of an install of DataModel class.
     */


    _createClass(DataModel, [{
        key: 'initialize',
        value: function initialize() {}
        //


        /**
         * Gets a string which represents the name of the database object that is going to be used while inserting, updating or deleting data objects
         * @returns {string}
         */

    }, {
        key: 'getSourceAdapter',
        value: function getSourceAdapter() {
            return _.isNil(this.source) ? this.name.concat('Base') : this.source;
        }

        /**
         * Gets a string which represents the name of the database object that is going to be used while selecting data objects.
         * @returns {string}
         */

    }, {
        key: 'getViewAdapter',
        value: function getViewAdapter() {
            return _.isNil(this.view) ? this.name.concat('Data') : this.view;
        }

        /**
         * Clones the current data model
         * @param {DataContext=} context - An instance of DataContext class which represents the current data context.
         * @returns {DataModel} Returns a new DataModel instance
         */

    }, {
        key: 'clone',
        value: function clone(context) {
            var result = new DataModel(this);
            if (context) result.context = context;
            return result;
        }
    }, {
        key: 'join',
        value: function join(model) {
            var result = new DataQueryable(this);
            return result.join(model);
        }

        /**
         * Initializes a where statement and returns an instance of DataQueryable class.
         * @param {String|*} attr - A string that represents the name of a field
         * @returns DataQueryable
        */

    }, {
        key: 'where',
        value: function where(attr) {
            var result = new DataQueryable(this);
            return result.where(attr);
        }

        /**
         * Initializes a full-text search statement and returns an instance of DataQueryable class.
         * @param {String} text - A string that represents the text to search for
         * @returns DataQueryable
         */

    }, {
        key: 'search',
        value: function search(text) {
            var result = new DataQueryable(this);
            return result.search(text);
        }

        /**
         * Returns a DataQueryable instance of the current model
         * @returns {DataQueryable}
         */

    }, {
        key: 'asQueryable',
        value: function asQueryable() {
            return new DataQueryable(this);
        }

        /**
         * Represents the callback function of DataQueryable.filter() method.
         * @callback DataModel~FilterCallback
         * @param {Error=} err
         * @param {DataQueryable} q
         */

        /**
         * Applies open data filter, ordering, grouping and paging params and returns a data queryable object
         * @param {String|{$filter:string=, $skip:number=, $levels:number=, $top:number=, $take:number=, $order:string=, $inlinecount:string=, $expand:string=,$select:string=, $orderby:string=, $group:string=, $groupby:string=}} params - A string that represents an open data filter or an object with open data parameters
         * @param {DataModel~FilterCallback} callback -  A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain an instance of DataQueryable class.
         * @example
         context.model('Order').filter(context.params, function(err,q) {
            if (err) { return callback(err); }
            q.take(10, function(err, result) {
                if (err) { return callback(err); }
                callback(null, result);
            });
         });
         */

    }, {
        key: 'filter',
        value: function filter(params, callback) {
            var self = this;
            var parser = new OpenDataParser();
            var $joinExpressions = [];
            var view = void 0;
            if (typeof params !== 'undefined' && params != null && typeof params.$select === 'string') {
                //split select
                var arr = params.$select.split(',');
                if (arr.length == 1) {
                    //try to get data view
                    view = self.getDataView(arr[0]);
                }
            }
            parser.resolveMember = function (member, cb) {
                if (view) {
                    var field = view.fields.find(function (x) {
                        return x.property === member;
                    });
                    if (field) {
                        member = field.name;
                    }
                }
                var attr = self.field(member);
                if (attr) member = attr.name;
                if (DataAttributeResolver.prototype.testNestedAttribute.call(self, member)) {
                    try {
                        var member1 = member.split("/");
                        var mapping = self.inferMapping(member1[0]);
                        var expr = void 0;
                        if (mapping && mapping.associationType === 'junction') {
                            var expr1 = DataAttributeResolver.prototype.resolveJunctionAttributeJoin.call(self, member);
                            expr = expr1.$expand;
                            //replace member expression
                            member = expr1.$select.$name.replace(/\./g, "/");
                        } else {
                            expr = DataAttributeResolver.prototype.resolveNestedAttributeJoin.call(self, member);
                        }
                        if (expr) {
                            var arrExpr = [];
                            if (_.isArray(expr)) arrExpr.push.apply(arrExpr, expr);else arrExpr.push(expr);
                            arrExpr.forEach(function (y) {
                                var joinExpr = $joinExpressions.find(function (x) {
                                    if (x.$entity && x.$entity.$as) {
                                        return x.$entity.$as === y.$entity.$as;
                                    }
                                    return false;
                                });
                                if (_.isNil(joinExpr)) $joinExpressions.push(y);
                            });
                        }
                    } catch (err) {
                        cb(err);
                        return;
                    }
                }
                if (typeof self.resolveMember === 'function') self.resolveMember.call(self, member, cb);else DataFilterResolver.prototype.resolveMember.call(self, member, cb);
            };
            parser.resolveMethod = function (name, args, cb) {
                if (typeof self.resolveMethod === 'function') self.resolveMethod.call(self, name, args, cb);else DataFilterResolver.prototype.resolveMethod.call(self, name, args, cb);
            };
            var filter = void 0;

            if (params instanceof DataQueryable && self.name === params.model.name) {
                var q = new DataQueryable(self);
                _.assign(q, params);
                _.assign(q.query, params.query);
                return callback(null, q);
            }

            if (typeof params === 'string') {
                filter = params;
            } else if ((typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object') {
                filter = params.$filter;
            }

            try {
                parser.parse(filter, function (err, query) {
                    if (err) {
                        callback(err);
                    } else {
                        (function () {
                            //create a DataQueryable instance
                            var q = new DataQueryable(self);
                            q.query.$where = query;
                            if ($joinExpressions.length > 0) q.query.$expand = $joinExpressions;
                            //prepare
                            q.query.prepare();

                            if ((typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object') {
                                //apply query parameters
                                var select = params.$select,
                                    skip = params.$skip || 0,
                                    orderBy = params.$orderby || params.$order,
                                    groupBy = params.$groupby || params.$group,
                                    expand = params.$expand,
                                    levels = parseInt(params.$levels),
                                    top = params.$top || params.$take;
                                //select fields
                                if (typeof select === 'string') {
                                    q.select.apply(q, select.split(',').map(function (x) {
                                        return x.replace(/^\s+|\s+$/g, '');
                                    }));
                                }
                                //apply group by fields
                                if (typeof groupBy === 'string') {
                                    q.groupBy.apply(q, groupBy.split(',').map(function (x) {
                                        return x.replace(/^\s+|\s+$/g, '');
                                    }));
                                }
                                if (typeof levels === 'number' && !isNaN(levels)) {
                                    //set expand levels
                                    q.levels(levels);
                                }
                                //set $skip
                                q.skip(skip);
                                if (top) q.query.take(top);
                                //set $orderby
                                if (orderBy) {
                                    orderBy.split(',').map(function (x) {
                                        return x.replace(/^\s+|\s+$/g, '');
                                    }).forEach(function (x) {
                                        if (/\s+desc$/i.test(x)) {
                                            q.orderByDescending(x.replace(/\s+desc$/i, ''));
                                        } else if (/\s+asc/i.test(x)) {
                                            q.orderBy(x.replace(/\s+asc/i, ''));
                                        } else {
                                            q.orderBy(x);
                                        }
                                    });
                                }
                                if (expand) {

                                    var resolver = require("./expand-resolver");
                                    var matches = resolver.testExpandExpression(expand);
                                    if (matches && matches.length > 0) {
                                        q.expand.apply(q, matches);
                                    }
                                }
                                //return
                                callback(null, q);
                            } else {
                                //and finally return DataQueryable instance
                                callback(null, q);
                            }
                        })();
                    }
                });
            } catch (e) {
                return callback(e);
            }
        }

        /**
         * Prepares a data query with the given object as parameters and returns the equivalent DataQueryable instance
         * @param {*} obj - An object which represents the query parameters
         * @returns DataQueryable - An instance of DataQueryable class that represents a data query based on the given parameters.
         * @example
         context.model('Order').find({ "paymentMethod":1 }).orderBy('dateCreated').take(10, function(err,result) {
            if (err) { return callback(err); }
            return callback(null, result);
         });
         */

    }, {
        key: 'find',
        value: function find(obj) {
            var self = this;
            var result = void 0;
            if (_.isNil(obj)) {
                result = new DataQueryable(this);
                result.where(self.primaryKey).equal(null);
                return result;
            }
            //cast object
            var find = {};
            self.attributeNames.forEach(function (x) {
                if (obj.hasOwnProperty(x)) {
                    find[x] = obj[x];
                }
            });

            if (find.hasOwnProperty(self.primaryKey)) {
                result = new DataQueryable(this);
                return result.where(self.primaryKey).equal(find[self.primaryKey]);
            } else {
                result = new DataQueryable(this);
                var bQueried = false;
                //enumerate properties and build query
                for (var key in find) {
                    if (find.hasOwnProperty(key)) {
                        if (!bQueried) {
                            result.where(key).equal(find[key]);
                            bQueried = true;
                        } else result.and(key).equal(find[key]);
                    }
                }
                if (!bQueried) {
                    //there is no query defined a dummy one (e.g. primary key is null)
                    result.where(self.primaryKey).equal(null);
                }
                return result;
            }
        }

        /**
         * Selects the given attribute or attributes and return an instance of DataQueryable class
         * @param {...string} attr - An array of fields, a field or a view name
         * @returns {DataQueryable}
         */

    }, {
        key: 'select',
        value: function select(attr) {
            var result = new DataQueryable(this);
            return result.select.apply(result, Array.prototype.slice.call(arguments));
        }

        /**
         * Prepares an ascending order by expression and returns an instance of DataQueryable class.
         * @param {string|*} attr - A string that is going to be used in this expression.
         * @returns DataQueryable
         * @example
         context.model('Person').orderBy('givenName').list().then(function(result) {
            done(null, result);
         }).catch(function(err) {
            done(err);
         });
        */

    }, {
        key: 'orderBy',
        value: function orderBy(attr) {
            var result = new DataQueryable(this);
            return result.orderBy(attr);
        }

        /**
         * Takes an array of maximum [n] items.
         * @param {Number} n - The maximum number of items that is going to be retrieved
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns DataQueryable|undefined If callback parameter is missing then returns a DataQueryable object.
         */

    }, {
        key: 'take',
        value: function take(n, callback) {
            n = n || 25;
            var result = new DataQueryable(this);
            if (typeof callback === 'undefined') return result.take(n);
            result.take(n, callback);
        }

        /**
         * Returns an instance of DataResultSet of the current model.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {Promise<T>|*} If callback parameter is missing then returns a Promise object.
         * @deprecated Use DataModel.asQueryable().list().
         * @example
         context.model('User').list(function(err, result) {
            if (err) { return done(err); }
            return done(null, result);
         });
         */

    }, {
        key: 'list',
        value: function list(callback) {
            var result = new DataQueryable(this);
            return result.list(callback);
        }

        /**
         * Returns the first item of the current model.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {Promise<T>|*} If callback parameter is missing then returns a Promise object.
         * @deprecated Use DataModel.asQueryable().first().
         * @example
         context.model('User').first(function(err, result) {
            if (err) { return done(err); }
            return done(null, result);
         });
        */

    }, {
        key: 'first',
        value: function first(callback) {
            var result = new DataQueryable(this);
            return result.select(this.attributeNames).first(callback);
        }

        /**
         * A helper function for getting an object based on the given primary key value
         * @param {String|*} key - The primary key value to search for.
         * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result, if any.
         * @returns {Deferred|*} If callback parameter is missing then returns a Deferred object.
         * @example
         context.model('User').get(1).then(function(result) {
            return done(null, result);
        }).catch(function(err) {
            return done(err);
        });
         */

    }, {
        key: 'get',
        value: function get(key, callback) {
            var result = new DataQueryable(this);
            return result.where(this.primaryKey).equal(key).first(callback);
        }

        /**
         * Returns the last item of the current model based.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {Promise<T>|*} If callback parameter is missing then returns a Promise object.
         * @example
         context.model('User').last(function(err, result) {
            if (err) { return done(err); }
            return done(null, result);
         });
         */

    }, {
        key: 'last',
        value: function last(callback) {
            var result = new DataQueryable(this);
            return result.orderByDescending(this.primaryKey).select(this.attributeNames).first(callback);
        }

        /**
         * Returns all data items.
         * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result, if any.
        */

    }, {
        key: 'all',
        value: function all(callback) {
            var result = new DataQueryable(this);
            return result.select(this.attributeNames).all(callback);
        }

        /**
         * Bypasses a number of items based on the given parameter. This method is used in data paging operations.
         * @param {Number} n - The number of items to skip.
         * @returns DataQueryable
        */

    }, {
        key: 'skip',
        value: function skip(n) {
            var result = new DataQueryable(this);
            return result.skip(n);
        }

        /**
         * Prepares an descending order by expression and returns an instance of DataQueryable class.
         * @param {string|*} attr - A string that is going to be used in this expression.
         * @returns DataQueryable
         * @example
         context.model('Person').orderByDescending('givenName').list().then(function(result) {
            done(null, result);
         }).catch(function(err) {
            done(err);
         });
         */

    }, {
        key: 'orderByDescending',
        value: function orderByDescending(attr) {
            var result = new DataQueryable(this);
            return result.orderBy(attr);
        }

        /**
         * Returns the maximum value for a field.
         * @param {string} attr - A string that represents the name of the field.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {Promise<T>|*} If callback parameter is missing then returns a Promise object.
         */

    }, {
        key: 'max',
        value: function max(attr, callback) {
            var result = new DataQueryable(this);
            return result.max(attr, callback);
        }

        /**
         * Returns the minimum value for a field.
         * @param {string} attr - A string that represents the name of the field.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {Promise<T>|*} If callback parameter is missing then returns a Promise object.
         */

    }, {
        key: 'min',
        value: function min(attr, callback) {
            var result = new DataQueryable(this);
            return result.min(attr, callback);
        }

        /**
         * Gets a DataModel instance which represents the inherited data model of this item, if any.
         * @returns {DataModel}
         */

    }, {
        key: 'base',
        value: function base() {
            if (typeof this.inherits === 'undefined' || this.inherits == null) return null;
            if (typeof this.context === 'undefined' || this.context == null) throw new Error("The underlying data context cannot be empty.");
            return this.context.model(this.inherits);
        }

        /**
         * Converts an object or a collection of objects to the corresponding data object instance
         * @param {Array|*} obj
         * @param {boolean=} typeConvert - Forces property value conversion for each property based on field type.
         * @returns {DataObject|Array|*} - Returns an instance of DataObject (or an array of DataObject instances)
         *<p>
         This conversion of an anonymous object through DataModel.convert() may be overriden by subclassing DataObject
         and place this class in app/models folder of a MOST Data Appllication:
         </p>
         <pre class="prettyprint"><code>
         /
         + app
           + models
             + user-model.js
         </code></pre>
         <p>
         An example of user model subclassing (user-model.js):
         </p>
         <pre class="prettyprint"><code>
         var util = require('util'),
         md = require('most-data'),
         web = require('most-web');
          function UserModel(obj) {
            UserModel.super_.call(this, 'User', obj);
        }
         util.inherits(UserModel, md.classes.DataObject);
          UserModel.prototype.person = function (callback) {
            var self = this, context = self.context;
            try {
                //search person by user name
                return context.model('Person').where('user/name').equal(self.name).first(callback);
            }
            catch (err) {
                callback(err);
            }
        };
         if (typeof module !== 'undefined') module.exports = UserModel;
         </code></pre>
         @example
         //get User model
         var users = context.model('User');
         users.where('name').equal(context.user.name).first().then(function(result) {
            if (md.common.isNullOrUndefined(result)) {
                return done(new Error('User cannot be found'));
            }
            //convert result
            var user = users.convert(result);
            //get user's person
            user.person(function(err, result) {
                if (err) { return done(err); }
                if (md.common.isNullOrUndefined(result)) {
                    return done(new Error('Person cannot be found'));
                }
                console.log('Person: ' + JSON.stringify(result));
                done(null, result);
            });
        }).catch(function(err) {
           done(err);
        });
         */

    }, {
        key: 'convert',
        value: function convert(obj, typeConvert) {
            var self = this;
            if (_.isNil(obj)) return obj;
            /**
             * @constructor
             * @augments DataObject
             * @ignore
             */
            var DataObjectClass = self.context.getConfiguration().getStrategy(ModelClassLoaderStrategy).resolve(self);
            var src = void 0;
            if (_.isArray(obj)) {
                var _ret2 = function () {
                    var arr = [];
                    obj.forEach(function (x) {
                        if (typeof x !== 'undefined' && x != null) {
                            var o = new DataObjectClass();
                            if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object') {
                                _.assign(o, x);
                            } else {
                                src = {};src[self.primaryKey] = x;
                                _.assign(o, src);
                            }
                            if (typeConvert) convertInternal_.call(self, o);
                            o.context = self.context;
                            o.$$type = self.name;
                            arr.push(o);
                        }
                    });
                    return {
                        v: arr
                    };
                }();

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            } else {
                var result = new DataObjectClass();
                if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
                    _.assign(result, obj);
                } else {
                    src = {};src[self.primaryKey] = obj;
                    _.assign(result, src);
                }
                if (typeConvert) convertInternal_.call(self, result);
                result.context = self.context;
                result.$$type = self.name;
                return result;
            }
        }

        /**
         * Extracts an identifier from the given parameter.
         * If the parameter is an object then gets the identifier property, otherwise tries to convert the given parameter to an identifier
         * suitable for this model.
         * @param {*} obj
         * @returns {*|undefined}
         * @example
         var id = context.model('User').idOf({ id:1, "name":"anonymous"});
         */

    }, {
        key: 'idOf',
        value: function idOf(obj) {
            if (typeof obj === 'undefined') return;
            if (obj === null) return;
            if (typeof this.primaryKey === 'undefined' || this.primaryKey == null) return;
            if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') return obj[this.primaryKey];
            return obj;
        }

        /**
         * Casts the given object and returns an object that is going to be used against the underlying database.
         * @param {*} obj - The source object which is going to be cast
         * @param {number=} state - The state of the source object.
         * @returns {*} - Returns an object which is going to be against the underlying database.
         */

    }, {
        key: 'cast',
        value: function cast(obj, state) {
            return cast_.call(this, obj, state);
        }

        /**
         * Casts the given source object and returns a data object based on the current model.
         * @param {*} dest - The destination object
         * @param {*} src - The source object
         * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
         */

    }, {
        key: 'recast',
        value: function recast(dest, src, callback) {
            callback = callback || function () {};
            var self = this;
            if (_.isNil(src)) {
                callback();
                return;
            }
            if (_.isNil(dest)) {
                dest = {};
            }
            async.eachSeries(self.fields, function (field, cb) {
                try {
                    if (src.hasOwnProperty(field.name)) {
                        (function () {
                            //ensure db property removal
                            if (field.property && field.property !== field.name) delete dest[field.name];
                            var mapping = self.inferMapping(field.name),
                                name = field.property || field.name;
                            if (_.isNil(mapping)) {
                                //set destination property
                                dest[name] = src[field.name];
                                cb(null);
                            } else if (mapping.associationType === 'association') {

                                if (_typeof(dest[name]) === 'object' && dest[name]) {
                                    //check associated object
                                    if (dest[name][mapping.parentField] === src[field.name]) {
                                        //return
                                        cb(null);
                                    } else {
                                        //load associated item
                                        var associatedModel = self.context.model(mapping.parentModel);
                                        associatedModel.where(mapping.parentField).equal(src[field.name]).silent().first(function (err, result) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                dest[name] = result;
                                                //return
                                                cb(null);
                                            }
                                        });
                                    }
                                } else {
                                    //set destination property
                                    dest[name] = src[field.name];
                                    cb(null);
                                }
                            }
                        })();
                    } else {
                        cb(null);
                    }
                } catch (e) {
                    cb(e);
                }
            }, function (err) {
                callback(err);
            });
        }

        /**
         * Casts the given object and returns an object that was prepared for insert.
         * @param obj {*} - The object to be cast
         * @returns {*}
         */

    }, {
        key: 'new',
        value: function _new(obj) {
            return this.cast(obj);
        }

        /**
         * Saves the given object or array of objects
         * @param obj {*|Array}
         * @param callback {Function=} - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         * @example
         //save a new group (Sales)
         var group = { "description":"Sales Users", "name":"Sales" };
         context.model("Group").save(group).then(function() {
                console.log('A new group was created with ID ' + group.id);
                done();
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'save',
        value: function save(obj, callback) {
            var _this2 = this;

            if (typeof callback !== 'function') {
                var _ret4 = function () {
                    var d = Q.defer();
                    save_.call(_this2, obj, function (err, result) {
                        if (err) {
                            return d.reject(err);
                        }
                        d.resolve(result);
                    });
                    return {
                        v: d.promise
                    };
                }();

                if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
            } else {
                return save_.call(this, obj, callback);
            }
        }

        /**
         * Represents the callback function of DataQueryable.filter() method.
         * @callback DataModel~ObjectStateCallback
         * @param {Error=} err
         * @param {DataObjectState} state
         */

        /**
         * Infers the state of the given object.
         * @param {DataObject|*} obj - The source object
         * @param {DataModel~ObjectStateCallback} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @see DataObjectState
         */

    }, {
        key: 'inferState',
        value: function inferState(obj, callback) {
            var self = this;
            var e = { model: self, target: obj };
            DataStateValidatorListener.prototype.beforeSave(e, function (err) {
                //if error return error
                if (err) {
                    return callback(err);
                }
                //otherwise return the calucated state
                callback(null, e.state);
            });
        }

        /**
         * Gets an array of strings which contains the super types of this model e.g. User model may have ['Account','Thing'] as super types
         * @returns {Array}
         */

    }, {
        key: 'getSuperTypes',
        value: function getSuperTypes() {
            var result = [];
            var baseModel = this.base();
            while (baseModel != null) {
                result.unshift(baseModel.name);
                baseModel = baseModel.base();
            }
            return result;
        }

        /**
         * Updates an item or an array of items
         * @param obj {*|Array} - The item or the array of items to update
         * @param callback {Function=} - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         */

    }, {
        key: 'update',
        value: function update(obj, callback) {
            var _this3 = this;

            if (typeof callback !== 'function') {
                var _ret5 = function () {
                    var d = Q.defer();
                    update_.call(_this3, obj, function (err, result) {
                        if (err) {
                            return d.reject(err);
                        }
                        d.resolve(result);
                    });
                    return {
                        v: d.promise
                    };
                }();

                if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
            } else {
                return update_.call(this, obj, callback);
            }
        }

        /**
         * Inserts an item or an array of items
         * @param obj {*|Array} - The item or the array of items to update
         * @param callback {Function=} - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         */

    }, {
        key: 'insert',
        value: function insert(obj, callback) {
            var _this4 = this;

            if (typeof callback !== 'function') {
                var _ret6 = function () {
                    var d = Q.defer();
                    insert_.call(_this4, obj, function (err, result) {
                        if (err) {
                            return d.reject(err);
                        }
                        d.resolve(result);
                    });
                    return {
                        v: d.promise
                    };
                }();

                if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
            } else {
                return insert_.call(this, obj, callback);
            }
        }

        /**
         * Deletes the given object or array of objects
         * @param obj {*|Array} The item or the array of items to delete
         * @param callback {Function=} - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         * @example
         //remove group (Sales)
         var group = { "name":"Sales" };
         context.model("Group").remove(group).then(function() {
                done();
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'remove',
        value: function remove(obj, callback) {
            var _this5 = this;

            if (typeof callback !== 'function') {
                var _ret7 = function () {
                    var d = Q.defer();
                    remove_.call(_this5, obj, function (err, result) {
                        if (err) {
                            return d.reject(err);
                        }
                        d.resolve(result);
                    });
                    return {
                        v: d.promise
                    };
                }();

                if ((typeof _ret7 === 'undefined' ? 'undefined' : _typeof(_ret7)) === "object") return _ret7.v;
            } else {
                return remove_.call(this, obj, callback);
            }
        }

        /**
         * Ensures model data adapter.
         * @param callback
         * @private
         */

    }, {
        key: 'ensureModel',
        value: function ensureModel(callback) {
            var self = this;
            if (self.name == 'Migration') {
                //do nothing
                return callback();
            }
            //get migration model
            var migrationModel = self.context.model("migration");
            //ensure migration
            var version = _.isNil(self.version) ? '0.0' : self.version;
            migrationModel.where('appliesTo').equal(self.sourceAdapter).and('version').equal(version).count(function (err, result) {
                if (err) {
                    return callback(err);
                }
                if (result > 0) {
                    return callback();
                }
                self.migrate(callback);
            });
        }

        /**
         * Performing an automatic migration of current data model based on the current model's definition.
         * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         */

    }, {
        key: 'migrate',
        value: function migrate(callback) {
            var self = this;
            //cache: data model migration
            //prepare migration cache
            var conf = self.context.getConfiguration();
            conf.cache = conf.cache || {};
            conf.cache[self.name] = conf.cache[self.name] || {};
            if (conf.cache[self.name].version == self.version) {
                //model has already been migrated, so do nothing
                return callback();
            }
            //do not migrate sealed models
            if (self.sealed) {
                return callback();
            }
            var context = self.context;
            //do migration
            var fields = _.filter(self.attributes, function (x) {
                return self.name == x.model && !x.many;
            });

            if (fields == null || fields.length == 0) throw new Error("Migration is not valid for this model. The model has no fields.");
            var migration = new DataModelMigration();
            migration.add = _.map(fields, function (x) {
                return _.assign({}, x);
            });
            migration.version = self.version != null ? self.version : '0.0';
            migration.appliesTo = self.sourceAdapter;
            migration.model = self.name;
            migration.description = sprintf.sprintf('%s migration (version %s)', this.title, migration.version);
            if (context == null) throw new Error("The underlying data context cannot be empty.");

            //get all related models
            var models = [];
            // self.fields.filter(function(x) {
            //     return (!conf.dataTypes[x.type] && (self.name!=x.type));
            // }).forEach(function(x) {
            //     var m = context.model(x.type);
            //     if (m) {
            //         var m1 = models.find(function(y) {
            //             return y.name == m.name;
            //         });
            //     }
            // });
            var db = context.db;
            var baseModel = self.base();
            if (baseModel != null) {
                models.push(baseModel);
            }
            //validate associated models
            migration.add.forEach(function (x) {
                //validate mapping
                var mapping = self.inferMapping(x.name);
                if (mapping && mapping.associationType === 'association') {
                    if (mapping.childModel === self.name) {
                        //get parent model
                        var parentModel = self.context.model(mapping.parentModel),
                            attr = parentModel.getAttribute(mapping.parentField);
                        if (attr) {
                            if (attr.type === 'Counter') {
                                x.type = 'Integer';
                            } else {
                                x.type = attr.type;
                            }
                        }
                    }
                    migration.indexes.push({
                        name: "INDEX_" + migration.appliesTo.toUpperCase() + "_" + x.name.toUpperCase(),
                        columns: [x.name]
                    });
                } else if (x.indexed === true) {
                    migration.indexes.push({
                        name: "INDEX_" + migration.appliesTo.toUpperCase() + "_" + x.name.toUpperCase(),
                        columns: [x.name]
                    });
                }
            });

            //execute transaction
            db.executeInTransaction(function (tr) {
                if (models.length == 0) {
                    self.emit('before.upgrade', { model: self }, function (err) {
                        if (err) {
                            return tr(err);
                        }
                        db.migrate(migration, function (err) {
                            if (err) {
                                return tr(err);
                            }
                            if (migration['updated']) {
                                return tr();
                            }
                            //execute after migrate events
                            self.emit('after.upgrade', { model: self }, function (err) {
                                return tr(err);
                            });
                        });
                    });
                } else {
                    async.eachSeries(models, function (m, cb) {
                        if (m) {
                            m.migrate(cb);
                        } else {
                            return cb();
                        }
                    }, function (err) {
                        if (err) {
                            return tr(err);
                        }
                        self.emit('before.upgrade', { model: self }, function (err) {
                            if (err) {
                                return tr(err);
                            }
                            db.migrate(migration, function (err) {
                                if (err) {
                                    return tr(err);
                                }
                                if (migration['updated']) {
                                    return tr();
                                }
                                //execute after migrate events
                                self.emit('after.upgrade', { model: self }, function (err) {
                                    return tr(err);
                                });
                            });
                        });
                    });
                }
            }, function (err) {
                if (!err) {
                    //set migration info to configuration cache (conf.cache.model.version=[current version])
                    //cache: data model migration
                    conf.cache[self.name].version = self.version;
                }
                callback(err);
            });
        }

        /**
         * Gets an instance of DataField class which represents the primary key of this model.
         * @returns {DataField|*}
         */

    }, {
        key: 'key',
        value: function key() {
            return this.attributes.find(function (x) {
                return x.primary == true;
            });
        }

        /**
         * Gets an instance of DataField class based on the given name.
         * @param {String} name - The name of the field.
         * @return {DataField|*} - Returns a data field if exists. Otherwise returns null.
         */

    }, {
        key: 'field',
        value: function field(name) {
            if (typeof name !== 'string') return null;
            return this.attributes.find(function (x) {
                return x.name == name || x.property == name;
            });
        }

        /**
         *
         * @param {string|*} attr
         * @param {string=} alias
         * @returns {DataQueryable|QueryField|*}
         */

    }, {
        key: 'resolveField',
        value: function resolveField(attr, alias) {
            var q = new DataQueryable(this);
            return q.resolveField(attr, alias);
        }

        /**
         * Gets an instance of DataModelView class which represents a model view with the given name.
         * @param {string} name - A string that represents the name of the view.
         * @returns {DataModelView|undefined}
         *@example
         var view = context.model('Person').getDataView('summary');
         *
         */

    }, {
        key: 'getDataView',
        value: function getDataView(name) {
            var self = this;
            var re = new RegExp('^' + name.replace('$', '\$') + '$', 'ig');
            var view = _.find(self.views, function (x) {
                return re.test(x.name);
            });
            if (_.isNil(view)) {
                return _.assign(new DataModelView(self), {
                    "name": "default",
                    "title": "Default View",
                    "fields": self.attributes.map(function (x) {
                        return { "name": x.name };
                    })
                });
            }
            return _.assign(new DataModelView(self), view);
        }

        /**
         * Gets a field association mapping based on field attributes, if any. Otherwise returns null.
         * @param {string} name - The name of the field
         * @returns {DataAssociationMapping|undefined}
         */

    }, {
        key: 'inferMapping',
        value: function inferMapping(name) {
            var self = this;
            //ensure model cached mappings
            var conf = self.context.getConfiguration().model(self.name);
            if (typeof conf === "undefined" || conf == null) {
                return;
            }
            if (typeof conf.mappings_ === 'undefined') {
                conf.mappings_ = {};
            }
            if (typeof conf.mappings_[name] !== 'undefined') {
                if (conf.mappings_[name] instanceof DataAssociationMapping) return conf.mappings_[name];else return new DataAssociationMapping(conf.mappings_[name]);
            }
            var field = self.field(name);
            var result = void 0;
            if (!field) return null;
            if (field.mapping) {
                //if field model is different than the current model
                if (field.model !== self.name) {
                    //if field mapping is already associated with the current model
                    // (child or parent model is equal to the current model)
                    if (field.mapping.childModel === self.name || field.mapping.parentModel === self.name) {
                        //cache mapping
                        conf.mappings_[name] = new DataAssociationMapping(field.mapping);
                        //do nothing and return field mapping
                        return conf.mappings_[name];
                    }
                    //get super types
                    var superTypes = self.getSuperTypes();
                    //map an inherited association
                    //1. super model has a foreign key association with another model
                    //(where super model is the child or the parent model)
                    if (field.mapping.associationType === 'association') {
                        //create a new cloned association
                        result = new DataAssociationMapping(field.mapping);
                        //check super types
                        if (superTypes.indexOf(field.mapping.childModel) >= 0) {
                            //set child model equal to current model
                            result.childModel = self.name;
                        } else if (superTypes.indexOf(field.mapping.parentModel) >= 0) {
                            //set child model equal to current model
                            result.childModel = self.name;
                        } else {
                            //this is an exception
                            throw new DataError("EMAP", "An inherited data association cannot be mapped.");
                        }
                        //cache mapping
                        conf.mappings_[name] = result;
                        //and finally return the newly created DataAssociationMapping object
                        return result;
                    }
                    //2. super model has a junction (many-to-many association) with another model
                    //(where super model is the child or the parent model)
                    else if (field.mapping.associationType === 'junction') {
                            //create a new cloned association
                            result = new DataAssociationMapping(field.mapping);
                            if (superTypes.indexOf(field.mapping.childModel) >= 0) {
                                //set child model equal to current model
                                result.childModel = self.name;
                            } else if (superTypes.indexOf(field.mapping.parentModel) >= 0) {
                                //set parent model equal to current model
                                result.parentModel = self.name;
                            } else {
                                //this is an exception
                                throw new DataError("EMAP", "An inherited data association cannot be mapped.");
                            }
                            //cache mapping
                            conf.mappings_[name] = result;
                            //and finally return the newly created DataAssociationMapping object
                            return result;
                        }
                }
                //in any other case return the assocation mapping object
                if (field.mapping instanceof DataAssociationMapping) {
                    //cache mapping
                    conf.mappings_[name] = field.mapping;
                    //and return
                    return field.mapping;
                }
                result = _.assign(new DataAssociationMapping(), field.mapping);
                //cache mapping
                conf.mappings_[name] = result;
                //and return
                return result;
            } else {
                //get field model type
                var associatedModel = self.context.model(field.type);
                if (typeof associatedModel === 'undefined' || associatedModel == null) {
                    if (typeof field.many === 'boolean' && field.many) {
                        //validate primitive type mapping
                        var tagMapping = inferTagMapping_.call(self, field);
                        if (tagMapping) {
                            //apply data association mapping to definition
                            var definitionField = conf.fields.find(function (x) {
                                return x.name === field.name;
                            });
                            definitionField.mapping = field.mapping = tagMapping;
                            return new DataAssociationMapping(definitionField.mapping);
                        }
                    }
                    return null;
                }
                //in this case we have two possible associations. Junction or Foreign Key association
                //try to find a field that belongs to the associated model and holds the foreign key of this model.
                var associatedField = associatedModel.attributes.find(function (x) {
                    return x.type === self.name;
                });
                if (associatedField) {
                    if (associatedField.many) {
                        //return a data relation (parent model is the associated model)
                        result = new DataAssociationMapping({
                            parentModel: associatedModel.name,
                            parentField: associatedModel.primaryKey,
                            childModel: self.name,
                            childField: field.name,
                            associationType: 'association',
                            cascade: 'null'
                        });
                        //cache mapping
                        conf.mappings_[name] = result;
                        //and finally return mapping
                        return result;
                    } else {
                        //return a data relation (parent model is the current model)
                        result = new DataAssociationMapping({
                            parentModel: self.name,
                            parentField: self.primaryKey,
                            childModel: associatedModel.name,
                            childField: associatedField.name,
                            associationType: 'association',
                            cascade: 'null',
                            refersTo: field.property || field.name
                        });
                        //cache mapping
                        conf.mappings_[name] = result;
                        //and finally return mapping
                        return result;
                    }
                } else {

                    //validate pluralize
                    var re = new RegExp(DataModel.PluralExpression.source);
                    if (re.test(field.name) || field.many) {
                        //return a data junction
                        result = new DataAssociationMapping({
                            associationAdapter: self.name.concat(_.upperFirst(field.name)),
                            parentModel: self.name, parentField: self.primaryKey,
                            childModel: associatedModel.name,
                            childField: associatedModel.primaryKey,
                            associationType: 'junction',
                            cascade: 'delete'
                        });
                        //cache mapping
                        conf.mappings_[name] = result;
                        //and finally return mapping
                        return result;
                    } else {
                        result = new DataAssociationMapping({
                            parentModel: associatedModel.name,
                            parentField: associatedModel.primaryKey,
                            childModel: self.name,
                            childField: field.name,
                            associationType: 'association',
                            cascade: 'null'
                        });
                        //cache mapping
                        conf.mappings_[name] = result;
                        //and finally return mapping
                        return result;
                    }
                }
            }
        }

        /**
         * Validates the given object against validation rules which are defined either by the data type or the definition of each attribute
         <p>Read more about data validation <a href="DataValidatorListener.html">here</a>.</p>
         * @param {*} obj - The data object which is going to be validated
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise|*} - If callback parameter is missing then returns a Promise object.
         */

    }, {
        key: 'validateForUpdate',
        value: function validateForUpdate(obj, callback) {
            var _this6 = this;

            if (typeof callback !== 'function') {
                var _ret8 = function () {
                    var d = Q.defer();
                    validate_.call(_this6, obj, 2, function (err, result) {
                        if (err) {
                            return d.reject(err);
                        }
                        d.resolve(result);
                    });
                    return {
                        v: d.promise
                    };
                }();

                if ((typeof _ret8 === 'undefined' ? 'undefined' : _typeof(_ret8)) === "object") return _ret8.v;
            } else {
                return validate_.call(this, obj, callback);
            }
        }

        /**
         * Validates the given object against validation rules which are defined either by the data type or the definition of each attribute
         <p>Read more about data validation <a href="DataValidatorListener.html">here</a>.</p>
         * @param {*} obj - The data object which is going to be validated
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise|*} - If callback parameter is missing then returns a Promise object.
         <p>Read more about data validation <a href="DataValidationListener.html">here</a></p>
         */

    }, {
        key: 'validateForInsert',
        value: function validateForInsert(obj, callback) {
            var _this7 = this;

            if (typeof callback !== 'function') {
                var _ret9 = function () {
                    var d = Q.defer();
                    validate_.call(_this7, obj, 1, function (err, result) {
                        if (err) {
                            return d.reject(err);
                        }
                        d.resolve(result);
                    });
                    return {
                        v: d.promise
                    };
                }();

                if ((typeof _ret9 === 'undefined' ? 'undefined' : _typeof(_ret9)) === "object") return _ret9.v;
            } else {
                return validate_.call(this, obj, callback);
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
         .levels(2)
         .orderByDescending('dateCreated)
         .expand('customer')
         .getItems().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'levels',
        value: function levels(value) {
            var result = new DataQueryable(this);
            return result.levels(value);
        }

        /**
         * Gets an array of active models which are derived from this model.
         * @returns {Promise|*}
         * @example
         * context.model("Thing").getSubTypes().then(function(result) {
                console.log(JSON.stringify(result,null,4));
                return done();
            }).catch(function(err) {
                return done(err);
            });
         */

    }, {
        key: 'getSubTypes',
        value: function getSubTypes() {
            var self = this;
            var d = Q.defer();
            process.nextTick(function () {
                var migrations = self.context.model("Migration");
                if (_.isNil(migrations)) {
                    return d.resolve([]);
                }
                migrations.silent().select("model").groupBy("model").all().then(function (result) {
                    var conf = self.context.getConfiguration(),
                        arr = [];
                    result.forEach(function (x) {
                        var m = conf.getModelDefinition(x.model);
                        if (m && m.inherits === self.name) {
                            arr.push(m.name);
                        }
                    });
                    return d.resolve(arr);
                }).catch(function (err) {
                    return d.reject(err);
                });
            });
            return d.promise;
        }

        /**
         * Gets an attribute of this data model.
         * @param {string} name
         */

    }, {
        key: 'getAttribute',
        value: function getAttribute(name) {
            if (_.isNil(name)) {
                return;
            }
            if (typeof name !== 'string') {
                return;
            }
            return this.attributes.find(function (x) {
                return x.name === name;
            });
        }

        /**
         * Gets a collection of DataObject instances by executing the defined query.
         * @returns {Promise|*}
         */

    }, {
        key: 'getTypedItems',
        value: function getTypedItems() {
            var self = this,
                d = Q.defer();
            process.nextTick(function () {
                var q = new DataQueryable(self);
                q.getTypedItems().then(function (result) {
                    return d.resolve(result);
                }).catch(function (err) {
                    return d.reject(err);
                });
            });
            return d.promise;
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
                var q = new DataQueryable(self);
                q.getTypedList().then(function (result) {
                    return d.resolve(result);
                }).catch(function (err) {
                    return d.reject(err);
                });
            });
            return d.promise;
        }
    }]);

    return DataModel;
}(SequentialEventEmitter);

/**
 * @memberOf DataModel
 * @private
 */


function registerListeners_() {

    /**
     *
     * @type {DataModel|*}
     */
    var self = this;
    //register system event listeners
    self.removeAllListeners('before.save');
    self.removeAllListeners('after.save');
    self.removeAllListeners('before.remove');
    self.removeAllListeners('after.remove');
    self.removeAllListeners('before.execute');
    self.removeAllListeners('after.execute');
    self.removeAllListeners('after.upgrade');

    //0. Permission Event Listener
    var perms = require('./permission');
    //1. State validator listener
    self.on('before.save', DataStateValidatorListener.prototype.beforeSave);
    self.on('before.remove', DataStateValidatorListener.prototype.beforeRemove);
    //2. Default values Listener
    self.on('before.save', DefaultValueListener.prototype.beforeSave);
    //3. Calculated values listener
    self.on('before.save', CalculatedValueListener.prototype.beforeSave);

    //register before execute caching
    if (self.caching == 'always' || self.caching == 'conditional') {
        self.on('before.execute', DataCachingListener.prototype.beforeExecute);
        self.on('after.execute', DataCachingListener.prototype.afterExecute);
    }

    //migration listeners
    self.on('after.upgrade', DataModelCreateViewListener.prototype.afterUpgrade);
    self.on('after.upgrade', DataModelSeedListener.prototype.afterUpgrade);

    /**
     * change:8-Jun 2015
     * description: Set lookup default listeners as obsolete.
     */
    ////register lookup model listeners
    //if (this.type === 'lookup') {
    //    //after save (clear lookup caching)
    //    this.on('after.save', DataModelLookupCachingListener.afterSave);
    //    //after remove (clear lookup caching)
    //    this.on('after.remove', DataModelLookupCachingListener.afterRemove);
    //}
    //register configuration listeners
    if (self.eventListeners) {
        for (var i = 0; i < self.eventListeners.length; i++) {
            var listener = self.eventListeners[i];
            //get listener type (e.g. type: require('./custom-listener.js'))
            if (listener.type && !listener.disabled) {
                /**
                 * Load event listener from the defined type
                 * @type DataEventListener
                 */
                var m = self.context.getConfiguration().getStrategy(ListenerLoaderStrategy).resolve(listener);
                //if listener exports beforeSave function then register this as before.save event listener
                if (typeof m.beforeSave == 'function') self.on('before.save', m.beforeSave);
                //if listener exports afterSave then register this as after.save event listener
                if (typeof m.afterSave == 'function') self.on('after.save', m.afterSave);
                //if listener exports beforeRemove then register this as before.remove event listener
                if (typeof m.beforeRemove == 'function') self.on('before.remove', m.beforeRemove);
                //if listener exports afterRemove then register this as after.remove event listener
                if (typeof m.afterRemove == 'function') self.on('after.remove', m.afterRemove);
                //if listener exports beforeExecute then register this as before.execute event listener
                if (typeof m.beforeExecute == 'function') self.on('before.execute', m.beforeExecute);
                //if listener exports afterExecute then register this as after.execute event listener
                if (typeof m.afterExecute == 'function') self.on('after.execute', m.afterExecute);
                //if listener exports afterUpgrade then register this as after.upgrade event listener
                if (typeof m.afterUpgrade == 'function') self.on('after.upgrade', m.afterUpgrade);
            }
        }
    }
    //before execute
    self.on('before.execute', perms.DataPermissionEventListener.prototype.beforeExecute);
    //before save (validate permissions)
    self.on('before.save', perms.DataPermissionEventListener.prototype.beforeSave);
    //before remove (validate permissions)
    self.on('before.remove', perms.DataPermissionEventListener.prototype.beforeRemove);
}

/**
 * @memberOf DataModel
 * @private
 * @param {*} obj
 */
function convertInternal_(obj) {
    var self = this;

    //get type parsers (or default type parsers)
    var parsers = self.parsers || ParserUtils;

    var parser = void 0;
    var value = void 0;
    self.attributes.forEach(function (x) {
        value = obj[x.name];
        if (value) {
            //get parser for this type
            parser = parsers['parse'.concat(x.type)];
            //if a parser exists
            if (typeof parser === 'function')
                //parse value
                obj[x.name] = parser(value);else {
                //get mapping
                var mapping = self.inferMapping(x.name);
                if (mapping) {
                    if (mapping.associationType === 'association' && mapping.childModel === self.name) {
                        var associatedModel = self.context.model(mapping.parentModel);
                        if (associatedModel) {
                            if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
                                //set associated key value (e.g. primary key value)
                                convertInternal_.call(associatedModel, value);
                            } else {
                                var field = associatedModel.field(mapping.parentField);
                                if (field) {
                                    //parse raw value
                                    parser = parsers['parse'.concat(field.type)];
                                    if (typeof parser === 'function') obj[x.name] = parser(value);
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

/**
 * @param {*} obj
 * @param {number=} state
 * @returns {*}
 * @private
 */
function cast_(obj, state) {
    var self = this;
    if (obj == null) return {};
    if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj instanceof Array) {
        return obj.map(function (x) {
            return cast_.call(self, x, state);
        });
    } else {
        var _ret10 = function () {
            //ensure state (set default state to Insert=1)
            state = _.isNil(state) ? _.isNil(obj.$state) ? 1 : obj.$state : state;
            var result = {};
            var name = void 0;
            self.attributes.filter(function (x) {
                if (x.model !== self.name) {
                    return false;
                }
                return !x.readonly || x.readonly && typeof x.calculation !== 'undefined' && state == 2 || x.readonly && typeof x.value !== 'undefined' && state == 1 || x.readonly && typeof x.calculation !== 'undefined' && state == 1;
            }).filter(function (y) {
                /*
                change: 2016-02-27
                author:k.barbounakis@gmail.com
                description:exclude non editable attributes on update operation
                 */
                return y.state == 2 ? y.hasOwnProperty("editable") ? y.editable : true : true;
            }).forEach(function (x) {
                name = obj.hasOwnProperty(x.property) ? x.property : x.name;
                if (obj.hasOwnProperty(name)) {
                    var mapping = self.inferMapping(name);
                    if (_.isNil(mapping)) result[x.name] = obj[name];else if (mapping.associationType === 'association' && mapping.childModel === self.name) {
                        if (_typeof(obj[name]) === 'object' && obj[name] != null)
                            //set associated key value (e.g. primary key value)
                            result[x.name] = obj[name][mapping.parentField];else
                            //set raw value
                            result[x.name] = obj[name];
                    }
                }
            });
            return {
                v: result
            };
        }();

        if ((typeof _ret10 === 'undefined' ? 'undefined' : _typeof(_ret10)) === "object") return _ret10.v;
    }
}

/**
 * @param {*} obj
 * @param {number=} state
 * @returns {*}
 * @private
 */
function castForValidation_(obj, state) {
    var self = this;
    if (obj == null) return {};
    if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj instanceof Array) {
        return obj.map(function (x) {
            return castForValidation_.call(self, x, state);
        });
    } else {
        var _ret11 = function () {
            //ensure state (set default state to Insert=1)
            state = _.isNil(state) ? _.isNil(obj.$state) ? 1 : obj.$state : state;
            var result = {};
            var name = void 0;
            self.attributes.filter(function (x) {
                if (x.model !== self.name) {
                    if (ParserUtils.parseBoolean(x.cloned) == false) return false;
                }
                return !x.readonly || x.readonly && typeof x.calculation !== 'undefined' && state == 2 || x.readonly && typeof x.value !== 'undefined' && state == 1 || x.readonly && typeof x.calculation !== 'undefined' && state == 1;
            }).filter(function (y) {
                /*
                 change: 2016-02-27
                 author:k.barbounakis@gmail.com
                 description:exclude non editable attributes on update operation
                 */
                return y.state == 2 ? y.hasOwnProperty("editable") ? y.editable : true : true;
            }).forEach(function (x) {
                name = obj.hasOwnProperty(x.property) ? x.property : x.name;
                if (obj.hasOwnProperty(name)) {
                    var mapping = self.inferMapping(name);
                    if (_.isNil(mapping)) result[x.name] = obj[name];else if (mapping.associationType === 'association' && mapping.childModel === self.name) {
                        if (_typeof(obj[name]) === 'object' && obj[name] != null)
                            //set associated key value (e.g. primary key value)
                            result[x.name] = obj[name][mapping.parentField];else
                            //set raw value
                            result[x.name] = obj[name];
                    }
                }
            });
            return {
                v: result
            };
        }();

        if ((typeof _ret11 === 'undefined' ? 'undefined' : _typeof(_ret11)) === "object") return _ret11.v;
    }
}

/**
 *
 * @param {*|Array} obj
 * @param {Function} callback
 * @private
 */
function save_(obj, callback) {
    var self = this;
    if (typeof obj == 'undefined' || obj == null) {
        callback.call(self, null);
        return;
    }
    //ensure migration
    self.migrate(function (err) {
        if (err) {
            callback(err);return;
        }
        //do save
        var arr = [];
        if (_.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                arr.push(obj[i]);
            }
        } else arr.push(obj);
        var db = self.context.db;
        var res = [];
        db.executeInTransaction(function (cb) {
            async.eachSeries(arr, function (item, saveCallback) {
                saveSingleObject_.call(self, item, function (err, result) {
                    if (err) {
                        saveCallback.call(self, err);
                        return;
                    }
                    res.push(result.insertedId);
                    saveCallback.call(self, null);
                });
            }, function (err) {
                if (err) {
                    res = null;
                    cb(err);
                    return;
                }
                cb(null);
            });
        }, function (err) {
            callback.call(self, err, res);
        });
    });
}

/**
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function saveBaseObject_(obj, callback) {
    //ensure callback
    callback = callback || function () {};
    var self = this,
        base = self.base();
    //if obj is an array of objects throw exception (invoke callback with error)
    if (_.isArray(obj)) {
        callback.call(self, new Error('Invalid argument. Base object cannot be an array.'));
        return 0;
    }
    //if current model does not have a base model
    if (base == null) {
        //exit operation
        callback.call(self, null);
    } else {
        base.silent();
        //perform operation
        saveSingleObject_.call(base, obj, function (err, result) {
            callback.call(self, err, result);
        });
    }
}
/**
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function saveSingleObject_(obj, callback) {
    var self = this;
    callback = callback || function () {};
    if (obj == null) {
        callback.call(self);
        return;
    }
    if (_.isArray(obj)) {
        callback.call(self, new Error('Invalid argument. Source object cannot be an array.'));
        return 0;
    }
    if (obj.$state == 4) {
        return removeSingleObject_.call(self, obj, callback);
    }
    //get object state before any other operation
    var state = obj.$state ? obj.$state : obj[self.primaryKey] != null ? 2 : 1;
    var e = {
        model: self,
        target: obj,
        state: state
    };
    //register nested objects listener (before save)
    self.once('before.save', DataNestedObjectListener.prototype.beforeSave);
    //register data association listener (before save)
    self.once('before.save', DataObjectAssociationListener.prototype.beforeSave);
    //register data association listener
    self.once('after.save', DataObjectAssociationListener.prototype.afterSave);
    //register unique constraint listener at the end of listeners collection (before emit)
    self.once('before.save', UniqueConstraintListener.prototype.beforeSave);
    //register data validators at the end of listeners collection (before emit)
    self.once('before.save', DataValidatorListener.prototype.beforeSave);
    //register not null listener at the end of listeners collection (before emit)
    self.once('before.save', NotNullConstraintListener.prototype.beforeSave);
    //execute before update events
    self.emit('before.save', e, function (err) {
        //if an error occured
        if (err) {
            //invoke callback with error
            callback.call(self, err);
        }
        //otherwise execute save operation
        else {
                //save base object if any
                saveBaseObject_.call(self, e.target, function (err, result) {
                    if (err) {
                        callback.call(self, err);
                        return;
                    }
                    //if result is defined
                    if (result !== undefined)
                        //sync original object
                        _.assign(e.target, result);
                    //get db context
                    var db = self.context.db;
                    //create insert query
                    var target = self.cast(e.target, e.state);
                    var q = null;
                    var key = target[self.primaryKey];
                    if (e.state == 1) {
                        //create insert statement
                        q = QueryExpression.create().insert(target).into(self.sourceAdapter);
                    } else {
                        //create update statement
                        if (key) delete target[self.primaryKey];
                        if (Object.keys(target).length > 0) q = QueryExpression.create().update(self.sourceAdapter).set(target).where(self.primaryKey).equal(e.target[self.primaryKey]);else
                            //object does not have any properties other than primary key. do nothing
                            q = new EmptyQueryExpression();
                    }
                    if (q instanceof EmptyQueryExpression) {
                        if (key) target[self.primaryKey] = key;
                        //get updated object
                        self.recast(e.target, target, function (err) {
                            if (err) {
                                //and return error
                                callback.call(self, err);
                            } else {
                                //execute after update events
                                self.emit('after.save', e, function (err) {
                                    //and return
                                    return callback.call(self, err, e.target);
                                });
                            }
                        });
                    } else {
                        (function () {
                            var pm = e.model.field(self.primaryKey);
                            var nextIdentity = void 0;
                            var adapter = e.model.sourceAdapter;
                            //search if adapter has a nextIdentity function (also primary key must be a counter and state equal to insert)
                            if (pm.type === 'Counter' && typeof db.nextIdentity === 'function' && e.state == 1) {
                                nextIdentity = db.nextIdentity;
                            } else {
                                //otherwise use a dummy nextIdentity function
                                nextIdentity = function nextIdentity(a, b, callback) {
                                    return callback();
                                };
                            }
                            nextIdentity.call(db, adapter, pm.name, function (err, insertedId) {
                                if (err) {
                                    return callback.call(self, err);
                                }
                                if (insertedId) {
                                    //get object to insert
                                    if (q.$insert) {
                                        var o = q.$insert[adapter];
                                        if (o) {
                                            //set the generated primary key
                                            o[pm.name] = insertedId;
                                        }
                                    }
                                }
                                db.execute(q, null, function (err, result) {
                                    if (err) {
                                        callback.call(self, err);
                                    } else {
                                        if (key) target[self.primaryKey] = key;
                                        //get updated object
                                        self.recast(e.target, target, function (err) {
                                            if (err) {
                                                callback.call(self, err);
                                            } else {
                                                if (pm.type === 'Counter' && typeof db.nextIdentity !== 'function' && e.state == 1) {
                                                    //if data adapter contains lastIdentity function
                                                    var lastIdentity = db.lastIdentity || function (lastCallback) {
                                                        if (_.isNil(result)) lastCallback(null, { insertId: null });
                                                        lastCallback(null, result);
                                                    };
                                                    lastIdentity.call(db, function (err, lastResult) {
                                                        if (lastResult) if (lastResult.insertId) e.target[self.primaryKey] = lastResult.insertId;
                                                        //raise after save listeners
                                                        self.emit('after.save', e, function (err) {
                                                            //invoke callback
                                                            callback.call(self, err, e.target);
                                                        });
                                                    });
                                                } else {
                                                    //raise after save listeners
                                                    self.emit('after.save', e, function (err) {
                                                        //invoke callback
                                                        callback.call(self, err, e.target);
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            });
                        })();
                    }
                });
            }
    });
}

/**
 * @param {*|Array} obj
 * @param {Function} callback
 * @private
 */
function update_(obj, callback) {
    var self = this;
    //ensure callback
    callback = callback || function () {};
    if (obj == null || obj === undefined) {
        callback.call(self, null);
    }
    //set state
    if (_.isArray(obj)) {
        obj.forEach(function (x) {
            x['$state'] = 2;
        });
    } else {
        obj['$state'] = 2;
    }
    self.save(obj, callback);
}

/**
 * @param {*|Array} obj
 * @param {Function} callback
 * @private
 */
function insert_(obj, callback) {
    var self = this;
    //ensure callback
    callback = callback || function () {};
    if (obj == null || obj === undefined) {
        callback.call(self, null);
    }
    //set state
    if (_.isArray(obj)) {
        obj.forEach(function (x) {
            x['$state'] = 1;
        });
    } else {
        obj['$state'] = 1;
    }
    self.save(obj, callback);
}

/**
 *
 * @param {*|Array} obj
 * @param {Function} callback
 * @private
 */
function remove_(obj, callback) {
    var self = this;
    if (obj == null) {
        callback.call(self, null);
        return;
    }

    self.migrate(function (err) {
        if (err) {
            callback(err);return;
        }
        var arr = [];
        if (_.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                arr.push(obj[i]);
            }
        } else arr.push(obj);
        //delete objects
        var db = self.context.db;
        db.executeInTransaction(function (cb) {
            async.eachSeries(arr, function (item, removeCallback) {
                removeSingleObject_.call(self, item, function (err) {
                    if (err) {
                        removeCallback.call(self, err);
                        return;
                    }
                    removeCallback.call(self, null);
                });
            }, function (err) {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null);
            });
        }, function (err) {
            callback.call(self, err);
        });
    });
}

/**
 * @param {Object} obj
 * @param {Function} callback
 * @private
 */
function removeSingleObject_(obj, callback) {
    var self = this;
    callback = callback || function () {};
    if (obj == null) {
        callback.call(self);
        return;
    }
    if (_.isArray(obj)) {
        callback.call(self, new Error('Invalid argument. Object cannot be an array.'));
        return 0;
    }
    var e = {
        model: self,
        target: obj,
        state: 4
    };
    //register nested objects listener
    self.once('before.remove', DataNestedObjectListener.prototype.beforeRemove);
    //register data association listener
    self.once('before.remove', DataObjectAssociationListener.prototype.afterSave);
    //execute before update events
    self.emit('before.remove', e, function (err) {
        //if an error occurred
        if (err) {
            //invoke callback with error
            return callback(err);
        }
        //get db context
        var db = self.context.db;
        //create delete query
        var q = QueryExpression.create().delete(self.sourceAdapter).where(self.primaryKey).equal(obj[self.primaryKey]);
        //execute delete query
        db.execute(q, null, function (err) {
            if (err) {
                return callback(err);
            }
            //remove base object
            removeBaseObject_.call(self, e.target, function (err, result) {
                if (err) {
                    return callback(err);
                }
                if (typeof result !== 'undefined' && result != null) {
                    _.assign(e.target, result);
                }
                //execute after remove events
                self.emit('after.remove', e, function (err) {
                    //invoke callback
                    return callback(err, e.target);
                });
            });
        });
    });
}

/**
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function removeBaseObject_(obj, callback) {
    //ensure callback
    callback = callback || function () {};
    var self = this,
        base = self.base();
    //if obj is an array of objects throw exception (invoke callback with error)
    if (_.isArray(obj)) {
        callback.call(self, new Error('Invalid argument. Object cannot be an array.'));
        return 0;
    }
    //if current model does not have a base model
    if (_.isNil(base)) {
        //exit operation
        callback.call(self, null);
    } else {
        base.silent();
        //perform operation
        removeSingleObject_.call(base, obj, function (err, result) {
            callback.call(self, err, result);
        });
    }
}

/**
 * Validates that the given string is plural or not.
 * @param s {string}
 * @returns {boolean}
 * @private
 */
DataModel.PluralExpression = /([a-zA-Z]+?)([e']s|[^aiou]s)$/;

/**
 * @param {DataField|*} field
 * @param {DataAssociationMapping|*} mapping
 * @private
 */
function cacheMapping_(field, mapping) {
    if (_.isNil(field)) return;
    //cache mapping
    var cachedModel = this.getConfiguration().models[this.name];
    if (cachedModel) {
        var cachedField = cachedModel.fields.find(function (x) {
            return x.name === field.name;
        });
        if (typeof cachedField === 'undefined') {
            //search in attributes
            cachedField = this.attributes.find(function (x) {
                return x.name === field.name;
            });
            if (cachedField) {
                //add overriden field
                cachedModel.fields.push(_.assign({}, cachedField));
                cachedField = cachedModel.fields[cachedModel.fields.length - 1];
                //clear attributes
                this._clearAttributes();
            }
        }
        if (cachedField)
            //add mapping
            cachedField.mapping = mapping;
    }
}

/**
 * @function
 * @param {*} obj
 * @param {number} state
 * @param {Function} callback
 * @private
 */
function validate_(obj, state, callback) {
    /**
     * @type {DataModel|*}
     */
    var self = this;
    if (_.isNil(obj)) {
        return callback();
    }
    //get object copy (based on the defined state)
    var objCopy = castForValidation_.call(self, obj, state);

    var attributes = self.attributes.filter(function (x) {
        if (x.model !== self.name) {
            if (!x.cloned) return false;
        }
        return !x.readonly || x.readonly && typeof x.calculation !== 'undefined' && state == 2 || x.readonly && typeof x.value !== 'undefined' && state == 1 || x.readonly && typeof x.calculation !== 'undefined' && state == 1;
    }).filter(function (y) {
        return state == 2 ? y.hasOwnProperty("editable") ? y.editable : true : true;
    });

    async.eachSeries(attributes, function (attr, cb) {
        var validator = void 0,
            validationResult = void 0;
        //get value
        var value = objCopy[attr.name];
        //build validators array
        var arrValidators = [];
        //-- RequiredValidator
        if (attr.hasOwnProperty('nullable') && !attr.nullable) {
            if (state == 1 && !attr.primary) {
                arrValidators.push(new RequiredValidator());
            } else if (state == 2 && !attr.primary && objCopy.hasOwnProperty(attr.name)) {
                arrValidators.push(new RequiredValidator());
            }
        }
        //-- MaxLengthValidator
        if (attr.hasOwnProperty('size') && objCopy.hasOwnProperty(attr.name)) {
            if (!(attr.validation && attr.validation.maxLength)) arrValidators.push(new MaxLengthValidator(attr.size));
        }
        //-- CustomValidator
        if (attr.validation && attr.validation['validator'] && objCopy.hasOwnProperty(attr.name)) {
            var validatorModule = void 0;
            try {
                if (/^\./ig.test(attr.validation['validator'])) {
                    var modulePath = PathUtils.join(self.context.getConfiguration().getExecutionPath(), attr.validation['validator']);
                    validatorModule = require(modulePath);
                } else {
                    validatorModule = require(attr.validation['validator']);
                }
            } catch (e) {
                TraceUtils.debug(sprintf.sprintf("Data validator module (%s) cannot be loaded", attr.validation.type));
                TraceUtils.debug(e);
                return cb(e);
            }
            if (typeof validatorModule.createInstance !== 'function') {
                TraceUtils.debug(sprintf.sprintf("Data validator module (%s) does not export createInstance() method.", attr.validation.type));
                return cb(new Error("Invalid data validator type."));
            }
            arrValidators.push(validatorModule.createInstance(attr));
        }
        //-- DataTypeValidator #1
        if (attr.validation && objCopy.hasOwnProperty(attr.name)) {
            if (typeof attr.validation.type === 'string') {
                arrValidators.push(new DataTypeValidator(attr.validation.type));
            } else {
                //convert validation data to pseudo type declaration
                var validationProperties = {
                    properties: attr.validation
                };
                arrValidators.push(new DataTypeValidator(validationProperties));
            }
        }
        //-- DataTypeValidator #2
        if (attr.type && objCopy.hasOwnProperty(attr.name)) {
            arrValidators.push(new DataTypeValidator(attr.type));
        }

        if (arrValidators.length == 0) {
            return cb();
        }
        //do validation
        async.eachSeries(arrValidators, function (validator, cb) {

            //set context
            if (typeof validator.setContext === 'function') {
                validator.setContext(self.context);
            }
            //set target
            validator.target = obj;
            if (typeof validator.validateSync === 'function') {
                validationResult = validator.validateSync(value);
                if (validationResult) {
                    return cb(new DataError(validationResult.code || "EVALIDATE", validationResult.message, validationResult.innerMessage, self.name, attr.name));
                } else {
                    return cb();
                }
            } else if (typeof validator.validate === 'function') {
                return validator.validate(value, function (err, validationResult) {
                    if (err) {
                        return cb(err);
                    }
                    if (validationResult) {
                        return cb(new DataError(validationResult.code || "EVALIDATE", validationResult.message, validationResult.innerMessage, self.name, attr.name));
                    }
                    return cb();
                });
            } else {
                TraceUtils.debug(sprintf.sprintf("Data validator (%s) does not have either validate() or validateSync() methods.", attr.validation.type));
                return cb(new Error("Invalid data validator type."));
            }
        }, function (err) {
            return cb(err);
        });
    }, function (err) {
        return callback(err);
    });
}
//# sourceMappingURL=model.js.map
