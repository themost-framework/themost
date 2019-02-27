/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _ = require("lodash");
var QueryUtils = require('@themost/query/utils').QueryUtils;
var async = require("async");
var DataError = require('@themost/common/errors').DataError;


/**
 * 
 * @param attr
 * @param event
 * @param callback
 * @returns {*}
 * @private
 */
function beforeSave_(attr, event, callback) {
    var context = event.model.context,
        name = attr.property || attr.name,
        key = event.model.getPrimaryKey(),
        nestedObj = event.target[name];
    //if attribute is null or undefined do nothing
    if (_.isNil(nestedObj)) {
        return callback();
    }
    //get target model
    var nestedModel = context.model(attr.type);
    if (_.isNil(nestedModel)) {
        return callback();
    }
    if (event.state===1) {
        //save nested object
        nestedModel.silent().save(nestedObj, function(err) {
            callback(err);
        });
    }
    else if (event.state === 2) {
        //first of all get original address from db
        event.model.where(key)
            .equal(event.target[key])
            .select(key,name)
            .silent()
            .first().then(function( result) {
                if (_.isNil(result)) { return callback(new Error('Invalid object state.')); }
            var nestedKey = nestedModel.getPrimaryKey();
                if (_.isNil(result[name])) {
                    //first of all delete nested object id (for insert)
                    delete nestedObj[nestedKey];
                    //save data
                    nestedModel.silent().save(nestedObj).then(function() {
                        return callback();
                    }).catch(function(err) {
                        return callback(err);
                    });
                }
                else {
                    //set nested object id (for update)
                    nestedObj[nestedKey] = result[name][nestedKey];
                    nestedModel.silent().save(nestedObj).then(function() {
                        return callback();
                    }).catch(function(err) {
                        return callback(err);
                    });
                }
        }).catch(function(err) {
            return callback(err);
        });
    }
    else {
        return callback();
    }
}

/**
 * 
 * @param attr
 * @param event
 * @param callback
 * @returns {*}
 * @private
 */
function beforeSaveMany_(attr, event, callback) {
    var context = event.model.context;
    var name = attr.property || attr.name;
    var key = event.model.getPrimaryKey();
    var nestedObj = event.target[name];
    //if attribute is null or undefined
    if (_.isNil(nestedObj)) {
        //do nothing
        return callback();
    }
    //if nested object is not an array
    if (!_.isArray(nestedObj)) {
        //throw exception
        return callback(new DataError("EJUNCT","Invalid argument type. Expected array.",null, event.model.name, name));
    }
    //if nested array does not have any data
    if (nestedObj.length===0) {
        //do nothing
        return callback();
    }
    //get target model
    var nestedModel = context.model(attr.type);
    //if target model cannot be found
    if (_.isNil(nestedModel)) {
        return callback();
    }
    //get nested primary key
    var nestedKey = nestedModel.getPrimaryKey();
    //on insert
    if (event.state===1) {
        //enumerate nested objects and set state to new
        _.forEach(nestedObj, function(x) {
            //delete identifier
            delete x[nestedKey];
            //force state to new ($state=1)
            x.$state = 1;
        });
        //save nested objects
        nestedModel.silent().save(nestedObj, function(err) {
            //remove $state attribute
            nestedObj.forEach(function(x) { delete x.$state; });
            //and return
            callback(err);
        });
    }
        //on update
    else if (event.state === 2) {
        //first of all get original associated object, if any
        event.model.where(key)
            .equal(event.target[key])
            .select(key,name)
            .expand(name)
            .silent()
            .first(function(err, result) {
                if (err) { return callback(err); }
                //if original object cannot be found, throw an invalid state exception
                if (_.isNil(result)) { return callback(new Error('Invalid object state.')); }
                //get original nested objects
                var originalNestedObjects = result[name] || [];
                //enumerate nested objects

                _.forEach(nestedObj, function(x) {
                    var obj = _.find(originalNestedObjects, function(y) { return y[nestedKey] === x[nestedKey]; });
                    if (obj) {
                        //force state to update ($state=2)
                        x.$state = 2;
                    }
                    else {
                        //delete identifier
                        delete x[nestedKey];
                        //force state to new ($state=1)
                        x.$state = 1;
                    }
                });

                _.forEach(originalNestedObjects, function(x) {
                    var obj = _.find(nestedObj, function(y) {
                        return y[nestedKey] === x[nestedKey];
                    });
                    if (_.isNil(obj)) {
                        //force state to delete ($state=4)
                        x.$state = 4;
                        nestedObj.push(x);
                    }
                });

                //and finally save objects
                nestedModel.silent().save(nestedObj, function(err) {
                    //remove $state attribute
                    _.forEach(nestedObj, function(x) {
                        delete x.$state;
                    });
                    if (err) { return callback(err); }
                    return callback();
                });
            });
    }
    else {
        return callback();
    }
}


