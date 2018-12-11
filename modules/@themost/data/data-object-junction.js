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
var _ = require('lodash');
var Q = require('q');
var async = require('async');
var QueryField = require('@themost/query/query').QueryField;
var DataAssociationMapping = require('./types').DataAssociationMapping;
var DataQueryable = require('./data-queryable').DataQueryable;
var DataConfigurationStrategy = require('./data-configuration').DataConfigurationStrategy;


/**
 * @classdesc Represents a many-to-many association between two data models.
 * <p>
 *     This association may be defined in a field of a data model as follows:
 * </p>
 * <pre class="prettyprint"><code>
 {
     "name": "Group", "id": 91, "title": "User Group", "inherits":"Account", "hidden": false, "sealed": false, "abstract": false, "version": "1.1",
     "fields": [
        ...
        {
			"name": "members",
            "title": "Group Members",
            "description": "Contains the collection of group members (users or groups).",
            "type": "Account",
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
 where model [Group] has a many-to-many association with model [User] in order to define the groups where a user belongs.
 This association will produce a database table with name of the specified association adapter name. If this name is missing
 then it will produce a table with a default name which comes of the concatenation of the model and the associated model.
 </p>
 <p>
 An instance of DataObjectJunction class overrides DataQueryable methods for filtering associated objects:
 </p>
 <pre class="prettyprint"><code>
 //check if a user belongs to Administrators group by querying user groups
 var groups = context.model('Group');
 groups.where('name').equal('Administrators')
 .first().then(function(result) {
        var group = groups.convert(result);
        group.property('members').where('name').equal('alexis.rees@example.com').count().then(function(result) {
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
 //add a user (by name) in Administrators group
 var groups = context.model('Group');
 groups.where('name').equal('Administrators')
 .first().then(function(result) {
        var group = groups.convert(result);
        group.property('members').insert({ name: 'alexis.rees@example.com' }).then(function() {
            done();
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 <p>
 Disconnects two objects (by removing an existing association):
 </p>
 <pre class="prettyprint"><code>
 //remove a user (by name) from Administrators group
 var groups = context.model('Group');
 groups.where('name').equal('Administrators')
 .first().then(function(result) {
        var group = groups.convert(result);
        group.property('members').remove({ name: 'alexis.rees@example.com' }).then(function() {
            done();
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 * @class
 * @constructor
 * @augments DataQueryable
 * @param {DataObject} obj An object which represents the parent data object
 * @param {String|*} association A string that represents the name of the field which holds association mapping or the association mapping itself.
 * @property {DataModel} baseModel - The model associated with this data object junction
 * @property {DataObject} parent - Gets or sets the parent data object associated with this instance of DataObjectJunction class.
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */
function DataObjectJunction(obj, association) {
    /**
     * @type {DataObject}
     * @private
     */
    var parent_ = obj;
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
    var model;
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
        if (association instanceof DataAssociationMapping)
            self.mapping = association;
        else
            self.mapping = _.assign(new DataAssociationMapping(), association);
    }
    //get related model
    var relatedModel = this.parent.context.model(self.mapping.childModel);
    //call super class constructor
    DataObjectJunction.super_.bind(this)(relatedModel);
    //modify query (add join model)
    var adapter = relatedModel.viewAdapter;
    var left = {}, right = {};
    this.query.select(relatedModel.attributes.filter(function(x) {
        return !x.many;
    }).map(function(x) {
        return QueryField.select(x.name).from(adapter);
    }));
    /**
     * @type {DataModel}
     */
    var baseModel;
    Object.defineProperty(this, 'baseModel', {
        get: function() {
            if (baseModel)
                return baseModel;
            //get parent context
            var context = self.parent.context;
            /**
             * @type {*|DataConfigurationStrategy}
             */
            var conf = context.getConfiguration().getStrategy(DataConfigurationStrategy);
            //search in cache (configuration.current.cache)
            var modelDefinition = conf.getModelDefinition(self.mapping.associationAdapter);
            if (modelDefinition) {
                baseModel = new DataModel(modelDefinition);
                baseModel.context = self.parent.context;
                return baseModel;
            }
            //get parent and child field in order to get junction field types
            var parentModel = self.parent.getModel();
            var parentField = parentModel.field(self.mapping.parentField);
            var childModel = self.parent.context.model(self.mapping.childModel);
            var childField = childModel.field(self.mapping.childField);
            var adapter = self.mapping.associationAdapter;
            baseModel = self.parent.context.model(adapter);
            if (_.isNil(baseModel)) {
                var associationObjectField = self.mapping.associationObjectField || DataObjectJunction.DEFAULT_OBJECT_FIELD;
                var associationValueField = self.mapping.associationValueField || DataObjectJunction.DEFAULT_VALUE_FIELD;
                modelDefinition = { name:adapter, title: adapter, source:adapter, type:"hidden", hidden:true, sealed:false, view:adapter, version:'1.0', fields:[
                        { name: "id", type:"Counter", primary: true },
                        { name: associationObjectField, indexed: true, nullable:false, type: (parentField.type === 'Counter') ? 'Integer' : parentField.type },
                        { name: associationValueField, indexed: true, nullable:false, type: (childField.type === 'Counter') ? 'Integer' : childField.type } ],
                    "constraints": [
                        {
                            "description": "The relation between two objects must be unique.",
                            "type":"unique",
                            "fields": [ associationObjectField, associationValueField ]
                        }
                    ], "privileges": self.mapping.privileges || [
                        {
                            "mask":15,
                            "type":"global"
                        },
                        {
                            "mask": 15,
                            "type": "global",
                            "account": "Administrators"
                        }
                    ]};

                conf.setModelDefinition(modelDefinition);
                //initialize base model
                baseModel = new DataModel(modelDefinition);
                baseModel.context = self.parent.context;
            }
            return baseModel;
        },configurable:false, enumerable:false
    });

    /**
     * Gets an instance of DataModel class which represents the data adapter of this association
     * @returns {DataModel}
     */
    this.getBaseModel = function() {
        return this.baseModel;
    };

    left[adapter] = [ relatedModel.primaryKey ];
    var baseAdapter = this.getBaseModel().viewAdapter;
    right[baseAdapter] = [QueryField.select(this.getValueField()).from(baseAdapter).$name];
    var field1 = QueryField.select(this.getObjectField()).from(baseAdapter).$name;
    this.query.join(baseAdapter, []).with([left, right]).where(field1).equal(obj[this.mapping.parentField]).prepare();

}

