// noinspection ES6ConvertVarToLetConst
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
var EdmType = require('@themost/data/odata').EdmType;
var DefaultTopQueryOption = 50;

/**
 * @this HttpServiceController
 * @param {HttpContext} context
 * @param {*} value
 * @param {string} type
 * @private
 */
function mapPrimitiveInstance(context, value, type) {
    if (context) {
        var contextLink = this.getBuilder().getContextLink(context);
        if (contextLink) {
            return {
                "@odata.context": contextLink + '#' + type,
                "value": value
            };
        }
    }
    return {
        "value": value
    };
}

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
        return Promise.resolve(self.xml(result.outerXML()));
    });
};
defineDecorator(HttpServiceController.prototype, 'getMetadata', httpGet());
defineDecorator(HttpServiceController.prototype, 'getMetadata', httpAction("metadata"));

HttpServiceController.prototype.getIndex = function() {
    var self = this;
    return self.getBuilder().getEdm().then(function (result) {
        if (typeof self.getBuilder().getContextLink === 'function') {
            return Promise.resolve({
                "@odata.context": self.getBuilder().getContextLink(self.context),
                value: result.entityContainer.entitySet
            });
        }
        return Promise.resolve({
            value: result.entityContainer.entitySet
        });
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
        if (thisEntitySet == null) {
            return this.next();
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (model == null) {
            return Promise.reject(new HttpNotFoundError("Entity not found"));
        }
        //set default $top property
        if (!context.params.hasOwnProperty('$top')) {
            Object.assign(context.params, {
                $top: DefaultTopQueryOption
            });
        }
        //parse query filter and return a DataQueryable
        return model.filter(context.params).then(function(query) {
            var count = parseBoolean(self.context.params.$count);
            if (count) {
                //get items with count
                return query.getList().then(function(result) {
                    //and finally return json result
                    return Promise.resolve(thisEntitySet.mapInstanceSet(context,result));
                });
            }
            else {
                //get items
                return query.getItems().then(function(result) {
                    //and finally return json result
                    return Promise.resolve(thisEntitySet.mapInstanceSet(context,result));
                });
            }
        });
    }
    catch (err) {
        return Promise.reject(err);
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
        if (thisEntitySet == null) {
            return this.next();
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (model == null) {
            return Promise.reject(new HttpNotFoundError("Entity not found"));
        }
        var body = context.request.body;
        return model.save(body).then(function () {
            if (Array.isArray(body)) {
                return Promise.resolve(thisEntitySet.mapInstanceSet(context,body));
            }
            else {
                return Promise.resolve(thisEntitySet.mapInstance(context,body));
            }
        });
    }
    catch (err) {
        return Promise.reject(err);
    }
};
defineDecorator(HttpServiceController.prototype, 'postItems', httpPut());
defineDecorator(HttpServiceController.prototype, 'postItems', httpPost());
defineDecorator(HttpServiceController.prototype, 'postItems', httpAction("items"));

/**
 *
 * @param {string} entitySet
 */
HttpServiceController.prototype.deleteItems = function(entitySet) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (thisEntitySet == null) {
            return this.next();
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (model == null) {
            return Promise.reject(new HttpNotFoundError("Entity not found"));
        }
        var body = context.request.body;
        return model.remove(body).then(function () {
            if (Array.isArray(body)) {
                return Promise.resolve(thisEntitySet.mapInstanceSet(context,body));
            }
            else {
                return Promise.resolve(thisEntitySet.mapInstance(context,body));
            }
        });
    }
    catch (err) {
        return Promise.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'deleteItems', httpDelete());
defineDecorator(HttpServiceController.prototype, 'deleteItems', httpAction("items"));

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
        if (thisEntitySet == null) {
            return this.next();
        }
        else {
            model = context.model(thisEntitySet.entityType.name);
            // validate model
            if (model == null) {
                return Promise.reject(new HttpNotFoundError('Entity not found'));
            }
            if (id == null) {
                // search route parameters
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    return model.filter({
                        "$filter": context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (value == null) {
                                return Promise.reject(new HttpNotFoundError());
                            }
                            return self.getItem(entitySet, value);
                        });
                    });
                }
                // id parameter cannot be resolved
                return Promise.reject(new HttpBadRequestError('Object identifier request parameter is missing.'));
            }
        }
        return model.filter({
            "$select": context.params.$select,
            "$expand": context.params.$expand
        }).then(function(query) {
            return query.where(model.primaryKey).equal(id).getItem().then(function (result) {
                if (result == null) {
                    return Promise.reject(new HttpNotFoundError());
                }
                return Promise.resolve(thisEntitySet.mapInstance(context,result));
            });
        });
    }
    catch (err) {
        return Promise.reject(err);
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
    var model;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (thisEntitySet == null) {
            return this.next();
        }
        else {
            model = context.model(thisEntitySet.entityType.name);
            // validate model
            if (model == null) {
                return Promise.reject(new HttpNotFoundError('Entity not found'));
            }
            if (id == null) {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    return model.filter({
                        "$filter": context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (value == null) {
                                return Promise.reject(new HttpNotFoundError('The requested object cannot be found or is inaccessible.'));
                            }
                            return self.patchItem(entitySet, value);
                        });
                    });
                }
                // id parameter cannot be resolved
                return Promise.reject(new HttpBadRequestError('Object identifier request parameter is missing.'));
            }
        }
        return model.where(model.primaryKey).equal(id).select("id").getItem().then(function (result) {
            if (result == null) {
                return Promise.reject(new HttpNotFoundError('The requested object cannot be found or is inaccessible.'));
            }
            var body = Object.assign(context.request.body, result);
            // save item
            return model.save(body).then(function () {
                return Promise.resolve(thisEntitySet.mapInstance(context,body));
            });
        });
    }
    catch (err) {
        return Promise.reject(err);
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
    var model;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (thisEntitySet == null) {
            return this.next();
        }
        // get model
        model = context.model(thisEntitySet.entityType.name);
        // validate model
        if (model == null) {
            return Promise.reject(new HttpNotFoundError('Entity not found'));
        }
        // validate object identifier
        if (typeof id === 'undefined') {
            if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                return model.filter({
                    "$filter":context.request.route.params.$filter
                }).then(function(query) {
                    return query.select(model.primaryKey).value().then(function (value) {
                        if (value == null) {
                            return Promise.reject(new HttpNotFoundError('The requested object cannot be found or is inaccessible.'));
                        }
                        return self.deleteItem(entitySet, value);
                    });
                });
            }
            // id parameter cannot be resolved
            return Promise.reject(new HttpBadRequestError('Object identifier request parameter is missing.'));
        }
        return model.where(model.primaryKey).equal(id).count().then(function (exists) {
            if (!exists) {
                return Promise.reject(new HttpNotFoundError());
            }
            var obj = {};
            obj[model.primaryKey] = id;
            return model.remove(obj).then(function () {
                return Promise.resolve(obj);
            });
        });
    }
    catch (err) {
        return Promise.reject(err);
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
        if (thisEntitySet == null) {
            return this.next();
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (model == null) {
            return Promise.reject(new HttpNotFoundError('Entity not found'));
        }
        // get request body
        var body = context.request.body;
        // save object
        return model.save(body).then(function () {
            if (Array.isArray(body)) {
                return Promise.resolve(thisEntitySet.mapInstanceSet(context,body));
            }
            else {
                return Promise.resolve(thisEntitySet.mapInstance(context,body));
            }
        });
    }
    catch (err) {
        return Promise.reject(err);
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
        if (Array.isArray(target.query.$expand)) {
            targetExpand = target.query.$expand;
        }
        else if (typeof  target.query.$expand === 'object') {
            targetExpand.push(target.query.$expand);
        }
        var sourceExpand = [].concat(source.query.$expand);

        var res = sourceExpand.filter(function (x) {
            return typeof targetExpand.find(function (y) {
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
        if (thisEntitySet == null) {
            return this.next();
        }
        /**
         * @type {DataModel}
         */
        model = context.model(thisEntitySet.entityType.name);
        if (model == null) {
            return Promise.reject(new HttpNotFoundError('Entity not found'));
        }
        // validate object identifier
        if (id == null) {
            if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                return model.filter({
                    "$filter": context.request.route.params.$filter
                }).then(function(query) {
                    return query.select(model.primaryKey).value().then(function (value) {
                        if ( value == null) {
                            return Promise.reject(new HttpNotFoundError('The requested object cannot be found or is inaccessible.'));
                        }
                        return self.getNavigationProperty(entitySet, navigationProperty, value);
                    });
                });
            }
            return Promise.reject(new HttpForbiddenError());
        }

        return model.where(model.primaryKey).equal(id).select(model.primaryKey).getTypedItem()
            .then(function(obj) {
                if (obj == null) {
                    return Promise.reject(new HttpNotFoundError('The requested object cannot be found or is inaccessible.'));
                }
                //check if entity set has a function with the same name
                var func = thisEntitySet.entityType.hasFunction(navigationProperty);
                if (func) {
                    var returnsCollection = typeof func.returnCollectionType === 'string';
                    var returnModel = context.model(func.returnType || func.returnCollectionType);
                    //find method
                    var memberFunc = EdmMapping.hasOwnFunction(obj,  func.name);
                    if (memberFunc) {
                        var funcParameters = func.parameters.filter(function(x) {
                            return x.name !== 'bindingParameter';
                        }).map(function(x) {
                            return LangUtils.parseValue(context.params[x.name]);
                        });
                        return Promise.resolve(memberFunc.apply(obj, funcParameters)).then(function(result) {
                            if (result instanceof DataQueryable) {
                                if (returnModel == null) {
                                    return Promise.reject(new HttpNotFoundError("Result Entity not found"));
                                }
                                var returnEntitySet = self.getBuilder().getEntityTypeEntitySet(returnModel.name);
                                if (returnEntitySet == null) {
                                    returnEntitySet = self.getBuilder().getEntity(returnModel.name);
                                }
                                //if the return value is a single instance
                                if (!returnsCollection) {
                                    //pass context parameters (only $select and $expand)
                                    var params = _.pick(context.params, [
                                        "$select",
                                        "$expand"
                                    ]);
                                    //filter with parameters
                                    return returnModel.filter(params).then(function(q) {
                                        // extend data queryable
                                        var q1 = extendQueryable(result, q);
                                        //get item
                                        return q1.getItem().then(function(result) {
                                            //return result
                                            return Promise.resolve(returnEntitySet.mapInstance(context,result));
                                        });
                                    });
                                }
                                //else if the return value is a collection
                                return returnModel.filter( Object.assign({
                                    "$top": DefaultTopQueryOption
                                }, context.params)).then(function(q) {
                                    var count = context.params.hasOwnProperty('$inlinecount') ? parseBoolean(context.params.$inlinecount) : (context.params.hasOwnProperty('$count') ? parseBoolean(context.params.$count) : false);
                                    var q1 = extendQueryable(result, q);
                                    if (count) {
                                        return q1.getList().then(function(result) {
                                            return Promise.resolve(returnEntitySet.mapInstanceSet(context,result));
                                        });
                                    }
                                    return q1.getItems().then(function(result) {
                                        return Promise.resolve(returnEntitySet.mapInstanceSet(context,result));
                                    });
                                });
                            }
                            // get entity type
                            var returnEntityType = self.getBuilder().getEntity(func.returnType || func.returnCollectionType);
                            // if return entity type is defined
                            if (returnEntityType) {
                                if (returnsCollection) {
                                    // map collection
                                    return Promise.resolve(returnEntityType.mapInstanceSet(context, result));
                                }
                                // or map object
                                return Promise.resolve(returnEntityType.mapInstance(context, result));
                            }
                            // otherwise return value
                            return Promise.resolve({
                                value: result
                            });
                        });
                    }
                }

                //get primary key
                var key = obj[model.primaryKey];
                //get mapping
                var mapping = model.inferMapping(navigationProperty);
                //get count parameter
                var count = context.params.hasOwnProperty('$inlinecount') ? parseBoolean(context.params.$inlinecount) : (context.params.hasOwnProperty('$count') ? parseBoolean(context.params.$count) : false);
                if (mapping == null) {
                    //try to find associated model
                    //get singular model name
                    var otherModelName = pluralize.singular(navigationProperty);
                    //search for model with this name
                    var otherModel = self.context.model(otherModelName);
                    if (otherModel) {
                        var otherFields = otherModel.attributes.filter(function(x) {
                            return x.type === model.name;
                        });
                        if (otherFields.length>1) {
                            return Promise.reject(new HttpMethodNotAllowedError('Multiple associations found'));
                        }
                        else if (otherFields.length === 1) {
                            var otherField = otherFields[0];
                            mapping = otherModel.inferMapping(otherField.name);
                            if (mapping && mapping.associationType === 'junction') {
                                var attr;
                                //search model for attribute that has an association of type junction with child model
                                if (mapping.parentModel === otherModel.name) {
                                    attr = otherModel.attributes.find(function(x) {
                                        return x.name === otherField.name;
                                    });
                                }
                                else {
                                    attr = model.attributes.find(function(x) {
                                        return x.type === otherModel.name;
                                    });
                                }
                                if (attr) {
                                    model = attr.name;
                                    mapping = model.inferMapping(attr.name);
                                }
                            }
                        }
                    }
                    if (mapping == null) {
                        return Promise.reject(new HttpNotFoundError("Association not found"));
                    }
                }
                if (mapping.associationType === 'junction') {
                    /**
                     * @type {DataQueryable}
                     */
                    var junction = obj.property(navigationProperty);
                    return junction.model.filter(self.context.params).then(function (q) {
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
                                    return Promise.resolve(thisEntitySet.mapInstanceSet(context,result));
                                }
                                return Promise.resolve(otherEntitySet.mapInstanceSet(context,result));
                            });
                        }
                        else {
                            return junction.getItems().then(function (result) {
                                if (typeof otherEntitySet === 'undefined') {
                                    return Promise.resolve(thisEntitySet.mapInstanceSet(context,result));
                                }
                                return Promise.resolve(otherEntitySet.mapInstanceSet(context,result));
                            });
                        }
                    });
                }
                else if (mapping.parentModel === model.name && mapping.associationType === 'association') {
                    //get associated model
                    var associatedModel = self.context.model(mapping.childModel);
                    if (associatedModel == null) {
                        return Promise.reject(new HttpNotFoundError('Associated model not found'));
                    }
                    var associatedEntitySet = self.getBuilder().getEntityTypeEntitySet(associatedModel.name);
                    return associatedModel.filter( Object.assign({
                        "$top": DefaultTopQueryOption
                    },context.params)).then(function(q) {
                        if (count) {
                            return q.where(mapping.childField).equal(key).getList().then(function (result) {
                                return Promise.resolve(associatedEntitySet.mapInstanceSet(context,result));
                            });
                        }
                        else {
                            // get navigation property
                            var property = thisEntitySet.getEntityTypeNavigationProperty(navigationProperty, true);
                            if (property == null) {
                                return Promise.reject(Object.assign(new HttpBadRequestError('Invalid navigation property.'), {
                                    entitySet: thisEntitySet.name,
                                    navigationProperty: navigationProperty
                                }));
                            }
                            // if navigation property type is a collection of objects
                            if (EdmType.IsCollection(property.type)) {
                                return q.where(mapping.childField).equal(key).getItems().then(function (result) {
                                    return Promise.resolve(associatedEntitySet.mapInstanceSet(context,result));
                                });
                            }
                            else {
                                // else send
                                return q.where(mapping.childField).equal(key).getItem().then(function (result) {
                                    return Promise.resolve(thisEntitySet.mapInstanceProperty(context, navigationProperty, result));
                                });
                            }
                        }
                    });
                }
                else if (mapping.childModel === model.name && mapping.associationType === 'association') {
                    //get associated model
                    var parentModel = self.context.model(mapping.parentModel);
                    if (parentModel == null) {
                        return Promise.reject(new HttpNotFoundError('Parent associated model not found'));
                    }
                    return model.where(model.primaryKey).equal(obj.id)
                        .select(model.primaryKey,navigationProperty)
                        .expand(navigationProperty).getItem()
                        .then(function(result) {
                            var parentEntitySet = self.getBuilder().getEntityTypeEntitySet(parentModel.name);
                            return Promise.resolve(parentEntitySet.mapInstance(context,result[navigationProperty]));
                    });
                }
                else {
                    return Promise.reject(new HttpNotFoundError());
                }
            });

    }
    catch (err) {
        return Promise.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'getNavigationProperty', httpGet());
