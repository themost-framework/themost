'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HasTagAssociation = exports.HasManyToManyAssociation = exports.HasManyToOneAssociation = exports.HasOneToManyAssociation = exports.DataObjectAssociationListener = exports.HasAssociation = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _types = require('./types');

var ParserUtils = _types.ParserUtils;
var DataAssociationMapping = _types.DataAssociationMapping;

var _lodash = require('lodash');

var _ = _lodash._;

var _queryable = require('./queryable');

var DataQueryable = _queryable.DataQueryable;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

var _query = require('@themost/query/query');

var QueryExpression = _query.QueryExpression;
var QueryFieldUtils = _query.QueryFieldUtils;

var _errors = require('@themost/common/errors');

var AbstractMethodError = _errors.AbstractMethodError;
var AbstractClassError = _errors.AbstractClassError;
var DataError = _errors.DataError;
var DataNotFoundError = _errors.DataNotFoundError;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var parentProperty = Symbol('parent');
var modelProperty = Symbol('model');
var baseModelProperty = Symbol('basemodel');
var mappingProperty = Symbol('model');
var queryProperty = Symbol('query');
/**
 * @class
 * @abstract
 * @augments DataQueryable
 */

var HasAssociation = exports.HasAssociation = function (_DataQueryable) {
    _inherits(HasAssociation, _DataQueryable);

    function HasAssociation(obj, associationMapping) {
        _classCallCheck(this, HasAssociation);

        var _this = _possibleConstructorReturn(this, (HasAssociation.__proto__ || Object.getPrototypeOf(HasAssociation)).call(this));

        Args.check(new.target !== HasAssociation, new AbstractClassError());
        //validate parent object
        Args.notNull(obj, 'Parent object');
        //set parent
        _this[parentProperty] = obj;

        if (_.isString(associationMapping)) {
            //query mapping based on the given name
            if (_.isObject(_this.getParent())) {
                var model = _this.getParent().getModel();
                if (_.isObject(model)) _this[mappingProperty] = model.inferMapping(associationMapping);
            }
        } else if (_.isObject(associationMapping)) {
            //get the specified mapping
            if (associationMapping instanceof DataAssociationMapping) _this[mappingProperty] = associationMapping;else _this[mappingProperty] = _.assign(new DataAssociationMapping(), associationMapping);
        }
        return _this;
    }

    /**
     * Gets the source object of this association.
     * @returns {DataObject|*}
     */


    _createClass(HasAssociation, [{
        key: 'getParent',
        value: function getParent() {
            return this[parentProperty];
        }

        /**
         * Gets the definition of this association.
         * @returns {DataAssociationMapping}
         */

    }, {
        key: 'getMapping',
        value: function getMapping() {
            return this[mappingProperty];
        }

        /**
         * @abstract
         */

    }, {
        key: 'query',
        get: function get() {
            throw new AbstractMethodError();
        }

        /**
         * @abstract
         */

    }, {
        key: 'model',
        get: function get() {
            throw new AbstractMethodError();
        }
    }]);

    return HasAssociation;
}(DataQueryable);

/**
 * @class
 */


