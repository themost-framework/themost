/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import {_} from 'lodash';
import Q from 'q';
import NodeCache from 'node-cache';
import {HttpApplicationService} from './interfaces';
import {AbstractClassError,AbstractMethodError} from '@themost/common/errors';
import {Args,TraceUtils,LangUtils} from '@themost/common/utils';

/**
 * @classdesc Represents cache strategy for an HTTP application
 * @class
 * @abstract
 */
export class CacheStrategy extends HttpApplicationService {
    /**
     *
     * @param {HttpApplication} app
     */
    constructor(app) {
        Args.check(new.target !== CacheStrategy, new AbstractClassError());
        super(app);
    }
    /**
     * Sets a key value pair in cache.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise}
     */
    add(key, value, absoluteExpiration) {
        throw new AbstractMethodError();
    }

    /**
     * Removes a cached value.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Promise}
     */
    remove(key) {
        throw new AbstractMethodError();
    }
    /**
     * Flush all cached data.
     * @abstract
     * @returns {Promise}
     */
    clear() {
        throw new AbstractMethodError();
    }
    /**
     * Gets a cached value defined by the given key.
     * @param {string} key
     * @returns {Promise}
     */
    get(key) {
        throw new AbstractMethodError();
    }
    /**
     * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
     * @param {string|*} key - A string which represents the key of the cached data
     * @param {Function} fn - A function to execute if data will not be found in cache
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise}
     */
    getOrDefault(key, fn, absoluteExpiration) {
        throw new AbstractMethodError();
    }

}

const rawCacheProperty = Symbol('rawCache');
const CACHE_ABSOLUTE_EXPIRATION = 0;

/**
 * @classdesc Implements the cache for a data application.
 * @class
 */
export class DefaultCacheStrategy extends CacheStrategy  {
    /**
     *
     * @constructor
     * @param {HttpApplication} app
     */
    constructor(app) {
        super(app);
        //set absoluteExpiration (from application configuration)
        let expiration = CACHE_ABSOLUTE_EXPIRATION;
        const config = app.getConfiguration();
        if (config.settings && config.cache && config.cache['absoluteExpiration']) {
            if (LangUtils.parseInt(config.cache['absoluteExpiration'])>=0) {
                expiration = LangUtils.parseInt(config.cache['absoluteExpiration']);
            }
        }
        this[rawCacheProperty] = new NodeCache( {
            stdTTL:expiration
        });

    }

    /**
     * Removes a cached value.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Promise}
     */
    remove(key) {
        return Q.nfbind(this[rawCacheProperty].set.bind(this[rawCacheProperty]))(key);
    }

    /**
    * Flush all cached data.
     * @returns {Promise}
    */
    clear() {
        this[rawCacheProperty].flushAll();
        return Q();
    }

    /**
     * Sets a key value pair in cache.
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise}
     */
    add(key, value, absoluteExpiration) {

        return Q.nfbind(this[rawCacheProperty].set, this[rawCacheProperty])(key, value, absoluteExpiration);

    }

    /**
     * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
     * @param {string|*} key - A string which represents the key of the cached data
     * @param {Function} fn - A function to execute if data will not be found in cache
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise}
     */
    getOrDefault(key, fn, absoluteExpiration) {
        const self = this;
        Args.check(_.isFunction(fn),'Invalid argument. Expected function.');
        return self.get(key).then((res) => {
            if (_.isNil(res)) {
                let source = fn();
                Args.check(typeof source.then !== 'function', 'Invalid argument. Expected a valid observable.');
                return source.then((res) => {
                    if (_.isNil(res)) {
                        return Q();
                    }
                    return self.add(key,res,absoluteExpiration);
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
    get(key) {
        return Q.nfbind(this[rawCacheProperty].get.bind(this[rawCacheProperty]))(key)
            .then((res) => {
                return Q(res[key]);
            });

    }
}