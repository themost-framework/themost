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
import 'source-map-support/register';
import {ParserUtils} from './types';
import sprintf from 'sprintf';
import async from 'async';
import moment from 'moment';
import {_} from 'lodash';
import Q from 'q';
import {TraceUtils, TextUtils} from "@themost/common/utils";
import {NotNullError,UniqueConstraintError,DataError} from '@themost/common/errors';
import {QueryField, QueryExpression} from "@themost/query/query";
import {FunctionContext} from './functions';


/**
 * @classdesc Represents an event listener for validating not nullable fields. This listener is automatically  registered in all data models.
 * @class
 */
export class NotNullConstraintListener {
    /**
     * Occurs before creating or updating a data object and validates not nullable fields.
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(event, callback) {

        //find all attributes that have not null flag
        const attrs = event.model.attributes.filter(
            function(x) {
                return !x.primary && !(typeof x.nullable === 'undefined' ? true: x.nullable);
            });
        if (attrs.length==0) {
            callback(null);
            return 0;
        }
        async.eachSeries(attrs, function(attr, cb)
        {
            const name = attr.property || attr.name, value = event.target[name];
            if ((((value == null) || (value===undefined))  && (event.state==1))
                || ((value == null) && (typeof value!=='undefined') && (event.state == 2)))
            {
                const er = new NotNullError('A value is required.', null, event.model.name, attr.name);
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
export class UniqueConstraintListener {
    /**
     * Occurs before creating or updating a data object and validates the unique constraints of data model.
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(event, callback) {

        //there are no constraints
        if (event.model.constraints==null)
        {
            //do nothing
            callback(null);
            return;
        }
        //get unique constraints
        const constraints = _.filter(event.model.constraints, function(x) {
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
                let value = event.target[attr];
                if (typeof value === 'undefined') {
                    cb(null);
                    return;
                }
                //check field mapping
                const mapping = event.model.inferMapping(attr);
                if (typeof mapping !== 'undefined' && mapping !== null) {
                    if (typeof event.target[attr] === 'object') {
                        value=event.target[attr][mapping.parentField];
                    }
                }
                if (typeof value=== 'undefined')
                    value = null;
                if (q) {
                    q.and(attr).equal(value);
                }
                else {
                    q = event.model.where(attr).equal(value);
                }
            }
            if (typeof q === 'undefined')
                cb(null);
            else {
                q.silent().select(event.model.primaryKey).first(function(err, result) {
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
                        if (event.state==2) {
                            //validate object id (check if target object is the same with the returned object)
                            objectExists = (result[event.model.primaryKey]!= event.target[event.model.primaryKey]);
                        }
                        //if object already exists
                        if (objectExists) {
                            let er;
                            //so throw exception
                            if (constraint.description) {
                                er = new UniqueConstraintError(constraint.description, null, event.model.name);
                            }
                            else {
                                er = new UniqueConstraintError("Object already exists. A unique constraint violated.", null, event.model.name);
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
     * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(event, callback) {
        //get function context
        const functionContext = new FunctionContext();
        _.assign(functionContext, event);
        functionContext.context = event.model.context;
        //find all attributes that have a default value
        const attrs = _.filter(event.model.attributes, function(x) {
            return (typeof x.calculation!== 'undefined');
        });
        async.eachSeries(attrs, function(attr, cb) {
            const expr = attr.calculation;
            //validate expression
            if (typeof expr !== 'string') {
                event.target[attr.name] = expr;
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
                            event.target[attr.name] = result;
                            return cb();
                        }).catch(function(err) {
                            cb(err);
                        });
                    }
                    else {
                        event.target[attr.name] = value1;
                        return cb();
                    }
                }
                else if (typeof value !== 'undefined' && value !=null && typeof value.then === 'function') {
                    //we have a promise, so we need to wait for answer
                    value.then(function(result) {
                        //otherwise set result
                        event.target[attr.name] = result;
                        return cb();
                    }).catch(function(err) {
                        cb(err);
                    });
                }
                else {
                    //otherwise get value
                    event.target[attr.name] = value;
                    return cb();
                }
            }
            else if (expr.indexOf('fn:')==0) {
               return cb(new Error ('fn: syntax is deprecated.'));
            }
            else {
                functionContext.evaluate(expr, function(err, result) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        event.target[attr.name] = result;
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
            const DataCache = require('./cache').DataCache;
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
                    hash = TextUtils.toMD5({ query: event.query });
                }
                //format cache key
                const key = '/' + event.model.name + '/?query=' + hash;
                //calculate execution time (debug)
                const logTime = new Date().getTime();
                //query cache
                return DataCache.getCurrent().get(key).subscribe((result)=> {
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
                }, (err) => {
                    TraceUtils.log('DataCacheListener: An error occured while trying to get cached data.');
                    TraceUtils.log(err);
                    return callback();
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
            const DataCache = require('./cache').DataCache;
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
                        hash = TextUtils.toMD5({ query: event.query });
                    }
                    const key = '/' + event.model.name + '/?query=' + hash;
                    if (process.env.NODE_ENV==='development') {
                        TraceUtils.debug('DataCacheListener: Setting data to cache [' + key + ']');
                    }
                    return DataCache.getCurrent().add(key, event.result).subscribe(() => {
                        return callback();
                    }, (err) => {
                        TraceUtils.error('An error occurred while adding item in data cache');
                        TraceUtils.error(err);
                        return callback();
                    });
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
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(event, callback) {

        const state = event.state!==undefined ? event.state : 0;
        if (state!=1)
        {
            callback(null);
        }
        else {
            //get function context
            const functionContext = new FunctionContext();
            _.assign(functionContext, event);
            //find all attributes that have a default value
            const attrs = _.filter(event.model.attributes, function(x) {
                return (typeof x.value!== 'undefined');
            });
            async.eachSeries(attrs, function(attr, cb) {
                const expr = attr.value;
                //if attribute is already defined
                if (typeof event.target[attr.name] !== 'undefined') {
                    //do nothing
                    cb(null);
                    return;
                }
                //validate expression
                if (typeof expr !== 'string') {
                    event.target[attr.name] = expr;
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
                                event.target[attr.name] = result;
                                return cb();
                            }).catch(function(err) {
                                cb(err);
                            });
                        }
                        else {
                            event.target[attr.name] = value1;
                            return cb();
                        }
                    }
                    else if (typeof value !== 'undefined' && value !=null && typeof value.then === 'function') {
                        //we have a promise, so we need to wait for answer
                        value.then(function(result) {
                            //otherwise set result
                            event.target[attr.name] = result;
                            return cb();
                        }).catch(function(err) {
                           cb(err);
                        });
                    }
                    else {
                        //otherwise get value
                        event.target[attr.name] = value;
                        return cb();
                    }
                }
                else if (expr.indexOf('fn:')==0) {
                    return cb(new Error ('fn: syntax is deprecated.'));
                }
                else  {

                    functionContext.evaluate(expr, function(err, result) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            event.target[attr.name] = result;
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

        const self = event.model, db = self.context.db;
        const view = self.viewAdapter, adapter = self.sourceAdapter;
        //if data model is a sealed model do nothing anb exit
        if (self.sealed) { return callback(); }
        //if view adapter is the same with source adapter do nothing and exit
        if (view===adapter) { return callback(); }
        const baseModel = self.base();
        //get array of fields
        const fields = _.map(_.filter(self.attributes, function(x) {
            return (self.name== x.model) && (!x.many);
        }), function(x) {
            return QueryField.create(x.name).from(adapter);
        });
        /**
         * @type {QueryExpression}
         */
        const q = QueryExpression.create(adapter).select(fields);
        //get base adapter
        const baseAdapter = (baseModel!=null) ? baseModel.name.concat('Data') : null, baseFields = [];
        //enumerate columns of base model (if any)
        if (_.isObject(baseModel)) {
            baseModel.attributes.forEach(function(x) {
                //get all fields (except primary and one-to-many relations)
                if ((!x.primary) && (!x.many))
                    baseFields.push(QueryField.create(x.name).from(baseAdapter))
            });
        }
        if (baseFields.length>0)
        {
            const from = QueryField.create(self.key().name).from(adapter),
                to = QueryField.create(self.base().key().name).from(baseAdapter);
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

/**
 * @class
 */
export class PreviousStateListener {
    /**
     * Occurs before creating or updating a data object and validates not nullable fields.
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(event, callback) {
        if (event.state==1) { return callback(); }
        const key = event.model.primaryKey;
        if (_.isNil(event.target[key])) {
            return callback();
        }
        event.model.where(key).equal(event.target[key]).silent().first(function(err,result) {
            if (err) {
                return callback(err);
            }
            else {
                event['previous'] = result;
                return callback();
            }
        });
    }
}

/**
 * @class
 * @classdesc Validates the state of a data object. DataStateValidatorListener is one of the default listeners which are being registered for all data models.
 <p>If the target data object belongs to a model which has one or more constraints, it will try to validate object's state against these constraints.
 <p>In the following example the process tries to save the favourite color of a user and passes name instead of user's identifier.
 DataStateValidatorListener will try to find a user based on the unique constraint of User model and then
 it will try to validate object's state based on the defined unique constraint of UserColor model.</p>
 <pre class="prettyprint"><code>
 // #User.json
 ...
 "constraints":[
 {
     "description": "User name must be unique across different records.",
     "type":"unique",
     "fields": [ "name" ]
 }]
 ...
 </code></pre>
 <pre class="prettyprint"><code>
 // #UserColor.json
 ...
 "constraints":[
 { "type":"unique", "fields": [ "user", "tag" ] }
 ]
 ...
 </code></pre>
 <pre class="prettyprint"><code>
 var userColor = {
        "user": {
            "name":"admin@example.com"
        },
        "color":"#FF3412",
        "tag":"favourite"
    };
 context.model('UserColor').save(userColor).then(function(userColor) {
        done();
    }).catch(function (err) {
        done(err);
    });
 </code></pre>
 </p>
 */
export class DataStateValidatorListener {
    /**
     * Occurs before creating or updating a data object and validates object state.
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeSave(event, callback) {
        try {
            if (_.isNil(event)) {
                return callback();
            }
            if (_.isNil(event.state)) {event.state = 1; }

            const model = event.model, target = event.target;
            //if model or target is not defined do nothing and exit
            if (_.isNil(model) || _.isNil(target)) {
                return callback();
            }
            //get key state
            const keyState = (model.primaryKey && target[model.primaryKey]);
            //if target has $state property defined, set this state and exit
            if (event.target.$state) {
                event.state = event.target.$state;
            }
            //if object has primary key
            else if (keyState) {
                event.state = 2
            }
            //if state is Update (2)
            if (event.state == 2) {
                //if key exists exit
                if (keyState)
                    return callback();
                else {
                    return DataStateValidator_MapKey_(model, target, function(err) {
                        if (err) { return callback(err); }
                        //if object is mapped with a key exit
                        return callback();
                    });
                }
            }
            else if (event.state == 1) {
                if (!keyState) {
                    return DataStateValidator_MapKey_(model, target, function(err, result) {
                        if (err) { return callback(err); }
                        if (result) {
                            //set state to Update
                            event.state = 2
                        }
                        return callback();
                    });
                }
                //otherwise do nothing
                return callback();
            }
            else {
                return callback();
            }

        }
        catch(er) {
            callback(er);
        }
    }

    /**
     * Occurs before removing a data object and validates object state.
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
     */
    beforeRemove(event, callback) {
        //validate event arguments
        if (_.isNil(event)) { return callback(); }
        //validate state (the default is Delete=4)
        if (_.isNil(event.state)) {event.state = 4; }
        const model = event.model, target = event.target;
        //if model or target is not defined do nothing and exit
        if (_.isNil(model) || _.isNil(target)) {
            return callback();
        }
        //if object primary key is already defined
        if (model.primaryKey && target[model.primaryKey]) {
            event.state = 4;
            //do nothing and exist
            return callback();
        }
        DataStateValidator_MapKey_(model, target, function(err, result) {
            if (err) {
                return callback(err);
            }
            else if (result) {
                //continue and exit
                return callback();
            }
            else {
                callback(new DataError('EFOUND', 'The target object cannot be found.',null, model.name));
            }
        });
    }

}

/**
 * @memberOf DataStateValidatorListener
 * @param {*} model
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function DataStateValidator_MapKey_(model, obj, callback) {
    if (_.isNil(obj)) {
        return callback(new Error('Object cannot be null at this context'));
    }
    if (model.primaryKey && obj[model.primaryKey]) {
        //already mapped
        return callback(null, true);
    }

    //get unique constraints
    const arr = _.filter(model.constraintCollection, function(x) { return x.type==='unique' });

    let objectFound=false;
    if (arr.length==0) {
        //do nothing and exit
        return callback();
    }
    async.eachSeries(arr, function(constraint, cb) {
        try {
            if (objectFound) {
                return cb();
            }
            /**
             * @type {DataQueryable}
             */
            let q;
            const appendQueryFunc = function(attr, value) {
                if (_.isNil(value))
                    value = null;
                if (q)
                    q.and(attr).equal(value);
                else
                    q = model.where(attr).equal(value);
            };
            if (_.isArray(constraint.fields)) {
                for (let i = 0; i < constraint.fields.length; i++) {
                    const attr = constraint.fields[i];
                    if (!obj.hasOwnProperty(attr)) {
                        return cb();
                    }
                    const parentObj = obj[attr], value = parentObj;
                    //check field mapping
                    const mapping = model.inferMapping(attr);
                    if (_.isObject(mapping) && (typeof parentObj === 'object')) {
                        if (parentObj.hasOwnProperty(mapping.parentField)) {
                            appendQueryFunc(attr, parentObj[mapping.parentField]);
                        }
                        else {
                            /**
                             * Try to find if parent model has a unique constraint and constraint fields are defined
                             * @type {DataModel}
                             */
                            const parentModel = model.context.model(mapping.parentModel), parentConstraint = parentModel.constraintCollection.find(function(x) { return x.type==='unique' });
                            if (parentConstraint) {
                                parentConstraint.fields.forEach(function(x) {
                                    appendQueryFunc(attr + "/" + x, parentObj[x]);
                                });
                            }
                            else {
                                appendQueryFunc(attr, null);
                            }
                        }
                    }
                    else {
                        appendQueryFunc(attr, value);
                    }
                }
                if (_.isNil(q)) {
                    cb();
                }
                else {
                    q.silent().flatten().select(model.primaryKey).value(function(err, result) {
                        if (err) {
                            cb(err);
                        }
                        else if (result) {
                            //set primary key value
                            obj[model.primaryKey] = result;
                            //object found
                            objectFound=true;
                            cb();
                        }
                        else {
                            cb();
                        }
                    });
                }
            }
            else {
                cb();
            }
        }
        catch(err) {
            cb(err);
        }
    }, function(err) {
        callback(err, objectFound);
    });
}


