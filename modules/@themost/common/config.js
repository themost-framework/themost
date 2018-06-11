/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _ = require('lodash');
var Symbol = require('symbol');
var LangUtils = require("./utils").LangUtils;
var Args = require('./utils').Args;
var TraceUtils = require('./utils').TraceUtils;
var PathUtils = require('./utils').PathUtils;
var AbstractClassError = require('./errors').AbstractClassError;

var configProperty = Symbol('config');
var currentConfiguration = Symbol('current');
var configPathProperty = Symbol('configurationPath');
var executionPathProperty = Symbol('executionPath');
var strategiesProperty = Symbol('strategies');

/**
 * @class Represents an application configuration
 * @param {string=} configPath
 * @property {*} settings
 * @constructor
 */
function ConfigurationBase(configPath) {
    //init strategies
    this[strategiesProperty] = { };

    this[configPathProperty] = configPath || PathUtils.join(process.cwd(),'config');
    TraceUtils.debug('Initializing configuration under %s.', this[configPathProperty]);

    this[executionPathProperty] = PathUtils.join(this[configPathProperty],'..');
    TraceUtils.debug('Setting execution path under %s.', this[executionPathProperty]);

    //load default module loader strategy
    this.useStrategy(ModuleLoaderStrategy, DefaultModuleLoaderStrategy);

    //get configuration source
    var configSourcePath;
    try {
        var env = 'production';
        //node.js mode
        if (process && process.env) {
            env = process.env['NODE_ENV'] || 'production';
        }
        //browser mode
        else if (window && window.env) {
            env = window.env['BROWSER_ENV'] || 'production';
        }
        configSourcePath = PathUtils.join(this[configPathProperty], 'app.' + env + '.json');
        TraceUtils.debug('Validating environment configuration source on %s.', configSourcePath);
        this[configProperty] = require(configSourcePath);
    }
    catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            TraceUtils.log('The environment specific configuration cannot be found or is inaccesible.');
            try {
                configSourcePath = PathUtils.join(this[configPathProperty], 'app.json');
                TraceUtils.debug('Validating application configuration source on %s.', configSourcePath);
                this[configProperty] = require(configSourcePath);
            }
            catch(err) {
                if (err.code === 'MODULE_NOT_FOUND') {
                    TraceUtils.log('The default application configuration cannot be found or is inaccesible.');
                }
                else {
                    TraceUtils.error('An error occured while trying to open default application configuration.');
                    TraceUtils.error(err);
                }
                TraceUtils.debug('Initializing empty configuration');
                this[configProperty] = { };
            }
        }
        else {
            TraceUtils.error('An error occured while trying to open application configuration.');
            TraceUtils.error(err);
            //load default configuration
            this[configProperty] = { };
        }
    }
    //initialize settings object
    this[configProperty]['settings'] = this[configProperty]['settings'] || { };

    /**
     * @name ConfigurationBase#settings
     * @type {*}
     */

    Object.defineProperty(this, 'settings',{
        get: function() {
            return this[configProperty]['settings'];
    },
        enumerable:true,
        configurable:false});

}
//noinspection JSUnusedGlobalSymbols
/**
 * Returns the configuration source object
 * @returns {*}
 */
ConfigurationBase.prototype.getSource = function() {
    return this[configProperty];
};
//noinspection JSUnusedGlobalSymbols
/**
 * Returns the source configuration object based on the given path (e.g. settings.auth.cookieName or settings/auth/cookieName)
 * @param {string} p - A string which represents an object path
 * @returns {Object|Array}
 */
