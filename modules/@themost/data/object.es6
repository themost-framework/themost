/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import _ from 'lodash';
import sprintf from 'sprintf';
import {SequentialEventEmitter} from "@themost/common/emitter";
import {DataError} from "@themost/common/errors";
import {HasManyToOneAssociation, HasOneToManyAssociation, HasManyToManyAssociation, HasTagAssociation} from './associations';

/**
 * @ignore
 */
const STR_MISSING_CALLBACK_ARGUMENT = 'Missing argument. Callback function expected.',
    STR_MISSING_ARGUMENT_CODE = 'EARGM';

const typeProperty = Symbol('type');
const modelProperty = Symbol('model');
const contextProperty = Symbol('context');
const selectorsProperty = Symbol('selectors');

/**
 * @class
 * @classdesc Represents a data object associated with a data model.
 * DataObject class may be inherited by other classes that are defined as DataObjectClass of a data model.
 * @augments SequentialEventEmitter
 * @property {DataContext}  context - An instance of DataContext class associated with this object.
 * @property {*} selectors - An object that represents a collection of selectors associated with this data object e.g is(':new'), is(':valid'), is(':enabled') etc
 */
export class DataObject extends SequentialEventEmitter {
    /**
     *
     * @param {string=} type
     * @param {*=} obj
     */
    constructor(type, obj) {
        super();
        //initialize object type
        if (type) {
            this[typeProperty] = type;
        }
        else {
            //get type from constructor name
            if (/Model$/.test(this.constructor.name)) {
                this[typeProperty] = this.constructor.name.replace(/Model$/,'');
            }
            else {
                if (this.constructor.name!=='DataObject')
                    this[typeProperty] = this.constructor.name;
            }
        }
        this[selectorsProperty] = { };

        this.selector('new', function(callback) {
            if (typeof callback !== 'function') { return new Error(STR_MISSING_CALLBACK_ARGUMENT, STR_MISSING_ARGUMENT_CODE); }
            const self = this, model = self.getModel();
            model.inferState(self, function(err, state) {
                if (err) { return callback(err); }
                callback(null, (state===1));
            });
        }).selector('live', function(callback) {
            if (typeof callback !== 'function') { return new Error(STR_MISSING_CALLBACK_ARGUMENT, STR_MISSING_ARGUMENT_CODE); }
            const self = this, model = self.getModel();
            model.inferState(self, function(err, state) {
                if (err) { return callback(err); }
                callback(null, (state===2));
            });
        });

        if (typeof obj !== 'undefined' && obj !== null) {
            _.assign(this, obj);
        }

    }

    /**
     * Gets the identifier of this DataObject instance.
     * @returns {*}
     */
    getId() {
        const model = this.getModel();
        if (_.isNil(model)) {
            return this['id'];
        }
        return this[model.getPrimaryKey()];
    }

    /**
     * @returns {DataContext|*}
     */
    get context() {
        return this[contextProperty]; 
    }

    /**
     * 
     * @param {DataContext|*} value
     */
    set context(value) {
        this[contextProperty] = value;
    }
    
    /**
     * Gets the current context
     * @returns {DataContext|*}
     */
    getContext() {
        return this[contextProperty];
    }

