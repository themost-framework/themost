/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2015-09-15.
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 Anthi Oikonomou anthioikonomou@gmail.com
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of MOST Web Framework nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @ignore
 */
var dataCommon = require("./common"),
    _ = require("lodash"),
    types = require("./types"),
    async = require("async");

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
    if (self.primaryKey && obj[self.primaryKey]) {
        //already mapped
        return callback(null, true);
    }
    //get unique constraints
    var arr = self.constraintCollection.filter(function(x) { return x.type==='unique' }), objectFound=false;
    if (arr.length==0) {
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
                    if (dataCommon.isDefined(mapping) && (typeof parentObj === 'object')) {
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
                        else if (result) {
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
 * @param {DataEventArgs|*} e - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataStateValidatorListener.prototype.beforeSave = function(e, callback) {
    try {
        if (_.isNil(e)) {
            return callback();
        }
        if (_.isNil(e.state)) {e.state = 1; }

        var model = e.model, target = e.target;
        //if model or target is not defined do nothing and exit
        if (_.isNil(model) || _.isNil(target)) {
            return callback();
        }
        //get key state
        var keyState = (model.primaryKey && target[model.primaryKey]);
        //if target has $state property defined, set this state and exit
        if (e.target.$state) {
            e.state = e.target.$state;
        }
        //if object has primary key
        else if (keyState) {
            e.state = 2
        }
        //if state is Update (2)
        if (e.state == 2) {
            //if key exists exit
            if (keyState)
                return callback();
            else {
                return mapKey_.call(model, target, function(err) {
                    if (err) { return callback(err); }
                    //if object is mapped with a key exit
                    return callback();
                });
            }
        }
        else if (e.state == 1) {
            if (!keyState) {
                return mapKey_.call(model, target, function(err, result) {
                    if (err) { return callback(err); }
                    if (result) {
                        //set state to Update
                        e.state = 2
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
 * @param {DataEventArgs|*} e - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataStateValidatorListener.prototype.beforeRemove = function(e, callback) {
    //validate event arguments
    if (_.isNil(e)) { return callback(); }
    //validate state (the default is Delete=4)
    if (_.isNil(e.state)) {e.state = 4; }
    var model = e.model, target = e.target;
    //if model or target is not defined do nothing and exit
    if (_.isNil(model) || _.isNil(target)) {
        return callback();
    }
    //if object primary key is already defined
    if (model.primaryKey && target[model.primaryKey]) {
            e.state = 4;
            //do nothing and exist
            return callback();
    }
    mapKey_.call(model, target, function(err, result) {
        if (err) {
            return callback(err);
        }
        else if (result) {
            //continue and exit
            return callback();
        }
        else {
            callback(new types.DataException('EFOUND', 'The target object cannot be found.',null, model.name));
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