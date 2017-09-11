/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2015-03-12.
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 Anthi Oikonomou anthioikonomou@gmail.com
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of MOST Web Framework nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @private
 */
var types = require('./types'),
    _ = require('lodash'),
    util = require('util');
/**
 * @class
 * @classdesc Implements data cache mechanisms in MOST Data Applications.
 * DataCache class is used as the internal data caching engine, if any other caching mechanism is not defined.
 * @property {Number} ttl - An amount of time in seconds which is the default cached item lifetime.
 * @constructor
 * @augments EventEmitter2
 */
function DataCache() {
    this.initialized = false;
}
util.inherits(DataCache, types.EventEmitter2);
/**
 * Initializes data caching.
 * @param {function(Error=)} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 *
 * @example
 var d = require("most-data");
 //try to find article with id 100 in cache
 d.cache.current.init(function(err) {
    done(err);
 };
 */
DataCache.prototype.init = function(callback) {
    try {
        if (this.initialized) {
            callback();
            return;
        }
        var NodeCache = require( "node-cache" );
        this.rawCache = new NodeCache();
        this.initialized = true;
        callback();
    }
    catch (e) {
        callback(e);
    }
};

/**
 * Removes a cached value.
 * @param {string} key - A string that represents the key of the cached value
 * @param {function(Error=)=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 *
 * @example
 var d = require("most-data");
 //try to find article with id 100 in cache
 d.cache.current.remove('/Article/100', function(err) {
    done(err);
 };
 */
DataCache.prototype.remove = function(key, callback) {
    var self = this;
    callback = callback || function() {};
    self.init(function(err) {
        if (err) {
            callback(err);
        }
        else {
            self.rawCache.set(key, callback);
        }
    });
};

/**
 * Flush all cached data.
 * @param {function(Error=)=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 *
 * @example
 var d = require("most-data");
 //try to find article with id 100 in cache
 d.cache.current.removeAll(function(err) {
    done(err);
 };
 */
DataCache.prototype.removeAll = function(callback) {
    var self = this;
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
};

/**
 * Sets a key value pair in cache.
 * @param {string} key - A string that represents the key of the cached value
 * @param {*} value - The value to be cached
 * @param {number=} ttl - A TTL in seconds. This parameter is optional.
 * @param {function(Error=,boolean=)=} callback - A callback function where the first argument will contain the Error object if an error occured and the second argument will return true on success.
 *
 * @example
 var d = require("most-data");
 d.cache.current.add('/User/100', { "id":100,"name":"user1@example.com","description":"User #1" }, 1200, function(err) {
    done(err);
 });
 */
DataCache.prototype.add = function(key, value, ttl, callback) {
    var self = this;
    callback = callback || function() {};
    self.init(function(err) {
        if (err) {
            callback(err);
        }
        else {
            self.rawCache.set(key, value, ttl, callback);
        }
    });
};
/**
 * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
 * @param {string|*} key - A string thath represents the of the cached data
 * @param {function(function(Error=,*=))} fn - A function to execute if data will not be found in cache
 * @param {function(Error=,*=)} callback - A callback function where the first argument will contain the Error object if an error occured and the second argument will contain the result.
 * @example
 var d = require("most-data");
 //try to find user with id 100 in cache
 d.cache.current.ensure('/User/100', function(cb) {
        //otherwise get user from database
      context.model('User').where('id').equal(100).first().then(function(result) {
        cb(null, result);
      }).catch(function(err) {
        cb(err);
      }
 }, function(err, result) {
    //and finally return the result
    done(err,result);
 };
 */
DataCache.prototype.ensure = function(key, fn, callback) {
    var self = this;
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
                self.add(key, (typeof result === 'undefined') ? null: result, self.ttl, function() {
                    callback(null, result);
                });
            });
        }
    });
};
/**
 * Gets a cached value defined by the given key.
 * @param {string|*} key - A string that represents the key of the cached value
 * @param {function(Error=,*=)} callback - A callback function where the first argument will contain the Error object if an error occured and the second argument will contain the result.
 *
 * @example
 var d = require("most-data");
 //try to find article with id 100 in cache
 d.cache.current.get('/Article/100', function(err, result) {
    done(err,result);
 };
 */
DataCache.prototype.get = function(key, callback) {
    var self = this;
    callback = callback || function() {};
    if (_.isNil(key)) {
        return callback();
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
};

(function () {

    /**
     * @exports most-data/data-cache
     */
    var dataCache = { };

    /**
     * @type {DataCache|*}
     * @private
     */
    var currentDataCache;
    Object.defineProperty(dataCache, 'current', { get: function () {
        //first of all check if a global application exists
        if (typeof global !== 'undefined' || global!=null) {
            var app = global.application;
            if (app) {
                //and if this application has a cache object
                if (app.cache) {
                    //use this cache
                    return app.cache;
                }
            }
        }
        //otherwise get current cache
        if (typeof currentDataCache !== 'undefined')
            return currentDataCache;
        //or initialize current cache object
        currentDataCache = new DataCache();
        //and return it
        return currentDataCache;
    }, configurable: false, enumerable: false});

    dataCache.DataCache = DataCache;
    /**
     * Gets the current data cache
     * @returns {DataCache}
     */
    dataCache.getCurrent = function() {
        return this.current;
    };

    module.exports = dataCache;

})(this);
