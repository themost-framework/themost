/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var _ = require("lodash");
var Symbol = require('symbol');
var HashMap = require('hashmap');
var ConfigurationStrategy = require('@themost/common/config').ConfigurationStrategy;
var ConfigurationBase = require('@themost/common/config').ConfigurationBase;
var LangUtils = require('@themost/common/utils').LangUtils;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var PathUtils = require('@themost/common/utils').PathUtils;
var RandomUtils = require('@themost/common/utils').RandomUtils;
var Args = require('@themost/common/utils').Args;

var dataTypesProperty = Symbol('dataTypes');
var adapterTypesProperty = Symbol('adapterTypes');
var modelsProperty = Symbol('models');
var modelPathProperty = Symbol('modelsPath');
var filesProperty = Symbol('files');

/**
 * @class
 * @constructor
 */
function AuthSettings() {
        this.name = '.MAUTH';
        this.defaultUserGroup = 'Users';
        this.unattendedExecutionAccount = RandomUtils.randomHex(16);
        this.timeout = 480;
        this.slidingExpiration = false;
        this.loginPage = '/login';
}

/**
 * @classdesc Holds the configuration of data modeling infrastructure
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @extends ConfigurationStrategy
 * @property {Array} adapters
 * @property {Array} adapterTypes
 * @property {*} dataTypes
 * @property {*} auth
 */
function DataConfigurationStrategy(config) {
    DataConfigurationStrategy.super_.bind(this)(config);

    this[dataTypesProperty] = require('./dataTypes.json');

    //register other strategies
    if (!config.hasStrategy(SchemaLoaderStrategy)) {
        config.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
    }
    if (!config.hasStrategy(ModelClassLoaderStrategy)) {
        config.useStrategy(ModelClassLoaderStrategy, DefaultModelClassLoaderStrategy);
    }

    if (!this.getConfiguration().hasSourceAt('adapters')) {
        this.getConfiguration().setSourceAt('adapters',[]);
    }

    if (!this.getConfiguration().hasSourceAt('adapterTypes')) {
        this.getConfiguration().setSourceAt('adapterTypes',[]);
    }

    if (!this.getConfiguration().hasSourceAt('settings/auth')) {
        this.getConfiguration().setSourceAt('settings/auth', new AuthSettings());
    }

    var configAdapterTypes = this.getConfiguration().getSourceAt('adapterTypes');
    this[adapterTypesProperty] = {};
    var self = this;
    //configure adapter types
    _.forEach(configAdapterTypes, function(x) {
        //first of all validate module
        x.invariantName = x.invariantName || 'unknown';
        x.name = x.name || 'Unknown Data Adapter';
        var valid = false, adapterModule;
        if (x.type) {
            try {
                if (require.main && /^@themost\//.test(x.type)) {
                    adapterModule = require.main.require(x.type);
                }
                else {
                    adapterModule = require(x.type);
                }

                if (typeof adapterModule.createInstance === 'function') {
                    valid = true;
                }
                else {
                    //adapter type does not export a createInstance(options) function
                    TraceUtils.log("The specified data adapter type (%s) does not have the appropriate constructor. Adapter type cannot be loaded.", x.invariantName);
                }
            }
            catch(err) {
                //catch error
                TraceUtils.error(err);
                //and log a specific error for this adapter type
                TraceUtils.log("The specified data adapter type (%s) cannot be instantiated. Adapter type cannot be loaded.", x.invariantName);
            }
            if (valid) {
                //register adapter
                self[adapterTypesProperty][x.invariantName] = {
                    invariantName:x.invariantName,
                    name: x.name,
                    createInstance:adapterModule.createInstance
                };
            }
        }
        else {
            TraceUtils.log("The specified data adapter type (%s) does not have a type defined. Adapter type cannot be loaded.", x.invariantName);
        }
    });

    Object.defineProperty(self, 'adapterTypes', {
        get: function() {
            return self[adapterTypesProperty]
        }, configurable:false, enumerable:false
    });

    Object.defineProperty(self, 'auth', {
        get: function() {
            return this.getConfiguration().getSourceAt('settings/auth');
        }, configurable:false, enumerable:false
    });

    Object.defineProperty(self, 'dataTypes', {
        get: function() {
            return self[dataTypesProperty]
        }, configurable:false, enumerable:false
    });

    Object.defineProperty(self, 'adapters', {
        get: function() {
            return this.getConfiguration().getSourceAt('adapters');
        }, configurable:false, enumerable:false
    });

}
LangUtils.inherits(DataConfigurationStrategy, ConfigurationStrategy);

DataConfigurationStrategy.prototype.getAuthSettings = function() {
    return this.getConfiguration().getSourceAt('settings/auth');
};

/**
 * Gets a boolean which indicates whether the specified data type is defined in data types collection or not.
 * @param name
 * @returns {boolean}
 */
