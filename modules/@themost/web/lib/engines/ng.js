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
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var fs = _interopRequireDefault(_fs).default;

var _errors = require('@themost/common/errors');

var HttpNotFoundError = _errors.HttpNotFoundError;

var _context = require('./../context');

var HttpContext = _context.HttpContext;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @classdesc NgEngine instance implements Angular JS View Engine for Server
 * @property {HttpContext} context
 * @augments {HttpViewEngine}
 */
var NgEngine = function () {
    /**
     * @constructor
     * @param {HttpContext} context
     */
    function NgEngine(context) {
        _classCallCheck(this, NgEngine);

        var context_ = context;
        Object.defineProperty(this, 'context', {
            get: function get() {
                return context_;
            },
            set: function set(value) {
                context_ = value;
            },
            configurable: false,
            enumerable: false
        });
    }

    /**
     *
     * @param {string} filename
     * @param {*=} data
     * @param {Function} callback
     */


    _createClass(NgEngine, [{
        key: 'render',
        value: function render(filename, data, callback) {
            var self = this;
            fs.readFile(filename, 'utf-8', function (err, str) {
                try {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            //throw not found exception
                            return callback(new HttpNotFoundError('View layout cannot be found.'));
                        }
                        return callback(err);
                    } else {
                        var viewContext = new HttpViewContext(self.context);
                        viewContext.data = data;
                        viewContext.body = str;
                        return callback(null, viewContext);
                    }
                } catch (e) {
                    callback(e);
                }
            });
        }
    }]);

    return NgEngine;
}();

exports.default = NgEngine;
module.exports = exports['default'];
//# sourceMappingURL=ng.js.map
