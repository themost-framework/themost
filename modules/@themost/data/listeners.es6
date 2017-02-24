/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import {ParserUtils} from './types';
import sprintf from 'sprintf';
import async from 'async';
import moment from 'moment';
import {_} from 'lodash';
import Q from 'q';
import {TraceUtils} from "@themost/common/utils";
import {NotNullError,UniqueConstraintError} from '@themost/common/errors';



/**
 * @classdesc Represents an event listener for validating not nullable fields. This listener is automatically  registered in all data models.
 * @class
 */
export class NotNullConstraintListener {
    /**
     * Occurs before creating or updating a data object and validates not nullable fields.
     * @param {DataEventArgs|*} e - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(e, callback) {

        //find all attributes that have not null flag
        const attrs = e.model.attributes.filter(
            function(x) {
                return !x.primary && !(typeof x.nullable === 'undefined' ? true: x.nullable);
            });
        if (attrs.length==0) {
            callback(null);
            return 0;
        }
        async.eachSeries(attrs, function(attr, cb)
        {
            const name = attr.property || attr.name, value = e.target[name];
            if ((((value == null) || (value===undefined))  && (e.state==1))
                || ((value == null) && (typeof value!=='undefined') && (e.state == 2)))
            {
                const er = new NotNullError('A value is required.', null, e.model.name, attr.name);
                if (process.env.NODE_ENV==='development') { TraceUtils.log(er); }
                return cb(er);
            }
            else
                cb(null);
        }, function(err) {
            callback(err);
        });
    }
}

/**
 * @class
 * @classdesc Represents an event listener for validating data model's unique constraints. This listener is automatically registered in all data models.
 */
export class UniqueContraintListener {
    /**
     * Occurs before creating or updating a data object and validates the unique constraints of data model.
     * @param {DataEventArgs|*} e - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(e, callback) {

        //there are no constraints
        if (e.model.constraints==null)
        {
            //do nothing
            callback(null);
            return;
        }
        //get unique constraints
        const constraints = e.model.constraints.filter(function(x) {
            return (x.type=='unique');
        });
        if (constraints.length==0) {
            //do nothing
            callback(null);
            return;
        }
        async.eachSeries(constraints, function(constraint, cb)
        {
            /**
             * @type {DataQueryable}
             */
            let q;
            //build query
            for (let i = 0; i < constraint.fields.length; i++) {
                const attr = constraint.fields[i];
                let value = e.target[attr];
                if (typeof value === 'undefined') {
                    cb(null);
                    return;
                }
                //check field mapping
                const mapping = e.model.inferMapping(attr);
                if (typeof mapping !== 'undefined' && mapping !== null) {
                    if (typeof e.target[attr] === 'object') {
                        value=e.target[attr][mapping.parentField];
                    }
                }
                if (typeof value=== 'undefined')
                    value = null;
                if (q) {
                    q.and(attr).equal(value);
                }
                else {
                    q = e.model.where(attr).equal(value);
                }
            }
            if (typeof q === 'undefined')
                cb(null);
            else {
                q.silent().select(e.model.primaryKey).first(function(err, result) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    if (!result) {
                        //object does not exist
                        cb(null);
                    }
                    else {
                        let objectExists = true;
                        if (e.state==2) {
                            //validate object id (check if target object is the same with the returned object)
                            objectExists = (result[e.model.primaryKey]!= e.target[e.model.primaryKey]);
                        }
                        //if object already exists
                        if (objectExists) {
                            let er;
                            //so throw exception
                            if (constraint.description) {
                                er = new UniqueConstraintError(constraint.description, null, e.model.name);
                            }
                            else {
                                er = new UniqueConstraintError("Object already exists. A unique constraint violated.", null, e.model.name);
                            }
                            if (process.env.NODE_ENV==='development') { TraceUtils.log(er); }
                            return cb(er);
                        }
                        else {
                            return cb();
                        }
                    }
                });
            }
        }, function(err) {
            callback(err);
        });
    }
}

