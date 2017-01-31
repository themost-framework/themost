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
exports.Most = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require('./mvc');

Object.keys(_mvc).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _mvc[key];
        }
    });
});

var _files = require('./files');

Object.keys(_files).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _files[key];
        }
    });
});

var _context = require('./context');

Object.keys(_context).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _context[key];
        }
    });
});

var _app = require('./app');

Object.keys(_app).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _app[key];
        }
    });
});

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('@themost/common/utils');

var _errors = require('@themost/common/errors');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Most = exports.Most = function () {
    function Most() {
        _classCallCheck(this, Most);
    }

    _createClass(Most, null, [{
        key: 'runtime',

        /**
         * Most Web Framework Express Parser
         * @param {Object=} options
         */
        value: function runtime(options) {
            return function runtimeParser(req, res, next) {
                //create context
                var ctx = _app.HttpApplication.current.createContext(req, res);
                ctx.request.on('close', function () {
                    //client was disconnected abnormally
                    //finalize data context
                    if (typeof ctx !== 'undefined' && ctx != null) {
                        ctx.finalize(function () {
                            if (ctx.response) {
                                //if response is alive
                                if (ctx.response.finished == false)
                                    //end response
                                    ctx.response.end();
                            }
                        });
                    }
                });
                //process request
                _app.HttpApplication.current.processRequest(ctx, function (err) {
                    if (err) {
                        ctx.finalize(function () {
                            next(err);
                        });
                    } else {
                        ctx.finalize(function () {
                            ctx.response.end();
                        });
                    }
                });
            };
        }

        /**
         * Expression handler for Access Denied HTTP errors (401).
         */

    }, {
        key: 'unauthorized',
        value: function unauthorized() {
            return function (err, req, res, next) {
                try {
                    if (err.status == 401) {
                        if (/text\/html/g.test(req.get('accept'))) {
                            if (_app.HttpApplication.current.config.settings) {
                                if (_app.HttpApplication.current.config.settings.auth) {
                                    var page = _app.HttpApplication.current.config.settings.auth.loginPage || '/login.html';
                                    res.set('Location', page.concat('?returnUrl=', encodeURIComponent(req.url)));
                                    res.status(302).end();
                                    return;
                                }
                            }
                        }
                    }
                    next(err);
                } catch (e) {
                    _utils.TraceUtils.log(e);
                    next(err);
                }
            };
        }
    }, {
        key: 'error',
        value: function error() {
            return function (err, request, response, next) {
                try {
                    var _ret = function () {
                        var ejs = require('ejs');
                        if (_lodash._.isNil(response) || _lodash._.isNil(request)) {
                            next(err);
                        }
                        if (!/text\/html/g.test(request.get('accept'))) {
                            next(err);
                        } else {
                            if (response._headerSent) {
                                next(err);
                                return {
                                    v: void 0
                                };
                            }
                            _fs2.default.readFile(_path2.default.join(__dirname, './resources/http-error.html.ejs'), 'utf8', function (readErr, data) {
                                if (readErr) {
                                    //log process error
                                    _utils.TraceUtils.log(readErr);
                                    next(err);
                                    return;
                                }
                                //compile data
                                var str = void 0;
                                try {
                                    if (err instanceof _errors.HttpError) {
                                        str = ejs.render(data, { error: err });
                                    } else {
                                        var httpErr = new _errors.HttpError(500, null, err.message);
                                        httpErr.stack = err.stack;
                                        str = ejs.render(data, { error: httpErr });
                                    }
                                } catch (e) {
                                    _utils.TraceUtils.log(e);
                                    next(err);
                                    return;
                                }
                                //write status header
                                response.writeHead(err.status || 500, { "Content-Type": "text/html" });
                                response.write(str);
                                response.end();
                            });
                        }
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                } catch (e) {
                    _utils.TraceUtils.log(e);
                    next(err);
                }
            };
        }
    }]);

    return Most;
}();
//# sourceMappingURL=index.js.map
