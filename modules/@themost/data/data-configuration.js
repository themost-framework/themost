/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var _ = require("lodash");
var Symbol = require('symbol');
var TraceUtils = require('@themost/common/utils').TraceUtils;
var path = require("path");
var LangUtils = require('@themost/common/utils').LangUtils;
var Args = require('@themost/common/utils').Args;
var ConfigurationBase = require('@themost/common/config').ConfigurationBase;
var ConfigurationStrategy = require('@themost/common/config').ConfigurationStrategy;
var PathUtils = require('@themost/common/utils').PathUtils;
var RandomUtils = require('@themost/common/utils').PathUtils;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;

var modelsProperty = Symbol('models');
var modelPathProperty = Symbol('modelPath');
var filesProperty = Symbol('files');
var dataTypesProperty = Symbol('dataTypes');
var adapterTypesProperty =  Symbol('adapterTypes');
var currentConfiguration = Symbol('current');
var namedConfigurations = Symbol('namedConfigurations');

/**
 *
 * @param s
 * @returns {*}
 * @private
 */
function _dasherize(s) {
    if (_.isString(s))
        return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
    return s;
}


/**
 * @method dasherize
 * @memberOf _
 */

if (typeof _.dasherize !== 'function') {
    _.mixin({'dasherize' : _dasherize});
}

/**
 * @class
 * @constructor
 * @interface
 */
function DataTypePropertiesConfiguration() {
    /**
     * Gets a pattern (commonly a regular expression) that validates a value of this data type
     * @property
     * @name DataTypePropertiesConfiguration#pattern
     * @type {string}
     * @example "^[-][0-9]*$" is the pattern of NegativeInteger data type
     */

    /**
     * Gets a message that describes the pattern of this data type
     * @property
     * @name DataTypePropertiesConfiguration#patternMessage
     * @type {string}
     * @example "The value should be an integer lower than zero."
     */

    /**
     * Gets the minimum value allowed for a data type
     * @property
     * @name DataTypePropertiesConfiguration#minValue
     * @type {*}
     * @example 0 is the minimum value of NonNegativeInteger data type
     */

    /**
     * Gets the maximum value allowed for a data type
     * @property
     * @name DataTypePropertiesConfiguration#maxValue
     * @type {*}
     * @example 2147483647 is the maximum value of NonNegativeInteger data type
     */
}

/**
 * @class
 * @constructor
 * @interface
 */
function DataTypeConfiguration() {
    /**
     * Gets a short description for this data type
     * @property
     * @name DataTypeConfiguration#comment
     * @type {string}
     * @example "Float data type is a single-precision 32-bit floating point."
     */

    /**
     * Gets a collection of additional properties of this data type
     * @property
     * @name DataTypeConfiguration#properties
     * @type {DataTypePropertiesConfiguration}
     * @example
     * ...
     * "properties": {
     *       "pattern":"^[+]?[0-9]*\\.?[0-9]*$",
     *       "patternMessage":"The value should be a number greater than zero."
     *  }
     * ...
     */

    /**
     * Gets a title for this data type
     * @property
     * @name DataTypeConfiguration#label
     * @type {string}
     * @example "Float"
     */

    /**
     * Gets a string which represents a URL that contains information for this data type
     * @property
     * @name DataTypeConfiguration#url
     * @type {string}
     * @example "https://www.w3.org/TR/xmlschema-2/#float"
     */

    /**
     * Gets a type which is associated with this data type
     * @property
     * @name DataTypeConfiguration#type
     * @type {string}
     * @example "number"
     */

    /**
     * Gets the equivalent SQL data type
     * @property
     * @name DataTypeConfiguration#sqltype
     * @type {string}
     * @example "FLOAT"
     */

    /**
     * Gets an array of values associated with data type
     * @property
     * @name DataTypeConfiguration#instances
     * @type {Array.<*>}
     * @example [ true, false ] are the instances of Boolean data type
     */

    /**
     * Gets an array of super
     * @property
     * @name DataTypeConfiguration#supertypes
     * @type {Array.<string>}
     * @example [ "Integer" ] are the supertypes of NegativeInteger data type
     */

    /**
     * Gets a string which represents the version of this data type configuration
     * @property
     * @name DataTypeConfiguration#version
     * @type {string}
     * @example "1.0"
     */
}