/**
 * @module @themost/data/data-nested-object-listener
 * @ignore
 */

/**
 * @class
 * @constructor
 */
function DataNestedObjectListener() {

}

/**
 * @param {DataEventArgs} event
 * @param {Function} callback
 */
DataNestedObjectListener.prototype.beforeSave = function (event, callback) {
    try {
        //get attributes with nested property set to on
        var nested = event.model.attributes.filter(function(x) {
            //only if these attributes belong to current model
            return x.nested && (x.model === event.model.name);
        });
        //if there are no attribute defined as nested do nothing
        if (nested.length === 0) { return callback(); }
        async.eachSeries(nested, function(attr, cb) {
            if (attr.many===true) {
                return cb();
            }
            return beforeSave_(attr, event, cb);
        }, function(err) {
            return callback(err);
        });
    }
    catch (err) {
        return callback(err);
    }
};

function beforeRemove_(attr, event, callback) {
    try {
        if (event.state !== 4) { return callback(); }
        var context = event.model.context,
            name = attr.property || attr.name,
            key = event.model.getPrimaryKey();
        /**
         * @type {DataModel}
         */
        var nestedModel = context.model(attr.type);
        if (_.isNil(nestedModel)) { return callback(); }
        event.model.where(key).equal(event.target[key]).select(key,name).flatten().silent().first(function(err, result) {
            if (err) { return callback(err); }
            if (_.isNil(result)) { return callback(); }
            if (_.isNil(result[name])) { return callback(); }
            //set silent mode (if parent model is in silent mode)
            if (event.model.isSilent()) {
                nestedModel.silent();
            }
            var nestedKey =  result[name];
            //Update target object (remove the association between target object and nested object).
            //This operation must be done before trying to remove nested object otherwise the operation will fail with foreign key reference error
            var updated = {};
            updated[name] = null;
            var q = QueryUtils.update(event.model.sourceAdapter).set(updated).where(event.model.primaryKey).equal(result[event.model.primaryKey]);
            return context.db.execute(q, null, function(err) {
                if (err) {
                    return callback(err);
                }
                nestedModel.silent().remove({id:nestedKey}).then(function() {
                    return callback();
                }).catch(function(err) {
                    return callback(err);
                });
            });

        });
    }
    catch (err) {
        callback(err)
    }
}


// eslint-disable-next-line no-unused-vars
function beforeRemoveMany_(attr, event, callback) {
    try {
        if (event.state !== 4) { return callback(); }
        var context = event.model.context,
            name = attr.property || attr.name;
        var nestedModel = context.model(attr.type);
        if (_.isNil(nestedModel)) { return callback(); }
        //get junction
        var junction = event.target.property(name);
        //select object identifiers (get all objects in silent mode to avoid orphaned objects)
        junction.select(nestedModel.getPrimaryKey()).silent().all().then(function(result) {
            //first of all remove all associations
            junction.clear(function(err) {
                if (err) { return callback(err); }
                //and afterwards remove nested objects
                nestedModel.silent().remove(result, function(err) {
                    if (err) { return callback(); }
                });
            });
        }).catch(function(err) {
           return callback(err);
        });
    }
    catch (err) {
        callback(err)
    }
}

DataNestedObjectListener.prototype.beforeRemove = function (event, callback) {
    try {
        //get attributes with nested property set to on
        var nested = event.model.attributes.filter(function(x) {
            //only if these attributes belong to current model
            return x.nested && (x.model === event.model.name);
        });
        //if there are no attribute defined as nested, do nothing and exit
        if (nested.length === 0) { return callback(); }
        async.eachSeries(nested, function(attr, cb) {
            return beforeRemove_(attr, event, cb);
        }, function(err) {
            return callback(err);
        });
    }
    catch (err) {
        return callback(err);
    }
};

