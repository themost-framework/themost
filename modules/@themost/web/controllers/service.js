/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
//
var LangUtils = require('@themost/common/utils').LangUtils;
var DataQueryable = require('@themost/data/data-queryable').DataQueryable;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;
var HttpForbiddenError = require('@themost/common/errors').HttpForbiddenError;
var HttpMethodNotAllowedError = require('@themost/common/errors').HttpMethodNotAllowedError;
var HttpBadRequestError = require('@themost/common/errors').HttpBadRequestError;
var parseBoolean = require('@themost/common/utils').LangUtils.parseBoolean;
var pluralize = require('pluralize');
var Q = require('q');
var _ = require('lodash');
var httpGet = require('../decorators').httpGet;
var httpPost = require('../decorators').httpPost;
var httpPut = require('../decorators').httpPut;
var httpPatch = require('../decorators').httpPatch;
var httpDelete = require('../decorators').httpDelete;
var httpAction = require('../decorators').httpAction;
var httpController = require('../decorators').httpController;
var defineDecorator = require('../decorators').defineDecorator;
var HttpBaseController = require('./base');
var ODataModelBuilder = require('@themost/data/odata').ODataModelBuilder;
var EdmMapping = require('@themost/data/odata').EdmMapping;
var DefaultTopQueryOption = 50;
/**
 * @classdesc HttpBaseController class describes a base controller.
 * @class
 * @param {HttpContext} context
 * @constructor
 */
function HttpServiceController(context) {
    HttpServiceController.super_.bind(this)(context);
}
LangUtils.inherits(HttpServiceController, HttpBaseController);
defineDecorator(HttpServiceController, 'constructor', httpController());

HttpServiceController.prototype.getMetadata = function() {
    var self = this;
    return this.getBuilder().getEdmDocument().then(function (result) {
        return Q.resolve(self.xml(result.outerXML()));
    });
};
defineDecorator(HttpServiceController.prototype, 'getMetadata', httpGet());
defineDecorator(HttpServiceController.prototype, 'getMetadata', httpAction("metadata"));

HttpServiceController.prototype.getIndex = function() {
    var self = this;
    return this.getBuilder().getEdm().then(function (result) {
        return Q.resolve(self.json({
            "@odata.context": self.getBuilder().getContextLink(self.context),
            value:result.entityContainer.entitySet
        }));
    });
};
//apply descriptors
defineDecorator(HttpServiceController.prototype, 'getIndex', httpGet());
defineDecorator(HttpServiceController.prototype, 'getIndex', httpAction("index"));

/**
 *
 * @param {string} entitySet
 */
HttpServiceController.prototype.getItems = function(entitySet) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundError("EntitySet not found"));
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundError("Entity not found"));
        }
        //set default $top property
        if (!context.params.hasOwnProperty('$top')) {
            _.assign(context.params, {
                $top:DefaultTopQueryOption
            });
        }
        //parse query filter and return a DataQueryable
        return Q.nbind(model.filter,model)(context.params).then(function(query) {
            var count = parseBoolean(self.context.params['$count']);
            if (count) {
                //get items with count
                return query.getList().then(function(result) {
                    //and finally return json result
                    return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,result)));
                });
            }
            else {
                //get items
                return query.getItems().then(function(result) {
                    //and finally return json result
                    return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,result)));
                });
            }
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};
defineDecorator(HttpServiceController.prototype, 'getItems', httpGet());
defineDecorator(HttpServiceController.prototype, 'getItems', httpAction("items"));

/**
 *
 * @param {string} entitySet
 */
HttpServiceController.prototype.postItems = function(entitySet) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundError("EntitySet not found"));
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundError("Entity not found"));
        }
        var body = context.request.body;
        return model.save(body).then(function () {
            if (_.isArray(body)) {
                return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,body)));
            }
            else {
                return Q.resolve(self.json(thisEntitySet.mapInstance(context,body)));
            }
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'postItems', httpPost());
defineDecorator(HttpServiceController.prototype, 'postItems', httpPut());
defineDecorator(HttpServiceController.prototype, 'postItems', httpAction("items"));

