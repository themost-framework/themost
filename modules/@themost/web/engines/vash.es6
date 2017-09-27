/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import vash from 'vash';
import fs from 'fs';
const contextProperty = Symbol('context');

/**
 * @name compile
 * @type {Function}
 * @memberOf vash
 *
 * @name helpers
 * @type {*}
 * @memberOf vash
 */

vash.helpers.context = model => model[contextProperty];


/**
 * @class
 * Represents a view engine that may be used in MOST Web Framework applications.
 * @param {HttpContext|*} context
 * @constructor
 * @property {HttpContext|*} context
 */
class VashEngine {
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
     * @param {function(Error=,string=)} callback A callback function to be called when rendering operation will be completed.
     */
    render(file, data, callback) {
        callback = callback || (() => {});
        const self = this;
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
                return callback(new TypeError('The target view path has an invalid type or is empty.'));
            }
            fs.readFile(physicalPath, 'utf8', (err, source) => {
                if (err) {
                    return callback(err);
                }
                /**
                 * @name compile
                 * @memberOf vash
                 */
                //render data
                try {
                    const fn = vash.compile(source);
                    data = data || { };
                    data[contextProperty] = self.context;
                    const result = fn(data);
                    return callback(null, result);
                }
                catch (e) {
                    return callback(e);
                }
            });
        }
        catch(e) {
            return callback(e);
        }
    }
}
//noinspection JSUnusedGlobalSymbols
export default VashEngine;