/**
 * Handles after save event for one-to-one associations where the parent model is the current model.
 * This operation uses interactive user (or in-process) privileges for insert, update, delete
 * @param {DataField} attr
 * @param {DataEventArgs} event
 * @param {Function} callback
 * @returns {*}
 * @private
 */
function afterSave_(attr, event, callback) {
    // get context
    var context = event.model.context;
    // get attribute
    var name = attr.property || attr.name;
    // if target object does not have a property with the specified name
    if (event.target.hasOwnProperty(name) === false) {
        // return
        return callback();
    }
    // get nested object
    var nestedObject = event.target[name];
    //if attribute is null or undefined and state is insert
    if (nestedObject == null && event.state === 1) {
        //do nothing
        return callback();
    }
    /**
     * get nested model
     * @type {DataModel}
     */
    var nestedModel = context.model(attr.type);
    //if target model cannot be found
    if (_.isNil(nestedModel)) {
        // do nothing
        return callback();
    }
    // get mapping
    var mapping = event.model.inferMapping(attr.name);
    if (_.isNil(mapping)) {
        // throw error
        return callback(new DataError('EASSOCIATION','Association mapping may not be empty.', null, event.model.name, attr.name));
    }
    // check if mapping parent model is the same with event target model
    if (mapping.parentModel !== event.model.name) {
        // do nothing
        return callback();
    }
    // validate nested object
    if (_.isArray(nestedObject)) {
        // throw error for invalid nested object type
        return callback(new DataError('EASSOCIATION', 'Expected object.', null, event.model.name, name));
    }
    // get in-process silent mode
    var silent = event.model.isSilent();
    // get nested primary key
    var nestedKey = nestedModel.getPrimaryKey();
    if (nestedObject) {
        // safe delete identifier
        delete nestedObject[nestedKey];
        // set associated value
        nestedObject[mapping.childField] = event.target[mapping.parentField];
    }
    if (event.state === 1) {
        // save nested object (with interactive user privileges)
        return nestedModel.silent(silent).save(nestedObject).then(function() {
            // and return
            return callback();
        }).catch(function(err) {
            return callback(err);
        });
    }
    else if (event.state === 2) {
        if (nestedObject == null) {
            // try to find nested object
            return nestedModel.where(mapping.childField).equal(event.target[mapping.parentField])
                .silent().getItem().then(function (originalObject) {
                    if (originalObject) {
                        // try to remove (with interactive user privileges)
                        return nestedModel.silent(silent).remove(originalObject).then(function() {
                           // and return
                           return callback();
                        });
                    }
                    // else do nothing
                    return callback();
                }).catch(function(err) {
                    return callback(err);
                });
        }
        else {
            // update nested object (with interactive user privileges)
            return nestedModel.silent(silent).save(nestedObject).then(function() {
                // and return
                return callback();
            }).catch(function(err) {
                return callback(err);
            });
        }
    }
    // otherwise do nothing
    return callback();
}