var DataObjectAssociationListener = exports.DataObjectAssociationListener = function () {
    function DataObjectAssociationListener() {
        _classCallCheck(this, DataObjectAssociationListener);
    }

    _createClass(DataObjectAssociationListener, [{
        key: 'beforeSave',

        /**
         *
         * @param {DataEventArgs} e
         * @param {Function} callback
         */
        value: function beforeSave(e, callback) {
            try {
                if (_.isNil(e.target)) {
                    return callback();
                } else {
                    (function () {
                        var keys = Object.keys(e.target);
                        var mappings = [];
                        keys.forEach(function (x) {
                            if (e.target.hasOwnProperty(x) && _typeof(e.target[x]) === 'object' && e.target[x] != null) {
                                //try to find field mapping, if any
                                var _mapping = e.model.inferMapping(x);
                                if (_mapping && _mapping.associationType === 'association' && _mapping.childModel === e.model.name) mappings.push(_mapping);
                            }
                        });
                        async.eachSeries(mappings,
                        /**
                         * @param {DataAssociationMapping} mapping
                         * @param {Function} cb
                         */
                        function (mapping, cb) {
                            if (mapping.associationType === 'association' && mapping.childModel === e.model.name) {
                                var _ret2 = function () {
                                    /**
                                     * @type {DataField|*}
                                     */
                                    var field = e.model.field(mapping.childField),
                                        childField = field.property || field.name;
                                    //foreign key association
                                    if (_typeof(e.target[childField]) !== 'object') {
                                        return {
                                            v: cb()
                                        };
                                    }
                                    if (e.target[childField].hasOwnProperty(mapping.parentField)) {
                                        return {
                                            v: cb()
                                        };
                                    }
                                    //change:21-Mar 2016
                                    //description: check if association belongs to this model or it's inherited from any base model
                                    //if current association belongs to base model
                                    if (e.model.name !== field.model && !ParserUtils.parseBoolean(field.cloned)) {
                                        //do nothing and exit
                                        return {
                                            v: cb()
                                        };
                                    }

                                    //get associated mode
                                    var associatedModel = e.model.context.model(mapping.parentModel);

                                    var er = void 0;
                                    associatedModel.find(e.target[childField]).select(mapping.parentField).silent().flatten().take(1).list(function (err, result) {
                                        if (err) {
                                            cb(err);
                                        } else if (_.isNil(result)) {
                                            er = new Error('An associated object cannot be found.');er.code = 'EDATA';er.model = associatedModel.name;
                                            cb(er);
                                        } else if (result.total == 0) {
                                            er = new Error('An associated object cannot be found.');er.code = 'EDATA';er.model = associatedModel.name;
                                            cb(er);
                                        } else if (result.total > 1) {
                                            er = new Error('An associated object is defined more than once and cannot be bound.');er.code = 'EDATA';er.model = associatedModel.name;
                                            cb(er);
                                        } else {
                                            e.target[childField][mapping.parentField] = result.records[0][mapping.parentField];
                                            cb();
                                        }
                                    });
                                }();

                                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
                            } else {
                                cb();
                            }
                        }, function (err) {
                            callback(err);
                        });
                    })();
                }
            } catch (e) {
                callback(e);
            }
        }

        /**
         *
         * @param {DataEventArgs} event
         * @param {Function} callback
         */

    }, {
        key: 'afterSave',
        value: function afterSave(event, callback) {
            try {
                if (typeof event.target === 'undefined' || event.target == null) {
                    callback(null);
                } else {
                    (function () {
                        var keys = Object.keys(event.target);
                        var mappings = [];
                        keys.forEach(function (x) {
                            if (event.target.hasOwnProperty(x)) {
                                /**
                                 * @type DataAssociationMapping
                                 */
                                var _mapping2 = event.model.inferMapping(x);
                                if (_mapping2) if (_mapping2.associationType == 'junction') {
                                    mappings.push({ name: x, mapping: _mapping2 });
                                }
                            }
                        });
                        async.eachSeries(mappings,
                        /**
                         * @param {{name:string,mapping:DataAssociationMapping}} x
                         * @param {Function} cb
                         */
                        function (x, cb) {
                            if (x.mapping.associationType == 'junction') {
                                var _ret4 = function () {
                                    var obj = event.model.convert(event.target);

                                    /**
                                     * @type {*|{deleted:Array}}
                                     */
                                    var childs = obj[x.name];

                                    var junction = void 0;
                                    if (!_.isArray(childs)) {
                                        return {
                                            v: cb()
                                        };
                                    }
                                    if (x.mapping.childModel === event.model.name) {
                                        var HasParentJunction = require('./has-parent-junction').HasParentJunction;
                                        junction = new HasParentJunction(obj, x.mapping);
                                        if (event.model.$silent) {
                                            junction.getBaseModel().silent();
                                        }
                                        if (event.state == 1 || event.state == 2) {
                                            (function () {
                                                var toBeRemoved = [],
                                                    toBeInserted = [];
                                                _.forEach(childs, function (x) {
                                                    if (x.$state == 4) {
                                                        toBeRemoved.push(x);
                                                    } else {
                                                        toBeInserted.push(x);
                                                    }
                                                });
                                                junction.insert(toBeInserted, function (err) {
                                                    if (err) {
                                                        return cb(err);
                                                    }
                                                    junction.remove(toBeRemoved, function (err) {
                                                        if (err) {
                                                            return cb(err);
                                                        }
                                                        return cb();
                                                    });
                                                });
                                            })();
                                        } else {
                                            return {
                                                v: cb()
                                            };
                                        }
                                    } else if (x.mapping.parentModel === event.model.name) {

                                        if (event.state == 1 || event.state == 2) {
                                            var DataObjectJunction = require('./data-object-junction').DataObjectJunction,
                                                _HasTagAssociation = require('./data-object-tag').HasTagAssociation;

                                            if (typeof x.mapping.childModel === 'undefined') {
                                                var _ret6 = function () {
                                                    /**
                                                     * @type {HasTagAssociation}
                                                     */
                                                    var tags = new _HasTagAssociation(obj, x.mapping);
                                                    if (event.model.$silent) {
                                                        tags.getBaseModel().silent();
                                                    }
                                                    return {
                                                        v: {
                                                            v: tags.silent().all().then(function (result) {

                                                                var toBeRemoved = result.filter(function (x) {
                                                                    return childs.indexOf(x) < 0;
                                                                });
                                                                var toBeInserted = childs.filter(function (x) {
                                                                    return result.indexOf(x) < 0;
                                                                });
                                                                if (toBeRemoved.length > 0) {
                                                                    return tags.remove(toBeRemoved).then(function () {
                                                                        if (toBeInserted.length == 0) {
                                                                            return cb();
                                                                        }
                                                                        return tags.insert(toBeInserted).then(function () {
                                                                            return cb();
                                                                        });
                                                                    }).catch(function (err) {
                                                                        return cb(err);
                                                                    });
                                                                }
                                                                if (toBeInserted.length == 0) {
                                                                    return cb();
                                                                }
                                                                return tags.insert(toBeInserted).then(function () {
                                                                    return cb();
                                                                });
                                                            }).catch(function (err) {
                                                                return cb(err);
                                                            })
                                                        }
                                                    };
                                                }();

                                                if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
                                            } else {
                                                junction = new DataObjectJunction(obj, x.mapping);
                                                if (event.model.$silent) {
                                                    junction.getBaseModel().silent();
                                                }
                                                junction.insert(childs, function (err) {
                                                    if (err) {
                                                        return cb(err);
                                                    }
                                                    var toBeRemoved = [],
                                                        toBeInserted = [];
                                                    _.forEach(childs, function (x) {
                                                        if (x.$state == 4) {
                                                            toBeRemoved.push(x);
                                                        } else {
                                                            toBeInserted.push(x);
                                                        }
                                                    });
                                                    junction.insert(toBeInserted, function (err) {
                                                        if (err) {
                                                            return cb(err);
                                                        }
                                                        junction.remove(toBeRemoved, function (err) {
                                                            if (err) {
                                                                return cb(err);
                                                            }
                                                            return cb();
                                                        });
                                                    });
                                                });
                                            }
                                        } else {
                                            cb();
                                        }
                                    } else {
                                        cb();
                                    }
                                }();

                                if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
                            } else cb(null);
                        }, function (err) {
                            callback(err);
                        });
                    })();
                }
            } catch (err) {
                callback(err);
            }
        }
    }]);

    return DataObjectAssociationListener;
}();

