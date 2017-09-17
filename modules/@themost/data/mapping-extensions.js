/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MappingExtensions = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _query = require('@themost/query/query');

var QueryExpression = _query.QueryExpression;
var QueryField = _query.QueryField;
var QueryEntity = _query.QueryEntity;

var _associations = require('./associations');

var HasOneToManyAssociation = _associations.HasOneToManyAssociation;
var HasManyToOneAssociation = _associations.HasManyToOneAssociation;
var HasManyToManyAssociation = _associations.HasManyToManyAssociation;
var HasTagAssociation = _associations.HasTagAssociation;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MappingExtensions = exports.MappingExtensions = function () {
    function MappingExtensions() {
        _classCallCheck(this, MappingExtensions);
    }

    _createClass(MappingExtensions, null, [{
        key: 'extend',


        /**
         * @param {DataAssociationMapping|*} mapping
         * @returns {*}
         */
        value: function extend(mapping) {
            var thisQueryable = void 0,
                childModel_ = void 0,
                parentModel_ = void 0;
            return {
                /**
                 * @param {DataQueryable} dataQueryable
                 */
                for: function _for(dataQueryable) {
                    thisQueryable = dataQueryable;
                    return this;
                },
                getChildModel: function getChildModel() {
                    if (_.isNil(thisQueryable)) {
                        return;
                    }
                    if (_.isObject(childModel_)) {
                        return childModel_;
                    }
                    childModel_ = thisQueryable.model.context.model(mapping.childModel);
                    return childModel_;
                },
                getParentModel: function getParentModel() {
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
                getParents_v1: function getParents_v1(items) {

                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
                        if (_.isNil(items)) {
                            return deferred.resolve();
                        }
                        var arr = _.isArray(items) ? items : [items];
                        if (arr.length == 0) {
                            return deferred.resolve();
                        }
                        if (_.isNil(thisQueryable)) {
                            return deferred.reject('The underlying data queryable cannot be empty at this context.');
                        }
                        if (mapping.childModel !== thisQueryable.model.name || mapping.associationType !== 'junction') {
                            return deferred.resolve();
                        }
                        //get array of key values (for childs)
                        var values = arr.filter(function (x) {
                            return typeof x[mapping.childField] !== 'undefined' && x[mapping.childField] != null;
                        }).map(function (x) {
                            return x[mapping.childField];
                        });
                        //query junction model
                        var junction = new HasManyToOneAssociation(thisQueryable.model.convert({}), mapping);
                        junction.getBaseModel().where('valueId').in(values).flatten().silent().all(function (err, junctions) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            //get array of parent key values
                            values = _.intersection(junctions.map(function (x) {
                                return x['parentId'];
                            }));
                            //get parent model
                            var parentModel = thisArg.getParentModel();
                            //query parent with parent key values
                            parentModel.filter(mapping.options, function (err, q) {
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
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                //and finally query parent
                                q.getItems().then(function (parents) {
                                    //if result contains only one item
                                    if (arr.length == 1) {
                                        arr[0][mapping.refersTo] = parents;
                                        return deferred.resolve();
                                    }
                                    //otherwise loop result array
                                    arr.forEach(function (x) {
                                        //get child (key value)
                                        var valueId = x[mapping.childField];
                                        //get parent(s)
                                        var p = junctions.filter(function (y) {
                                            return y.valueId == valueId;
                                        }).map(function (r) {
                                            return r['parentId'];
                                        });
                                        //filter data and set property value (a filtered array of parent objects)
                                        x[mapping.refersTo] = parents.filter(function (z) {
                                            return p.indexOf(z[mapping.parentField]) >= 0;
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
                getParents: function getParents(items) {
                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
                        if (_.isNil(items)) {
                            return deferred.resolve();
                        }
                        var arr = _.isArray(items) ? items : [items];
                        if (arr.length == 0) {
                            return deferred.resolve();
                        }
                        if (_.isNil(thisQueryable)) {
                            return deferred.reject('The underlying data queryable cannot be empty at this context.');
                        }
                        if (mapping.childModel !== thisQueryable.model.name || mapping.associationType !== 'junction') {
                            return deferred.resolve();
                        }
                        var junction = new HasManyToOneAssociation(thisQueryable.model.convert({}), mapping);
                        return junction.migrate(function (err) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            var parentModel = thisArg.getParentModel();
                            parentModel.filter(mapping.options, function (err, q) {
                                if (err) {
                                    return deferred.reject(err);
                                }
                                //get junction sub-query
                                var junctionQuery = QueryExpression.create(junction.getBaseModel().name).select("parentId", "valueId").join(thisQueryable.query.as("j0")).with(QueryExpression.create().where(QueryEntity.create(junction.getBaseModel().name).select("valueId")).equal(QueryEntity.create("j0").select(mapping.childField)));
                                //append join statement with sub-query
                                q.query.join(junctionQuery.as("g0")).with(QueryExpression.create().where(QueryEntity.create(parentModel.viewAdapter).select(mapping.parentField)).equal(QueryEntity.create("g0").select("parentId")));
                                if (!q.query.hasFields()) {
                                    q.select();
                                }
                                //inherit silent mode
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                //append child key field
                                q.alsoSelect(QueryField.create("valueId").from("g0").as("ref__"));
                                return q.getItems().then(function (parents) {
                                    _.forEach(arr, function (x) {
                                        x[mapping.refersTo] = _.filter(parents, function (y) {
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
                getChilds_v1: function getChilds_v1(items) {
                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
                        if (_.isNil(items)) {
                            return deferred.resolve();
                        }
                        var arr = _.isArray(items) ? items : [items];
                        if (arr.length == 0) {
                            return deferred.resolve();
                        }
                        if (_.isNil(thisQueryable)) {
                            return deferred.reject('The underlying data queryable cannot be empty at this context.');
                        }
                        if (mapping.parentModel !== thisQueryable.model.name || mapping.associationType !== 'junction') {
                            return deferred.resolve();
                        }
                        var values = arr.filter(function (x) {
                            return typeof x[mapping.parentField] !== 'undefined' && x[mapping.parentField] != null;
                        }).map(function (x) {
                            return x[mapping.parentField];
                        });
                        if (_.isNil(mapping.childModel)) {
                            junction = new HasTagAssociation(thisQueryable.model.convert({}), mapping);
                            return junction.getBaseModel().where("object").in(values).flatten().silent().select("object", "value").all().then(function (items) {
                                arr.forEach(function (x) {
                                    x[mapping.refersTo] = items.filter(function (y) {
                                        return y["object"] === x[mapping.parentField];
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
                        var junction = new HasManyToManyAssociation(thisQueryable.model.convert({}), mapping);
                        //query junction model
                        return junction.getBaseModel().where('parentId').in(values).silent().flatten().getItems().then(function (junctions) {
                            //get array of child key values
                            var values = junctions.map(function (x) {
                                return x['valueId'];
                            });
                            //get child model
                            var childModel = thisArg.getChildModel();
                            childModel.filter(mapping.options, function (err, q) {
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
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                //append where statement for this operation
                                if (values.length == 1) {
                                    q.where(mapping.childField).equal(values[0]);
                                } else {
                                    q.where(mapping.childField).in(values);
                                }
                                //and finally query childs
                                q.getItems().then(function (childs) {
                                    //if result contains only one item
                                    if (arr.length == 1) {
                                        arr[0][mapping.refersTo] = childs;
                                        return deferred.resolve();
                                    }
                                    //otherwise loop result array
                                    arr.forEach(function (x) {
                                        //get parent (key value)
                                        var parentId = x[mapping.parentField];
                                        //get parent(s)
                                        var p = junctions.filter(function (y) {
                                            return y.parentId == parentId;
                                        }).map(function (r) {
                                            return r['valueId'];
                                        });
                                        //filter data and set property value (a filtered array of parent objects)
                                        x[mapping.refersTo] = childs.filter(function (z) {
                                            return p.indexOf(z[mapping.childField]) >= 0;
                                        });
                                    });
                                    return deferred.resolve();
                                }).catch(function (err) {
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
                getChilds: function getChilds(items) {
                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
                        if (_.isNil(items)) {
                            return deferred.resolve();
                        }
                        var arr = _.isArray(items) ? items : [items];
                        if (arr.length == 0) {
                            return deferred.resolve();
                        }
                        if (_.isNil(thisQueryable)) {
                            return deferred.reject('The underlying data queryable cannot be empty at this context.');
                        }
                        if (mapping.parentModel !== thisQueryable.model.name || mapping.associationType !== 'junction') {
                            return deferred.resolve();
                        }
                        var junction = new HasManyToManyAssociation(thisQueryable.model.convert({}), mapping);
                        return junction.migrate(function (err) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            var childModel = thisArg.getChildModel();
                            childModel.filter(mapping.options, function (err, q) {
                                if (err) {
                                    return deferred.reject(err);
                                }
                                if (!q.query.hasFields()) {
                                    q.select();
                                }
                                //get junction sub-query
                                var junctionQuery = QueryExpression.create(junction.getBaseModel().name).select("parentId", "valueId").join(thisQueryable.query.as("j0")).with(QueryExpression.create().where(QueryEntity.create(junction.getBaseModel().name).select("parentId")).equal(QueryEntity.create("j0").select(mapping.parentField)));
                                //append join statement with sub-query
                                q.query.join(junctionQuery.as("g0")).with(QueryExpression.create().where(QueryEntity.create(childModel.viewAdapter).select(mapping.childField)).equal(QueryEntity.create("g0").select("valueId")));

                                //inherit silent mode
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                //append item reference
                                q.alsoSelect(QueryField.create("parentId").from("g0").as("ref__"));
                                return q.getItems().then(function (childs) {
                                    _.forEach(arr, function (x) {
                                        x[mapping.refersTo] = _.filter(childs, function (y) {
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
                getAssociatedParents: function getAssociatedParents(items) {
                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
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
                        if (mapping.childModel !== thisQueryable.model.name || mapping.associationType !== 'association') {
                            return deferred.resolve();
                        }
                        thisArg.getParentModel().migrate(function (err) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            thisArg.getParentModel().filter(mapping.options, function (err, q) {
                                if (err) {
                                    return deferred.reject(err);
                                }
                                //Important Backward compatibility issue (<1.8.0)
                                //Description: if $levels parameter is not defined then set the default value to 0.
                                if (typeof q.$levels === 'undefined') {
                                    q.$levels = 0;
                                }
                                q.query.distinct().join(thisQueryable.query.as('j0')).with(QueryExpression.create().where(QueryEntity.create(thisArg.getParentModel().viewAdapter).select(mapping.parentField)).equal(QueryEntity.create("j0").select(mapping.childField)));
                                //inherit silent mode
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                q.silent().getAllItems().subscribe(function (parents) {
                                    var childField = thisQueryable.model.field(mapping.childField);
                                    var keyField = childField.property || childField.name;
                                    var iterator = function iterator(x) {
                                        var key = x[keyField];
                                        x[keyField] = _.find(parents, function (x) {
                                            return x[mapping.parentField] === key;
                                        });
                                    };
                                    _.forEach(arr, iterator);
                                    return deferred.resolve();
                                }, function (err) {
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
                getAssociatedParents_v1: function getAssociatedParents_v1(items) {
                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
                        if (_.isNil(items)) {
                            return deferred.resolve();
                        }
                        var arr = _.isArray(items) ? items : [items];
                        if (arr.length == 0) {
                            return deferred.resolve();
                        }
                        if (_.isNil(thisQueryable)) {
                            return deferred.reject('The underlying data queryable cannot be empty at this context.');
                        }
                        if (mapping.childModel !== thisQueryable.model.name || mapping.associationType !== 'association') {
                            return deferred.resolve();
                        }
                        thisArg.getParentModel().migrate(function (err) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            var childField = thisQueryable.model.field(mapping.childField);
                            var keyField = childField.property || childField.name;
                            if (_.isNil(childField)) {
                                return deferred.reject("The specified field cannot be found on child model");
                            }
                            var values = _.intersection(_.map(_.filter(arr, function (x) {
                                return x.hasOwnProperty(keyField);
                            }), function (x) {
                                return x[keyField];
                            }));
                            if (values.length == 0) {
                                return deferred.resolve();
                            }
                            thisArg.getParentModel().filter(mapping.options, function (err, q) {
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
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                //append where statement for this operation
                                q.where(mapping.parentField).in(values);
                                //set silent (?)
                                q.silent().getAllItems().subscribe(function (parents) {
                                    var key = null;

                                    var selector = function selector(x) {
                                        return x[mapping.parentField] === key;
                                    };

                                    var iterator = function iterator(x) {
                                        key = x[keyField];
                                        if (childField.property && childField.property !== childField.name) {
                                            x[childField.property] = parents.filter(selector)[0];
                                            delete x[childField.name];
                                        } else x[childField.name] = parents.filter(selector)[0];
                                    };

                                    if (_.isArray(arr)) {
                                        arr.forEach(iterator);
                                    }
                                    return deferred.resolve();
                                }, function (err) {
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
                getAssociatedChilds_v1: function getAssociatedChilds_v1(items) {
                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
                        if (_.isNil(items)) {
                            return deferred.resolve();
                        }
                        var arr = _.isArray(items) ? items : [items];
                        if (arr.length == 0) {
                            return deferred.resolve();
                        }
                        if (_.isNil(thisQueryable)) {
                            return deferred.reject('The underlying data queryable cannot be empty at this context.');
                        }
                        if (mapping.parentModel !== thisQueryable.model.name || mapping.associationType !== 'association') {
                            return deferred.resolve();
                        }
                        thisArg.getChildModel().migrate(function (err) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            var parentField = thisQueryable.model.field(mapping.parentField);
                            if (_.isNil(parentField)) {
                                return deferred.reject("The specified field cannot be found on parent model");
                            }
                            var keyField = parentField.property || parentField.name;
                            var values = _.intersection(_.map(_.filter(arr, function (x) {
                                return x.hasOwnProperty(keyField);
                            }), function (x) {
                                return x[keyField];
                            }));
                            if (values.length == 0) {
                                return deferred.resolve();
                            }
                            //search for view named summary
                            thisArg.getChildModel().filter(mapping.options, function (err, q) {
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
                                if (values.length == 1) {
                                    q.where(mapping.childField).equal(values[0]);
                                } else {
                                    q.where(mapping.childField).in(values);
                                }
                                //inherit silent mode
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                //final execute query
                                return q.getItems().then(function (childs) {
                                    _.forEach(arr, function (x) {
                                        x[mapping.refersTo] = _.filter(childs, function (y) {
                                            if (!_.isNil(y[foreignKeyField]) && y[foreignKeyField].hasOwnProperty(keyField)) {
                                                return y[foreignKeyField][keyField] === x[keyField];
                                            }
                                            return y[foreignKeyField] === x[keyField];
                                        });
                                    });
                                    return deferred.resolve();
                                }).catch(function (err) {
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
                getAssociatedChilds: function getAssociatedChilds(items) {
                    var thisArg = this;
                    var deferred = Q.defer();
                    process.nextTick(function () {
                        if (_.isNil(items)) {
                            return deferred.resolve();
                        }
                        var arr = _.isArray(items) ? items : [items];
                        if (arr.length == 0) {
                            return deferred.resolve();
                        }
                        if (_.isNil(thisQueryable)) {
                            return deferred.reject('The underlying data queryable cannot be empty at this context.');
                        }
                        if (mapping.parentModel !== thisQueryable.model.name || mapping.associationType !== 'association') {
                            return deferred.resolve();
                        }
                        thisArg.getChildModel().migrate(function (err) {
                            if (err) {
                                return deferred.reject(err);
                            }
                            var parentField = thisArg.getParentModel().field(mapping.parentField);
                            if (_.isNil(parentField)) {
                                return deferred.reject("The specified field cannot be found on parent model");
                            }
                            var keyField = parentField.property || parentField.name;
                            var values = _.intersection(_.map(_.filter(arr, function (x) {
                                return x.hasOwnProperty(keyField);
                            }), function (x) {
                                return x[keyField];
                            }));
                            if (values.length == 0) {
                                return deferred.resolve();
                            }
                            //search for view named summary
                            thisArg.getChildModel().filter(mapping.options, function (err, q) {
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
                                if (thisQueryable.$silent) {
                                    q.silent();
                                }
                                //join parents
                                q.query.join(thisQueryable.query.as("j0")).with(QueryExpression.create().where(QueryEntity.create(thisArg.getChildModel().viewAdapter).select(mapping.childField)).equal(QueryEntity.create("j0").select(mapping.parentField)));
                                q.prepare();
                                //final execute query
                                return q.getItems().then(function (childs) {
                                    _.forEach(arr, function (x) {
                                        x[mapping.refersTo] = _.filter(childs, function (y) {
                                            if (!_.isNil(y[foreignKeyField]) && y[foreignKeyField].hasOwnProperty(keyField)) {
                                                return y[foreignKeyField][keyField] === x[keyField];
                                            }
                                            return y[foreignKeyField] === x[keyField];
                                        });
                                    });
                                    return deferred.resolve();
                                }).catch(function (err) {
                                    return deferred.resolve(err);
                                });
                            });
                        });
                    });
                    return deferred.promise;
                }
            };
        }
    }]);

    return MappingExtensions;
}();

;
//# sourceMappingURL=mapping-extensions.js.map