/**
 * @class
 * @constructor
 * @interface
 * @example
 * {
 *  "name":"SQLite Data Adapter",
 *  "invariantName": "sqlite",
 *  "type":"most-data-sqlite"
 * }
 */
function DataAdapterConfiguration() {

    /**
     * Gets a string which represents the name of this data adapter
     * @property
     * @name DataAdapterConfiguration#name
     * @type {string}
     * @example "SQLite Data Adapter"
     */

    /**
     * Gets a string which represents the invariant name of this data adapter
     * @property
     * @name DataAdapterConfiguration#invariantName
     * @type {string}
     * @example "sqlite"
     */

    /**
     * Gets a boolean which indicates whether this adapter is the default adapter or not
     * @property
     * @name DataAdapterConfiguration#default
     * @type {boolean}
     */

    /**
     * Gets a dictionary object which represents the connection options of this data adapter
     * @property
     * @name DataAdapterConfiguration#options
     * @type {*}
     */

}

/**
 * @class
 * @constructor
 * @interface
 * @example
 * {
 *  "name":"SQLite Data Adapter",
 *  "invariantName": "sqlite",
 *  "type":"most-data-sqlite"
 * }
 */
function DataAdapterTypeConfiguration() {

    /**
     * Gets a string which represents the name of this data adapter
     * @property
     * @name DataAdapterTypeConfiguration#name
     * @type {string}
     * @example "SQLite Data Adapter"
     */

    /**
     * Gets a string which represents the invariant name of this data adapter
     * @property
     * @name DataAdapterTypeConfiguration#invariantName
     * @type {string}
     * @example "sqlite"
     */

    /**
     * Gets a string which represents the module that loads this data adapter
     * @property
     * @name DataAdapterTypeConfiguration#type
     * @type {string}
     * @example "@themost/sqlite"
     */

}

/**
 * @class
 * @constructor
 */
function AuthSettingsConfiguration() {
    /**
     * Gets or sets a string which represents the cookie name that is going to be used to identify a user session
     * @type {string}
     */
    this.name = '.MAUTH';
    /**
     * Gets or sets a string which represents the name of unattended execution account
     * @type {string}
     */
    this.unattendedExecutionAccount = RandomUtils.randomHex(16);
    /**
     * Gets or sets a number which represents the lifetime (in minutes) of an authentication cookie
     * @type {number}
     */
    this.timeout = 480;
    /**
     * Gets or sets a boolean which indicates whether an authentication cookie will have a sliding expiration or not
     * @type {boolean}
     */
    this.slidingExpiration = false;
    /**
     * Gets or sets a string which represents the login URI of the current application
     * @type {string}
     */
    this.loginPage = '/login';
}

/**
 * @class
 * @classdesc Holds the configuration of data modeling infrastructure
 * @constructor
 * @param {string=} configPath - The root directory of configuration files. The default directory is the ./config under current working directory
 * @augments ConfigurationBase
 *
 */
function DataConfiguration(configPath) {
    DataConfiguration.super_.bind(this)(configPath);
    //use default data configuration strategy
    this.useStrategy(DataConfigurationStrategy,DataConfigurationStrategy);
}
LangUtils.inherits(DataConfiguration, ConfigurationBase);
/**
 * @returns {DataConfigurationStrategy}
 */
DataConfiguration.prototype.getDataConfiguration = function() {
    return this.getStrategy(DataConfigurationStrategy);
};
/**
 * @returns {DataConfiguration}
 */