/**
 * @classdesc Represents a one-to-many association between two models.
 <p>
 This association may be defined in a field of a data model as follows:
 </p>
 <pre class="prettyprint"><code>
 {
    "name": "Order", "id": 449, "title": "Order", "hidden": false, "sealed": false,
    "abstract": false, "version": "1.0",
    "fields": [
        ...
        {
            "name": "customer",
            "title": "Customer",
            "description": "Party placing the order.",
            "type": "Party"
        }
        ...
    ]
 }
 </code></pre>
 <p>
 where model Party has a one-to-many association with model Order.
 This association may also be defined in parent data model (Party) as follows:
 </p>
 <pre class="prettyprint"><code>
 {
    "name": "Party", ...,
    "fields": [
        ...
        {
            "name": "orders",
            "title": "Orders",
            "description": "A collection of orders made by the party (Persor or Organization).",
            "type": "Order",
            "many":true
        }
        ...
    ]
 }
 </code></pre>
 <p>
 where property orders of Party model defines an one-to-many association between Party and Order.
 HasOneToManyAssociation class inherits DataQueryable class for filtering, paging, grouping or orderind child items.
 </p>
 <pre class="prettyprint"><code>
 var parties = context.model('Party');
 parties.where('id').equal(327).first().then(function(result) {
        var party = parties.convert(result);
        party.property('orders')
            .select('id','orderedItem/name as productName','paymentDue')
            .where('paymentMethod/alternateName').equal('DirectDebit')
            .list().then(function(result) {
               done();
            }).catch(function(err) {
               done(err);
            });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 <pre class="prettyprint"><code>
 //Results:
 id  productName           paymentDue
 --  --------------------  -----------------------------
 6   Alienware X51 (2013)  2015-10-06 18:08:10.000+03:00
 7   LaCie Blade Runner    2015-06-16 22:38:52.000+03:00
 </code></pre>
 * @class
 * @augments DataQueryable
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */


var HasOneToManyAssociation = exports.HasOneToManyAssociation = function (_HasAssociation) {
    _inherits(HasOneToManyAssociation, _HasAssociation);

    /**
     * @constructor
     * @param {DataObject} obj - An instance of DataObject class which represents the parent data object
     * @param {string|*} associationMapping - A string that represents the name of the field which holds association mapping or the association mapping itself.
     */
    function HasOneToManyAssociation(obj, associationMapping) {
        _classCallCheck(this, HasOneToManyAssociation);

        return _possibleConstructorReturn(this, (HasOneToManyAssociation.__proto__ || Object.getPrototypeOf(HasOneToManyAssociation)).call(this, obj, associationMapping));
    }

    /**
     * @returns {DataModel}
     */


    _createClass(HasOneToManyAssociation, [{
        key: 'model',
        get: function get() {
            if (_.isNil(this[modelProperty])) {
                var _mapping3 = this.getMapping();
                Args.notNull(_mapping3, new Error('Data association mapping cannot be empty at this context.'));
                this[modelProperty] = this.getParent().getContext().model(_mapping3.childModel);
            }
            return this[modelProperty];
        }

        /**
         * @returns {QueryExpression}
         */

    }, {
        key: 'query',
        get: function get() {
            if (_.isNil(this[queryProperty])) {
                var _mapping4 = this.getMapping();
                Args.notNull(_mapping4, new Error('Data association cannot be empty at this context.'));
                //prepare query by selecting the foreign key of the related object
                var parent = this.getParent();
                Args.notNull(parent, new Error('Parent object cannot be empty at this context.'));
                this[queryProperty] = QueryExpression.create(this.model.getViewAdapter()).where(_mapping4.childField).equal(parent[_mapping4.parentField]).prepare();
            }
            return this[queryProperty];
        }
    }]);

    return HasOneToManyAssociation;
}(HasAssociation);

