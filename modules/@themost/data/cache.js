'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NoDataCache = exports.DataCache = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _emitter = require('@themost/common/emitter');

var SequentialEventEmitter = _emitter.SequentialEventEmitter;

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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


var rawCacheProperty = Symbol('rawCache');

/**
 * @class
 * @classdesc Implements data cache mechanisms in MOST Data Applications.
 * DataCache class is used as the internal data caching engine, if any other caching mechanism is not defined.
 * @property {Number} ttl - An amount of time in seconds which is the default cached item lifetime.
 * @constructor
 * @augments EventEmitter2
 */

var DataCache = exports.DataCache = function (_SequentialEventEmitt) {
    _inherits(DataCache, _SequentialEventEmitt);

    function DataCache() {
        _classCallCheck(this, DataCache);

        var _this = _possibleConstructorReturn(this, (DataCache.__proto__ || Object.getPrototypeOf(DataCache)).call(this));

        _this.initialized = false;
        return _this;
    }

    /**
     * Initializes data caching.
     * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     * @private
     */


    _createClass(DataCache, [{
        key: 'init',
        value: function init(callback) {
            try {
                if (this.initialized) {
                    return callback();
                }
                var cacheModule = "node-cache";
                var NodeCache = require(cacheModule);
                this[rawCacheProperty] = new NodeCache();
                this.initialized = true;
                return callback();
            } catch (err) {
                callback(err);
            }
        }

        /**
         * Removes a cached value.
         * @param {string} key - A string that represents the key of the cached value to be removed
         * @returns {Promise}
         */

    }, {
        key: 'remove',
        value: function remove(key) {
            var self = this;
            return Q.nfbind(function (callback) {
                self.init(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    self[rawCacheProperty].set(key, callback);
                });
            })();
        }

        /**
         * Flush all cached data.
         * @returns {Promise}
         */

    }, {
        key: 'clear',
        value: function clear() {
            var self = this;
            return Q.denodeify(function (callback) {
                self.init(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    self[rawCacheProperty].flushAll();
                    return callback();
                });
            })();
        }

        /**
         * Sets a key value pair in cache.
         * @param {string} key - A string that represents the key of the cached value
         * @param {*} value - The value to be cached
         * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
         * @returns {Promise}
         */

    }, {
        key: 'add',
        value: function add(key, value, absoluteExpiration) {
            var self = this;
            return Q.denodeify(function (callback) {
                self.init(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    self[rawCacheProperty].set(key, value, absoluteExpiration, callback);
                });
            })();
        }

        /**
         * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
         * @param {string|*} key - A string which represents the key of the cached data
         * @param {Function} fn - A function to execute if data will not be found in cache
         * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
         * @returns {Promise}
         */

    }, {
        key: 'getOrDefault',
        value: function getOrDefault(key, fn, absoluteExpiration) {
            var self = this;
            Args.check(_.isFunction(fn), 'Invalid argument. Expected function.');
            return self.get(key).then(function (res) {
                if (_.isNil(res)) {
                    var source = fn();
                    Args.check(_.isFunction(source.then), 'Invalid argument. Expected a valid promise.');
                    return source.then(function (res) {
                        if (_.isNil(res)) {
                            return Q();
                        }
                        return self.add(key, res, absoluteExpiration).then(function () {
                            return Q(res);
                        });
                    });
                }
                return Q(res);
            });
        }

        /**
         * Gets a cached value defined by the given key.
         * @param {string|*} key
         * @returns {Promise}
         */

    }, {
        key: 'get',
        value: function get(key) {
            var self = this;
            return Q.nfbind(function (key, callback) {
                self.init(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return self[rawCacheProperty].get(key, function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        if (typeof result[key] !== 'undefined') {
                            return callback(null, result[key]);
                        }
                        return callback();
                    });
                });
            })(key);
        }

        /**
         * Returns the current cache service.
         * @returns {*|DataCache}
         */

    }], [{
        key: 'getCurrent',
        value: function getCurrent() {
            return DataCache.current;
        }

        /**
         * Sets the current cache service
         * @param {*|DataCache} cacheService
         */

    }, {
        key: 'setCurrent',
        value: function setCurrent(cacheService) {
            DataCache.current = cacheService;
        }
    }]);

    return DataCache;
}(SequentialEventEmitter);

var NoDataCache = exports.NoDataCache = function () {
    function NoDataCache() {
        _classCallCheck(this, NoDataCache);
    }
    //


    /**
     * Gets a cached value defined by the given key.
     * @param {string|*} key
     * @returns {Promise}
     */
    // eslint-disable-next-line no-unused-vars


    _createClass(NoDataCache, [{
        key: 'get',
        value: function get(key) {
            return Q();
        }

        /**
         * Removes a cached value.
         * @param {string} key - A string that represents the key of the cached value to be removed
         * @returns {Promise}
         */
        // eslint-disable-next-line no-unused-vars

    }, {
        key: 'remove',
        value: function remove(key) {
            return Q();
        }

        /**
         * Sets a key value pair in cache.
         * @param {string} key - A string that represents the key of the cached value
         * @param {*} value - The value to be cached
         * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
         * @returns {Promise}
         */
        // eslint-disable-next-line no-unused-vars

    }, {
        key: 'add',
        value: function add(key, value, absoluteExpiration) {
            return Q();
        }

        /**
         * Flush all cached data.
         * @returns {Promise}
         */

    }, {
        key: 'clear',
        value: function clear() {
            return Q();
        }

        /**
         * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
         * @param {string|*} key - A string which represents the key of the cached data
         * @param {Function} fn - A function to execute if data will not be found in cache
         * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
         * @returns {Promise}
         */
        // eslint-disable-next-line no-unused-vars

    }, {
        key: 'getOrDefault',
        value: function getOrDefault(key, fn, absoluteExpiration) {
            Args.check(_.isFunction(fn), 'Invalid argument. Expected function.');
            var source = fn();
            Args.check(_.isObject(source) && _.isFunction(source.then), 'Invalid argument. Expected a valid observable.');
            return source.then(function (res) {
                if (_.isNil(res)) {
                    return Q();
                }
                return Q(res);
            });
        }
    }]);

    return NoDataCache;
}();
//set no data cache (by default)


DataCache.current = new NoDataCache();
//enable caching in node.js mode (this is the default behaviour)
if (typeof window === 'undefined') {
    DataCache.current = new DataCache();
}
//validates application instance
if (global && global['application']) {
    //get application
    var application = global['application'];
    //if application.getService method exists
    if (_.isFunction(application.getService)) {
        //override getCurrent() static method
        DataCache.getCurrent = function () {
            //and return application cache factory
            return application.getService('$CacheFactory');
        };
    }
}
//# sourceMappingURL=cache.js.map
