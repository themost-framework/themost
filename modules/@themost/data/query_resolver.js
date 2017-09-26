/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.QueryOptionsResolver = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

var _utils2 = require('../common/utils');

var LangUtils = _utils2.LangUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TopQueryOption = "$top";

var QueryOptionsResolver = exports.QueryOptionsResolver = function () {
    function QueryOptionsResolver() {
        _classCallCheck(this, QueryOptionsResolver);
    }

    _createClass(QueryOptionsResolver, null, [{
        key: 'resolveTopQueryOption',


        /**
         * @param {DataQueryable} q
         * @param {*} option
         * @returns Promise
         */
        value: function resolveTopQueryOption(q, option) {
            if (_.isNil(option)) {
                return Q();
            }
            return Q.promise(function (resolve) {
                Args.check(/^[+-]?[0-9]*$/.test(option), new TypeError('Top query option must be an integer'));
                var $top = LangUtils.parseInt(option);
                q.take($top <= 0 ? -1 : $top);
                return resolve();
            });
        }

        /**
         * @param {DataQueryable} q
         * @param {*} option
         */

    }, {
        key: 'resolveSkipQueryOption',
        value: function resolveSkipQueryOption(q, option) {
            if (_.isNil(option)) {
                return Q();
            }
            return Q.promise(function (resolve) {
                Args.check(/^[+]?[0-9]*$/.test(option), new TypeError('Skip query option must be a positive integer'));
                q.skip(LangUtils.parseInt(option));
                return resolve();
            });
        }

        /**
         * @param {DataQueryable} q
         * @param params
         */

    }, {
        key: 'resolveCountQueryOption',
        value: function resolveCountQueryOption(q, params) {}
    }]);

    return QueryOptionsResolver;
}();
//# sourceMappingURL=query_resolver.js.map
