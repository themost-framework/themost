/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2014-10-13.
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
var util = require('util'),
    sprintf = require('sprintf'),
    _ = require("lodash"),
    types = require('./types'),
    DataObjectJunction = require('./data-object-junction').DataObjectJunction,
    DataObjectTag = require('./data-object-tag').DataObjectTag,
    HasManyAssociation = require('./has-many-association').HasManyAssociation,
    HasOneAssociation = require('./has-one-association').HasOneAssociation,
    HasParentJunction = require('./has-parent-junction').HasParentJunction;

/**
 * @ignore
 */
var STR_MISSING_CALLBACK_ARGUMENT = 'Missing argument. Callback function expected.',
    STR_MISSING_ARGUMENT_CODE = 'EARGM';

/**
 * @class
 * @classdesc Represents a data object associated with a data model.
 * DataObject class may be inherited by other classes that are defined as DataObjectClass of a data model.
 * @param {string=} type
 * @param {*=} obj The object that is going to be extended
 * @constructor
 * @augments EventEmitter2
 * @property {DataContext}  context - An instance of DataContext class associated with this object.
 * @property {string} $$type - A string that represents the type of this object.
 * @property {DataModel} $$model - The data model which is associated with this object.
 * @property {*} $$id - Gets the identifier of this object based on the associated model's primary key
 * @property {*} selectors - An object that represents a collection of selectors associated with this data object e.g is(':new'), is(':valid'), is(':enabled') etc
 */
function DataObject(type, obj)
{
    var self = this;
    /**
     * @type {DataContext}
     * @private
     */
    var context_ = null;
    Object.defineProperty(this,'context',{
        get: function() { return context_; } ,
        set: function(value) { context_=value; },
        enumerable:false,
        configurable:false
    });
    /**
     * @type {string}
     * @private
     */
    var type_ = null;
    if (type)
        type_ = type;
    else {
        //get type from constructor name
        if (/Model$/.test(this.constructor.name)) {
            type_ = this.constructor.name.replace(/Model$/,'');
        }
        else {
            if (this.constructor.name!=='DataObject')
                type_ = this.constructor.name;
        }
    }
    Object.defineProperty(this,'$$type',{
        get: function() { return type_; } ,
        set: function(value) { type_=value; if (model_) { model_ = null; } },
        enumerable:false,
        configurable:false
    });

    Object.defineProperty(this,'$$id',{
        get: function() {
            if (self.context) {
                var model = self.$$model;
                if (model) {
                    return self[model.primaryKey];
                }
            }
            //by default return id attribute, if any
            return self['id'];
        },
        enumerable:false,
        configurable:false
    });

    var model_;
    Object.defineProperty(this,'$$model',{
        get: function() {
            if (_.isNil(type_))
                return;
            if (model_) { return model_; }
            if (context_) {
                model_ = context_.model(type_);
            }
            return model_;
        },
        enumerable:false,
        configurable:false
    });

    var __selectors = { };
    Object.defineProperty(this,'selectors',{
        get: function() { return __selectors; } ,
        set: function(value) { __selectors=value; },
        enumerable:false,
        configurable:false
    });

    this.selector('new', function(callback) {
        if (typeof callback !== 'function') { return new Error(STR_MISSING_CALLBACK_ARGUMENT, STR_MISSING_ARGUMENT_CODE); }
        var self = this,
            model = self.$$model;
        model.inferState(self, function(err, state) {
            if (err) { return callback(err); }
            callback(null, (state==1));
        });
    }).selector('live', function(callback) {
        if (typeof callback !== 'function') { return new Error(STR_MISSING_CALLBACK_ARGUMENT, STR_MISSING_ARGUMENT_CODE); }
        var self = this,
            model = self.$$model;
        model.inferState(self, function(err, state) {
            if (err) { return callback(err); }
            callback(null, (state==2));
        });
    });

    if (typeof obj !== 'undefined' && obj != null) {
        _.assign(this, obj);
    }

    /**
     * Gets the identifier of this DataObject instance.
     * @returns {*}
     */
    this.getId = function () {
        return this.$$id;
    };

}
util.inherits(DataObject, types.EventEmitter2);

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /(?:^|,)\s*([^\s,=]+)/g;

/**
 * @ignore
 * @param func
 * @returns {Array}
 */