DataConfigurationStrategy.prototype.hasDataType = function(name) {
    if (_.isNil(name)) {
        return false;
    }
    if (typeof name !== 'string') {
        return false;
    }
    return this.dataTypes.hasOwnProperty(name);
};

/**
 * Gets a native object which represents the definition of the model with the given name.
 * @param {string} name
 * @returns {DataModel|undefined}
 */
DataConfigurationStrategy.prototype.getModelDefinition = function(name) {
    /**
     * @type {SchemaLoaderStrategy}
     */
    const schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
    return schemaLoader.getModelDefinition(name);
};

/**
 * Sets a data model definition in application storage.
 * Use this method in order to override default model loading process.
 * @param {*} data - A generic object which represents a model definition
 * @returns {DataConfigurationStrategy}
 * @example
 var most = require("most-data");
 most.cfg.getCurrent().setModelDefinition({
            "name":"UserColor",
            "version":"1.1",
            "title":"User Colors",
            "fields":[
                { "name": "id", "title": "Id", "type": "Counter", "nullable": false, "primary": true },
                { "name": "user", "title": "User", "type": "User", "nullable": false },
                { "name": "color", "title": "Color", "type": "Text", "nullable": false, "size":12 },
                { "name": "tag", "title": "Tag", "type": "Text", "nullable": false, "size":24 }
                ],
            "constraints":[
                {"type":"unique", "fields": [ "user" ]}
            ],
            "privileges":[
                { "mask":15, "type":"self","filter":"id eq me()" }
                ]
        });
 */
DataConfigurationStrategy.prototype.setModelDefinition = function(data) {
    /**
     * @type {SchemaLoaderStrategy}
     */
    const schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
    schemaLoader.setModelDefinition(data);
    return this;
};

/**
 * @returns {*}
 * @param name {string}
 */
DataConfigurationStrategy.prototype.model = function(name) {
    return this.getModelDefinition(name);
};
/**
 * Gets the current data configuration
 * @returns DataConfigurationStrategy - An instance of DataConfiguration class which represents the current data configuration
 */
DataConfigurationStrategy.getCurrent = function() {
    var configuration = ConfigurationBase.getCurrent();
    if (!configuration.hasStrategy(DataConfigurationStrategy)) {
        configuration.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
    }
    return configuration.getStrategy(DataConfigurationStrategy);
};



/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @extends ConfigurationStrategy
 */
function SchemaLoaderStrategy(config) {
    SchemaLoaderStrategy.super_.bind(this)(config);
    this[modelsProperty] = new HashMap();
    this.setModelDefinition({
        "name":"Migration", "title":"Data Model Migrations", "id": 14,
        "source":"migrations", "view":"migrations", "hidden": true, "sealed":true,
        "fields":[
            { "name":"id", "type":"Counter", "primary":true },
            { "name":"appliesTo", "type":"Text", "size":180, "nullable":false },
            { "name":"model", "type":"Text", "size":120 },
            { "name":"description", "type":"Text", "size":512},
            { "name":"version", "type":"Text", "size":40, "nullable":false }
        ],
        "constraints":[
            { "type":"unique", "fields":[ "appliesTo", "version" ] }
        ]
    });

}
LangUtils.inherits(SchemaLoaderStrategy, ConfigurationStrategy);

/**
 * Sets a model definition
 * @param {*} data
 * @returns {SchemaLoaderStrategy}
 */
SchemaLoaderStrategy.prototype.setModelDefinition = function(data) {
    Args.notNull(data,'Model definition');
    Args.notString(data.name,'Model name');
    this[modelsProperty].set(data.name,data);
    return this;
};
/**
 * Gets a model definition based on the given model name
 * @param {string} name
 */
SchemaLoaderStrategy.prototype.getModelDefinition = function(name) {
    Args.notString(name,'Model name');
    var result = this[modelsProperty].get(name);
    if (typeof result !== 'undefined') {
        return result;
    }
    //case insensitive search
    var keys = this[modelsProperty].keys();

    var key = _.find(keys, function(x) {
        return (typeof x === 'string') && (x.toLowerCase()===name.toLowerCase());
    });
    if (typeof key !== 'undefined') {
        return this[modelsProperty].get(key);
    }
};

/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @extends SchemaLoaderStrategy
 */
function DefaultSchemaLoaderStrategy(config) {
    DefaultSchemaLoaderStrategy.super_.bind(this)(config);
    //set models path
    this[modelPathProperty] = PathUtils.join(config.getConfigurationPath(), 'models');
}
LangUtils.inherits(DefaultSchemaLoaderStrategy, SchemaLoaderStrategy);

/**
 * Gets a string which represents the directory which contains model definitions.
 * @returns {*}
 */
DefaultSchemaLoaderStrategy.prototype.getModelPath = function() {
    return this[modelPathProperty];
};

/**
 * Sets the directory of model definitions.
 * @param {string} p
 * @returns {DefaultSchemaLoaderStrategy}
 */
