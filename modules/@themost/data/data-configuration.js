/**
 * @ignore
 */
var _ = require("lodash");
var sprintf = require('sprintf').sprintf;
var Symbol = require('symbol');
var log = require('./data-common').log;
var path = require("path");
var fs = require("fs");
var ModuleLoader = require('./module-loader').ModuleLoader;
var DefaultModuleLoader = require('./module-loader').DefaultModuleLoader;
var configPathProperty = Symbol('configPath');
var executionPathProperty = Symbol('executionPath');
var moduleLoaderProperty = Symbol('moduleLoader');

/**
 * @ignore
 * @class
 * @constructor
 * @property {string} name
 * @property {string} defaultUserGroup
 * @property {string} unattendedExecutionAccount
 * @property {number} timeout
 * @property {boolean} slidingExpiration
 * @property {string} loginPage
 */
// noinspection JSUnusedGlobalSymbols
// eslint-disable-next-line no-unused-vars
function DataConfigurationAuth() {
    //
}

/**
 * @classdesc Holds the configuration of data modeling infrastructure
 * @class
 * @constructor
 * @param {string=} configPath - The root directory of configuration files. The default directory is the ./config under current working directory
 * @property {DataConfigurationAuth} auth
 *
 */
function DataConfiguration(configPath) {

    if (typeof configPath !== 'undefined') {
        if (!_.isString(configPath)) {
            throw new TypeError('Configuration path must be a string.');
        }
        //validate path
        if (!path.isAbsolute(configPath)) {
            throw new TypeError('Configuration path must be an absolute path.');
        }
    }

    //resolve configuration path
    this[configPathProperty] = configPath || path.join(process.cwd(),'config');
    //init default module loader
    this[moduleLoaderProperty] = new DefaultModuleLoader(path.resolve(this[configPathProperty], ".."));

    /**
     * Model caching object (e.g. cfg.models.Migration, cfg.models.User etc)
     * @type {*}
     * @ignore
     */
    this.models = {
        "Migration":require("./migration.json")
    };

    /**
     * @type {*}
     * @private
     */
    var dataTypes = null;
    /**
     * Gets or sets an array of items that indicates all the data types that is going to be used in data modeling.
     * @type {*}
     */
    Object.defineProperty(this, 'dataTypes', {
        get: function()
        {
            if (dataTypes)
                return dataTypes;
            //get data types from configuration file
            try {
                dataTypes = require(path.join(this.getConfigurationPath(), 'dataTypes.json'));
                if (_.isNil(dataTypes)) {
                    log('Data: Application data types are empty. The default data types will be loaded instead.');
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
            catch(e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    log('Data: Application specific data types are missing. The default data types will be loaded instead.');
                }
                else {
                    log('Data: An error occurred while loading application data types.');
                    throw e;
                }
                dataTypes = require('./dataTypes.json');
            }
            return dataTypes;
        }
    });

    //get application adapter types, if any
    var config;
    try {
        var env = process.env['NODE_ENV'] || 'production';
        config = require(path.join(this.getConfigurationPath(), 'app.' + env + '.json'));
    }
    catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            log('Data: The environment specific configuration cannot be found or is inaccesible.');
            try {
                config = require(path.join(this.getConfigurationPath(), 'app.json'));
            }
            catch(e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    log('Data: The default application configuration cannot be found or is inaccesible.');
                }
                else {
                    log('Data: An error occurred while trying to open default application configuration.');
                    log(e);
                }
                config = { adapters:[], adapterTypes:[]  };
            }
        }
        else {
            log('Data: An error occurred while trying to open application configuration.');
            log(e);
            config = { adapters:[], adapterTypes:[]  };
        }
    }

    /**
     * @type {Array}
     * @private
     */
    var adapters;
    Object.defineProperty(this, 'adapters', {
        get: function()
        {
            if (adapters)
                return adapters;
            /**
             * get data types from configuration file
             * @property {Array} adapters
             * @type {*}
             */
            adapters = config.adapters || [];
            return adapters;
        }
    });

    var adapterTypes = { };

    if (config.adapterTypes) {
        if (_.isArray(config.adapterTypes)) {
            config.adapterTypes.forEach(function(x) {
                //first of all validate module
                x.invariantName = x.invariantName || 'unknown';
                x.name = x.name || 'Unknown Data Adapter';
                var valid = false, adapterModule;
                if (x.type) {
                    try {
                        adapterModule = require(x.type);
                        if (typeof adapterModule.createInstance === 'function') {
                            valid = true;
                        }
                        else {
                            //adapter type does not export a createInstance(options) function
                            log(sprintf("The specified data adapter type (%s) does not have the appropriate constructor. Adapter type cannot be loaded.", x.invariantName));
                        }
                    }
                    catch(e) {
                        //catch error
                        log(e);
                        //and log a specific error for this adapter type
                        log(sprintf("The specified data adapter type (%s) cannot be instantiated. Adapter type cannot be loaded.", x.invariantName));
                    }
                    if (valid) {
                        //register adapter
                        adapterTypes[x.invariantName] = {
                            invariantName:x.invariantName,
                            name: x.name,
                            createInstance:adapterModule.createInstance
                        };
                    }
                }
                else {
                    log(sprintf("The specified data adapter type (%s) does not have a type defined. Adapter type cannot be loaded.", x.invariantName));
                }
            });
        }
    }

    Object.defineProperty(this, 'adapterTypes', {
        get: function()
        {
            return adapterTypes;
        }
    });

    var auth;
    Object.defineProperty(this, 'auth', {
        get: function()
        {
            try {
                if (auth) { return auth; }
                if (typeof config.settings === 'undefined' || config.settings=== null) {
                    auth = config.auth || {};
                    return auth;
                }
                auth = config.settings.auth || {};
                return auth;
            }
            catch(e) {
                log('An error occurred while trying to load auth configuration');
                auth = {};
                return auth;
            }
        }
    });

    //ensure authentication settings
    config.settings = config.settings || { };
    config.settings.auth = config.settings.auth || { };
    this.getAuthSettings = function() {
        try {
            return config.settings.auth;
        }
        catch(e) {
            var er = new Error('An error occurred while trying to load auth configuration');
            er.code = "ECONF";
            throw er;
        }
    };
    
    var path_ = path.join(this.getConfigurationPath(),'models');

    /**
     * Gets a string which represents the path where schemas exist. The default location is the config/models folder. 
     * @returns {string}
     */
    this.getModelPath = function() {
        return path_;
    };
    // noinspection JSUnusedGlobalSymbols
    /**
     * Sets a string which represents the path where schemas exist.
     * @param p
     * @returns {DataConfiguration}
     */
    this.setModelPath = function(p) {
        path_ = p;   
        return this;
    };
    /**
     * Sets a data model definition in application storage.
     * Use this method in order to override default model loading process.
     * @param {*} data - A generic object which represents a model definition
     * @returns {DataConfiguration}
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
    this.setModelDefinition = function(data) {
        if (_.isNil(data)) {
            throw new Error("Invalid model definition. Expected object.")
        }
        if (typeof data === 'object') {
            if (typeof data.name === 'undefined' || data.name === null) {
                throw new Error("Invalid model definition. Expected model name.")
            }
            this.models[data.name] = data;
        }
      return this;
    };
    /**
     * Gets a native object which represents the definition of the model with the given name.
     * @param {string} name
     * @returns {DataModel|undefined}
     */
    this.getModelDefinition = function(name) {
        if (_.isNil(name)) {
            return;
        }
        if (typeof name === 'string') {
            return this.model(name);
        }
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Gets a boolean which indicates whether the specified data type is defined in data types collection or not.
     * @param name
     * @returns {boolean}
     */
    this.hasDataType = function(name) {
        if (_.isNil(name)) {
            return false;
        }
        if (typeof name !== 'string') {
            return false;
        }
        return this.dataTypes.hasOwnProperty(name);
    }

}

