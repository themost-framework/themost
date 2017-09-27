'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NamedDataContext = exports.DefaultDataContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _types = require('./types');

var DataContext = _types.DataContext;

var _lodash = require('lodash');

var _ = _lodash._;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;
var Args = _utils.Args;

var _config = require('./config');

var DataConfigurationStrategy = _config.DataConfigurationStrategy;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * @classdesc Represents the default data context of MOST Data Applications.
 * The default data context uses the adapter which is registered as the default adapter in application configuration.
 <pre class="prettyprint"><code>
 adapters: [
 ...
 { "name":"development", "invariantName":"...", "default":false,
    "options": {
      "server":"localhost",
      "user":"user",
      "password":"password",
      "database":"test"
    }
},
 { "name":"development_with_pool", "invariantName":"pool", "default":true,
    "options": {
      "adapter":"development"
    }
}
 ...
 ]
 </code></pre>
 * @class
 * @augments DataContext
 * @property {DataAdapter} db - Gets a data adapter based on the current configuration settings.
 */
var DefaultDataContext = exports.DefaultDataContext = function (_DataContext) {
    _inherits(DefaultDataContext, _DataContext);

    /**
     * @constructor
     */
    function DefaultDataContext() {
        _classCallCheck(this, DefaultDataContext);

        /**
         * @type {DataAdapter}
         * @private
         */
        var _this = _possibleConstructorReturn(this, (DefaultDataContext.__proto__ || Object.getPrototypeOf(DefaultDataContext)).call(this));

        var db_ = null;
        /**
         * @private
         */
        _this.finalize_ = function () {
            if (db_) db_.close();
            db_ = null;
        };
        var self = _this;

        self.getDb = function () {
            if (db_) return db_;
            //otherwise load database options from configuration
            var adapter = _.find(self.getConfiguration().adapters, function (x) {
                return x["default"];
            });
            if (typeof adapter === 'undefined' || adapter === null) {
                er = new Error('The default data adapter is missing.');er.code = 'EADAPTER';
                throw er;
            }
            /**
             * @type {{createInstance:Function}|*}
             */
            var adapterType = self.getConfiguration().getAdapterType(adapter.invariantName);
            //validate data adapter type
            var er = void 0;
            if (_.isNil(adapterType)) {
                er = new Error('Invalid adapter type.');er.code = 'EADAPTER';
                throw er;
            }
            if (typeof adapterType.createInstance !== 'function') {
                er = new Error('Invalid adapter type. Adapter initialization method is missing.');er.code = 'EADAPTER';
                throw er;
            }
            //otherwise load adapter
            db_ = adapterType.createInstance(adapter.options);
            return db_;
        };

        self.setDb = function (value) {
            db_ = value;
        };

        delete self.db;

        Object.defineProperty(self, 'db', {
            get: function get() {
                return self.getDb();
            },
            set: function set(value) {
                self.setDb(value);
            },
            configurable: true,
            enumerable: false });
        return _this;
    }

    /**
     * Gets an instance of DataConfiguration class which is associated with this data context
     * @returns {DataConfigurationStrategy}
     */


    _createClass(DefaultDataContext, [{
        key: 'getConfiguration',
        value: function getConfiguration() {
            return DataConfigurationStrategy.getCurrent();
        }

        /**
         * Gets a configuration strategy
         * @param {Function|*} configStrategyCtor
         * @returns {ConfigurationStrategy|*}
         */

    }, {
        key: 'getStrategy',
        value: function getStrategy(configStrategyCtor) {
            Args.notFunction(configStrategyCtor, "Configuration strategy constructor");
            return this.getConfiguration().getConfiguration().getStrategy(configStrategyCtor);
        }

        /**
         * Gets an instance of DataModel class based on the given name.
         * @param name {string} - A string that represents the model name.
         * @returns {DataModel} - An instance of DataModel class associated with this data context.
         */

    }, {
        key: 'model',
        value: function model(name) {
            var self = this;
            if (name === null || name === undefined) return null;
            var obj = self.getConfiguration().model(name);
            if (_.isNil(obj)) return null;
            var DataModel = require('./model').DataModel;
            //return model
            return new DataModel(obj, self);
        }

        /**
         * Finalizes the current data context
         * @param {Function} cb - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         */

    }, {
        key: 'finalize',
        value: function finalize(cb) {
            cb = cb || function () {};
            this.finalize_();
            cb.call(this);
        }

        /**
         *
         * @param {Function} func
         * @param {Function} callback
         */

    }], [{
        key: 'execute',
        value: function execute(func, callback) {
            func = func || function () {};
            var ctx = new DefaultDataContext();
            func.call(null, ctx, function (err) {
                ctx.finalize(function () {
                    if (err) {
                        return callback(err);
                    }
                    return callback();
                });
            });
        }
    }]);

    return DefaultDataContext;
}(DataContext);

