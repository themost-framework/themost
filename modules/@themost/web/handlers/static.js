/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;
var HttpServerError = require('@themost/common/errors').HttpServerError;
var HttpForbiddenError = require('@themost/common/errors').HttpForbiddenError;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var fs = require('fs');
var url = require('url');
var path = require("path");
var crypto = require('crypto');
var _  = require('lodash');
/**
 * Static File Handler
 * @class
 * @implements ValidateRequestHandler
 * @implements MapRequestHandler
 * @implements PostMapRequestHandler
 * @implements ProcessRequestHandler
 * @param {string=} rootDir
 * @constructor
 */
function StaticHandler(rootDir) {
    this.rootDir = rootDir;
}

StaticHandler.prototype.validateRequest = function(context, callback) {
    callback = callback || function() {};
    callback.call(context);
};

/*
 * Maps the current request handler with the underlying HTTP request.
 * */
StaticHandler.prototype.mapRequest = function(context, callback)
{
    callback = callback || function() {};
    try {
        if (typeof this.rootDir !== 'string') {
            return callback();
        }
        if (_.isEmpty(this.rootDir)) {
            return callback();
        }
        //get file path
        var uri = url.parse(context.request.url);
        var filePath = path.join(this.rootDir ,uri.pathname);
        fs.exists(filePath, function(exists) {
           if (!exists) {
               callback(null);
           }
           else {
               fs.stat(filePath, function(err, stats) {
                   if (err) {
                       callback(err);
                   }
                   else {
                       //if file exists
                       if (stats && stats.isFile()) {
                           //set request current handler
                           context.request.currentHandler = new StaticHandler();
                           //set current execution path
                           context.request.currentExecutionPath = filePath;
                           //set file stats
                           context.request.currentExecutionFileStats = stats;
                       }
                       callback(null);
                   }
               });
           }
        });
    } catch (e) {
        callback(e);
    }
};

/**
 *
 * @param {HttpContext} context
 * @param {string} executionPath
 * @param {Function} callback
 */
StaticHandler.prototype.unmodifiedRequest = function(context, executionPath, callback) {
    try {
        var requestETag = context.request.headers['if-none-match'];
        if (typeof requestETag === 'undefined' || requestETag === null) {
            callback(null, false);
            return;
        }
        fs.exists(executionPath, function(exists) {
            try {
                if (exists) {
                    fs.stat(executionPath, function(err, stats) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            if (!stats.isFile()) {
                                callback(null, false);
                            }
                            else {
                                //validate if-none-match
                                var md5 = crypto.createHash('md5');
                                md5.update(stats.mtime.toString());
                                var responseETag = md5.digest('base64');
                                return callback(null, (requestETag===responseETag));
                            }
                        }
                    });
                }
                else {
                    callback(null, false);
                }
            }
            catch (err) {
                TraceUtils.error(err);
                callback(null, false);
            }
        });
    }
    catch (err) {
        TraceUtils.error(err);
        callback(null, false);
    }
};

StaticHandler.prototype.preflightRequest = function(context, callback) {
    try {

        if (context && (context.request.currentHandler instanceof StaticHandler)) {
            var headerNames = context.response["_headerNames"] || { };
            if (typeof headerNames["access-control-allow-origin"] === 'undefined') {
                if (context.request.headers.origin) {
                    context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                }
                else {
                    context.response.setHeader("Access-Control-Allow-Origin", "*");
                }
            }
            if (typeof headerNames["access-control-allow-headers"] === 'undefined')
                context.response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Content-Language, Accept, Accept-Language, Authorization");
            if (typeof headerNames["access-control-allow-credentials"] === 'undefined')
                context.response.setHeader("Access-Control-Allow-Credentials", "true");
            if (typeof headerNames["access-control-allow-methods"] === 'undefined')
                context.response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        }
        return callback();
    }
    catch(e) {
        callback(e);
    }

};

StaticHandler.prototype.postMapRequest = function(context, callback) {
    return StaticHandler.prototype.preflightRequest.call(this, context, callback);
};

/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
StaticHandler.prototype.processRequest = function(context, callback)
{
    callback = callback || function() {};
    try {
        if (context.is('OPTIONS')) {
            //do nothing
            return callback();
        }
            //get current execution path and validate once again file presence and MIME type
        var stats = context.request.currentExecutionFileStats;
        if (typeof stats === 'undefined' || stats === null) {
            callback(new HttpServerError('Invalid request handler.'));
            return;
        }
        if (!stats.isFile()) {
            return callback(new HttpNotFoundError());
        }
        else {
            //get if-none-match header
            var requestETag = context.request.headers['if-none-match'];
            //generate responseETag
            var md5 = crypto.createHash('md5');
            md5.update(stats.mtime.toString());
            var responseETag = md5.digest('base64');
            if (requestETag)
                if (requestETag===responseETag) {
                    //context.response.writeHead(304, { 'Last-Modified':stats.mtime.toUTCString() });
                    context.response.writeHead(304, { });
                    context.response.end();
                    return callback.call(context);
                }
            //get file extension
            var extensionName  = path.extname(context.request.currentExecutionPath);
            //get MIME collection
            var mimes = context.getApplication().getConfiguration().mimes;
            var contentType = null, contentEncoding=null;
            //find MIME type by extension
            var mime =mimes.filter(function(x) { return x.extension===extensionName; })[0];
            if (mime) {
                contentType = mime.type;
                if (mime.encoding)
                    contentEncoding = mime.encoding;
            }
            //throw exception (MIME not found or access denied)
            if (contentType===null) {
                callback(new HttpForbiddenError())
            }
            else {
                //create stream
                var source = fs.createReadStream(context.request.currentExecutionPath);
                //write headers
                context.response.writeHead(200, {'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''), 'ETag' : responseETag});
                //response file
                source.pipe(context.response);
                //handle end
                source.on('end', function() {
                    callback();
                });
                //handle error
                source.on('error', function(err) {
                    callback(err);
                });
            }
        }
        }
        catch (e) {
        callback.call(context, e);
    }
};


if (typeof exports !== 'undefined') {
    module.exports.StaticHandler = StaticHandler;
    module.exports.createInstance = function() {
        return new StaticHandler();
    };
}


