'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DataFilterResolver = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


require('source-map-support/register');

var _functions = require('./functions');

var FunctionContext = _functions.FunctionContext;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @ignore
 * @class
 * @abstract
 * @augments DataModel
 */
var DataFilterResolver = exports.DataFilterResolver = function () {
    function DataFilterResolver() {
        //

        _classCallCheck(this, DataFilterResolver);
    }

    _createClass(DataFilterResolver, [{
        key: 'resolveMember',
        value: function resolveMember(member, callback) {
            if (/\//.test(member)) {
                var arr = member.split('/');
                callback(null, arr.slice(arr.length - 2).join('.'));
            } else {
                callback(null, this.viewAdapter.concat('.', member));
            }
        }
    }, {
        key: 'resolveMethod',
        value: function resolveMethod(name, args, callback) {
            callback = callback || function () {};
            if (typeof DataFilterResolver.prototype[name] === 'function') {
                var a = args || [];
                a.push(callback);
                try {
                    return DataFilterResolver.prototype[name].apply(this, a);
                } catch (e) {
                    return callback(e);
                }
            }
            callback();
        }

        /**
         * @param {Function} callback
         */

    }, {
        key: 'me',
        value: function me(callback) {
            var fx = new FunctionContext(this.context, this);
            fx.user().then(function (value) {
                callback(null, value);
            }).catch(function (err) {
                callback(err);
            });
        }

        /**
         * @param {Function} callback
         */

    }, {
        key: 'now',
        value: function now(callback) {
            callback(null, new Date());
        }

        /**
         * @param {Function} callback
         */

    }, {
        key: 'today',
        value: function today(callback) {
            var res = new Date();
            res.setHours(0, 0, 0, 0);
            callback(null, res);
        }

        /**
         * @param {Function} callback
         */

    }, {
        key: 'user',
        value: function user(callback) {
            return this.me(callback);
        }
    }]);

    return DataFilterResolver;
}();
//# sourceMappingURL=filter-resolver.js.map
