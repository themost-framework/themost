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
var HttpViewResult = require('./../mvc').HttpViewResult;
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

    var template = (self.context.request && self.context.request.route && self.context.request.route.template) ||
        (self.context.request && self.context.request.routeData && self.context.request.routeData.template);
    var controller = self.context.request && self.context.request.route && self.context.request.route.controller;

    function renderFile(file, view, data, done) {
        fs.readFile(file,'utf-8', function(err, str) {
            try {
                if (err) {
                    if (err.code === 'ENOENT') {
                        //throw not found exception
                        return done(new HttpNotFoundError('View cannot be found.'));
                    }
                    return done(err);
                }
                var viewContext = new HttpViewContext(self.getContext());
                viewContext.body = str;
                viewContext.data = data;
                viewContext.templatePath =  view;
                var directiveHandler = new DirectiveEngine();
                var args = _.assign(new PostExecuteResultArgs(), {
                    "context": self.getContext(),
                    "target":viewContext
                });
                directiveHandler.postExecuteResult(args, function(err) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, viewContext.body);
                });
            }
            catch (err) {
                return done(err);
            }
        });
    }

    if (typeof template === 'string' && typeof controller === 'string') {
        return HttpViewResult.resolveViewPath(self.context, controller, template, {
            extension: "ng"
        }, function(err, layout) {
            if (layout) {
                return renderFile(layout, filename, data, callback);
            }
            else {
                return renderFile(filename, null, data, callback);
            }
        });
    }
    return renderFile(filename, null, data, callback);

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
