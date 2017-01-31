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
import {HttpServerError,HttpNotFoundError,HttpForbiddenError} from '@themost/common/errors';
import {TraceUtils} from '@themost/common/utils';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * @classdesc Static File Handler
 * @class
 * @augments HttpHandler
 */
export default class StaticHandler {
    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    validateRequest(context, callback) {
        callback = callback || function() {};
        callback.call(context);
    }

    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    mapRequest(context, callback) {
        callback = callback || function() {};
        try {
            //get file path
            const filePath = context.application.mapPath('/app' + context.request.url);
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
    }

    unmodifiedRequest(context, executionPath, callback) {
        try {
            const requestETag = context.request.headers['if-none-match'];
            if (typeof requestETag === 'undefined' || requestETag == null) {
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
                                    const md5 = crypto.createHash('md5');
                                    md5.update(stats.mtime.toString());
                                    const responseETag = md5.digest('base64');
                                    return callback(null, (requestETag==responseETag));
                                }
                            }
                        });
                    }
                    else {
                        callback(null, false);
                    }
                }
                catch (e) {
                    TraceUtils.log(e);
                    callback(null, false);
                }
            });
        }
        catch (e) {
            TraceUtils.log(e);
            callback(null, false);
        }
    }

    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    preflightRequest(context, callback) {
        try {

            if (context && (context.request.currentHandler instanceof StaticHandler)) {
                const headerNames = context.response["_headerNames"] || { };
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

    }

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    postMapRequest(context, callback) {
        return StaticHandler.prototype.preflightRequest.call(this, context, callback);
    }

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    processRequest(context, callback) {
        callback = callback || function() {};
        try {
            if (context.is('OPTIONS')) {
                //do nothing
                return callback();
            }
                //get current execution path and validate once again file presence and MIME type
            const stats = context.request.currentExecutionFileStats;
            if (typeof stats === 'undefined' || stats == null) {
                callback(new HttpServerError('Invalid request handler.'));
                return;
            }
            if (!stats.isFile()) {
                return callback(new HttpNotFoundError());
            }
            else {
                //get if-none-match header
                const requestETag = context.request.headers['if-none-match'];
                //generate responseETag
                const md5 = crypto.createHash('md5');
                md5.update(stats.mtime.toString());
                const responseETag = md5.digest('base64');
                if (requestETag)
                    if (requestETag==responseETag) {
                        //context.response.writeHead(304, { 'Last-Modified':stats.mtime.toUTCString() });
                        context.response.writeHead(304, { });
                        context.response.end();
                        return callback.call(context);
                    }
                //get file extension
                const extensionName  = path.extname(context.request.currentExecutionPath);
                //get MIME collection
                const mimes = context.application.config.mimes;
                let contentType = null, contentEncoding=null;
                //find MIME type by extension
                const mime =mimes.filter(function(x) { return x.extension==extensionName; })[0];
                if (mime) {
                    contentType = mime.type;
                    if (mime.encoding)
                        contentEncoding = mime.encoding;
                }
                //throw exception (MIME not found or access denied)
                if (contentType==null) {
                    callback(new HttpForbiddenError())
                }
                else {
                    //create stream
                    const source = fs.createReadStream(context.request.currentExecutionPath);
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
    }
}



