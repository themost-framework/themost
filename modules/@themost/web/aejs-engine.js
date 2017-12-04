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
var app = require('./index'),
    async = require('async'),
    path = require('path'),
    aejs = require('async-ejs'),
    ejs = require('ejs'),
    fs = require('fs'),
    util = require('util');


var step_ = function(funcs, onerror) {
    var counter = 0;
    var completed = 0;
    var pointer = 0;
    var ended = false;
    var state = {};
    var values = null;
    var complete = false;

    var check = function() {
        return complete && completed >= counter;
    };
    var next = function(err, value) {
        if (err && !ended) {
            ended = true;
            (onerror || noop).apply(state, [err]);
            return;
        }
        if (ended || (counter && !check())) {
            return;
        }

        var fn = funcs[pointer++];
        var args = (fn.length === 1 ? [next] : [value, next]);

        counter = completed = 0;
        values = [];
        complete = false;
        fn.apply(state, pointer < funcs.length ? args : [value, next]);
        complete = true;

        if (counter && check()) {
            next(null, values);
        }
    };
    next.parallel = function(key) {
        var index = counter++;

        if (complete) {
            throw new Error('next.parallel must not be called async');
        }
        return function(err, value) {
            completed++;
            values[key ? key : index] = value;
            next(err, values);
        };
    };
    next.skip = function (step) {
        pointer += step;
        return function (err, value) {
            next(err, value);
        }
    };
    next();
};

/**
 * @param {string} src
 * @param {*} options
 * @param {Function} callback
 * @private
 */
var render_ = function(src, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    var fns = {
        file: function(filename, callback) {
            aejs.renderFile(filename, options, callback);
        }
    };
    //get prototype of options.local
    var proto = Object.getPrototypeOf(options);
    if (proto) {
        var keys = Object.keys(proto);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (typeof proto[key] === 'function')
                fns[key] = proto[key];
        }
    }
    step_([
        function(next) {
            var args = [];
            Object.keys(fns).forEach(function(name) {
                options[name] = function() {
                    args.push([name].concat(Array.prototype.slice.call(arguments)));
                };
            });
            var result = ejs.render(src, options);
            if (!args.length) {
                callback(null, result);
                return;
            }
            args.forEach(function(arg) {
                var name = arg.shift();
                arg.push(next.parallel());
                fns[name].apply(options, arg);
            });
        },
        function(results, next) {
            var i = 0;
            Object.keys(fns).forEach(function(name) {
                options[name] = function() {
                    return results[i++];
                }
            });
            src = ejs.render(src, options);
            callback(null,src);
        }
    ], callback);
};
//override render method of async-ejs
aejs.render = render_;

/**
 * @class
 * @param {HttpContext} context
 * @constructor
 * @private
 */
function AsyncEjsEngine(context) {
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
AsyncEjsEngine.prototype.filter = function(name, fn) {
    ejs.filters[name] = fn;
};

AsyncEjsEngine.prototype.render = function(filename, data, callback) {
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
                    var viewContext = app.views.createViewContext(self.context);
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
                            layout = app.current.mapPath(properties.layout);
                        }
                        else {
                            //relative to view file path e.g. ./../master.html.html.ejs
                            layout = path.resolve(filename, properties.layout);
                        }
                        //set current view buffer (after rendering)
                        aejs.render(str, viewContext, function (err, body) {
                            if (err) {
                                return callback(err);
                            }
                            viewContext.body = body;
                            fs.readFile(layout,'utf-8', function(err, layoutData) {
                                try {
                                    if (err) {
                                        if (err.code === 'ENOENT') {
                                            return callback(new common.HttpNotFoundException('Master view layout cannot be found'));
                                        }
                                        return callback(err);
                                    }
                                    aejs.render(layoutData, viewContext , function (err, result) {
                                        return callback(null, result);
                                    });
                                }
                                catch (e) {
                                    callback(e);
                                }
                            });
                        });
                        
                    }
                    else {
                        aejs.render(str, viewContext , function (err, result) {
                            return callback(null, result);
                        });
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
 * @returns {AsyncEjsEngine}
 */
AsyncEjsEngine.prototype.createInstance = function(context) {
    return new AsyncEjsEngine(context);
};

if (typeof exports !== 'undefined') module.exports.createInstance = AsyncEjsEngine.prototype.createInstance;
