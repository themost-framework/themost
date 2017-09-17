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
exports.DataExpandResolver = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @param {string} s
 * @returns {Array}
 * @private
 */
function testSplitExpandExpr_(s) {
    var ix = 0;
    var paren = -1;
    var charAt = void 0;
    var ix1 = -1;
    var isLiteral = false;
    var lastSplitIndex = 0;
    var hasParen = false;
    var matches = [];
    var match = null;
    while (ix < s.length) {
        charAt = s.charAt(ix);
        if (charAt === '(' && !isLiteral) {
            if (paren < 0) {
                match = [];
                match[0] = s.substr(lastSplitIndex, ix - lastSplitIndex);
                paren = 0;
            }
            if (ix1 == -1) {
                ix1 = ix;
            }
            hasParen = true;
            paren += 1;
        } else if (charAt === ')' && !isLiteral) {
            if (paren > 0) {
                paren -= 1;
            }
        } else if (charAt === '\'') {
            isLiteral = !isLiteral;
        } else if (charAt === ',' && paren == -1) {
            if (match == null) {
                matches.push([s.substr(lastSplitIndex, ix - lastSplitIndex)]);
            }
            lastSplitIndex = ix + 1;
            hasParen = false;
        }

        if (ix === s.length - 1 && paren == -1) {
            matches.push([s.substr(lastSplitIndex, ix - lastSplitIndex + 1)]);
            match = null;
        } else if (paren == 0) {
            match = match || [];
            match[1] = s.substr(ix1 + 1, ix - ix1 - 1);
            matches.push(match);
            paren = -1;
            ix1 = -1;
        }
        ix += 1;
    }
    return matches;
}

/**
 * @ignore
 * @constructor
 */

var DataExpandResolver = exports.DataExpandResolver = function () {
    function DataExpandResolver() {
        _classCallCheck(this, DataExpandResolver);
    }

    _createClass(DataExpandResolver, null, [{
        key: 'testExpandExpression',

        /**
         * Tests a string expression and returns an array of matched expandable entities
         * @param {string} s
         */
        value: function testExpandExpression(s) {
            if (_.isNil(s)) {
                return [];
            }
            var result = [],
                reOptions = /(;|^)(\$expand|\$filter|\$levels|\$orderby|\$groupby|\$select|\$top|\$skip|\$search|\$count)=(.*?)(;\$|$)/ig;
            var matches = testSplitExpandExpr_(s);
            for (var i = 0; i < matches.length; i++) {
                var match = matches[i];
                if (typeof match[1] === 'undefined') {
                    result.push({ name: match[0].replace(/^\s+|\s+$/, "") });
                } else {
                    var expand = {};
                    expand["name"] = match[0].replace(/^\s+|\s+$/, "");
                    reOptions.lastIndex = 0;
                    var params = {};
                    var expandOptions = match[1];
                    var matchOption = reOptions.exec(expandOptions);
                    while (matchOption) {
                        if (matchOption[3]) {
                            params[matchOption[2]] = matchOption[3];
                            reOptions.lastIndex = reOptions.lastIndex - 2;
                        }
                        matchOption = reOptions.exec(expandOptions);
                    }
                    expand.options = params;
                    result.push(expand);
                }
            }
            return result;
        }
    }]);

    return DataExpandResolver;
}();
//# sourceMappingURL=expand-resolver.js.map