/**
 * Gets the current module loader
 * @returns {ModuleLoader}
 */
DataConfiguration.prototype.getModuleLoader = function() {
    return this[moduleLoaderProperty];
};

/**
 * @param {ModuleLoader} loader
 * @returns {DataConfiguration}
 */
DataConfiguration.prototype.useModuleLoader = function(loader) {
    if (loader instanceof ModuleLoader) {
        this[moduleLoaderProperty] = loader;
        return this;
    }
    throw new TypeError('Module loader must be an instance of ModuleLoader class');
};



/**
 * Gets the configuration root directory
 * @returns {string}
 */
DataConfiguration.prototype.getConfigurationPath = function() {
    return this[configPathProperty];
};

/**
 * Gets the configuration root directory
 * @returns {string}
 */
DataConfiguration.prototype.getExecutionPath = function() {
    return this[executionPathProperty];
};

/**
 * @returns {*}
 * @param name {string}
 */
DataConfiguration.prototype.model = function(name)
{
    var self = this, i;
    if (typeof name !== 'string')
        return null;
    //first of all try to find if model definition is already in cache
    if (typeof this.models[name] !== 'undefined')
    //and return it
        return this.models[name];
    //otherwise try to find model with case insensitivity
    var keys = Object.keys(this.models), mr = new RegExp('^' + name + '$','i');
    for (i = 0; i < keys.length; i++) {
        mr.lastIndex=0;
        if (mr.test(keys[i]))
            return this.models[keys[i]];
    }
    //otherwise open definition file
    var modelPath = this.getModelPath();
    if (!fs.existsSync(modelPath)) {
        //models folder does not exist
        //so set model to null
        this.models[name]=null;
        //and return
        return null;
    }
    //read files from models directory
    var files;
    //store file list in a private variable
    if (typeof this._files === 'undefined') { this._files = fs.readdirSync(modelPath); }
    //and finally get this list of file
    files = this._files;
    if (files.length===0)
        return null;
    var r = new RegExp('^' + name.concat('.json') + '$','i');
    for (i = 0; i < files.length; i++) {
        r.lastIndex=0;
        if (r.test(files[i])) {
            //build model file path
            var finalPath = path.join(modelPath, files[i]);
            //get model
            var result = require(finalPath), finalName = result.name;
            //cache model definition
            self.models[finalName] = result;
            //and finally return this definition
            return result;
        }
    }
    return null;

};

