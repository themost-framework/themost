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
exports.DefaultCacheStrategy = exports.CacheStrategy = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _rx = require('rx');

var Rx = _interopRequireDefault(_rx).default;

var _nodeCache = require('node-cache');

var NodeCache = _interopRequireDefault(_nodeCache).default;

var _interfaces = require('./interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _errors = require('@themost/common/errors');

var AbstractClassError = _errors.AbstractClassError;
var AbstractMethodError = _errors.AbstractMethodError;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;
var TraceUtils = _utils.TraceUtils;
var LangUtils = _utils.LangUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @classdesc Represents cache strategy for an HTTP application
 * @class
 * @abstract
 */
var CacheStrategy = exports.CacheStrategy = function (_HttpApplicationServi) {
    _inherits(CacheStrategy, _HttpApplicationServi);

    /**
     *
     * @param {HttpApplication} app
     */
    function CacheStrategy(app) {
        _classCallCheck(this, CacheStrategy);

        Args.check(new.target !== CacheStrategy, new AbstractClassError());
        return _possibleConstructorReturn(this, (CacheStrategy.__proto__ || Object.getPrototypeOf(CacheStrategy)).call(this, app));
    }
    /**
     * Sets a key value pair in cache.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Observable}
     */


    _createClass(CacheStrategy, [{
        key: 'add',
        value: function add(key, value, absoluteExpiration) {
            throw new AbstractMethodError();
        }

        /**
         * Removes a cached value.
         * @abstract
         * @param {string} key - A string that represents the key of the cached value to be removed
         * @returns {Observable}
         */

    }, {
        key: 'remove',
        value: function remove(key) {
            throw new AbstractMethodError();
        }
        /**
         * Flush all cached data.
         * @abstract
         * @returns {Observable}
         */

    }, {
        key: 'clear',
        value: function clear() {
            throw new AbstractMethodError();
        }
        /**
         * Gets a cached value defined by the given key.
         * @param {string} key
         * @returns {Observable}
         */

    }, {
        key: 'get',
        value: function get(key) {
            throw new AbstractMethodError();
        }
        /**
         * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
         * @param {string|*} key - A string which represents the key of the cached data
         * @param {Function} fn - A function to execute if data will not be found in cache
         * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
         * @returns {Observable}
         */

    }, {
        key: 'getOrDefault',
        value: function getOrDefault(key, fn, absoluteExpiration) {
            throw new AbstractMethodError();
        }
    }]);

    return CacheStrategy;
}(HttpApplicationService);

var rawCacheProperty = Symbol('rawCache');
var CACHE_ABSOLUTE_EXPIRATION = 0;

/**
 * @classdesc Implements the cache for a data application.
 * @class
 */

var DefaultCacheStrategy = exports.DefaultCacheStrategy = function (_CacheStrategy) {
    _inherits(DefaultCacheStrategy, _CacheStrategy);

    /**
     *
     * @constructor
     * @param {HttpApplication} app
     */
    function DefaultCacheStrategy(app) {
        _classCallCheck(this, DefaultCacheStrategy);

        //set absoluteExpiration (from application configuration)
        var _this2 = _possibleConstructorReturn(this, (DefaultCacheStrategy.__proto__ || Object.getPrototypeOf(DefaultCacheStrategy)).call(this, app));

        var expiration = CACHE_ABSOLUTE_EXPIRATION;
        var config = app.getConfiguration();
        if (config.settings && config.cache && config.cache['absoluteExpiration']) {
            if (LangUtils.parseInt(config.cache['absoluteExpiration']) >= 0) {
                expiration = LangUtils.parseInt(config.cache['absoluteExpiration']);
            }
        }
        _this2[rawCacheProperty] = new NodeCache({
            stdTTL: expiration
        });

        return _this2;
    }

    /**
     * Removes a cached value.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Observable}
     */


    _createClass(DefaultCacheStrategy, [{
        key: 'remove',
        value: function remove(key) {
            return Rx.Observable.fromNodeCallback(this[rawCacheProperty].set, this[rawCacheProperty])(key);
        }

        /**
        * Flush all cached data.
         * @returns {Observable}
        */

    }, {
        key: 'clear',
        value: function clear() {
            this[rawCacheProperty].flushAll();
            return Rx.Observable.return();
        }

        /**
         * Sets a key value pair in cache.
         * @param {string} key - A string that represents the key of the cached value
         * @param {*} value - The value to be cached
         * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
         * @returns {Observable}
         */

    }, {
        key: 'add',
        value: function add(key, value, absoluteExpiration) {

            return Rx.Observable.fromNodeCallback(this[rawCacheProperty].set, this[rawCacheProperty])(key, value, absoluteExpiration);
        }

        /**
         * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
         * @param {string|*} key - A string which represents the key of the cached data
         * @param {Function} fn - A function to execute if data will not be found in cache
         * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
         * @returns {Observable}
         */

    }, {
        key: 'getOrDefault',
        value: function getOrDefault(key, fn, absoluteExpiration) {
            var self = this;
            Args.check(_.isFunction(fn), 'Invalid argument. Expected function.');
            return self.get(key).flatMap(function (res) {
                if (_.isNil(res)) {
                    var source = fn();
                    Args.check(source instanceof Observable, 'Invalid argument. Expected a valid observable.');
                    return source.flatMap(function (res) {
                        if (_.isNil(res)) {
                            return Rx.Observable.return();
                        }
                        return self.add(key, res, absoluteExpiration).flatMap(function () {
                            return Rx.Observable.return(res);
                        });
                    });
                }
                return Rx.Observable.return(res);
            });
        }

        /**
         * Gets a cached value defined by the given key.
         * @param {string|*} key
         * @returns {Observable}
         */

    }, {
        key: 'get',
        value: function get(key) {
            return Rx.Observable.fromNodeCallback(this[rawCacheProperty].get, this[rawCacheProperty])(key).flatMap(function (res) {
                return Rx.Observable.return(res[key]);
            });
        }
    }]);

    return DefaultCacheStrategy;
}(CacheStrategy);
//# sourceMappingURL=cache.js.map
