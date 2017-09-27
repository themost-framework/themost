/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import {HttpServerError,HttpNotFoundError,HttpForbiddenError} from '@themost/common/errors';
import {TraceUtils} from '@themost/common/utils';
import _ from 'lodash';
import Q from 'q';
import fs from 'fs';
import url from 'url';
import path from 'path';
import crypto from 'crypto';
import {HttpConsumer} from '../consumers';
import {HttpNextResult} from '../results';

/**
 * @classdesc Default static content handler (as it has been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
 */
class StaticHandler {

    /**
     *
     * @param {string=} rootDir
     */
    constructor(rootDir) {
        this.rootDir = rootDir || './app';
        this.whenDir =  '/';
    }

    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    mapRequest(context, callback) {
        callback = callback || function() {};
        try {
            let uri = url.parse(context.request.url).pathname;
            if (_.isString(this.whenDir) && this.whenDir!=='/') {
                const re = new RegExp('^' + _.escapeRegExp(this.whenDir),'ig');
                if (!re.test(uri)) {
                    return callback(null, false);
                }
                else {
                    uri = uri.replace(re,'');
                }
            }
            const filePath = path.join(this.rootDir, uri);
            fs.exists(filePath, function(exists) {
                if (!exists) {
                    return callback(null, false);
                }
                else {
                    fs.stat(filePath, function(err, stats) {
                        if (err) {
                            return callback(err);
                        }
                        //if file exists
                        if (stats && stats.isFile()) {
                            //set request current handler
                            context.request.currentHandler = new StaticHandler();
                            //set current execution path
                            context.request.currentExecutionPath = filePath;
                            //set file stats
                            context.request.currentExecutionFileStats = stats;
                            //return true
                            return callback(null, true);
                        }
                        return callback(null, false);
                    });
                }
            });
        } catch (err) {
            return callback(err);
        }
    }

    unmodifiedRequest(context, executionPath, callback) {
        try {
            const requestETag = context.request.headers['if-none-match'];
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
                                    const md5 = crypto.createHash('md5');
                                    md5.update(stats.mtime.toString());
                                    const responseETag = md5.digest('base64');
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
            if (_.isNil(stats)) {
                return callback(new HttpServerError('Invalid request handler.'));
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
                    if (requestETag===responseETag) {
                        //context.response.writeHead(304, { 'Last-Modified':stats.mtime.toUTCString() });
                        context.response.writeHead(304, { });
                        context.response.end();
                        return callback();
                    }
                //get file extension
                const extensionName  = path.extname(context.request.currentExecutionPath);
                //get MIME collection
                let contentType = null, contentEncoding=null;
                //find MIME type by extension
                const mime =context.getApplication().getConfiguration().getMimeType(extensionName);
                if (mime) {
                    contentType = mime.type;
                    if (mime.encoding)
                        contentEncoding = mime.encoding;
                }
                //throw exception (MIME not found or access denied)
                if (contentType===null) {
                    return callback(new HttpForbiddenError())
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
        catch (err) {
            return callback(err);
        }
    }
}


export class StaticContentConsumer extends HttpConsumer {
    /**
     * @param {string=} rootDir
     * @constructor
     */
    constructor(rootDir) {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new StaticHandler(rootDir);
                return Q.nfbind(handler.mapRequest.bind(handler))(context)
                    .then((res) => {
                        if (res) {
                            return Q.nfbind(handler.processRequest.bind(handler))(context);
                        }
                        return HttpNextResult.create().toPromise();
                    });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}

export class MapStaticContentConsumer extends HttpConsumer {
    /**
     * @param {string=} whenDir
     * @param {string=} rootDir
     * @constructor
     */
    constructor(whenDir, rootDir) {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new StaticHandler(rootDir);
                handler.whenDir = whenDir;
                return Q.nfbind(handler.mapRequest.bind(handler))(context)
                    .then((res) => {
                        if (res) {
                            return Q.nfbind(handler.processRequest.bind(handler))(context);
                        }
                        return HttpNextResult.create().toPromise();
                    });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}


