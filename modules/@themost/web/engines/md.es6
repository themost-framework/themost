/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
import pagedown from 'pagedown';
import fs from 'fs';
import {Extra} from './pagedown/pagedown-extra';

/**
 * @class MarkdownEngine
 * Represents a view engine that may be used in MOST web framework applications.
 * @param {HttpContext} context
 * @constructor
 * @property {HttpContext} context
 */
export default class MarkdownEngine {
    constructor(context) {
        let ctx = context;
        Object.defineProperty(this, 'context', {
            get: function () {
                return ctx;
            },
            set: function (value) {
                ctx = value;
            },
            configurable: false,
            enumerable: false
        });
    }

    /**
     * Renders the view by attaching the data specified if any
     * @param {string|Function} file A string that represents the physical path of the view or a function which returns the view path
     * @param {*} data Any data to be attached in the result
     * @param {Function} callback A callback function to be called when rendering operation will be completed.
     */
    render(file, data, callback) {
        callback = callback || (() => {});
        let physicalPath;
        try {
            //if first argument is a function
            if (typeof file === 'function') {
                //invoke this function and return the physical path of the target view
                physicalPath = file.call();
            }
            else if (typeof file === 'string') {
                //otherwise get physical
                physicalPath = file;
            }
            else {
                //or raise error for invalid type
                callback(new TypeError('The target view path has an invalid type or is empty.'));
                return;
            }
            fs.readFile(physicalPath, 'utf8', (err, data) => {
               if (err) {
                   //throw error
                   return callback(err);
               }
                try {
                    /**
                     * @type {Markdown.Converter|*}
                     */
                    const converter = new pagedown.Converter();
                    Extra.init(converter);
                    const result = converter.makeHtml(data);
                    //return the converted HTML markup
                    callback(null, result);
                }
                catch (err) {
                    return callback(err);
                }
            });
        }
        catch(err) {
            return callback(err);
        }

    }
}
