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

var _utils = require('@themost/common/utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @param {IncomingMessage|ClientRequest} request
 * @returns {*}
 */
function parseCookies(request) {
    var list = {},
        rc = request.headers.cookie;
    rc && rc.split(';').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });
    return list;
}

var ANONYMOUS_IDENTITY = { name: 'anonymous', authenticationType: 'None' };

/**
 * @class
 * @augments HttpHandler
 */

var AuthHandler = function () {
    function AuthHandler() {
        _classCallCheck(this, AuthHandler);
    }

    _createClass(AuthHandler, [{
        key: 'authenticateRequest',


        /**
         * Authenticates an HTTP request and sets user or anonymous identity.
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function authenticateRequest(context, callback) {
            try {
                callback = callback || function () {};
                var cookies = {};
                var model = context.model('User');
                var settings = context.application.config.settings ? context.application.config.settings.auth || {} : {};
                settings.name = settings.name || '.MAUTH';
                if (context && context.request) cookies = parseCookies(context.request);
                if (cookies[settings.name]) {
                    var str = null;
                    try {
                        str = context.application.decrypt(cookies[settings.name]);
                    } catch (e) {
                        //log error (on bad cookie)
                        _utils.TraceUtils.log(e);
                    }
                    //and continue
                    var userName = null;
                    if (str) {
                        var authCookie = JSON.parse(str);
                        //validate authentication cookie
                        if (authCookie.user) userName = authCookie.user;
                    }
                    if (typeof model === 'undefined' || model === null) {
                        //no authentication provider is defined
                        context.user = { name: userName || 'anonymous', authenticationType: 'Basic' };
                        callback(null);
                        return;
                    }
                    //search for user
                    if (userName) {
                        //set user identity
                        context.user = model.convert({ name: userName, authenticationType: 'Basic' });
                        callback(null);
                    } else {
                        //an auth cookie was found but user data or user model does not exist
                        //set anonymous identity
                        context.user = model.convert(ANONYMOUS_IDENTITY);
                        callback(null);
                    }
                } else {
                    //set anonymous identity
                    if (model) context.user = model.convert(ANONYMOUS_IDENTITY);else context.user = ANONYMOUS_IDENTITY;
                    //no auth cookie was found on request
                    callback(null);
                }
            } catch (e) {
                callback(e);
            }
        }

        /**
         * @param {{context: HttpContext, target: HttpResult}} args
         * @param callback
         */

    }, {
        key: 'preExecuteResult',
        value: function preExecuteResult(args, callback) {
            try {
                var _ret = function () {
                    callback = callback || function () {};
                    var context = args.context,
                        model = context.model('User');
                    if (typeof model === 'undefined' || model === null) {
                        callback();
                        return {
                            v: void 0
                        };
                    }
                    var authenticationType = context.user.authenticationType;
                    model.where('name').equal(context.user.name).expand('groups').silent().first(function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        if (result) {
                            //replace context.user with data object
                            context.user = model.convert(result);
                            context.user.authenticationType = authenticationType;
                            return callback();
                        } else if (context.user.name !== 'anonymous') {
                            model.where('name').equal('anonymous').expand('groups').silent().first(function (err, result) {
                                if (err) {
                                    return callback(err);
                                }
                                if (result) {
                                    context.user = model.convert(result);
                                    context.user.authenticationType = authenticationType;
                                    return callback();
                                } else {
                                    return callback();
                                }
                            });
                        } else {
                            //do nothing
                            return callback();
                        }
                    });
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } catch (err) {
                callback(err);
            }
        }
    }]);

    return AuthHandler;
}();

exports.default = AuthHandler;
//# sourceMappingURL=auth.js.map
