/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _ = require("lodash");
var TraceUtils = require('@themost/common/utils').TraceUtils;
var LangUtils = require('@themost/common/utils').LangUtils;
var DataContext = require('./types').DataContext;
var DataConfigurationStrategy = require('./data-configuration').DataConfigurationStrategy;
var cfg = require('./data-configuration');
var Symbol = require('symbol');
var nameProperty = Symbol('name');

/**
 * @classdesc Represents the default data context of MOST Data Applications.
 * The default data context uses the adapter which is registered as the default adapter in application configuration.
 * @description
 ```
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
 ```
 * @class
 * @constructor
 * @augments {DataContext}
 * @property {DataAdapter} db - Gets a data adapter based on the current configuration settings.
 */
function DefaultDataContext()
{
    /**
     * @type {DataAdapter|*}
     */
    var db_= null;
    /**
     * @name DataAdapter#hasConfiguration
     * @type {Function}
     * @param {Function} getConfigurationFunc
     */
    /**
     * @private
     */
    this.finalize_ = function() {
        if (db_)
            db_.close();
        db_=null;
    };
    var self = this;
    // set data context name with respect to DataContext implementation
    var _name = 'default';
    Object.defineProperty(this, 'name', {
       enumerable: false,
       configurable: true,
        get: function() {
             return _name;
        }
    });

    self.getDb = function() {

        if (db_)
            return db_;
        var er;
        //otherwise load database options from configuration
        var strategy = self.getConfiguration().getStrategy(DataConfigurationStrategy);
        var adapter = _.find(strategy.adapters, function(x) {
            return x["default"];
        });
        if (_.isNil(adapter)) {
            er = new Error('The default data adapter is missing.'); er.code = 'EADAPTER';
            throw er;
        }
        /**
         * @type {*}
         */
        var adapterType = strategy.adapterTypes[adapter.invariantName];
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
        /**
         * @type {DataAdapter|*}
         */
        db_ = adapterType.createInstance(adapter.options);
        if (typeof db_.hasConfiguration === 'function') {
            db_.hasConfiguration(function() {
               return self.getConfiguration();
            });
        }
        return db_;
    };

    self.setDb = function(value) {
        /**
         * @type {DataAdapter|*}
         */
        db_ = value;
        if (db_) {
            if (typeof db_.hasConfiguration === 'function') {
                db_.hasConfiguration(function() {
                    return self.getConfiguration();
                });
            }
        }
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

LangUtils.inherits(DefaultDataContext, DataContext);

/**
 * Gets an instance of DataConfiguration class which is associated with this data context
 * @returns {ConfigurationBase|*}
 */
DefaultDataContext.prototype.getConfiguration = function() {
    return cfg.getCurrent();
};

/**
 * Gets an instance of DataModel class based on the given name.
 * @param {*} name - A variable that represents the model name.
 * @returns {DataModel} - An instance of DataModel class associated with this data context.
 */
DefaultDataContext.prototype.model = function(name) {
    var self = this;
    if (name == null) {
        return null;
    }
    var modelName = name; 
    // if model is a function (is a constructor)
    if (typeof name === 'function') {
        // try to get EdmMapping.entityType() decorator
        if (Object.prototype.hasOwnProperty.call(name, 'entityTypeDecorator')) {
            // if entityTypeDecorator is string
            if (typeof name.entityTypeDecorator === 'string') {
                // get model name
                modelName = name.entityTypeDecorator;
            }
        } else {
            // get function name as the requested model
            modelName = name.name;
        }
    }
    var obj = self.getConfiguration().getStrategy(DataConfigurationStrategy).model(modelName);
    if (_.isNil(obj))
        return null;
    var DataModel = require('./data-model').DataModel,
        model = new DataModel(obj);
    //set model context
    model.context = self;
    //return model
    return model;
};
/**
 * Finalizes the current data context
 * @param {Function} cb - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 */
DefaultDataContext.prototype.finalize = function(cb) {
    cb = cb || function () {};
    this.finalize_();
    cb.call(this);
};


/**
 * @classdesc Represents a data context based on a data adapter's name.
 * The specified adapter name must be registered in application configuration.
 * @class
 * @constructor
 * @augments DataContext
 * @property {DataAdapter} db - Gets a data adapter based on the given adapter's name.
 */
function NamedDataContext(name)
{
    NamedDataContext.super_.bind(this)();
    /**
     * @type {DataAdapter}
     * @private
     */
    var db_;
    /**
     * @private
     */
    this.finalize_ = function() {
        try {
            if (db_)
                db_.close();
        }
        catch(err) {
            TraceUtils.debug('An error occurred while closing the underlying database context.');
            TraceUtils.debug(err);
        }
        db_ = null;
    };
    var self = this;
    self[nameProperty] = name;

    self.getDb = function() {
        if (db_)
            return db_;
        var strategy = self.getConfiguration().getStrategy(DataConfigurationStrategy);
        //otherwise load database options from configuration
        var adapter = strategy.adapters.find(function(x) {
            return x.name === self[nameProperty];
        });
        var er;
        if (typeof adapter ==='undefined' || adapter===null) {
            er = new Error('The specified data adapter is missing.'); er.code = 'EADAPTER';
            throw er;
        }
        //get data adapter type
        var adapterType = strategy.adapterTypes[adapter.invariantName];
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
        if (typeof db_.hasConfiguration === 'function') {
            db_.hasConfiguration(function() {
                return self.getConfiguration();
            });
        }
        return db_;
    };

    /**
     * @param {DataAdapter|*} value
     */
    self.setDb = function(value) {
        db_ = value;
        if (db_) {
            if (typeof db_.hasConfiguration === 'function') {
                db_.hasConfiguration(function() {
                    return self.getConfiguration();
                });
            }
        }

    };

    /**
     * @name NamedDataContext#db
     * @type {DataAdapter}
     */

    Object.defineProperty(self, 'db', {
        get : function() {
            return self.getDb();
        },
        set : function(value) {
            self.setDb(value);
        },
        configurable : true,
        enumerable:false });

    /**
     * @name NamedDataContext#name
     * @type {string}
     */
    Object.defineProperty(self, 'name', {
        get: function () {
            return self[nameProperty];
        }
    });

}
LangUtils.inherits(NamedDataContext, DataContext);

/**
 * Gets a string which represents the name of this context
 * @returns {string}
 */
NamedDataContext.prototype.getName = function() {
    return this[nameProperty];
};

/**
 * Gets an instance of DataConfiguration class which is associated with this data context
 * @returns {DataConfiguration}
 */
NamedDataContext.prototype.getConfiguration = function() {
    return cfg.getNamedConfiguration(this.name);
};
/**
 * Gets an instance of DataModel class based on the given name.
 * @param name {string} - A string that represents the model name.
 * @returns {DataModel} - An instance of DataModel class associated with this data context.
 */
NamedDataContext.prototype.model = function(name) {
    var self = this;
    if (name == null) {
        return null;
    }
    var modelName = name; 
    // if model is a function (is a constructor)
    if (typeof name === 'function') {
        // try to get EdmMapping.entityType() decorator
        if (Object.prototype.hasOwnProperty.call(name, 'entityTypeDecorator')) {
            // if entityTypeDecorator is string
            if (typeof name.entityTypeDecorator === 'string') {
                // get model name
                modelName = name.entityTypeDecorator;
            }
        } else {
            // get function name as the requested model
            modelName = name.name;
        }
    }
    var obj = self.getConfiguration().getStrategy(DataConfigurationStrategy).model(modelName);
    if (_.isNil(obj))
        return null;
    var DataModel = require('./data-model').DataModel;
    var model = new DataModel(obj);
    //set model context
    model.context = self;
    //return model
    return model;

};

NamedDataContext.prototype.finalize = function(cb) {
    cb = cb || function () {};
    this.finalize_();
    cb.call(this);
};


if (typeof exports !== 'undefined')
{
    module.exports.DefaultDataContext = DefaultDataContext;
    module.exports.NamedDataContext = NamedDataContext;
}
