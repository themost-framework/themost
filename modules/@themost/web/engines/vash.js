/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var LangUtils = require('@themost/common/utils').LangUtils;
var HttpViewEngine = require('../types').HttpViewEngine;
var Symbol = require('symbol');
var vash = require('vash');
var fs = require('fs');
var contextProperty = Symbol('context');
/**
 *
 * @param model
 * @returns {HttpContext}
 */
vash.helpers.context = function(model) {
    return model[contextProperty];
};

/**
 * @name compile
 * @type {Function}
 * @memberOf vash
 *
 * @name helpers
 * @type {*}
 * @memberOf vash
 */

/**
 * @class
 * @constructor
 * @param {HttpContext=} context
 * @augments {HttpViewEngine}
 */
function VashEngine(context) {
    VashEngine.super_.bind(this)(context);
}
LangUtils.inherits(VashEngine, HttpViewEngine);

/**
 *
 * @param {string} filename
 * @param {*=} data
 * @param {Function} callback
 */
VashEngine.prototype.render = function(filename, data, callback) {
    callback = callback || function() {};
    const self = this;
    try {
        fs.readFile(filename, 'utf8', function(err, source) {
            if (err) {
                return callback(err);
            }
            //render data
            try {
                var fn = vash.compile(source);
                data = data || { };
                data[contextProperty] = self.context;
                const result = fn(data);
                return callback(null, result);
            }
            catch (err) {
                    return callback(err);
                }
            });
    }
    catch(e) {
        return callback(e);
    }
};
/**
 * @param  {HttpContext=} context
 * @returns {VashEngine}
 */
VashEngine.createInstance = function(context) {
    return VashEngine.createInstance(context);
};


if (typeof exports !== 'undefined') {
    module.exports.VashEngine = VashEngine;
    /**
     * @param  {HttpContext=} context
     * @returns {VashEngine}
     */
    module.exports.createInstance = function(context) {
        return VashEngine.createInstance(context);
    };
}
