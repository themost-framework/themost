/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var HttpBadRequestError = require("@themost/common/errors").HttpBadRequestError;
var raw = require('raw-body');
var DOMParser = require('xmldom').DOMParser;
var contentTypeParser = require('content-type');
var _  = require('lodash');

function hasXmlContent(request) {
    if (typeof request.headers['content-type'] !== 'string') {
        return false;
    }
    var contentType = contentTypeParser.parse(request.headers['content-type']);
    if (typeof contentType === 'undefined' || contentType === null) {
        return false;
    }
    return /(\+xml)|(\/xml)$/i.test(contentType.type) && (request.method !== 'GET');
}

/**
 * @class
 * @constructor
 * @implements BeginRequestHandler
 * @implements ValidateRequestHandler
 */
function XmlHandler() {

}

/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
XmlHandler.prototype.beginRequest = function(context, callback) {
    var request = context.request;
    if (hasXmlContent(request)) {
        var configurationOptions = context.getApplication().getConfiguration().getSourceAt('settings/xml');
        var options = _.assign({
            limit: '1mb',
            encoding: 'utf8'
        }, configurationOptions);
        var len = request.headers['content-length'];
        if (len) {
            options.length = len;
        }
        return raw(request, options).then(function (str) {
            request.body = str;
            return callback();
        }).catch(function (err) {
            return callback(err);
        });
    }
    return callback();
};
/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
XmlHandler.prototype.validateRequest = function(context, callback) {
    var request = context.request;
    if (hasXmlContent(request)) {
        //validate xml
        if (typeof request.body === 'string') {
// eslint-disable-next-line no-unused-vars
            var doc;
            var parser;
            var errors = [];
            try {
                parser = new DOMParser({
                    locator:{

                    },
                    errorHandler:{
                        error:function(msg){
                            errors.push(msg);
                        }
                    }
                });
                doc = parser.parseFromString(request.body,'application/xml');
                if (errors.length>0) {
                    return callback(new HttpBadRequestError(errors[0]));
                }
            }
            catch (err) {
                return callback(err);
            }
            return callback();
        }
    }
    return callback();
};
if (typeof exports !== 'undefined') {
    module.exports.XmlHandler = XmlHandler;
    module.exports.createInstance = function() {
        return new XmlHandler();
    };
}
