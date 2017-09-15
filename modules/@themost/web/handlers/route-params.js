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
'use strict';
var _ = require('lodash');
/**
 * Extends context parameters by adding the default context params that are defined on the current route, if any
 * @class
 * @constructor
 * @extends HttpHandler
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
    module.exports.RouteParamsHandler = RouteParamsHandler;
    /**
     * @returns {RouteParamsHandler}
     */
    module.exports.createInstance = function() {
        return  new RouteParamsHandler();
    };
}
