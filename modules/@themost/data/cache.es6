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
import 'source-map-support/register';
import {SequentialEventEmitter} from '@themost/common/emitter';
import {_} from 'lodash';
import Rx from 'rxjs';
import {Args} from "@themost/common/utils";

const rawCacheProperty = Symbol('rawCache');

/**
 * @class
 * @classdesc Implements data cache mechanisms in MOST Data Applications.
 * DataCache class is used as the internal data caching engine, if any other caching mechanism is not defined.
 * @property {Number} ttl - An amount of time in seconds which is the default cached item lifetime.
 * @constructor
 * @augments EventEmitter2
 */
export class DataCache extends SequentialEventEmitter {

    constructor() {
        super();
        this.initialized = false;
    }

    /**
     * Initializes data caching.
     * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     * @private
     */
    init(callback) {
        try {
            if (this.initialized) {
                return callback();
            }
            const cacheModule = "node-cache";
            const NodeCache = require(cacheModule);
            this[rawCacheProperty] = new NodeCache();
            this.initialized = true;
            return callback();
        }
        catch (err) {
            callback(err);
        }
    }

    /**
     * Removes a cached value.
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Observable}
     */
    remove(key) {
        const self = this;
        return Rx.Observable.bindNodeCallback((callback) => {
            self.init((err) => {
                if (err) {
                    return callback(err);
                }
                self[rawCacheProperty].set(key, callback);
            });
        })();
    }

    /**
     * Flush all cached data.
     * @returns {Observable}
     */
    clear() {
        const self = this;
        return Rx.Observable.bindNodeCallback((callback) => {
            self.init((err) => {
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
     * @returns {Observable}
     */
    add(key, value, absoluteExpiration) {
        const self = this;
        return Rx.Observable.bindNodeCallback((callback) => {
            self.init(function(err) {
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
     * @returns {Observable}
     */
    getOrDefault(key, fn, absoluteExpiration) {
        const self = this;
        Args.check(_.isFunction(fn),'Invalid argument. Expected function.');
        return self.get(key).flatMap((res) => {
            if (_.isNil(res)) {
                let source = fn();
                Args.check(source instanceof Observable, 'Invalid argument. Expected a valid observable.');
                return source.flatMap((res) => {
                    if (_.isNil(res)) {
                        return Rx.Observable.of();
                    }
                    return self.add(key,res,absoluteExpiration).flatMap(() => {
                        return Rx.Observable.of(res);
                    });
                });
            }
            return Rx.Observable.of(res);
        })();
    }

    /**
     * Gets a cached value defined by the given key.
     * @param {string|*} key
     * @returns {Observable}
     */
    get(key) {
        return Rx.Observable.bindNodeCallback((function(key,callback) {
            const self = this;
            self.init((err) => {
                if (err) {
                    return callback(err);
                }
                return self[rawCacheProperty].get(key, function(err, result) {
                    if (err) {
                        return callback(err);
                    }
                    if (typeof result[key] !== 'undefined') {
                        return callback(null, result[key]);
                    }
                    return callback();
                });
            });
        }).bind(this))(key);
    }

    /**
     * Returns the current cache service.
     * @returns {*|DataCache}
     */
    static getCurrent() {
        return DataCache.current;
    }

    /**
     * Sets the current cache service
     * @param {*|DataCache} cacheService
     */
    setCurrent(cacheService) {
        DataCache.current = cacheService;
    }

}

export class NoDataCache {
    constructor() {
        //
    }

    /**
     * Gets a cached value defined by the given key.
     * @param {string|*} key
     * @returns {Observable}
     */
    get(key) {
        return Rx.Observable.of();
    }

    /**
     * Removes a cached value.
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Observable}
     */
    remove(key) {
        return Rx.Observable.of();
    }



    /**
     * Sets a key value pair in cache.
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Observable}
     */
    add(key, value, absoluteExpiration) {
        return Rx.Observable.of();
    }

    /**
     * Flush all cached data.
     * @returns {Observable}
     */
    clear() {
        return Rx.Observable.of();
    }

    /**
     * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
     * @param {string|*} key - A string which represents the key of the cached data
     * @param {Function} fn - A function to execute if data will not be found in cache
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Observable}
     */
    getOrDefault(key, fn, absoluteExpiration) {
        const self = this;
        Args.check(_.isFunction(fn),'Invalid argument. Expected function.');
        let source = fn();
        Args.check(source instanceof Observable, 'Invalid argument. Expected a valid observable.');
        return source.flatMap((res) => {
            if (_.isNil(res)) {
                return Rx.Observable.of();
            }
            return Rx.Observable.of(res);
        });
    }


}
//set no data cache (by default)
DataCache.current = new NoDataCache();
//enable caching in node.js mode (this is the default behaviour)
if (typeof window === 'undefined') {
    DataCache.current = new DataCache();
}
//validates application instance
if (global && global['application']) {
    //get application
    const application = global['application'];
    //if application.getService method exists
    if (_.isFunction(application.getService)) {
        //override getCurrent() static method
        DataCache.getCurrent = () => {
            //and return application cache factory
            return application.getService('$CacheFactory');
        }
    }
}

