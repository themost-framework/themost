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

var _utils = require('@themost/common/utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @augments HttpHandler
 */
var BasicAuthHandler = function () {
    function BasicAuthHandler() {
        _classCallCheck(this, BasicAuthHandler);
    }

    _createClass(BasicAuthHandler, [{
        key: 'authenticateRequest',
        value: function authenticateRequest(context, callback) {
            callback = callback || function () {};
            try {
                /**
                 * @type {{userName: string, userPassword: string}|*}
                 */
                var authorizationArgs = BasicAuthHandler.parseBasicAuthorization(context.request.headers['authorization']);
                if (typeof authorizationArgs !== 'undefined') {
                    //ensure settings
                    context.application.config.settings.auth = context.application.config.settings.auth || {};
                    var providerPath = context.application.config.settings.auth.provider || './services/auth';
                    //get auth provider
                    var svc = void 0;
                    if (/^\//.test(providerPath)) {
                        svc = require(context.application.mapPath(providerPath));
                    } else {
                        svc = require(providerPath);
                    }
                    if (typeof svc.createInstance === 'function') {
                        //create provider instance
                        var provider = svc.createInstance(context);
                        //validate credentials
                        if (!authorizationArgs.userName.match(BasicAuthHandler.USERNAME_REGEXP)) {
                            callback(new Error('Wrong username format. Please contact to system administrator.'));
                            return;
                        }
                        provider.login(authorizationArgs.userName, authorizationArgs.userPassword, callback);
                    } else callback(null);
                } else {
                    callback(null);
                }
            } catch (e) {
                callback(e);
            }
        }
    }], [{
        key: 'parseBasicAuthorization',

        /**
         * @param {string} s
         * @returns {{userName:string, userPassword:string}|undefined}
         * @ignore
         */
        value: function parseBasicAuthorization(s) {
            try {
                if (typeof s !== 'string') return;
                //get authorization type (basic)
                var re = /\s?(Basic)\s+(.*)\s?/ig;
                var match = re.exec(s.replace(/^\s+/g, ''));
                if (match) {
                    //get authorization token
                    var token = match[2];
                    //decode token
                    var buffer = new Buffer(token, 'base64');
                    //get args e.g. username:password
                    var matched = /(.*):(.*)/ig.exec(buffer.toString());
                    if (matched) {
                        return { userName: matched[1], userPassword: matched[2] };
                    }
                }
            } catch (err) {
                _utils.TraceUtils.log(err);
            }
        }
    }]);

    return BasicAuthHandler;
}();

exports.default = BasicAuthHandler;


BasicAuthHandler.USERNAME_REGEXP = /^[a-zA-Z0-9\.\@_-]{1,255}$/;
//# sourceMappingURL=basic_auth.js.map
