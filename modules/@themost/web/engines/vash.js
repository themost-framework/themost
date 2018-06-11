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
var path = require('path');
var fs = require('fs');
var contextProperty = Symbol('context');
var _ = require('lodash');
var PostExecuteResultArgs = require('./../handlers/directive').PostExecuteResultArgs;
var DirectiveEngine = require('./../handlers/directive').DirectiveEngine;
var HttpViewContext = require('./../mvc').HttpViewContext;

/**
 * @this VashEngine
 * @param {string} result
 * @param {*} data
 * @param {Function} callback
 */
function postRender(result, data, callback) {
    var directiveHandler = new DirectiveEngine();
    var viewContext = new HttpViewContext(this.context);
    viewContext.body = result;
    viewContext.data = data;
    var args = _.assign(new PostExecuteResultArgs(), {
        "context": this.context,
        "target": viewContext
    });
    directiveHandler.postExecuteResult(args, function(err) {
        if (err) {
            return callback(err);
        }
        return callback(null, viewContext.body);
    });
}

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
                vash.config.settings = vash.config.settings || {};
                _.assign(vash.config.settings, {
                    views: path.resolve(self.getContext().getApplication().getExecutionPath(), "views")
                });
                var tpl = vash.compile(source);
                data = data || { };
                data[contextProperty] = self.context;
                tpl(data, function(err, ctx) {
                    if (err) {
                        return callback(err);
                    }
                    try {
                        var result = ctx.finishLayout();
                        return postRender.bind(self)(result, data, function(err, finalResult) {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, finalResult);
                        });
                    }
                    catch(err) {
                        return callback(err);
                    }

                });
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
    return new VashEngine(context);
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
