/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var LangUtils = require('@themost/common/utils').LangUtils;
var DataConfigurationStrategy = require('./data-configuration').DataConfigurationStrategy;
var QueryField = require('@themost/query/query').QueryField;
var _ = require('lodash');
var types = require('./types');
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
    var parent_ = obj,
        DataModel = require('./data-model').DataModel;

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
            var model = self.parent.getModel();
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
                var parentModel = self.parent.getModel(),
                    refersToType = parentModel.getAttribute(self.mapping.refersTo).type,
                    parentFieldType = parentModel.getAttribute(self.mapping.parentField).type;
                if (parentFieldType === 'Counter') { parentFieldType = 'Integer'; }
                definition = {
                    "name": self.mapping.associationAdapter,
                    "hidden": true,
                    "source": self.mapping.associationAdapter,
                    "view": self.mapping.associationAdapter,
                    "version": "1.0",
                    "fields": [
                        {
                            "name": "id", "type": "Counter", "nullable": false, "primary": true
                        },
                        {
                            "name": "object", "type": parentFieldType, "nullable": false, "many": false
                        },
                        {
                            "name": "value", "type": refersToType, "nullable": false
                        }
                    ],
                    "constraints": [
                        { "type":"unique", "fields": [ "object", "value" ] }
                    ],
                    "privileges": [
                        {
                            "mask": 15, "type": "global"
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

    //call super class constructor
    DataObjectTag.super_.call(this, self.getBaseModel());
    //add select
    this.select("value").asArray();
    //modify query (add join parent model)
    var left = {}, right = {};
    var parentAdapter = self.parent.getModel().viewAdapter;
    left[ parentAdapter ] = [ this.mapping.parentField ];
    right[this.mapping.associationAdapter] = [ QueryField.select("object").from(this.mapping.associationAdapter).$name ];
    var field1 = QueryField.select("object").from(this.mapping.associationAdapter).$name;
    this.query.join(parentAdapter, []).with([left, right]).where(field1).equal(obj[this.mapping.parentField]).prepare(false);
}

LangUtils.inherits(DataObjectTag, DataQueryable);

/**
 * Migrates the underlying data association adapter.
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 */
DataObjectTag.prototype.migrate = function(callback) {
    this.getBaseModel().migrate(callback);
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
        DataObjectTag.super_.prototype.execute.call(self, callback);
    });
};

/**
 * @this DataObjectTag
 * @param obj
 * @param callback
 * @private
 */
function insert_(obj, callback) {
    var self = this, arr = [];
    if (_.isArray(obj))
        arr = obj;
    else {
        arr.push(obj);
    }
    self.migrate(function(err) {
        if (err)
            return callback(err);

        var items = arr.map(function (x) {
            return {
                "object": self.parent[self.mapping.parentField],
                "value": x
            }
        });
        if (self["$silent"]) { self.getBaseModel().silent(); }
        return self.getBaseModel().save(items, callback);
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
DataObjectTag.prototype.insert = function(obj, callback) {
    var self = this;
    if (typeof callback !== 'function') {
        var Q = require('q'), deferred = Q.defer();
        insert_.call(self, obj, function(err) {
            if (err) { return deferred.reject(err); }
            deferred.resolve(null);
        });
        return deferred.promise;
    }
    else {
        return insert_.call(self, obj, callback);
    }
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
        if (self["$silent"]) { self.getBaseModel().silent(); }
        self.getBaseModel().where("object").equal(self.parent[self.mapping.parentField]).select("id").all().then(function(result) {
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
 * @deprecated - This method is deprecated. Use removeAll() method instead
 */
DataObjectTag.prototype.clear = function(callback) {
    return this.removeAll(callback);
};

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
DataObjectTag.prototype.removeAll = function(callback) {
    var self = this;
    if (typeof callback !== 'function') {
        var Q = require('q'), deferred = Q.defer();
        clear_.call(self, function(err) {
            if (err) { return deferred.reject(err); }
            deferred.resolve();
        });
        return deferred.promise;
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
    var arr = [];
    if (_.isArray(obj))
        arr = obj;
    else {
        arr.push(obj);
    }
    self.migrate(function(err) {
        if (err) {
            return callback(err);
        }
        var items = arr.map(function (x) {
            return {
                "object": self.parent[self.mapping.parentField],
                "value": x
            }
        });
        if (self["$silent"]) { self.getBaseModel().silent(); }
        return self.getBaseModel().remove(items, callback);
    });
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
DataObjectTag.prototype.remove = function(obj, callback) {
    var self = this;
    if (typeof callback !== 'function') {
        var Q = require('q'), deferred = Q.defer();
        remove_.call(self, obj, function(err) {
            if (err) { return deferred.reject(err); }
            deferred.resolve(null);
        });
        return deferred.promise;
    }
    else {
        return remove_.call(self, obj, callback);
    }
};

if (typeof exports !== 'undefined')
{
    module.exports = {
        DataObjectTag:DataObjectTag
    };
}