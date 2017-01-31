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
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require('./../mvc');

var _errors = require('@themost/common/errors');

var _utils = require('@themost/common/utils');

var _lodash = require('lodash');

var _asyncEjs = require('async-ejs');

var _asyncEjs2 = _interopRequireDefault(_asyncEjs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var step_ = function step_(funcs, onerror) {
    var counter = 0;
    var completed = 0;
    var pointer = 0;
    var ended = false;
    var state = {};
    var values = null;
    var complete = false;

    var check = function check() {
        return complete && completed >= counter;
    };

    var next = function () {
        function next(err, value) {
            _classCallCheck(this, next);

            if (err && !ended) {
                ended = true;
                (onerror || noop).apply(state, [err]);
                return;
            }
            if (ended || counter && !check()) {
                return;
            }

            var fn = funcs[pointer++];
            var args = fn.length === 1 ? [next] : [value, next];

            counter = completed = 0;
            values = [];
            complete = false;
            fn.apply(state, pointer < funcs.length ? args : [value, next]);
            complete = true;

            if (counter && check()) {
                next(null, values);
            }
        }

        _createClass(next, null, [{
            key: 'parallel',
            value: function parallel(key) {
                var index = counter++;

                if (complete) {
                    throw new Error('next.parallel must not be called async');
                }
                return function (err, value) {
                    completed++;
                    values[key ? key : index] = value;
                    next(err, values);
                };
            }
        }, {
            key: 'skip',
            value: function skip(step) {
                pointer += step;
                return function (err, value) {
                    next(err, value);
                };
            }
        }]);

        return next;
    }();

    next();
};

/**
 * @param {string} src
 * @param {*} options
 * @param {Function} callback
 * @private
 */
var render_ = function render_(src, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    var fns = {
        file: function file(filename, callback) {
            _asyncEjs2.default.renderFile(filename, options, callback);
        }
    };
    //get prototype of options.local
    var proto = Object.getPrototypeOf(options);
    if (proto) {
        var keys = Object.keys(proto);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (typeof proto[key] === 'function') fns[key] = proto[key];
        }
    }
    step_([function (next) {
        var args = [];
        Object.keys(fns).forEach(function (name) {
            options[name] = function () {
                args.push([name].concat(Array.prototype.slice.call(arguments)));
            };
        });
        var result = ejs.render(src, options);
        if (!args.length) {
            callback(null, result);
            return;
        }
        args.forEach(function (arg) {
            var name = arg.shift();
            arg.push(next.parallel());
            fns[name].apply(options, arg);
        });
    }, function (results, next) {
        var i = 0;
        Object.keys(fns).forEach(function (name) {
            options[name] = function () {
                return results[i++];
            };
        });
        src = ejs.render(src, options);
        callback(null, src);
    }], callback);
};
//override render method of async-ejs
_asyncEjs2.default.render = render_;

/**
 * @class
 */

var AsyncEjsEngine = function () {
    /**
     * @constructor
     * @param {HttpContext} context
     */
    function AsyncEjsEngine(context) {
        _classCallCheck(this, AsyncEjsEngine);

        /**
         * @type {HttpContext}
         */
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
     * Adds a EJS filter to filters collection.
     * @param {string} name
     * @param {Function} fn
     */


    _createClass(AsyncEjsEngine, [{
        key: 'filter',
        value: function filter(name, fn) {
            ejs.filters[name] = fn;
        }
    }, {
        key: 'render',
        value: function render(filename, data, callback) {
            var self = this;
            try {
                (function () {
                    var fs = require('fs'),
                        common = require('@themost/common');
                    fs.readFile(filename, 'utf-8', function (err, str) {
                        try {
                            if (err) {
                                if (err.code === 'ENOENT') {
                                    //throw not found exception
                                    return callback(new _errors.HttpNotFoundError('View layout cannot be found.'));
                                }
                                return callback(err);
                            } else {
                                (function () {
                                    //get view header (if any)
                                    var matcher = /^(\s*)<%#(.*?)%>/;
                                    var properties = { layout: null };
                                    if (matcher.test(str)) {
                                        var matches = matcher.exec(str);
                                        properties = JSON.parse(matches[2]);
                                        //remove match
                                        str = str.replace(matcher, '');
                                    }
                                    //create view context
                                    var viewContext = new _mvc.HttpViewContext(self.context);
                                    //extend view context with page properties
                                    util._extend(viewContext, properties || {});
                                    //set view context data
                                    viewContext.data = data;
                                    var partial = false;
                                    if (self.context && self.context.request.route) partial = _utils.LangUtils.parseBoolean(self.context.request.route['partial']);
                                    if (properties.layout && !partial) {
                                        (function () {
                                            var layout = void 0;
                                            if (/^\//.test(properties.layout)) {
                                                //relative to application folder e.g. /views/shared/master.html.ejs
                                                layout = self.context.application.mapPath(properties.layout);
                                            } else {
                                                //relative to view file path e.g. ./../master.html.html.ejs
                                                layout = _path2.default.resolve(filename, properties.layout);
                                            }
                                            //set current view buffer (after rendering)
                                            _asyncEjs2.default.render(str, viewContext, function (err, body) {
                                                if (err) {
                                                    return callback(err);
                                                }
                                                viewContext.body = body;
                                                fs.readFile(layout, 'utf-8', function (err, layoutData) {
                                                    try {
                                                        if (err) {
                                                            if (err.code === 'ENOENT') {
                                                                return callback(new _errors.HttpNotFoundError('Master view layout cannot be found'));
                                                            }
                                                            return callback(err);
                                                        }
                                                        _asyncEjs2.default.render(layoutData, viewContext, function (err, result) {
                                                            return callback(null, result);
                                                        });
                                                    } catch (e) {
                                                        callback(e);
                                                    }
                                                });
                                            });
                                        })();
                                    } else {
                                        _asyncEjs2.default.render(str, viewContext, function (err, result) {
                                            return callback(null, result);
                                        });
                                    }
                                })();
                            }
                        } catch (e) {
                            callback(e);
                        }
                    });
                })();
            } catch (e) {
                callback.call(self, e);
            }
        }
    }]);

    return AsyncEjsEngine;
}();

exports.default = AsyncEjsEngine;
//# sourceMappingURL=aejs.js.map
