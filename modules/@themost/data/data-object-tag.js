/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var LangUtils = require('@themost/common/utils').LangUtils;
var DataConfigurationStrategy = require('./data-configuration').DataConfigurationStrategy;
var QueryField = require('@themost/query/query').QueryField;
var _ = require('lodash');
var Q = require('q');
var types = require('./types');
var DataObjectJunction = require("./data-object-junction").DataObjectJunction;
var DataQueryable = require('./data-queryable').DataQueryable;

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
 An instance of DataObjectTag class overrides DataQueryable methods for filtering associated values:
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
 * @constructor
 * @augments DataQueryable
 * @param {DataObject} obj An object which represents the parent data object
 * @param {String|*} association A string that represents the name of the field which holds association mapping or the association mapping itself.
 * @property {DataModel} baseModel - The model associated with this data object junction
 * @property {DataObject} parent - Gets or sets the parent data object associated with this instance of DataObjectTag class.
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */
function DataObjectTag(obj, association) {
    /**
     * @type {DataObject}
     * @private
     */
    var parent_ = obj;
    var model;
    var DataModel = require('./data-model').DataModel;

    /**
     * Gets or sets the parent data object
     * @type DataObject
     */
    Object.defineProperty(this, 'parent', { get: function () {
        return parent_;
    }, set: function (value) {
        parent_ = value;
    }, configurable: false, enumerable: false});
    var self = this;
    if (typeof association === 'string') {
        //infer mapping from field name
        //set relation mapping
        if (self.parent!=null) {
            model = self.parent.getModel();
            if (model!=null)
                self.mapping = model.inferMapping(association);
        }
    }
    else if (typeof association === 'object' && association !=null) {
        //get the specified mapping
        if (association instanceof types.DataAssociationMapping)
            self.mapping = association;
        else
            self.mapping = _.assign(new types.DataAssociationMapping(), association);
    }
    //validate mapping
    var baseModel_;
    Object.defineProperty(this, 'baseModel', {
        get: function() {
            if (baseModel_)
                return baseModel_;
            //get parent context
            var context = self.parent.context;
            /**
             * @type {DataConfigurationStrategy}
             */
            var strategy = context.getConfiguration().getStrategy(DataConfigurationStrategy);
            var definition = strategy.getModelDefinition(self.mapping.associationAdapter);
            if (_.isNil(definition)) {
                var associationObjectField = self.mapping.associationObjectField || DataObjectTag.DEFAULT_OBJECT_FIELD;
                var associationValueField = self.mapping.associationValueField || DataObjectTag.DEFAULT_VALUE_FIELD;
                var parentModel = self.parent.getModel();
                // get value type
                var refersTo = context.model(self.mapping.parentModel).getAttribute(self.mapping.refersTo);
                var refersToType = (refersTo && refersTo.type) || 'Text';
                var objectFieldType = parentModel.getAttribute(self.mapping.parentField).type;
                if (objectFieldType === 'Counter') { objectFieldType = 'Integer'; }
                definition = {
                    "name": self.mapping.associationAdapter,
                    "hidden": true,
                    "source": self.mapping.associationAdapter,
                    "view": self.mapping.associationAdapter,
                    "version": "1.0",
                    "fields": [
                        {
                            "name": "id",
                            "type": "Counter",
                            "nullable": false,
                            "primary": true
                        },
                        {
                            "name": associationObjectField,
                            "type": objectFieldType,
                            "nullable": false,
                            "many": false,
                            "indexed": true
                        },
                        {
                            "name": associationValueField,
                            "type": refersToType,
                            "nullable": false,
                            "many": false,
                            "indexed": true
                        }
                    ],
                    "constraints": [
                        { "type":"unique", "fields": [ associationObjectField, associationValueField ] }
                    ],
                    "privileges": self.mapping.privileges || [
                        {
                            "mask": 15,
                            "type": "global"
                        },
                        {
                            "mask": 15,
                            "type": "global",
                            "account": "Administrators"
                        }
                    ]
                };
                strategy.setModelDefinition(definition);
            }
            baseModel_ = new DataModel(definition);
            baseModel_.context = self.parent.context;
            return baseModel_;
        },configurable:false, enumerable:false
    });

    /**
     * Gets an instance of DataModel class which represents the data adapter of this association
     * @returns {DataModel}
     */
    this.getBaseModel = function() {
        return this.baseModel;
    };

    // call super class constructor
    DataObjectTag.super_.call(this, self.getBaseModel());
    // add select
    this.select(this.getValueField()).asArray();
    // modify query (add join parent model)
    var left = {}, right = {};
    // get parent adapter
    var parentAdapter = self.parent.getModel().viewAdapter;
    // set left operand of native join expression
    left[ parentAdapter ] = [ this.mapping.parentField ];
    // set right operand of native join expression
    right[this.mapping.associationAdapter] = [ QueryField.select(this.getObjectField()).from(this.mapping.associationAdapter).$name ];
    var field1 = QueryField.select(this.getObjectField()).from(this.mapping.associationAdapter).$name;
    // apply join expression
    this.query.join(parentAdapter, []).with([left, right]).where(field1).equal(obj[this.mapping.parentField]).prepare(false);
}