DataConfiguration.getCurrent = function() {
    if (DataConfiguration[currentConfiguration] instanceof DataConfiguration) {
        return DataConfiguration[currentConfiguration]
    }
    DataConfiguration[currentConfiguration] = new DataConfiguration();
    return DataConfiguration[currentConfiguration];
};
/**
 * @param DataConfiguration config
 * @returns {DataConfiguration}
 */
DataConfiguration.setCurrent = function(config) {
    Args.check(config instanceof DataConfiguration, 'Invalid argument. Expected an instance of DataConfiguration class.');
    DataConfiguration[currentConfiguration] = config;
    return DataConfiguration[currentConfiguration];
};

/**
 * @param {string=} name
 */
DataConfiguration.getNamedConfiguration = function(name) {
  if (_.isNil(name)) {
      return DataConfiguration.getCurrent();
  }
  Args.notString(name, "Configuration Name");
  Args.notEmpty(name, "Configuration name");
    if (/^current$/i.test(name)) {
        return DataConfiguration.getCurrent();
    }
    if (_.isNil(DataConfiguration[namedConfigurations])) {
        DataConfiguration[namedConfigurations] = { };
    }
    if (typeof DataConfiguration[namedConfigurations][name] !== 'undefined')
        return DataConfiguration[namedConfigurations][name];
    DataConfiguration[namedConfigurations][name] = new DataConfiguration();
    return DataConfiguration[namedConfigurations][name];
};

/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @augments {ConfigurationStrategy}
 */
function DataConfigurationStrategy(config) {

    DataConfigurationStrategy.super_.bind(this)(config);

    ///register other strategies
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
        this.getConfiguration().setSourceAt('settings/auth', new AuthSettingsConfiguration());
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

    /**
     * @property
     * @name DataConfigurationStrategy#dataTypes
     * @type {Object.<string,DataTypeConfiguration>}
     */

    Object.defineProperty(this,'dataTypes', {
        get:function() {
            if (this[dataTypesProperty]) {
                return this[dataTypesProperty];
            }
            //get data types from configuration file
            try {
                var dataTypes = require(path.join(this.getConfiguration().getConfigurationPath(), 'dataTypes.json'));
                if (_.isNil(dataTypes)) {
                    TraceUtils.log('Data: Application data types are empty. The default data types will be loaded instead.');
                    dataTypes = require('./dataTypes.json');
                }
                else {
                    //append default data types which are not defined in application data types
                    var defaultDataTypes = require('./dataTypes.json');
                    //enumerate default data types and replace or append application specific data types
                    _.forEach(_.keys(defaultDataTypes), function(key) {
                        if (dataTypes.hasOwnProperty(key)) {
                            if (dataTypes[key].version) {
                                if (dataTypes[key].version <= defaultDataTypes[key].version) {
                                    //replace data type due to lower version
                                    dataTypes[key] = defaultDataTypes[key];
                                }
                            }
                            else {
                                //replace data type due to invalid version
                                dataTypes[key] = defaultDataTypes[key];
                            }
                        }
                        else {
                            //append data type
                            dataTypes[key] = defaultDataTypes[key];
                        }
                    });
                }
            }
            catch(err) {
                if (err.code === 'MODULE_NOT_FOUND') {
                    TraceUtils.log('Data: Application specific data types are missing. The default data types will be loaded instead.');
                }
                else {
                    TraceUtils.log('Data: An error occurred while loading application data types.');
                    throw err;
                }
                dataTypes = require('./dataTypes.json');
            }
            this[dataTypesProperty] = dataTypes;
            return this[dataTypesProperty];

        }
    });

    /**
     * @property
     * @name DataConfigurationStrategy#adapters
     * @type {Array.<DataAdapterConfiguration>}
     */

    Object.defineProperty(this,'adapters', {
        get:function() {
            return this.getConfiguration().getSourceAt('adapters');
        }
    });

    /**
     * @property
     * @name DataConfigurationStrategy#adapterTypes
     * @type {*}
     */

    Object.defineProperty(this,'adapterTypes', {
        get:function() {
            return this[adapterTypesProperty];
        }
    });


}
LangUtils.inherits(DataConfigurationStrategy,ConfigurationStrategy);

