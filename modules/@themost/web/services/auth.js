/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-11-15
 */
/**
 * @ignore
 */
var common = require('@themost/common'),
    crypto = require('crypto'),
    util = require('util');

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
                                    callback(new common.HttpForbiddenException('The account is disabled. Please contact your system administrator.'));
                                    return;
                                }
                                //user was found
                                var model = context.model('UserCredential');
                                if (typeof model === 'undefined' || model === null) {
                                    console.log('UserCredential model is missing.');
                                    callback(new Error('Login failed due to server error.'));
                                    return;
                                }
                                model.where('id').equal(result.id).silent().first(function (err, creds) {
                                    if (err) {
                                        console.log(err);
                                        callback(new Error('Login failed due to server error. Please try again or contact your system administrator.'));
                                    }
                                    else {
                                        if (creds) {
                                            var authenticated = false;
                                            //user credentials were found
                                            //1. clear text
                                            if (/^\{clear\}/i.test(creds.userPassword)) {
                                                authenticated = (creds.userPassword.replace(/^\{clear\}/i, '') == userPassword)
                                            }
                                            //2. md5 text
                                            else if (/^\{md5\}/i.test(creds.userPassword)) {
                                                var md5password = crypto.createHash('md5').update(userPassword).digest('hex');
                                                authenticated = (creds.userPassword.replace(/^\{md5\}/i, '') == md5password)
                                            }
                                            //3. sha1 text
                                            else if (/^\{sha1\}/i.test(creds.userPassword)) {
                                                var sha1password = crypto.createHash('sha1').update(userPassword).digest('hex');
                                                authenticated = (creds.userPassword.replace(/^\{sha1\}/i, '') == sha1password)
                                            }
                                            if (authenticated) {
                                                //set cookie
                                                context.application.setAuthCookie(context, userName);
                                                context.user = model.convert({ name: userName, authenticationType:'Basic' });
                                                callback();
                                            }
                                            else {
                                                callback(new common.HttpUnauthorizedException('Unknown username or bad password.'));
                                            }
                                        }
                                        else {
                                            console.log(util.log('User credentials cannot be found (%s).', userName));
                                            callback(new common.HttpUnauthorizedException('Unknown username or bad password.'));
                                        }
                                    }
                                });
                            }
                            else {
                                //user was not found
                                callback(new common.HttpUnauthorizedException('Unknown username. Please try again.'));
                            }
                        }
                    });
                }
                catch (e) {
                    console.log(e);
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
                    context.application.setAuthCookie(context, 'anonymous');
                    //check user model and set HttpContext.user property
                    if (model)
                        context.user = model.convert(anonymousIdentity);
                    else
                        context.user = anonymousIdentity;
                    callback(null);
                }
                catch(e) {
                    console.log(e);
                    if (context)
                        context.user = anonymousIdentity;
                }

            }
        }
    }
}