/**
 * @class
 */
export class DataNestedObjectListener {
    /**
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    beforeSave(event, callback) {
        try {
            //get attributes with nested property set to on
            const nested = _.filter(event.model.attributes, function(x) {
                //only if these attributes belong to current model
                return x.nested && (x.model === event.model.name);
            });
            //if there are no attribute defined as nested do nothing
            if (nested.length === 0) { return callback(); }
            async.eachSeries(nested, function(attr, cb) {
                return DataNestedObject_BeforeSave_(attr, event, cb);
            }, function(err) {
                return callback(err);
            });
        }
        catch (e) {
            return callback(e);
        }
    }

    beforeRemove(event, callback) {
        try {
            //get attributes with nested property set to on
            const nested = _.filter(event.model.attributes, function(x) {
                //only if these attributes belong to current model
                return x.nested && (x.model === event.model.name);
            });
            //if there are no attribute defined as nested, do nothing and exit
            if (nested.length === 0) { return callback(); }
            async.eachSeries(nested, function(attr, cb) {
                return DataNestedObject_BeforeRemove_(attr, event, cb);
            }, function(err) {
                return callback(err);
            });
        }
        catch (e) {
            return callback(e);
        }
    }
}

/**
 * @memberOf DataNestedObjectListener
 * @param {DataField} attr
 * @param {DataEventArgs} event
 * @param {Function} callback
 * @private
 */
function DataNestedObject_BeforeSave_(attr, event, callback) {
    const context = event.model.context, name = attr.property || attr.name, key = event.model.getPrimaryKey(), nestedObj = event.target[name];
    //if attribute is null or undefined do nothing
    if (_.isNil(nestedObj)) {
        return callback();
    }
    //get target model
    const nestedModel = context.model(attr.type);
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
            .first().subscribe((result) => {
            if (_.isNil(result)) { return callback(new Error('Invalid object state.')); }
            const nestedKey = nestedModel.getPrimaryKey();
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
        }, (err) => {
            return callback(err);
        });
    }
    else {
        return callback();
    }
}
/**
 * @memberOf DataNestedObjectListener
 * @param {DataField} attr
 * @param {DataEventArgs} event
 * @param {Function} callback
 * @private
 */