defineDecorator(HttpServiceController.prototype, 'getNavigationProperty', httpAction("navigationProperty"));

/**
 *
 * @param {string} entitySet
 * @param {string} entityFunction
 * @param {*} id
 */
HttpServiceController.prototype.getEntityFunction = function(entitySet, entityFunction, id) {
    var self = this;
    var context = self.context;
    /**
     * get current model builder
     * @type {ODataModelBuilder}
     */
    var builder = context.getApplication().getStrategy(ODataModelBuilder);
    // get entity set
    var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
    if (thisEntitySet == null) {
        return this.next();
    }
    // get underlying model
    var thisModel = context.model(thisEntitySet.entityType.name);
    if (thisModel == null) {
        return Promise.reject(new HttpNotFoundError('Entity not found'));
    }
    // if id is undefined
    if (id == null) {
        return this.next();
    }
    // get entity function
    var func = thisEntitySet.entityType.hasFunction(entityFunction);
    if (func) {
        return thisModel.where(thisModel.primaryKey).equal(id).select(thisModel.primaryKey).getTypedItem().then(function (obj) {
            if (typeof obj === 'undefined') {
                return Promise.reject(new HttpNotFoundError("Entity type action cannot be empty"));
            }
            //check if entity set has a function with the same name
            var memberFunc = EdmMapping.hasOwnAction(obj, func.name);
            if (memberFunc) {
                var functionParameters = func.parameters.filter(function (x) {
                    return x.name !== 'bindingParameter';
                }).map(function (x) {
                    return context.getParam(x.name);
                });
                return Promise.resolve(memberFunc.apply(obj, functionParameters)).then(function (result) {
                    // check if action returns a collection of object
                    var returnsCollection = typeof func.returnCollectionType === 'string';
                    var returnEntitySet;
                    if (returnsCollection) {
                        returnEntitySet = builder.getEntityTypeEntitySet(func.returnCollectionType);
                    }
                    if (result instanceof DataQueryable) {
                         if (returnsCollection) {
                            // call DataModel.getItems() instead of DataModel.getList()
                            // an action that returns a collection of objects must always return a native array (without paging parameters)
                            return result.getItems().then(function (finalResult) {
                                if (returnEntitySet) {
                                    return Promise.resolve(returnEntitySet.mapInstanceSet(context, finalResult));
                                }
                                return Promise.resolve(finalResult);
                            });
                        }
                        else {
                            // otherwise call DataModel.getItem() to get only the first item of the result set
                            return result.getItem().then(function (finalResult) {
                                return Promise.resolve(finalResult);
                            });
                        }
                    }
                    if (typeof result === 'undefined') {
                        // return no content
                        return Promise.resolve();
                    }
                    // return result as native object
                    if (returnsCollection && returnEntitySet) {
                        return Promise.resolve(returnEntitySet.mapInstanceSet(context, result));
                    }
                    return Promise.resolve(result);
                });
            }
            return Promise.reject(new HttpBadRequestError('Member function cannot be found'));
        });
    }
    return this.next();
};
defineDecorator(HttpServiceController.prototype, 'getEntityFunction', httpGet());
defineDecorator(HttpServiceController.prototype, 'getEntityFunction', httpAction("entityFunction"));

