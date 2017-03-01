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

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SequentialEventEmitter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _async = require('async');

var async = _interopRequireDefault(_async).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var listenersProperty = Symbol('listeners');

/**
 * @classdesc SequentialEventEmitter class is an extension of node.js EventEmitter class where listeners are executing in series.
 * @class
 */

var SequentialEventEmitter = exports.SequentialEventEmitter = function () {
    /**
     * @constructor
     */
    function SequentialEventEmitter() {
        _classCallCheck(this, SequentialEventEmitter);

        this[listenersProperty] = new Map();
    }

    _createClass(SequentialEventEmitter, [{
        key: 'removeAllListeners',
        value: function removeAllListeners() {
            this[listenersProperty].clear();
        }

        /**
         * Adds the listener function to the end of the listeners array for the specified event
         * @param {string} event
         * @param {Function} callback
         * @returns {SequentialEventEmitter}
         */

    }, {
        key: 'addListener',
        value: function addListener(event, callback) {
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

    }, {
        key: 'on',
        value: function on(event, callback) {
            return this.addListener(event, callback);
        }

        /**
         * Removes the specified listener from the listeners array
         * @param {string} type
         * @param {Function} callback
         * @returns {SequentialEventEmitter}
         */

    }, {
        key: 'removeListener',
        value: function removeListener(type, callback) {
            var listeners = this[listenersProperty].get(type),
                index = void 0;
            if (listeners && listeners.length) {
                index = _.reduce(listeners, function (i, listener, index) {
                    return _.isFunction(listener) && listener === callback ? i = index : i;
                }, -1);

                if (index > -1) {
                    listeners.splice(index, 1);
                    this[listenersProperty].set(type, listeners);
                    return this;
                }
            }
            return this;
        }

        /**
         * Returns an array of listeners which are listening to the specified event
         * @param {string} type
         */

    }, {
        key: 'listeners',
        value: function listeners(type) {
            var listeners = this[listenersProperty].get(type);
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

    }, {
        key: 'listenerCount',
        value: function listenerCount(event) {
            var listeners = this[listenersProperty].get(event);
            if (_.isArray(listeners)) {
                return listeners.length;
            }
            return 0;
        }

        /**
         * Raises the specified event and executes event listeners in series.
         * @param {String} event - The event that is going to be raised.
         * @param {*} args - An object that contains the event arguments.
         * @param {Function} callback - A callback function to be invoked after the execution.
         */

    }, {
        key: 'emit',
        value: function emit(event, args, callback) {
            var self = this;
            ////example: call super class function
            //SequentialEventEmitter.super_.emit.call(this);
            //ensure callback
            callback = callback || function () {};
            //get listeners
            var listeners = self[listenersProperty].get(event);
            if (typeof listeners === 'undefined') {
                return callback.call(self);
            }
            //validate listeners
            if (listeners.length == 0) {
                //exit emitter
                return callback.call(self);
            }
            //apply each series
            async.applyEachSeries(listeners, args, function (err) {
                callback.call(self, err);
            });
        }
    }, {
        key: 'once',
        value: function once(type, listener) {
            var self = this;
            if (!_.isFunction(listener)) throw TypeError('Listener must be a function');
            var fired = false;
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
    }]);

    return SequentialEventEmitter;
}();
//# sourceMappingURL=emitter.js.map