/**
 * @classdesc Represents a foreign key association between two models.
 <p>
 This association may be defined in a field of a data model as follows:
 </p>
 <pre class="prettyprint"><code>
 {
    "name": "Order", "id": 449, "title": "Order", "hidden": false, "sealed": false,
    "abstract": false, "version": "1.0",
    "fields": [
        ...
        {
            "name": "customer",
            "title": "Customer",
            "description": "Party placing the order.",
            "type": "Party"
        }
        ...
    ]
 }
 </code></pre>
 <p>
 where model Order has a foreign key association with model Party (Person or Organization).
 HasManyToOneAssociation class inherits DataQueryable class for selecting the associated item.
 </p>
 <pre class="prettyprint"><code>
 var orders = context.model('Order');
 orders.where('id').equal(145).first().then(function(result) {
        var order = orders.convert(result);
        order.property('customer')
            .first().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 * @class
 * @augments DataQueryable
 */


var HasManyToOneAssociation = exports.HasManyToOneAssociation = function (_HasAssociation2) {
    _inherits(HasManyToOneAssociation, _HasAssociation2);

    /**
     * @constructor
     * @param {DataObject} obj - An instance of DataObject class that represents the parent data object
     * @param {string|*} associationMapping A string that represents the name of the field which holds association mapping or the association mapping itself.
     */
    function HasManyToOneAssociation(obj, associationMapping) {
        _classCallCheck(this, HasManyToOneAssociation);

        return _possibleConstructorReturn(this, (HasManyToOneAssociation.__proto__ || Object.getPrototypeOf(HasManyToOneAssociation)).call(this, obj, associationMapping));
    }

    /**
     * @returns {QueryExpression}
     */


    _createClass(HasManyToOneAssociation, [{
        key: 'query',
        get: function get() {
            if (_.isNil(this[queryProperty])) {
                var _mapping5 = this.getMapping();
                Args.notNull(_mapping5, new Error('Data association cannot be empty at this context.'));
                //prepare query by selecting the foreign key of the related object
                var parent = this.getParent();
                Args.notNull(parent, new Error('Parent object cannot be empty at this context.'));
                this[queryProperty] = QueryExpression.create(this.model.getViewAdapter()).where(_mapping5.parentField).equal(parent[_mapping5.childField]).prepare();
            }
            return this[queryProperty];
        }

        /**
         * @returns {DataModel}
         */

    }, {
        key: 'model',
        get: function get() {
            if (_.isNil(this[modelProperty])) {
                var _mapping6 = this.getMapping();
                Args.notNull(_mapping6, new Error('Data association mapping cannot be empty at this context.'));
                this[modelProperty] = this.getParent().getContext().model(_mapping6.parentModel);
            }
            return this[modelProperty];
        }
    }]);

    return HasManyToOneAssociation;
}(HasAssociation);

/**
 * @classdesc Represents a many-to-many association between two data models.
 * <p>
 *     This association may be defined in a field of a child model as follows:
 * </p>
 * <pre class="prettyprint"><code>
 {
     "name": "User", "id": 90, "title": "Users", "inherits": "Account", "hidden": false, "sealed": false, "abstract": false, "version": "1.4",
     "fields": [
        ...
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
		}
        ...
     ]
     }
 </code></pre>
 <p>
 where model [User] has a many-to-many association with model [Group] in order to define the groups where a user belongs.
 This association will produce a database table with name of the specified association adapter name. If this name is missing
 then it will produce a table with a default name which comes of the concatenation of the model and the associated model.
 </p>
 <p>
 An instance of HasParentJunction class overrides DataQueryable methods for filtering associated objects:
 </p>
 <pre class="prettyprint"><code>
 //check if the selected user belongs to Administrators group by querying user groups
 var users = context.model('User');
 users.where('name').equal('alexis.rees@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        user.property('groups').where('name').equal('Users').count().then(function(result) {
            done(null, result);
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 <p>
 Connects two objects (by inserting an association between parent and child object):
 </p>
 <pre class="prettyprint"><code>
 //add the selected user to Administrators
 var users = context.model('User');
 users.where('name').equal('alexis.rees@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        user.property('groups').insert({ name:"Administrators" }).then(function(result) {
            done(null, result);
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 <p>
 Disconnects two objects (by removing an existing association):
 </p>
 <pre class="prettyprint"><code>
 //remove the selected user from Administrators group
 var users = context.model('User');
 users.where('name').equal('alexis.rees@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        user.property('groups').remove({ name:"Administrators" }).then(function(result) {
            done(null, result);
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 * @class
 * @constructor
 * @augments DataQueryable
 * @param {DataObject} obj The parent data object reference
 * @param {string|*} association - A string that represents the name of the field which holds association mapping or the association mapping itself.
 * @property {DataModel} baseModel - The model associated with this data object junction
 * @property {DataObject} parent - Gets or sets the parent data object associated with this instance of DataObjectJunction class.
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */


var HasManyToManyAssociation = exports.HasManyToManyAssociation = function (_HasAssociation3) {
    _inherits(HasManyToManyAssociation, _HasAssociation3);

    function HasManyToManyAssociation(obj, association) {
        _classCallCheck(this, HasManyToManyAssociation);

        return _possibleConstructorReturn(this, (HasManyToManyAssociation.__proto__ || Object.getPrototypeOf(HasManyToManyAssociation)).call(this, obj, association));
    }

    /**
     * @returns {DataModel}
     */


    _createClass(HasManyToManyAssociation, [{
        key: 'execute',


        /**
         * Overrides DataQueryable.execute() method
         * @param callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @ignore
         */
        value: function execute(callback) {
            var executeFunc = _get(HasManyToManyAssociation.prototype.__proto__ || Object.getPrototypeOf(HasManyToManyAssociation.prototype), 'prototype', this).execute;
            var self = this;
            self.migrate(function (err) {
                if (err) {
                    return callback(err);
                }
                executeFunc.call(self, callback);
            });
        }

        /**
         * Gets an instance of DataModel which represents the data model where this association stores data.
         * @returns {DataModel}
         */

    }, {
        key: 'insert',


        /**
         * Inserts an association between parent object and the given object or array of objects.
         * @param {*|Array} obj - An object or an array of objects to be related with parent object
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         * @example
         //add the selected user to Administrators
         var users = context.model('User');
         users.where('name').equal('alexis.rees@example.com')
         .first().then(function(result) {
                var user = users.convert(result);
                user.property('groups').insert({ name:"Administrators" }).then(function(result) {
                    done(null, result);
                });
            }).catch(function(err) {
                done(err);
            });
         */
        value: function insert(obj, callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret7 = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    insert_.call(self, obj, function (err) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(null);
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret7 === 'undefined' ? 'undefined' : _typeof(_ret7)) === "object") return _ret7.v;
            } else {
                return insert_.call(self, obj, callback);
            }
        }

        /**
         * Removes the association between parent object and the given object or array of objects.
         * @param {*|Array} obj - An object or an array of objects to be disconnected from parent object
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         * @example
         //remove the selected user from Administrators group
         var users = context.model('User');
         users.where('name').equal('alexis.rees@example.com')
         .first().then(function(result) {
                var user = users.convert(result);
                user.property('groups').remove({ name:"Administrators" }).then(function(result) {
                    done(null, result);
                });
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'remove',
        value: function remove(obj, callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret8 = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    remove_.call(self, obj, function (err) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(null);
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret8 === 'undefined' ? 'undefined' : _typeof(_ret8)) === "object") return _ret8.v;
            } else {
                return remove_.call(self, obj, callback);
            }
        }
    }, {
        key: 'migrate',
        value: function migrate(callback) {
            this.baseModel.migrate(callback);
        }
    }, {
        key: 'model',
        get: function get() {
            if (_.isNil(this[modelProperty])) {
                var _mapping7 = this.getMapping(),
                    parentObjectModel = this.getParent().getModel();
                if (_mapping7.parentModel === parentObjectModel.name) {
                    this[modelProperty] = this.getParent().getContext().model(_mapping7.childModel);
                } else if (_mapping7.childModel === parentObjectModel.name) {
                    this[modelProperty] = this.getParent().getContext().model(_mapping7.parentModel);
                } else {
                    //throw association error
                    throw new DataError('Data association model cannot be found or is mispelled');
                }
            }
            return this[modelProperty];
        }
    }, {
        key: 'query',
        get: function get() {
            if (_.isNil(this[queryProperty])) {
                var _mapping8 = this.getMapping(),
                    parentObject = this.getParent(),
                    parentObjectModel = parentObject.getModel();
                Args.notNull(_mapping8, new DataError('Data association mapping cannot be empty at this context'));
                //initialize query
                this[queryProperty] = QueryExpression.create(this.model.getViewAdapter());
                //get association adapter
                var baseModelAdapter = this.baseModel.getViewAdapter();
                //get model adapter
                var modelAdapter = this.model.getViewAdapter();
                var left = {},
                    right = {};
                var parentField = QueryFieldUtils.select('parentId').from(baseModelAdapter).getName(),
                    childField = QueryFieldUtils.select('valueId').from(baseModelAdapter).getName();
                //find parent field
                if (_mapping8.parentModel === parentObjectModel.name) {
                    left[modelAdapter] = [_mapping8.childField];
                    right[baseModelAdapter] = [childField];
                    this.query.join(baseModelAdapter, []).with([left, right]).where(parentField).equal(parentObject[_mapping8.parentField]).prepare();
                } else if (_mapping8.childModel === parentObjectModel.name) {
                    left[modelAdapter] = [_mapping8.parentField];
                    right[baseModelAdapter] = [parentField];
                    this.query.join(baseModelAdapter, []).with([left, right]).where(childField).equal(parentObject[_mapping8.childField]).prepare();
                }
                //throw association error
                throw new DataError('Data association model cannot be found or is mispelled');
            }
            return this[queryProperty];
        }
    }, {
        key: 'baseModel',
        get: function get() {
            if (_.isNil(this[baseModelProperty])) {
                var conf = this.getParent().getContext().getConfiguration();
                var _mapping9 = this.getMapping();
                Args.notNull(_mapping9, new DataError('Data association mapping cannot be empty at this context'));
                //search in cache (configuration.current.cache)
                var baseModelDefinition = conf.getModelDefinition(_mapping9.associationAdapter);
                if (_.isObject(baseModelDefinition)) {
                    this[baseModelProperty] = this.getParent().getContext().model(this.getMapping().associationAdapter);
                    return this[baseModelProperty];
                }
                //otherwise create model
                var parentModel = this.getParent().getModel();
                var parentField = parentModel.field(_mapping9.parentField);
                var childModel = this.getParent().getContext().model(_mapping9.childModel);
                var childField = childModel.field(_mapping9.childField);
                var adapter = _mapping9.associationAdapter;
                //set model definition
                conf.setModelDefinition({
                    name: adapter, title: adapter, sealed: false, hidden: true, type: "hidden",
                    source: adapter, view: adapter, version: '1.0',
                    fields: [{ name: "id", type: "Counter", primary: true }, {
                        name: 'parentId',
                        indexed: true,
                        nullable: false,
                        type: parentField.type == 'Counter' ? 'Integer' : parentField.type
                    }, {
                        name: 'valueId',
                        indexed: true,
                        nullable: false,
                        type: childField.type == 'Counter' ? 'Integer' : childField.type
                    }],
                    constraints: [{
                        type: "unique",
                        fields: ['parentId', 'valueId']
                    }],
                    "privileges": [{ "mask": 15, "type": "global" }]
                });
                this[baseModelProperty] = this.getParent().getContext().model(_mapping9.associationAdapter);
            }
            return this[baseModelProperty];
        }
    }]);

    return HasManyToManyAssociation;
}(HasAssociation);

/**
 * @function
 * @memberOf HasManyToManyAssociation
 * Inserts a new association between a parent and a child object.
 * @param {DataObject|*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */


function insertSingleObject_(obj, callback) {
    /**
     * @type {HasManyToManyAssociation|*}
     */
    var self = this;
    var mapping = self.getMapping();
    var parent = self.getParent();

    if (self.model.name === mapping.parentModel) {
        //get parent id
        return parent.property(mapping.parentField).value().then(function (parentId) {
            "use strict";

            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'));
            }
            //get child id
            return obj.property(mapping.childField).value().then(function (valueId) {
                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'));
                }
                var newItem = {};
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.insert(newItem, callback);
            });
        });
    } else if (self.model.name === mapping.childModel) {
        return obj.property(mapping.parentField).value().then(function (parentId) {
            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'));
            }
            return parent.property(mapping.childField).value().then(function (valueId) {
                "use strict";

                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'));
                }
                var newItem = {};
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.insert(newItem, callback);
            });
        });
    } else {
        return callback(new DataError('Data association mapping cannot be resolved.'));
    }
}
/**
 * @memberOf HasManyToManyAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function insert_(obj, callback) {
    /**
     *
     * @type {HasAssociation|*}
     */
    var self = this;
    var arr = [];
    if (_.isArray(obj)) arr = obj;else {
        arr.push(obj);
    }
    self.migrate(function (err) {
        if (err) callback(err);else {
            (function () {
                //get other model
                var otherModel = void 0;
                if (self.model.name === mapping.parentModel) {
                    otherModel = self.getParent().getContext().model(mapping.childModel);
                } else if (self.model.name === mapping.childModel) {
                    otherModel = self.getParent().getContext().model(mapping.parentModel);
                }
                async.eachSeries(arr, function (item, cb) {
                    return insertSingleObject_.call(self, otherModel.convert(item), cb);
                }, callback);
            })();
        }
    });
}