function $args ( func ) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var argsList = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')'));
    var result = argsList.match( ARGUMENT_NAMES );

    if(result === null) {
        return [];
    }
    else {
        var stripped = [];
        for ( var i = 0; i < result.length; i++  ) {
            stripped.push( result[i].replace(/[\s,]/g, '') );
        }
        return stripped;
    }
}

/**
 * Registers a selector for the current data object
 * @param {string} name
 * @param {function=} selector
 * @example
 //retrieve a user, register a selector for enabled and check if user is enabled or not
 var users = context.model('User');
 users.where('name').equal('admin@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        //register a selector to check whether a user is enabled or not
        user.selector('enabled', function(callback) {
            this.$$model.where('id').equal(this.id).select('enabled').value(callback);
        });
        user.is(":enabled").then(function(result) {
            if (result) {
                console.log('User is enabled');
            }
            done();
        }).catch(function(err) {
            done(null, err);
        });
    }).catch(function(err) {
        done(err);
    });
 */
DataObject.prototype.selector = function(name, selector) {
    /**
     * @private
     * @type {{}|*}
     */
    this.selectors = this.selectors || {};
    if (typeof name !== 'string') {
        return new Error('Invalid argument. String expected.', 'EARG');
    }
    if (typeof selector === 'undefined') {
        return this.selectors[name];
    }
    //get arguments
    this.selectors[name] = selector;
    return this;
};

/**
 * Executes a selector and returns the result. DataObject class has default selectors for common operations.
 * The ":new" selector checks whether current data object is new or not. The ":live" selector checks whether current data object already exists or not.
 * @param {string} selector - A string that represents an already registered selector
 * @returns {Promise<T>|*}
 * @example
 //retrieve a user, and execute :live selector
 var users = context.model('User');
 users.where('name').equal('admin@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        user.is(":live").then(function(result) {
            if (result) {
                console.log('User already exists');
            }
            done();
        }).catch(function(err) {
            done(null, err);
        });
    }).catch(function(err) {
        done(err);
    });
 */
DataObject.prototype.is = function(selector) {
    if (!/^:\w+$/.test(selector)) {
        throw new Error('Invalid selector. A valid selector should always start with : e.g. :new or :live.');
    }
    this.selectors = this.selectors || {};
    var fn = this.selectors[selector.substr(1)];
    if (typeof fn !== 'function') {
        throw new Error('The specified selector is no associated with this object.','EUNDEF');
    }
    var Q = require('q'), deferred = Q.defer();
    fn.call(this, function(err, result) {
        if (err) { return deferred.reject(err); }
        deferred.resolve(result);
    });
    return deferred.promise;
};

/**
 * Gets the type of this data object.
 * @returns {string}
 */
DataObject.prototype.getType = function() {
    return this.$$type;
};
/**
 * Gets the associated data model
 * @returns {DataModel|*}
 */
DataObject.prototype.getModel = function() {
    return this.$$model;
};

/**
 * Gets the identifier of this data object
 * @returns {*}
 * @deprecated This function is deprecated. Use DataObject.$$id property instead
 */
DataObject.prototype.idOf = function() {
    return this.$$id;
};

/**
 * @param name
 * @returns {DataObject}
 * @deprecated
 * @ignore
 */
DataObject.prototype.removeProperty = function(name) {
    var model = this.$$model, field = model.field(name);
    if (_.isNil(field)) {
        var er = new Error('The specified field cannot be found.'); er.code = 'EDATA';
        throw er;
    }
    //safe delete property
    delete this[name];
    return this;
};

/**
 * @param {String} name The relation name
 * @returns {DataQueryable|HasManyAssociation|HasOneAssociation|DataObjectJunction|DataObjectTag|HasParentJunction|{value:Function}}
 */