DataObjectJunction.DEFAULT_OBJECT_FIELD = 'parentId';
DataObjectJunction.DEFAULT_VALUE_FIELD = 'valueId';

LangUtils.inherits(DataObjectJunction, DataQueryable);

/**
 * @returns {string=}
 */
DataObjectJunction.prototype.getObjectField = function() {
    var self = this;
    // get base model
    var baseModel = this.getBaseModel();
    // if association parent field is defined use this
    if (self.mapping && self.mapping.associationObjectField) {
        return self.mapping.associationObjectField;
    }
    // if base model has the traditional parent attribute
    var attr = _.find(baseModel.attributes, function(x) {
        return x.name === DataObjectJunction.DEFAULT_OBJECT_FIELD;
    });
    if (attr) {
        return attr.name;
    }
    // else try to find parent model definition
    attr = _.find(baseModel.attributes, function(x) {
        return self.mapping && (x.type === self.mapping.parentModel);
    });
    if (attr) {
        return attr.name;
    }
    return DataObjectJunction.DEFAULT_OBJECT_FIELD;
};

/**
 * @returns {string=}
 */
DataObjectJunction.prototype.getValueField = function() {
    var self = this;
    // get base model
    var baseModel = this.getBaseModel();
    // if association child field is defined use this
    if (self.mapping && self.mapping.associationValueField) {
        return self.mapping.associationValueField;
    }
    // if base model has the traditional parent attribute
    var attr = _.find(baseModel.attributes, function(x) {
        return x.name === DataObjectJunction.DEFAULT_VALUE_FIELD;
    });
    if (attr) {
        return attr.name;
    }
    // else try to find parent model definition
    attr = _.find(baseModel.attributes, function(x) {
        return self.mapping && (x.type === self.mapping.childModel);
    });
    if (attr) {
        return attr.name;
    }
    return DataObjectJunction.DEFAULT_VALUE_FIELD;
};