/**
 * @memberOf HasManyToManyAssociation
 * Removes a relation between a parent and a child object.
 * @param {*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */
function removeSingleObject_(obj, callback) {
    /**
     * @type {HasManyToManyAssociation|*}
     */
    var self = this;
    var mapping = self.getMapping();
    var parent = self.getParent();

    if (self.model.name === mapping.parentModel) {
        //get parent id
        return parent.property(mapping.parentField).value().then(function (parentId) {
            "use strict";

            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'));
            }
            //get child id
            return obj.property(mapping.childField).value().then(function (valueId) {
                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'));
                }
                var newItem = {};
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.remove(newItem, callback);
            });
        });
    } else if (self.model.name === mapping.childModel) {
        return obj.property(mapping.parentField).value().then(function (parentId) {
            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'));
            }
            return parent.property(mapping.childField).value().then(function (valueId) {
                "use strict";

                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'));
                }
                var newItem = {};
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.remove(newItem, callback);
            });
        });
    } else {
        return callback(new DataError('Data association mapping cannot be resolved.'));
    }
}
/**
 * @memberOf HasManyToManyAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function remove_(obj, callback) {
    /**
     *
     * @type {HasAssociation|*}
     */
    var self = this;
    var arr = [];
    if (_.isArray(obj)) arr = obj;else {
        arr.push(obj);
    }
    self.migrate(function (err) {
        if (err) callback(err);else {
            (function () {
                //get other model
                var otherModel = void 0;
                if (self.model.name === mapping.parentModel) {
                    otherModel = self.getParent().getContext().model(mapping.childModel);
                } else if (self.model.name === mapping.childModel) {
                    otherModel = self.getParent().getContext().model(mapping.parentModel);
                }
                async.eachSeries(arr, function (item, cb) {
                    return removeSingleObject_.call(self, otherModel.convert(item), cb);
                }, callback);
            })();
        }
    });
}

