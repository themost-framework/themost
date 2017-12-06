/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var TraceUtils = require('@themost/common/utils').TraceUtils;
var HttpUnauthorizedError = require('@themost/common/errors').HttpUnauthorizedError;
var HttpForbiddenError = require('@themost/common/errors').HttpForbiddenError;
var crypto = require('crypto');

if (typeof exports !== 'undefined') {
    exports.createInstance = function(context) {
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
                                    return callback(new HttpForbiddenError('The account is disabled. Please contact your system administrator.'));
                                }
                                //user was found
                                var model = context.model('UserCredential');
                                if (typeof model === 'undefined' || model === null) {
                                    TraceUtils.log('UserCredential model is missing.');
                                    return callback(new Error('Login failed due to server error.'));
                                }
                                model.where('id').equal(result.id).silent().first(function (err, creds) {
                                    if (err) {
                                        TraceUtils.log(err);
                                        callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                                    }
                                    else {
                                        if (creds) {
                                            var authenticated = false;
                                            //user credentials were found
                                            //1. clear text
                                            if (/^{clear}/i.test(creds.userPassword)) {
                                                authenticated = (creds.userPassword.replace(/^{clear}/i, '') === userPassword)
                                            }
                                            //2. md5 text
                                            else if (/^{md5}/i.test(creds.userPassword)) {
                                                var md5password = crypto.createHash('md5').update(userPassword).digest('hex');
                                                authenticated = (creds.userPassword.replace(/^{md5}/i, '') === md5password)
                                            }
                                            //3. sha1 text
                                            else if (/^{sha1}/i.test(creds.userPassword)) {
                                                var sha1password = crypto.createHash('sha1').update(userPassword).digest('hex');
                                                authenticated = (creds.userPassword.replace(/^{sha1}/i, '') === sha1password)
                                            }
                                            if (authenticated) {
                                                //set cookie
                                                context.getApplication().setAuthCookie(context, userName);
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
                catch (err) {
                    TraceUtils.log(err);
                    callback(new Error('Login failed due to internal server error.'));
                }

            },
            logout:function(callback) {
                callback = callback || function() {};
                var anonymousIdentity = { name: 'anonymous', authenticationType:'None' };
                try {
                    //get user model, if any
                    var model = context.model('User');
                    //set auth cookie to anonymous
                    context.getApplication().setAuthCookie(context, 'anonymous');
                    //check user model and set HttpContext.user property
                    if (model)
                        context.user = model.convert(anonymousIdentity);
                    else
                        context.user = anonymousIdentity;
                    callback(null);
                }
                catch(err) {
                    TraceUtils.log(err);
                    if (context)
                        context.user = anonymousIdentity;
                }

            }
        }
    }
}

