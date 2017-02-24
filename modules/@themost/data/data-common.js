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

(function() {


    /**
     * @ignore
     */
    var util = require('util'),
        _ = require('lodash');
    /**
     * Load native object extensions
     */
    if (typeof Array.prototype.find === 'undefined')
    {
        /**
         * @param {Function} callback
         * @param {Object=} [thisObject]
         * @returns {*}
         * @ignore
         */
        var find = function(callback, thisObject) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof callback !== 'function') {
                throw new TypeError('callback must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisObj = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                if (i in list) {
                    value = list[i];
                    if (callback.call(thisObj, value, i, list)) {
                        return value;
                    }
                }
            }
            return undefined;
        };

        if (Object.defineProperty) {
            try {
                Object.defineProperty(Array.prototype, 'find', {
                    value: find, configurable: true, enumerable: false, writable: true
                });
            } catch(e) {}
        }

        if (!Array.prototype.find) { Array.prototype.find = find; }
    }


    if (typeof Array.prototype.select === 'undefined')
    {
        /**
         * @param {Function} callback
         * @param {Object=} [thisObject]
         * @returns {*}
         * @ignore
         */
        var select = function(callback, thisObject) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof callback !== 'function') {
                throw new TypeError('callback must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisObj = arguments[1];
            var value;
            var res = [];
            for (var i = 0; i < length; i++) {
                if (i in list) {
                    value = list[i];
                    var item = callback.call(thisObj, value, i, list);
                    if (item)
                        res.push(item);
                }
            }
            return res;
        };

        if (Object.defineProperty) {
            try {
                Object.defineProperty(Array.prototype, 'select', {
                    value: select, configurable: true, enumerable: false, writable: true
                });
            } catch(e) {}
        }

        if (!Array.prototype.select) { Array.prototype.select = select; }
    }

    if (typeof Array.prototype.distinct === 'undefined')
    {
        /**
         * @param {Function} callback
         * @param {Object=} [thisObject]
         * @returns {*}
         * @ignore
         */
        var distinct = function(callback, thisObject) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof callback !== 'function') {
                throw new TypeError('callback must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisObj = arguments[1];
            var value;
            var res = [];
            for (var i = 0; i < length; i++) {
                if (i in list) {
                    value = list[i];
                    var item = callback.call(thisObj, value, i, list);
                    if (item)
                        if (res.indexOf(item)<0)
                            res.push(item);
                }
            }
            return res;
        };

        if (Object.defineProperty) {
            try {
                Object.defineProperty(Array.prototype, 'distinct', {
                    value: distinct, configurable: true, enumerable: false, writable: true
                });
            } catch(e) {}
        }

        if (!Array.prototype.distinct) { Array.prototype.distinct = distinct; }
    }

    if (typeof Object.prototype.isNullOrUndefined === 'undefined')
    {
        /**
         * @param {*} obj
         * @returns {boolean}
         * @ignore
         */
        var isNullOrUndefined = function(obj) {
            return (typeof obj === 'undefined') || (obj==null);
        };

        if (Object.defineProperty) {
            try {
                Object.defineProperty(Object.prototype, 'isNullOrUndefined', {
                    value: isNullOrUndefined, configurable: true, enumerable: false, writable: true
                });
            } catch(e) {}
        }
        if (!Object.prototype.isNullOrUndefined) { Object.prototype.isNullOrUndefined = isNullOrUndefined; }
    }
    /**
     * @exports most-data/data-common
     */
    var dataCommon = {

    };
    /**
     * Logs the given data
     * @param {Error|string|{message:string,stack:string}|*} data
     */
    dataCommon.log = function(data) {
        if (data instanceof Error) {
            console.log(data);
        }
        else {
            console.log(data);
        }
        if (data.stack) {
            console.log(data.stack);
        }
    };
    /**
     * Logs the given data if the process is running in debug mode
     * @param {Error|string|{message:string,stack:string}|*} data
     */
    dataCommon.debug = function(data) {
        if (process.env.NODE_ENV==='development')
            console.log(data);
    };

    /**
     * "Dasherizes" the given string
     * @param {string} data
     * @returns string
     */
    dataCommon.dasherize = function(data) {
        if (typeof data === 'string')
        {
            return data.replace(/(^\s*|\s*$)/g, '').replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
        }
    };
    /**
     * Checks if the specified object argument is undefined or null.
     * @param {*} obj
     * @returns {boolean}
     */
    dataCommon.isNullOrUndefined = function(obj) {
        return (typeof obj === 'undefined' || obj === null);
    };


    /**
     * Checks if the specified object argument is not undefined or null.
     * @param {*} obj
     * @returns {boolean}
     */
    dataCommon.isDefined = function(obj) {
        return (typeof obj !== 'undefined' && obj != null);
    };

    /**
     * Returns a random integer between a minimum and a maximum value
     * @param {number} min
     * @param {number} max
     */
    dataCommon.randomInt = function(min, max) {
        return _.random(min, max);
    };

    /**
     * Returns a sequence of random characters
     * @param {Number} howMany - The length of the random sequence of characters
     * @param {string=} chars - A sequence of characters to be used in random sequence
     * @returns {string}
     */
    dataCommon.randomChars = function(howMany, chars) {
        /**
         * @type {{randomBytes:Function}|*}
         */
        var crypto = require('crypto');
        chars = chars
            || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
        var rnd = crypto.randomBytes(howMany)
            , value = new Array(howMany)
            , len = chars.length;
        for (var i = 0; i < howMany; i++) {
            value[i] = chars[rnd[i] % len]
        }
        return value.join('');
    };

    /**
     * Converts the given value to the equivalent MD5 formatted string.
     * @param {*} value
     * @returns {string|undefined}
     */
    dataCommon.md5  = function(value) {
        if (typeof value === 'undefined' || value == null) {
            return;
        }
        var crypto = require('crypto'), md5 = crypto.createHash('md5');
        if (typeof value === 'string') {
            md5.update(value);
        }
        else if (value instanceof Date) {
            md5.update(value.toUTCString());
        }
        else {
            md5.update(JSON.stringify(value));
        }
        return md5.digest('hex');
    };

    module.exports = dataCommon;

})(this);
