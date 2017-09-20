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
exports.DefaultModelClassLoaderStrategy = exports.ModelClassLoaderStrategy = exports.DefaultSchemaLoaderStrategy = exports.SchemaLoaderStrategy = exports.DataConfigurationStrategy = exports.AuthSettings = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;
var PathUtils = _utils.PathUtils;
var Args = _utils.Args;
var RandomUtils = _utils.RandomUtils;

var _errors = require('@themost/common/errors');

var AbstractClassError = _errors.AbstractClassError;
var AbstractMethodError = _errors.AbstractMethodError;

var _config = require('@themost/common/config');

var ConfigurationStrategy = _config.ConfigurationStrategy;
var ConfigurationBase = _config.ConfigurationBase;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 * @param s
 * @returns {*}
 * @private
 */
function _dasherize(s) {
    if (_.isString(s)) return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/, '').toLowerCase();
    return s;
}
if (typeof _.dasherize !== 'function') {
    _.mixin({ 'dasherize': _dasherize });
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

var AuthSettings = exports.AuthSettings = function AuthSettings() {
    _classCallCheck(this, AuthSettings);

    this.name = '.MAUTH';
    this.defaultUserGroup = 'Users';
    this.unattendedExecutionAccount = RandomUtils.randomHex(16);
    this.timeout = 480;
    this.slidingExpiration = false;
    this.loginPage = '/login';
};

var dataTypesProperty = Symbol('dataTypes');
var adapterTypesProperty = Symbol('adapterTypes');

/**
 * @classdesc Holds the configuration of data modeling infrastructure
 * @class
 * @property {DataConfigurationAuth} auth
 * @extends ConfigurationStrategy
 *
 */

var DataConfigurationStrategy = exports.DataConfigurationStrategy = function (_ConfigurationStrateg) {
    _inherits(DataConfigurationStrategy, _ConfigurationStrateg);

    /**
     * @constructor
     * @param {ConfigurationBase} config
     */
    function DataConfigurationStrategy(config) {
        _classCallCheck(this, DataConfigurationStrategy);

        var _this = _possibleConstructorReturn(this, (DataConfigurationStrategy.__proto__ || Object.getPrototypeOf(DataConfigurationStrategy)).call(this, config));

        _this[dataTypesProperty] = require('./resources/dataTypes.json');

        //register other strategies
        if (!config.hasStrategy(SchemaLoaderStrategy)) {
            config.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
        }
        if (!config.hasStrategy(ModelClassLoaderStrategy)) {
            config.useStrategy(ModelClassLoaderStrategy, DefaultModelClassLoaderStrategy);
        }

        if (!_this.getConfiguration().hasSourceAt('adapters')) {
            _this.getConfiguration().setSourceAt('adapters', []);
        }

        if (!_this.getConfiguration().hasSourceAt('adapterTypes')) {
            _this.getConfiguration().setSourceAt('adapterTypes', []);
        }

        if (!_this.getConfiguration().hasSourceAt('settings/auth')) {
            _this.getConfiguration().setSourceAt('settings/auth', new AuthSettings());
        }

        var configAdapterTypes = _this.getConfiguration().getSourceAt('adapterTypes');
        _this[adapterTypesProperty] = {};
        var self = _this;
        //configure adapter types
        _.forEach(configAdapterTypes, function (x) {
            //first of all validate module
            x.invariantName = x.invariantName || 'unknown';
            x.name = x.name || 'Unknown Data Adapter';
            var valid = false,
                adapterModule = void 0;
            if (x.type) {
                try {
                    if (require.main && /^@themost\//.test(x.type)) {
                        adapterModule = require.main.require(x.type);
                    } else {
                        adapterModule = require(x.type);
                    }

                    if (typeof adapterModule.createInstance === 'function') {
                        valid = true;
                    } else {
                        //adapter type does not export a createInstance(options) function
                        TraceUtils.log("The specified data adapter type (%s) does not have the appropriate constructor. Adapter type cannot be loaded.", x.invariantName);
                    }
                } catch (err) {
                    //catch error
                    TraceUtils.error(err);
                    //and log a specific error for this adapter type
                    TraceUtils.log("The specified data adapter type (%s) cannot be instantiated. Adapter type cannot be loaded.", x.invariantName);
                }
                if (valid) {
                    //register adapter
                    self[adapterTypesProperty][x.invariantName] = {
                        invariantName: x.invariantName,
                        name: x.name,
                        createInstance: adapterModule.createInstance
                    };
                }
            } else {
                TraceUtils.log("The specified data adapter type (%s) does not have a type defined. Adapter type cannot be loaded.", x.invariantName);
            }
        });
        return _this;
    }

    /**
     * @returns {AuthSettings}
     */


    _createClass(DataConfigurationStrategy, [{
        key: 'getAuthSettings',
        value: function getAuthSettings() {
            return this.getConfiguration().getSourceAt('settings/auth');
        }

        /**
         * @returns {Array}
         */

    }, {
        key: 'getAdapterType',


        /**
         * @param {string} invariantName
         * @returns {*}
         */
        value: function getAdapterType(invariantName) {
            return this[adapterTypesProperty][invariantName];
        }

        /**
         * Returns the collection of defined data types (e.g. Integer, Float, Language etc)
         * @returns {*}
         */

    }, {
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
            var schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
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
            var schemaLoader = this.getConfiguration().getStrategy(SchemaLoaderStrategy);
            schemaLoader.setModelDefinition(data);
            return this;
        }
    }, {
        key: 'model',


        /**
         * @returns {*}
         * @param name {string}
         */
        value: function model(name) {
            return this.getModelDefinition(name);
        }
        /**
         * Gets the current data configuration
         * @returns DataConfigurationStrategy - An instance of DataConfiguration class which represents the current data configuration
         */

    }, {
        key: 'adapters',
        get: function get() {
            return this.getConfiguration().getSourceAt('adapters');
        }

        /**
         * @returns {*}
         */

    }, {
        key: 'adapterTypes',
        get: function get() {
            return this[adapterTypesProperty];
        }
    }, {
        key: 'dataTypes',
        get: function get() {
            return this[dataTypesProperty];
        }
    }], [{
        key: 'getCurrent',
        value: function getCurrent() {
            var configuration = ConfigurationBase.getCurrent();
            if (!configuration.hasStrategy(DataConfigurationStrategy)) {
                configuration.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
            }
            return configuration.getStrategy(DataConfigurationStrategy);
        }
    }]);

    return DataConfigurationStrategy;
}(ConfigurationStrategy);

