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