/**
 * @classdesc Represents a collection of values associated with a data object e.g. a collection of tags of an article, a set of skills of a person etc.
 * <p>
 *     This association may be defined in a field of a data model as follows:
 * </p>
 * <pre class="prettyprint"><code>
 {
     "name": "Person", "title": "Persons", "inherits":"Party", "version": "1.1",
     "fields": [
        ...
        {
            "@id": "https://themost.io/skills",
            "name": "skills",
            "title": "Skills",
            "description": "A collection of skills of this person.",
            "many": true,
            "type": "Text"
        }
        ...
     ]
     }
 </code></pre>
 <p>
 where model [Person] has a one-to-many association with a collection of strings in order to define the skills of a person.
 </p>
 <p>
 An instance of HasTagAssociation class overrides DataQueryable methods for filtering associated values:
 </p>
 <pre class="prettyprint"><code>
 var persons = context.model('Person');
 persons.where('email').equal('veronica.fletcher@example.com')
 .getTypedItem().then(function(person) {
            person.property('skills').all().then(function(result) {
                return done(null, result);
            });
        }).catch(function(err) {
            return done(err);
        });
 </code></pre>
 <p>
 Insert item(s):
 </p>
 <pre class="prettyprint"><code>
 var persons = context.model('Person');
 persons.where('email').equal('veronica.fletcher@example.com')
 .getTypedItem().then(function(person) {
                person.property('skills').insert([
                    "node.js",
                    "C#.NET",
                    "PHP"
                ]).then(function() {
                    return done();
                });
            }).catch(function(err) {
                return done(err);
            });
 </code></pre>
 <p>
 Remove item(s):
 </p>
 <pre class="prettyprint"><code>
 var persons = context.model('Person');
 persons.where('email').equal('veronica.fletcher@example.com')
 .getTypedItem().then(function(person) {
                person.property('skills').remove([
                    "C#.NET"
                ]).then(function() {
                    return done();
                });
            }).catch(function(err) {
                return done(err);
            });
 </code></pre>
 * @class
 * @augments DataQueryable
 * @property {DataModel} baseModel - The model associated with this data object junction
 * @property {DataObject} parent - Gets or sets the parent data object associated with this instance of HasTagAssociation class.
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */

