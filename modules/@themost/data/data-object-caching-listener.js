/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2015-09-15.
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
 * @ignore
 */
var dataCache = require('./cache'),
    _ = require('lodash'),
    dataCommon = require('./common');
/**
 * @class
 * @constructor
 * @ignore
 * @deprecated
 */
function DataObjectCachingListener() {
    //
}
DataObjectCachingListener.prototype.afterSave = function(e, callback) {
    try {
        if (_.isNil(e.target)) {
            callback();
            return;
        }
        //get object id
        var id = e.model.idOf(e.target);
        //validate object id
        if (_.isNil(id)) {
            callback();
            return;
        }
        //get item key
        var key = '/' + e.model.name + '/' + id.toString();
        if (dataCache.current) {
            //remove item by key
            dataCache.current.remove(key);
        }
        callback();
    }
    catch (e) {
        if (process.NODE_ENV==='development')
            dataCommon.log(e);
        callback();
    }
};

DataObjectCachingListener.prototype.afterRemove = function(e, callback) {
    DataObjectCachingListener.prototype.afterSave(e, callback);
};

if (typeof exports !== 'undefined')
{
    module.exports = {
        DataObjectCachingListener:DataObjectCachingListener
    };
}