/**
 * @returns {AuthSettingsConfiguration|*}
 */
DataConfigurationStrategy.prototype.getAuthSettings = function() {
    return this.getConfiguration().getSourceAt('settings/auth');
};


/**
 * @param {string} invariantName
 * @returns {*}
 */
DataConfigurationStrategy.prototype.getAdapterType = function(invariantName) {
    return this[adapterTypesProperty][invariantName];
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
 * @returns {*}
 */
DataConfigurationStrategy.prototype.getModelDefinition = function(name) {
    /**
     * @type {SchemaLoaderStrategy}
     */
    var schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
    return schemaLoader.getModelDefinition(name);
};

/**
 * Gets a native object which represents the definition of the model with the given name.
 * @param {*} data
 * @returns {DataConfigurationStrategy}
 */
DataConfigurationStrategy.prototype.setModelDefinition = function(data) {
    /**
     * @type {SchemaLoaderStrategy}
     */
    var schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
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
    const configuration = ConfigurationBase.getCurrent();
    if (!configuration.hasStrategy(DataConfigurationStrategy)) {
        configuration.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
    }
    return configuration.getStrategy(DataConfigurationStrategy);
};


/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @augments ConfigurationStrategy
 */
function SchemaLoaderStrategy(config) {
    SchemaLoaderStrategy.super_.bind(this)(config);
    this[modelsProperty] = {};
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
LangUtils.inherits(SchemaLoaderStrategy,ConfigurationStrategy);

/**
 * Gets a model definition
 * @param {string} name
 * @returns {*}
 */
SchemaLoaderStrategy.prototype.getModelDefinition = function(name) {
    Args.notString(name,'Model name');
    var result = this[modelsProperty][name];
    if (typeof result !== 'undefined') {
        return result;
    }
    var re = new RegExp('^'+name+'$','ig');
    result = _.find(_.keys(this[modelsProperty]), function(x) {
        return re.test(x);
    });
    return result;
};
/**
 * Sets a model definition
 * @param {*} data
 * @returns {SchemaLoaderStrategy}
 */
SchemaLoaderStrategy.prototype.setModelDefinition = function(data) {
    if (_.isNil(data)) {
        throw new Error("Invalid model definition. Expected object.")
    }
    if (typeof data === 'object') {
        if (typeof data.name === 'undefined' || data.name === null) {
            throw new Error("Invalid model definition. Expected model name.")
        }
        this[modelsProperty][data.name] = data;
    }
    return this;
};
/**
 * Gets an array of strings which represents the loaded models
 * @returns {Array.<string>}
 */
SchemaLoaderStrategy.prototype.getModels = function() {
    return _.keys(this[modelsProperty]);
};

/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @augments ConfigurationStrategy
 */
function DefaultSchemaLoaderStrategy(config) {
    DefaultSchemaLoaderStrategy.super_.bind(this)(config);
    this[modelPathProperty] = PathUtils.join(config.getConfigurationPath(), 'models');
}
LangUtils.inherits(DefaultSchemaLoaderStrategy,SchemaLoaderStrategy);

/**
 * Gets a string which represents the directory which contains model definitions.
 * @returns {string}
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
    const getModelDefinitionSuper = DefaultSchemaLoaderStrategy.super_.prototype.getModelDefinition;
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
    const modelPath = this.getModelPath();
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
            var result = require(finalPath);
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
 * @param {ConfigurationBase} config
 * @augments ConfigurationStrategy
 */
function ModelClassLoaderStrategy(config) {
    ModelClassLoaderStrategy.super_.bind(this)(config);
}
LangUtils.inherits(ModelClassLoaderStrategy,ConfigurationStrategy);

/**
 * @param {DataModel} model
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
ModelClassLoaderStrategy.prototype.resolve = function(model) {
    throw new AbstractMethodError();
};

/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @augments ModelClassLoaderStrategy
 */
function DefaultModelClassLoaderStrategy(config) {
    DefaultModelClassLoaderStrategy.super_.bind(this)(config);
}
LangUtils.inherits(DefaultModelClassLoaderStrategy,ModelClassLoaderStrategy);

/**
 * @param {DataModel} model
 * @returns {Function}
 */
DefaultModelClassLoaderStrategy.prototype.resolve = function(model) {
    Args.notNull(model, 'Model');
    var dataObjectClassProperty = 'DataObjectClass';
    var DataObjectClass = this[dataObjectClassProperty];
    if (_.isFunction(DataObjectClass)) {
        return DataObjectClass;
    }
    //get model definition
    const modelDefinition = this.getConfiguration().getStrategy(SchemaLoaderStrategy).getModelDefinition(model.name);
    if (typeof model.classPath === 'string') {
        modelDefinition[dataObjectClassProperty] = DataObjectClass = require(self.classPath);
    }
    else {
        //try to find module by using capitalize naming convention
        // e.g. OrderDetail -> OrderDetailModel.js
        var classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',model.name.concat('Model.js'));
        try {
            modelDefinition[dataObjectClassProperty] = DataObjectClass = require(classPath);
        }
        catch(err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                try {
                    //try to find module by using dasherize naming convention
                    // e.g. OrderDetail -> order-detail-model.js
                    classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',_.dasherize(model.name).concat('-model.js'));
                    modelDefinition[dataObjectClassProperty] = DataObjectClass = require(classPath);
                }
                catch(err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        if (typeof this['inherits'] === 'undefined' || this['inherits'] === null) {
                            //use default DataObject class
                            modelDefinition[dataObjectClassProperty] = DataObjectClass = require('./data-object').DataObject;
                        }
                        else {
                            modelDefinition[dataObjectClassProperty] = DataObjectClass = this.resolve(model.base());
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

var cfg = {

};

Object.defineProperty(cfg, 'current', {
    get: function() {
        return DataConfiguration.getCurrent();
    }, configurable:false, enumerable:false
    });
/**
 * Gets the current data configuration
 * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
 */
cfg.getCurrent = function() {
    return DataConfiguration.getCurrent();
};
/**
 * Sets the current data configuration
 * @param {DataConfiguration} configuration
 * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
 */
cfg.setCurrent = function(configuration) {
    return DataConfiguration.setCurrent(configuration);
};
/**
 * Creates an instance of DataConfiguration class
 * @returns {DataConfiguration} - Returns an instance of DataConfiguration class
 */
cfg.createInstance= function() {
    return new DataConfiguration();
};

/**
 * Gets an instance of DataConfiguration class based on the given name.
 * If the named data configuration does not exists, it will create a new instance of DataConfiguration class with the given name.
 * @param {string} name - A string which represents the name of the data configuration
 * @returns {DataConfiguration}
 */
cfg.getNamedConfiguration = function(name) {
    return DataConfiguration.getNamedConfiguration(name);
};

cfg.DataTypePropertiesConfiguration = DataTypePropertiesConfiguration;
cfg.DataTypeConfiguration = DataTypeConfiguration;
cfg.DataAdapterTypeConfiguration = DataAdapterTypeConfiguration;
cfg.DataAdapterConfiguration = DataAdapterConfiguration;
cfg.AuthSettingsConfiguration = AuthSettingsConfiguration;
cfg.DataConfiguration = DataConfiguration;
cfg.DataConfigurationStrategy = DataConfigurationStrategy;
cfg.SchemaLoaderStrategy = SchemaLoaderStrategy;
cfg.DefaultSchemaLoaderStrategy = DefaultSchemaLoaderStrategy;
cfg.ModelClassLoaderStrategy = ModelClassLoaderStrategy;
cfg.DefaultModelClassLoaderStrategy = DefaultModelClassLoaderStrategy;

module.exports = cfg;
