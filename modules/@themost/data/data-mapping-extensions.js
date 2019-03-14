/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _ = require('lodash');
var QueryUtils = require('@themost/query/utils').QueryUtils;
var QueryEntity = require('@themost/query/query').QueryEntity;
var QueryField = require('@themost/query/query').QueryField;
var Q = require('q');


/**
 * @module @themost/data/data-mapping-extensions
 * @ignore
 */

var mappingExtensions = {

    /**
     * @param {DataAssociationMapping|*} mapping
     * @returns {*}
     */
    extend: function(mapping) {
        var thisQueryable, childModel_, parentModel_;
        return {
            /**
             * @param {DataQueryable} dataQueryable
             */
            for: function(dataQueryable) {
                thisQueryable = dataQueryable;
                return this;
            },
            getChildModel: function() {
                if (_.isNil(thisQueryable)) {
                    return;
                }
                if (_.isObject(childModel_)) {
                    return childModel_;
                }
                childModel_ = thisQueryable.model.context.model(mapping.childModel);
                return childModel_;

            },
            getParentModel: function() {
                if (_.isNil(thisQueryable)) {
                    return;
                }
                if (_.isObject(parentModel_)) {
                    return parentModel_;
                }
                parentModel_ = thisQueryable.model.context.model(mapping.parentModel);
                return parentModel_;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getParents_v1: function(items) {

                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.childModel !== thisQueryable.model.name) || (mapping.associationType!=='junction')) {
                        return deferred.resolve();
                    }
                    //get array of key values (for childs)
                    var values = arr.filter(function(x) {
                        return (typeof x[mapping.childField]!=='undefined')
                            && (x[mapping.childField]!=null); })
                            .map(function(x) { return x[mapping.childField]
                            });
                    //query junction model
                    var HasParentJunction = require('./has-parent-junction').HasParentJunction;
                    var junction = new HasParentJunction(thisQueryable.model.convert({ }), mapping);
                    junction.getBaseModel().where(mapping.associationValueField).in(values).flatten().silent().all(function(err, junctions) {
                        if (err) { return deferred.reject(err); }
                        //get array of parent key values
                        values = _.intersection(junctions.map(function(x) { return x[mapping.associationObjectField] }));
                        //get parent model
                        var parentModel = thisArg.getParentModel();
                        //query parent with parent key values
                        parentModel.filter(mapping.options, function(err, q) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            q.prepare();
                            //Important Backward compatibility issue (<1.8.0)
                            //Description: if $levels parameter is not defined then set the default value to 0.
                            if (typeof q.$levels === 'undefined') {
                                q.$levels = 0;
                            }
                            q.where(mapping.parentField).in(values);
                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            //and finally query parent
                            q.getItems().then(function(parents){
                                //if result contains only one item
                                if (arr.length === 1) {
                                    arr[0][mapping.refersTo] = parents;
                                    return deferred.resolve();
                                }
                                //otherwise loop result array
                                arr.forEach(function(x) {
                                    //get child (key value)
                                    var childValue = x[mapping.childField];
                                    //get parent(s)
                                    var p = junctions.filter(function(y) { return (y[mapping.associationValueField]===childValue); }).map(function(r) { return r[mapping.associationObjectField]; });
                                    //filter data and set property value (a filtered array of parent objects)
                                    x[mapping.refersTo] = parents.filter(function(z) { return p.indexOf(z[mapping.parentField])>=0; });
                                });
                                return deferred.resolve();
                            }).catch(function(err) {
                                return deferred.reject(err);
                            });
                        });
                    });
                });
                return deferred.promise;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getParents : function(items) {
                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.childModel !== thisQueryable.model.name) || (mapping.associationType!=='junction')) {
                        return deferred.resolve();
                    }
                    var HasParentJunction = require('./has-parent-junction').HasParentJunction;
                    var junction = new HasParentJunction(thisQueryable.model.convert({ }), mapping);
                    return junction.migrate(function(err) {
                        if (err) { return deferred.reject(err); }
                        var parentModel = thisArg.getParentModel();
                        parentModel.filter(mapping.options, function(err, q) {
                            if (err) { return deferred.reject(err); }
                            //get junction sub-query
                            var junctionQuery = QueryUtils.query(junction.getBaseModel().name).select([mapping.associationObjectField, mapping.associationValueField])
                                .join(thisQueryable.query.as("j0"))
                                .with(QueryUtils.where(new QueryEntity(junction.getBaseModel().name).select(mapping.associationValueField))
                                    .equal(new QueryEntity("j0").select(mapping.childField)));
                            //append join statement with sub-query
                            q.query.join(junctionQuery.as("g0"))
                                .with(QueryUtils.where(new QueryEntity(parentModel.viewAdapter).select(mapping.parentField))
                                    .equal(new QueryEntity("g0").select(mapping.associationObjectField)));
                            if (!q.query.hasFields()) {
                                q.select();
                            }
                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            //append child key field
                            q.alsoSelect(QueryField.select(mapping.associationValueField).from("g0").as("ref__"));
                            return q.getItems().then(function (parents) {
                                _.forEach(arr, function(x) {
                                    x[mapping.refersTo] = _.filter(parents, function(y) {
                                        if (y['ref__'] === x[mapping.childField]) {
                                            delete y['ref__'];
                                            return true;
                                        }
                                        return false;
                                    });
                                });
                                return deferred.resolve();
                            }).catch(function (err) {
                                return deferred.reject(err);
                            });
                        });
                    });
                });
                return deferred.promise;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getChilds_v1: function(items) {
                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.parentModel !== thisQueryable.model.name) || (mapping.associationType!=='junction')) {
                        return deferred.resolve();
                    }
                    var values = arr.filter(function(x) {
                        return (typeof x[mapping.parentField]!=='undefined') && (x[mapping.parentField]!=null);
                    }).map(function(x) {
                        return x[mapping.parentField];
                    });
                    if (_.isNil(mapping.childModel)) {
                        var DataObjectTag = require('./data-object-tag').DataObjectTag;
                        junction = new DataObjectTag(thisQueryable.model.convert({ }), mapping);
                        return junction.getBaseModel().where("object").in(values).flatten().silent().select("object", "value").all().then(function(items) {
                            arr.forEach(function(x) {
                                x[mapping.refersTo] = items.filter(function(y) {
                                    return y["object"]===x[mapping.parentField];
                                }).map(function (y) {
                                    return y.value;
                                });
                            });
                            return deferred.resolve();
                        }).catch(function (err) {
                            return deferred.reject(err);
                        });
                    }
                    //create a dummy object
                    var DataObjectJunction = require('./data-object-junction').DataObjectJunction;
                    var junction = new DataObjectJunction(thisQueryable.model.convert({ }), mapping);
                    //query junction model
                    return junction.getBaseModel().where(mapping.associationObjectField).in(values).silent().flatten().getItems().then(function(junctions) {
                        //get array of child key values
                        var values = junctions.map(function(x) { return x[mapping.associationValueField] });
                        //get child model
                        var childModel = thisArg.getChildModel();
                        childModel.filter(mapping.options, function(err, q) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            q.prepare();
                            //Important Backward compatibility issue (<1.8.0)
                            //Description: if $levels parameter is not defined then set the default value to 0.
                            if (typeof q.$levels === 'undefined') {
                                q.$levels = 0;
                            }
                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            //append where statement for this operation
                            if (values.length===1) {
                                q.where(mapping.childField).equal(values[0]);
                            }
                            else {
                                q.where(mapping.childField).in(values);
                            }
                            //and finally query childs
                            q.getItems().then(function(childs) {
                                //if result contains only one item
                                if (arr.length === 1) {
                                    arr[0][mapping.refersTo] = childs;
                                    return deferred.resolve();
                                }
                                //otherwise loop result array
                                arr.forEach(function(x) {
                                    //get parent (key value)
                                    var parentValue = x[mapping.parentField];
                                    //get parent(s)
                                    var p = junctions.filter(function(y) { return (y[mapping.associationObjectField]===parentValue); }).map(function(r) { return r[mapping.associationValueField]; });
                                    //filter data and set property value (a filtered array of parent objects)
                                    x[mapping.refersTo] = childs.filter(function(z) { return p.indexOf(z[mapping.childField])>=0; });
                                });
                                return deferred.resolve();
                            }).catch(function(err) {
                                return deferred.reject(err);
                            });
                        });
                    }).catch(function (err) {
                        return deferred.reject(err);
                    });
                });
                return deferred.promise;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getChilds: function(items) {
                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.parentModel !== thisQueryable.model.name) || (mapping.associationType!=='junction')) {
                        return deferred.resolve();
                    }
                    var DataObjectJunction = require('./data-object-junction').DataObjectJunction;
                    var junction = new DataObjectJunction(thisQueryable.model.convert({ }), mapping);
                    return junction.migrate(function(err) {
                        if (err) { return deferred.reject(err); }
                        var childModel = thisArg.getChildModel();
                        childModel.filter(mapping.options, function(err, q) {
                            if (err) { return deferred.reject(err); }
                            if (!q.query.hasFields()) {
                                q.select();
                            }
                            //get junction sub-query
                            var junctionQuery = QueryUtils.query(junction.getBaseModel().name).select([mapping.associationObjectField, mapping.associationValueField])
                                .join(thisQueryable.query.as("j0"))
                                .with(QueryUtils.where(new QueryEntity(junction.getBaseModel().name).select(mapping.associationObjectField))
                                    .equal(new QueryEntity("j0").select(mapping.parentField)));
                            //append join statement with sub-query
                            q.query.join(junctionQuery.as("g0"))
                                .with(QueryUtils.where(new QueryEntity(childModel.viewAdapter).select(mapping.childField))
                                    .equal(new QueryEntity("g0").select(mapping.associationValueField)));

                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            //append item reference
                            q.alsoSelect(QueryField.select(mapping.associationObjectField).from("g0").as("ref__"));
                            return q.getItems().then(function (childs) {
                                _.forEach(arr, function(x) {
                                    x[mapping.refersTo] = _.filter(childs, function(y) {
                                        if (y['ref__'] === x[mapping.parentField]) {
                                            delete y['ref__'];
                                            return true;
                                        }
                                        return false;
                                    });
                                });
                                return deferred.resolve();
                            }).catch(function (err) {
                                return deferred.reject(err);
                            });
                        });
                    });
                });
                return deferred.promise;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getAssociatedParents: function(items) {
                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.childModel !== thisQueryable.model.name) || (mapping.associationType!=='association')) {
                        return deferred.resolve();
                    }
                    thisArg.getParentModel().migrate(function(err) {
                       if (err) { return deferred.reject(err); }
                        thisArg.getParentModel().filter(mapping.options, function(err, q) {
                           if (err) { return deferred.reject(err); }
                            //Important Backward compatibility issue (<1.8.0)
                            //Description: if $levels parameter is not defined then set the default value to 0.
                            if (typeof q.$levels === 'undefined') {
                                q.$levels = 0;
                            }
                            if (typeof q.query.$select === 'undefined') {
                               q.select();
                            }
                            q.query
                               .distinct()
                               .join(thisQueryable.query.as('j0'))
                               .with(QueryUtils.where(new QueryEntity(thisArg.getParentModel().viewAdapter).select(mapping.parentField))
                                   .equal(new QueryEntity("j0").select(mapping.childField)));
                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            q.silent().getAllItems().then(function(parents) {
                                var childField = thisQueryable.model.field(mapping.childField);
                                var keyField = childField.property || childField.name;
                                var iterator = function(x) {
                                    var key = x[keyField];
                                    x[keyField] = _.find(parents, function(x) {
                                       return x[mapping.parentField] === key;
                                    });
                                };
                                _.forEach(arr, iterator);
                                return deferred.resolve();
                            }).catch(function (err) {
                                return deferred.reject(err);
                            });
                        });
                    });
                });
                return deferred.promise;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getAssociatedParents_v1: function(items) {
                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.childModel !== thisQueryable.model.name) || (mapping.associationType!=='association')) {
                        return deferred.resolve();
                    }
                    thisArg.getParentModel().migrate(function(err) {
                        if (err) { return deferred.reject(err); }
                        var childField = thisQueryable.model.field(mapping.childField);
                        var keyField = childField.property || childField.name;
                        if (_.isNil(childField)) {
                            return deferred.reject("The specified field cannot be found on child model");
                        }
                        var values = _.intersection(_.map(_.filter(arr, function(x) {
                            return x.hasOwnProperty(keyField);
                            }), function (x) { return x[keyField];}));
                        if (values.length===0) {
                            return deferred.resolve();
                        }
                        thisArg.getParentModel().filter(mapping.options, function(err, q) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            q.prepare();
                            //Important Backward compatibility issue (<1.8.0)
                            //Description: if $levels parameter is not defined then set the default value to 0.
                            if (typeof q.$levels === 'undefined') {
                                q.$levels = 0;
                            }
                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            //append where statement for this operation
                            q.where(mapping.parentField).in(values);
                            //set silent (?)
                            q.silent().getAllItems().then(function(parents) {
                                var key=null,
                                    selector = function(x) {
                                        return x[mapping.parentField]===key;
                                    },
                                    iterator = function(x) {
                                        key = x[keyField];
                                        if (childField.property && childField.property!==childField.name) {
                                            x[childField.property] = parents.filter(selector)[0];
                                            delete x[childField.name];
                                        }
                                        else
                                            x[childField.name] = parents.filter(selector)[0];
                                    };
                                if (_.isArray(arr)) {
                                    arr.forEach(iterator);
                                }
                                return deferred.resolve();
                            }).catch(function(err) {
                                return deferred.reject(err);
                            });
                        });
                    });
                });
                return deferred.promise;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getAssociatedChilds_v1: function(items) {
                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.parentModel !== thisQueryable.model.name) || (mapping.associationType!=='association')) {
                        return deferred.resolve();
                    }
                    thisArg.getChildModel().migrate(function(err) {
                        if (err) { return deferred.reject(err); }
                        var parentField = thisQueryable.model.field(mapping.parentField);
                        if (_.isNil(parentField)) {
                            return deferred.reject("The specified field cannot be found on parent model");
                        }
                        var keyField = parentField.property || parentField.name;
                        var values = _.intersection(_.map(_.filter(arr, function(x) {
                            return x.hasOwnProperty(keyField);
                        }), function (x) { return x[keyField];}));
                        if (values.length===0) {
                            return deferred.resolve();
                        }
                        //search for view named summary
                        thisArg.getChildModel().filter(mapping.options, function(err, q) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            var childField = thisArg.getChildModel().field(mapping.childField);
                            if (_.isNil(childField)) {
                                return deferred.reject("The specified field cannot be found on child model");
                            }
                            var foreignKeyField = childField.property || childField.name;
                            //Important Backward compatibility issue (<1.8.0)
                            //Description: if $levels parameter is not defined then set the default value to 0.
                            if (typeof q.$levels === 'undefined') {
                                q.$levels = 0;
                            }
                            q.prepare();
                            if (values.length===1) {
                                q.where(mapping.childField).equal(values[0]);
                            }
                            else {
                                q.where(mapping.childField).in(values);
                            }
                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            //final execute query
                            return q.getItems().then(function(childs) {
                                // get referrer field of parent model
                                var refersTo = thisArg.getParentModel().getAttribute(mapping.refersTo);
                                _.forEach(arr, function(x) {
                                    var items = _.filter(childs, function(y) {
                                        if (!_.isNil(y[foreignKeyField]) && y[foreignKeyField].hasOwnProperty(keyField)) {
                                            return y[foreignKeyField][keyField] === x[keyField];
                                        }
                                        return y[foreignKeyField] === x[keyField];
                                    });
                                    // if parent field multiplicity attribute defines an one-to-one association
                                    if (refersTo && (refersTo.multiplicity === 'ZeroOrOne' || refersTo.multiplicity === 'One')) {
                                        if (items[0] != null) {
                                            // todo raise error if there are more than one items
                                            // get only the first item
                                            x[mapping.refersTo] = items[0];
                                        }
                                        else {
                                            // or nothing
                                            x[mapping.refersTo] = null;
                                        }
                                    }
                                    else {
                                        // otherwise get all items
                                        x[mapping.refersTo] = items;
                                    }
                                });
                                return deferred.resolve();
                            }).catch(function(err) {
                                return deferred.resolve(err);
                            });
                        });
                    });
                });
                return deferred.promise;
            },
            /**
             * @param {*} items
             * @returns {Promise|*}
             */
            getAssociatedChilds: function(items) {
                var thisArg = this;
                var deferred = Q.defer();
                process.nextTick(function() {
                    if (_.isNil(items)) {
                        return deferred.resolve();
                    }
                    var arr = _.isArray(items) ? items : [items];
                    if (arr.length === 0) {
                        return deferred.resolve();
                    }
                    if (_.isNil(thisQueryable)) {
                        return deferred.reject('The underlying data queryable cannot be empty at this context.');
                    }
                    if ((mapping.parentModel !== thisQueryable.model.name) || (mapping.associationType!=='association')) {
                        return deferred.resolve();
                    }
                    thisArg.getChildModel().migrate(function(err) {
                        if (err) { return deferred.reject(err); }
                        var parentField = thisArg.getParentModel().field(mapping.parentField);
                        if (_.isNil(parentField)) {
                            return deferred.reject("The specified field cannot be found on parent model");
                        }
                        var keyField = parentField.property || parentField.name;
                        var values = _.intersection(_.map(_.filter(arr, function(x) {
                            return x.hasOwnProperty(keyField);
                        }), function (x) { return x[keyField];}));
                        if (values.length===0) {
                            return deferred.resolve();
                        }
                        //search for view named summary
                        thisArg.getChildModel().filter(mapping.options, function(err, q) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            var childField = thisArg.getChildModel().field(mapping.childField);
                            if (_.isNil(childField)) {
                                return deferred.reject("The specified field cannot be found on child model");
                            }
                            var foreignKeyField = childField.property || childField.name;
                            //Important Backward compatibility issue (<1.8.0)
                            //Description: if $levels parameter is not defined then set the default value to 0.
                            if (typeof q.$levels === 'undefined') {
                                q.$levels = 0;
                            }
                            if (!q.query.hasFields()) {
                                q.select();
                            }
                            //inherit silent mode
                            if (thisQueryable.$silent)  { q.silent(); }
                            //join parents
                            q.query.join(thisQueryable.query.as("j0"))
                                .with(QueryUtils.where(new QueryEntity(thisArg.getChildModel().viewAdapter).select(mapping.childField))
                                    .equal(new QueryEntity("j0").select(mapping.parentField)));
                            q.prepare();
                            //final execute query
                            return q.getItems().then(function(childs) {
                                _.forEach(arr, function(x) {
                                    x[mapping.refersTo] = _.filter(childs, function(y) {
                                        if (!_.isNil(y[foreignKeyField]) && y[foreignKeyField].hasOwnProperty(keyField)) {
                                            return y[foreignKeyField][keyField] === x[keyField];
                                        }
                                        return y[foreignKeyField] === x[keyField];
                                    });
                                });
                                return deferred.resolve();
                            }).catch(function(err) {
                                return deferred.resolve(err);
                            });
                        });
                    });
                });
                return deferred.promise;
            }
        };
    }
};

module.exports = mappingExtensions;
