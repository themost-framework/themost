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
var DataNotFoundError = require("@themost/common/errors").DataNotFoundError;
var async = require("async");

/**
 * @module @themost/data/data-state-validator
 * @ignore
 */

/**
 * @class
 * @constructor
 * @classdesc Validates the state of a data object. DataStateValidatorListener is one of the default listeners which are being registered for all data models.
 <p>If the target data object belongs to a model which has one or more constraints, it will try to validate object's state against these constraints.
 <p>In the following example the process tries to save the favourite color of a user and passes name instead of user's identifier.
 DataStateValidatorListener will try to find a user based on the unique constraint of User model and then
 it will try to validate object's state based on the defined unique constraint of UserColor model.</p>
 <pre class="prettyprint"><code>
 // #User.json
 ...
 "constraints":[
 {
     "description": "User name must be unique across different records.",
     "type":"unique",
     "fields": [ "name" ]
 }]
 ...
 </code></pre>
 <pre class="prettyprint"><code>
 // #UserColor.json
 ...
 "constraints":[
    { "type":"unique", "fields": [ "user", "tag" ] }
 ]
 ...
 </code></pre>
 <pre class="prettyprint"><code>
 var userColor = {
        "user": {
            "name":"admin@example.com"
        },
        "color":"#FF3412",
        "tag":"favourite"
    };
 context.model('UserColor').save(userColor).then(function(userColor) {
        done();
    }).catch(function (err) {
        done(err);
    });
 </code></pre>
 </p>
 */
function DataStateValidatorListener() {
    //
}
/**
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function mapKey_(obj, callback) {
    var self = this;
    if (_.isNil(obj)) {
        return callback(new Error('Object cannot be null at this context'));
    }
    if (self.primaryKey && obj.hasOwnProperty(self.primaryKey)) {
        //already mapped
        return callback(null, true);
    }
    //get unique constraints
    var arr = self.constraintCollection.filter(function(x) { return x.type==='unique' }), objectFound=false;
    if (arr.length === 0) {
        //do nothing and exit
        return callback();
    }
    async.eachSeries(arr, function(constraint, cb) {
        try {
            if (objectFound) {
                return cb();
            }
            /**
             * @type {DataQueryable}
             */
            var q;
            var fnAppendQuery = function(attr, value) {
                if (_.isNil(value))
                    value = null;
                if (q)
                    q.and(attr).equal(value);
                else
                    q = self.where(attr).equal(value);
            };
            if (_.isArray(constraint.fields)) {
                for (var i = 0; i < constraint.fields.length; i++) {
                    var attr = constraint.fields[i];
                    if (!obj.hasOwnProperty(attr)) {
                        return cb();
                    }
                    var parentObj = obj[attr], value = parentObj;
                    //check field mapping
                    var mapping = self.inferMapping(attr);
                    if (_.isObject(mapping) && (typeof parentObj === 'object')) {
                        if (parentObj.hasOwnProperty(mapping.parentField)) {
                            fnAppendQuery(attr, parentObj[mapping.parentField]);
                        }
                        else {
                            /**
                             * Try to find if parent model has a unique constraint and constraint fields are defined
                             * @type {DataModel}
                             */
                            var parentModel = self.context.model(mapping.parentModel),
                                parentConstraint = parentModel.constraintCollection.find(function(x) { return x.type==='unique' });
                            if (parentConstraint) {
                                parentConstraint.fields.forEach(function(x) {
                                    fnAppendQuery(attr + "/" + x, parentObj[x]);
                                });
                            }
                            else {
                                fnAppendQuery(attr, null);
                            }
                        }
                    }
                    else {
                        fnAppendQuery(attr, value);
                    }
                }
                if (_.isNil(q)) {
                    cb();
                }
                else {
                    q.silent().flatten().select(self.primaryKey).value(function(err, result) {
                        if (err) {
                            cb(err);
                        }
                        else if (typeof result !== 'undefined' && result !== null) {
                            //set primary key value
                            obj[self.primaryKey] = result;
                            //object found
                            objectFound=true;
                            cb();
                        }
                        else {
                            cb();
                        }
                    });
                }
            }
            else {
                cb();
            }
        }
        catch(e) {
            cb(e);
        }
    }, function(err) {
        callback(err, objectFound);
    });
}

/**
 * Occurs before creating or updating a data object and validates object state.
 * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
DataStateValidatorListener.prototype.beforeSave = function(event, callback) {
    try {
        if (_.isNil(event)) {
            return callback();
        }
        if (_.isNil(event.state)) {event.state = 1; }

        var model = event.model, target = event.target;
        //if model or target is not defined do nothing and exit
        if (_.isNil(model) || _.isNil(target)) {
            return callback();
        }
        //get key state
        var keyState = (model.primaryKey && target.hasOwnProperty(model.primaryKey));
        //if target has $state property defined, set this state and exit
        if (event.target.$state) {
            event.state = event.target.$state;
        }
        //if object has primary key
        else if (keyState) {
            event.state = 2;
        }
        //if state is Update (2)
        if (event.state === 2) {
            //if key exists exit
            if (keyState) {
                return callback();
            }
            else {
                return mapKey_.call(model, target, function(err) {
                    if (err) { return callback(err); }
                    //if object is mapped with a key exit
                    return callback();
                });
            }
        }
        else if (event.state === 1) {
            if (!keyState) {
                return mapKey_.call(model, target, function(err, result) {
                    if (err) { return callback(err); }
                    if (result) {
                        //set state to Update
                        event.state = 2;
                    }
                    return callback();
                });
            }
            //otherwise do nothing
            return callback();
        }
        else {
            return callback();
        }

    }
    catch(er) {
        callback(er);
    }
};
/**
 * Occurs before removing a data object and validates object state.
 * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
DataStateValidatorListener.prototype.beforeRemove = function(event, callback) {
    //validate event arguments
    if (_.isNil(event)) { return callback(); }
    //validate state (the default is Delete=4)
    if (_.isNil(event.state)) {event.state = 4; }
    var model = event.model, target = event.target;
    //if model or target is not defined do nothing and exit
    if (_.isNil(model) || _.isNil(target)) {
        return callback();
    }
    //if object primary key is already defined
    if (model.primaryKey && target.hasOwnProperty(model.primaryKey)) {
        // check if object exists
            return model.where(model.primaryKey).equal(target[model.primaryKey]).value().then(function (result) {
                if (typeof result !== 'undefined' && result !== null) {
                    // set state to deleted
                    event.state = 4;
                    // return
                    return callback();
                }
                // otherwise throw error not found
                return callback(_.assign(new DataNotFoundError('The target object cannot be found or is inaccessible.',null, model.name), {
                    "key": target[model.primaryKey]
                }));
            }).catch(function (err) {
                return callback(err);
            });
    }
    mapKey_.call(model, target, function(err, result) {
        if (err) {
            return callback(err);
        }
        else if (typeof result !== 'undefined' && result !== null) {
            //continue and exit
            return callback();
        }
        else {
            callback(new DataNotFoundError('The target object cannot be found or is inaccessible.',null, model.name));
        }
    });

};

if (typeof exports !== 'undefined')
{
    module.exports = {
        /**
         * @constructs DataStateValidatorListener
         */
        DataStateValidatorListener:DataStateValidatorListener
    };
}