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
//import polyfill from 'babel-polyfill';
import {_} from 'lodash';
import path from 'path';
import {HttpApplication} from './app';
import {TraceUtils} from '@themost/common/utils';
import {HttpError} from '@themost/common/errors';
import fs from 'fs';

export * from './mvc';
export * from './files';
export * from './context';
export * from './app';

export class Most {
    /**
     * Most Web Framework Express Parser
     * @param {Object=} options
     */
    static runtime(options) {
        return function runtimeParser(req, res, next) {
            //create context
            const ctx = HttpApplication.current.createContext(req,res);
            ctx.request.on('close', function() {
                //client was disconnected abnormally
                //finalize data context
                if (typeof ctx !== 'undefined' && ctx !=null) {
                    ctx.finalize(function() {
                        if (ctx.response) {
                            //if response is alive
                            if (ctx.response.finished == false)
                            //end response
                                ctx.response.end();
                        }
                    });
                }
            });
            //process request
            HttpApplication.current.processRequest(ctx, function(err) {
                if (err) {
                    ctx.finalize(function() {
                        next(err);
                    });
                }
                else {
                    ctx.finalize(function() {
                        ctx.response.end();
                    });
                }
            });
        }
    }

    /**
     * Expression handler for Access Denied HTTP errors (401).
     */
    static unauthorized() {
        return function(err, req, res, next)
        {
            try {
                if (err.status==401)  {
                    if (/text\/html/g.test(req.get('accept'))) {
                        if (HttpApplication.current.config.settings) {
                            if (HttpApplication.current.config.settings.auth) {
                                const page = HttpApplication.current.config.settings.auth.loginPage || '/login.html';
                                res.set('Location', page.concat('?returnUrl=', encodeURIComponent(req.url)));
                                res.status(302).end();
                                return;
                            }
                        }
                    }
                }
                next(err);
            }
            catch(e) {
                TraceUtils.log(e);
                next(err);
            }
        };
    }

    static error() {
        return function(err, request, response, next)
        {
            try {
                const ejs = require('ejs');
                if (_.isNil(response) || _.isNil(request)) {
                    next(err);
                }
                if (!/text\/html/g.test(request.get('accept'))) {
                    next(err);
                }
                else {
                    if (response._headerSent) {
                        next(err);
                        return;
                    }
                    fs.readFile(path.join(__dirname, './resources/http-error.html.ejs'), 'utf8', function (readErr, data) {
                        if (readErr) {
                            //log process error
                            TraceUtils.log(readErr);
                            next(err);
                            return;
                        }
                        //compile data
                        let str;
                        try {
                            if (err instanceof HttpError) {
                                str = ejs.render(data, { error:err });
                            }
                            else {
                                const httpErr = new HttpError(500, null, err.message);
                                httpErr.stack = err.stack;
                                str = ejs.render(data, {error: httpErr});
                            }
                        }
                        catch (e) {
                            TraceUtils.log(e);
                            next(err);
                            return;
                        }
                        //write status header
                        response.writeHead(err.status || 500 , { "Content-Type": "text/html" });
                        response.write(str);
                        response.end();
                    });
                }
            }
            catch(e) {
                TraceUtils.log(e);
                next(err);
            }
        };
    }
}

