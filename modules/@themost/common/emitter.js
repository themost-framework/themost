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

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @classdesc SequentialEventEmitter class is an extension of node.js EventEmitter class where listeners are executing in series.
 * @class
 * @augments EventEmitter
 */
var SequentialEventEmitter = exports.SequentialEventEmitter = function (_events$EventEmitter) {
    _inherits(SequentialEventEmitter, _events$EventEmitter);

    /**
     * @constructor
     */
    function SequentialEventEmitter() {
        _classCallCheck(this, SequentialEventEmitter);

        return _possibleConstructorReturn(this, (SequentialEventEmitter.__proto__ || Object.getPrototypeOf(SequentialEventEmitter)).call(this));
    }

    /**
     * Raises the specified event and executes event listeners in series.
     * @param {String} event - The event that is going to be raised.
     * @param {*} args - An object that contains the event arguments.
     * @param {Function} callback - A callback function to be invoked after the execution.
     */


    _createClass(SequentialEventEmitter, [{
        key: 'emit',
        value: function emit(event, args, callback) {
            var self = this;
            ////example: call super class function
            //SequentialEventEmitter.super_.emit.call(this);
            //ensure callback
            callback = callback || function () {};
            //get listeners
            var listeners = self.listeners(event);
            //validate listeners
            if (listeners.length == 0) {
                //exit emitter
                callback.call(self, null);
                return;
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
            if (typeof listener !== 'function') throw TypeError('listener must be a function');
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
}(_events2.default.EventEmitter);
//# sourceMappingURL=emitter.js.map
