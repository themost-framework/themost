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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var fs = _interopRequireDefault(_fs).default;

var _errors = require('@themost/common/errors');

var HttpNotFoundError = _errors.HttpNotFoundError;

var _context = require('./../context');

var HttpContext = _context.HttpContext;

var _interfaces = require('../interfaces');

var HttpViewEngine = _interfaces.HttpViewEngine;

var _mvc = require('../mvc');

var HttpViewContext = _mvc.HttpViewContext;

var _module = require('../angular/module');

var DirectiveHandler = _module.DirectiveHandler;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @class
 * @classdesc NgEngine instance implements Angular JS View Engine for Server
 * @property {HttpContext} context
 * @augments {HttpViewEngine}
 */
var NgEngine = function (_HttpViewEngine) {
    _inherits(NgEngine, _HttpViewEngine);

    /**
     * @constructor
     * @param {HttpContext} context
     */
    function NgEngine(context) {
        _classCallCheck(this, NgEngine);

        return _possibleConstructorReturn(this, (NgEngine.__proto__ || Object.getPrototypeOf(NgEngine)).call(this, context));
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
                    var _ret = function () {
                        if (err) {
                            if (err.code === 'ENOENT') {
                                //throw not found exception
                                return {
                                    v: callback(new HttpNotFoundError('View layout cannot be found.'))
                                };
                            }
                            return {
                                v: callback(err)
                            };
                        }
                        var viewContext = new HttpViewContext(self.getContext());
                        viewContext.body = str;
                        var directiveHandler = new DirectiveHandler();
                        var args = { context: self.getContext(), target: viewContext };
                        directiveHandler.postExecuteResult(args, function (err) {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, viewContext.body);
                        });
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                } catch (err) {
                    callback(err);
                }
            });
        }
    }]);

    return NgEngine;
}(HttpViewEngine);

exports.default = NgEngine;
module.exports = exports['default'];
//# sourceMappingURL=ng.js.map
