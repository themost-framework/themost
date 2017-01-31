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
import {_} from 'lodash';

/**
 * @classdesc Extends context parameters by adding the default context params that are defined on the current route, if any
 * @class
 * @augments HttpHandler
 */
export default class RouteParamsHandler {
    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    mapRequest(context, callback) {
        if (_.isNil(context.request)) {
            callback()
        }
        else if (_.isNil(context.request.route)) {
            callback();
        }
        else {
            const route=context.request.route;
            //extend params
            context.params = context.params || {};
            if (typeof route.params === 'object' && route.params!=null) {
                const keys = Object.keys(route.params);
                keys.forEach(function(key) { context.params[key] = route.params[key] });
            }
            callback();
        }
    }
}
