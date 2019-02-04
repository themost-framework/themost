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
var viewProperty = Symbol();
var scriptsProperty = Symbol();
var stylesheetsProperty = Symbol();

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
    this[scriptsProperty] = new Array();
    this[stylesheetsProperty] = new Array();
}
/**
 * @param {string} view
 */ 
EjsLocals.prototype.layout = function(view) {
    // validate view
    if (typeof view !== 'string') {
        throw new TypeError('Include view must be a string');
    }
    // if view does not have extension e.g. ../shared/master
    if (!/\.html\.ejs$/ig.test(view)) {
        // add .html.ejs extension
        this[layoutFileProperty] = view + '.html.ejs';
    }
    else {
        this[layoutFileProperty] = view;
    }
};
/**
 * @param {string} view
 * @param {*} data
 */ 
EjsLocals.prototype.partial = function(view, data){
    if (typeof view !== 'string') {
        throw new TypeError('Include view must be a string');
    }
    // if view does not have extension e.g. ../shared/master
    if (!/\.html\.ejs$/ig.test(view)) {
        // add .html.ejs extension
        view = view + '.html.ejs';
    }
    if (typeof this[viewProperty] !== 'string') {
        throw new TypeError('Current view must be a string');
    }
    // get include view file path
    var includeFile = path.resolve(path.dirname(this[viewProperty]), view);
    // get source
    var source;
    // if process running in development mode
    if (process.env.NODE_ENV === 'development') {
        // get original source
        source = fs.readFileSync(includeFile, 'utf-8');    
    }
    else {
        // otherwise search cache
        source = ejs.cache.get(includeFile);
        // if source is already loaded do nothing
        if (typeof source === 'undefined') {
            // otherwise read file
            source = fs.readFileSync(includeFile, 'utf-8');
            // and set file to cache
            ejs.cache.set(includeFile, source);
        }
    }
    // if data is undefined
    if (typeof data === 'undefined') {
        // do nothing  
        return;
    }
    else {
        // get context
        var context;
        if (this.html && this.html.context) {
            context = this.html.context;
        }
        // if data is array
        if (_.isArray(data)) {
            return _.map(data, function(item) {
                // init locals
                var locals = _.assign(new EjsLocals(), {
                        // set current model
                        model: item,
                        // set view helper
                        html: new HttpViewHelper(context)
                });
                // render view
                return ejs.render(source, locals);
            }).join('\n');
        }
        else {
            // init a new instance of EjsLocals class
            var locals = _.assign(new EjsLocals(), {
                    // set current model
                    model: data,
                    // set view helper
                    html: new HttpViewHelper(context)
            });
            // render view
            return ejs.render(source, locals);
        }
        
    }
};

/**
 * @param {string} view
 * @param {*=} data
 */ 
EjsLocals.prototype.include = function(view, data){
    if (typeof view !== 'string') {
        throw new TypeError('Include view must be a string');
    }
    // if view does not have extension e.g. ../shared/master
    if (!/\.html\.ejs$/ig.test(view)) {
        // add .html.ejs extension
        view = view + '.html.ejs';
    }
    if (typeof this[viewProperty] !== 'string') {
        throw new TypeError('Current view must be a string');
    }
    // get include view file path
    var includeFile = path.resolve(path.dirname(this[viewProperty]), view);
    // get source
    var source;
    // if process running in development mode
    if (process.env.NODE_ENV === 'development') {
        // get original source
        source = fs.readFileSync(includeFile, 'utf-8');    
    }
    else {
        // otherwise search cache
        source = ejs.cache.get(includeFile);
        // if source is already loaded do nothing
        if (typeof source === 'undefined') {
            // otherwise read file
            source = fs.readFileSync(includeFile, 'utf-8');
            // and set file to cache
            ejs.cache.set(includeFile, source);
        }
    }
    // if data is undefined
    if (typeof data === 'undefined') {
        // render view with current locals
        return ejs.render(source, this);    
    }
    else {
        // get context
        var context;
        if (this.html && this.html.context) {
            context = this.html.context;
        }
        // init a new instance of EjsLocals class
        var locals = _.assign(new EjsLocals(), {
                // set current model
                model: data,
                // set view helper
                html: new HttpViewHelper(context)
        });
        // render view
        return ejs.render(source, locals);
    }
};

EjsLocals.prototype.script = function(path, type) {
  if (path) {
    this[scriptsProperty].push('<script src="'+path+'"'+(type ? 'type="'+type+'"' : '')+'></script>');
  }
  return this;
};

EjsLocals.prototype.stylesheet = function(path, media) {
  if (path) {
    this[stylesheetsProperty].push('<link rel="stylesheet" href="'+path+'"'+(media ? 'media="'+media+'"' : '')+' />');
  }
  return this;
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
    var source;
    try {
        if (process.env.NODE_ENV === 'development') {
            source = fs.readFileSync(filename,'utf-8');
        }
        else {
            source = ejs.cache.get(filename);
            if (typeof source === 'undefined') {
                //read file
                source = fs.readFileSync(filename,'utf-8');
                // set file to cache
                ejs.cache.set(filename, source);
            }
        }
        
        // init locals as an instance of EjsLocals
        locals = _.assign(new EjsLocals(), {
                model: data,
                html:new HttpViewHelper(self.context)
        });
        // set current view propertry
        locals[viewProperty] = filename;
        //get view header (if any)
        var matcher = /^(\s*)<%#(.*?)%>/;
        var properties = {
            /**
             * @type {string|*}
             */
            layout:null
        };
        if (matcher.test(source)) {
            var matches = matcher.exec(source);
            properties = JSON.parse(matches[2]);
            //remove match
            source = source.replace(matcher,'');
            // deprecated message
            console.log('INFO', 'Layout syntax e.g. <%# { "layout":"../shared/master.html.ejs" } %> is deprecated and it\'s going to be removed in a future version. Use layout() method instead e.g. <% layout(\'../shared/master\')%>.');
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
            var body = ejs.render(source, locals);
            // assign body
            _.assign(locals, {
                body: body
            });
            //render master layout
            return ejs.renderFile(layout, locals, {
                cache: process.env.NODE_ENV !== 'development'
            }, function(err, result) {
                try {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            return callback(new HttpNotFoundError('Master view layout cannot be found'));
                        }
                        return callback(err);
                    }
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
            var htmlResult = ejs.render(source, locals);
            // validate layout
            if (typeof locals[layoutFileProperty] === 'string') {
                // resolve layout file path (relative to this view)
                var layoutFile = path.resolve(path.dirname(filename), locals[layoutFileProperty]);
                // remove private layout attribute
                delete locals[layoutFileProperty];
                // assign body, scripts and stylesheets
                _.assign(locals, {
                    body: htmlResult,
                    scripts: locals[scriptsProperty].join('\n'),
                    stylesheets: locals[stylesheetsProperty].join('\n'),
                });
                // render layout file
                return ejs.renderFile(layoutFile, locals, {
                    cache: process.env.NODE_ENV !== 'development'
                }, function(err, result) {
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
    catch (err) {
        if (err.code === 'ENOENT') {
            //throw not found exception
            return callback(new HttpNotFoundError('View layout cannot be found.'));
        }
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
