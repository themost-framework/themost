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
var _ = require('lodash');
var fs = require('fs');
var DirectiveEngine = require('./../handlers/directive').DirectiveEngine;
var PostExecuteResultArgs = require('./../handlers/directive').PostExecuteResultArgs;
var HttpViewContext = require('./../mvc').HttpViewContext;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;

/**
 * @class
 * @constructor
 * @param {HttpContext=} context
 * @augments {HttpViewEngine}
 */
function NgEngine(context) {
    NgEngine.super_.bind(this)(context);
}
LangUtils.inherits(NgEngine, HttpViewEngine);

/**
 *
 * @param {string} filename
 * @param {*=} data
 * @param {Function} callback
 */
NgEngine.prototype.render = function(filename, data, callback) {
    var self = this;
    fs.readFile(filename,'utf-8', function(err, str) {
        try {
            if (err) {
                if (err.code === 'ENOENT') {
                    //throw not found exception
                    return callback(new HttpNotFoundError('View layout cannot be found.'));
                }
                return callback(err);
            }
            var viewContext = new HttpViewContext(self.getContext());
            viewContext.body = str;
            viewContext.data = data;
            var directiveHandler = new DirectiveEngine();
            var args = _.assign(new PostExecuteResultArgs(), {
                "context": self.getContext(),
                "target":viewContext
            });
            directiveHandler.postExecuteResult(args, function(err) {
                if (err) { return callback(err); }
                return callback(null, viewContext.body);
            });

        }
        catch (err) {
            callback(err);
        }
    });
};
/**
 * @param  {HttpContext=} context
 * @returns {NgEngine}
 */
NgEngine.createInstance = function(context) {
    return new NgEngine(context);
};


if (typeof exports !== 'undefined') {
    module.exports.NgEngine = NgEngine;
    /**
     * @param  {HttpContext=} context
     * @returns {NgEngine}
     */
    module.exports.createInstance = function(context) {
        return NgEngine.createInstance(context);
    };
}