function afterSaveMany_(attr, event, callback) {
    var context = event.model.context;
    var name = attr.property || attr.name;
    var key = event.model.getPrimaryKey();
    var nestedObj = event.target[name];
    //if attribute is null or undefined
    if (_.isNil(nestedObj)) {
        //do nothing
        return callback();
    }
    //if nested object is not an array
    if (!_.isArray(nestedObj)) {
        //throw exception
        return callback(new DataError("EASSOCIATION","Invalid argument type. Expected array.",null, event.model.name, name));
    }
    //get mapping
    var mapping = event.model.inferMapping(attr.name);
    if (_.isNil(mapping)) {
        return callback(new DataError('EASSOCIATION','Association mapping may not be empty.', null, event.model.name, attr.name));
    }
    if (mapping.associationType === 'junction') {
        return callback(new DataError('EASSOCIATION','Junction nested association type is not supported.', null, event.model.name, attr.name));
    }
    if (mapping.associationType === 'association' && mapping.parentModel !== event.model.name) {
        return callback(new DataError('EASSOCIATION','Invalid nested association type.', null, event.model.name, attr.name));
    }
    //get target model
    var nestedModel = context.model(attr.type);
    //if target model cannot be found
    if (_.isNil(nestedModel)) {
        return callback();
    }
    //get nested primary key
    var nestedKey = nestedModel.getPrimaryKey();
    //on insert
    if (event.state===1) {
        //enumerate nested objects and set state to new
        _.forEach(nestedObj, function(x) {
            //delete identifier
            delete x[nestedKey];
            //force state to new ($state=1)
            x.$state = 1;
            //set parent field for mapping
            x[mapping.childField] = event.target[mapping.parentField];
        });
        //save nested objects
        nestedModel.silent().save(nestedObj, function(err) {
            //remove $state attribute
            nestedObj.forEach(function(x) { delete x.$state; });
            //and return
            callback(err);
        });
    }
    //on update
    else if (event.state === 2) {
        //first of all get original associated object, if any
        event.model.where(key)
            .equal(event.target[key])
            .select(key,name)
            .expand(name)
            .silent()
            .first(function(err, result) {
                if (err) { return callback(err); }
                //if original object cannot be found, throw an invalid state exception
                if (_.isNil(result)) { return callback(new Error('Invalid object state.')); }
                //get original nested objects
                var originalNestedObjects = result[name] || [];
                //enumerate nested objects

                _.forEach(nestedObj, function(x) {
                    var obj = _.find(originalNestedObjects, function (y) {
                        return y[nestedKey] === x[nestedKey];
                    });
                    if (obj) {
                        //force state to update ($state=2)
                        x.$state = 2;
                    }
                    else {
                        //delete identifier
                        delete x[nestedKey];
                        //force state to new ($state=1)
                        x.$state = 1;
                    }
                    x[mapping.childField] = event.target[mapping.parentField];
                });

                _.forEach(originalNestedObjects, function(x) {
                    var obj = _.find(nestedObj, function(y) {
                        return y[nestedKey] === x[nestedKey];
                    });
                    if (_.isNil(obj)) {
                        //force state to delete ($state=4)
                        x.$state = 4;
                        nestedObj.push(x);
                    }
                });

                //and finally save objects
                nestedModel.silent().save(nestedObj, function(err) {
                    //remove $state attribute
                    _.remove(nestedObj, function(y) {
                       return y.$state === 4;
                    });
                    _.forEach(nestedObj, function(x) {
                        delete x.$state;
                    });
                    if (err) { return callback(err); }
                    return callback();
                });
            });
    }
    else {
        return callback();
    }
}


/**
 * @param {DataEventArgs} event
 * @param {Function} callback
 */
DataNestedObjectListener.prototype.afterSave = function (event, callback) {
    try {
        //get attributes with nested property set to on
        var nested = event.model.attributes.filter(function(x) {
            //only if these attributes belong to current model
            return x.nested && (x.model === event.model.name);
        });
        //if there are no attribute defined as nested do nothing
        if (nested.length === 0) {
            return callback();
        }
        async.eachSeries(nested, function(attr, cb) {
            // get mapping
            var mapping = event.model.inferMapping(attr.name);
            if (mapping && mapping.parentModel === event.model.name) {
                // check constraints
                var childModel = event.model.context.model(mapping.childModel);
                // if child model was found
                if (childModel &&
                    // has constraints
                    childModel.constraints &&
                    // constraints is not empty
                    childModel.constraints.length &&
                    // and there is a constraint that has one key and this key is the mapping child field
                    childModel.constraints.find(function(constraint) {
                        return constraint.fields && constraint.fields.length === 1 && constraint.fields.indexOf(mapping.childField) === 0;
                    })) {
                    // try to save one-to-one nested association where parent model is the current model
                    return afterSave_(attr, event, cb);
                }
            }
            if (attr.many===true) {
                return afterSaveMany_(attr, event, cb);
            }
            return cb();
        }, function(err) {
            return callback(err);
        });
    }
    catch (err) {
        return callback(err);
    }
};


if (typeof exports !== 'undefined')
{
    module.exports.DataNestedObjectListener = DataNestedObjectListener;
}
