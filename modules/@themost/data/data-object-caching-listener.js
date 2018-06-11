/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var cache = require('./data-cache');
var _ = require('lodash');
var TraceUtils = require('@themost/common/utils').TraceUtils;

/**
 * @class
 * @constructor
 * @ignore
 * @deprecated
 */
function DataObjectCachingListener() {
    //
}
DataObjectCachingListener.prototype.afterSave = function(event, callback) {
    try {
        if (_.isNil(event.target)) {
            callback();
            return;
        }
        //get object id
        var id = event.model.idOf(event.target);
        //validate object id
        if (_.isNil(id)) {
            callback();
            return;
        }
        //get item key
        var key = '/' + event.model.name + '/' + id.toString();
        if (typeof cache.getCurrent() === 'object') {
            //remove item by key
            cache.getCurrent().remove(key);
        }
        callback();
    }
    catch (err) {
        if (process.NODE_ENV==='development')
            TraceUtils.log(err);
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