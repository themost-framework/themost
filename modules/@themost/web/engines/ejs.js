/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var HttpViewContext = require('../mvc').HttpViewContext;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;
var LangUtils = require('@themost/common/utils').LangUtils;
var _ = require('lodash');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');

/** @module @themost/web/engines/ejs */

/**
 * @class
 * @param {HttpContext=} context
 * @constructor
 * @property {HttpContext} context Gets or sets an instance of HttpContext that represents the current HTTP context.
 * @memberOf module:@themost/web/engines/ejs
 */
function EjsEngine(context) {
    /**
     * @type {HttpContext}
     */
    var context_ = context;
    Object.defineProperty(this,'context', {
        get: function() {
            return context_;
        },
        set: function(value) {
            context_ = value;
        },
        configurable:false,
        enumerable:false
    });
}

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
                    var properties = { };
                    if (matcher.test(str)) {
                        var matches = matcher.exec(str);
                        properties = JSON.parse(matches[2]);
                        //remove match
                        str = str.replace(matcher,'');
                    }
                    //create view context
                    var viewContext = new HttpViewContext(self.context);
                    //extend view context with page properties
                    _.assign(viewContext, properties || {});
                    //set view context data
                    viewContext.data = data;
                    var partial = false;
                    if (self.context && self.context.request.route)
                        partial = LangUtils.parseBoolean(self.context.request.route['partial']);
                    if (properties.layout && !partial) {
                        var layout;
                        if (/^\//.test(properties.layout)) {
                            //relative to application folder e.g. /views/shared/master.html.ejs
                            layout = self.context.application.mapPath(properties.layout);
                        }
                        else {
                            //relative to view file path e.g. ./../master.html.html.ejs
                            layout = path.resolve(filename, properties.layout);
                        }
                        //set current view buffer (after rendering)
                        viewContext.body = ejs.render(str, viewContext);
                        //render master layout
                        fs.readFile(layout,'utf-8', function(err, layoutData) {
                            try {
                                if (err) {
                                    if (err.code === 'ENOENT') {
                                        return callback(new HttpNotFoundError('Master view layout cannot be found'));
                                    }
                                    return callback(err);
                                }
                                var result = ejs.render(layoutData, viewContext);
                                callback(null, result);
                            }
                            catch (err) {
                                return callback(err);
                            }
                        });
                    }
                    else {
                        var result = ejs.render(str, viewContext);
                        return callback(null, result);
                    }
                }
            }
            catch (err) {
                return callback(err);
            }
        });

    }
    catch (err) {
        return callback(err);
    }
};

/**
 *
 * @param  {HttpContext} context
 * @returns {EjsEngine}
 */
EjsEngine.createInstance = function(context) {
    return new EjsEngine(context);
};

/**
 *  @typedef EjsEngine
 *  @type {EjsEngine}
 */


if (typeof exports !== 'undefined') {

    module.exports.EjsEngine = EjsEngine;
    /**
     * @returns {EjsEngine}
     */
    module.exports.createInstance = function(context) {
        return EjsEngine.createInstance(context)
    };
}