/**
 * Migrates the underlying data association adapter.
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 */
DataObjectJunction.prototype.migrate = function(callback) {
    var self = this;
    var model = this.getBaseModel();
    model.migrate(function(err) {
        if (err) {
            return callback(err);
        }
        //migrate related model
        var childModel = self.parent.context.model(self.mapping.childModel);
        return childModel.migrate(callback);
    });
};
/**
 * Overrides DataQueryable.execute() method
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @ignore
 */
DataObjectJunction.prototype.execute = function(callback) {
    var self = this;
    self.migrate(function(err) {
        if (err) { callback(err); return; }
        // noinspection JSPotentiallyInvalidConstructorUsage
        DataObjectJunction.super_.prototype.execute.call(self, callback);
    });
};

/**
 * Overrides DataQueryable.count() method
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @ignore
 */
DataObjectJunction.prototype.count = function(callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return self.migrate(function(err) {
                if (err) {
                   return reject(err);
                }
                // noinspection JSPotentiallyInvalidConstructorUsage
                var superCount = DataObjectJunction.super_.prototype.count.bind(self);
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
        var superCount = DataObjectJunction.super_.prototype.count.bind(self);
        return superCount(callback);
    });
};

/**
 * @this DataObjectJunction
 * @param {*} obj
 * @param {Function} callback
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
            callback(err);
        else {
            async.eachSeries(arr, function(item, cb) {
                var child = item;
                if (typeof item !== 'object') {
                    child = {};
                    child[self.mapping.childField] = item;
                }
                //validate if child identifier exists
                if (child.hasOwnProperty(self.mapping.childField)) {
                    insertSingleObject_.call(self, child, function(err) {
                        cb(err);
                    });
                }
                else {
                    /**
                     * Get related model. The related model is the model of any child object of this junction.
                     * @type {DataModel}
                     */
                    var relatedModel = self.parent.context.model(self.mapping.childModel);
                    //find object by querying child object
                    relatedModel.find(child).select(self.mapping.childField).first(function (err, result) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            /**
                             * Validates related object, inserts this object if does not exists
                             * and finally defines the relation between child and parent objects
                             */
                            if (!result) {
                                //ensure silent mode
                                if (self.getBaseModel().$silent) { relatedModel.silent(); }
                                //insert related item if does not exists
                                relatedModel.save(child, function(err) {
                                    if (err) {
                                        cb(err);
                                    }
                                    else {
                                        //insert relation between child and parent
                                        insertSingleObject_.call(self, child, function(err) { cb(err); });
                                    }
                                });
                            }
                            else {
                                //set primary key
                                child[self.mapping.childField] = result[self.mapping.childField];
                                //insert relation between child and parent
                                insertSingleObject_.call(self, child, function(err) { cb(err); });
                            }
                        }
                    });
                }

            }, callback);
        }
    });
}

/**
 * Inserts an association between parent object and the given object or array of objects.
 * @param {*} obj - An object or an array of objects to be related with parent object
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
 * @example
 //add a user (by name) in Administrators group
 var groups = context.model('Group');
 groups.where('name').equal('Administrators')
 .first().then(function(result) {
        var group = groups.convert(result);
        group.property('members').insert({ name: 'alexis.rees@example.com' }).then(function() {
            done();
        });
    }).catch(function(err) {
        done(err);
    });
 */
DataObjectJunction.prototype.insert = function(obj, callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return insert_.call(self, obj, function(err) {
                if (err) {
                    return reject(err);
                }
                return resolve(obj);
            });
        });
    }
    return insert_.call(self, obj, function (err) {
        if (err) {
            return callback(err);
        }
        return callback(null, obj);
    });
};

/**
 * @this DataObjectJunction
 * @param {Function} callback
 * @private
 */
function clear_(callback) {
    var self = this;
    // auto migrate
    self.migrate(function(err) {
        if (err) {
            return callback();
        }
        // get parent id
        var parentValue = self.parent[self.mapping.parentField];
        // get relation model
        var baseModel = self.getBaseModel();
        // validate relation existence
        baseModel.where(self.getObjectField()).equal(parentValue).all(function(err, result) {
            // if error occurred
            if (err) {
                return callback();
            }
            // if there are no items
            if (result.length===0) {
                // return
                return callback();
            }
            // otherwise remove items
            baseModel.remove(result, callback);
        });
    });
}

/**
 * @param callback
 * @returns {Promise<T>|*}
 */
