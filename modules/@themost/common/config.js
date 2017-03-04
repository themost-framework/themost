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
exports.DefaultModuleLoaderStrategy = exports.ModuleLoaderStrategy = exports.ConfigurationStrategy = exports.ConfigurationBase = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

var _errors = require('./errors');

var AbstractClassError = _errors.AbstractClassError;
var AccessDeniedError = _errors.AccessDeniedError;

var _utils = require('./utils');

var Args = _utils.Args;
var PathUtils = _utils.PathUtils;
var TraceUtils = _utils.TraceUtils;

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var configProperty = Symbol('config');
var currentConfiguration = Symbol('current');
var configPathProperty = Symbol('configurationPath');
var executionPathProperty = Symbol('executionPath');
var strategiesProperty = Symbol('strategies');

/**
 * @class
 */

var ConfigurationBase = exports.ConfigurationBase = function () {
    /**
     * @constructor
     * @param {string} configPath
     */
    function ConfigurationBase(configPath) {
        _classCallCheck(this, ConfigurationBase);

        //init strategies
        this[strategiesProperty] = {};

        this[configPathProperty] = configPath || PathUtils.join(process.cwd(), 'config');
        TraceUtils.debug('Initializing configuration under %s.', this[configPathProperty]);

        this[executionPathProperty] = PathUtils.join(this[configPathProperty], '..');
        TraceUtils.debug('Setting execution path under %s.', this[executionPathProperty]);

        //load default module loader strategy
        this.useStrategy(ModuleLoaderStrategy, DefaultModuleLoaderStrategy);

        //get configuration source
        var configSourcePath = void 0;
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
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                TraceUtils.log('The environment specific configuration cannot be found or is inaccesible.');
                try {
                    configSourcePath = PathUtils.join(this[configPathProperty], 'app.json');
                    TraceUtils.debug('Validating application configuration source on %s.', configSourcePath);
                    this[configProperty] = require(configSourcePath);
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        TraceUtils.log('The default application configuration cannot be found or is inaccesible.');
                    } else {
                        TraceUtils.error('An error occured while trying to open default application configuration.');
                        TraceUtils.error(err);
                    }
                    TraceUtils.debug('Initializing empty configuration');
                    this[configProperty] = {};
                }
            } else {
                TraceUtils.error('An error occured while trying to open application configuration.');
                TraceUtils.error(err);
                //load default configuration
                this[configProperty] = {};
            }
        }
        //initialize settings object
        this[configProperty]['settings'] = this[configProperty]['settings'] || {};
    }

    _createClass(ConfigurationBase, [{
        key: 'getSource',


        /**
         * Returns the configuration source object
         * @returns {*}
         */
        value: function getSource() {
            return this[configProperty];
        }

        /**
         * Returns the source configuration object based on the given path (e.g. settings.auth.cookieName or settings/auth/cookieName)
         * @param {string} p - A string which represents an object path
         * @returns {Object|Array}
         */

    }, {
        key: 'getSourceAt',
        value: function getSourceAt(p) {
            return _.at(this[configProperty], p.replace(/\//, '.'))[0];
        }

        /**
         * Returns a boolean which indicates whether the specified  object path exists or not (e.g. settings.auth.cookieName or settings/auth/cookieName)
         * @param {string} p - A string which represents an object path
         * @returns {boolean}
         */

    }, {
        key: 'hasSourceAt',
        value: function hasSourceAt(p) {
            return _.isObject(_.at(this[configProperty], p.replace(/\//, '.'))[0]);
        }

        /**
         * Sets the config value to the specified object path (e.g. settings.auth.cookieName or settings/auth/cookieName)
         * @param {string} p - A string which represents an object path
         * @param {*} value
         * @returns {Object}
         */

    }, {
        key: 'setSourceAt',
        value: function setSourceAt(p, value) {
            return _.set(this[configProperty], p, value);
        }

        /**
         * Sets the current execution path
         * @param {string} p
         */

    }, {
        key: 'setExecutionPath',
        value: function setExecutionPath(p) {
            this[executionPathProperty] = p;
        }

        /**
         * Gets the current execution path
         * @returns {string}
         */

    }, {
        key: 'getExecutionPath',
        value: function getExecutionPath() {
            return this[executionPathProperty];
        }

        /**
         * Gets the current configuration path
         * @returns {string}
         */

    }, {
        key: 'getConfigurationPath',
        value: function getConfigurationPath() {
            return this[configPathProperty];
        }

        /**
         * Register a configuration strategy
         * @param {Function} configStrategyCtor
         * @param {Function} strategyCtor
         * @returns ConfigurationBase
         */

    }, {
        key: 'useStrategy',
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
         * Gets the current configuration
         * @returns ConfigurationBase - An instance of DataConfiguration class which represents the current data configuration
         */

    }, {
        key: 'settings',
        get: function get() {
            return this.getSourceAt('settings');
        }
    }], [{
        key: 'getCurrent',
        value: function getCurrent() {
            if (_.isNil(ConfigurationBase[currentConfiguration])) {
                ConfigurationBase[currentConfiguration] = new ConfigurationBase();
            }
            return ConfigurationBase[currentConfiguration];
        }
        /**
         * Sets the current configuration
         * @param {ConfigurationBase} configuration
         * @returns ConfigurationBase - An instance of ApplicationConfiguration class which represents the current configuration
         */

    }, {
        key: 'setCurrent',
        value: function setCurrent(configuration) {
            if (configuration instanceof ConfigurationBase) {
                if (!configuration.hasStrategy(ModuleLoaderStrategy)) {
                    configuration.useStrategy(ModuleLoaderStrategy, DefaultModuleLoaderStrategy);
                }
                ConfigurationBase[currentConfiguration] = configuration;
                return ConfigurationBase[currentConfiguration];
            }
            throw new TypeError('Invalid argument. Expected an instance of DataConfiguration class.');
        }
    }]);

    return ConfigurationBase;
}();

/**
 * @class
 */


var ConfigurationStrategy = exports.ConfigurationStrategy = function () {
    /**
     * @constructor
     * @param {ConfigurationBase} config
     */
    function ConfigurationStrategy(config) {
        _classCallCheck(this, ConfigurationStrategy);

        Args.check(new.target !== ConfigurationStrategy, new AbstractClassError());
        Args.notNull(config, 'Configuration');
        this[configProperty] = config;
    }

    /**
     * @returns {ConfigurationBase}
     */


    _createClass(ConfigurationStrategy, [{
        key: 'getConfiguration',
        value: function getConfiguration() {
            return this[configProperty];
        }
    }]);

    return ConfigurationStrategy;
}();

var ModuleLoaderStrategy = exports.ModuleLoaderStrategy = function (_ConfigurationStrateg) {
    _inherits(ModuleLoaderStrategy, _ConfigurationStrateg);

    /**
     *
     * @param {DataConfiguration} config
     */
    function ModuleLoaderStrategy(config) {
        _classCallCheck(this, ModuleLoaderStrategy);

        return _possibleConstructorReturn(this, (ModuleLoaderStrategy.__proto__ || Object.getPrototypeOf(ModuleLoaderStrategy)).call(this, config));
    }

    return ModuleLoaderStrategy;
}(ConfigurationStrategy);

var DefaultModuleLoaderStrategy = exports.DefaultModuleLoaderStrategy = function (_ConfigurationStrateg2) {
    _inherits(DefaultModuleLoaderStrategy, _ConfigurationStrateg2);

    /**
     *
     * @param {ConfigurationBase} config
     */
    function DefaultModuleLoaderStrategy(config) {
        _classCallCheck(this, DefaultModuleLoaderStrategy);

        return _possibleConstructorReturn(this, (DefaultModuleLoaderStrategy.__proto__ || Object.getPrototypeOf(DefaultModuleLoaderStrategy)).call(this, config));
    }

    /**
     * @param {string} modulePath
     * @returns {*}
     */


    _createClass(DefaultModuleLoaderStrategy, [{
        key: 'require',
        value: function (_require) {
            function require(_x) {
                return _require.apply(this, arguments);
            }

            require.toString = function () {
                return _require.toString();
            };

            return require;
        }(function (modulePath) {
            Args.notEmpty(modulePath, 'Module Path');
            Args.check(/\.\./i.test(modulePath), new AccessDeniedError('Access parent directory through module path is denied.'));
            Args.check(/^~/i.test(modulePath), new AccessDeniedError('Access user directory through module path is denied.'));
            if (!/^.\//i.test(modulePath)) {
                //load module which is not starting with ./
                return require(modulePath);
            }
            return require(PathUtils.join(this.getConfiguration().getExecutionPath(), modulePath));
        })
    }]);

    return DefaultModuleLoaderStrategy;
}(ConfigurationStrategy);
//# sourceMappingURL=config.js.map
