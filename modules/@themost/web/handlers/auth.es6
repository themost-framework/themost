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
import {TraceUtils} from '@themost/common/utils';

/**
 * @param {IncomingMessage|ClientRequest} request
 * @returns {*}
 */
function parseCookies(request) {
    const list = {}, rc = request.headers.cookie;
    rc && rc.split(';').forEach(function( cookie ) {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });
    return list;
}

const ANONYMOUS_IDENTITY = { name: 'anonymous', authenticationType:'None' };

/**
 * @class
 * @augments HttpHandler
 */
export default class AuthHandler {

    /**
     * Authenticates an HTTP request and sets user or anonymous identity.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    authenticateRequest(context, callback) {
        try {
            callback = callback || function() {};
            let cookies = {};
            const model = context.model('User');
            const settings = context.application.config.settings ? (context.application.config.settings.auth || { }) : { };
            settings.name = settings.name || '.MAUTH';
            if (context && context.request)
                cookies = parseCookies(context.request);
            if (cookies[settings.name]) {
                let str = null;
                try {
                    str = context.application.decrypt(cookies[settings.name]);
                }
                catch (e) {
                    //log error (on bad cookie)
                    TraceUtils.log(e);
                }
                //and continue
                let userName = null;
                if (str) {
                    const authCookie = JSON.parse(str);
                    //validate authentication cookie
                    if (authCookie.user)
                        userName = authCookie.user;
                }
                if (typeof model === 'undefined' || model === null) {
                    //no authentication provider is defined
                    context.user = { name: userName || 'anonymous', authenticationType:'Basic' };
                    callback(null);
                    return;
                }
                //search for user
                if (userName) {
                    //set user identity
                    context.user = model.convert({ name: userName, authenticationType:'Basic' });
                    callback(null);
                }
                else {
                    //an auth cookie was found but user data or user model does not exist
                    //set anonymous identity
                    context.user = model.convert(ANONYMOUS_IDENTITY);
                    callback(null);
                }
            }
            else {
                //set anonymous identity
                if (model)
                    context.user = model.convert(ANONYMOUS_IDENTITY);
                else
                    context.user = ANONYMOUS_IDENTITY;
                //no auth cookie was found on request
                callback(null);
            }
        }
        catch (e) {
            callback(e);
        }
    }

    /**
     * @param {{context: HttpContext, target: HttpResult}} args
     * @param callback
     */
    preExecuteResult(args, callback) {
        try {
            callback = callback || function() {};
            const context = args.context, model = context.model('User');
            if (typeof model === 'undefined' || model === null) {
                callback();
                return;
            }
            const authenticationType = context.user.authenticationType;
            model.where('name').equal(context.user.name).expand('groups').silent().first(function(err, result) {
               if (err) { return callback(err); }
                if (result) {
                    //replace context.user with data object
                    context.user = model.convert(result);
                    context.user.authenticationType = authenticationType;
                    return callback();
                }
                else if (context.user.name!=='anonymous') {
                    model.where('name').equal('anonymous').expand('groups').silent().first(function(err, result) {
                        if (err) { return callback(err); }
                        if (result) {
                            context.user = model.convert(result);
                            context.user.authenticationType = authenticationType;
                            return callback();
                        }
                        else {
                            return callback();
                        }
                    });
                }
                else {
                    //do nothing
                    return callback();
                }
            });
        }
        catch (err) {
            callback(err);
        }
    }
}