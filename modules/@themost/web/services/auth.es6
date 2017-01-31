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
import {HttpForbiddenError,HttpUnauthorizedError} from '@themost/common/errors';
import {TraceUtils} from '@themost/common/utils';
import crypto from 'crypto';

export function createInstance(context) {
    return {
        login:function(userName, userPassword, callback) {
            callback = callback || function() {};
            try {
                context.model('user').where('name').equal(userName).select(['id','enabled']).silent().first(function(err, result) {
                    if (err) {
                        callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                    }
                    else {
                        if (result) {
                            if (!result.enabled) {
                                callback(new HttpForbiddenError('The account is disabled. Please contact your system administrator.'));
                                return;
                            }
                            //user was found
                            const model = context.model('UserCredential');
                            if (typeof model === 'undefined' || model === null) {
                                TraceUtils.log('UserCredential model is missing.');
                                callback(new Error('Login failed due to server error.'));
                                return;
                            }
                            model.where('id').equal(result.id).silent().first(function (err, creds) {
                                if (err) {
                                    TraceUtils.log(err);
                                    callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                                }
                                else {
                                    if (creds) {
                                        let authenticated = false;
                                        //user credentials were found
                                        //1. clear text
                                        if (/^\{clear\}/i.test(creds.userPassword)) {
                                            authenticated = (creds.userPassword.replace(/^\{clear\}/i, '') == userPassword)
                                        }
                                        //2. md5 text
                                        else if (/^\{md5\}/i.test(creds.userPassword)) {
                                            const md5password = crypto.createHash('md5').update(userPassword).digest('hex');
                                            authenticated = (creds.userPassword.replace(/^\{md5\}/i, '') == md5password)
                                        }
                                        //3. sha1 text
                                        else if (/^\{sha1\}/i.test(creds.userPassword)) {
                                            const sha1password = crypto.createHash('sha1').update(userPassword).digest('hex');
                                            authenticated = (creds.userPassword.replace(/^\{sha1\}/i, '') == sha1password)
                                        }
                                        if (authenticated) {
                                            //set cookie
                                            context.application.setAuthCookie(context, userName);
                                            context.user = model.convert({ name: userName, authenticationType:'Basic' });
                                            callback();
                                        }
                                        else {
                                            callback(new HttpUnauthorizedError('Unknown username or bad password.'));
                                        }
                                    }
                                    else {
                                        TraceUtils.log('User credentials cannot be found (%s).', userName);
                                        callback(new HttpUnauthorizedError('Unknown username or bad password.'));
                                    }
                                }
                            });
                        }
                        else {
                            //user was not found
                            callback(new HttpUnauthorizedError('Unknown username. Please try again.'));
                        }
                    }
                });
            }
            catch (e) {
                TraceUtils.log(e);
                callback(new Error('Login failed due to internal server error.'));
            }

        },
        logout:function(callback) {
            callback = callback || function() {};
            const anonymousIdentity = { name: 'anonymous', authenticationType:'None' };
            try {
                //get user model, if any
                const model = context.model('User');
                //set auth cookie to anonymous
                context.application.setAuthCookie(context, 'anonymous');
                //check user model and set HttpContext.user property
                if (model)
                    context.user = model.convert(anonymousIdentity);
                else
                    context.user = anonymousIdentity;
                callback(null);
            }
            catch(e) {
                TraceUtils.log(e);
                if (context)
                    context.user = anonymousIdentity;
            }

        }
    }
}
