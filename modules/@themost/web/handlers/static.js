/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var HttpServerError = require('@themost/common/errors').HttpServerError;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;
var HttpForbiddenError = require('@themost/common/errors').HttpForbiddenError;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var fs = require('fs');
var _ = require('lodash');
var path = require("path");
var crypto = require('crypto');
/**
 * Use this handler to handle static content
 * @class
 * @augments HttpHandler
 * @constructor
 */
function StaticHandler() {
    //
}

StaticHandler.prototype.validateRequest = function(context, callback) {
    callback = callback || function() {};
    callback.call(context);
};

/**
 * Maps the current request handler with the underlying HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
StaticHandler.prototype.mapRequest = function(context, callback)
{
    callback = callback || function() {};
    try {
        //get file path
        var filePath = context.application.mapPath(context.request.url);
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


StaticHandler.prototype.unmodifiedRequest = function(context, executionPath, callback) {
    try {
        var requestETag = context.request.headers['if-none-match'];
        if (typeof requestETag === 'undefined' || requestETag === null) {
            return callback(null, false);
        }
        fs.exists(executionPath, function(exists) {
            try {
                if (exists) {
                    return fs.stat(executionPath, function(err, stats) {
                        if (err) {
                            return callback(err);
                        }
                        if (!stats.isFile()) {
                            return callback(null, false);
                        }
                        //validate if-none-match
                        var md5 = crypto.createHash('md5');
                        md5.update(stats.mtime.toString());
                        var responseETag = md5.digest('base64');
                        return callback(null, (requestETag===responseETag));
                    });
                }
                return callback(null, false);
            }
            catch (err) {
                TraceUtils.log(err);
                return callback(null, false);
            }
        });
    }
    catch (err) {
        TraceUtils.log(err);
        return callback(null, false);
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
    catch(err) {
        callback(err);
    }

};
/**
 * 
 * @param {HttpContext} context
 * @param {Function} callback
 */
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
            return callback(new HttpServerError('Invalid request handler.'));
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
                    context.response.writeHead(304, { });
                    context.response.end();
                    return callback();
                }
            //get file extension
            var extensionName  = path.extname(context.request.currentExecutionPath);
            //get MIME collection
            var mimes = context.application.config.mimes;
            var contentType = null, contentEncoding=null;
            //find MIME type by extension
            var mime =_.find(mimes, function(x) { return x.extension===extensionName; });
            if (mime) {
                contentType = mime.type;
                if (mime.encoding)
                    contentEncoding = mime.encoding;
            }
            //throw exception (MIME not found or access denied)
            if (_.isNil(contentType)) {
                return callback(new HttpForbiddenError())
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
        catch (err) {
        return callback(err);
    }
};

if (typeof exports !== 'undefined') {
    module.exports.StaticHandler = StaticHandler;
    /**
     * Creates an instance of StaticHandler class
     * @returns {StaticHandler}
     */
    module.exports.createInstance = function() {
        return new StaticHandler();
    };
}


