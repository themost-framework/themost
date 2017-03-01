'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DataConfiguration = exports.DataConfigurationAuth = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @license
                                                                                                                                                           * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                           * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                           *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                           *
                                                                                                                                                           * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                           * found in the LICENSE file at https://themost.io/license
                                                                                                                                                           */


/**
 * @ignore
 */
var path = require("path"),
    fs = require("fs");

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

        configPath = configPath || path.join(process.cwd(), 'config');

        /**
         * Model caching object (e.g. cfg.models.Migration, cfg.models.User etc)
         * @type {*}
         * @ignore
         */
        this.models = {
            "Migration": {
                "name": "Migration", "title": "Data Model Migrations", "id": 14,
                "source": "migrations", "view": "migrations", "hidden": true, "sealed": true,
                "fields": [{ "name": "id", "type": "Counter", "primary": true }, { "name": "appliesTo", "type": "Text", "size": 180, "nullable": false }, { "name": "model", "type": "Text", "size": 120 }, { "name": "description", "type": "Text", "size": 512 }, { "name": "version", "type": "Text", "size": 40, "nullable": false }],
                "constraints": [{ "type": "unique", "fields": ["appliesTo", "version"] }]
            }
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
            get: function get() {
                if (dataTypes) return dataTypes;
                //get data types from configuration file
                try {
                    dataTypes = require(path.join(configPath, 'dataTypes.json'));
                    if (_.isNil(dataTypes)) {
                        TraceUtils.log('Data: Application data types are empty. The default data types will be loaded instead.');
                        dataTypes = require('./resources/dataTypes.json');
                    } else {
                        //append default data types which are not defined in application data types
                        var defaultDataTypes = require('./resources/dataTypes.json');
                        //enumerate default data types and replace or append application specific data types
                        for (var key in defaultDataTypes) {
                            if (dataTypes.hasOwnProperty(key)) {
                                if (dataTypes[key].version) {
                                    if (dataTypes[key].version <= defaultDataTypes[key].version) {
                                        //replace data type due to lower version
                                        dataTypes[key] = defaultDataTypes[key];
                                    }
                                } else {
                                    //replace data type due to invalid version
                                    dataTypes[key] = defaultDataTypes[key];
                                }
                            } else {
                                //append data type
                                dataTypes[key] = defaultDataTypes[key];
                            }
                        }
                    }
                } catch (e) {
                    if (e.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.log('Data: Application specific data types are missing. The default data types will be loaded instead.');
                    } else {
                        TraceUtils.log('Data: An error occured while loading application data types.');
                        throw e;
                    }
                    dataTypes = require('./resources/dataTypes.json');
                }
                return dataTypes;
            }
        });

        //get application adapter types, if any
        var config = void 0;
        try {
            var env = process.env['NODE_ENV'] || 'production';
            config = require(path.join(configPath, 'app.' + env + '.json'));
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                TraceUtils.log('Data: The environment specific configuration cannot be found or is inaccesible.');
                try {
                    config = require(path.join(configPath, 'app.json'));
                } catch (e) {
                    if (e.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.log('Data: The default application configuration cannot be found or is inaccesible.');
                    } else {
                        TraceUtils.log('Data: An error occured while trying to open default application configuration.');
                        TraceUtils.log(e);
                    }
                    config = { adapters: [], adapterTypes: [] };
                }
            } else {
                TraceUtils.log('Data: An error occured while trying to open application configuration.');
                TraceUtils.log(e);
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
                                console.log(sprintf.sprintf("The specified data adapter type (%s) does not have the appropriate constructor. Adapter type cannot be loaded.", x.invariantName));
                            }
                        } catch (e) {
                            //catch error
                            console.log(e);
                            //and log a specific error for this adapter type
                            console.log(sprintf.sprintf("The specified data adapter type (%s) cannot be instantiated. Adapter type cannot be loaded.", x.invariantName));
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
                        console.log(sprintf.sprintf("The specified data adapter type (%s) does not have a type defined. Adapter type cannot be loaded.", x.invariantName));
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
                } catch (e) {
                    console.log('An error occured while trying to load auth configuration');
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

        var path_ = path.join(configPath, 'models');

        /**
         * Gets a string which represents the path where schemas exist. The default location is the config/models folder. 
         * @returns {string}
         */
        this.getModelPath = function () {
            return path_;
        };
        /**
         * Sets a string which represents the path where schemas exist.
         * @param p
         * @returns {DataConfiguration}
         */
        this.setModelPath = function (p) {
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
        this.setModelDefinition = function (data) {
            if (_.isNil(data)) {
                throw new Error("Invalid model definition. Expected object.");
            }
            if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
                if (typeof data.name === 'undefined' || data.name === null) {
                    throw new Error("Invalid model definition. Expected model name.");
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
        this.getModelDefinition = function (name) {
            if (_.isNil(name)) {
                return;
            }
            if (typeof name === 'string') {
                return this.model(name);
            }
        };

        /**
         * Gets a boolean which indicates whether the specified data type is defined in data types collection or not.
         * @param name
         * @returns {boolean}
         */
        this.hasDataType = function (name) {
            if (_.isNil(name)) {
                return false;
            }
            if (typeof name !== 'string') {
                return false;
            }
            return this.dataTypes.hasOwnProperty(name);
        };
    }

    /**
     * @returns {*}
     * @param name {string}
     */


    _createClass(DataConfiguration, [{
        key: 'model',
        value: function model(name) {
            var self = this;
            var i = void 0;
            if (typeof name !== 'string') return null;
            //first of all try to find if model definition is already in cache
            if (typeof this.models[name] !== 'undefined')
                //and return it
                return this.models[name];
            //otherwise try to find model with case insensitivity
            var keys = Object.keys(this.models),
                mr = new RegExp('^' + name + '$', 'i');
            for (i = 0; i < keys.length; i++) {
                mr.lastIndex = 0;
                if (mr.test(keys[i])) return this.models[keys[i]];
            }
            //otherwise open definition file
            var modelPath = this.getModelPath();
            if (!fs.existsSync(modelPath)) {
                //models folder does not exist
                //so set model to null
                this.models[name] = null;
                //and return
                return null;
            }
            //read files from models directory
            var files = void 0;
            //store file list in a private variable
            if (typeof this._files === 'undefined') {
                this._files = fs.readdirSync(modelPath);
            }
            //and finally get this list of file
            files = this._files;
            if (files.length == 0) return null;
            var r = new RegExp('^' + name.concat('.json') + '$', 'i');
            for (i = 0; i < files.length; i++) {
                r.lastIndex = 0;
                if (r.test(files[i])) {
                    //build model file path
                    var finalPath = path.join(modelPath, files[i]);
                    //get model
                    var result = require(finalPath),
                        finalName = result.name;
                    //cache model definition
                    self.models[finalName] = result;
                    //and finally return this definition
                    return result;
                }
            }
            return null;
        }
        /**
         * Gets the current data configuration
         * @returns DataConfiguration - An instance of DataConfiguration class which represents the current data configuration
         */

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
                return DataConfiguration.current;
            }
            throw new TypeError('Invalid argument. Expected an instance of DataConfiguration class.');
        }
    }]);

    return DataConfiguration;
}();
/**
 * Gets the current configuration
 * @type {DataConfiguration}
 */


DataConfiguration.current = new DataConfiguration();
//# sourceMappingURL=config.js.map