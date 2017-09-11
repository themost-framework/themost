/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2015-09-27.
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
var async = require('async'),
    util = require('util'),
    HasParentJunction = require('most-data/has-parent-junction').HasParentJunction,
    DataObjectJunction = require('most-data/data-object-junction').DataObjectJunction,
    DataException = require('./types').DataException,
    _ = require('lodash');

/**
 * @class
 * @constructor
 */
function DataReferencedObjectListener() {
    //
}

/**
 *
 * @param {DataEventArgs} event
 * @param {DataAssociationMapping} mapping
 * @param {Function} callback
 */
function beforeRemoveAssociatedObjects(event, mapping, callback) {
    if (mapping.associationType !== 'association') {
        return callback(new TypeError('Invalid association type. Expected a valid foreign key association.'));
    }
    if (mapping.parentModel !== event.model.name) {
        return callback(new TypeError('Invalid association type. Expected a valid referenced key association.'));
    }
    var context = event.model.context;
    var parentModel = event.model,
        silent = event.model.$silent,
        childModel = context.model(mapping.childModel),
        parentField = event.model.getAttribute(mapping.parentField),
        childField = childModel.getAttribute(mapping.childField);
    parentModel.where(parentModel.primaryKey).equal(event.target[parentModel.primaryKey])
        .select(parentField.name).silent().flatten().value()
        .then(function(parentKey) {
            if (_.isNil(parentKey)) {
                return callback();
            }
            return childModel.where(mapping.childField).equal(parentKey).count().then(function(count) {
                if (count>0) {
                    mapping.cascade = mapping.cascade || 'none';
                    if (mapping.cascade === 'none') {
                        return callback(new DataException('EFKEY','Cannot delete this object since it is being referenced by another entity.',null,childModel.name, childField.name));
                    }
                    else if (mapping.cascade === 'null' || mapping.cascade === 'default') {
                        return childModel.where(mapping.childField).equal(event.target[mapping.parentField])
                            .select(childModel.primaryKey, childModel.childField)
                            .silent()
                            .flatten()
                            .all().then(function(items) {
                                var childKey = childField.property || childField.name;
                                _.forEach(items, function(x) {
                                    if (x.hasOwnProperty(childKey)) {
                                        x[childKey] = null;
                                    }
                                    else {
                                        x[childKey] = null;
                                    }
                                });
                                return childModel.silent(silent).save(items).then(function() {
                                    return callback();
                                });
                            });
                    }
                    else if (mapping.cascade === 'delete') {
                        return childModel.where(mapping.childField).equal(event.target[mapping.parentField])
                            .select(childModel.primaryKey)
                            .silent()
                            .flatten()
                            .all().then(function(items) {
                                return childModel.silent(silent).remove(items).then(function() {
                                    return callback();
                                });
                            });
                    }
                    else {
                        return callback(new DataException('EATTR', 'Invalid cascade action', childModel.name, childField.name));
                    }
                }
                else {
                    return callback();
                }
            });
        }).catch(function(err) {
        return callback(err);
    });
}
/**
 *
 * @param {DataEventArgs} event
 * @param {DataAssociationMapping} mapping
 * @param {Function} callback
 */
function beforeRemoveParentConnectedObjects(event, mapping, callback) {
    if (mapping.associationType !== 'junction') {
        return callback(new TypeError('Invalid association type. Expected a valid junction.'));
    }
    if (mapping.childModel !== event.model.name) {
        return callback();
    }
    var childModel = event.model,
        silent = event.model.$silent,
        childField = childModel.getAttribute(mapping.childField);
    var junction = new DataObjectJunction(event.target, mapping);
    return childModel.where(childModel.primaryKey).equal(event.target.getId())
        .select(childField.name).silent().flatten().value()
        .then(function(childKey) {
            if (_.isNil(childKey)) {
                return callback();
            }
            var baseModel = junction.getBaseModel();
            baseModel.where(junction.getChildField().name).equal(childKey)
                .select(baseModel.primaryKey)
                .silent()
                .all().then(function(items) {
                mapping.cascade = mapping.cascade || 'none';
                if (mapping.cascade === 'none') {
                    if (items.length === 0) {
                        return callback();
                    }
                    return callback(new DataException('EFKEY','Cannot delete this object since it is being referenced by another entity.',null,childModel.name, childField.name));
                }
                else if (mapping.cascade === 'delete'  || mapping.cascade === 'null' || mapping.cascade === 'default') {
                    return baseModel.silent(silent).remove(items).then(function() {
                        return callback();
                    });
                }
                else {
                    return callback(new DataException('EATTR', 'Invalid cascade action', childModel.name, childField.name));
                }

            }).catch(function(err) {
                return callback(err);
            });
        });
}

/**
 *
 * @param {DataEventArgs} event
 * @param {DataAssociationMapping} mapping
 * @param {Function} callback
 */
function beforeRemoveChildConnectedObjects(event, mapping, callback) {
    var context = event.model.context;
    if (mapping.associationType !== 'junction') {
        return callback(new TypeError('Invalid association type. Expected a valid junction.'));
    }
    if (mapping.parentModel !== event.model.name) {
        return callback();
    }
    var childModel = context.model(mapping.childModel),
        silent = event.model.$silent,
        parentModel =  event.model,
        parentField = parentModel.getAttribute(mapping.parentField);
    var junction = new HasParentJunction(event.target, mapping);
    return parentModel.where(parentModel.primaryKey).equal(event.target.getId())
        .select(parentField.name).silent().flatten().value()
        .then(function(parentKey) {
            if (_.isNil(parentKey)) {
                return callback();
            }
            var baseModel = junction.getBaseModel();
            baseModel.where(junction.getParentField().name).equal(parentKey)
                .select(baseModel.primaryKey)
                .silent()
                .all().then(function(items) {
                mapping.cascade = mapping.cascade || 'none';
                if (mapping.cascade === 'none') {
                    if (items.length===0) {
                        return callback();
                    }
                    return callback(new DataException('EFKEY','Cannot delete this object since it is being referenced by another entity.',null,childModel.name, childField.name));
                }
                else if (mapping.cascade === 'delete'  || mapping.cascade === 'null' || mapping.cascade === 'default') {
                    if (items.length===0) {
                        return callback();
                    }
                    return baseModel.silent(silent).remove(items).then(function() {
                        return callback();
                    });
                }
                else {
                    return callback(new DataException('EATTR', 'Invalid cascade action', parentModel.name, parentField.name));
                }

            }).catch(function(err) {
                return callback(err);
            });
        });
}

/**
 * @param {DataEventArgs} event
 * @param {function(Error=)} callback
 */
DataReferencedObjectListener.prototype.beforeRemove = function (event, callback) {
    return event.model.getReferenceMappings(false).then(function(mappings) {
        async.eachSeries(mappings,
            /**
             * @param {DataAssociationMapping} mapping
             * @param {Function} cb
             */
            function(mapping, cb) {
                if (mapping.associationType === 'association') {
                    return beforeRemoveAssociatedObjects(event, mapping, cb);
                }
                else if (mapping.associationType === 'junction' && mapping.parentModel === event.model.name) {
                    return beforeRemoveChildConnectedObjects(event, mapping, cb);
                }
                else if (mapping.associationType === 'junction' && mapping.childModel === event.model.name) {
                    return beforeRemoveParentConnectedObjects(event, mapping, cb);
                }
                else {
                    return cb();
                }
            }, function(err) {
                callback(err);
            });
    }).catch(function(err) {
        return callback(err);
    });
};

if (typeof exports !== 'undefined')
{
    module.exports.DataReferencedObjectListener = DataReferencedObjectListener;
}