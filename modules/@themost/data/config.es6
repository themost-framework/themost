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
import {_} from 'lodash';
import sprintf from 'sprintf';
import {TraceUtils,PathUtils} from "@themost/common/utils";
import {Args} from "@themost/common/utils";
import {AbstractClassError, AbstractMethodError} from "@themost/common/errors";


/**
 * @ignore
 * @class
 * @property {string} name
 * @property {string} defaultUserGroup
 * @property {string} unattendedExecutionAccount
 * @property {number} timeout
 * @property {boolean} slidingExpiration
 * @property {string} loginPage
 */
export class DataConfigurationAuth {
    constructor() {

    }
}

const configurationProperty = Symbol('configuration');

/**
 * @class
 */
export class ConfigurationStrategy {
    /**
     *
     * @param {DataConfiguration} config
     */
    constructor(config) {
        Args.check(new.target !== DataConfiguration, new AbstractClassError());
        Args.notNull(config, 'Configuration');
        this[configurationProperty] = config;
    }

    /**
     *
     * @returns {DataConfiguration}
     */
    getConfiguration() {
        return this[configurationProperty];
    }

}

const strategiesProperty = Symbol('strategies');
const configPathProperty = Symbol('configurationPath');
const executionPathProperty = Symbol('configurationPath');
const dataTypesProperty = Symbol('dataTypes');
const currentConfiguration = Symbol('current');

/**
 * @classdesc Holds the configuration of data modeling infrastructure
 * @class
 * @property {DataConfigurationAuth} auth
 *
 */