ConfigurationBase.prototype.getSourceAt = function(p) {
    return _.at(this[configProperty],p.replace(/\//g,'.'))[0];
};
//noinspection JSUnusedGlobalSymbols
/**
 * Returns a boolean which indicates whether the specified  object path exists or not (e.g. settings.auth.cookieName or settings/auth/cookieName)
 * @param {string} p - A string which represents an object path
 * @returns {boolean}
 */
ConfigurationBase.prototype.hasSourceAt = function(p) {
    return _.isObject(_.at(this[configProperty],p.replace(/\//g,'.'))[0]);
};
//noinspection JSUnusedGlobalSymbols
/**
 * Sets the config value to the specified object path (e.g. settings.auth.cookieName or settings/auth/cookieName)
 * @param {string} p - A string which represents an object path
 * @param {*} value
 * @returns {Object}
 */
ConfigurationBase.prototype.setSourceAt = function(p, value) {
    return _.set(this[configProperty], p.replace(/\//g,'.'), value);
};
//noinspection JSUnusedGlobalSymbols
/**
 * Sets the current execution path
 * @param {string} p
 * @returns ConfigurationBase
 */
ConfigurationBase.prototype.setExecutionPath = function(p) {
    this[executionPathProperty] = p;
    return this;
};

/**
 * Gets the current execution path
 * @returns {string}
 */
ConfigurationBase.prototype.getExecutionPath = function() {
    return this[executionPathProperty];
};

/**
 * Gets the current configuration path
 * @returns {string}
 */
ConfigurationBase.prototype.getConfigurationPath = function() {
    return this[configPathProperty];
};

/**
 * Register a configuration strategy
 * @param {Function} configStrategyCtor
 * @param {Function} strategyCtor
 * @returns ConfigurationBase
 */
ConfigurationBase.prototype.useStrategy = function(configStrategyCtor, strategyCtor) {
    Args.notFunction(configStrategyCtor,"Configuration strategy constructor");
    Args.notFunction(strategyCtor,"Strategy constructor");
    this[strategiesProperty]["$".concat(configStrategyCtor.name)] = new strategyCtor(this);
    return this;
};
//noinspection JSUnusedGlobalSymbols
/**
 * Gets a configuration strategy
 * @param {Function} configStrategyCtor
 */
ConfigurationBase.prototype.getStrategy = function(configStrategyCtor) {
    Args.notFunction(configStrategyCtor,"Configuration strategy constructor");
    return this[strategiesProperty]["$".concat(configStrategyCtor.name)];
};

/**
 * Gets a configuration strategy
 * @param {Function} configStrategyCtor
 */
ConfigurationBase.prototype.hasStrategy = function(configStrategyCtor) {
    Args.notFunction(configStrategyCtor,"Configuration strategy constructor");
    return typeof this[strategiesProperty]["$".concat(configStrategyCtor.name)] !== 'undefined';
};

/**
 * Gets the current configuration
 * @returns ConfigurationBase - An instance of DataConfiguration class which represents the current data configuration
 */
ConfigurationBase.getCurrent = function() {
    if (_.isNil(ConfigurationBase[currentConfiguration])) {
        ConfigurationBase[currentConfiguration] = new ConfigurationBase();
    }
    return ConfigurationBase[currentConfiguration];
};
/**
 * Sets the current configuration
 * @param {ConfigurationBase} configuration
 * @returns ConfigurationBase - An instance of ApplicationConfiguration class which represents the current configuration
 */
ConfigurationBase.setCurrent = function(configuration) {
    if (configuration instanceof ConfigurationBase) {
        if (!configuration.hasStrategy(ModuleLoaderStrategy)) {
            configuration.useStrategy(ModuleLoaderStrategy, DefaultModuleLoaderStrategy);
        }
        ConfigurationBase[currentConfiguration] = configuration;
        return ConfigurationBase[currentConfiguration];
    }
    throw new TypeError('Invalid argument. Expected an instance of DataConfiguration class.');
};

/**
 * @class
 * @param {ConfigurationBase} config
 * @constructor
 * @abstract
 */
function ConfigurationStrategy(config) {
    Args.check(this.constructor.name !== ConfigurationStrategy, new AbstractClassError());
    Args.notNull(config, 'Configuration');
    this[configProperty] = config;
}

/**
 * @returns {ConfigurationBase}
 */
ConfigurationStrategy.prototype.getConfiguration = function() {
    return this[configProperty];
};

/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @extends ConfigurationStrategy
 */
function ModuleLoaderStrategy(config) {
    ModuleLoaderStrategy.super_.bind(this)(config);
}
LangUtils.inherits(ModuleLoaderStrategy, ConfigurationStrategy);

ModuleLoaderStrategy.prototype.require = function(modulePath) {
    Args.notEmpty(modulePath,'Module Path');
    if (!/^.\//i.test(modulePath)) {
        if (require.resolve && require.resolve.paths) {
            /**
             * get require paths collection
             * @type string[]
             */
            let paths = require.resolve.paths(modulePath);
            //get execution
            let path1 = this.getConfiguration().getExecutionPath();
            //loop directories to parent (like classic require)
            while (path1) {
                //if path does not exist in paths collection
                if (paths.indexOf(PathUtils.join(path1,'node_modules'))<0) {
                    //add it
                    paths.push(PathUtils.join(path1,'node_modules'));
                    //and check the next path which is going to be resolved
                    if (path1 === PathUtils.join(path1,'..')) {
                        //if it is the same with the current path break loop
                        break;
                    }
                    //otherwise get parent path
                    path1 = PathUtils.join(path1,'..');
                }
                else {
                    //path already exists in paths collection, so break loop
                    break;
                }
            }
            let finalModulePath = require.resolve(modulePath, {
                paths:paths
            });
            return require(finalModulePath);
        }
        else {
            return require(modulePath);
        }
    }
    return require(PathUtils.join(this.getConfiguration().getExecutionPath(),modulePath));
};

/**
 * @class
 * @constructor
 * @param {ConfigurationBase} config
 * @extends ModuleLoaderStrategy
 */
function DefaultModuleLoaderStrategy(config) {
    DefaultModuleLoaderStrategy.super_.bind(this)(config);
}
LangUtils.inherits(DefaultModuleLoaderStrategy, ModuleLoaderStrategy);



if (typeof exports !== 'undefined') {
    module.exports.ConfigurationBase = ConfigurationBase;
    module.exports.ConfigurationStrategy = ConfigurationStrategy;
    module.exports.ModuleLoaderStrategy = ModuleLoaderStrategy;
    module.exports.DefaultModuleLoaderStrategy = DefaultModuleLoaderStrategy;
}