DataObject.prototype.property = function(name) {
    if (typeof name !== 'string')
        return null;
    var self = this, er;
    //validate relation based on the given name
    var model = self.$$model, field = model.field(name);
    if (_.isNil(field)) {
        er = new Error('The specified field cannot be found.'); er.code = 'EDATA';
        throw er;
    }
    var mapping = model.inferMapping(field.name);
    if (_.isNil(mapping)) {
        //return queryable field value
        return {
            value:function(callback) {
                //if object has already an attribute with this name
                if (self.hasOwnProperty(name)) {
                    //return attribute
                    return callback(null, self[name]);
                }
                else {
                    //otherwise get attribute value
                    if (self.hasOwnProperty(model.primaryKey)) {
                        model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).value(function(err, value) {
                            if (err) { return callback(err); }
                            callback(null, value);
                        });
                    }
                    else {
                        model.inferState(self, function(err, state) {
                            if (err) { return callback(err); }
                            if (state==2) {
                                model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).value(function(err, value) {
                                    if (err) { return callback(err); }
                                    callback(null, value);
                                });
                            }
                            else {
                                er = new Error('Object identity cannot be found due to missing primary key or unique constraint filter.'); er.code = 'EDATA';
                                callback(er);
                            }
                        });
                    }
                }
            }
        };
    }
    //validate field association
    if (mapping.associationType=='association') {
        if (mapping.parentModel==model.name)
            return new HasManyAssociation(self, mapping);
        else
            return new HasOneAssociation(self, mapping);
    }
    else if (mapping.associationType=='junction') {
        if (mapping.parentModel===model.name) {
            if (typeof mapping.childModel === 'undefined') {
                return new DataObjectTag(self, mapping);
            }
            else {
                return new DataObjectJunction(self, mapping);
            }
        }
        else {
            return new HasParentJunction(self, mapping);
        }
    }
    else {
        er = new Error('The association which is specified for the given field is not implemented.'); er.code = 'EDATA';
        throw er;
    }
};

/**
 * @param {string} name - The name of the attribute
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 * @private
 */
function attrOf_(name, callback) {
    var self = this, model = this.$$model,
        mapping = model.inferMapping(name);
    if (_.isNil(mapping)) {
        if (self.hasOwnProperty(name)) {
            return callback(null, self[name]);
        }
        else {
         return model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).value(function(err, result) {
                if (err) { return callback(err); }
                self[name] = result;
                return callback(null, result);
            });
        }
    }
    //if mapping association defines foreign key association
    if (mapping.associationType==='association' && mapping.childModel === model.name) {
        //if object has already this property
        if (self.hasOwnProperty(name)) {
            //if property is an object
            if (typeof self[name] === 'object' && self[name] != null) {
                //return the defined parent field
                callback(null, self[name][mapping.parentField]);
            }
            else if (self[name] == null) {
                callback();
            }
            else {
                callback(null, self[name]);
            }
        }
        else {
            //otherwise get value from db
            model.where(model.primaryKey).equal(this[model.primaryKey]).select(mapping.childField).flatten().value(function(err, result) {
                if (err) { return callback(err); }
                self[name] = result;
                return callback(null, result);
            });
        }
    }
    else {
        return callback();
    }

}

/**
 * Gets the value of the specified attribute.
 * If the object has already a property with the specified name and the property does not have
 * an association mapping then returns the property value.
 * Otherwise if attribute has an association mapping (it defines an association with another model) then
 * returns the foreign key value
 *
 * @param {string} name - The name of the attribute to retrieve
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 * @returns {Promise<T>|*} If callback is missing then returns a promise.
 */
DataObject.prototype.attrOf = function(name, callback) {
    var self = this;
    if (typeof callback !== 'function') {
        var Q = require('q'), deferred = Q.defer();
        attrOf_.call(self,  name, function(err, result) {
            if (err) { return deferred.reject(err); }
            deferred.resolve(result);
        });
        return deferred.promise;
    }
    else {
        return attrOf_.call(self, name, callback);
    }
};
/**
 * @param {String} name
 * @param {function(Error=,*=)} callback
 */
