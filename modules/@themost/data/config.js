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

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DefaultSchemaLoaderStrategy = exports.SchemaLoaderStrategy = exports.DataConfiguration = exports.ConfigurationStrategy = exports.DataConfigurationAuth = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;
var PathUtils = _utils.PathUtils;
var Args = _utils.Args;

var _errors = require('@themost/common/errors');

var AbstractClassError = _errors.AbstractClassError;
var AbstractMethodError = _errors.AbstractMethodError;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
var DataConfigurationAuth = exports.DataConfigurationAuth = function DataConfigurationAuth() {
    _classCallCheck(this, DataConfigurationAuth);
};

var configurationProperty = Symbol('configuration');

/**
 * @class
 */

var ConfigurationStrategy = exports.ConfigurationStrategy = function () {
    /**
     *
     * @param {DataConfiguration} config
     */
    function ConfigurationStrategy(config) {
        _classCallCheck(this, ConfigurationStrategy);

        Args.check(new.target !== DataConfiguration, new AbstractClassError());
        Args.notNull(config, 'Configuration');
        this[configurationProperty] = config;
    }

    /**
     *
     * @returns {DataConfiguration}
     */


    _createClass(ConfigurationStrategy, [{
        key: 'getConfiguration',
        value: function getConfiguration() {
            return this[configurationProperty];
        }
    }]);

    return ConfigurationStrategy;
}();

var strategiesProperty = Symbol('strategies');
var configPathProperty = Symbol('configurationPath');
var dataTypesProperty = Symbol('dataTypes');

/**
 * @classdesc Holds the configuration of data modeling infrastructure
 * @class
 * @property {DataConfigurationAuth} auth
 *
 */

