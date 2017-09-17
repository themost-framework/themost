/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jade = require('jade');

var jade = _interopRequireDefault(_jade).default;

var _fs = require('fs');

var fs = _interopRequireDefault(_fs).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * Represents a view engine that may be used in MOST Web Framework applications.
 * @param {HttpContext|*} context
 * @constructor
 * @property {HttpContext|*} context
 */
var JadeEngine = function () {
    function JadeEngine(context) {
        _classCallCheck(this, JadeEngine);

        var ctx = context;
        Object.defineProperty(this, 'context', {
            get: function get() {
                return ctx;
            },
            set: function set(value) {
                ctx = value;
            },
            configurable: false,
            enumerable: false
        });
    }

    /**
     * Renders the view by attaching the data specified if any
     * @param {string|Function} file A string that represents the physical path of the view or a function which returns the view path
     * @param {*} data Any data to be attached in the result
     * @param {Function} callback A callback function to be called when rendering operation will be completed.
     */


    _createClass(JadeEngine, [{
        key: 'render',
        value: function render(file, data, callback) {
            callback = callback || function () {};
            var self = this;
            var physicalPath = void 0;
            try {
                //if first argument is a function
                if (typeof file === 'function') {
                    //invoke this function and return the physical path of the target view
                    physicalPath = file.call();
                } else if (typeof file === 'string') {
                    //otherwise get physical
                    physicalPath = file;
                } else {
                    //or raise error for invalid type
                    return callback(new TypeError('The target view path has an invalid type or is empty.'));
                }
                fs.readFile(physicalPath, 'utf8', function (err, source) {
                    if (err) {
                        return callback(err);
                    }
                    //render data
                    try {
                        var fn = jade.compile(source);
                        data = data || {};
                        Object.defineProperty(data, 'context', {
                            get: function get() {
                                return self.context;
                            },
                            enumerable: false, configurable: false
                        });
                        var result = fn(data);
                        return callback(null, result);
                    } catch (err) {
                        return callback(err);
                    }
                });
            } catch (err) {
                return callback(err);
            }
        }
    }]);

    return JadeEngine;
}();

//noinspection JSUnusedGlobalSymbols


exports.default = JadeEngine;
module.exports = exports['default'];
//# sourceMappingURL=jade.js.map
