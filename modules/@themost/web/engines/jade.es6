/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import jade from 'jade';
import fs from 'fs';


/**
 * @class
 * Represents a view engine that may be used in MOST Web Framework applications.
 * @param {HttpContext|*} context
 * @constructor
 * @property {HttpContext|*} context
 */
class JadeEngine {
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
                //render data
                try {
                    const fn = jade.compile(source);
                    data = data || { };
                    Object.defineProperty(data, 'context', {
                        get: function() {
                            return self.context;
                        },
                        enumerable:false, configurable:false
                    });
                    const result = fn(data);
                    return callback(null, result);
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

//noinspection JSUnusedGlobalSymbols
export default JadeEngine;