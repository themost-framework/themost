/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2019, THEMOST LP
 *
 * Released under the BSD3-Clause license
 * Date: 2014-07-16
 */
/**
 * @param {*} any
 * @param {Function} ctor
 * @returns {boolean}
 */
function instanceOf(any, ctor) {
    // validate constructor
    if (typeof ctor !== 'function') {
        return false
    }
    // validate with instanceof
    if (any instanceof ctor) {
        return true;
    }
    return !!(any && any.constructor && any.constructor.name === ctor.name);
}

module.exports.instanceOf = instanceOf;

