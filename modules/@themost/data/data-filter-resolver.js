/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2014-10-13.
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 Anthi Oikonomou anthioikonomou@gmail.com
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of MOST Web Framework nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @private
 */
var Q = require('q'),
    functions = require('./functions');

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
DataFilterResolver.prototype.user = DataFilterResolver.prototype.me;

if (typeof exports !== 'undefined')
{
    module.exports = {
        DataFilterResolver:DataFilterResolver
    };
}