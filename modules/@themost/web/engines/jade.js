/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var fs = require('fs');
var pug = require('pug');
var LangUtils = require('@themost/common/utils').LangUtils;
var ArgumentError = require('@themost/common/utils').ArgumentError;
var HttpViewEngine = require('../types').HttpViewEngine;
var _ = require('lodash');
var PostExecuteResultArgs = require('./../handlers/directive').PostExecuteResultArgs;
var DirectiveEngine = require('./../handlers/directive').DirectiveEngine;
var HttpViewContext = require('./../mvc').HttpViewContext;

/**
 * @this JadeEngine
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
    try {
        var self = this;
        if (typeof file !== 'string') {
            return callback(new ArgumentError("Jade template URI must be a string."));
        }
        fs.readFile(file, 'utf8', function(err, source) {
            if (err) {
                return callback(err);
            }
            //render data
            try {
                var fn = pug.compile(source, {
                    filename: file,
                    pretty: true
                });
                var html = { };
                Object.defineProperty(html, 'context', {
                    get: function() {
                        return self.context;
                    },
                    enumerable:false, configurable:false
                });
                var result = fn({
                    html:html,
                    model:data
                });
                return postRender.bind(self)(result, data, function(err, finalResult) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, finalResult);
                });
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
