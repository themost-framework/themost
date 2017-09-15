/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var jade = require('jade'),
    fs = require('fs');

/**
 * @class
 * Represents a view engine that may be used in MOST Web Framework applications.
 * @param {HttpContext|*} context
 * @constructor
 * @property {HttpContext|*} context
 * @memberOf module:@themost/web/engines/jade
 */
function JadeEngine(context) {
    var ctx = context;
    Object.defineProperty(this, 'context', {
        get: function () {
            return ctx;
        },
        set: function (value) {
            ctx = value;
        },
        configurable: false,
        enumerable: false
    });
}

/**
 * Renders the view by attaching the data specified if any
 * @param {string|Function} file A string that represents the physical path of the view or a function which returns the view path
 * @param {*} data Any data to be attached in the result
 * @param {Function} callback A callback function to be called when rendering operation will be completed.
 */
JadeEngine.prototype.render = function(file, data, callback) {
    callback = callback || function() {};
    var self = this;
    var physicalPath;
    try {
        //if first argument is a function
        if (typeof file === 'function') {
            //invoke this function and return the physical path of the target view
            physicalPath = file.call();
        }
        else if (typeof file === 'string') {
            //otherwise get physical
            physicalPath = file;
        }
        else {
            //or raise error for invalid type
            return callback(new TypeError('The target view path has an invalid type or is empty.'));
        }
        fs.readFile(physicalPath, 'utf8', function(err, source) {
            if (err) {
                return callback(err);
            }
            //render data
            try {
                var fn = jade.compile(source), viewContext;
                data = data || { };
                Object.defineProperty(data, 'context', {
                     get: function() {
                         return self.context;
                    },
                    enumerable:false, configurable:false
                });
                var result = fn(data);
                return callback(null, result);
            }
            catch (err) {
                return callback(err);
            }
        });
    }
    catch(err) {
        return callback(err);
    }
};

if (typeof exports !== 'undefined')  {
    /** @module @themost/web/engines/jade */

    module.exports.JadeEngine = JadeEngine;
    /**
     * Creates a new instance of JadeEngine class
     * @param {HttpContext} context - The underlying HTTP context.
     * @returns {JadeEngine}
     */
    module.exports.createInstance = function(context) {
        return new JadeEngine(context);
    };
}