var DataConfiguration = exports.DataConfiguration = function () {
    /**
     * @constructor
     * @param {string=} configPath - The root directory of configuration files.
     */
    function DataConfiguration(configPath) {
        _classCallCheck(this, DataConfiguration);

        this[strategiesProperty] = {};
        this[configPathProperty] = configPath || PathUtils.join(process.cwd(), 'config');
        this[dataTypesProperty] = require('./resources/dataTypes.json');
        this.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);

        //get application adapter types, if any
        var config = void 0;
        try {
            var env = process.env['NODE_ENV'] || 'production';
            config = require(PathUtils.join(this[configPathProperty], 'app.' + env + '.json'));
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                TraceUtils.log('Data: The environment specific configuration cannot be found or is inaccesible.');
                try {
                    config = require(PathUtils.join(this[configPathProperty], 'app.json'));
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.log('Data: The default application configuration cannot be found or is inaccesible.');
                    } else {
                        TraceUtils.error('Data: An error occured while trying to open default application configuration.');
                        TraceUtils.error(err);
                    }
                    config = { adapters: [], adapterTypes: [] };
                }
            } else {
                TraceUtils.error('Data: An error occured while trying to open application configuration.');
                TraceUtils.error(err);
                config = { adapters: [], adapterTypes: [] };
            }
        }

        /**
         * @type {Array}
         * @private
         */
        var adapters = void 0;
        Object.defineProperty(this, 'adapters', {
            get: function get() {
                if (adapters) return adapters;
                /**
                 * get data types from configuration file
                 * @property {Array} adapters
                 * @type {*}
                 */
                adapters = config.adapters || [];
                return adapters;
            }
        });

        var adapterTypes = {};

        if (config.adapterTypes) {
            if (_.isArray(config.adapterTypes)) {
                config.adapterTypes.forEach(function (x) {
                    //first of all validate module
                    x.invariantName = x.invariantName || 'unknown';
                    x.name = x.name || 'Unknown Data Adapter';
                    var valid = false,
                        adapterModule = void 0;
                    if (x.type) {
                        try {
                            adapterModule = require(x.type);
                            if (typeof adapterModule.createInstance === 'function') {
                                valid = true;
                            } else {
                                //adapter type does not export a createInstance(options) function
                                TraceUtils.log(sprintf.sprintf("The specified data adapter type (%s) does not have the appropriate constructor. Adapter type cannot be loaded.", x.invariantName));
                            }
                        } catch (err) {
                            //catch error
                            TraceUtils.error(err);
                            //and log a specific error for this adapter type
                            TraceUtils.log(sprintf.sprintf("The specified data adapter type (%s) cannot be instantiated. Adapter type cannot be loaded.", x.invariantName));
                        }
                        if (valid) {
                            //register adapter
                            adapterTypes[x.invariantName] = {
                                invariantName: x.invariantName,
                                name: x.name,
                                createInstance: adapterModule.createInstance
                            };
                        }
                    } else {
                        TraceUtils.log(sprintf.sprintf("The specified data adapter type (%s) does not have a type defined. Adapter type cannot be loaded.", x.invariantName));
                    }
                });
            }
        }

        Object.defineProperty(this, 'adapterTypes', {
            get: function get() {
                return adapterTypes;
            }
        });

        var auth = void 0;
        Object.defineProperty(this, 'auth', {
            get: function get() {
                try {
                    if (auth) {
                        return auth;
                    }
                    if (typeof config.settings === 'undefined' || config.settings == null) {
                        auth = config.auth || {};
                        return auth;
                    }
                    auth = config.settings.auth || {};
                    return auth;
                } catch (err) {
                    TraceUtils.error('An error occured while trying to load auth configuration');
                    TraceUtils.error(err);
                    auth = {};
                    return auth;
                }
            }
        });

        //ensure authentication settings
        config.settings = config.settings || {};
        config.settings.auth = config.settings.auth || {};
        this.getAuthSettings = function () {
            try {
                return config.settings.auth;
            } catch (e) {
                var er = new Error('An error occured while trying to load auth configuration');
                er.code = "ECONF";
                throw er;
            }
        };
    }

    /**
     * Returns the collection of defined data types (e.g. Integer, Float, Language etc)
     * @returns {*}
     */


    _createClass(DataConfiguration, [{
        key: 'hasDataType',

        /**
         * Gets a boolean which indicates whether the specified data type is defined in data types collection or not.
         * @param name
         * @returns {boolean}
         */
        value: function hasDataType(name) {
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

    }, {
        key: 'getConfigurationPath',
        value: function getConfigurationPath() {
            return this[configPathProperty];
        }

        /**
         * Gets a native object which represents the definition of the model with the given name.
         * @param {string} name
         * @returns {DataModel|undefined}
         */

    }, {
        key: 'getModelDefinition',
        value: function getModelDefinition(name) {
            /**
             * @type {SchemaLoaderStrategy}
             */
            var schemaLoader = this.getStrategy(SchemaLoaderStrategy);
            return schemaLoader.getModelDefinition(name);
        }
    }, {
        key: 'setModelDefinition',


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
        value: function setModelDefinition(data) {
            /**
             * @type {SchemaLoaderStrategy}
             */
            var schemaLoader = this.getStrategy(SchemaLoaderStrategy);
            schemaLoader.setModelDefinition(data);
            return this;
        }
    }, {
        key: 'useStrategy',


        /**
         * Register a configuration strategy
         * @param {Function} configStrategyCtor
         * @param {Function} strategyCtor
         * @returns DataConfiguration
         */
        value: function useStrategy(configStrategyCtor, strategyCtor) {
            Args.notFunction(configStrategyCtor, "Configuration strategy constructor");
            Args.notFunction(strategyCtor, "Strategy constructor");
            this[strategiesProperty]['' + configStrategyCtor.name] = new strategyCtor(this);
            return this;
        }

        /**
         * Gets a configuration strategy
         * @param {Function} configStrategyCtor
         */

    }, {
        key: 'getStrategy',
        value: function getStrategy(configStrategyCtor) {
            Args.notFunction(configStrategyCtor, "Configuration strategy constructor");
            return this[strategiesProperty]['' + configStrategyCtor.name];
        }

        /**
         * Gets a configuration strategy
         * @param {Function} configStrategyCtor
         */

    }, {
        key: 'hasStrategy',
        value: function hasStrategy(configStrategyCtor) {
            Args.notFunction(configStrategyCtor, "Configuration strategy constructor");
            return typeof this[strategiesProperty]['' + configStrategyCtor.name] !== 'undefined';
        }

        /**
         * @returns {*}
         * @param name {string}
         */

    }, {
        key: 'model',
        value: function model(name) {
            return this.getModelDefinition(name);
        }
        /**
         * Gets the current data configuration
         * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
         */

    }, {
        key: 'dataTypes',
        get: function get() {
            return this[dataTypesProperty];
        }
    }], [{
        key: 'getCurrent',
        value: function getCurrent() {
            return DataConfiguration.current;
        }
        /**
         * Sets the current data configuration
         * @param {DataConfiguration} configuration
         * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
         */

    }, {
        key: 'setCurrent',
        value: function setCurrent(configuration) {
            if (configuration instanceof DataConfiguration) {
                DataConfiguration.current = configuration;
                if (!configuration.hasStrategy(SchemaLoaderStrategy)) {
                    configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
                }
                return DataConfiguration.current;
            }
            throw new TypeError('Invalid argument. Expected an instance of DataConfiguration class.');
        }
    }]);

    return DataConfiguration;
}();

var modelsProperty = Symbol('models');