/**
 * @classdesc Represents a data context based on a data adapter's name.
 * The specified adapter name must be registered in application configuration.
 * @class
 * @augments DataContext
 * @property {DataAdapter} db - Gets a data adapter based on the given adapter's name.
 */


var NamedDataContext = exports.NamedDataContext = function (_DataContext2) {
    _inherits(NamedDataContext, _DataContext2);

    /**
     * @constructor
     * @param {string} name
     */
    function NamedDataContext(name) {
        _classCallCheck(this, NamedDataContext);

        /**
         * @type {DataAdapter}
         * @private
         */
        var _this2 = _possibleConstructorReturn(this, (NamedDataContext.__proto__ || Object.getPrototypeOf(NamedDataContext)).call(this));

        var db_ = void 0;
        /**
         * @private
         */
        _this2.finalize_ = function () {
            try {
                if (db_) db_.close();
            } catch (err) {
                TraceUtils.debug('An error occure while closing the underlying database context.');
                TraceUtils.debug(err);
            }
            db_ = null;
        };
        //set the name specified
        var self = _this2,
            name_ = name;

        self.getDb = function () {
            if (db_) return db_;
            //otherwise load database options from configuration
            var adapter = self.getConfiguration().adapters.find(function (x) {
                return x.name === name_;
            });
            var er = void 0;
            if (typeof adapter === 'undefined' || adapter === null) {
                er = new Error('The specified data adapter is missing.');er.code = 'EADAPTER';
                throw er;
            }
            //get data adapter type
            var adapterType = self.getConfiguration().adapterTypes[adapter.invariantName];
            //validate data adapter type
            if (_.isNil(adapterType)) {
                er = new Error('Invalid adapter type.');er.code = 'EADAPTER';
                throw er;
            }
            if (typeof adapterType.createInstance !== 'function') {
                er = new Error('Invalid adapter type. Adapter initialization method is missing.');er.code = 'EADAPTER';
                throw er;
            }
            //otherwise load adapter
            db_ = adapterType.createInstance(adapter.options);
            return db_;
        };

        self.setDb = function (value) {
            db_ = value;
        };

        delete self.db;

        Object.defineProperty(self, 'db', {
            get: function get() {
                return self.getDb();
            },
            set: function set(value) {
                self.setDb(value);
            },
            configurable: true,
            enumerable: false });

        return _this2;
    }

    /**
     * Gets an instance of DataConfiguration class which is associated with this data context
     * @returns {DataConfigurationStrategy}
     */


    _createClass(NamedDataContext, [{
        key: 'getConfiguration',
        value: function getConfiguration() {
            return DataConfigurationStrategy.getCurrent();
        }

        /**
         * Gets an instance of DataModel class based on the given name.
         * @param name {string} - A string that represents the model name.
         * @returns {DataModel} - An instance of DataModel class associated with this data context.
         */

    }, {
        key: 'model',
        value: function model(name) {
            var self = this;
            if (name === null || name === undefined) return null;
            var obj = self.getConfiguration().model(name);
            if (_.isNil(obj)) return null;
            var DataModel = require('./model').DataModel;
            //return model
            return new DataModel(obj, self);
        }
    }, {
        key: 'finalize',
        value: function finalize(cb) {
            cb = cb || function () {};
            this.finalize_();
            cb.call(this);
        }
    }]);

    return NamedDataContext;
}(DataContext);
//# sourceMappingURL=context.js.map
