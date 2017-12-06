/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-05-07
 */
/**
 * @ignore
 */
var app = require('../index'),
    fs = require('fs'),
    path = require("path"),
    crypto = require('crypto');
/**
 * Static File Handler
 * @class StaticHandler
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

/*
StaticHandler.prototype.beginRequest = function(context) {	};
*/

/*
StaticHandler.prototype.authenticateRequest = function(context)	{ };
*/

/*
StaticHandler.prototype.postAuthenticateRequest = function(context) { };
*/
/*
StaticHandler.prototype.authorizeRequest = function(context) {	};
*/

/*
 * Maps the current request handler with the underlying HTTP request.
 * */
StaticHandler.prototype.mapRequest = function(context, callback)
{
    callback = callback || function() {};
    try {
        //get file path
        var filePath = app.current.mapPath(context.request.url);
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
 * @param p
 * @returns {*}
 */
StaticHandler.prototype.mapPath = function(p) {
    return app.current.mapPath(p)
};

/*
StaticHandler.prototype.preRequestHandlerExecute = function(context)
{
    //
};
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
            catch (e) {
                console.log(e);
                callback(null, false);
            }
        });
    }
    catch (e) {
        console.log(e);
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
            callback(new app.common.HttpServerError('Invalid request handler.'));
            return;
        }
        if (!stats.isFile()) {
            return callback(new app.common.HttpNotFoundException());
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
            var app = require('../index');
            //get MIME collection
            var mimes = app.current.config.mimes;
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
                callback(new app.common.HttpForbiddenException())
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

/*
StaticHandler.prototype.postRequestHandlerExecute = function(context) { };
*/

/*
StaticHandler.prototype.endRequest = function(context) { };
*/


if (typeof exports !== 'undefined') {
    module.exports = {
        StaticHandler:StaticHandler,
        createInstance : function() {
        return new StaticHandler();
    }
    };
}


