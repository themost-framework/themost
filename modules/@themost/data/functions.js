'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FunctionContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

// eslint-disable-next-line no-unused-vars


require('source-map-support/register');

var _types = require('./types');

var ParserUtils = _types.ParserUtils;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _moment = require('moment');

var moment = _interopRequireDefault(_moment).default;

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
*/
var FunctionContext = exports.FunctionContext = function () {
    /**
     * @param {DataContext=} context
     * @param {DataModel=} model
     * @param {*=} target
     * @constructor
     */
    function FunctionContext(context, model, target) {
        _classCallCheck(this, FunctionContext);

        /**
         * @type {DataContext}
        */
        this.context = context;
        /**
          * @type {DataModel}
          */
        this.model = model;
        if (_.isNil(context) && _.isObject(model)) {
            //get current context from DataModel.context property
            this.context = model.context;
        }
        /**
         * @type {*}
         */
        this.target = target;
    }

    _createClass(FunctionContext, [{
        key: 'evaluate',
        value: function evaluate(expr, callback) {
            callback = callback || function () {};
            if (typeof expr !== 'string') {
                callback(null);
                return;
            }
            var re = /(fn:)\s?(.*?)\s?\((.*?)\)/;
            var expr1 = expr;
            if (expr.indexOf('fn:') !== 0) {
                expr1 = 'fn:' + expr1;
            }
            var match = re.exec(expr1);
            if (match) {
                var expr2eval = void 0;
                //check parameters (match[3])
                if (match[3].length === 0) {
                    expr2eval = expr1.replace(/(fn:)\s?(.*?)\s?\((.*?)\)/, "(function() { return this.$2(); });");
                } else {
                    expr2eval = expr1.replace(/(fn:)\s?(.*?)\s?\((.*?)\)/, "(function() { return this.$2($3); });");
                }
                //evaluate expression
                try {
                    var f = eval(expr2eval);
                    var value1 = f.call(this);
                    if (typeof value1 !== 'undefined' && value1 !== null && typeof value1.then === 'function') {
                        value1.then(function (result) {
                            return callback(null, result);
                        }).catch(function (err) {
                            callback(err);
                        });
                    } else {
                        return callback(null, value1);
                    }
                } catch (err) {
                    callback(err);
                }
            } else {
                TraceUtils.log(sprintf.sprintf('Cannot evaluate %s.', expr1));
                callback(new Error('Cannot evaluate expression.'));
            }
        }

        /**
         * @returns {Promise|*}
         */

    }, {
        key: 'now',
        value: function now() {
            var deferred = Q.defer();
            process.nextTick(function () {
                deferred.resolve(new Date());
            });
            return deferred.promise;
        }

        /**
         * @returns {Promise|*}
         */

    }, {
        key: 'today',
        value: function today() {
            var deferred = Q.defer();
            process.nextTick(function () {
                deferred.resolve(new Date().getDate());
            });
            return deferred.promise;
        }

        /**
         * @returns {Promise|*}
         */

    }, {
        key: 'newid',
        value: function newid() {
            var deferred = Q.defer();
            this.model.context.db.selectIdentity(this.model.sourceAdapter, this.model.primaryKey, function (err, result) {
                if (err) {
                    return deferred.reject(err);
                }
                deferred.resolve(result);
            });
            return deferred.promise;
        }

        /**
         * @returns {Promise|*}
         */

    }, {
        key: 'newGuid',
        value: function newGuid() {
            var deferred = Q.defer();
            process.nextTick(function () {
                try {
                    deferred.resolve(newGuidInternal());
                } catch (err) {
                    deferred.reject(err);
                }
            });
            return deferred.promise;
        }

        /**
         * Generates a random integer value between the given minimum and maximum value
         * @param {number} min
         * @param {number} max
         * @returns {Promise|*}
         */

    }, {
        key: 'int',
        value: function int(min, max) {
            var deferred = Q.defer();
            process.nextTick(function () {
                try {
                    return deferred.resolve(_.random(min, max));
                } catch (err) {
                    deferred.reject(err);
                }
                deferred.resolve(new Date().getDate());
            });
            return deferred.promise;
        }

        /**
         * Generates a random sequence of numeric characters
         * @param {number} length - A integer which represents the length of the sequence
         * @returns {Promise|*}
         */

    }, {
        key: 'numbers',
        value: function numbers(length) {
            var deferred = Q.defer();
            process.nextTick(function () {
                try {
                    length = length || 8;
                    if (length < 0) {
                        return deferred.reject(new Error("Number sequence length must be greater than zero."));
                    }
                    if (length > 255) {
                        return deferred.reject(new Error("Number sequence length exceeds the maximum of 255 characters."));
                    }
                    var times = Math.ceil(length / 10);
                    var res = '';
                    _.times(times, function () {
                        res += _.random(1000000000, 9000000000);
                    });
                    return deferred.resolve(res.substr(0, length));
                } catch (err) {
                    deferred.reject(err);
                }
            });
            return deferred.promise;
        }

        /**
         * @param {number} length
         * @returns {Promise|*}
         */

    }, {
        key: 'chars',
        value: function chars(length) {

            var deferred = Q.defer();
            process.nextTick(function () {
                try {
                    length = length || 8;
                    var chars = "abcdefghkmnopqursuvwxz2456789ABCDEFHJKLMNPQURSTUVWXYZ";
                    var str = "";
                    for (var i = 0; i < length; i++) {
                        str += chars.substr(_.random(0, chars.length - 1), 1);
                    }
                    deferred.resolve(str);
                } catch (err) {
                    return deferred.reject(err);
                }
            });
            return deferred.promise;
        }

        /**
         * @param {number} length
         * @returns {Promise|*}
         */

    }, {
        key: 'password',
        value: function password(length) {
            var deferred = Q.defer();
            process.nextTick(function () {
                try {
                    length = length || 8;
                    var chars = "abcdefghkmnopqursuvwxz2456789ABCDEFHJKLMNPQURSTUVWXYZ";
                    var str = "";
                    for (var i = 0; i < length; i++) {
                        str += chars.substr(_.random(0, chars.length - 1), 1);
                    }
                    deferred.resolve('{clear}' + str);
                } catch (err) {
                    return deferred.reject(err);
                }
            });
            return deferred.promise;
        }

        /**
         * @returns {Promise|*}
         */

    }, {
        key: 'user',
        value: function user() {
            var self = this,
                context = self.model.context,
                deferred = Q.defer();
            var user = context.interactiveUser || context.user || {};
            process.nextTick(function () {
                if (typeof user.id !== 'undefined') {
                    return deferred.resolve(user.id);
                }
                var userModel = context.model('User');
                var parser = void 0;
                var undefinedUser = null;
                userModel.where('name').equal(user.name).silent().select('id').first(function (err, result) {
                    if (err) {
                        TraceUtils.log(err);
                        //try to get undefined user
                        parser = ParserUtils['parse' + userModel.field('id').type];
                        if (typeof parser === 'function') undefinedUser = parser(null);
                        //set id for next calls
                        user.id = undefinedUser;
                        if (_.isNil(context.user)) {
                            context.user = user;
                        }
                        return deferred.resolve(undefinedUser);
                    } else if (_.isNil(result)) {
                        //try to get undefined user
                        parser = ParserUtils['parse' + userModel.field('id').type];
                        if (typeof parser === 'function') undefinedUser = parser(null);
                        //set id for next calls
                        user.id = undefinedUser;
                        if (_.isNil(context.user)) {
                            context.user = user;
                        }
                        return deferred.resolve(undefinedUser);
                    } else {
                        //set id for next calls
                        user.id = result.id;
                        return deferred.resolve(result.id);
                    }
                });
            });
            return deferred.promise;
        }

        /**
         * @returns {Promise|*}
         */

    }, {
        key: 'me',
        value: function me() {
            return this.user();
        }
    }]);

    return FunctionContext;
}();

var UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

function newGuidInternal() {
    var chars = UUID_CHARS;
    var uuid = [];
    var i = void 0;
    // rfc4122, version 4 form
    var r = void 0;
    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
            r = 0 | Math.random() * 16;
            uuid[i] = chars[i === 19 ? r & 0x3 | 0x8 : r];
        }
    }
    return uuid.join('');
}
//# sourceMappingURL=functions.js.map
