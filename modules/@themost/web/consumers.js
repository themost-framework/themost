/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _ = require('lodash');

/**
 * @class
 * @param {Function} callable
 * @param {*=} params
 * @constructor
 */
function HttpConsumer(callable, params) {

    /**
     * IMPORTANT NOTE FOR HTTP CONSUMERS
     * (this an instance of HttpContext)
     var consumer = new HttpConsumer(function() {
            console.log(this.request.url)
         });
     */

    if (!_.isFunction(callable)) {
        throw new TypeError('Consumer must be a function');
    }
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
// eslint-disable-next-line no-unused-vars
HttpConsumer.prototype.run = function(context, args) {
    return this.callable.apply(context, Array.prototype.slice.call(arguments));
};

module.exports.HttpConsumer = HttpConsumer;