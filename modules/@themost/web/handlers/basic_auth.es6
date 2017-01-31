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
 * @class
 * @augments HttpHandler
 */
export default class BasicAuthHandler {
    /**
     * @param {string} s
     * @returns {{userName:string, userPassword:string}|undefined}
     * @ignore
     */
    static parseBasicAuthorization(s) {
        try {
            if (typeof s !== 'string')
                return;
            //get authorization type (basic)
            const re = /\s?(Basic)\s+(.*)\s?/ig;
            const match = re.exec(s.replace(/^\s+/g,''));
            if (match) {
                //get authorization token
                const token = match[2];
                //decode token
                const buffer = new Buffer(token, 'base64');
                //get args e.g. username:password
                const matched = /(.*):(.*)/ig.exec(buffer.toString());
                if (matched) {
                    return { userName:matched[1], userPassword:matched[2] };
                }
            }
        }
        catch(err) {
            TraceUtils.log(err);
        }
    }

    authenticateRequest(context, callback) {
        callback = callback || function() {};
        try {
            /**
             * @type {{userName: string, userPassword: string}|*}
             */
            const authorizationArgs = BasicAuthHandler.parseBasicAuthorization(context.request.headers['authorization']);
            if (typeof authorizationArgs !== 'undefined') {
                //ensure settings
                context.application.config.settings.auth = context.application.config.settings.auth || { };
                const providerPath = context.application.config.settings.auth.provider || './services/auth';
                //get auth provider
                let svc;
                if (/^\//.test(providerPath)) {
                    svc = require(context.application.mapPath(providerPath));
                }
                else {
                    svc = require(providerPath);
                }
                if (typeof svc.createInstance === 'function') {
                    //create provider instance
                    const provider = svc.createInstance(context);
                    //validate credentials
                    if (!authorizationArgs.userName.match(BasicAuthHandler.USERNAME_REGEXP)) {
                        callback(new Error('Wrong username format. Please contact to system administrator.'));
                        return;
                    }
                    provider.login(authorizationArgs.userName, authorizationArgs.userPassword, callback);
                }
                else
                    callback(null);
            }
            else {
                callback(null);
            }
        }
        catch(e) {
            callback(e);
        }
    }
}

BasicAuthHandler.USERNAME_REGEXP = /^[a-zA-Z0-9\.\@_-]{1,255}$/;