/**
 * @param {*} id
 * @param {string} entitySet
 */
HttpServiceController.prototype.getItem = function(entitySet, id) {
    var self = this;
    var context = self.context;
    var model;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundError("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundError());
                            }
                            return self.getItem(entitySet, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenError());
            }
        }
        /**
         * @type {DataModel}
         */
        model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundError("Entity not found"));
        }
        return Q.nbind(model.filter,model)({
            "$select":context.params["$select"],
            "$expand":context.params["$expand"]
        }).then(function(query) {
            return query.where(model.primaryKey).equal(id).getItem().then(function (result) {
                if (_.isNil(result)) {
                    return Q.reject(new HttpNotFoundError());
                }
                return Q.resolve(self.json(thisEntitySet.mapInstance(context,result)));
            });
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'getItem', httpGet());
defineDecorator(HttpServiceController.prototype, 'getItem', httpAction("item"));


/**
 *
 * @param {string} entitySet
 * @param {*} id
 */
HttpServiceController.prototype.patchItem = function(entitySet, id) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundError("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundError());
                            }
                            return self.patchItem(entitySet, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenError());
            }
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundError("Entity not found"));
        }
        return model.where(model.primaryKey).equal(id).select("id").getItem().then(function (result) {
            if (_.isNil(result)) {
                return Q.reject(new HttpNotFoundError());
            }
            var body = _.assign(context.request.body, result);
            return model.save(body).then(function () {
                return Q.resolve(self.json(thisEntitySet.mapInstance(context,body)));
            });
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};
defineDecorator(HttpServiceController.prototype, 'patchItem', httpPatch());
defineDecorator(HttpServiceController.prototype, 'patchItem', httpAction("item"));

/**
 *
 * @param {string} entitySet
 * @param {*} id
 */
HttpServiceController.prototype.deleteItem = function(entitySet, id) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundError("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundError());
                            }
                            return self.deleteItem(entitySet, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenError());
            }
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundError("Entity not found"));
        }
        return model.where(model.primaryKey).equal(id).count().then(function (exists) {
            if (!exists) {
                return Q.reject(new HttpNotFoundError());
            }
            var obj = {};
            obj[model.primaryKey] = id;
            return model.remove(obj).then(function () {
                return Q.resolve(self.json());
            });
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'deleteItem', httpDelete());
defineDecorator(HttpServiceController.prototype, 'patchItem', httpAction("item"));

/**
 *
 * @param {string} entitySet
 */
HttpServiceController.prototype.postItem = function(entitySet) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundError("EntitySet not found"));
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundError("Entity not found"));
        }
        var body = context.request.body;
        return model.save(body).then(function () {
            if (_.isArray(body)) {
                return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,body)));
            }
            else {
                return Q.resolve(self.json(thisEntitySet.mapInstance(context,body)));
            }
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'postItem', httpPost());
defineDecorator(HttpServiceController.prototype, 'postItem', httpPut());
defineDecorator(HttpServiceController.prototype, 'postItem', httpAction("item"));

/**
 * @param {DataQueryable} target
 * @param {DataQueryable} source
 */
function extendQueryable(target, source) {
    if (source.query.$select) {
        target.query.$select = source.query.$select;
    }
    if (source.$view) {
        target.$view = source.$view;
    }
    if (source.$expand) {
        target.$expand=( target.$expand || []).concat(source.$expand);
    }
    if (source.query.$expand) {
        var targetExpand = [];
        if (_.isArray(target.query.$expand)) {
            targetExpand = target.query.$expand;
        }
        else if (typeof  target.query.$expand === 'object') {
            targetExpand.push(target.query.$expand);
        }
        var sourceExpand = [].concat(source.query.$expand);

        var res = _.filter(sourceExpand, function(x) {
            return typeof _.find(targetExpand, function(y) {
                return y.$entity.name === x.$entity.name;
            }) === 'undefined';
        });
        target.query.$expand= targetExpand.concat(res);
    }
    if (source.query.$group) {
        target.query.$group = source.query.$group;
    }
    if (source.query.$order) {
        target.query.$order = source.query.$order;
    }
    if (source.query.$prepared) {
        target.query.$where = source.query.$prepared;
    }
    if (source.query.$skip) {
        target.query.$skip = source.query.$skip;
    }
    if (source.query.$take) {
        target.query.$take = source.query.$take;
    }
    return target;
}

