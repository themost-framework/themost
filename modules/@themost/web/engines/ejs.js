/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var _ = require('lodash');
var HttpViewHelper = require('../helpers').HtmlViewHelper;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;
var parseBoolean = require('@themost/common/utils').LangUtils.parseBoolean;
var ejs = require('ejs');
var path = require('path');
var fs = require('fs');
var DirectiveEngine = require('./../handlers/directive').DirectiveEngine;
var PostExecuteResultArgs = require('./../handlers/directive').PostExecuteResultArgs;
var HttpViewContext = require('./../mvc').HttpViewContext;
var partialProperty = "partial";

/**
 * @this EjsEngine
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
 */
function EjsEngine(context) {

    /**
     * @property
     * @name EjsEngine#context
     * @type HttpContext
     * @description Gets or sets an instance of HttpContext that represents the current HTTP context.
     */
    /**
     * @type {HttpContext}
     */
    var ctx = context;
    Object.defineProperty(this,'context', {
        get: function() {
            return ctx;
        },
        set: function(value) {
            ctx = value;
        },
        configurable:false,
        enumerable:false
    });
}

/**
 * @returns {HttpContext}
 */
EjsEngine.prototype.getContext = function() {
    return this.context;
};

/**
 * Adds a EJS filter to filters collection.
 * @param {string} name
 * @param {Function} fn
 */
EjsEngine.prototype.filter = function(name, fn) {
    ejs.filters[name] = fn;
};

/**
 *
 * @param {string} filename
 * @param {*=} data
 * @param {Function} callback
 */
EjsEngine.prototype.render = function(filename, data, callback) {
    var self = this;
    try {
        fs.readFile(filename,'utf-8', function(err, str) {
            try {
                if (err) {
                    if (err.code === 'ENOENT') {
                        //throw not found exception
                        return callback(new HttpNotFoundError('View layout cannot be found.'));
                    }
                    return callback(err);
                }
                else {
                    //get view header (if any)
                    var matcher = /^(\s*)<%#(.*?)%>/;
                    var properties = {
                        /**
                         * @type {string|*}
                         */
                        layout:null
                    };
                    if (matcher.test(str)) {
                        var matches = matcher.exec(str);
                        properties = JSON.parse(matches[2]);
                        //remove match
                        str = str.replace(matcher,'');
                    }
                    //create view context
                    var partial = false;
                    if (self.context && self.context.request.route) {
                        partial = parseBoolean(self.context.request.route[partialProperty]);
                    }
                    var model;
                    if (_.isArray(data)) {
                        model = _.assign([], properties, data);
                    }
                    else {
                        model = _.assign(properties, data);
                    }
                    if (properties.layout && !partial) {
                        var layout;
                        if (/^\//.test(properties.layout)) {
                            //relative to application folder e.g. /views/shared/master.html.ejs
                            layout = self.context.getApplication().mapExecutionPath(properties.layout);
                        }
                        else {
                            //relative to view file path e.g. ./../master.html.html.ejs
                            layout = path.resolve(path.dirname(filename), properties.layout);
                        }
                        //set current view buffer (after rendering)
                        var body = ejs.render(str, {
                            model: model,
                            html:new HttpViewHelper(self.context)
                        });
                        //render master layout
                        fs.readFile(layout,'utf-8', function(err, layoutData) {
                            try {
                                if (err) {
                                    if (err.code === 'ENOENT') {
                                        return callback(new HttpNotFoundError('Master view layout cannot be found'));
                                    }
                                    return callback(err);
                                }
                                var result = ejs.render(layoutData, {
                                    model: model,
                                    html:new HttpViewHelper(self.context),
                                    body: body
                                });
                                return postRender.bind(self)(result, model, function(err, finalResult) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null, finalResult);
                                });
                            }
                            catch (err) {
                                callback(err);
                            }
                        });
                    }
                    else {
                        var result = ejs.render(str, {
                            model: model,
                            html: new HttpViewHelper(self.context)
                        });
                        return postRender.bind(self)(result, model, function(err, finalResult) {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, finalResult);
                        });
                    }
                }
            }
            catch (err) {
                callback(err);
            }
        });

    }
    catch (err) {
        return callback(err);
    }
};

/**
 * @static
 * @param  {HttpContext=} context
 * @returns {EjsEngine}
 */
EjsEngine.createInstance = function(context) {
    return new EjsEngine(context);
};

if (typeof exports !== 'undefined') {
    module.exports.EjsEngine = EjsEngine;
    /**
     * @param  {HttpContext=} context
     * @returns {EjsEngine}
     */
    module.exports.createInstance = function(context) {
        return EjsEngine.createInstance(context);
    };
}
