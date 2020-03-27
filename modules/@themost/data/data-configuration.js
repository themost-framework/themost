/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var _ = require('lodash');
var Symbol = require('symbol');
var TraceUtils = require('@themost/common/utils').TraceUtils;
var path = require("path");
var pluralize = require('pluralize');
var LangUtils = require('@themost/common/utils').LangUtils;
var Args = require('@themost/common/utils').Args;
var ConfigurationBase = require('@themost/common/config').ConfigurationBase;
var ConfigurationStrategy = require('@themost/common/config').ConfigurationStrategy;
var PathUtils = require('@themost/common/utils').PathUtils;
var RandomUtils = require('@themost/common/utils').RandomUtils;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;
var DataCacheStrategy = require('./data-cache').DataCacheStrategy;
var DefaultDataCacheStrategy = require('./data-cache').DefaultDataCacheStrategy;
var hasOwnProperty = require('./has-own-property').hasOwnProperty;
var ModuleLoader = require('./module-loader').ModuleLoader;
var DefaultModuleLoader = require('./module-loader').DefaultModuleLoader;

var modelsProperty = Symbol('models');
var modelPathProperty = Symbol('modelPath');
var filesProperty = Symbol('files');
var dataTypesProperty = Symbol('dataTypes');
var adapterTypesProperty =  Symbol('adapterTypes');
var currentConfiguration = Symbol('current');
var namedConfigurations = Symbol('namedConfigurations');

