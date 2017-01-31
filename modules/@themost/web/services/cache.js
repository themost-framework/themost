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
exports.HttpCache = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _emitter = require('@themost/common/emitter');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @classdesc Implements the cache for a data application.
 * @class
 * @augments EventEmitter2
 */
var HttpCache = exports.HttpCache = function (_SequentialEventEmitt) {
    _inherits(HttpCache, _SequentialEventEmitt);

    /**
     *
     * @constructor
     * @param {{ttl:number}|*} options
     */
    function HttpCache(options) {
        _classCallCheck(this, HttpCache);

        var _this = _possibleConstructorReturn(this, (HttpCache.__proto__ || Object.getPrototypeOf(HttpCache)).call(this));

        _this.initialized = false;
        options = options || {};
        options.ttl = options.ttl || 20 * 60;
        _this.options = options;
        return _this;
    }

    /**
     * Initializes data caching.
     * @param {function(Error=)} callback
     */


    _createClass(HttpCache, [{
        key: 'init',
        value: function init(callback) {
            try {
                if (this.initialized) {
                    callback();
                    return;
                }
                var NodeCache = require("node-cache");
                this.rawCache = new NodeCache();
                this.initialized = true;
                callback();
            } catch (e) {
                callback(e);
            }
        }

        /**
         * Removes a cached value.
         * @param {string} key - A string that represents the key of the cached value
         * @param {function(Error=,number=)} callback - Returns the number of deleted entries. This parameter is optional.
         */

    }, {
        key: 'remove',
        value: function remove(key, callback) {
            var self = this;
            callback = callback || function () {};
            self.init(function (err) {
                if (err) {
                    callback(err);
                } else {
                    self.rawCache.set(key, callback);
                }
            });
        }

        /**
        * Flush all cached data.
        * @param {function(Error=)} callback - This parameter is optional.
        */

    }, {
        key: 'removeAll',
        value: function removeAll(callback) {
            var self = this;
            callback = callback || function () {};
            self.init(function (err) {
                if (err) {
                    callback(err);
                } else {
                    self.rawCache.flushAll();
                    callback();
                }
            });
        }

        /**
         * Sets a key value pair in cache.
         * @param {string} key - A string that represents the key of the cached value
         * @param {*} value - The value to be cached
         * @param {number=} ttl - A TTL in seconds. This parameter is optional.
         * @param {function(Error=,boolean=)} callback - Returns true on success. This parameter is optional.
         */

    }, {
        key: 'add',
        value: function add(key, value, ttl, callback) {
            var self = this;
            if (typeof ttl === 'undefined') ttl = self.options.ttl;
            callback = callback || function () {};
            self.init(function (err) {
                if (err) {
                    callback(err);
                } else {
                    if (typeof value !== 'undefined') self.rawCache.set(key, value, ttl, callback);else callback(null, false);
                }
            });
        }

        /**
         * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
         * @param {string|*} key - A string thath represents the of the cached data
         * @param {function(function(Error=,*=))} fn - A function to execute if data will not be found in cache
         * @param {function(Error=,*=)} callback - A callback function that will return the result or an error, if any.
         */

    }, {
        key: 'ensure',
        value: function ensure(key, fn, callback) {
            var self = this;
            callback = callback || function () {};
            if (typeof fn !== 'function') {
                callback(new Error('Invalid argument. Expected function.'));
                return;
            }
            //try to get from cache
            self.get(key, function (err, result) {
                if (err) {
                    callback(err);return;
                }
                if (typeof result !== 'undefined') {
                    callback(null, result);
                } else {
                    //execute fn
                    fn(function (err, result) {
                        if (err) {
                            callback(err);return;
                        }
                        //add to cache
                        self.add(key, typeof result === 'undefined' ? null : result, self.options.ttl, function () {
                            //and return result
                            callback(null, result);
                        });
                    });
                }
            });
        }

        /**
         * Gets a cached value defined by the given key.
         * @param {string|*} key
         * @param {function(Error=,*=)} callback - A callback that returns the cached value, if any.
         */

    }, {
        key: 'get',
        value: function get(key, callback) {
            var self = this;
            callback = callback || function () {};
            if (typeof key === 'undefined' || key == null) {
                callback();
            }
            self.init(function (err) {
                if (err) {
                    callback(err);
                } else {
                    self.rawCache.get(key, function (err, value) {
                        if (err) {
                            callback(err);
                        } else {
                            if (typeof value[key] !== 'undefined') {
                                callback(null, value[key]);
                            } else {
                                callback();
                            }
                        }
                    });
                }
            });
        }
    }]);

    return HttpCache;
}(_emitter.SequentialEventEmitter);
//# sourceMappingURL=cache.js.map
