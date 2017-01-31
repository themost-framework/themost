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

import events from 'events';

/**
 * @classdesc SequentialEventEmitter class is an extension of node.js EventEmitter class where listeners are executing in series.
 * @class
 * @augments EventEmitter
 */
export class SequentialEventEmitter extends events.EventEmitter {
    /**
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Raises the specified event and executes event listeners in series.
     * @param {String} event - The event that is going to be raised.
     * @param {*} args - An object that contains the event arguments.
     * @param {Function} callback - A callback function to be invoked after the execution.
     */
    emit(event, args, callback) {
        const self = this;
        ////example: call super class function
        //SequentialEventEmitter.super_.emit.call(this);
        //ensure callback
        callback = callback || function() {};
        //get listeners
        const listeners = self.listeners(event);
        //validate listeners
        if (listeners.length==0) {
            //exit emitter
            callback.call(self, null);
            return;
        }
        //apply each series
        async.applyEachSeries(listeners, args, function(err) {
            callback.call(self, err);
        });
    }

    once(type, listener) {
        const self = this;
        if (typeof listener !== 'function')
            throw TypeError('listener must be a function');
        let fired = false;
        function g() {
            self.removeListener(type, g);
            if (!fired) {
                fired = true;
                listener.apply(this, arguments);
            }
        }
        g.listener = listener;
        self.on(type, g);
        return this;
    }
}