var HasTagAssociation = exports.HasTagAssociation = function (_HasAssociation4) {
    _inherits(HasTagAssociation, _HasAssociation4);

    /**
     * @constructor
     * @param {DataObject} obj An object which represents the parent data object
     * @param {String|*} association A string that represents the name of the field which holds association mapping or the association mapping itself.
     */
    function HasTagAssociation(obj, association) {
        _classCallCheck(this, HasTagAssociation);

        return _possibleConstructorReturn(this, (HasTagAssociation.__proto__ || Object.getPrototypeOf(HasTagAssociation)).call(this, obj, association));
    }
    /**
     * @returns {DataModel}
     */


    _createClass(HasTagAssociation, [{
        key: 'migrate',


        /**
         * Migrates the underlying data association adapter.
         * @param callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         */
        value: function migrate(callback) {
            this.baseModel.migrate(callback);
        }

        /**
         * Overrides DataQueryable.execute() method
         * @param callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @ignore
         */

    }, {
        key: 'execute',
        value: function execute(callback) {
            var executeFunc = _get(HasTagAssociation.prototype.__proto__ || Object.getPrototypeOf(HasTagAssociation.prototype), 'prototype', this).execute;
            var self = this;
            self.migrate(function (err) {
                if (err) {
                    return callback(err);
                }
                executeFunc.call(self, callback);
            });
        }

        /**
         * Inserts an array of values
         * @param {*} obj
         * @param {Function=} callback
         * @example
         context.model('Person').where('email').equal('veronica.fletcher@example.com')
         .getTypedItem().then(function(person) {
                person.property('skills').insert([
                    "node.js",
                    "C#.NET"
                ]).then(function() {
                    return done();
                });
            }).catch(function(err) {
                return done(err);
            });
         *
         */

    }, {
        key: 'insert',
        value: function insert(obj, callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret11 = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    HasTagAssociation_Insert_.call(self, obj, function (err) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(null);
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret11 === 'undefined' ? 'undefined' : _typeof(_ret11)) === "object") return _ret11.v;
            } else {
                return HasTagAssociation_Insert_.call(self, obj, callback);
            }
        }

        /**
         * Removes all values
         * @param {Function=} callback
         * @deprecated - This method is deprecated. Use removeAll() method instead
         */

    }, {
        key: 'clear',
        value: function clear(callback) {
            return this.removeAll(callback);
        }

        /**
         * Removes all values
         * @param {Function=} callback
         * @example
         context.model('Person').where('email').equal('veronica.fletcher@example.com')
         .getTypedItem().then(function(person) {
                person.property('skills').removeAll().then(function() {
                    return done();
                });
            }).catch(function(err) {
                return done(err);
            });
         *
         */

    }, {
        key: 'removeAll',
        value: function removeAll(callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret12 = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    HasTagAssociation_Clear_.call(self, function (err) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve();
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret12 === 'undefined' ? 'undefined' : _typeof(_ret12)) === "object") return _ret12.v;
            } else {
                return HasTagAssociation_Clear_.call(self, callback);
            }
        }

        /**
         * Removes a value or an array of values
         * @param {Array|*} obj
         * @param {Function=} callback
         * @example
         context.model('Person').where('email').equal('veronica.fletcher@example.com')
         .getTypedItem().then(function(person) {
                person.property('skills').remove([
                    "node.js"
                ]).then(function() {
                    return done();
                });
            }).catch(function(err) {
                return done(err);
            });
         *
         */

    }, {
        key: 'remove',
        value: function remove(obj, callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret13 = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    HasTagAssociation_Remove_.call(self, obj, function (err) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(null);
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret13 === 'undefined' ? 'undefined' : _typeof(_ret13)) === "object") return _ret13.v;
            } else {
                return HasTagAssociation_Remove_.call(self, obj, callback);
            }
        }
    }, {
        key: 'model',
        get: function get() {
            return this.baseModel;
        }

        /**
         * @returns {DataModel}
         */

    }, {
        key: 'baseModel',
        get: function get() {

            if (_.isNil(this[baseModelProperty])) {
                var conf = this.getParent().getContext().getConfiguration();
                var _mapping10 = this.getMapping();
                Args.notNull(_mapping10, new DataError('Data association mapping cannot be empty at this context'));
                //search in cache (configuration.current.cache)
                var baseModelDefinition = conf.getModelDefinition(_mapping10.associationAdapter);
                if (_.isObject(baseModelDefinition)) {
                    this[baseModelProperty] = this.getParent().getContext().model(_mapping10.associationAdapter);
                    return this[baseModelProperty];
                }
                //otherwise create model
                var parentModel = this.getParent().getModel();
                var refersToType = parentModel.getAttribute(_mapping10.refersTo).type;
                var parentFieldType = parentModel.getAttribute(_mapping10.parentField).type;
                if (parentFieldType === 'Counter') {
                    parentFieldType = 'Integer';
                }
                var definition = {
                    "name": _mapping10.associationAdapter,
                    "hidden": true,
                    "source": _mapping10.associationAdapter,
                    "view": _mapping10.associationAdapter,
                    "version": "1.0",
                    "fields": [{
                        "name": "id", "type": "Counter", "nullable": false, "primary": true
                    }, {
                        "name": "object", "type": parentFieldType, "nullable": false, "many": false
                    }, {
                        "name": "value", "type": refersToType, "nullable": false
                    }],
                    "constraints": [{ "type": "unique", "fields": ["object", "value"] }],
                    "privileges": [{
                        "mask": 15, "type": "global"
                    }]
                };
                conf.setModelDefinition(definition);

                this[baseModelProperty] = this.getParent().getContext().model(_mapping10.associationAdapter);
            }
            return this[baseModelProperty];
        }
    }, {
        key: 'query',
        get: function get() {
            if (_.isNil(this[queryProperty])) {

                var _mapping11 = this.getMapping(),
                    parentObject = this.getParent(),
                    parentObjectModel = parentObject.getModel();
                Args.notNull(_mapping11, new DataError('Data association mapping cannot be empty at this context'));
                //get model adapter
                var modelAdapter = this.model.getViewAdapter();
                //initialize query
                this[queryProperty] = QueryExpression.create(this.model.getViewAdapter());
                //add select
                this.select("value").asArray();
                //modify query (add join)
                var left = {},
                    right = {};
                //get parent object adapter
                var parentAdapter = parentObject.getModel().getViewAdapter();
                left[parentAdapter] = [_mapping11.parentField];
                right[modelAdapter] = [QueryFieldUtils.select("object").from(modelAdapter).getName()];
                var objectField = QueryFieldUtils.select("object").from(modelAdapter).$name;
                this.query.join(parentAdapter, []).with([left, right]).where(objectField).equal(obj[_mapping11.parentField]).prepare(false);
            }
            return this[queryProperty];
        }
    }]);

    return HasTagAssociation;
}(HasAssociation);
/**
 * @memberOf HasTagAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */


function HasTagAssociation_Insert_(obj, callback) {
    var self = this;
    var arr = [];
    if (_.isArray(obj)) arr = obj;else {
        arr.push(obj);
    }
    self.migrate(function (err) {
        if (err) return callback(err);

        var items = arr.map(function (x) {
            return {
                "object": self.parent[self.mapping.parentField],
                "value": x
            };
        });
        if (self.$silent) {
            self.getBaseModel().silent();
        }
        return self.getBaseModel().save(items, callback);
    });
}
/**
 * @memberOf HasTagAssociation
 * @param {Function} callback
 * @private
 */
function HasTagAssociation_Clear_(callback) {
    var self = this;
    self.migrate(function (err) {
        if (err) {
            return callback(err);
        }
        if (self.$silent) {
            this.getBaseModel().silent();
        }
        self.getBaseModel().where("object").equal(self.parent[self.mapping.parentField]).select("id").all().then(function (result) {
            if (result.length == 0) {
                return callback();
            }
            return self.getBaseModel().remove(result).then(function () {
                return callback();
            });
        }).catch(function (err) {
            return callback(err);
        });
    });
}
/**
 * @memberOf HasTagAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function HasTagAssociation_Remove_(obj, callback) {
    var self = this;
    var arr = [];
    if (_.isArray(obj)) arr = obj;else {
        arr.push(obj);
    }
    self.migrate(function (err) {
        if (err) {
            return callback(err);
        }
        var items = arr.map(function (x) {
            return {
                "object": self.parent[self.mapping.parentField],
                "value": x
            };
        });
        if (self.$silent) {
            self.getBaseModel().silent();
        }
        return self.getBaseModel().remove(items, callback);
    });
}
//# sourceMappingURL=associations.js.map