DataObject.prototype.attr = function(name, callback)
{
    if (this.hasOwnProperty(name)) {
        callback(null, this[name]);
    }
    else {
        var self = this, model = self.$$model, field = model.field(name);
        if (field) {
            var mapping = model.inferMapping(field.name);
            if (_.isNil(mapping)) {
                if (self[model.primaryKey]) {
                    model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).first(function(err, result) {
                        if (err) { callback(err); return; }
                        var value = null;
                        if (result) {
                            value = result[name];
                        }
                        self[name]=value;
                        callback(null, value);
                    });
                }
                else {
                    if (model.constraints.length==0) {
                        callback(new Error( sprintf.sprintf('The value of property [%s] cannot be retrieved. The target data model has no constraints defined.', name)));
                    }
                    else {
                        var arr = model.constraints.filter(function(x) {
                            var valid = true;
                            if (x.fields.length==0)
                                return false;
                            for (var i = 0; i < x.fields.length; i++) {
                                var field = x.fields[i];
                                if (self.hasOwnProperty(field)==false) {
                                    valid = false;
                                    break;
                                }
                            }
                            return valid;
                        });
                        if (arr.length==0) {
                            callback(new Error( sprintf.sprintf('The value of property [%s] cannot be retrieved. The target data model has constraints but the required properties are missing.', name)));
                        }
                        else {
                            //get first constraint
                            var constraint = arr[0], q = null;
                            for (var i = 0; i < constraint.fields.length; i++) {
                                var attr = constraint.fields[i];
                                var value = self[attr];
                                if (q==null)
                                    q = model.where(attr).equal(value);
                                else
                                    q.and(attr).equal(value);
                            }
                            q.select([name]).first(function(err, result) {
                                if (err) { callback(err); return; }
                                var value = null;
                                if (result) {
                                    value = result[name];
                                }
                                self[name]=value;
                                callback(null, value);
                            });
                        }
                    }
                }
            }
            else {
                callback(null, self.property(name));
            }
        }
        else {
            callback(new Error('The specified field cannot be found.'));
        }

    }
};

/**
 * Sets the context of this data object
 * @param {DataContext} value
 * @returns {DataObject}
 * @private
 * @deprecated This function is deprecated. Use DataObject.context property instead
 * @ignore
 */
DataObject.prototype.setContext = function(value) {
    this.context = value;
};
/**
 *
 * @param {DataContext} context The current data context
 * @param {Function} fn - A function that represents the code to be invoked
 * @ignore
 */
DataObject.prototype.execute = function(context, fn) {
    var self = this;
    self.setContext(context);
    fn = fn || function() {};
    fn.call(self);
};

/**
 * Gets a DataQueryable object that is going to be used in order to get related items.
 * @param attr {string} A string that contains the relation attribute
 * @returns {DataQueryable}
 */
DataObject.prototype.query = function(attr)
{
    var mapping = this.getModel().inferMapping(attr);
    if (_.isNil(mapping)) { new types.DataException('EASSOCIATION','The given attribute does not define an association of any type.'); }
    return this.property(attr)
};

/**
 * @param {DataContext} context - The underlying data context
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 * @private
 */
function save_(context, callback) {
    var self = this;
    //get current application
    var model = self.getModel();
    if (_.isNil(model)) {
        return callback.call(self, new types.DataException('EMODEL','Data model cannot be found.'));
    }
    var i;
    //register before listeners
    var beforeListeners = self.listeners('before.save');
    for (i = 0; i < beforeListeners.length; i++) {
        var beforeListener = beforeListeners[i];
        model.on('before.save', beforeListener);
    }
    //register after listeners
    var afterListeners = self.listeners('after.save');
    for (i = 0; i < afterListeners.length; i++) {
        var afterListener = afterListeners[i];
        model.on('after.save', afterListener);
    }
    model.save(self, callback);
}

/**
 * Saves the current data object.
 * @param {DataContext=}  context - The current data context.
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
 * @example
 //retrieve an order and change paymentDue date
 var orders = context.model('Order');
 orders.where('id').equal(46)
 .first().then(function(result) {
        var order = orders.convert(result);
        order.paymentDue = moment().add(7, 'days').toDate();
        order.save().then(function() {
            done(null, order);
        }).catch(function(err) {
            done(err);
        });
    }).catch(function(err) {
        done(err);
    });
 */
DataObject.prototype.save = function(context, callback) {
    var self = this;
    if (typeof callback !== 'function') {
        var Q = require('q'), deferred = Q.defer();
        save_.call(self, context || self.context, function(err) {
            if (err) { return deferred.reject(err); }
            deferred.resolve(null);
        });
        return deferred.promise;
    }
    else {
        return save_.call(self, context || self.context, callback);
    }
};
/**
 * @param {DataContext} context
 * @param {Function} callback
 * @private
 */
function remove_(context, callback) {
    var self = this;
    //get current application
    var model = self.getModel();
    if (_.isNil(model)) {
        return callback.call(self, new types.DataException('EMODEL','Data model cannot be found.'));
    }
    //register before listeners
    var beforeListeners = self.listeners('before.remove');
    for (var i = 0; i < beforeListeners.length; i++) {
        var beforeListener = beforeListeners[i];
        model.on('before.remove', beforeListener);
    }
    //register after listeners
    var afterListeners = self.listeners('after.remove');
    for (var j = 0; j < afterListeners.length; j++) {
        var afterListener = afterListeners[j];
        model.on('after.remove', afterListener);
    }
    model.remove(self, callback);
}