/**
 *
 * @param {string} entitySet
 * @param {string} navigationProperty
 * @param {*} id
 */
HttpServiceController.prototype.getNavigationProperty = function(entitySet, navigationProperty, id) {
    var self = this;
    var context = self.context;
    var model;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundError("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundError());
                            }
                            return self.getNavigationProperty(entitySet, navigationProperty, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenError());
            }
        }
        /**
         * @type {DataModel}
         */
        model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundError("Entity not found"));
        }
        return model.where(model.primaryKey).equal(id).select(model.primaryKey).getTypedItem()
            .then(function(obj) {
                if (_.isNil(obj)) {
                    return Q.reject(new HttpNotFoundError());
                }
                //check if entity set has a function with the same name
                var action = thisEntitySet.entityType.hasFunction(navigationProperty);
                if (action) {
                    var returnsCollection = _.isString(action.returnCollectionType);
                    var returnModel = context.model(action.returnType || action.returnCollectionType);
                    //find method
                    var memberFunc = EdmMapping.hasOwnFunction(obj,  action.name);
                    if (memberFunc) {
                        var funcParameters = [];
                        _.forEach(action.parameters, function(x) {
                            if (x.name !== 'bindingParameter') {
                                funcParameters.push( LangUtils.parseValue(context.params[x.name]));
                            }
                        });
                        return Q.resolve(memberFunc.apply(obj, funcParameters)).then(function(result) {
                            if (result instanceof DataQueryable) {
                                if (_.isNil(returnModel)) {
                                    return Q.reject(new HttpNotFoundError("Result Entity not found"));
                                }
                                var returnEntitySet = self.getBuilder().getEntityTypeEntitySet(returnModel.name);
                                if (_.isNil(returnEntitySet)) {
                                    returnEntitySet = self.getBuilder().getEntity(returnModel.name);
                                }
                                var filter = Q.nbind(returnModel.filter, returnModel);
                                //if the return value is a single instance
                                if (!returnsCollection) {
                                    //pass context parameters (only $select and $expand)
                                    var params = _.pick(context.params, [
                                        "$select",
                                        "$expand"
                                    ]);
                                    //filter with parameters
                                    return filter(params).then(function(q) {
                                        // extend data queryable
                                        var q1 = extendQueryable(result, q);
                                        //get item
                                        return q1.getItem().then(function(result) {
                                            if (_.isNil(result)) {
                                                return Q.reject(new HttpNotFoundError());
                                            }
                                            //return result
                                            return Q.resolve(self.json(returnEntitySet.mapInstance(context,result)));
                                        });
                                    });
                                }
                                //else if the return value is a collection
                                return filter( _.extend({
                                    "$top":DefaultTopQueryOption
                                },context.params)).then(function(q) {
                                    var count = context.params.hasOwnProperty('$inlinecount') ? parseBoolean(context.params.$inlinecount) : (context.params.hasOwnProperty('$count') ? parseBoolean(context.params.$count) : false);
                                    var q1 = extendQueryable(result, q);
                                    if (count) {
                                        return q1.getList().then(function(result) {
                                            return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                                        });
                                    }
                                    return q1.getItems().then(function(result) {
                                        return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                                    });
                                });
                            }
                            return Q.resolve(self.json(result));
                        });
                    }
                }


                //get primary key
                var key = obj[model.primaryKey];
                //get mapping
                var mapping = model.inferMapping(navigationProperty);
                //get count parameter
                var count = context.params.hasOwnProperty('$inlinecount') ? parseBoolean(context.params.$inlinecount) : (context.params.hasOwnProperty('$count') ? parseBoolean(context.params.$count) : false);
                if (_.isNil(mapping)) {
                    //try to find associated model
                    //get singular model name
                    var otherModelName = pluralize.singular(navigationProperty);
                    //search for model with this name
                    var otherModel = self.context.model(otherModelName);
                    if (otherModel) {
                        var otherFields = _.filter(otherModel.attributes, function(x) {
                            return x.type === model.name;
                        });
                        if (otherFields.length>1) {
                            return Q.reject(new HttpMethodNotAllowedError("Multiple associations found"));
                        }
                        else if (otherFields.length === 1) {
                            var otherField = otherFields[0];
                            mapping = otherModel.inferMapping(otherField.name);
                            if (mapping && mapping.associationType === 'junction') {
                                var attr;
                                //search model for attribute that has an association of type junction with child model
                                if (mapping.parentModel === otherModel.name) {
                                    attr = _.find(otherModel.attributes, function(x) {
                                        return x.name === otherField.name;
                                    });
                                }
                                else {
                                    attr = _.find(model.attributes, function(x) {
                                        return x.type === otherModel.name;
                                    });
                                }
                                // if (_.isNil(attr)) {
                                //     return Q.reject(new HttpNotFoundException("Association not found"));
                                // }
                                if (attr) {
                                    model = attr.name;
                                    mapping = model.inferMapping(attr.name);
                                }
                            }
                        }
                    }
                    if (_.isNil(mapping)) {
                        return Q.reject(new HttpNotFoundError("Association not found"));
                    }
                }
                if (mapping.associationType === 'junction') {
                    /**
                     * @type {DataQueryable}
                     */
                    var junction = obj.property(navigationProperty);
                    return Q.nbind(junction.model.filter, junction.model)(self.context.params).then(function (q) {
                        //merge properties
                        if (q.query.$select) {
                            junction.query.$select = q.query.$select;
                        }
                        if (q.$expand) {
                            junction.$expand = q.$expand;
                        }
                        if (q.query.$group) {
                            junction.query.$group = q.query.$group;
                        }
                        if (q.query.$order) {
                            junction.query.$order = q.query.$order;
                        }
                        if (q.query.$prepared) {
                            junction.query.$where = q.query.$prepared;
                        }
                        if (q.query.$skip) {
                            junction.query.$skip = q.query.$skip;
                        }
                        if (q.query.$take) {
                            junction.query.$take = q.query.$take;
                        }
                        var otherEntitySet = self.getBuilder().getEntityTypeEntitySet(junction.model.name);
                        if (count) {
                            return junction.getList().then(function (result) {
                                if (typeof otherEntitySet === 'undefined') {
                                    return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,result)));
                                }
                                return Q.resolve(self.json(otherEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                        else {
                            return junction.getItems().then(function (result) {
                                if (typeof otherEntitySet === 'undefined') {
                                    return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,result)));
                                }
                                return Q.resolve(self.json(otherEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                    });
                }
                else if (mapping.parentModel === model.name && mapping.associationType === 'association') {
                    //get associated model
                    var associatedModel = self.context.model(mapping.childModel);
                    if (_.isNil(associatedModel)) {
                        return Q.reject(new HttpNotFoundError("Associated model not found"));
                    }
                    var associatedEntitySet = self.getBuilder().getEntityTypeEntitySet(associatedModel.name);
                    return Q.nbind(associatedModel.filter, associatedModel)( _.extend({
                        "$top":DefaultTopQueryOption
                    },context.params)).then(function(q) {
                        if (count) {
                            return q.where(mapping.childField).equal(key).getList().then(function (result) {
                                return Q.resolve(self.json(associatedEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                        else {
                            return q.where(mapping.childField).equal(key).getItems().then(function (result) {
                                return Q.resolve(self.json(associatedEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                    });
                }
                else if (mapping.childModel === model.name && mapping.associationType === 'association') {
                    //get associated model
                    var parentModel = self.context.model(mapping.parentModel);
                    if (_.isNil(parentModel)) {
                        return Q.reject(new HttpNotFoundError("Parent associated model not found"));
                    }
                    return model.where(model.primaryKey).equal(obj.id).select(model.primaryKey,navigationProperty).expand(navigationProperty).getItem().then(function(result) {
                        var parentEntitySet = self.getBuilder().getEntityTypeEntitySet(parentModel.name);
                        return Q.resolve(self.json(parentEntitySet.mapInstance(context,result[navigationProperty])));
                    });
                }
                else {
                    return Q.reject(new HttpNotFoundError());
                }
            });

    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'getNavigationProperty', httpGet());
defineDecorator(HttpServiceController.prototype, 'getNavigationProperty', httpAction("navigationProperty"));

/**
 *
 * @param {string} entitySet
 * @param {string} entityAction
 * @param {string=} navigationProperty
 */
HttpServiceController.prototype.getEntityAction = function(entitySet, entityAction, navigationProperty) {
    var self = this;
    var context = self.context;
    var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
    if (_.isNil(thisEntitySet)) {
        return Q.reject(new HttpNotFoundError("EntitySet not found"));
    }
    var model = context.model(thisEntitySet.entityType.name);
    if (_.isNil(model)) {
        return Q.reject(new HttpNotFoundError("Entity not found"));
    }
    var action = thisEntitySet.entityType.collection.hasFunction(entityAction);
    if (action) {
        //get data object class
        var DataObjectClass = model.getDataObjectType();
        var staticFunc = EdmMapping.hasOwnFunction(DataObjectClass,entityAction);
        if (staticFunc) {
            return Q.resolve(staticFunc(context)).then(function(result) {
                var returnsCollection = _.isString(action.returnCollectionType);
                var returnModel = context.model(action.returnType || action.returnCollectionType);
                if (_.isNil(returnModel)) {
                    return Q.reject(new HttpNotFoundError("Result Entity not found"));
                }
                var returnEntitySet = self.getBuilder().getEntityTypeEntitySet(returnModel.name);
                if (result instanceof DataQueryable) {
                    var filter = Q.nbind(returnModel.filter, returnModel);
                    if (!returnsCollection) {
                        //pass context parameters (if navigationProperty is empty)
                        var params = {};
                        if (_.isNil(navigationProperty)) {
                            params = _.pick(context.params, [
                                "$select",
                                "$expand"
                            ]);
                        }
                        return filter(params).then(function(q) {
                            //do not add context params
                            var q1 = extendQueryable(result, q);
                            return q1.getItem().then(function(result) {
                                if (_.isNil(result)) {
                                    return Q.reject(new HttpNotFoundError());
                                }
                                if (_.isString(navigationProperty)) {
                                    return self.getNavigationProperty(returnEntitySet.name,navigationProperty, result[returnModel.primaryKey])
                                }
                                return Q.resolve(self.json(returnEntitySet.mapInstance(context,result)));
                            });
                        });
                    }
                    if (typeof navigationProperty !== 'undefined') {
                        return Q.reject(new HttpBadRequestError());
                    }
                    return filter( _.extend({
                            "$top":DefaultTopQueryOption
                        },context.params)).then(function(q) {
                        var count = context.params.hasOwnProperty('$inlinecount') ? parseBoolean(context.params.$inlinecount) : (context.params.hasOwnProperty('$count') ? parseBoolean(context.params.$count) : false);
                        var q1 = extendQueryable(result, q);
                        if (count) {
                            return q1.getList().then(function(result) {
                                return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                        return q1.getItems().then(function(result) {
                            return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                        });
                    });
                }
                if (_.isNil(navigationProperty)) {
                    if (returnsCollection) {
                        return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                    }
                    else {
                        return Q.resolve(self.json(returnEntitySet.mapInstance(context,result)));
                    }
                }
                if (_.isNil(returnEntitySet)) {
                    return Q.reject(new HttpNotFoundError("Result EntitySet not found"));
                }
                return self.getNavigationProperty(returnEntitySet.name,navigationProperty, result[returnModel.primaryKey])
            });
        }
    }
    return this.next();
};
defineDecorator(HttpServiceController.prototype, 'getEntityAction', httpGet());
defineDecorator(HttpServiceController.prototype, 'getEntityAction', httpAction("entityAction"));

/**
 *
 * @param {string} entitySet
 * @param {string} entityFunction
 * @param {string=} navigationProperty
 */
HttpServiceController.prototype.getEntitySetFunction = function(entitySet, entityFunction, navigationProperty) {
    var self = this;
    var context = self.context;
    var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
    if (_.isNil(thisEntitySet)) {
        return Q.reject(new HttpNotFoundError("EntitySet not found"));
    }
    var model = context.model(thisEntitySet.entityType.name);
    if (_.isNil(model)) {
        return Q.reject(new HttpNotFoundError("Entity not found"));
    }
    var action = thisEntitySet.entityType.collection.hasFunction(entityFunction);
    if (action) {
        //get data object class
        var DataObjectClass = model.getDataObjectType();
        var staticFunc = EdmMapping.hasOwnFunction(DataObjectClass,entityFunction);
        if (staticFunc) {
            return Q.resolve(staticFunc(context)).then(function(result) {
                var returnsCollection = _.isString(action.returnCollectionType);
                var returnModel = context.model(action.returnType || action.returnCollectionType);
                if (_.isNil(returnModel)) {
                    return Q.reject(new HttpNotFoundError("Result Entity not found"));
                }
                var returnEntitySet = self.getBuilder().getEntityTypeEntitySet(returnModel.name);
                if (result instanceof DataQueryable) {
                    var filter = Q.nbind(returnModel.filter, returnModel);
                    if (!returnsCollection) {
                        //pass context parameters (if navigationProperty is empty)
                        var params = {};
                        if (_.isNil(navigationProperty)) {
                            params = _.pick(context.params, [
                                "$select",
                                "$expand"
                            ]);
                        }
                        return filter(params).then(function(q) {
                            //do not add context params
                            var q1 = extendQueryable(result, q);
                            return q1.getItem().then(function(result) {
                                if (_.isNil(result)) {
                                    return Q.reject(new HttpNotFoundError());
                                }
                                if (_.isString(navigationProperty)) {
                                    return self.getNavigationProperty(returnEntitySet.name,navigationProperty, result[returnModel.primaryKey])
                                }
                                return Q.resolve(self.json(returnEntitySet.mapInstance(context,result)));
                            });
                        });
                    }
                    if (typeof navigationProperty !== 'undefined') {
                        return Q.reject(new HttpBadRequestError());
                    }
                    return filter( _.extend({
                        "$top":DefaultTopQueryOption
                    },context.params)).then(function(q) {
                        var count = context.params.hasOwnProperty('$inlinecount') ? parseBoolean(context.params.$inlinecount) : (context.params.hasOwnProperty('$count') ? parseBoolean(context.params.$count) : false);
                        var q1 = extendQueryable(result, q);
                        if (count) {
                            return q1.getList().then(function(result) {
                                return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                        return q1.getItems().then(function(result) {
                            return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                        });
                    });
                }
                if (_.isNil(navigationProperty)) {
                    if (returnsCollection) {
                        return Q.resolve(self.json(returnEntitySet.mapInstanceSet(context,result)));
                    }
                    else {
                        return Q.resolve(self.json(returnEntitySet.mapInstance(context,result)));
                    }
                }
                if (_.isNil(returnEntitySet)) {
                    return Q.reject(new HttpNotFoundError("Result EntitySet not found"));
                }
                return self.getNavigationProperty(returnEntitySet.name,navigationProperty, result[returnModel.primaryKey])
            });
        }
    }
    return this.next();
};
defineDecorator(HttpServiceController.prototype, 'getEntitySetFunction', httpGet());
defineDecorator(HttpServiceController.prototype, 'getEntitySetFunction', httpAction("entitySetFunction"));

/**
 *
 * @param {string} entitySet
 * @param {string} entityAction
 * @param {*} id
 */
HttpServiceController.prototype.postEntityAction = function(entitySet, entityAction, id) {
    var self = this;
    var context = self.context;
    var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
    if (_.isNil(thisEntitySet)) {
        return Q.reject(new HttpNotFoundError("Entity set not found"));
    }
    /**
     * get current data model
     * @type {DataModel}
     */
    var thisModel = context.model(thisEntitySet.entityType.name);

    if (typeof thisModel === 'undefined') {
        return Q.reject(new HttpNotFoundError("Entity type not found"));
    }
    if (typeof entityAction === 'undefined') {
        return Q.reject(new HttpNotFoundError("Entity type action cannot be empty"));
    }
    /**
     * get current model builder
     * @type {ODataModelBuilder}
     */
    var builder = context.getApplication().getStrategy(ODataModelBuilder);

    // validate entity type function
    var action = thisEntitySet.entityType.hasAction(entityAction);
    if (typeof action === 'undefined') {
        return Q.reject(new HttpNotFoundError("Entity type action not found"));
    }
    // get typed item
    return thisModel.where(thisModel.primaryKey).equal(id).select(thisModel.primaryKey).getTypedItem().then(function (obj) {
        if (typeof obj === 'undefined') {
            return Q.reject(new HttpNotFoundError("Entity type action cannot be empty"));
        }
        //check if entity set has a function with the same name
        var memberFunc = EdmMapping.hasOwnAction(obj, action.name);
        if (memberFunc) {
            var actionParameters = [];
            var parameters = _.filter(action.parameters, function (x) {
                return x.name !== 'bindingParameter';
            });
            // if action has only one parameter and this parameter has fromBody flag
            if (parameters.length === 1 && parameters[0].fromBody) {
                actionParameters.push(context.request.body);
            }
            else {
                // add other parameters by getting request body attributes
                _.forEach(parameters, function (x) {
                    actionParameters.push(context.request.body[x.name]);
                });
            }
            return Q.resolve(memberFunc.apply(obj, actionParameters)).then(function (result) {
                // check if action returns a collection of object
                var returnsCollection = _.isString(action.returnCollectionType);
                var returnEntitySet;
                if (returnsCollection) {
                    returnEntitySet = builder.getEntityTypeEntitySet(action.returnCollectionType);
                }
                if (result instanceof DataQueryable) {
                    // todo:: validate return collection type and pass system query options ($filter, $expand, $select etc)
                    if (returnsCollection) {
                        // call DataModel.getItems() instead of DataModel.getList()
                        // an action that returns a collection of objects must always return a native array (without paging parameters)
                        return result.getItems().then(function (finalResult) {
                            if (returnEntitySet) {
                                return self.json(returnEntitySet.mapInstanceSet(context, finalResult));
                            }
                            return self.json(finalResult);
                        });
                    }
                    else {
                        // otherwise call DataModel.getItem() to get only the first item of the result set
                        return result.getItem().then(function (finalResult) {
                            return self.json(finalResult);
                        });
                    }
                }
                if (typeof result === 'undefined') {
                    // return no content
                    return self.json();
                }
                // return result as native object
                if (returnsCollection && returnEntitySet) {
                    return self.json(returnEntitySet.mapInstanceSet(context, result));
                }
                return self.json(result);
            });
        }
        // entity type does not have an instance method with the given name, continue
        return Q.reject(new HttpNotFoundError());
    }).catch(function (err) {
        return Q.reject(err);
    });
};
defineDecorator(HttpServiceController.prototype, 'postEntityAction', httpPost());
defineDecorator(HttpServiceController.prototype, 'postEntityAction', httpAction("entityAction"));

/**
 *
 * @param {string} entitySet
 * @param {string} entityAction
 */
HttpServiceController.prototype.postEntitySetAction = function(entitySet, entityAction) {
    var self = this;
    var context = self.context;
    var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
    if (_.isNil(thisEntitySet)) {
        return Q.reject(new HttpNotFoundError("Entity set not found"));
    }
    /**
     * get current data model
     * @type {DataModel}
     */
    var thisModel = context.model(thisEntitySet.entityType.name);

    if (typeof thisModel === 'undefined') {
        return Q.reject(new HttpNotFoundError("Entity type not found"));
    }
    if (typeof entityAction === 'undefined') {
        return Q.reject(new HttpNotFoundError("Entity type action cannot be empty"));
    }
    /**
     * get current model builder
     * @type {ODataModelBuilder}
     */
    var builder = context.getApplication().getStrategy(ODataModelBuilder);

    var action = thisEntitySet.entityType.collection.hasAction(entityAction);
    if (action) {
        //get data object class
        var DataObjectClass = thisModel.getDataObjectType();
        var actionFunc = EdmMapping.hasOwnAction(DataObjectClass, entityAction);
        if (typeof actionFunc !== 'function') {
            return Q.reject(new HttpBadRequestError('Invalid entity set configuration. The specified action cannot be found'));
        }
        var actionParameters = [];
        var parameters = _.filter(action.parameters, function (x) {
            return x.name !== 'bindingParameter';
        });
        // if parameters must be included in body
        if (parameters.length) {
            // validate request body
            if (typeof context.request.body === 'undefined') {
                // throw bad request if body is missing
                return Q.reject(new HttpBadRequestError('Request body cannot be empty'));
            }
        }
        // add context as the first parameter
        actionParameters.push(context);
        // if action has only one parameter and this parameter has fromBody flag
        if (parameters.length === 1 && parameters[0].fromBody) {
            actionParameters.push(context.request.body);
        }
        else {
            // add other parameters by getting request body attributes
            _.forEach(parameters, function (x) {
                actionParameters.push(context.request.body[x.name]);
            });
        }
        // invoke action
        return Q.resolve(actionFunc.call(null, actionParameters)).then(function (result) {
            // check if action returns a collection of object
            var returnsCollection = _.isString(action.returnCollectionType);
            var returnEntitySet;
            // if func returns a collection of items
            if (returnsCollection) {
                // get return entity set
                returnEntitySet = builder.getEntityTypeEntitySet(action.returnCollectionType);
            }
            if (result instanceof DataQueryable) {
                // todo:: validate return collection type and pass system query options ($filter, $expand, $select etc)
                if (returnsCollection) {
                    // call DataModel.getItems() instead of DataModel.getList()
                    // an action that returns a collection of objects must always return a native array (without paging parameters)
                    return result.getItems().then(function (finalResult) {
                        //return result
                        if (returnEntitySet) {
                            return self.json(returnEntitySet.mapInstanceSet(context,finalResult));
                        }
                        return self.json(finalResult);
                    });
                }
                else {
                    // otherwise call DataModel.getItem() to get only the first item of the result set
                    return result.getItem().then(function (finalResult) {
                        return self.json(finalResult);
                    });
                }
            }
            if (typeof result === 'undefined') {
                // return no content
                return self.json();
            }
            // return result as native object
            return self.json(result);
        }).catch(function (err) {
            return Q.reject(err);
        });

    }
    // there is no action with the given name, continue
    return Q.reject(new HttpNotFoundError());

};
defineDecorator(HttpServiceController.prototype, 'postEntitySetAction', httpPost());
defineDecorator(HttpServiceController.prototype, 'postEntitySetAction', httpAction("entitySetAction"));

/**
 *
 * @returns {ODataModelBuilder}
 */
HttpServiceController.prototype.getBuilder = function() {
    return this.context.getApplication().getService(ODataModelBuilder);
};

if (typeof module !== 'undefined') {
    module.exports = HttpServiceController;
}