    /**
     * Gets the object type, typically the name of the parent model
     * @returns {*}
     */
    getType() {
        return this[typeProperty];
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
                this.getModel().where('id').equal(this.id).select('enabled').value(callback);
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
    selector(name, selector) {
        if (typeof name !== 'string') {
            return new Error('Invalid argument. String expected.', 'EARG');
        }
        if (typeof selector === 'undefined') {
            return this[selectorsProperty][name];
        }
        //get arguments
        this[selectorsProperty][name] = selector;
        return this;
    }

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
    is(selector) {
        if (!/^:\w+$/.test(selector)) {
            throw new Error('Invalid selector. A valid selector should always start with : e.g. :new or :live.');
        }
        /**
         * @type {Function}
         */
        const selectorFunc = this[selectorsProperty][selector.substr(1)];
        if (typeof selectorFunc !== 'function') {
            throw new Error('The specified selector is no associated with this object.','EUNDEF');
        }
        const Q = require('q'), deferred = Q.defer();
        selectorFunc.call(this, function(err, result) {
            if (err) { return deferred.reject(err); }
            deferred.resolve(result);
        });
        return deferred.promise;
    }


    /**
     * Gets the associated data model
     * @returns {DataModel|undefined}
     */
    getModel() {
        if (_.isNil(this.getType()))
            return;
        if (this[modelProperty]) { return this[modelProperty]; }
        if (this.getContext()) {
            this[modelProperty] = this.getContext().model(this.getType());
        }
        return this[modelProperty];
    }

    /**
     * @param name
     * @returns {DataObject}
     * @deprecated
     * @ignore
     */
    removeProperty(name) {
        const model = this.getModel(), field = model.field(name);
        if (_.isNil(field)) {
            const er = new Error('The specified field cannot be found.'); er.code = 'EDATA';
            throw er;
        }
        //safe delete property
        delete this[name];
        return this;
    }

    /**
     * @param {String} name The relation name
     * @returns {DataQueryable|HasAssociation|{value:Function}}
     */
    property(name) {
        if (typeof name !== 'string')
            return null;
        const self = this;
        let er;
        //validate relation based on the given name
        const model = self.getModel(), field = model.field(name);
        if (_.isNil(field)) {
            er = new Error('The specified field cannot be found.'); er.code = 'EDATA';
            throw er;
        }
        const mapping = model.inferMapping(field.name);
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
                                if (state===2) {
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
        if (mapping.associationType==='association') {
            if (mapping.parentModel===model.name)
                return new HasOneToManyAssociation(self, mapping);
            else
                return new HasManyToOneAssociation(self, mapping);
        }
        else if (mapping.associationType==='junction') {
            if (mapping.parentModel===model.name) {
                if (typeof mapping.childModel === 'undefined') {
                    return new HasTagAssociation(self, mapping);
                }
                else {
                    return new HasManyToManyAssociation(self, mapping);
                }
            }
            else {
                return new HasManyToManyAssociation(self, mapping);
            }
        }
        else {
            er = new Error('The association which is specified for the given field is not implemented.'); er.code = 'EDATA';
            throw er;
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
    attrOf(name, callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            attrOf_.call(self,  name, function(err, result) {
                if (err) { return deferred.reject(err); }
                deferred.resolve(result);
            });
            return deferred.promise;
        }
        else {
            return attrOf_.call(self, name, callback);
        }
    }

    /**
     * @param {String} name
     * @param {Function} callback
     */
    attr(name, callback) {
        if (this.hasOwnProperty(name)) {
            callback(null, this[name]);
        }
        else {
            const self = this, model = self.getModel(), field = model.field(name);
            if (field) {
                const mapping = model.inferMapping(field.name);
                if (_.isNil(mapping)) {
                    if (self[model.primaryKey]) {
                        model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).first(function(err, result) {
                            if (err) { callback(err); return; }
                            let value = null;
                            if (result) {
                                value = result[name];
                            }
                            self[name]=value;
                            callback(null, value);
                        });
                    }
                    else {
                        if (model.constraints.length===0) {
                            callback(new Error(sprintf.sprintf('The value of property [%s] cannot be retrieved. The target data model has no constraints defined.', name)));
                        }
                        else {
                            const arr = _.filter(model.constraints, function(x) {
                                let valid = true;
                                if (x.fields.length===0)
                                    return false;
                                for (let i = 0; i < x.fields.length; i++) {
                                    const field = x.fields[i];
                                    if (self.hasOwnProperty(field)===false) {
                                        valid = false;
                                        break;
                                    }
                                }
                                return valid;
                            });
                            if (arr.length===0) {
                                callback(new Error( sprintf.sprintf('The value of property [%s] cannot be retrieved. The target data model has constraints but the required properties are missing.', name)));
                            }
                            else {
                                //get first constraint
                                const constraint = arr[0];

                                let q = null;
                                for (let i = 0; i < constraint.fields.length; i++) {
                                    const attr = constraint.fields[i];
                                    const value = self[attr];
                                    if (_.isNil(q))
                                        q = model.where(attr).equal(value);
                                    else
                                        q.and(attr).equal(value);
                                }
                                q.select(name).first(function(err, result) {
                                    if (err) { callback(err); return; }
                                    let value = null;
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
    }

    /**
     *
     * @param {DataContext} context The current data context
     * @param {Function} fn - A function that represents the code to be invoked
     * @ignore
     */
    execute(context, fn) {
        const self = this;
        self.context = context;
        fn = fn || function() {};
        fn.call(self);
    }

    /**
     * Gets a DataQueryable object that is going to be used in order to get related items.
     * @param attr {string} A string that contains the relation attribute
     * @returns {DataQueryable}
     */
    query(attr) {
        const mapping = this.getModel().inferMapping(attr);
        if (_.isNil(mapping)) { new DataError('EASSOCIATION','The given attribute does not define an association of any type.'); }
        return this.property(attr)
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
    save(context, callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            save_.call(self, context || self.context, function(err) {
                if (err) { return deferred.reject(err); }
                deferred.resolve(null);
            });
            return deferred.promise;
        }
        else {
            return save_.call(self, context || self.context, callback);
        }
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
    remove(context, callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            remove_.call(self, context || self.context, function(err) {
                if (err) { return deferred.reject(err); }
                deferred.resolve();
            });
            return deferred.promise;
        }
        else {
            return remove_.call(self, context || self.context, callback);
        }
    }

    /*
     * Gets an instance of a DataModel class which represents the additional model that has been set in additionalType attribute of this data object.
     * @returns {Promise<DataModel>}
     */
    getAdditionalModel() {
        const self = this;
        const Q = require('q'), deferred = Q.defer();
        process.nextTick(function() {
            try {
                const model = self.getModel();
                const attr = self.getModel().attributes.find(function(x) { return x.name === "additionalType"; });
                if (typeof attr === 'undefined') {
                    return deferred.resolve();
                }
                const attrName = attr.property || attr.name;
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
    }

    /**
     * Gets an instance of data object which represents the additional typed object as this is defined in additionalType attribute.
     * @returns {Promise<DataObject>|*}
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
    getAdditionalObject() {
        const self = this;
        const Q = require('q'), deferred = Q.defer();
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
                        additionalModel.where(self.getModel().getPrimaryKey()).equal(self.getId()).first().then((result) => {
                            if (result) {
                                return deferred.resolve(additionalModel.convert(result));
                            }
                            return deferred.resolve();
                        }).catch((err)=> {
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
    }

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
    silent(value) {
        this.getModel().silent(value);
        return this;
    }
}

/**
 * @memberOf DataObject
 * @function
 * @param {string} name - The name of the attribute
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 * @private
 */
function attrOf_(name, callback) {
    const self = this, model = this.getModel(), mapping = model.inferMapping(name);
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
            if (typeof self[name] === 'object' && self[name] !== null) {
                //return the defined parent field
                callback(null, self[name][mapping.parentField]);
            }
            else if (self[name] === null) {
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
 * @memberOf DataObject
 * @function
 * @param {DataContext} context - The underlying data context
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 * @private
 */
function save_(context, callback) {
    const self = this;
    //get current application
    const model = self.getModel();
    if (_.isNil(model)) {
        return callback.call(self, new DataError('EMODEL','Data model cannot be found.'));
    }
    let i;
    //register before listeners
    const beforeListeners = self.listeners('before.save');
    for (i = 0; i < beforeListeners.length; i++) {
        const beforeListener = beforeListeners[i];
        model.once('before.save', beforeListener);
    }
    //register after listeners
    const afterListeners = self.listeners('after.save');
    for (i = 0; i < afterListeners.length; i++) {
        const afterListener = afterListeners[i];
        model.once('after.save', afterListener);
    }
    model.save(self, callback);
}

/**
 * @memberOf DataObject
 * @function
 * @param {DataContext} context
 * @param {Function} callback
 * @private
 */
function remove_(context, callback) {
    const self = this;
    //get current application
    const model = self.getModel();
    if (_.isNil(model)) {
        return callback.call(self, new DataError('EMODEL','Data model cannot be found.'));
    }
    //register before listeners
    const beforeListeners = self.listeners('before.remove');
    for (let i = 0; i < beforeListeners.length; i++) {
        const beforeListener = beforeListeners[i];
        model.once('before.remove', beforeListener);
    }
    //register after listeners
    const afterListeners = self.listeners('after.remove');
    for (let j = 0; j < afterListeners.length; j++) {
        const afterListener = afterListeners[j];
        model.once('after.remove', afterListener);
    }
    model.remove(self, callback);
}
