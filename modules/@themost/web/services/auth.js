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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.createInstance = createInstance;

var _errors = require('@themost/common/errors');

var _utils = require('@themost/common/utils');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createInstance(context) {
    return {
        login: function login(userName, userPassword, callback) {
            callback = callback || function () {};
            try {
                context.model('user').where('name').equal(userName).select(['id', 'enabled']).silent().first(function (err, result) {
                    if (err) {
                        callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                    } else {
                        if (result) {
                            var _ret = function () {
                                if (!result.enabled) {
                                    callback(new _errors.HttpForbiddenError('The account is disabled. Please contact your system administrator.'));
                                    return {
                                        v: void 0
                                    };
                                }
                                //user was found
                                var model = context.model('UserCredential');
                                if (typeof model === 'undefined' || model === null) {
                                    _utils.TraceUtils.log('UserCredential model is missing.');
                                    callback(new Error('Login failed due to server error.'));
                                    return {
                                        v: void 0
                                    };
                                }
                                model.where('id').equal(result.id).silent().first(function (err, creds) {
                                    if (err) {
                                        _utils.TraceUtils.log(err);
                                        callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                                    } else {
                                        if (creds) {
                                            var authenticated = false;
                                            //user credentials were found
                                            //1. clear text
                                            if (/^\{clear\}/i.test(creds.userPassword)) {
                                                authenticated = creds.userPassword.replace(/^\{clear\}/i, '') == userPassword;
                                            }
                                            //2. md5 text
                                            else if (/^\{md5\}/i.test(creds.userPassword)) {
                                                    var md5password = _crypto2.default.createHash('md5').update(userPassword).digest('hex');
                                                    authenticated = creds.userPassword.replace(/^\{md5\}/i, '') == md5password;
                                                }
                                                //3. sha1 text
                                                else if (/^\{sha1\}/i.test(creds.userPassword)) {
                                                        var sha1password = _crypto2.default.createHash('sha1').update(userPassword).digest('hex');
                                                        authenticated = creds.userPassword.replace(/^\{sha1\}/i, '') == sha1password;
                                                    }
                                            if (authenticated) {
                                                //set cookie
                                                context.application.setAuthCookie(context, userName);
                                                context.user = model.convert({ name: userName, authenticationType: 'Basic' });
                                                callback();
                                            } else {
                                                callback(new _errors.HttpUnauthorizedError('Unknown username or bad password.'));
                                            }
                                        } else {
                                            _utils.TraceUtils.log('User credentials cannot be found (%s).', userName);
                                            callback(new _errors.HttpUnauthorizedError('Unknown username or bad password.'));
                                        }
                                    }
                                });
                            }();

                            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                        } else {
                            //user was not found
                            callback(new _errors.HttpUnauthorizedError('Unknown username. Please try again.'));
                        }
                    }
                });
            } catch (e) {
                _utils.TraceUtils.log(e);
                callback(new Error('Login failed due to internal server error.'));
            }
        },
        logout: function logout(callback) {
            callback = callback || function () {};
            var anonymousIdentity = { name: 'anonymous', authenticationType: 'None' };
            try {
                //get user model, if any
                var model = context.model('User');
                //set auth cookie to anonymous
                context.application.setAuthCookie(context, 'anonymous');
                //check user model and set HttpContext.user property
                if (model) context.user = model.convert(anonymousIdentity);else context.user = anonymousIdentity;
                callback(null);
            } catch (e) {
                _utils.TraceUtils.log(e);
                if (context) context.user = anonymousIdentity;
            }
        }
    };
}
//# sourceMappingURL=auth.js.map
