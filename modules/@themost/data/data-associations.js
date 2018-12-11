/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var async = require('async');
var parseBoolean = require('./types').parsers.parseBoolean;
var DataError = require('@themost/common/errors').DataError;
var _ = require('lodash');

/**
 * @module @themost/data/data-associations
 * @ignore
 */

/**
 * @class DataObjectAssociationListener
 * @constructor
 */
function DataObjectAssociationListener() {
    //
}
/**
 *
 * @param {DataEventArgs} event
 * @param {function(Error=)} callback
 */
DataObjectAssociationListener.prototype.beforeSave = function(event, callback) {
    try {
        if (_.isNil(event.target)) {
            return callback();
        }
        else {
            var keys = Object.keys(event.target);
            var mappings = [];
            keys.forEach(function(x) {
                if (event.target.hasOwnProperty(x) && typeof event.target[x] === 'object' && event.target[x] !== null) {
                        //try to find field mapping, if any
                        var mapping = event.model.inferMapping(x);
                        if (mapping && mapping.associationType==='association' && mapping.childModel===event.model.name)
                            mappings.push(mapping);
                }
            });
            async.eachSeries(mappings,
                /**
                 * @param {DataAssociationMapping} mapping
                 * @param {function(Error=)} cb
                 */
                function(mapping, cb) {
                    if (mapping.associationType==='association' && mapping.childModel===event.model.name) {
                        /**
                         * @type {DataField|*}
                         */
                        var field = event.model.field(mapping.childField),
                            childField = field.property || field.name;
                        //foreign key association
                        if (typeof event.target[childField] !== 'object') {
                            return cb();
                        }
                        if (event.target[childField].hasOwnProperty(mapping.parentField)) {
                            return cb();
                        }
                        //change:21-Mar 2016
                        //description: check if association belongs to this model or it's inherited from any base model
                        //if current association belongs to base model
                        if ((event.model.name !== field.model) && (!parseBoolean(field.cloned))) {
                            //do nothing and exit
                            return cb();
                        }
                        //get associated mode
                        var associatedModel = event.model.context.model(mapping.parentModel);
                        associatedModel.find(event.target[childField]).select(mapping.parentField).silent().flatten().take(1).list(function(err, result) {
                            if (err) {
                                cb(err);
                            }
                            else if (_.isNil(result)) {
                                return cb(new DataError('EDATA','An associated object cannot be found.',null, associatedModel.name));
                            }
                            else if (result.total===0) {
                                return cb(new DataError('EDATA','An associated object cannot be found.',null, associatedModel.name));
                            }
                            else if (result.total>1) {
                                return cb(new DataError('EDATA','An associated object is defined more than once and cannot be bound.',null, associatedModel.name));
                            }
                            else {
                                event.target[childField][mapping.parentField]=result.value[0][mapping.parentField];
                                cb();
                            }
                        });
                    }
                    else {
                       cb();
                    }

                }, function(err) {
                    if (err) {
                        console.log(err);
                    }
                    callback(err);
                });
        }
    }
    catch (err) {
        callback(err);
    }

};

/**
 *
 * @param {DataEventArgs} event
 * @param {function(Error=)} callback
 */
DataObjectAssociationListener.prototype.afterSave = function(event, callback) {
    try {
        if (typeof event.target === 'undefined' || event.target===null) {
            callback(null);
        }
        else {
            var keys = Object.keys(event.target);
            var mappings = [];
            keys.forEach(function(x) {
                if (event.target.hasOwnProperty(x)) {
                    /**
                     * @type DataAssociationMapping
                     */
                    var mapping = event.model.inferMapping(x);
                    if (mapping)
                        if (mapping.associationType==='junction') {
                            mappings.push({ name:x, mapping:mapping });
                        }
                }
            });
            async.eachSeries(mappings,
                /**
                 * @param {{name:string,mapping:DataAssociationMapping}} x
                 * @param {function(Error=)} cb
                 */
                function(x, cb) {

                    var silentMode = parseBoolean(event.model.$silent);

                    if (x.mapping.associationType==='junction') {
                        var obj = event.model.convert(event.target);
                        /**
                         * @type {*|{deleted:Array}}
                         */
                        var childs = obj[x.name], junction;
                        if (!_.isArray(childs)) { return cb(); }
                        if (x.mapping.childModel===event.model.name) {
                            var HasParentJunction = require('./has-parent-junction').HasParentJunction;
                            junction = new HasParentJunction(obj, x.mapping);
                            if (event.state===1 || event.state===2) {
                                var toBeRemoved = [], toBeInserted = [];
                                _.forEach(childs, function(x) {
                                    if (x.$state === 4) {
                                        toBeRemoved.push(x);
                                    }
                                    else {
                                        toBeInserted.push(x);
                                    }
                                });
                                junction.silent(silentMode).insert(toBeInserted, function(err) {
                                    if (err) { return cb(err); }
                                    junction.silent(silentMode).remove(toBeRemoved, function(err) {
                                        if (err) { return cb(err); }
                                        return cb();
                                    });
                                });
                            }
                            else  {
                                return cb();
                            }
                        }
                        else if (x.mapping.parentModel===event.model.name) {

                            if (event.state===1 || event.state===2) {
                                var DataObjectJunction = require('./data-object-junction').DataObjectJunction,
                                    DataObjectTag = require('./data-object-tag').DataObjectTag;

                                if (typeof x.mapping.childModel === 'undefined') {
                                    /**
                                     * @type {DataObjectTag}
                                     */
                                    var tags = new DataObjectTag(obj, x.mapping);
                                    return tags.silent(silentMode).all().then(function(result) {
                                        var toBeRemoved = result.filter(function(x) { return childs.indexOf(x)<0; });
                                        var toBeInserted = childs.filter(function(x) { return result.indexOf(x)<0; });
                                        if (toBeRemoved.length>0) {
                                            return tags.silent(silentMode).remove(toBeRemoved).then(function() {
                                                if (toBeInserted.length===0) { return cb(); }
                                                return tags.silent(silentMode).insert(toBeInserted).then(function() {
                                                    return cb();
                                                });
                                            }).catch(function (err) {
                                                return cb(err);
                                            });
                                        }
                                        if (toBeInserted.length===0) { return cb(); }
                                        return tags.silent(silentMode).insert(toBeInserted).then(function() {
                                            return cb();
                                        });
                                    }).catch(function (err) {
                                        return cb(err);
                                    });
                                }
                                else {
                                    junction = new DataObjectJunction(obj, x.mapping);
                                    junction.silent(silentMode).insert(childs, function(err) {
                                        if (err) { return cb(err); }
                                        var toBeRemoved = [], toBeInserted = [];
                                        _.forEach(childs, function(x) {
                                            if (x.$state === 4) {
                                                toBeRemoved.push(x);
                                            }
                                            else {
                                                toBeInserted.push(x);
                                            }
                                        });
                                        junction.silent(silentMode).insert(toBeInserted, function(err) {
                                            if (err) { return cb(err); }
                                            junction.silent(silentMode).remove(toBeRemoved, function(err) {
                                                if (err) { return cb(err); }
                                                return cb();
                                            });
                                        });
                                    });
                                }
                            }
                            else  {
                                cb();
                            }
                        }
                        else {
                            cb();
                        }
                    }
                    else
                        cb(null);

                }, function(err) {
                    callback(err);
                });
        }
    }
    catch (err) {
        callback(err);
    }
};



if (typeof exports !== 'undefined')
{
    module.exports = {
        DataObjectAssociationListener:DataObjectAssociationListener
    };
}