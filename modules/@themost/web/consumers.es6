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
import 'source-map-support/register';
import {_} from 'lodash';
import {Args} from '@themost/common/utils';

export class HttpConsumer {
    /**
     * @param {Function} callable
     * @param {*=} params
     */
    constructor(callable, params) {

        /**
         * IMPORTANT NOTE FOR HTTP CONSUMERS
         * An HttpConsumer callable is bind with current instance of HttpContext class
         * so ES6 arrow functions cannot be used while writing an HttpConsumer callable
         * working example
         * (this an instance of HttpContext)
         var consumer = new HttpConsumer(function() {
            console.log(this.request.url)
         });
         */

        Args.check(_.isFunction(callable),'Consumer must be a function');
        /**
         * @type {Function}
         */
        this.callable = callable;
        /**
         * Gets or sets the parameters associated with this consumer
         */
        this.params = params;
    }

    /**
     * @param {*} context
     * @param {...*} args
     */
    run(context, args) {
        return this.callable.apply(context, Array.prototype.slice.call(arguments));
    }
}

export class HttpRouteConsumer extends HttpConsumer {
    /**
     * @param {string} route
     * @param {Function} callable
     * @param {*=} params
     */
    constructor(route, callable, params) {
        Args.notEmpty(route,'Consumer URI');
        super(callable, params);
        this.route = route;
    }
}

export class HttpErrorConsumer {
    /**
     * @param {Function} callable
     * @param {*=} params
     */
    constructor(callable, params) {
        Args.check(_.isFunction(callable),'Consumer must be a function');
        /**
         * @type {Function}
         */
        this.callable = callable;
        /**
         * Gets or sets the parameters associated with this consumer
         */
        this.params = params;
    }

    /**
     * @param {*} context
     * @param {Error|*} err
     */
    run(context, err) {
        return this.callable.bind(context)(context, err);
    }
}