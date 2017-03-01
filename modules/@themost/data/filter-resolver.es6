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
import {FunctionContext} from './functions';

/**
 * @ignore
 * @class
 * @abstract
 * @augments DataModel
 */
export class DataFilterResolver {

    constructor() {
        //
    }

    resolveMember(member, callback) {
        if (/\//.test(member)) {
            const arr = member.split('/');
            callback(null, arr.slice(arr.length-2).join('.'));
        }
        else {
            callback(null, this.viewAdapter.concat('.', member))
        }
    }

    resolveMethod(name, args, callback) {
        callback = callback || function() { };
        if (typeof DataFilterResolver.prototype[name] === 'function') {
            const a = args || [];
            a.push(callback);
            try {
                return DataFilterResolver.prototype[name].apply(this, a);
            }
            catch(e) {
                return callback(e);
            }

        }
        callback();
    }

    /**
     * @param {Function} callback
     */
    me(callback) {
        const fx = new FunctionContext(this.context, this);
        fx.user().then(function(value) {
            callback(null, value)
        }).catch(function(err) {
            callback(err);
        });
    }

    /**
     * @param {Function} callback
     */
    now(callback) {
        callback(null, new Date());
    }

    /**
     * @param {Function} callback
     */
    today(callback) {
        const res = new Date();
        res.setHours(0,0,0,0);
        callback(null, res);
    }

    /**
     * @param {Function} callback
     */
    user(callback) {
        return this.me(callback);
    }

}