/**
 * @private
 */
var namedConfigurations_ = { };

var cfg = {

};
/**
 * @type DataConfiguration
 * @private
 */
var cfg_;
Object.defineProperty(cfg, 'current', {
    get: function() {
        if (cfg_)
            return cfg_;
        cfg_ = new DataConfiguration();
        return cfg_;
    }, configurable:false, enumerable:false
    });
/**
 * Gets the current data configuration
 * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
 */
cfg.getCurrent = function() {
    return this.current;
};
/**
 * Sets the current data configuration
 * @param {DataConfiguration} configuration
 * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
 */
cfg.setCurrent = function(configuration) {
    if (configuration instanceof DataConfiguration) {
        cfg_ = configuration;
        return cfg_;
    }
    throw new TypeError('Invalid argument. Expected an instance of DataConfiguration class.');
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
    if (typeof name !== 'string') {
        throw new Error("Invalid configuration name. Expected string.");
    }
    if (name.length === 0) {
        throw new Error("Invalid argument. Configuration name may not be empty string.");
    }
    if (/^current$/i.test(name)) {
        return cfg.current;
    }
    if (typeof namedConfigurations_[name] !== 'undefined')
        return namedConfigurations_[name];
    namedConfigurations_[name] = new DataConfiguration();
    return namedConfigurations_[name];
};

cfg.DataConfiguration = DataConfiguration;

module.exports = cfg;
