/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var _  = require('lodash');
var querystring = require('querystring');
/**
 * Provides a case insensitive attribute getter
 * @param name
 * @returns {*}
 * @private
 */
function caseInsensitiveAttribute(name) {
    if (typeof name === 'string') {
        if (this[name])
            return this[name];
        //otherwise make a case insensitive search
        var re = new RegExp('^' + name + '$','i');
        var p = Object.keys(this).filter(function(x) { return re.test(x); })[0];
        if (p)
            return this[p];
    }
}

function caseInsensitiveHasAttribute(name) {
    if (typeof name === 'string') {
        if (this[name])
            return true;
        //otherwise make a case insensitive search
        var re = new RegExp('^' + name + '$','i');
        var p = Object.keys(this).filter(function(x) { return re.test(x); })[0];
        if (p)
            return true;
    }
    return false;
}

function QuerystringHandler() {
    //
}

QuerystringHandler.prototype.beginRequest = function(context, callback) {
    context = context || {};
    callback = callback || function() {};
    var request = context.request;
    if (typeof request === 'undefined') {
        callback();
        return;
    }
    try {
        context.params = context.params || {};
        //apply case insensitivity search in params object
        context.params.attr = caseInsensitiveAttribute;
        context.params.hasAttr = caseInsensitiveHasAttribute;
        //add query string params
        if (request.url.indexOf('?') > 0)
            _.assign(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
        callback();
    }
    catch(e) {
        callback(e);
    }
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new QuerystringHandler();  };
}