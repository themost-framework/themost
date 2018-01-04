/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var fs = require('fs');
var jade = require('jade');
var LangUtils = require('@themost/common/utils').LangUtils;
var ArgumentError = require('@themost/common/utils').ArgumentError;
var HttpViewEngine = require('../types').HttpViewEngine;
/**
 * @class
 * @param {HttpContext=} context
 * @constructor
 * @augments {HttpViewEngine}
 */
function JadeEngine(context) {
    JadeEngine.super_.bind(this)(context);
}
LangUtils.inherits(JadeEngine,HttpViewEngine);
/**
 * @param {string} file
 * @param {*} data
 * @param {Function} callback
 */
JadeEngine.prototype.render = function(file, data, callback) {
    callback = callback || function () {};
    var physicalPath;
    try {
        if (typeof file !== 'string') {
            return callback(new ArgumentError("Jade template URI must be a string."));
        }
        fs.readFile(physicalPath, 'utf8', function(err, source) {
            if (err) {
                return callback(err);
            }
            //render data
            try {
                const fn = jade.compile(source);
                var html = { };
                Object.defineProperty(html, 'context', {
                    get: function() {
                        return self.context;
                    },
                    enumerable:false, configurable:false
                });
                const result = fn({
                    html:html,
                    model:data
                });
                return callback(null, result);
            }
            catch (err) {
                    return callback(err);
                }
    });
    } catch (err) {
        return callback(err);
    }
};
/**
 * @static
 * @param  {HttpContext=} context
 * @returns {JadeEngine}
 */
JadeEngine.createInstance = function(context) {
    return new JadeEngine(context);
};

if (typeof exports !== 'undefined') {
    module.exports.JadeEngine = JadeEngine;
    /**
     * @param {HttpContext=} context
     * @returns {JadeEngine}
     */
    module.exports.createInstance = function(context) {
        return JadeEngine.createInstance(context);
    };
}