/**
 * @class
 * @classdesc Represents an event listener which calculates field values. This listener is being registered for all data models.
 <p>
 A data field may have a calculation attribute.
 An instance of <a href="FunctionContext.html">FunctionContext</a> class will calculate this value by evaluating the expression provided.
 <pre class="prettyprint"><code>
 {
        "name": "modifiedBy",
        "title": "Modified By",
        "description": "Modified by user.",
        "type": "User",
        "calculation":"javascript:return this.user();"
    }
 </code></pre>
 <p>In the previous example modifiedBy field has a calculation for setting the user which performs the update operation.</p>
<p><strong>Note:</strong>FunctionContext class may be extended in order to allow applications to perform value calculations.</p>
 <pre class="prettyprint"><code>
    FunctionContext.prototype.myColor = function() {
        var deferred = Q.defer(),
            self = this;
        process.nextTick(function() {
            return self.context.model("UserColor")
                .where("user/name").equal(self.context.user.name)
                .select("color")
                .value().then(function(value) {
                    deferred.resolve(value);
                }).catch(function(err) {
                    deferred.reject(err);
                });
        });
        return deferred.promise;
    }
 </code></pre>
 <pre class="prettyprint"><code>
 {
        "name": "color",
        "title": "Color",
        "type": "Text",
        "calculation":"javascript:return this.myColor();"
    }
 </code></pre>
 <p>In this example a custom method of FunctionContext class gets the user's favourite color.</p>
 <p>This calculation may also be performed by setting the following promise expression:</p>
 <pre class="prettyprint"><code>
 {
        "name": "color",
        "title": "Color",
        "type": "Text",
        "calculation":"javascript:return this.context.model('UserColor').where('user/name').equal(this.context.user.name).select('color').value();"
    }
 </code></pre>
 </p>
 */