function interopRequireDefault(path) {
    var obj = require(path);
    return obj && obj.__esModule ? obj['default'] : obj;
}

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
     * @name DataTypePropertiesConfiguration#pattern
     * @type {string}
     * @example "^[-][0-9]*$" is the pattern of NegativeInteger data type
     */

    /**
     * Gets a message that describes the pattern of this data type
     * @name DataTypePropertiesConfiguration#patternMessage
     * @type {string}
     * @example "The value should be an integer lower than zero."
     */

    /**
     * Gets the minimum value allowed for a data type
     * @name DataTypePropertiesConfiguration#minValue
     * @type {*}
     * @example 0 is the minimum value of NonNegativeInteger data type
     */

    /**
     * Gets the maximum value allowed for a data type
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
     * @name DataTypeConfiguration#comment
     * @type {string}
     * @example "Float data type is a single-precision 32-bit floating point."
     */

    /**
     * Gets a collection of additional properties of this data type
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
     * @name DataTypeConfiguration#label
     * @type {string}
     * @example "Float"
     */

    /**
     * Gets a string which represents a URL that contains information for this data type
     * @name DataTypeConfiguration#url
     * @type {string}
     * @example "https://www.w3.org/TR/xmlschema-2/#float"
     */

    /**
     * Gets a type which is associated with this data type
     * @name DataTypeConfiguration#type
     * @type {string}
     * @example "number"
     */

    /**
     * Gets the equivalent SQL data type
     * @name DataTypeConfiguration#sqltype
     * @type {string}
     * @example "FLOAT"
     */

    /**
     * Gets an array of values associated with data type
     * @name DataTypeConfiguration#instances
     * @type {Array.<*>}
     * @example [ true, false ] are the instances of Boolean data type
     */

    /**
     * Gets an array of super
     * @name DataTypeConfiguration#supertypes
     * @type {Array.<string>}
     * @example [ "Integer" ] are the supertypes of NegativeInteger data type
     */

    /**
     * Gets a string which represents the version of this data type configuration
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
     * @name DataAdapterConfiguration#name
     * @type {string}
     * @example "SQLite Data Adapter"
     */

    /**
     * Gets a string which represents the invariant name of this data adapter
     * @name DataAdapterConfiguration#invariantName
     * @type {string}
     * @example "sqlite"
     */

    /**
     * Gets a boolean which indicates whether this adapter is the default adapter or not
     * @name DataAdapterConfiguration#default
     * @type {boolean}
     */

    /**
     * Gets a dictionary object which represents the connection options of this data adapter
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
     * @name DataAdapterTypeConfiguration#name
     * @type {string}
     * @example "SQLite Data Adapter"
     */

    /**
     * Gets a string which represents the invariant name of this data adapter
     * @name DataAdapterTypeConfiguration#invariantName
     * @type {string}
     * @example "sqlite"
     */

    /**
     * Gets a string which represents the module that loads this data adapter
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

    if (!config.hasStrategy(DataCacheStrategy)) {
        //process is running under node js
        if (typeof process !== "undefined" && process.nextTick) {
            //add default cache strategy (using node-cache)
            config.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        }
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
                if (/^@themost\//.test(x.type)) {
                    //get require paths
                    if (require.resolve && require.resolve.paths) {
                        /**
                         * get require paths collection
                         * @type string[]
                         */
                        var paths = require.resolve.paths(x.type);
                        //get execution
                        var path1 = self.getConfiguration().getExecutionPath();
                        //loop directories to parent (like classic require)
                        while (path1) {
                            //if path does not exist in paths collection
                            if (paths.indexOf(path.resolve(path1,'node_modules'))<0) {
                                //add it
                                paths.push(path.resolve(path1,'node_modules'));
                                //and check the next path which is going to be resolved
                                if (path1 === path.resolve(path1,'..')) {
                                    //if it is the same with the current path break loop
                                    break;
                                }
                                //otherwise get parent path
                                path1 = path.resolve(path1,'..');
                            }
                            else {
                                //path already exists in paths collection, so break loop
                                break;
                            }
                        }
                        var adapterModulePath = require.resolve(x.type, {
                            paths:paths
                        });
                        adapterModule = require(adapterModulePath);
                    }
                    else {
                        adapterModule = require(x.type);
                    }
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
                        if (hasOwnProperty(dataTypes, key)) {
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
     * @name DataConfigurationStrategy#adapters
     * @type {Array.<DataAdapterConfiguration>}
     */

    Object.defineProperty(this,'adapters', {
        get:function() {
            return this.getConfiguration().getSourceAt('adapters');
        }
    });

    /**
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
    return hasOwnProperty(this.dataTypes, name);
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
    if (data == null) {
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
 * @abstract
 * @returns Array<string>
 */
SchemaLoaderStrategy.prototype.readSync = function() {
    throw new AbstractMethodError();
};
/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @augments ConfigurationStrategy
 */
function FileSchemaLoaderStrategy(config) {
    FileSchemaLoaderStrategy.super_.bind(this)(config);
    // set default path for *.json schemas
    this[modelPathProperty] = PathUtils.join(config.getConfigurationPath(), 'models');
    /**
     * @type {DefaultSchemaLoaderStrategyOptions}
     */
    var schemaOptions = config.getSourceAt('settings/schema');
    /**
     * set default options
     * @type {DefaultSchemaLoaderStrategyOptions}
     */
    this.options = {
        usePlural: true
    };
    // get only DefaultSchemaLoaderStrategyOptions.usePlural if exists
    if (schemaOptions && hasOwnProperty(schemaOptions, 'usePlural')) {
        this.options.usePlural = schemaOptions.usePlural;
    }
}
LangUtils.inherits(FileSchemaLoaderStrategy,SchemaLoaderStrategy);

/**
 * Gets a string which represents the directory which contains model definitions.
 * @returns {string}
 */
FileSchemaLoaderStrategy.prototype.getModelPath = function() {
    return this[modelPathProperty];
};
/**
 * Reads available schemas
 * @returns {Array<string>}
 */
FileSchemaLoaderStrategy.prototype.readSync = function() {
    // load native fs module
    var nativeFsModule = 'fs';
    var modelPath = this.getModelPath();
    var fs = require(nativeFsModule);
    var files = [];
    // read directory
    if (typeof fs.readdirSync === 'function') {
        var dirExists = true;
        if (typeof fs.existsSync === 'function') {
            dirExists = fs.existsSync(modelPath);
        }
        if (dirExists) {
            // set files property
            files = _.map(_.filter(fs.readdirSync(modelPath), function(file) {
                // filter *.json files
                return /\.json$/i.test(file);
            }), function(file) {
                //strip file extension
                return file.replace(/\.json$/i, '');
            });
        }
    }
    // return collection of schemas
    return files;
};

/**
 * Sets the directory of model definitions.
 * @param {string} p
 * @returns {DefaultSchemaLoaderStrategy}
 */
FileSchemaLoaderStrategy.prototype.setModelPath = function(p) {
    this[modelPathProperty] = p;
    return this;
};

/**
 * Gets a model definition
 * @param {string} name
 * @returns {*}
 */
FileSchemaLoaderStrategy.prototype.getModelDefinition = function(name) {
    var getModelDefinitionSuper = FileSchemaLoaderStrategy.super_.prototype.getModelDefinition;
    var i;
    if (typeof name !== 'string')
        return;
    //exclude registered data types
    if (this.getConfiguration().getStrategy(DataConfigurationStrategy).hasDataType(name)) {
        return;
    }
    var modelDefinition = getModelDefinitionSuper.bind(this)(name);
    //first of all try to find if model definition is already in cache
    if (modelDefinition) {
        //and return it
        return modelDefinition;
    }
    // hold singular name of
    var singularName;
    if (this.options.usePlural &&  pluralize.isPlural(name)) {
        // try to find model based on singular name
        singularName = pluralize.singular(name);
        // call super func
        modelDefinition = getModelDefinitionSuper.bind(this)(singularName);
        if (modelDefinition) {
            //and return it
            return modelDefinition;
        }
    }
    if (this[filesProperty] == null) {
        this[filesProperty] = this.readSync().map( file => {
            return file.concat('.json')
        });
    }
    /**
     * @type Array<string>
     */
    var files = this[filesProperty];
    if (files.length===0) {
        return;
    }
    var modelPath = this.getModelPath();
    var searchName;
    if (singularName) {
        // search for singular name also e.g. ^(User|Users)\.json$
        searchName = new RegExp('^(' + singularName + '|' + name + ')\\.json$','i');
    }
    else {
        // otherwise search for name e.g. ^User\.json$
        searchName = new RegExp('^' + name + '\\.json$','i');
    }
    for (i = 0; i < files.length; i++) {
        searchName.lastIndex=0;
        if (searchName.test(files[i])) {
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
function DefaultSchemaLoaderStrategy(config) {
    DefaultSchemaLoaderStrategy.super_.bind(this)(config);
    this[modelPathProperty] = PathUtils.join(config.getConfigurationPath(), 'models');
    /**
     * @type {Array<SchemaLoaderStrategy>}
     */
    this.loaders = [];
    /**
     * get loaders from configuration
     * @type {DefaultSchemaLoaderStrategyOptions}
     * @example
     * [
     *      {
     *          "loaderType": "any-library#CustomSchemaLoader"
     *      },
     *      {
     *          "loaderType": "another-library#AnotherSchemaLoader"
     *      }
     * ]
     */
    var schemaOptions = config.getSourceAt('settings/schema');
    /**
     * prepare options
     * @type {DefaultSchemaLoaderStrategyOptions}
     */
    this.options = _.assign({}, {
        usePlural: true
    }, schemaOptions);
    // set loaders
    var thisArg = this;
    // if configuration has a collection of loaders
    if (this.options.loaders && this.options.loaders.length) {
        // get module loader service
        var moduleLoader = config.getStrategy(ModuleLoader);
        if (moduleLoader == null) {
            moduleLoader = new DefaultModuleLoader(config.getExecutionPath());
        }
        // enumerate loader types
        _.forEach(this.options.loaders, function(x) {
            // if loader has a hash e.g. ./lib/index#AnotherLoader
            var hashIndex = x.loaderType.indexOf('#');
            if (hashIndex>-1) {
                // get loader module
                var typeModule = moduleLoader.require(x.loaderType.substr(0,hashIndex));
                // get loader constructor
                var typeCtor = x.loaderType.substr(hashIndex+1,x.loaderType.length-hashIndex);
                // if module exports loader constructor
                if (hasOwnProperty(typeModule, typeCtor)) {
                    var LoaderCtor = typeModule[typeCtor];
                    // add loader to collection
                    thisArg.loaders.push(new LoaderCtor(config));
                }
            }
            else {
                // simply add module to collection of loaders
                // we assume that module exports the required methods
                // and acts like an instance of SchemaLoader class
                thisArg.loaders.push(moduleLoader.require(x.loaderType));
            }
        });
    }

}
LangUtils.inherits(DefaultSchemaLoaderStrategy,FileSchemaLoaderStrategy);

/**
 * Gets a model definition
 * @param {string} name
 * @returns {*}
 */
DefaultSchemaLoaderStrategy.prototype.getModelDefinition = function(name) {
    // get super class method
    var getModelDefinitionSuper = DefaultSchemaLoaderStrategy.super_.prototype.getModelDefinition;
    // execute method
    var model =  getModelDefinitionSuper.bind(this)(name);
    // if model is missing
    if (model == null) {
        // try to load model from alternative loaders if any
        if (this.loaders && this.loaders.length) {
            for (let i = 0; i < this.loaders.length; i++) {
                /**
                 * @type {SchemaLoaderStrategy}
                 */
                var loader = this.loaders[i];
                // try to get model
                model = loader.getModelDefinition(name);
                // if model exists
                if (model != null) {
                    // set model definition to avoid searching loaders again
                    this.setModelDefinition(model);
                    // and return
                    return model;
                }
            }
        }
    }
    return model;
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
    // get data object class from the given model
    var DataObjectClass = model.DataObjectClass;
    // if DataObjectClass is a constructor
    if (typeof DataObjectClass === 'function') {
        return DataObjectClass;
    }
    //get model definition
    var modelDefinition = this.getConfiguration().getStrategy(SchemaLoaderStrategy).getModelDefinition(model.name);
    if (typeof model.classPath === 'string') {
        if (/^\.\//.test(model.classPath)) {
            modelDefinition[dataObjectClassProperty] = DataObjectClass = interopRequireDefault(PathUtils.join(this.getConfiguration().getExecutionPath(),model.classPath));
        }
        else {
            modelDefinition[dataObjectClassProperty] = DataObjectClass = interopRequireDefault(model.classPath);
        }
    }
    else {
        //try to find module by using capitalize naming convention
        // e.g. OrderDetail -> OrderDetailModel.js
        var classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',model.name.concat('Model'));
        try {
            modelDefinition[dataObjectClassProperty] = DataObjectClass = interopRequireDefault(classPath);
        }
        catch(err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                try {
                    //try to find module by using dasherize naming convention
                    // e.g. OrderDetail -> order-detail-model.js
                    classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',_.dasherize(model.name).concat('-model'));
                    modelDefinition[dataObjectClassProperty] = DataObjectClass = interopRequireDefault(classPath);
                }
                catch(err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        if (_.isNil(model['inherits'])) {
                            if (_.isNil(model['implements'])) {
                                //use default DataObject class
                                modelDefinition[dataObjectClassProperty] = DataObjectClass = interopRequireDefault('./data-object').DataObject;
                            }
                            else {
                                //use implemented data model class
                                modelDefinition[dataObjectClassProperty] = DataObjectClass = this.resolve(model.context.model(model['implements']));
                            }
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

/**
 * Gets the current data configuration
 * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
 */
function getCurrent() {
    return DataConfiguration.getCurrent();
}
/**
 * Sets the current data configuration
 * @param {DataConfiguration} configuration
 * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
 */
function setCurrent(configuration) {
    return DataConfiguration.setCurrent(configuration);
}
/**
 * Creates an instance of DataConfiguration class
 * @returns {DataConfiguration} - Returns an instance of DataConfiguration class
 */
function createInstance() {
    return new DataConfiguration();
}

/**
 * Gets an instance of DataConfiguration class based on the given name.
 * If the named data configuration does not exists, it will create a new instance of DataConfiguration class with the given name.
 * @param {string} name - A string which represents the name of the data configuration
 * @returns {DataConfiguration}
 */
function getNamedConfiguration(name) {
    return DataConfiguration.getNamedConfiguration(name);
}

module.exports = {
    getCurrent,
    setCurrent,
    createInstance,
    getNamedConfiguration,
    DataTypePropertiesConfiguration,
    DataTypeConfiguration,
    DataAdapterTypeConfiguration,
    DataAdapterConfiguration,
    AuthSettingsConfiguration,
    DataConfiguration,
    DataConfigurationStrategy,
    SchemaLoaderStrategy,
    FileSchemaLoaderStrategy,
    DefaultSchemaLoaderStrategy,
    ModelClassLoaderStrategy,
    DefaultModelClassLoaderStrategy
};
