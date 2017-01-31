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
import {HttpViewContext} from './../mvc';
import {HttpNotFoundError} from '@themost/common/errors';
import {LangUtils} from '@themost/common/utils';
import {_} from 'lodash';
import ejs from 'ejs';
import path from 'path';


/**
 * @class
 * @param {HttpContext=} context
 * @constructor
 * @property {HttpContext} context Gets or sets an instance of HttpContext that represents the current HTTP context.
 */
export default class EjsEngine {
    /**
     *
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

    /**
     *
     * @param {string} filename
     * @param {*=} data
     * @param {Function} callback
     */
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
                        _.assign(viewContext, properties || {});
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
                                    const result = ejs.render(layoutData, viewContext);
                                    callback(null, result);
                                }
                                catch (e) {
                                    callback(e);
                                }
                            });
                        }
                        else {
                            const result = ejs.render(str, viewContext);
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
    }
}
