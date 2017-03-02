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
import {DataContext} from './types';
import {_} from 'lodash';
import {TraceUtils} from '@themost/common/utils';
import {DataConfiguration} from './config';


/**
 * @classdesc Represents the default data context of MOST Data Applications.
 * The default data context uses the adapter which is registered as the default adapter in application configuration.
 <pre class="prettyprint"><code>
 adapters: [
 ...
 { "name":"development", "invariantName":"...", "default":false,
    "options": {
      "server":"localhost",
      "user":"user",
      "password":"password",
      "database":"test"
    }
},
 { "name":"development_with_pool", "invariantName":"pool", "default":true,
    "options": {
      "adapter":"development"
    }
}
 ...
 ]
 </code></pre>
 * @class
 * @augments DataContext
 * @property {DataAdapter} db - Gets a data adapter based on the current configuration settings.
 */
export class DefaultDataContext extends DataContext {
    /**
     * @constructor
     */
    constructor() {
        super();
        /**
         * @type {DataAdapter}
         * @private
         */
        let db_= null;
        /**
         * @private
         */
        this.finalize_ = function() {
            if (db_)
                db_.close();
            db_=null;
        };
        const self = this;

        self.getDb = function() {
            if (db_)
                return db_;
            //otherwise load database options from configuration
            const adapter = self.getConfiguration().adapters.find(function(x) {
                return x["default"];
            });
            if (typeof adapter ==='undefined' || adapter==null) {
                er = new Error('The default data adapter is missing.'); er.code = 'EADAPTER';
                throw er;
            }
            /**
             * @type {{createInstance:Function}|*}
             */
            const adapterType = self.getConfiguration().adapterTypes[adapter.invariantName];
            //validate data adapter type
            let er;
            if (_.isNil(adapterType)) {
                er = new Error('Invalid adapter type.'); er.code = 'EADAPTER';
                throw er;
            }
            if (typeof adapterType.createInstance !== 'function') {
                er= new Error('Invalid adapter type. Adapter initialization method is missing.'); er.code = 'EADAPTER';
                throw er;
            }
            //otherwise load adapter
            db_ = adapterType.createInstance(adapter.options);
            return db_;
        };

        self.setDb = function(value) {
            db_ = value;
        };

        delete self.db;

        Object.defineProperty(self, 'db', {
            get: function() {
                return self.getDb();
            },
            set: function(value) {
                self.setDb(value);
            },
            configurable: true,
            enumerable:false });
    }

    /**
     * Gets an instance of DataConfiguration class which is associated with this data context
     * @returns {DataConfiguration}
     */
    getConfiguration() {
        return DataConfiguration.getCurrent();
    }

    /**
     * Gets an instance of DataModel class based on the given name.
     * @param name {string} - A string that represents the model name.
     * @returns {DataModel} - An instance of DataModel class associated with this data context.
     */
    model(name) {
        const self = this;
        if ((name == null) || (name === undefined))
            return null;
        const obj = self.getConfiguration().model(name);
        if (_.isNil(obj))
            return null;
        const DataModel = require('./model').DataModel, model = new DataModel(obj);
        //set model context
        model.context = self;
        //return model
        return model;
    }

    /**
     * Finalizes the current data context
     * @param {Function} cb - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     */
    finalize(cb) {
        cb = cb || function () {};
        this.finalize_();
        cb.call(this);
    }

    /**
     *
     * @param {Function} func
     * @param {Function} callback
     */
    static execute(func, callback) {
        func = func || function() {};
        const ctx = new DefaultDataContext();
        func.call(null, ctx, function(err) {
            ctx.finalize(function() {
               if (err) { return callback(err); }
               return callback();
            });
        });
    }

}

/**
 * @classdesc Represents a data context based on a data adapter's name.
 * The specified adapter name must be registered in application configuration.
 * @class
 * @augments DataContext
 * @property {DataAdapter} db - Gets a data adapter based on the given adapter's name.
 */
class NamedDataContext extends DataContext {
    /**
     * @constructor
     * @param {string} name
     */
    constructor(name) {
        super();
        /**
         * @type {DataAdapter}
         * @private
         */
        let db_;
        /**
         * @private
         */
        this.finalize_ = function() {
            try {
                if (db_)
                    db_.close();
            }
            catch(err) {
                TraceUtils.debug('An error occure while closing the underlying database context.');
                TraceUtils.debug(err);
            }
            db_ = null;
        };
        //set the name specified
        const self = this, name_ = name;

        self.getDb = function() {
            if (db_)
                return db_;
            //otherwise load database options from configuration
            const adapter = self.getConfiguration().adapters.find(function(x) {
                return x.name == name_;
            });
            let er;
            if (typeof adapter ==='undefined' || adapter==null) {
                er = new Error('The specified data adapter is missing.'); er.code = 'EADAPTER';
                throw er;
            }
            //get data adapter type
            const adapterType = self.getConfiguration().adapterTypes[adapter.invariantName];
            //validate data adapter type
            if (_.isNil(adapterType)) {
                er = new Error('Invalid adapter type.'); er.code = 'EADAPTER';
                throw er;
            }
            if (typeof adapterType.createInstance !== 'function') {
                er= new Error('Invalid adapter type. Adapter initialization method is missing.'); er.code = 'EADAPTER';
                throw er;
            }
            //otherwise load adapter
            db_ = adapterType.createInstance(adapter.options);
            return db_;
        };

        self.setDb = function(value) {
            db_ = value;
        };

        /**
         * Gets an instance of DataConfiguration class which is associated with this data context
         * @returns {DataConfiguration}
         */
        this.getConfiguration = function() {
            return DataConfiguration.getCurrent();
        };

        delete self.db;

        Object.defineProperty(self, 'db', {
            get : function() {
                return self.getDb();
            },
            set : function(value) {
                self.setDb(value);
            },
            configurable : true,
            enumerable:false });

    }

    /**
     * Gets an instance of DataModel class based on the given name.
     * @param name {string} - A string that represents the model name.
     * @returns {DataModel} - An instance of DataModel class associated with this data context.
     */
    model(name) {
        const self = this;
        if ((name == null) || (name === undefined))
            return null;
        const obj = self.getConfiguration().model(name);
        if (_.isNil(obj))
            return null;
        const DataModel = require('./model').DataModel;
        const model = new DataModel(obj);
        //set model context
        model.context = self;
        //return model
        return model;
    }

    finalize(cb) {
        cb = cb || function () {};
        this.finalize_();
        cb.call(this);
    }
}