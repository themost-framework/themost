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

var _errors = require('@themost/common/errors');

var _utils = require('@themost/common/utils');

var _lodash = require('lodash');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @property {string} description - Gets or sets a string that represents the description of this object
 * @property {*} path - Gets or sets a string that represents the target path associated with access settings.
 * @property {string} allow - Gets or sets a comma delimited string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
 * @property {string} deny - Gets or sets a string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
 */
var LocationSetting = function LocationSetting() {
    //

    _classCallCheck(this, LocationSetting);
};

/**
 * @class
 * @augments HttpHandler
 */


var RestrictHandler = function () {
    function RestrictHandler() {
        _classCallCheck(this, RestrictHandler);
    }

    _createClass(RestrictHandler, [{
        key: 'authorizeRequest',

        /**
         * Authenticates an HTTP request and sets user or anonymous identity.
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function authorizeRequest(context, callback) {
            try {
                if (context.is('OPTIONS')) {
                    return callback();
                }
                if (context.user.name == 'anonymous') {
                    RestrictHandler.prototype.isRestricted(context, function (err, result) {
                        if (err) {
                            _utils.TraceUtils.log(err);
                            callback(new _errors.HttpUnauthorizedError('Access denied'));
                        } else if (result) {
                            (function () {
                                var er = new _errors.HttpUnauthorizedError();
                                context.application.errors.unauthorized(context, er, function (err) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    context.response.end();
                                    return callback(er);
                                });
                            })();
                        } else {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            } catch (e) {
                callback(e);
            }
        }
    }, {
        key: 'isNotRestricted',
        value: function isNotRestricted(context, callback) {
            try {
                if (_lodash._.isNil(context)) {
                    return callback(new _errors.HttpBadRequestError());
                }
                if (_lodash._.isNil(context.request)) {
                    return callback(new _errors.HttpBadRequestError());
                }
                //ensure settings (and auth settings)
                context.application.config.settings = context.application.config.settings || {};
                /**
                 * @type {{loginPage:string=,locations:Array}|*}
                 */
                context.application.config.settings.auth = context.application.config.settings.auth || {};
                //get login page, request url and locations
                var loginPage = context.application.config.settings.auth.loginPage || '/login.html',
                    requestUrl = _url2.default.parse(context.request.url),
                    locations = context.application.config.settings.auth.locations || [];
                if (requestUrl.pathname === loginPage) {
                    return callback(null, true);
                }
                for (var i = 0; i < locations.length; i++) {
                    /**
                     * @type {*|LocationSetting}
                     */
                    var location = locations[i];
                    if (/\*$/.test(location.path)) {
                        //wildcard search /something/*
                        if (requestUrl.pathname.indexOf(location.path.replace(/\*$/, '')) == 0 && location.allow == '*') {
                            return callback(null, true);
                        }
                    } else {
                        if (requestUrl.pathname === location.path && location.allow == '*') {
                            return callback(null, true);
                        }
                    }
                }
                return callback(null, false);
            } catch (e) {
                _utils.TraceUtils.log(e);
                return callback(null, false);
            }
        }
    }, {
        key: 'isRestricted',
        value: function isRestricted(context, callback) {
            RestrictHandler.prototype.isNotRestricted(context, function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null, !result);
            });
        }
    }]);

    return RestrictHandler;
}();

exports.default = RestrictHandler;
//# sourceMappingURL=restrict_access.js.map