LangUtils.inherits(DataObjectTag, DataQueryable);

DataObjectTag.DEFAULT_OBJECT_FIELD = "object";
DataObjectTag.DEFAULT_VALUE_FIELD = "value";

/**
 * @returns {string=}
 */
DataObjectTag.prototype.getObjectField = function() {
    return DataObjectJunction.prototype.getObjectField.bind(this)();
};

/**
 * @returns {string=}
 */
DataObjectTag.prototype.getValueField = function() {
    return DataObjectJunction.prototype.getValueField.bind(this)();
};

/**
 * Migrates the underlying data association adapter.
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 */
DataObjectTag.prototype.migrate = function(callback) {
    this.getBaseModel().migrate(callback);
};

/**
 * Overrides DataQueryable.count() method
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @ignore
 */
DataObjectTag.prototype.count = function(callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return self.migrate(function(err) {
                if (err) {
                    return reject(err);
                }
                // noinspection JSPotentiallyInvalidConstructorUsage
                var superCount = DataObjectTag.super_.prototype.count.bind(self);
                return superCount().then(function(result) {
                    return resolve(result);
                }).catch(function(err) {
                    return reject(err);
                });
            });
        });
    }
    return self.migrate(function(err) {
        if (err) {
            return callback(err);
        }
        // noinspection JSPotentiallyInvalidConstructorUsage
        var superCount = DataObjectTag.super_.prototype.count.bind(self);
        return superCount(callback);
    });
};

/**
 * Overrides DataQueryable.execute() method
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @ignore
 */
DataObjectTag.prototype.execute = function(callback) {
    var self = this;
    self.migrate(function(err) {
        if (err) { return callback(err); }
        // noinspection JSPotentiallyInvalidConstructorUsage
        DataObjectTag.super_.prototype.execute.bind(self)(callback);
    });
};

/**
 * @this DataObjectTag
 * @param obj
 * @param callback
 * @private
 */
function insert_(obj, callback) {
    var self = this;
    var values = [];
    if (_.isArray(obj)) {
        values = obj;
    }
    else {
        values.push(obj);
    }
    self.migrate(function(err) {
        if (err)
            return callback(err);
        // get object field name
        var objectField = self.getObjectField();
        // get value field name
        var valueField = self.getValueField();
        // map the given items
        var items = _.map(_.filter(values, function(x) {
            return !_.isNil(x);
        }), function (x) {
            var res = {};
            res[objectField] = self.parent[self.mapping.parentField];
            res[valueField] = x;
            return res;
        });
        // and finally save items
        return self.getBaseModel().silent(self.$silent).save(items).then(function() {
            return callback();
        }).catch(function(err) {
            return callback(err);
        });
    });
}

/**
 * Inserts an array of values
 * @param {*} item
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
DataObjectTag.prototype.insert = function(item, callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function (resolve, reject) {
            return insert_.bind(self)(item, function(err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    return insert_.call(self, item, callback);
};

/**
 * @this DataObjectTag
 * @param callback
 * @private
 */
function clear_(callback) {
    var self = this;
    self.migrate(function(err) {
        if (err) {
            return callback(err);
        }
        self.getBaseModel().silent(self.$silent).where(self.getObjectField()).equal(self.parent[self.mapping.parentField]).select("id").getAllItems().then(function(result) {
            if (result.length===0) { return callback(); }
            return self.getBaseModel().remove(result).then(function () {
               return callback();
            });
        }).catch(function(err) {
           return callback(err);
        });
    });
}

/**
 * Removes all values
 * @param {Function=} callback
 * @returns Promise<T>|*
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
DataObjectTag.prototype.removeAll = function(callback) {
    var self = this;
    if (typeof callback !== 'function') {
        return Q.Promise(function (resolve, reject) {
            return clear_.bind(self)(function(err) {
                if (err) { return reject(err); }
                return resolve();
            });
        });
    }
    else {
        return clear_.call(self, callback);
    }
};

/**
 * @this DataObjectTag
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function remove_(obj, callback) {
    var self = this;
    var values = [];
    if (_.isArray(obj))
        values = obj;
    else {
        values.push(obj);
    }
    self.migrate(function(err) {
        if (err) {
            return callback(err);
        }
        // get object field name
        var objectField = self.getObjectField();
        // get value field name
        var valueField = self.getValueField();
        var items = _.map(_.filter(values, function(x) {
            return !_.isNil(x);
        }), function (x) {
            var res = {};
            res[objectField] = self.parent[self.mapping.parentField];
            res[valueField] = x;
            return res;
        });
        return self.getBaseModel().silent(self.$silent).remove(items, callback);
    });
}

/**
 * Removes a value or an array of values
 * @param {Array|*} item
 * @param {Function=} callback
 * @returns Promise<T>|*
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
DataObjectTag.prototype.remove = function(item, callback) {
    var self = this;
    if (typeof callback !== 'function') {
        return Q.Promise(function (resolve, reject) {
            return remove_.bind(self)(item, function(err) {
                if (err) { return reject(err); }
                return resolve();
            });
        });
    }
    return remove_.call(self, item, callback);
};

if (typeof exports !== 'undefined')
{
    module.exports = {
        DataObjectTag:DataObjectTag
    };
}