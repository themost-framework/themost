/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import {_} from 'lodash';
import async from 'async';

const listenersProperty = Symbol('listeners');

/**
 * @classdesc SequentialEventEmitter class is an extension of node.js EventEmitter class where listeners are executing in series.
 * @class
 */
export class SequentialEventEmitter {
    /**
     * @constructor
     */
    constructor() {
        this[listenersProperty] = new Map();
    }

    removeAllListeners() {
        this[listenersProperty].clear();
    }

    /**
     * Adds the listener function to the end of the listeners array for the specified event
     * @param {string} event
     * @param {Function} callback
     * @returns {SequentialEventEmitter}
     */
    addListener(event, callback) {
        this[listenersProperty].has(event) || this[listenersProperty].set(event, []);
        this[listenersProperty].get(event).push(callback);
        return this;
    }

    /**
     * Adds the listener function to the end of the listeners array for the specified event
     * @param {string} event
     * @param {Function} callback
     * @returns {SequentialEventEmitter}
     */
    on(event, callback) {
        return this.addListener(event, callback);
    }

    /**
     * Removes the specified listener from the listeners array
     * @param {string} type
     * @param {Function} callback
     * @returns {SequentialEventEmitter}
     */
    removeListener(type, callback) {
        let listeners = this[listenersProperty].get(type),
            index;
        if (listeners && listeners.length) {
            index = _.reduce(listeners, (i, listener, index) => {
                return (_.isFunction(listener) && listener === callback) ?
                    i = index :
                    i;
            }, -1);

            if (index > -1) {
                listeners.splice(index, 1);
                //this[listenersProperty].set(type, listeners);
                return this;
            }
        }
        return this;
    }

    /**
     * Returns an array of listeners which are listening to the specified event
     * @param {string} type
     */
    listeners(type) {
        let listeners = this[listenersProperty].get(type);
        if (typeof listeners === 'undefined') {
            return [];
        }
        if (_.isArray(listeners)) {
            return listeners;
        }
        return [];
    }

    /**
     * Returns the number of listeners which are listening to the specified event
     * @param {string} event
     */
    listenerCount(event) {
        let listeners = this[listenersProperty].get(event);
        if (_.isArray(listeners)) { return listeners.length; }
        return 0;
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
        const listeners = self[listenersProperty].get(event);
        if (typeof listeners === 'undefined') {
            return callback.bind(self)();
        }
        //validate listeners
        if (listeners.length===0) {
            //exit emitter
            return callback.bind(self)();
        }
        //apply each series
        try {
            //apply each series
            async.applyEachSeries(listeners, args, function(err) {
                callback.call(self, err);
            });
        }
        catch(err) {
            return callback.bind(self)(err);
        }

    }

    once(type, listener) {
        const self = this;
        if (!_.isFunction(listener))
            throw TypeError('Listener must be a function');
        let fired = false;
        function g() {
            self.removeListener(type, g);
            if (!fired) {
                fired = true;
                listener.apply(self, arguments);
            }
        }
        g.listener = listener;
        self.on(type, g);
        return this;
    }
}