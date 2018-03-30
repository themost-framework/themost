/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var NodeCache = require('node-cache');
var Q = require('q');
var _  = require('lodash');
var Symbol = require('symbol');
var AbstractMethodError = require("../common/errors").AbstractMethodError;
var AbstractClassError = require("../common/errors").AbstractClassError;
var LangUtils = require('@themost/common/utils').LangUtils;
var Args = require('@themost/common/utils').Args;
var HttpApplicationService = require('./types').HttpApplicationService;
/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @augments HttpApplicationService
 */
function CacheStrategy(app) {
    CacheStrategy.super_.bind(this)(app);
    if (this.constructor === CacheStrategy.prototype.constructor) {
        throw new AbstractClassError();
    }
}
LangUtils.inherits(CacheStrategy, HttpApplicationService);

/**
 * Sets a key value pair in cache.
 * @abstract
 * @param {string} key - A string that represents the key of the cached value
 * @param {*} value - The value to be cached
 * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
 * @returns {Promise|*}
 */
// eslint-disable-next-line no-unused-vars
CacheStrategy.prototype.add = function(key, value, absoluteExpiration) {
    throw new AbstractMethodError();
};

/**
 * Removes a cached value.
 * @abstract
 * @param {string} key - A string that represents the key of the cached value to be removed
 * @returns {Promise|*}
 */
// eslint-disable-next-line no-unused-vars
CacheStrategy.prototype.remove = function(key) {
    throw new AbstractMethodError();
};
/**
 * Flush all cached data.
 * @abstract
 * @returns {Promise|*}
 */
CacheStrategy.prototype.clear = function() {
    throw new AbstractMethodError();
};
/**
 * Gets a cached value defined by the given key.
 * @param {string} key
 * @returns {Promise|*}
 */
// eslint-disable-next-line no-unused-vars
CacheStrategy.prototype.get = function(key) {
    throw new AbstractMethodError();
};
/**
 * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
 * @param {string|*} key - A string which represents the key of the cached data
 * @param {Function} fn - A function to execute if data will not be found in cache
 * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
 * @returns {Promise|*}
 */
// eslint-disable-next-line no-unused-vars
CacheStrategy.prototype.getOrDefault = function(key, fn, absoluteExpiration) {
    throw new AbstractMethodError();
};

var rawCacheProperty = Symbol('rawCache');
var CACHE_ABSOLUTE_EXPIRATION = 0;

/**
 * Implements the cache for a data application.
 * @class HttpCache
 * @param {HttpApplication} app
 * @constructor
 */
function DefaulCacheStrategy(app) {
    DefaulCacheStrategy.super_.bind(this)(app);
    //set absoluteExpiration (from application configuration)
    var expiration = CACHE_ABSOLUTE_EXPIRATION;
    var absoluteExpiration = LangUtils.parseInt(app.getConfiguration().getSourceAt('settings/cache/absoluteExpiration'));
    if (absoluteExpiration>=0) {
        expiration = absoluteExpiration;
    }
    this[rawCacheProperty] = new NodeCache( {
        stdTTL:expiration
    });
}
LangUtils.inherits(DefaulCacheStrategy, CacheStrategy);
/**
 * Sets a key value pair in cache.
 * @abstract
 * @param {string} key - A string that represents the key of the cached value
 * @param {*} value - The value to be cached
 * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
 * @returns {Promise|*}
 */
DefaulCacheStrategy.prototype.add = function(key, value, absoluteExpiration) {
    var self = this;
    return Q.promise(function(resolve, reject) {
        self[rawCacheProperty].set(key, value, absoluteExpiration, function(err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });

};

/**
 * Removes a cached value.
 * @abstract
 * @param {string} key - A string that represents the key of the cached value to be removed
 * @returns {Promise|*}
 */
DefaulCacheStrategy.prototype.remove = function(key) {
    var self = this;
    return Q.promise(function(resolve, reject) {
        self[rawCacheProperty].set(key, function(err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
};

/**
 * Flush all cached data.
 * @abstract
 * @returns {Promise|*}
 */
DefaulCacheStrategy.prototype.clear = function() {
    this[rawCacheProperty].flushAll();
    return Q();
};

/**
 * Gets a cached value defined by the given key.
 * @param {string} key
 * @returns {Promise|*}
 */
DefaulCacheStrategy.prototype.get = function(key) {
    return Q.nfbind(this[rawCacheProperty].get.bind(this[rawCacheProperty]))(key)
        .then(function(res) {
        return Q(res[key]);
    });
};

/**
 * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
 * @param {string|*} key - A string which represents the key of the cached data
 * @param {Function} fn - A function to execute if data will not be found in cache
 * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
 * @returns {Promise|*}
 */
DefaulCacheStrategy.prototype.getOrDefault = function(key, fn, absoluteExpiration) {
    var self = this;
    Args.check(_.isFunction(fn),'Invalid argument. Expected function.');
    return self.get(key).then(function(res) {
        if (_.isNil(res)) {
            var source = fn();
            Args.check(typeof source.then === 'function', 'Invalid argument. Expected a valid observable.');
            return source.then(function (res) {
                if (_.isNil(res)) {
                    return Q();
                }
                return self.add(key, res, absoluteExpiration).then(()=> {
                    return Q(res);
                });
            });
        }
    return Q(res);
});
};

if (typeof exports !== 'undefined')
{
    module.exports.CacheStrategy = CacheStrategy;
    module.exports.DefaulCacheStrategy = DefaulCacheStrategy;
}