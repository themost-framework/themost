/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import {HttpViewContext} from '../mvc';
import {HttpNotFoundError} from '@themost/common/errors';
import {LangUtils} from '@themost/common/utils';
import _ from 'lodash';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import {HttpViewEngine} from "../interfaces";

/**
 * @class
 */
export default class EjsEngine extends HttpViewEngine {
    /**
     *
     * @param {HttpContext} context
     */
    constructor(context) {
        super(context);
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
                        /**
                         *
                         * @type {{layout:string}}
                         */
                        let properties = { };
                        if (matcher.test(str)) {
                            const matches = matcher.exec(str);
                            properties = JSON.parse(matches[2]);
                            //remove match
                            str = str.replace(matcher,'');
                        }
                        //create view context
                        const viewContext = new HttpViewContext(self.getContext());
                        let partial = false;
                        const model = _.assign(properties, data, {
                            getContext: function() {
                                return self.getContext();
                            },
                            getViewContext: function() {
                                return viewContext;
                            }
                        });
                        _.assign(model, properties || { });
                        //for backward compatibility issues add locals.context property
                        //this property is going to be deprecated (use locals.getContext() instead)
                        Object.defineProperty(model, 'context', {
                            get: function() {
                                return self.getContext();
                            },
                            enumerable:false, configurable:false
                        });
                        if (self.getContext() && self.getContext().request.route)
                            partial = LangUtils.parseBoolean(self.getContext().request.route['partial']);
                        if (properties.layout && !partial) {
                            let layout;
                            if (/^\//.test(properties.layout)) {
                                //relative to application folder e.g. /views/shared/master.html.ejs
                                layout = self.getContext().getApplication().mapExecutionPath(properties.layout);
                            }
                            else {
                                //relative to view file path e.g. ./../master.html.html.ejs
                                layout = path.resolve(filename, properties.layout);
                            }

                            viewContext.body = ejs.render(str, {
                                model: model
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
                                    const result = ejs.render(layoutData, {
                                        model:model
                                    });
                                    callback(null, result);
                                }
                                catch (e) {
                                    callback(e);
                                }
                            });
                        }
                        else {
                            const result = ejs.render(str, {
                                model:model
                            });
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
