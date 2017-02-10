/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
'use strict';
import {HttpViewContext} from './../mvc';
import {HttpNotFoundError} from '@themost/common/errors';
import {LangUtils} from '@themost/common/utils';
import {_} from 'lodash';
import aejs from 'async-ejs';
import path from 'path';



const step_ = function(funcs, onerror) {
    let counter = 0;
    let completed = 0;
    let pointer = 0;
    let ended = false;
    const state = {};
    let values = null;
    let complete = false;

    const check = function() {
        return complete && completed >= counter;
    };

    class next {
        constructor(err, value) {
            if (err && !ended) {
                ended = true;
                (onerror || noop).apply(state, [err]);
                return;
            }
            if (ended || (counter && !check())) {
                return;
            }

            const fn = funcs[pointer++];
            const args = (fn.length === 1 ? [next] : [value, next]);

            counter = completed = 0;
            values = [];
            complete = false;
            fn.apply(state, pointer < funcs.length ? args : [value, next]);
            complete = true;

            if (counter && check()) {
                next(null, values);
            }
        }

        static parallel(key) {
            const index = counter++;

            if (complete) {
                throw new Error('next.parallel must not be called async');
            }
            return function(err, value) {
                completed++;
                values[key ? key : index] = value;
                next(err, values);
            };
        }

        static skip(step) {
            pointer += step;
            return function (err, value) {
                next(err, value);
            }
        }
    }

    next();
};

/**
 * @param {string} src
 * @param {*} options
 * @param {Function} callback
 * @private
 */
const render_ = function(src, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    const fns = {
        file: function(filename, callback) {
            aejs.renderFile(filename, options, callback);
        }
    };
    //get prototype of options.local
    const proto = Object.getPrototypeOf(options);
    if (proto) {
        const keys = Object.keys(proto);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (typeof proto[key] === 'function')
                fns[key] = proto[key];
        }
    }
    step_([
        function(next) {
            const args = [];
            Object.keys(fns).forEach(function(name) {
                options[name] = function() {
                    args.push([name].concat(Array.prototype.slice.call(arguments)));
                };
            });
            const result = ejs.render(src, options);
            if (!args.length) {
                callback(null, result);
                return;
            }
            args.forEach(function(arg) {
                const name = arg.shift();
                arg.push(next.parallel());
                fns[name].apply(options, arg);
            });
        },
        function(results, next) {
            let i = 0;
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
 */
export default class AsyncEjsEngine {
    /**
     * @constructor
     * @param {HttpContext} context
     */
    constructor(context) {
        /**
         * @type {HttpContext}
         */
        let ctx = context;
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
    filter(name, fn) {
        ejs.filters[name] = fn;
    }

    render(filename, data, callback) {
        const self = this;
        try {
            const fs = require('fs'), common = require('@themost/common');
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
                        const matcher = /^(\s*)<%#(.*?)%>/;
                        let properties = { layout:null };
                        if (matcher.test(str)) {
                            const matches = matcher.exec(str);
                            properties = JSON.parse(matches[2]);
                            //remove match
                            str = str.replace(matcher,'');
                        }
                        //create view context
                        const viewContext = new HttpViewContext(self.context);
                        //extend view context with page properties
                        util._extend(viewContext, properties || {});
                        //set view context data
                        viewContext.data = data;
                        let partial = false;
                        if (self.context && self.context.request.route)
                            partial = LangUtils.parseBoolean(self.context.request.route['partial']);
                        if (properties.layout && !partial) {
                            let layout;
                            if (/^\//.test(properties.layout)) {
                                //relative to application folder e.g. /views/shared/master.html.ejs
                                layout = self.context.application.mapPath(properties.layout);
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
                                                return callback(new HttpNotFoundError('Master view layout cannot be found'));
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
    }
}
