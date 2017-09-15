/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var AuthStrategy = require("../strategies/auth").AuthStrategy;
var _ = require('lodash');
/**
 * @class
 * @constructor
 * @extends HttpHandler
 */
function AuthHandler() {
    //
}

AuthHandler.ANONYMOUS_IDENTITY = { name: 'anonymous', authenticationType:'None' };

/**
 * Authenticates an HTTP request and sets user or anonymous identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
AuthHandler.prototype.authenticateRequest = function (context, callback) {
    try {
        callback = callback || function() {};
        var authCookie, userName;
        if (context && context.request) {
            var cookieString = context.application.getStrategy(AuthStrategy).getAuthCookie(context);
            if (_.isString(cookieString)) {
                authCookie = JSON.parse(cookieString);
            }
        }
        if (authCookie) {
            if (authCookie.user) {
                userName = authCookie.user;
            }
            if (typeof model === 'undefined' || model === null) {
                //no authentication provider is defined
                context.user = { name: userName || 'anonymous', authenticationType:'Basic' };
                return callback();
            }
            //search for user
            if (userName) {
                //set user identity
                context.user = model.convert({ name: userName, authenticationType:'Basic' });
                return callback();
            }
            else {
                //an auth cookie was found but user data or user model does not exist
                //set anonymous identity
                context.user = model.convert(AuthHandler.ANONYMOUS_IDENTITY);
                return callback();
            }
        }
        else {
            //set anonymous identity
            if (model)
                context.user = model.convert(AuthHandler.ANONYMOUS_IDENTITY);
            else
                context.user = AuthHandler.ANONYMOUS_IDENTITY;
            //no auth cookie was found on request
            return callback();
        }
    }
    catch (err) {
        return callback(err);
    }
};
/**
 * @param {{context: HttpContext, target: HttpResult}} args
 * @param callback
 */
AuthHandler.prototype.preExecuteResult = function (args, callback) {
    try {
        callback = callback || function() {};
        var context = args.context, model = context.model('User');
        if (typeof model === 'undefined' || model === null) {
            callback();
            return;
        }
        var authenticationType = context.user.authenticationType;
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
    catch (e) {
        callback(e);
    }
};

/**
 * Creates a new instance of AuthHandler class
 * @returns {AuthHandler}
 */
AuthHandler.createInstance = function() {
   return new AuthHandler();
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = AuthHandler.createInstance;
}