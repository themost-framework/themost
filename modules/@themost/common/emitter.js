/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var EventEmitter = require('events').EventEmitter;
var LangUtils = require('./utils').LangUtils;
var applyEachSeries = require('async').applyEachSeries;


/**
 * @classdesc SequentialEventEmitter class is an extension of node.js EventEmitter class where listeners are executing in series.
 * @class
 * @constructor
 * @augments EventEmitter
 */
function SequentialEventEmitter() {
    //
}
LangUtils.inherits(SequentialEventEmitter, EventEmitter);

/**
 * Executes event listeners in series.
 * @param {String} event - The event that is going to be executed.
 * @param {...*} args - An object that contains the event arguments.
 */
// eslint-disable-next-line no-unused-vars
SequentialEventEmitter.prototype.emit = function(event, args)
{
    //ensure callback
    callback = callback || function() {};
    //get listeners
    if (typeof this.listeners !== 'function') {
        throw new Error('undefined listeners');
    }
    var listeners = this.listeners(event);

    var argsAndCallback = [].concat(Array.prototype.slice.call(arguments, 1));
    if (argsAndCallback.length > 0) {
        //check the last argument (expected callback function)
        if (typeof argsAndCallback[argsAndCallback.length - 1] !== "function") {
            throw new TypeError("Expected event callback");
        }
    }
    //get callback function (the last argument of arguments list)
    var callback = argsAndCallback[argsAndCallback.length - 1];

    //validate listeners
    if (listeners.length===0) {
        //exit emitter
        return callback();
    }
    //apply each series
    return applyEachSeries.apply(this, [listeners].concat(argsAndCallback));
};

if (typeof exports !== 'undefined') {
    module.exports.SequentialEventEmitter = SequentialEventEmitter;
}