var SchemaLoaderStrategy = exports.SchemaLoaderStrategy = function (_ConfigurationStrateg) {
    _inherits(SchemaLoaderStrategy, _ConfigurationStrateg);

    /**
     *
     * @param {DataConfiguration} config
     */
    function SchemaLoaderStrategy(config) {
        _classCallCheck(this, SchemaLoaderStrategy);

        var _this = _possibleConstructorReturn(this, (SchemaLoaderStrategy.__proto__ || Object.getPrototypeOf(SchemaLoaderStrategy)).call(this, config));

        _this[modelsProperty] = new Map();
        _this.setModelDefinition({
            "name": "Migration", "title": "Data Model Migrations", "id": 14,
            "source": "migrations", "view": "migrations", "hidden": true, "sealed": true,
            "fields": [{ "name": "id", "type": "Counter", "primary": true }, { "name": "appliesTo", "type": "Text", "size": 180, "nullable": false }, { "name": "model", "type": "Text", "size": 120 }, { "name": "description", "type": "Text", "size": 512 }, { "name": "version", "type": "Text", "size": 40, "nullable": false }],
            "constraints": [{ "type": "unique", "fields": ["appliesTo", "version"] }]
        });
        return _this;
    }

    /**
     *
     * @param {string} name
     * @returns {*}
     */


    _createClass(SchemaLoaderStrategy, [{
        key: 'getModelDefinition',
        value: function getModelDefinition(name) {
            Args.notString(name, 'Model name');
            var result = this[modelsProperty].get(name);
            if (typeof result !== 'undefined') {
                return result;
            }
            //case insensitive search
            var iterator = this[modelsProperty].keys();
            var keyIt = iterator.next();
            while (!keyIt.done) {
                if (typeof keyIt.value === 'string' && keyIt.value.toLowerCase() === name.toLowerCase()) {
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

    }, {
        key: 'setModelDefinition',
        value: function setModelDefinition(data) {
            Args.notNull(data, 'Model definition');
            Args.notString(data.name, 'Model name');
            this[modelsProperty].set(data.name, data);
            return this;
        }
    }]);

    return SchemaLoaderStrategy;
}(ConfigurationStrategy);

var filesProperty = Symbol('files');
var modelPathProperty = Symbol('modelPath');

var DefaultSchemaLoaderStrategy = exports.DefaultSchemaLoaderStrategy = function (_SchemaLoaderStrategy) {
    _inherits(DefaultSchemaLoaderStrategy, _SchemaLoaderStrategy);

    /**
     *
     * @param {DataConfiguration} config
     */
    function DefaultSchemaLoaderStrategy(config) {
        _classCallCheck(this, DefaultSchemaLoaderStrategy);

        var _this2 = _possibleConstructorReturn(this, (DefaultSchemaLoaderStrategy.__proto__ || Object.getPrototypeOf(DefaultSchemaLoaderStrategy)).call(this, config));

        _this2[modelPathProperty] = PathUtils.join(config.getConfigurationPath(), 'models');
        return _this2;
    }

    /**
     * Gets a string which represents the directory which contains model definitions.
     * @returns {*}
     */


    _createClass(DefaultSchemaLoaderStrategy, [{
        key: 'getModelPath',
        value: function getModelPath() {
            return this[modelPathProperty];
        }

        /**
         * Sets the directory of model definitions.
         * @param {string} p
         * @returns {DefaultSchemaLoaderStrategy}
         */

    }, {
        key: 'setModelPath',
        value: function setModelPath(p) {
            this[modelPathProperty] = p;
            return this;
        }

        /**
         *
         * @param {string} name
         * @returns {*}
         */

    }, {
        key: 'getModelDefinition',
        value: function getModelDefinition(name) {
            var self = this,
                getModelDefinitionSuper = _get(DefaultSchemaLoaderStrategy.prototype.__proto__ || Object.getPrototypeOf(DefaultSchemaLoaderStrategy.prototype), 'getModelDefinition', this);
            var i = void 0;
            if (typeof name !== 'string') return;
            //exclude registered data types
            if (this.getConfiguration().hasDataType(name)) {
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
                } else {
                    //try load model definition
                    try {
                        modelDefinition = require(PathUtils.join(modelPath, name.concat('json')));
                        this.setModelDefinition(modelDefinition);
                    } catch (err) {
                        //do nothing (log error)
                        TraceUtils.error('An error occurred while loading definition for model %s.', name);
                        TraceUtils.error(err);
                    }
                }
            }
            //and finally get this list of file
            var files = this[filesProperty];
            if (files.length == 0) return;
            var r = new RegExp('^' + name.concat('.json') + '$', 'i');
            for (i = 0; i < files.length; i++) {
                r.lastIndex = 0;
                if (r.test(files[i])) {
                    //build model file path
                    var finalPath = PathUtils.join(modelPath, files[i]);
                    //get model
                    var result = require(finalPath),
                        finalName = result.name;
                    //set definition
                    this.setModelDefinition(result);
                    //and finally return this definition
                    return result;
                }
            }
        }
    }]);

    return DefaultSchemaLoaderStrategy;
}(SchemaLoaderStrategy);

/**
 * Gets the current configuration
 * @type {DataConfiguration}
 */


DataConfiguration.current = new DataConfiguration();
//# sourceMappingURL=config.js.map
