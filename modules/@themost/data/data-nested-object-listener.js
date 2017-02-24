/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2016-03-13.
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
 * @private
 */
var _ = require("lodash"),
    types = require("./types")
    async = require("async");

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
    if (event.state==1) {
        //save nested object
        nestedModel.silent().save(nestedObj, function(err) {
            callback(err);
        });
    }
    else if (event.state == 2) {
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
    var context = event.model.context,
        name = attr.property || attr.name,
        key = event.model.getPrimaryKey(),
        nestedObj = event.target[name];
    //if attribute is null or undefined
    if (_.isNil(nestedObj)) {
        //do nothing
        return callback();
    }
    //if nested object is not an array
    if (!_.isArray(nestedObj)) {
        //throw exception
        return callback(new types.DataException("EJUNCT","Invalid argument type. Expected array.",null, event.model.name, name));
    }
    //if nested array does not have any data
    if (nestedObj.length==0) {
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
    if (event.state==1) {
        //enumerate nested objects and set state to new
        nestedObj.forEach(function(x) {
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
    else if (event.state == 2) {
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
                nestedObj.forEach(function(x) {
                    //search in original nested objects
                    var obj = originalNestedObjects.find(function(y) { return y[nestedKey] == x[nestedKey]; });
                    //if object already exists
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
                //and finally save objects
                nestedModel.silent().save(nestedObj, function(err) {
                    //remove $state attribute
                    nestedObj.forEach(function(x) { delete x.$state; });
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
        if (nested.length == 0) { return callback(); }
        async.eachSeries(nested, function(attr, cb) {
            return beforeSave_(attr, event, cb);
        }, function(err) {
            return callback(err);
        });
    }
    catch (e) {
        return callback(e);
    }
};

function beforeRemove_(attr, event, callback) {
    try {
        if (event.state !== 4) { return callback(); }
        var context = event.model.context,
            name = attr.property || attr.name,
            key = event.model.getPrimaryKey();
        var nestedModel = context.model(attr.type);
        if (_.isNil(nestedModel)) { return callback(); }
        event.model.where(key).equal(event.target[key]).select(key,name).flatten().silent().first(function(err, result) {
            if (err) { return callback(err); }
            if (_.isNil(result)) { return callback(); }
            if (_.isNil(result[name])) { return callback(); }
            nestedModel.remove({id:result[name]}, function(err) {
                return callback(err);
            });
        });
    }
    catch (e) {
        callback(e)
    }
}


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
    catch (e) {
        callback(e)
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
        if (nested.length == 0) { return callback(); }
        async.eachSeries(nested, function(attr, cb) {
            return beforeRemove_(attr, event, cb);
        }, function(err) {
            return callback(err);
        });
    }
    catch (e) {
        return callback(e);
    }
};

if (typeof exports !== 'undefined')
{
    module.exports = {
        DataNestedObjectListener:DataNestedObjectListener
    };
}