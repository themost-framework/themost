/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var _ = require("lodash");
var async = require("async");
var DataError = require('@themost/common/errors').DataError;

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
            result[name] = null;
            return event.model.save(result).then(function() {
                nestedModel.remove({id:nestedKey}, function() {
                    return callback();
                });
            }).catch(function(err) {
                return callback(err);
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
    //if nested array does not have any data
    if (nestedObj.length===0) {
        //do nothing
        return callback();
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
        if (nested.length === 0) { return callback(); }
        async.eachSeries(nested, function(attr, cb) {
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