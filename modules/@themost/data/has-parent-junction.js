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
var DataConfigurationStrategy = require('./data-configuration').DataConfigurationStrategy;
var DataQueryable = require('./data-queryable').DataQueryable;
var DataObjectJunction = require('./data-object-junction').DataObjectJunction;
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
function HasParentJunction(obj, association) {
    var self = this;
    /**
     * @type {DataObject}
     * @private
     */
    var parent_ = obj,
        /**
         * @type {DataModel}
         */
        model_,
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

    //get association mapping
    if (typeof association === 'string') {
        if (parent_) {
            model_ = parent_.getModel();
            if (model_!==null)
                self.mapping = model_.inferMapping(association);
        }
    }
    else if (typeof association === 'object' && association !== null) {
        //get the specified mapping
        if (association instanceof DataAssociationMapping)
            self.mapping = association;
        else
            self.mapping = _.assign(new DataAssociationMapping(), association);
    }

    var relatedModel = this.parent.context.model(self.mapping.parentModel);
    //call super class constructor
    HasParentJunction.super_.call(this, relatedModel);
    //modify query (add join model)
    var adapter = relatedModel.viewAdapter;
    var left = {}, right = {};
    this.query.select(relatedModel.attributes.filter(function(x) {
        return !x.many;
    }).map(function(x) {
        return QueryField.select(x.name).from(adapter);
    }));

    var baseModel;
    Object.defineProperty(this, 'baseModel', {
        get: function() {
            if (baseModel)
                return baseModel;
            /**
             * @type {*|DataConfigurationStrategy}
             */
            var conf = self.parent.context.getConfiguration().getStrategy(DataConfigurationStrategy);
            //search in cache (configuration.current.cache)
            if (conf.getModelDefinition(self.mapping.associationAdapter)) {
                baseModel = new DataModel(conf.getModelDefinition(self.mapping.associationAdapter));
                baseModel.context = self.parent.context;
                return baseModel;
            }
            //otherwise create model
            var parentModel = self.parent.getModel();
            var parentField = parentModel.field(self.mapping.parentField);
            var childModel = self.parent.context.model(self.mapping.childModel);
            var childField = childModel.field(self.mapping.childField);
            var adapter = self.mapping.associationAdapter;
            baseModel = self.parent.context.model(adapter);
            if (_.isNil(baseModel)) {
                var associationObjectField = self.mapping.associationObjectField || DataObjectJunction.DEFAULT_OBJECT_FIELD ;
                var associationValueField = self.mapping.associationValueField || DataObjectJunction.DEFAULT_VALUE_FIELD;
                var modelDefinition = { name:adapter, title: adapter, sealed:false, hidden:true, type:"hidden", source:adapter, view:adapter, version:'1.0', fields:[
                        { name: "id", type:"Counter", primary: true },
                        { name: associationObjectField, indexed: true, nullable:false, type: (parentField.type==='Counter') ? 'Integer' : parentField.type },
                        { name: associationValueField, indexed: true, nullable:false, type: (childField.type==='Counter') ? 'Integer' : childField.type } ],
                    constraints: [
                        {
                            description: "The relation between two objects must be unique.",
                            type:"unique",
                            fields: [ associationObjectField, associationValueField ]
                        }
                    ], "privileges": self.mapping.privileges || [
                        {
                            "mask":15,
                            "type":"global"
                        },
                        { "mask":15,
                            "type":"global",
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
     * @method
     * @description Gets an instance of DataModel class which represents the data adapter of this association
     * @name HasParentJunction#getBaseModel
     * @returns {DataModel}
     */

    /**
     * Gets an instance of DataModel class which represents the data adapter of this association
     * @returns {DataModel}
     */
    this.getBaseModel = function() {
        return this.baseModel;
    };
    // get association adapter
    var associationAdapter = self.mapping.associationAdapter;
    // get parent field
    var parentField = QueryField.select(this.getObjectField()).from(associationAdapter).$name;
    // get child field
    var childField = QueryField.select(this.getValueField()).from(associationAdapter).$name;
    // set left operand of join expression
    left[adapter] = [ this.mapping.parentField ];
    // set right operand of join expression
    right[associationAdapter] = [parentField];
    // apply native join expression to query
    this.query.join(this.mapping.associationAdapter, []).with([left, right]).where(childField).equal(obj[this.mapping.childField]).prepare();

}
LangUtils.inherits(HasParentJunction, DataQueryable);

/**
 * @returns {string=}
 */
HasParentJunction.prototype.getObjectField = function() {
    return DataObjectJunction.prototype.getObjectField.bind(this)();
};

/**
 * @returns {string=}
 */
HasParentJunction.prototype.getValueField = function() {
    return DataObjectJunction.prototype.getValueField.bind(this)();
};

/**
 * @this HasParentJunction
 * Inserts a new association between a parent and a child object.
 * @param {*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */
function insertSingleObject_(obj, callback) {
    var self = this;
    //get parent and child
    var parent = obj;
    if (typeof obj !== 'object') {
        parent = {};
        parent[self.mapping.parentField] = obj;
    }
    var parentValue = parent[self.mapping.parentField];
    var childValue = self.parent[self.mapping.childField];
    //validate relation existence
    self.baseModel.silent(self.$silent).where(self.getObjectField()).equal(parentValue).and(self.getValueField()).equal(childValue).first(function(err, result) {
        if (err) {
            //on error exit with error
            return callback(err);
        }
        else {
            if (result) {
                //if relation already exists, do nothing
                return callback();
            }
            else {
                //otherwise create new item
                var newItem = { };
                newItem[self.getObjectField()] = parentValue;
                newItem[self.getValueField()] = childValue;
                //and insert it
                self.baseModel.silent(self.$silent).insert(newItem, callback);
            }
        }
    });
}

/**
 * @this HasParentJunction
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function insert_(obj, callback) {
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
        else {
            async.eachSeries(arr, function(item, cb) {
                var parent = item;
                if (typeof item !== 'object') {
                    parent = {};
                    parent[self.mapping.parentField] = item;
                }
                //validate if child identifier exists
                if (parent.hasOwnProperty(self.mapping.parentField)) {
                    insertSingleObject_.call(self, parent, function(err) {
                        cb(err);
                    });
                }
                else {
                    //get related model
                    var relatedModel = self.parent.context.model(self.mapping.parentModel);
                    //ensure silent mode
                    if (self.getBaseModel().$silent) { relatedModel.silent(); }
                    //find object by querying child object
                    relatedModel.find(item).select(self.mapping.parentField).first(function (err, result) {
                        if (err) {
                            cb(null);
                        }
                        else {
                            if (!result) {
                                //child was not found (do nothing or throw exception)
                                cb(null);
                            }
                            else {
                                parent[self.mapping.parentField] = result[self.mapping.parentField];
                                insertSingleObject_.call(self, parent, function(err) {
                                    cb(err);
                                });
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
 * @param {*|Array} obj - An object or an array of objects to be related with parent object
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
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
HasParentJunction.prototype.insert = function(obj, callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return insert_.bind(self)(obj, function(err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    return insert_.bind(self)(obj, function(err) {
        return callback(err);
    });
};

/**
 * @this HasParentJunction
 * Removes a relation between a parent and a child object.
 * @param {*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */
function removeSingleObject_(obj, callback) {
    var self = this;
    //get parent and child
    var parent = obj;
    if (typeof obj !== 'object') {
        parent = {};
        parent[self.mapping.parentField] = obj;
    }
    var parentValue = parent[self.mapping.parentField];
    var childValue = self.parent[self.mapping.childField];
    //get relation model
    self.baseModel.silent(self.$silent).where(this.getObjectField()).equal(parentValue).and(this.getValueField()).equal(childValue).first(function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            if (!result) {
                callback(null);
            }
            else {
                //otherwise remove item
                self.baseModel.silent(self.$silent).remove(result, callback);
            }
        }
    });
}

/**
 * @this HasParentJunction
 * @param obj
 * @param callback
 * @private
 */
function remove_(obj, callback) {
    var self = this, arr = [];
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
                var parent = item;
                if (typeof item !== 'object') {
                    parent = {};
                    parent[self.mapping.parentField] = item;
                }
                //get related model
                var relatedModel = self.parent.context.model(self.mapping.parentModel);
                //find object by querying child object
                relatedModel.find(parent).select(self.mapping.parentField).first(function (err, result) {
                    if (err) {
                        return cb();
                    }
                    else {
                        if (!result) {
                            //child was not found (do nothing or throw exception)
                            cb();
                        }
                        else {
                            parent[self.mapping.parentField] = result[self.mapping.parentField];
                            removeSingleObject_.call(self, parent, function(err) {
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
 * @param {*|Array} obj - An object or an array of objects to be disconnected from parent object
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
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
HasParentJunction.prototype.remove = function(obj, callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return remove_.bind(self)(obj, function(err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    return remove_.bind(self)(obj, function(err) {
        return callback(err);
    });
};


HasParentJunction.prototype.migrate = function(callback) {
    this.baseModel.migrate(callback);
};

/**
 * Overrides DataQueryable.count() method
 * @param callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @ignore
 */
HasParentJunction.prototype.count = function(callback) {
    var self = this;
    if (typeof callback === 'undefined') {
        return Q.Promise(function(resolve, reject) {
            return self.migrate(function(err) {
                if (err) {
                    return reject(err);
                }
                // noinspection JSPotentiallyInvalidConstructorUsage
                var superCount = HasParentJunction.super_.prototype.count.bind(self);
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
        var superCount = HasParentJunction.super_.prototype.count.bind(self);
        return superCount(callback);
    });
};


if (typeof exports !== 'undefined')
{
    module.exports.HasParentJunction = HasParentJunction;
}