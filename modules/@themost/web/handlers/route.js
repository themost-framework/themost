/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2015-05-26
 */
/**
 * @private
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
        callback()
    }
    else if (_.isNil(context.request.route)) {
        callback();
    }
    else {
        var route=context.request.route;
        //extend params
        context.params = context.params || {};
        if (typeof route.params === 'object' && route.params!=null) {
            var keys = Object.keys(route.params);
            keys.forEach(function(key) { context.params[key] = route.params[key] });
        }
        callback();
    }
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new RouteParamsHandler();  };
}
