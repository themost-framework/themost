/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var Q = require('q');
var functions = require('./functions');

/**
 * @module @themost/data/data-filter-resolver
 * @ignore
 */

/**
 * @ignore
 * @class
 * @abstract
 * @constructor
 * @augments DataModel
 */
function DataFilterResolver() {
    //
}

DataFilterResolver.prototype.resolveMember = function(member, callback) {
    if (/\//.test(member)) {
        var arr = member.split('/');
        callback(null, arr.slice(arr.length-2).join('.'));
    }
    else {
        callback(null, this.viewAdapter.concat('.', member))
    }
};

DataFilterResolver.prototype.resolveMethod = function(name, args, callback) {
    callback = callback || function() { };
    if (typeof DataFilterResolver.prototype[name] === 'function') {
        var a = args || [];
        a.push(callback);
        try {
            return DataFilterResolver.prototype[name].apply(this, a);
        }
        catch(e) {
            return callback(e);
        }

    }
    callback();
};
/**
 * @param {Function} callback
 */
DataFilterResolver.prototype.me = function(callback) {
    var fx = new functions.FunctionContext(this.context, this);
    fx.user().then(function(value) {
        callback(null, value)
    }).catch(function(err) {
        callback(err);
    });
};
/**
 * @param {Function} callback
 */
DataFilterResolver.prototype.now = function(callback) {
    callback(null, new Date());
};
/**
 * @param {Function} callback
 */
DataFilterResolver.prototype.today = function(callback) {
    var res = new Date();
    res.setHours(0,0,0,0);
    callback(null, res);
};
/**
 * @param {Function} callback
 */
DataFilterResolver.prototype.lang = function(callback) {
    let culture = this.context.culture();
    if (culture) {
        return callback(null, culture.substr(0,2));
    }
    else {
        return callback(null, "en");
    }

};
/**
 * @param {Function} callback
 */
DataFilterResolver.prototype.user = DataFilterResolver.prototype.me;

if (typeof exports !== 'undefined')
{
    module.exports = {
        DataFilterResolver:DataFilterResolver
    };
}