export class DataConfiguration {
    /**
     * @constructor
     * @param {string=} configPath - The root directory of configuration files.
     */
    constructor(configPath) {

        this[strategiesProperty] = { };
        this[configPathProperty] = configPath || PathUtils.join(process.cwd(),'config');
        this[executionPathProperty] = PathUtils.join(this[configPathProperty],'..');
        this[dataTypesProperty] = require('./resources/dataTypes.json');
        this.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
        this.useStrategy(ModelClassLoaderStrategy, DefaultModelClassLoaderStrategy);
        this.useStrategy(ListenerLoaderStrategy, DefaultListenerLoaderStrategy);

        //get application adapter types, if any
        let config;
        try {
            const env = process.env['NODE_ENV'] || 'production';
            config = require(PathUtils.join(this[configPathProperty], 'app.' + env + '.json'));
        }
        catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                TraceUtils.log('Data: The environment specific configuration cannot be found or is inaccesible.');
                try {
                    config = require(PathUtils.join(this[configPathProperty], 'app.json'));
                }
                catch(err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.log('Data: The default application configuration cannot be found or is inaccesible.');
                    }
                    else {
                        TraceUtils.error('Data: An error occured while trying to open default application configuration.');
                        TraceUtils.error(err);
                    }
                    config = { adapters:[], adapterTypes:[]  };
                }
            }
            else {
                TraceUtils.error('Data: An error occured while trying to open application configuration.');
                TraceUtils.error(err);
                config = { adapters:[], adapterTypes:[]  };
            }
        }

        /**
         * @type {Array}
         * @private
         */
        let adapters;
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

        const adapterTypes = { };

        if (config.adapterTypes) {
            if (_.isArray(config.adapterTypes)) {
                config.adapterTypes.forEach(function(x) {
                    //first of all validate module
                    x.invariantName = x.invariantName || 'unknown';
                    x.name = x.name || 'Unknown Data Adapter';
                    let valid = false, adapterModule;
                    if (x.type) {
                        try {
                            adapterModule = require(x.type);
                            if (typeof adapterModule.createInstance === 'function') {
                                valid = true;
                            }
                            else {
                                //adapter type does not export a createInstance(options) function
                                TraceUtils.log(sprintf.sprintf("The specified data adapter type (%s) does not have the appropriate constructor. Adapter type cannot be loaded.", x.invariantName));
                            }
                        }
                        catch(err) {
                            //catch error
                            TraceUtils.error(err);
                            //and log a specific error for this adapter type
                            TraceUtils.log(sprintf.sprintf("The specified data adapter type (%s) cannot be instantiated. Adapter type cannot be loaded.", x.invariantName));
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
                        TraceUtils.log(sprintf.sprintf("The specified data adapter type (%s) does not have a type defined. Adapter type cannot be loaded.", x.invariantName));
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

        let auth;
        Object.defineProperty(this, 'auth', {
            get: function()
            {
                try {
                    if (auth) { return auth; }
                    if (typeof config.settings === 'undefined' || config.settings== null) {
                        auth = config.auth || {};
                        return auth;
                    }
                    auth = config.settings.auth || {};
                    return auth;
                }
                catch(err) {
                    TraceUtils.error('An error occured while trying to load auth configuration');
                    TraceUtils.error(err);
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
                const er = new Error('An error occured while trying to load auth configuration');
                er.code = "ECONF";
                throw er;
            }
        };

    }

    /**
     * Returns the collection of defined data types (e.g. Integer, Float, Language etc)
     * @returns {*}
     */
    get dataTypes() {
        return this[dataTypesProperty];
    }

    /**
     * Sets the current execution path
     * @param {string} p
     */
    setExecutionPath(p) {
        this[executionPathProperty] = p;
    }

    /**
     * @returns {string}
     */
    getExecutionPath() {
        return this[executionPathProperty];
    }

    /**
     * Gets a boolean which indicates whether the specified data type is defined in data types collection or not.
     * @param name
     * @returns {boolean}
     */
    hasDataType(name) {
        if (_.isNil(name)) {
            return false;
        }
        if (typeof name !== 'string') {
            return false;
        }
        return this.dataTypes.hasOwnProperty(name);
    }

    /**
     * Gets the root configuration path
     * @returns {string}
     */
    getConfigurationPath() {
        return this[configPathProperty];
    }

    /**
     * Gets a native object which represents the definition of the model with the given name.
     * @param {string} name
     * @returns {DataModel|undefined}
     */
    getModelDefinition(name) {
        /**
         * @type {SchemaLoaderStrategy}
         */
        const schemaLoader = this.getStrategy(SchemaLoaderStrategy);
        return schemaLoader.getModelDefinition(name);
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
    setModelDefinition(data) {
        /**
         * @type {SchemaLoaderStrategy}
         */
        const schemaLoader = this.getStrategy(SchemaLoaderStrategy);
        schemaLoader.setModelDefinition(data);
        return this;
    };

    /**
     * Register a configuration strategy
     * @param {Function} configStrategyCtor
     * @param {Function} strategyCtor
     * @returns DataConfiguration
     */
    useStrategy(configStrategyCtor, strategyCtor) {
        Args.notFunction(configStrategyCtor,"Configuration strategy constructor");
        Args.notFunction(strategyCtor,"Strategy constructor");
        this[strategiesProperty][`${configStrategyCtor.name}`] = new strategyCtor(this);
        return this;
    }

    /**
     * Gets a configuration strategy
     * @param {Function} configStrategyCtor
     */
    getStrategy(configStrategyCtor) {
        Args.notFunction(configStrategyCtor,"Configuration strategy constructor");
        return this[strategiesProperty][`${configStrategyCtor.name}`];
    }

    /**
     * Gets a configuration strategy
     * @param {Function} configStrategyCtor
     */
    hasStrategy(configStrategyCtor) {
        Args.notFunction(configStrategyCtor,"Configuration strategy constructor");
        return typeof this[strategiesProperty][`${configStrategyCtor.name}`] !== 'undefined';
    }

    /**
     * @returns {*}
     * @param name {string}
     */
    model(name) {
        return this.getModelDefinition(name);
    }
    /**
     * Gets the current data configuration
     * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
     */
    static getCurrent() {
        if (_.isNil(DataConfiguration[currentConfiguration])) {
            DataConfiguration[currentConfiguration] = new DataConfiguration();
        }
        return DataConfiguration[currentConfiguration];
    }
    /**
     * Sets the current data configuration
     * @param {DataConfiguration} configuration
     * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
     */
    static setCurrent(configuration) {
        if (configuration instanceof DataConfiguration) {
            if (!configuration.hasStrategy(SchemaLoaderStrategy)) {
                configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
            }
            if (!configuration.hasStrategy(ModelClassLoaderStrategy)) {
                configuration.useStrategy(ModelClassLoaderStrategy, DefaultModelClassLoaderStrategy);
            }
            if (!configuration.hasStrategy(ListenerLoaderStrategy)) {
                configuration.useStrategy(ListenerLoaderStrategy, DefaultListenerLoaderStrategy);
            }
            DataConfiguration[currentConfiguration] = configuration;
            return DataConfiguration[currentConfiguration];
        }
        throw new TypeError('Invalid argument. Expected an instance of DataConfiguration class.');
    }

}


const modelsProperty = Symbol('models');

export class SchemaLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {DataConfiguration} config
     */
    constructor(config) {
        super(config);
        this[modelsProperty] = new Map();
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

    /**
     *
     * @param {string} name
     * @returns {*}
     */
    getModelDefinition(name) {
        Args.notString(name,'Model name');
        let result = this[modelsProperty].get(name);
        if (typeof result !== 'undefined') {
            return result;
        }
        //case insensitive search
        const iterator = this[modelsProperty].keys();
        let keyIt = iterator.next();
        while(!keyIt.done) {
            if ((typeof keyIt.value === 'string') && (keyIt.value.toLowerCase() === name.toLowerCase())) {
                return this[modelsProperty].get(keyIt.value);
            }
            keyIt = iterator.next();
        }
    }

    /**
     *
     * @param {*} data
     * @returns {SchemaLoaderStrategy}
     */
    setModelDefinition(data) {
        Args.notNull(data,'Model definition');
        Args.notString(data.name,'Model name');
        this[modelsProperty].set(data.name,data);
        return this;
    }

}

const filesProperty = Symbol('files');
const modelPathProperty = Symbol('modelPath');

export class DefaultSchemaLoaderStrategy extends SchemaLoaderStrategy {
    /**
     *
     * @param {DataConfiguration} config
     */
    constructor(config) {
        super(config);
        this[modelPathProperty] = PathUtils.join(config.getConfigurationPath(), 'models');
    }

    /**
     * Gets a string which represents the directory which contains model definitions.
     * @returns {*}
     */
    getModelPath() {
        return this[modelPathProperty];
    }

    /**
     * Sets the directory of model definitions.
     * @param {string} p
     * @returns {DefaultSchemaLoaderStrategy}
     */
    setModelPath(p) {
        this[modelPathProperty] = p;
        return this;
    }

    /**
     *
     * @param {string} name
     * @returns {*}
     */
    getModelDefinition(name) {
        const self = this,
            getModelDefinitionSuper = super.getModelDefinition;
        let i;
        if (typeof name !== 'string')
            return;
        //exclude registered data types
        if (this.getConfiguration().hasDataType(name)) {
            return;
        }
        let modelDefinition = getModelDefinitionSuper.bind(this)(name);
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
            const nativeFsModule = 'fs';
            const fs = require(nativeFsModule);
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
        const files = this[filesProperty];
        if (files.length==0)
            return;
        const r = new RegExp('^' + name.concat('.json') + '$','i');
        for (i = 0; i < files.length; i++) {
            r.lastIndex=0;
            if (r.test(files[i])) {
                //build model file path
                const finalPath = PathUtils.join(modelPath, files[i]);
                //get model
                const result = require(finalPath), finalName = result.name;
                //set definition
                this.setModelDefinition(result);
                //and finally return this definition
                return result;
            }
        }
    }
}

export class ModelClassLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {DataConfiguration} config
     */
    constructor(config) {
        super(config);
    }
}

export class DefaultModelClassLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {DataConfiguration} config
     */
    constructor(config) {
        super(config);
    }

    /**
     * @param {DataModel} model
     * @returns {Function}
     */
    resolve(model) {
        Args.notNull(model, 'Model');
        let DataObjectClass = this['DataObjectClass'];
        if (_.isFunction(DataObjectClass)) {
            return DataObjectClass;
        }
        //get model definition
        const modelDefinition = this.getConfiguration().getStrategy(SchemaLoaderStrategy).getModelDefinition(model.name);
        if (typeof model.classPath === 'string') {
            modelDefinition['DataObjectClass'] = DataObjectClass = require(self.classPath);
        }
        else {
            //try to find module by using capitalize naming convention
            // e.g. OrderDetail -> OrderDetailModel.js
            let classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',this.name.concat('Model.js'));
            try {
                modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
            }
            catch(err) {
                if (err.code === 'MODULE_NOT_FOUND') {
                    try {
                        //try to find module by using dasherize naming convention
                        // e.g. OrderDetail -> order-detail-model.js
                        classPath = PathUtils.join(rootPath,'models',_.dasherize(this.name).concat('-model.js'));
                        modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
                    }
                    catch(err) {
                        if (err.code === 'MODULE_NOT_FOUND') {
                            if (typeof this['inherits'] === 'undefined' || this['inherits'] == null) {
                                //use default DataObject class
                                modelDefinition['DataObjectClass'] = DataObjectClass = require('./object').DataObject;
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
    }

}

export class ListenerLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {DataConfiguration} config
     */
    constructor(config) {
        super(config);
    }
}

export class DefaultListenerLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {DataConfiguration} config
     */
    constructor(config) {
        super(config);
    }

    /**
     * @param {*} listener
     * @returns {*}
     */
    resolve(listener) {
        Args.notNull(model, 'Listener');
        return require(PathUtils.join(this.getConfiguration().getExecutionPath(),'listeners',listener.type));
    }

}

