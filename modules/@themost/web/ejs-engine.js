/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-09
 */
/**
 * @ignore
 */
var web = require('./index'),
    async = require('async'),
    ejs = require('ejs'),
    util = require('util'),
    path = require('path');
/**
 * @class EjsEngine
 * @param {HttpContext=} context
 * @constructor
 * @property {HttpContext} context Gets or sets an instance of HttpContext that represents the current HTTP context.
 */
function EjsEngine(context) {
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
        var fs = require('fs'), common = require('./common');
        fs.readFile(filename,'utf-8', function(err, str) {
            try {
                if (err) {
                    if (err.code === 'ENOENT') {
                        //throw not found exception
                        return callback(new common.HttpNotFoundException('View layout cannot be found.'));
                    }
                    return callback(err);
                }
                else {
                    //get view header (if any)
                    var matcher = /^(\s*)<%#(.*?)%>/;
                    var properties = { layout:null };
                    if (matcher.test(str)) {
                        var matches = matcher.exec(str);
                        properties = JSON.parse(matches[2]);
                        //remove match
                        str = str.replace(matcher,'');
                    }
                    //create view context
                    var viewContext = web.views.createViewContext(self.context);
                    //extend view context with page properties
                    util._extend(viewContext, properties || {});
                    //set view context data
                    viewContext.data = data;
                    var partial = false;
                    if (self.context && self.context.request.route)
                        partial = common.parseBoolean(self.context.request.route['partial']);
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
                                        return callback(new common.HttpNotFoundException('Master view layout cannot be found'));
                                    }
                                    return callback(err);
                                }
                                var result = ejs.render(layoutData, viewContext);
                                callback(null, result);
                            }
                            catch (e) {
                                callback(e);
                            }
                        });
                    }
                    else {
                        var result = ejs.render(str, viewContext);
                        callback(null, result);
                    }
                }
            }
            catch (e) {
                callback(e);
            }
        });

    }
    catch (e) {
        callback.call(self, e);
    }
};

/**
 *
 * @param  {HttpContext=} context
 * @returns {EjsEngine}
 */
EjsEngine.prototype.createInstance = function(context) {
    return new EjsEngine(context);
};

if (typeof exports !== 'undefined') module.exports.createInstance = EjsEngine.prototype.createInstance;