DefaultSchemaLoaderStrategy.prototype.setModelPath = function(p) {
    this[modelPathProperty] = p;
    return this;
};

/**
 *
 * @param {string} name
 * @returns {*}
 */
DefaultSchemaLoaderStrategy.prototype.getModelDefinition = function(name) {
    var getModelDefinitionSuper = DefaultSchemaLoaderStrategy.super_.prototype.getModelDefinition;
    var i;
    if (typeof name !== 'string')
        return;
    //exclude registered data types
    if (this.getConfiguration().getStrategy(DataConfigurationStrategy).hasDataType(name)) {
        return;
    }
    var modelDefinition = getModelDefinitionSuper.bind(this)(name);
    //first of all try to find if model definition is already in cache
    if (_.isObject(modelDefinition)) {
        //and return it//and return it
        return modelDefinition;
    }
    //otherwise open definition file
    var modelPath = this.getModelPath();
    //read files from models directory
    //store file list in a private variable
    if (typeof this[filesProperty] === 'undefined') {
        var nativeFsModule = 'fs';
        var fs = require(nativeFsModule);
        if (typeof fs.readdirSync === 'function') {
            this[filesProperty] = fs.readdirSync(modelPath);
        }
        else {
            //try load model definition
            try {
                modelDefinition = require(PathUtils.join(modelPath, name.concat('json')));
                this.setModelDefinition(modelDefinition);
            }
            catch(err) {
                //do nothing (log error)
                TraceUtils.error('An error occurred while loading definition for model %s.', name);
                TraceUtils.error(err);
            }
        }
    }
    //and finally get this list of file
    var files = this[filesProperty];
    if (files.length===0)
        return;
    var r = new RegExp('^' + name.concat('.json') + '$','i');
    for (i = 0; i < files.length; i++) {
        r.lastIndex=0;
        if (r.test(files[i])) {
            //build model file path
            var finalPath = PathUtils.join(modelPath, files[i]);
            //get model
            var result = require(finalPath), finalName = result.name;
            //set definition
            this.setModelDefinition(result);
            //and finally return this definition
            return result;
        }
    }
};

/**
 * @class
 * @constructor
 * @param {DataConfiguration} config
 * @extends ConfigurationStrategy
 */
function ModelClassLoaderStrategy(config) {
    ModelClassLoaderStrategy.super_.bind(this)(config);
}
LangUtils.inherits(ModelClassLoaderStrategy, ConfigurationStrategy);

/**
 * @class
 * @constructor
 * @param {DataConfiguration} config
 * @extends ConfigurationStrategy
 */
function DefaultModelClassLoaderStrategy(config) {
    DefaultModelClassLoaderStrategy.super_.bind(this)(config);
}
LangUtils.inherits(DefaultModelClassLoaderStrategy, ModelClassLoaderStrategy);

/**
 * @param {DataModel} model
 * @returns {Function}
 */
DefaultModelClassLoaderStrategy.prototype.resolve = function(model) {
    Args.notNull(model, 'Model');
    var DataObjectClass = this['DataObjectClass'];
    if (_.isFunction(DataObjectClass)) {
        return DataObjectClass;
    }
    //get model definition
    var modelDefinition = this.getConfiguration().getStrategy(SchemaLoaderStrategy).getModelDefinition(model.name);
    if (typeof model.classPath === 'string') {
        modelDefinition['DataObjectClass'] = DataObjectClass = require(self.classPath);
    }
    else {
        //try to find module by using capitalize naming convention
        // e.g. OrderDetail -> OrderDetailModel.js
        var classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',this.name.concat('Model.js'));
        try {
            modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
        }
        catch(err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                try {
                    //try to find module by using dasherize naming convention
                    // e.g. OrderDetail -> order-detail-model.js
                    classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',_.dasherize(this.name).concat('-model.js'));
                    modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
                }
                catch(err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        if (typeof this['inherits'] === 'undefined' || this['inherits'] === null) {
                            //use default DataObject class
                            modelDefinition['DataObjectClass'] = DataObjectClass = require('./data-object').DataObject;
                        }
                        else {
                            modelDefinition['DataObjectClass'] = DataObjectClass = this.resolve(model.base());
                        }
                    }
                    else {
                        throw err;
                    }
                }
            }
            else {
                throw err;
            }
        }
    }
    return DataObjectClass;
};

if (typeof exports !== 'undefined') {
    module.exports.DataConfigurationStrategy = DataConfigurationStrategy;
    module.exports.SchemaLoaderStrategy = SchemaLoaderStrategy;
    module.exports.DefaultSchemaLoaderStrategy = DefaultSchemaLoaderStrategy;
    module.exports.ModelClassLoaderStrategy = ModelClassLoaderStrategy;
    module.exports.DefaultModelClassLoaderStrategy = DefaultModelClassLoaderStrategy;
}