function DataNestedObject_BeforeSaveMany_(attr, event, callback) {
    const context = event.model.context, name = attr.property || attr.name, key = event.model.getPrimaryKey(), nestedObj = event.target[name];
    //if attribute is null or undefined
    if (_.isNil(nestedObj)) {
        //do nothing
        return callback();
    }
    //if nested object is not an array
    if (!_.isArray(nestedObj)) {
        //throw exception
        return callback(new DataError("EJUNCT","Invalid argument type. Expected array.",null, event.model.name, name));
    }
    //if nested array does not have any data
    if (nestedObj.length==0) {
        //do nothing
        return callback();
    }
    //get target model
    const nestedModel = context.model(attr.type);
    //if target model cannot be found
    if (_.isNil(nestedModel)) {
        return callback();
    }
    //get nested primary key
    const nestedKey = nestedModel.getPrimaryKey();
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
                const originalNestedObjects = result[name] || [];
                //enumerate nested objects
                nestedObj.forEach(function(x) {
                    //search in original nested objects
                    const obj = originalNestedObjects.find(function(y) { return y[nestedKey] == x[nestedKey]; });
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
 * @memberOf DataNestedObjectListener
 * @param {DataField} attr
 * @param {DataEventArgs} event
 * @param {Function} callback
 * @private
 */
function DataNestedObject_BeforeRemove_(attr, event, callback) {
    try {
        if (event.state !== 4) { return callback(); }
        const context = event.model.context, name = attr.property || attr.name, key = event.model.getPrimaryKey();
        const nestedModel = context.model(attr.type);
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

/**
 * @memberOf DataNestedObjectListener
 * @param {DataField} attr
 * @param {DataEventArgs} event
 * @param {Function} callback
 * @private
 */
function DataNestedObject_BeforeRemoveMany_(attr, event, callback) {
    try {
        if (event.state !== 4) { return callback(); }
        const context = event.model.context, name = attr.property || attr.name;
        const nestedModel = context.model(attr.type);
        if (_.isNil(nestedModel)) { return callback(); }
        //get junction
        const junction = event.target.property(name);
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