/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var _ = require('lodash');
/**
 * Extends context parameters by adding the default context params that are defined on the current route, if any
 * @class RouteParamsHandler
 * @constructor
 */
function RouteParamsHandler() {
    //
}

RouteParamsHandler.prototype.mapRequest = function(context, callback) {
    if (_.isNil(context.request)) {
        return callback();
    }
    else if (_.isNil(context.request.route)) {
        return callback();
    }
    else {
        var route=context.request.route;
        //extend params
        context.params = context.params || {};
        if (typeof route.params === 'object' && route.params!==null) {
            var keys = Object.keys(route.params);
            keys.forEach(function(key) { context.params[key] = route.params[key] });
        }
        return callback();
    }
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new RouteParamsHandler();  };
}
