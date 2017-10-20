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
import fs from 'fs';
import _ from 'lodash';
import {HttpNotFoundError} from '@themost/common/errors';
import {HttpViewEngine} from "../interfaces";
import {HttpViewContext} from "../mvc";
import {DirectiveHandler,PostExecuteResultArgs} from "../angular/module";

/**
 * @class
 * @classdesc NgEngine instance implements Angular JS View Engine for Server
 * @property {HttpContext} context
 * @augments {HttpViewEngine}
 */
export default class NgEngine extends HttpViewEngine {
    /**
     * @constructor
     * @param {HttpContext} context
     */
    constructor(context) {
        super(context);
    }

    /**
     *
     * @param {string} filename
     * @param {*=} data
     * @param {Function} callback
     */
    render(filename, data, callback) {
        const self = this;
        fs.readFile(filename,'utf-8', function(err, str) {
            try {
                if (err) {
                    if (err.code === 'ENOENT') {
                        //throw not found exception
                        return callback(new HttpNotFoundError('View layout cannot be found.'));
                    }
                    return callback(err);
                }
                const viewContext = new HttpViewContext(self.getContext());
                viewContext.body = str;
                viewContext.data = data;
                const directiveHandler = new DirectiveHandler();
                const args = _.assign(new PostExecuteResultArgs(), {
                    "context": self.getContext(),
                    "target":viewContext
                });
                directiveHandler.postExecuteResult(args, function(err) {
                    if (err) { return callback(err); }
                    return callback(null, viewContext.body);
                });

            }
            catch (err) {
                callback(err);
            }
        });
    }
}