var modelsProperty = Symbol('models');

var SchemaLoaderStrategy = exports.SchemaLoaderStrategy = function (_ConfigurationStrateg2) {
    _inherits(SchemaLoaderStrategy, _ConfigurationStrateg2);

    /**
     *
     * @param {DataConfiguration} config
     */
    function SchemaLoaderStrategy(config) {
        _classCallCheck(this, SchemaLoaderStrategy);

        var _this2 = _possibleConstructorReturn(this, (SchemaLoaderStrategy.__proto__ || Object.getPrototypeOf(SchemaLoaderStrategy)).call(this, config));

        _this2[modelsProperty] = new Map();
        _this2.setModelDefinition({
            "name": "Migration", "title": "Data Model Migrations", "id": 14,
            "source": "migrations", "view": "migrations", "hidden": true, "sealed": true,
            "fields": [{ "name": "id", "type": "Counter", "primary": true }, { "name": "appliesTo", "type": "Text", "size": 180, "nullable": false }, { "name": "model", "type": "Text", "size": 120 }, { "name": "description", "type": "Text", "size": 512 }, { "name": "version", "type": "Text", "size": 40, "nullable": false }],
            "constraints": [{ "type": "unique", "fields": ["appliesTo", "version"] }]
        });
        return _this2;
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

        /**
         * @returns {string[]}
         */

    }, {
        key: 'getModels',
        value: function getModels() {
            return _.keys(this[modelsProperty]);
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
     * @param {ConfigurationBase} config
     */
    function DefaultSchemaLoaderStrategy(config) {
        _classCallCheck(this, DefaultSchemaLoaderStrategy);

        var _this3 = _possibleConstructorReturn(this, (DefaultSchemaLoaderStrategy.__proto__ || Object.getPrototypeOf(DefaultSchemaLoaderStrategy)).call(this, config));

        _this3[modelPathProperty] = PathUtils.join(config.getConfigurationPath(), 'models');
        return _this3;
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
            if (files.length === 0) return;
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

var ModelClassLoaderStrategy = exports.ModelClassLoaderStrategy = function (_ConfigurationStrateg3) {
    _inherits(ModelClassLoaderStrategy, _ConfigurationStrateg3);

    /**
     *
     * @param {DataConfiguration} config
     */
    function ModelClassLoaderStrategy(config) {
        _classCallCheck(this, ModelClassLoaderStrategy);

        return _possibleConstructorReturn(this, (ModelClassLoaderStrategy.__proto__ || Object.getPrototypeOf(ModelClassLoaderStrategy)).call(this, config));
    }

    return ModelClassLoaderStrategy;
}(ConfigurationStrategy);

var DefaultModelClassLoaderStrategy = exports.DefaultModelClassLoaderStrategy = function (_ConfigurationStrateg4) {
    _inherits(DefaultModelClassLoaderStrategy, _ConfigurationStrateg4);

    /**
     *
     * @param {DataConfiguration} config
     */
    function DefaultModelClassLoaderStrategy(config) {
        _classCallCheck(this, DefaultModelClassLoaderStrategy);

        return _possibleConstructorReturn(this, (DefaultModelClassLoaderStrategy.__proto__ || Object.getPrototypeOf(DefaultModelClassLoaderStrategy)).call(this, config));
    }

    /**
     * @param {DataModel} model
     * @returns {Function}
     */


    _createClass(DefaultModelClassLoaderStrategy, [{
        key: 'resolve',
        value: function resolve(model) {
            Args.notNull(model, 'Model');
            var DataObjectClass = this['DataObjectClass'];
            if (_.isFunction(DataObjectClass)) {
                return DataObjectClass;
            }
            //get model definition
            var modelDefinition = this.getConfiguration().getStrategy(SchemaLoaderStrategy).getModelDefinition(model.name);
            if (typeof model.classPath === 'string') {
                modelDefinition['DataObjectClass'] = DataObjectClass = require(self.classPath);
            } else {
                //try to find module by using capitalize naming convention
                // e.g. OrderDetail -> OrderDetailModel.js
                var classPath = PathUtils.join(this.getConfiguration().getExecutionPath(), 'models', model.name.concat('Model.js'));
                try {
                    modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        try {
                            //try to find module by using dasherize naming convention
                            // e.g. OrderDetail -> order-detail-model.js
                            classPath = PathUtils.join(this.getConfiguration().getExecutionPath(), 'models', _.dasherize(model.name).concat('-model.js'));
                            modelDefinition['DataObjectClass'] = DataObjectClass = require(classPath);
                        } catch (err) {
                            if (err.code === 'MODULE_NOT_FOUND') {
                                if (typeof this['inherits'] === 'undefined' || this['inherits'] === null) {
                                    //use default DataObject class
                                    modelDefinition['DataObjectClass'] = DataObjectClass = require('./object').DataObject;
                                } else {
                                    modelDefinition['DataObjectClass'] = DataObjectClass = this.resolve(model.base());
                                }
                            } else {
                                throw err;
                            }
                        }
                    } else {
                        throw err;
                    }
                }
            }
            return DataObjectClass;
        }
    }]);

    return DefaultModelClassLoaderStrategy;
}(ConfigurationStrategy);
//# sourceMappingURL=config.js.map
