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
var ejs = require('ejs');
var path = require('path');
var fs = require('fs');
var Symbol = require('symbol');
var DirectiveEngine = require('./../handlers/directive').DirectiveEngine;
var PostExecuteResultArgs = require('./../handlers/directive').PostExecuteResultArgs;
var HttpViewContext = require('./../mvc').HttpViewContext;
var layoutFileProperty = Symbol();

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
 */ 
function EjsLocals() {
    
}

EjsLocals.prototype.layout = function(view){
    if (/\.html\.ejs$/ig) {
        this[layoutFileProperty] = view + '.html.ejs';
    }
    else {
        this[layoutFileProperty] = view;
    }
};

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
 * @param {Function} filterFunc
 */
EjsEngine.prototype.filter = function(name, filterFunc) {
    ejs.filters[name] = filterFunc;
};

/**
 *
 * @param {string} filename
 * @param {*=} data
 * @param {Function} callback
 */
EjsEngine.prototype.render = function(filename, data, callback) {
    var self = this;
    var locals;
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
                    // init locals as an instance of EjsLocals
                    locals = _.assign(new EjsLocals(), {
                            model: _.assign({ }, data),
                            html:new HttpViewHelper(self.context)
                    });
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
                    if (properties.layout) {
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
                        var body = ejs.render(str, locals);
                        // assign body
                        _.assign(locals, {
                            body: htmlResult
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
                                var result = ejs.render(layoutData,locals);
                                return postRender.bind(self)(result, locals.model, function(err, finalResult) {
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
                        // render
                        var htmlResult = ejs.render(str, locals);
                        // validate layout
                        if (typeof locals[layoutFileProperty] === 'string') {
                            // resolve layout file path (relative to this view)
                            var layoutFile = path.resolve(path.dirname(filename), locals[layoutFileProperty]);
                            // remove private layout attribute
                            delete locals[layoutFileProperty];
                            // assign body
                            _.assign(locals, {
                                body: htmlResult
                            });
                            // render layout file
                            return ejs.renderFile(layoutFile, locals, function(err, result) {
                               if (err) {
                                   return callback(err);
                               } 
                               // execute post render
                               return postRender.bind(self)(result, locals.model, function(err, finalResult) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null, finalResult);
                                });
                            });
                        }
                        return postRender.bind(self)(htmlResult, locals.model, function(err, finalResult) {
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