/**
 *
 * @param {string} entitySet
 * @param {string} entitySetFunction
 * @param {string=} navigationProperty
 */
HttpServiceController.prototype.getEntitySetFunction = function(entitySet, entitySetFunction, navigationProperty) {
    var self = this;
    var context = self.context;
    var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
    if (thisEntitySet == null) {
        return this.next();
    }
    var model = context.model(thisEntitySet.entityType.name);
    if (model == null) {
        return Promise.reject(new HttpNotFoundError('Entity not found'));
    }
    var func = thisEntitySet.entityType.collection.hasFunction(entitySetFunction);
    if (func) {
        //get data object class
        var DataObjectClass = model.getDataObjectType();
        var staticFunc = EdmMapping.hasOwnFunction(DataObjectClass,entitySetFunction);
        if (staticFunc) {
            return Promise.resolve(staticFunc(context)).then(function(result) {
                var returnsCollection = typeof func.returnCollectionType === 'string';
                // get return entity set
                var returnEntitySet = self.getBuilder().getEntityTypeEntitySet(func.returnType || func.returnCollectionType);
                // get model
                var returnModel = context.model(func.returnType || func.returnCollectionType);
                // get return type
                var returnEntityType = self.getBuilder().getEntity(func.returnType || func.returnCollectionType);
                if (result instanceof DataQueryable) {
                    // if model is null throw error
                    if (returnModel == null) {
                        return Promise.reject(new HttpNotFoundError('Result Entity not found'));
                    }
                    if (!returnsCollection) {
                        //pass context parameters (if navigationProperty is empty)
                        var params = {};
                        if (navigationProperty == null) {
                            params = _.pick(context.params, [
                                "$select",
                                "$expand"
                            ]);
                        }
                        return returnModel.filter(params).then(function(q) {
                            //do not add context params
                            var q1 = extendQueryable(result, q);
                            return q1.getItem().then(function(result) {
                                if (result == null) {
                                    return Promise.reject(new HttpNotFoundError());
                                }
                                if (typeof navigationProperty === 'string') {
                                    return self.getNavigationProperty(returnEntityType.name,navigationProperty, result[returnModel.primaryKey])
                                }
                                return Promise.resolve(returnEntityType.mapInstance(context,result));
                            });
                        });
                    }
                    if (typeof navigationProperty !== 'undefined') {
                        return Promise.reject(new HttpBadRequestError());
                    }
                    return returnModel.filter(params)( Object.assign({
                        "$top":DefaultTopQueryOption
                    },context.params)).then(function(q) {
                        var count = context.params.hasOwnProperty('$inlinecount') ? parseBoolean(context.params.$inlinecount) : (context.params.hasOwnProperty('$count') ? parseBoolean(context.params.$count) : false);
                        var q1 = extendQueryable(result, q);
                        if (count) {
                            return q1.getList().then(function(result) {
                                return Promise.resolve(returnEntityType.mapInstanceSet(context,result));
                            });
                        }
                        return q1.getItems().then(function(result) {
                            return Promise.resolve(returnEntityType.mapInstanceSet(context,result));
                        });
                    });
                }

                if (navigationProperty == null) {
                    // if entity set is not defined
                    if (returnEntityType) {
                        // map result
                        if (returnsCollection) {
                            // for collection
                            return Promise.resolve(returnEntityType.mapInstanceSet(context,result));
                        }
                        else {
                            // for object
                            return Promise.resolve(returnEntityType.mapInstance(context,result));
                        }
                    }
                    else {
                        // return native object
                        return Promise.resolve(mapPrimitiveInstance.bind(self)(context, result, func.returnType || func.returnCollectionType));
                    }
                }
                if (returnEntitySet == null) {
                    return Promise.reject(new HttpNotFoundError('Result EntitySet not found'));
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
    if (thisEntitySet == null) {
        return Promise.reject(new HttpNotFoundError("Entity set not found"));
    }
    /**
     * get current data model
     * @type {DataModel}
     */
    var thisModel = context.model(thisEntitySet.entityType.name);

    if (typeof thisModel === 'undefined') {
        return Promise.reject(new HttpNotFoundError("Entity type not found"));
    }
    if (typeof entityAction === 'undefined') {
        return Promise.reject(new HttpNotFoundError("Entity type action cannot be empty"));
    }
    /**
     * get current model builder
     * @type {ODataModelBuilder}
     */
    var builder = context.getApplication().getStrategy(ODataModelBuilder);

    // validate entity type function
    var action = thisEntitySet.entityType.hasAction(entityAction);
    if (typeof action === 'undefined') {
        return Promise.reject(new HttpNotFoundError("Entity type action not found"));
    }
    // get typed item
    return thisModel.where(thisModel.primaryKey).equal(id).select(thisModel.primaryKey).getTypedItem().then(function (obj) {
        if (typeof obj === 'undefined') {
            return Promise.reject(new HttpNotFoundError("Entity type action cannot be empty"));
        }
        //check if entity set has a function with the same name
        var memberFunc = EdmMapping.hasOwnAction(obj, action.name);
        if (memberFunc) {
            var actionParameters = [];
            var parameters = action.parameters.filter(function (x) {
                return x.name !== 'bindingParameter';
            });
            // if action has only one parameter and this parameter has fromBody flag
            if (parameters.length === 1 && parameters[0].fromBody) {
                actionParameters.push(context.request.body);
            }
            else {
                // add other parameters by getting request body attributes
                parameters.forEach(function (x) {
                    actionParameters.push(context.request.body[x.name]);
                });
            }
            return Promise.resolve(memberFunc.apply(obj, actionParameters)).then(function (result) {
                // check if action returns a collection of object
                var returnsCollection = typeof action.returnCollectionType === 'string';
                var returnEntitySet;
                if (returnsCollection) {
                    returnEntitySet = builder.getEntityTypeEntitySet(action.returnCollectionType);
                }
                if (result instanceof DataQueryable) {
                    if (returnsCollection) {
                        // an action that returns a collection of objects must always return a native array (without paging parameters)
                        return result.getItems().then(function (finalResult) {
                            return Promise.resolve(returnEntitySet.mapInstanceSet(context, finalResult));
                        });
                    }
                    else {
                        // otherwise call DataModel.getItem() to get only the first item of the result set
                        return result.getItem().then(function (finalResult) {
                            return Promise.resolve(returnEntitySet.mapInstance(context, finalResult));
                        });
                    }
                }
                // get result entity type
                var returnEntityType = self.getBuilder().getEntity(action.returnType || action.returnCollectionType);
                // if return entity type is defined
                if (returnEntityType) {
                    if (returnsCollection) {
                        // map collection
                        return Promise.resolve(returnEntityType.mapInstanceSet(context, result));
                    }
                    // or map object
                    return Promise.resolve(returnEntityType.mapInstance(context, result));
                }
                // otherwise return value
                return Promise.resolve(mapPrimitiveInstance.bind(self)(context, result, action.returnType || action.returnCollectionType));
            });
        }
        // entity type does not have an instance method with the given name, continue
        return Promise.reject(new HttpNotFoundError());
    }).catch(function (err) {
        return Promise.reject(err);
    });
};
defineDecorator(HttpServiceController.prototype, 'postEntityAction', httpPost());
defineDecorator(HttpServiceController.prototype, 'postEntityAction', httpAction("entityAction"));

/**
 *
 * @param {string} entitySet
 * @param {string} entitySetAction
 */
HttpServiceController.prototype.postEntitySetAction = function(entitySet, entitySetAction) {
    var self = this;
    var context = self.context;
    var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
    if (thisEntitySet == null) {
        return Promise.reject(new HttpNotFoundError("Entity set not found"));
    }
    /**
     * get current data model
     * @type {DataModel}
     */
    var thisModel = context.model(thisEntitySet.entityType.name);

    if (typeof thisModel === 'undefined') {
        return Promise.reject(new HttpNotFoundError("Entity type not found"));
    }
    if (typeof entitySetAction === 'undefined') {
        return Promise.reject(new HttpNotFoundError("Entity type action cannot be empty"));
    }

    var action = thisEntitySet.entityType.collection.hasAction(entitySetAction);
    if (action) {
        //get data object class
        var DataObjectClass = thisModel.getDataObjectType();
        var actionFunc = EdmMapping.hasOwnAction(DataObjectClass, entitySetAction);
        if (typeof actionFunc !== 'function') {
            return Promise.reject(new HttpBadRequestError('Invalid entity set configuration. The specified action cannot be found'));
        }
        var actionParameters = [];
        var parameters = action.parameters.filter(function (x) {
            return x.name !== 'bindingParameter';
        });
        // if parameters must be included in body
        if (parameters.length) {
            // validate request body
            if (typeof context.request.body === 'undefined') {
                // throw bad request if body is missing
                return Promise.reject(new HttpBadRequestError('Request body cannot be empty'));
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
            parameters.forEach(function (x) {
                actionParameters.push(context.request.body[x.name]);
            });
        }
        // invoke action
        return Promise.resolve(actionFunc.apply(null, actionParameters)).then(function (result) {
            // check if action returns a collection of object
            var returnsCollection = typeof action.returnCollectionType === 'string';
            // get result entity type
            var returnEntityType = self.getBuilder().getEntity(action.returnType || action.returnCollectionType);
            if (result instanceof DataQueryable) {
                if (returnsCollection) {
                    // call DataModel.getItems() instead of DataModel.getList()
                    // an action that returns a collection of objects must always return a native array (without paging parameters)
                    return result.getItems().then(function (finalResult) {
                        //return result
                        return Promise.resolve(returnEntityType.mapInstanceSet(context, finalResult));
                    });
                }
                else {
                    // otherwise call DataModel.getItem() to get only the first item of the result set
                    return result.getItem().then(function (finalResult) {
                        return Promise.resolve(returnEntityType.mapInstance(context, finalResult));
                    });
                }
            }
            // if return entity type is defined
            if (returnEntityType) {
                if (returnsCollection) {
                    // map collection
                    return Promise.resolve(returnEntityType.mapInstanceSet(context, result));
                }
                // or map object
                return Promise.resolve(returnEntityType.mapInstance(context, result));
            }
            // otherwise return value
            return Promise.resolve(mapPrimitiveInstance.bind(self)(context, result, action.returnType || action.returnCollectionType));
        }).catch(function (err) {
            return Promise.reject(err);
        });

    }
    // there is no action with the given name, continue
    return Promise.reject(new HttpNotFoundError());

};
defineDecorator(HttpServiceController.prototype, 'postEntitySetAction', httpPost());
defineDecorator(HttpServiceController.prototype, 'postEntitySetAction', httpAction("entitySetAction"));

HttpServiceController.prototype.postEntitySetFunction = function(entitySet, entitySetFunction, entityAction) {
    var self = this;
    var context = self.context;
    /**
     * get current model builder
     * @type {ODataModelBuilder}
     */
    var builder = context.getApplication().getStrategy(ODataModelBuilder);
    // get entity set
    var thisEntitySet = builder.getEntitySet(entitySet);
    // if entity set is null
    if (thisEntitySet == null) {
        // continue
        return this.next();
    }
    /**
     * get current data model
     * @type {DataModel}
     */
    var thisModel = context.model(thisEntitySet.entityType.name);
    // if entityType cannot be found throw error
    if (typeof thisModel === 'undefined') {
        return Promise.reject(new HttpNotFoundError('Entity type not found'));
    }
    // if entity action is undefined
    if (typeof entityAction === 'undefined') {
        // return
        return this.next();
    }
    // validate entity type collection function
    var func = thisEntitySet.entityType.collection.hasFunction(entitySetFunction);
    if (func == null) {
        // return
        return this.next();
    }
    // if function returns a collection of items
    if (func.returnCollectionType != null) {
        // throw error
        return Promise.reject(new HttpMethodNotAllowedError('Entity action cannot be bound to a collection of items.'))
    }
    if (func.returnType !== thisEntitySet.entityType.name) {
        return Promise.reject(new HttpMethodNotAllowedError('Entity set function returns an invalid type.'));
    }
    // execute entity set function
    // set context.params.$select to minimize cost
    context.params.$select = thisModel.primaryKey;
    return self.getEntitySetFunction(entitySet, entitySetFunction).then(function(result) {
        if (result == null) {
            return Promise.reject(new HttpNotFoundError('The requested entity cannot be found or is inaccessible'));
        }
        // execute entity action
        return self.postEntityAction(entitySet, entityAction, result[thisModel.primaryKey]);
    });

};
defineDecorator(HttpServiceController.prototype, 'postEntitySetFunction', httpPost());
defineDecorator(HttpServiceController.prototype, 'postEntitySetFunction', httpAction("entitySetFunction"));


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
