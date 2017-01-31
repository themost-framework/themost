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
import {SequentialEventEmitter} from '@themost/common/emitter';


/**
 * @classdesc Implements the cache for a data application.
 * @class
 * @augments EventEmitter2
 */
export class HttpCache extends SequentialEventEmitter {
    /**
     *
     * @constructor
     * @param {{ttl:number}|*} options
     */
    constructor(options) {
        super();
        this.initialized = false;
        options = options || {};
        options.ttl = options.ttl || (20*60);
        this.options = options;
    }

    /**
     * Initializes data caching.
     * @param {function(Error=)} callback
     */
    init(callback) {
        try {
            if (this.initialized) {
                callback();
                return;
            }
            const NodeCache = require( "node-cache" );
            this.rawCache = new NodeCache();
            this.initialized = true;
            callback();
        }
        catch (e) {
            callback(e);
        }
    }

    /**
     * Removes a cached value.
     * @param {string} key - A string that represents the key of the cached value
     * @param {function(Error=,number=)} callback - Returns the number of deleted entries. This parameter is optional.
     */
    remove(key, callback) {
        const self = this;
        callback = callback || function() {};
        self.init(function(err) {
            if (err) {
                callback(err);
            }
            else {
                self.rawCache.set(key, callback);
            }
        });
    }

    /**
    * Flush all cached data.
    * @param {function(Error=)} callback - This parameter is optional.
    */
    removeAll(callback) {
        const self = this;
        callback = callback || function() {};
        self.init(function(err) {
            if (err) {
                callback(err);
            }
            else {
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
    add(key, value, ttl, callback) {
        const self = this;
        if (typeof ttl === 'undefined')
            ttl = self.options.ttl;
        callback = callback || function() {};
        self.init(function(err) {
           if (err) {
               callback(err);
           }
            else {
               if (typeof value !== 'undefined')
                    self.rawCache.set(key, value, ttl, callback);
               else
                   callback(null, false);
           }
        });
    }

    /**
     * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
     * @param {string|*} key - A string thath represents the of the cached data
     * @param {function(function(Error=,*=))} fn - A function to execute if data will not be found in cache
     * @param {function(Error=,*=)} callback - A callback function that will return the result or an error, if any.
     */
    ensure(key, fn, callback) {
        const self = this;
        callback = callback || function() {};
        if (typeof fn !== 'function') {
            callback(new Error('Invalid argument. Expected function.'));
            return;
        }
        //try to get from cache
        self.get(key, function(err, result) {
            if (err) { callback(err); return; }
            if (typeof result !== 'undefined') {
                callback(null, result);
            }
            else {
                //execute fn
                fn(function(err, result) {
                    if (err) { callback(err); return; }
                    //add to cache
                    self.add(key, (typeof result === 'undefined') ? null: result, self.options.ttl, function() {
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
    get(key, callback) {
        const self = this;
        callback = callback || function() {};
        if (typeof key === 'undefined' || key == null) {
            callback();
        }
        self.init(function(err) {
            if (err) {
                callback(err);
            }
            else {
                self.rawCache.get(key, function(err, value) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (typeof value[key] !== 'undefined') {
                            callback(null, value[key]);
                        }
                        else {
                            callback();
                        }
                    }
                });
            }
        });
    }
}