export class CalculatedValueListener {
    /**
     * Occurs before creating or updating a data object and calculates field values with the defined calculation expression.
     * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(e, callback) {
        //get function context
        const functions = require('./functions'), functionContext = functions.createContext();
        _.assign(functionContext, e);
        functionContext.context = e.model.context;
        //find all attributes that have a default value
        const attrs = e.model.attributes.filter(function(x) { return (x.calculation!==undefined); });
        async.eachSeries(attrs, function(attr, cb) {
            const expr = attr.calculation;
            //validate expression
            if (typeof expr !== 'string') {
                e.target[attr.name] = expr;
                return cb();
            }
            //check javascript: keyword for code evaluation
            if (expr.indexOf('javascript:')==0) {
                //get expression
                let fnstr = expr.substring('javascript:'.length);
                //if expression starts with function add parenthesis (fo evaluation)
                if (fnstr.indexOf('function')==0) {
                    fnstr = '('.concat(fnstr,')');
                }
                //if expression starts with return then normalize expression (surround with function() {} keyword)
                else if (fnstr.indexOf('return')==0) {
                    fnstr = '(function() { '.concat(fnstr,'})');
                }
                const value = eval(fnstr);
                //if value is function
                if (typeof value === 'function') {
                    //then call function against the target object
                    const value1 = value.call(functionContext);
                    if (typeof value1 !== 'undefined' && value1 !=null && typeof value1.then === 'function') {
                        //we have a promise, so we need to wait for answer
                        value1.then(function(result) {
                            //otherwise set result
                            e.target[attr.name] = result;
                            return cb();
                        }).catch(function(err) {
                            cb(err);
                        });
                    }
                    else {
                        e.target[attr.name] = value1;
                        return cb();
                    }
                }
                else if (typeof value !== 'undefined' && value !=null && typeof value.then === 'function') {
                    //we have a promise, so we need to wait for answer
                    value.then(function(result) {
                        //otherwise set result
                        e.target[attr.name] = result;
                        return cb();
                    }).catch(function(err) {
                        cb(err);
                    });
                }
                else {
                    //otherwise get value
                    e.target[attr.name] = value;
                    return cb();
                }
            }
            else if (expr.indexOf('fn:')==0) {
               return cb(new Error ('fn: syntax is deprecated.'));
            }
            else {
                functionContext.eval(expr, function(err, result) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        e.target[attr.name] = result;
                        cb(null);
                    }
                });
            }

        }, function(err) {
            callback(err);
        });
    }
}

/**
 * @classdesc Represents a data caching listener which is going to be used while executing queries against
 * data models where data caching is enabled. This listener is registered by default.
 <p>
      Data caching may be disabled when <a href="DataModel.html">DataModel</a>.caching property is set to 'none'. This is the default behaviour of a data model.
 </p>
 <pre class="prettyprint"><code>
 {
     "name": "Order", ... , "caching":"none"
     ...
 }
 </code></pre>
 <p>
 Data caching may be used when <a href="DataModel.html">DataModel</a>.caching property is set to 'always'.
 </p>
 <pre class="prettyprint"><code>
 {
     "name": "OrderStatus", ... , "caching":"always"
     ...
 }
 </code></pre>
 <p>
 Data caching may be conditionally enabled when <a href="DataModel.html">DataModel</a>.caching property is set to 'conditional'.
 </p>
 <pre class="prettyprint"><code>
 {
     "name": "Product", ... , "caching":"conditional"
     ...
 }
 </code></pre>
 <p>
 In this case, data caching will be used when an instance of <a href="DataQueryable.html">DataQueryable</a> class requests data with cache equal to true:
 </p>
 <pre class="prettyprint"><code>
    context.model('Product')
            .where('category').is('Laptops')
            .cache(true)
            .orderBy('name')
            .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
 </code></pre>
 * @class
 */
export class DataCachingListener {
    /**
     * Occurs before executing an query expression, validates data caching configuration and gets cached data.
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeExecute(event, callback) {
        try {
            const cache = require('./data-cache');
            if (_.isNil(event)) {
                return callback();
            }
            //validate caching
            const caching = (event.model.caching==='always' || event.model.caching==='conditional');
            if (!caching) { return callback(); }
            //validate conditional caching
            if (event.model.caching==='conditional') {
                if (event.emitter && typeof event.emitter.data == 'function') {
                    if (!event.emitter.data('cache')) {
                        return callback();
                    }
                }
            }
            if (event.query && event.query.$select) {
                //create hash
                let hash;
                if (event.emitter && typeof event.emitter.toMD5 === 'function') {
                    //get hash from emitter (DataQueryable)
                    hash = event.emitter.toMD5();
                }
                else {
                    //else calculate hash
                    hash = dataCommon.md5({ query: event.query });
                }
                //format cache key
                const key = '/' + event.model.name + '/?query=' + hash;
                //calculate execution time (debug)
                const logTime = new Date().getTime();
                //query cache
                cache.current.get(key, function(err, result) {
                    if (err) {
                        TraceUtils.log('DataCacheListener: An error occured while trying to get cached data.');
                        TraceUtils.log(err);
                    }
                    if (typeof result !== 'undefined') {
                        //delete expandables
                        if (event.emitter) {
                            delete event.emitter.$expand;
                        }
                        //set cached flag
                        event['cached'] = true;
                        //set execution default
                        event['result'] = result;
                        //log execution time (debug)
                        try {
                            if (process.env.NODE_ENV==='development') {
                                TraceUtils.log(sprintf.sprintf('Cache (Execution Time:%sms):%s', (new Date()).getTime()-logTime, key));
                            }
                        }
                        catch(err) { }
                        //exit
                        return callback();
                    }
                    else {
                        //do nothing and exit
                        return callback();
                    }
                });
            }
            else {
                return callback();
            }
        }
        catch (err) {
            return callback(err);
        }
    }

    /**
     * Occurs before executing an query expression, validates data caching configuration and stores data to cache.
     * @param {DataEventArgs|*} e - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    afterExecute(event, callback) {
        try {
            const cache = require('./data-cache');
            //validate caching
            const caching = (event.model.caching==='always' || event.model.caching==='conditional');
            if (!caching) { return callback(); }
            //validate conditional caching
            if (event.model.caching==='conditional') {
                if (event.emitter && typeof event.emitter.data == 'function') {
                    if (!event.emitter.data('cache')) {
                        return callback();
                    }
                }
            }
            if (event.query && event.query.$select) {
                if (typeof event.result !== 'undefined' && !event.cached) {
                    //create hash
                    let hash;
                    if (event.emitter && typeof event.emitter.toMD5 === 'function') {
                        //get hash from emitter (DataQueryable)
                        hash = event.emitter.toMD5();
                    }
                    else {
                        //else calculate hash
                        hash = dataCommon.md5({ query: event.query });
                    }
                    const key = '/' + event.model.name + '/?query=' + hash;
                    if (process.env.NODE_ENV==='development') {
                        TraceUtils.debug('DataCacheListener: Setting data to cache [' + key + ']');
                    }
                    cache.current.add(key, event.result);
                    return callback();
                }
            }
            return callback();
        }
        catch(err) {
            return callback(err);
        }
    }
}

/**
 * @class
 * @classdesc Represents an event listener for calculating default values.
 * DefaultValueListener is one of the default listeners which are being registered for all data models.
 <p>
 A data field may have a default value attribute.
 An instance of <a href="FunctionContext.html">FunctionContext</a> class will calculate this value by evaluating the expression provided.
 The default value listener will process all fields of an inserted data object which have a default value expression and does not have a defined value.
 <pre class="prettyprint"><code>
 {
        "name": "createdBy",
        "title": "Created By",
        "type": "User",
        "value":"javascript:return this.user();",
        "readonly":true
    }
 </code></pre>
 <p></p>
 <p><strong>Note:</strong> FunctionContext class may be extended in order to allow applications to perform value calculations.</p>
 </p>
 */
export class DefaultValueListener {
    /**
     * Occurs before creating or updating a data object and calculates default values with the defined value expression.
     * @param {DataEventArgs|*} e - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(e, callback) {

        const state = e.state!==undefined ? e.state : 0;
        if (state!=1)
        {
            callback(null);
        }
        else {
            //get function context
            const functions = require('./functions'), functionContext = functions.createContext();
            _.assign(functionContext, e);
            //find all attributes that have a default value
            const attrs = e.model.attributes.filter(function(x) { return (x.value!==undefined); });
            async.eachSeries(attrs, function(attr, cb) {
                const expr = attr.value;
                //if attribute is already defined
                if (typeof e.target[attr.name] !== 'undefined') {
                    //do nothing
                    cb(null);
                    return;
                }
                //validate expression
                if (typeof expr !== 'string') {
                    e.target[attr.name] = expr;
                    return cb();
                }
                //check javascript: keyword for code evaluation
                if (expr.indexOf('javascript:')==0) {
                    //get expression
                    let fnstr = expr.substring('javascript:'.length);
                    //if expression starts with function add parenthesis (fo evaluation)
                    if (fnstr.indexOf('function')==0) {
                        fnstr = '('.concat(fnstr,')');
                    }
                    //if expression starts with return then normalize expression (surround with function() {} keyword)
                    else if (fnstr.indexOf('return')==0) {
                        fnstr = '(function() { '.concat(fnstr,'})');
                    }
                    const value = eval(fnstr);
                    //if value is function
                    if (typeof value === 'function') {
                        //then call function against the target object
                        const value1 = value.call(functionContext);
                        if (typeof value1 !== 'undefined' && value1 !=null && typeof value1.then === 'function') {
                            //we have a promise, so we need to wait for answer
                            value1.then(function(result) {
                                //otherwise set result
                                e.target[attr.name] = result;
                                return cb();
                            }).catch(function(err) {
                                cb(err);
                            });
                        }
                        else {
                            e.target[attr.name] = value1;
                            return cb();
                        }
                    }
                    else if (typeof value !== 'undefined' && value !=null && typeof value.then === 'function') {
                        //we have a promise, so we need to wait for answer
                        value.then(function(result) {
                            //otherwise set result
                            e.target[attr.name] = result;
                            return cb();
                        }).catch(function(err) {
                           cb(err);
                        });
                    }
                    else {
                        //otherwise get value
                        e.target[attr.name] = value;
                        return cb();
                    }
                }
                else if (expr.indexOf('fn:')==0) {
                    return cb(new Error ('fn: syntax is deprecated.'));
                }
                else  {

                    functionContext.eval(expr, function(err, result) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            e.target[attr.name] = result;
                            cb(null);
                        }
                    });
                }

            }, function(err) {
                callback(err);
            });
        }
    }
}

/**
 * @class
 */
export class DataModelCreateViewListener {
    /**
     * Occurs after upgrading a data model.
     * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    afterUpgrade(event, callback) {

        const self = event.model, qry = require("most-query"), db = self.context.db;
        const view = self.viewAdapter, adapter = self.sourceAdapter;
        //if data model is a sealed model do nothing anb exit
        if (self.sealed) { return callback(); }
        //if view adapter is the same with source adapter do nothing and exit
        if (view===adapter) { return callback(); }
        const baseModel = self.base();
        //get array of fields
        const fields = self.attributes.filter(function(x) {
            return (self.name== x.model) && (!x.many);
        }).map(function(x) {
            return qry.fields.select(x.name).from(adapter);
        });
        /**
         * @type {QueryExpression}
         */
        const q = qry.query(adapter).select(fields);
        //get base adapter
        const baseAdapter = (baseModel!=null) ? baseModel.name.concat('Data') : null, baseFields = [];
        //enumerate columns of base model (if any)
        if (_.isObject(baseModel)) {
            baseModel.attributes.forEach(function(x) {
                //get all fields (except primary and one-to-many relations)
                if ((!x.primary) && (!x.many))
                    baseFields.push(qry.fields.select(x.name).from(baseAdapter))
            });
        }
        if (baseFields.length>0)
        {
            const from = qry.createField(adapter, self.key().name), to = qry.createField(baseAdapter, self.base().key().name);
            q.$expand = { $entity: { },$with:[] };
            q.$expand.$entity[baseAdapter]=baseFields;
            q.$expand.$with.push(from);
            q.$expand.$with.push(to);
        }
        //execute query
        return db.createView(view, q, function(err) {
            callback(err);
        });
    }
}

/**
 * @class
 */
export class DataModelSeedListener {
    /**
     * Occurs after upgrading a data model.
     * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    afterUpgrade(event, callback) {
        const self = event.model;
        try {
            /**
             * Gets items to be seeded
             * @type {Array}
             */
            const items = self['seed'];
            //if model has an array of items to be seeded
            if (_.isArray(items)) {
                if (items.length==0) {
                    //if seed array is empty exit
                    return callback();
                }
                //try to insert items if model does not have any record
                self.asQueryable().silent().flatten().count(function(err, count) {
                    if (err) {
                        callback(err); return;
                    }
                    //if model has no data
                    if (count==0) {
                        //set items state to new
                        items.forEach(function(x) { x.$state=1; });
                        self.silent().save(items, callback);
                    }
                    else {
                        //model was already seeded
                        return callback();
                    }
                });
            }
            else {
                //do nothing and exit
                return callback();
            }
        }
        catch (e) {
            callback(e);
        }
    }
}

/**
 * @class
 */
export class DataModelSubTypesListener {
    /**
     * Occurs after upgrading a data model.
     * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    afterUpgrade(event, callback) {
        const self = event.model, context = event.model.context;
        try {
            self.getSubTypes().then(function(result) {
                if (result.length==0) { return callback(); }
                //enumerate sub types
                async.eachSeries(result, function(name, cb) {
                    //get model
                    const model = context.model(name);
                    if (_.isNil(model)) { return cb(); }
                    //if model is sealed do nothing
                    if (model.sealed) { return cb(); }
                    //create event arguments
                    const ev = { model:model };
                    //execute create view listener
                    DataModelCreateViewListener.prototype.afterUpgrade(ev, cb);
                }, function(err) {
                    return callback(err);
                });
            }).catch(function(err) {
                return callback(err);
            });
        }
        catch (e) {
            callback(e);
        }
    }
}