/**
 * Deletes the current data object.
 * @param {DataContext=} context - The current data context.
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
 * @example
 //retrieve a order, and remove it
 var orders = context.model('Order');
 orders.where('id').equal(4)
 .first().then(function(result) {
        var order = orders.convert(result);
        order.remove().then(function() {
            done();
        }).catch(function(err) {
            done(err);
        });
    }).catch(function(err) {
        done(err);
    });
 */
DataObject.prototype.remove = function(context, callback) {
    var self = this;
    if (typeof callback !== 'function') {
        var Q = require('q'), deferred = Q.defer();
        remove_.call(self, context || self.context, function(err) {
            if (err) { return deferred.reject(err); }
            deferred.resolve();
        });
        return deferred.promise;
    }
    else {
        return remove_.call(self, context || self.context, callback);
    }
};
/*
 * Gets an instance of a DataModel class which represents the additional model that has been set in additionalType attribute of this data object.
 * @returns {Promise<DataModel>}
 */
DataObject.prototype.getAdditionalModel = function() {
    var self = this;
    var Q = require('q'), deferred = Q.defer();
    process.nextTick(function() {
        try {
            var model = self.getModel();
            var attr = self.getModel().attributes.find(function(x) { return x.name === "additionalType"; });
            if (typeof attr === 'undefined') {
                return deferred.resolve();
            }
            var attrName = attr.property || attr.name;
            self.attr(attrName, function(err, additionalType) {
                try {
                    if (err) {
                        return deferred.reject(err);
                    }
                    //if additional type is undefined
                    if (_.isNil(additionalType)) {
                        //return nothing
                        return deferred.resolve();
                    }
                    //if additional type is equal to current model
                    if (additionalType === model.name) {
                        //return nothing
                        return deferred.resolve(model);
                    }
                    return deferred.resolve(self.context.model(additionalType));
                }
                catch(e) {
                    return deferred.reject(e);
                }
            });
        }
        catch(e) {
            return deferred.reject(e);
        }
    });
    return deferred.promise;
};

/**
 * Gets an instance of data object which represents the additional typed object as this is defined in additionalType attribute.
 * @returns {Promise<DataObject>}
 * @example
 //get a place and afterwards get the country associated with it
 var places = context.model("Place");
 places.silent().where("name").equal("France").first().then(function(result) {
    if (result) {
        var place = places.convert(result);
        return place.getAdditionalObject().then(function(result) {
            //place your code here
            return done();
        });
    }
    return done();
}).catch(function (err) {
    return done(err);
});
 */
DataObject.prototype.getAdditionalObject = function() {
    var self = this;
    var Q = require('q'), deferred = Q.defer();
    process.nextTick(function() {
        try {
            self.getAdditionalModel().then(function(additionalModel) {
                try {
                    if (_.isNil(additionalModel)) {
                        return deferred.resolve();
                    }
                    //if additional type is equal to current model
                    if (additionalModel.name === self.getModel().name) {
                        //return nothing
                        return deferred.resolve();
                    }
                    if (self.getModel().$silent) { additionalModel.silent(); }
                    additionalModel.where(self.getModel().getPrimaryKey()).equal(self.getId()).first().then(function(result) {
                        if (result) {
                            return deferred.resolve(additionalModel.convert(result));
                        }
                        return deferred.resolve();
                    }).catch(function(err) {
                        return deferred.reject(err);
                    });
                }
                catch(e) {
                    return deferred.reject(e);
                }
            }).catch(function(err) {
                return deferred.reject(err);
            });
        }
        catch (e) {
            return deferred.reject(e);
        }

    });
    return deferred.promise;
};
/**
 * Sets a boolean which indicates whether the next data operation will be executed in silent mode.
 * @param {boolean=} value
 * @returns DataObject
 * @example
 context.model("Person").where("email").equal("alexis.rees@example.com").getTypedItem()
        .then(function(person) {
            //...
            return person.silent().save().then(function() {
                return done();
            });
        }).catch(function(err) {
            return done(err);
        });
 */
DataObject.prototype.silent = function(value) {
    this.getModel().silent(value);
    return this;
};

module.exports.DataObject = DataObject;