DataObjectJunction.prototype.removeAll = function(callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return clear_.call(self, function(err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    return clear_.call(self, callback);
};

/**
 * @this DataObjectJunction
 * Inserts a new relation between a parent and a child object.
 * @param {*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */
function insertSingleObject_(obj, callback) {
    var self = this;
    //get parent and child
    var child = obj;
    if (typeof obj !== 'object') {
        child = {};
        child[self.mapping.childField] = obj;
    }
    var parentValue = self.parent[self.mapping.parentField];
    var childValue = child[self.mapping.childField];
    //get relation model
    var baseModel = self.getBaseModel();
    //validate relation existence
    baseModel.silent(self.$silent).where(self.getObjectField()).equal(parentValue).and(self.getValueField()).equal(childValue).first(function(err, result) {
        if (err) {
            //on error exit with error
            return callback(err);
        }
        else {
            if (result) {
                //if relation already exists, do nothing
                return callback(null);
            }
            else {
                //otherwise create new item
                var newItem = { };
                newItem[self.getObjectField()] = parentValue;
                newItem[self.getValueField()] = childValue;
                // set silent flag
                //and insert it
                baseModel.silent(self.$silent).insert(newItem, callback);
            }
        }
    });

}
/**
 * Migrates current junction data storage
 * @param {Function} callback
 */
DataObjectJunction.prototype.migrate = function(callback)
{
    var self = this;
    //get migration model
    var migrationModel = self.parent.context.model("Migration");
    //get related model
    var relationModel = self.getBaseModel();
    migrationModel.find({ appliesTo:relationModel.source, version: relationModel.version }).first(function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            if (!result) {
                //migrate junction table
                relationModel.migrate(function(err) {
                    if (err) {
                        callback(err);
                    }
                    else
                        callback(null);
                })
            }
            else
                callback(null);
        }
    });
};

/**
 * @this DataObjectJunction
 * @param obj
 * @param callback
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
        if (err)
            callback(err);
        else
        {
            async.eachSeries(arr, function(item, cb) {
                var child = item;
                if (typeof item !== 'object') {
                    child = {};
                    child[self.mapping.childField] = item;
                }
                //get related model
                var relatedModel = self.parent.context.model(self.mapping.childModel);
                //find object by querying child object
                relatedModel.find(child).select(self.mapping.childField).first(function (err, result) {
                    if (err) {
                        cb(null);
                    }
                    else {
                        if (!result) {
                            //child was not found (do nothing or throw exception)
                            cb(null);
                        }
                        else {
                            child[self.mapping.childField] = result[self.mapping.childField];
                            removeSingleObject_.call(self, child, function(err) {
                                cb(err);
                            });
                        }
                    }
                });
            }, callback);
        }
    });
}

/**
 * Removes the association between parent object and the given object or array of objects.
 * @param {*} obj - An object or an array of objects to be disconnected from parent object
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
 * @example
 //remove a user (by name) from Administrators group
 var groups = context.model('Group');
 groups.where('name').equal('Administrators')
 .first().then(function(result) {
        var group = groups.convert(result);
        group.property('members').remove({ name: 'alexis.rees@example.com' }).then(function() {
            done();
        });
    }).catch(function(err) {
        done(err);
    });
 */
DataObjectJunction.prototype.remove = function(obj, callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return remove_.call(self, obj, function(err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    return remove_.call(self, obj, callback);
};

/**
 * @this DataObjectJunction
 * Removes a relation between a parent and a child object.
 * @param {*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */
 function removeSingleObject_(obj, callback) {
    var self = this;
    //get parent and child
    var child = obj;
    if (typeof obj !== 'object') {
        child = {};
        child[self.mapping.childField] = obj;
    }
    var parentValue = self.parent[self.mapping.parentField];
    var childValue = child[self.mapping.childField];
    //get relation model
    var baseModel = self.getBaseModel();
    baseModel.silent(self.$silent).where(self.getObjectField()).equal(parentValue).and(self.getValueField()).equal(childValue).first(function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            if (!result) {
                callback(null);
            }
            else {
                //otherwise remove item
                baseModel.silent(self.$silent).remove(result, callback);
            }
        }
    });
}

if (typeof exports !== 'undefined')
{
    module.exports.DataObjectJunction = DataObjectJunction;
}