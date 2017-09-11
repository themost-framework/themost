/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2014-10-13.
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 Anthi Oikonomou anthioikonomou@gmail.com
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of MOST Web Framework nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @ignore
 */
var _ = require('lodash');

/**
 * @param {string} s
 * @returns {Array}
 * @private
 */
function testSplitExpandExpr_(s) {
    var ix = 0;
    var paren = -1, charAt, ix1 = -1,
        isLiteral = false,
        lastSplitIndex = 0,
        hasParen = false,
        matches = [],
        match = null;
    while(ix<s.length) {
        charAt=s.charAt(ix);
        if ((charAt==='(') && !isLiteral) {
            if (paren<0) {
                match = [];
                match[0] = s.substr(lastSplitIndex, ix-lastSplitIndex);
                paren = 0;
            }
            if (ix1==-1) { ix1 = ix; }
            hasParen = true;
            paren += 1;
        }
        else if ((charAt===')') && !isLiteral) {
            if (paren>0) { paren -= 1; }
        }
        else if (charAt==='\'') {
            isLiteral = !isLiteral;
        }
        else if ((charAt===',') && (paren ==-1)) {
            if (match==null) {
                matches.push([s.substr(lastSplitIndex, ix-lastSplitIndex)]);
            }
            lastSplitIndex = ix+1;
            hasParen = false;
        }

        if ((ix === s.length - 1) && (paren == -1)) {
            matches.push([s.substr(lastSplitIndex, ix-lastSplitIndex+1)]);
            match = null;
        }
        else if (paren == 0) {
            match = match || [ ];
            match[1] = s.substr(ix1+1, ix-ix1-1);
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
function DataExpandResolver() {
    //
}
/**
 * Tests a string expression and returns an array of matched expandable entities
 * @param {string} s
 */
DataExpandResolver.prototype.testExpandExpression = function(s) {
    if (_.isNil(s)) {
        return [];
    }
    var result = [], reOptions = /(;|^)(\$expand|\$filter|\$levels|\$orderby|\$groupby|\$select|\$top|\$skip|\$search|\$count)=(.*?)(;\$|$)/ig;
    var matches = testSplitExpandExpr_(s);
    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        if (typeof match[1] === 'undefined') {
            result.push({ name:match[0].replace(/^\s+|\s+$/,"") });
        }
        else {
            var expand = { };
            expand["name"] = match[0].replace(/^\s+|\s+$/,"");
            reOptions.lastIndex = 0;
            var params = { };
            var expandOptions = match[1];
            var matchOption = reOptions.exec(expandOptions);
            while(matchOption) {
                if (matchOption[3]) {
                    params[matchOption[2]] = matchOption[3];
                    reOptions.lastIndex = reOptions.lastIndex-2;
                }
                matchOption = reOptions.exec(expandOptions);
            }
            expand.options = params;
            result.push(expand);
        }
    }
    return result;
};


if (typeof exports !== 'undefined')
{
    module.exports = {
        DataExpandResolver:DataExpandResolver,
        testExpandExpression: function(s) {
            return DataExpandResolver.prototype.testExpandExpression(s);
        }
    };
}