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
var HttpNotFoundError = require('@themost/common').HttpNotFoundError;
var Args = require('@themost/common').Args;

/**
 * A standalone application for implementing NgEngine under native environments
 * @constructor
 */
function NgApplication() {
    // set services
    Object.defineProperty(this, 'services', {
        value: {}
    });
}

NgApplication.prototype.hasService = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    return this.services.hasOwnProperty(serviceCtor.name);
};

NgApplication.prototype.useService = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    this.services[serviceCtor.name] = new serviceCtor(this);
    return this;
};

NgApplication.prototype.getService = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    return this.services[serviceCtor.name];
};

// noinspection JSClosureCompilerSyntax
/**
 * A standalone context for implementing NgEngine under native environments
 * @constructor
 * @augments HttpContext
 */
function NgContext() {
    this.application = null;
    this.request = null;
    this.response = null;
}

NgContext.prototype.getApplication = function() {
    return this.application;
};

// noinspection JSClosureCompilerSyntax
/**
 * @class
 * @constructor
 * @param {HttpContext=} context
 * @augments HttpViewEngine
 */
function NgEngine(context) {
    NgEngine.super_.bind(this)(context);
}
LangUtils.inherits(NgEngine, HttpViewEngine);

/**
 *
 * @param {string} filename
 * @param {*=} data
 * @param {Function=} callback
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
 *
 * @param {string} str - A string which represents the template to be rendered
 * @param {*=} data - Any object which represents the data to be used while rendering
 * @returns Promise<any>
 */
NgEngine.prototype.renderString = function(str, data) {
    const self = this;
    return new Promise((resolve, reject) => {
        var viewContext = new HttpViewContext(self.getContext());
        viewContext.body = str;
        viewContext.data = data || {};
        var directiveHandler = new DirectiveEngine();
        var args = Object.assign(new PostExecuteResultArgs(), {
            "context": self.getContext(),
            "target":viewContext
        });
        directiveHandler.postExecuteResult(args, function(err) {
            if (err) {
                return reject(err);
            }
            return resolve(viewContext.body);
        });
    });

};

/**
 * @param  {HttpContext=} context
 * @returns {NgEngine}
 */
NgEngine.createInstance = function(context) {
    return new NgEngine(context);
};

module.exports.NgEngine = NgEngine;
module.exports.NgApplication = NgApplication;
module.exports.NgContext = NgContext;
/**
 * @param  {HttpContext=} context
 * @returns {NgEngine}
 */
module.exports.createInstance = function(context) {
    return NgEngine.createInstance(context);
};
