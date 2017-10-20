/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import _ from 'lodash';
import {TraceUtils,PathUtils} from "@themost/common/utils";
import {Args} from "@themost/common/utils";
import {ConfigurationStrategy, ConfigurationBase} from "@themost/common/config";
import {RandomUtils} from "@themost/common/utils";

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
 * @ignore
 * @class
 * @property {string} name
 * @property {string} defaultUserGroup
 * @property {string} unattendedExecutionAccount
 * @property {number} timeout
 * @property {boolean} slidingExpiration
 * @property {string} loginPage
 */
export class AuthSettings {
    constructor() {
        this.name = '.MAUTH';
        this.defaultUserGroup = 'Users';
        this.unattendedExecutionAccount = RandomUtils.randomHex(16);
        this.timeout = 480;
        this.slidingExpiration = false;
        this.loginPage = '/login';
    }
}

const dataTypesProperty = Symbol('dataTypes');
const adapterTypesProperty =  Symbol('adapterTypes');

/**
 * @classdesc Holds the configuration of data modeling infrastructure
 * @class
 * @property {AuthSettings} auth
 * @extends ConfigurationStrategy
 *
 */
export class DataConfigurationStrategy extends ConfigurationStrategy {
    /**
     * @constructor
     * @param {ConfigurationBase} config
     */
    constructor(config) {
        super(config);
        this[dataTypesProperty] = require('./resources/dataTypes.json');

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

        const configAdapterTypes = this.getConfiguration().getSourceAt('adapterTypes');
        this[adapterTypesProperty] = {};
        const self = this;
        //configure adapter types
        _.forEach(configAdapterTypes, function(x) {
            //first of all validate module
            x.invariantName = x.invariantName || 'unknown';
            x.name = x.name || 'Unknown Data Adapter';
            let valid = false, adapterModule;
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
    }

    /**
     * @returns {AuthSettings|*}
     */
    getAuthSettings() {
        return this.getConfiguration().getSourceAt('settings/auth');
    }

    /**
     * @returns {Array}
     */
    get adapters() {
        return this.getConfiguration().getSourceAt('adapters');
    }

    /**
     * @returns {*}
     */
    get adapterTypes() {
        return this[adapterTypesProperty];
    }

    /**
     * @param {string} invariantName
     * @returns {*}
     */
    getAdapterType(invariantName) {
        return this[adapterTypesProperty][invariantName];
    }

    /**
     * Returns the collection of defined data types (e.g. Integer, Float, Language etc)
     * @returns {*}
     */
    get dataTypes() {
        return this[dataTypesProperty];
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
     * Gets a native object which represents the definition of the model with the given name.
     * @param {string} name
     * @returns {DataModel|undefined}
     */
    getModelDefinition(name) {
        /**
         * @type {SchemaLoaderStrategy}
         */
        const schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
        return schemaLoader.getModelDefinition(name);
    }

    /**
     * Sets a data model definition in application storage.
     * Use this method in order to override default model loading process.
     * @param {*} data - A generic object which represents a model definition
     * @returns {DataConfigurationStrategy}
     * @example
     import {DataConfigurationStrategy} from '@themost/data/config';
     DataConfigurationStrategy.getCurrent().setModelDefinition({
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
        const schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
        schemaLoader.setModelDefinition(data);
        return this;
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
     * @returns DataConfigurationStrategy - An instance of DataConfiguration class which represents the current data configuration
     */
    static getCurrent() {
        const configuration = ConfigurationBase.getCurrent();
        if (!configuration.hasStrategy(DataConfigurationStrategy)) {
            configuration.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
        }
        return configuration.getStrategy(DataConfigurationStrategy);
    }

}

/**
 * @classdesc Represents the default data configuration strategy
 * @class
 * @extends DataConfigurationStrategy
 */
export class DefaultDataConfigurationStrategy extends DataConfigurationStrategy {
    /**
     * @constructor
     * @param {ConfigurationBase} config
     */
    constructor(config) {
        super(config);
    }
}

const modelsProperty = Symbol('models');

export class SchemaLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {ConfigurationBase} config
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

    /**
     * @returns {string[]}
     */
    getModels() {
        return _.keys(this[modelsProperty]);
    }

}

const filesProperty = Symbol('files');
const modelPathProperty = Symbol('modelPath');

/**
 * @class
 * @extends SchemaLoaderStrategy
 */
export class DefaultSchemaLoaderStrategy extends SchemaLoaderStrategy {
    /**
     *
     * @param {ConfigurationBase} config
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
        const getModelDefinitionSuper = super.getModelDefinition;
        let i;
        if (typeof name !== 'string')
            return;
        //exclude registered data types
        if (this.getConfiguration().getStrategy(DataConfigurationStrategy).hasDataType(name)) {
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
        if (files.length===0)
            return;
        const r = new RegExp('^' + name.concat('.json') + '$','i');
        for (i = 0; i < files.length; i++) {
            r.lastIndex=0;
            if (r.test(files[i])) {
                //build model file path
                const finalPath = PathUtils.join(modelPath, files[i]);
                //get model
                const result = require(finalPath);
                //set definition
                this.setModelDefinition(result);
                //and finally return this definition
                return result;
            }
        }
    }
}

/**
 * @classdesc Represents a model class loader strategy
 * @class
 * @extends ConfigurationBase
 */
export class ModelClassLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {ConfigurationBase} config
     */
    constructor(config) {
        super(config);
    }
}

/**
 * @classdesc Represents the default model class loader strategy.
 * @class
 * @extends ConfigurationBase
 */
export class DefaultModelClassLoaderStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {ConfigurationBase} config
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
            let classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',model.name.concat('Model.js'));
            try {
                modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
            }
            catch(err) {
                if (err.code === 'MODULE_NOT_FOUND') {
                    try {
                        //try to find module by using dasherize naming convention
                        // e.g. OrderDetail -> order-detail-model.js
                        classPath = PathUtils.join(this.getConfiguration().getExecutionPath(),'models',_.dasherize(model.name).concat('-model.js'));
                        modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
                    }
                    catch(err) {
                        if (err.code === 'MODULE_NOT_FOUND') {
                            if (typeof this['inherits'] === 'undefined' || this['inherits'] === null) {
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


