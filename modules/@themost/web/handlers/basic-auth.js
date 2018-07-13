/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var TraceUtils = require('@themost/common/utils').TraceUtils;
var _ = require('lodash');
/**
 * @class
 * @constructor
 * @implements AuthenticateRequestHandler
 */
function BasicAuthHandler() {
    //
}

/**
 * @param {string|*} s
 * @returns {{userName:string, userPassword:string}|undefined}
 */
BasicAuthHandler.parseBasicAuthorization = function(s)
{
    try {
        if (typeof s !== 'string')
            return;
        //get authorization type (basic)
        var re = /\s?(Basic)\s+(.*)\s?/ig;
        var match = re.exec(s.replace(/^\s+/g,''));
        if (match) {
            //get authorization token
            var token = match[2];
            //decode token
            var buffer = new Buffer(token, 'base64');
            //get args e.g. username:password
            var matched = /(.*):(.*)/ig.exec(buffer.toString());
            if (matched) {
                return { userName:matched[1], userPassword:matched[2] };
            }
        }
    }
    catch(err) {
        TraceUtils.log(err);
    }
};

BasicAuthHandler.USERNAME_REGEXP = /^[a-zA-Z0-9.@_-]{1,255}$/;

BasicAuthHandler.prototype.authenticateRequest = function (context, callback) {
    callback = callback || function() {};
    try {
        if (context.request && context.request.headers && context.request.headers.hasOwnProperty('authorization')) {
            /**
             * @type {{userName: string, userPassword: string}|*}
             */
            var authorizationArgs = BasicAuthHandler.parseBasicAuthorization(context.request.headers['authorization']);
            if (_.isNil(authorizationArgs)) {
                return callback();
            }
            let authStrategy = context.getApplication().getAuthStrategy();
            return authStrategy.login(context, authorizationArgs.userName, authorizationArgs.userPassword).then(function() {
                return callback();
            }).catch(function(err) {
                return callback(err);
            });
        }
        return callback();
    }
    catch(err) {
        return callback(err);
    }
};

/**
 * Creates a new instance of BasicAuthHandler class
 * @returns {BasicAuthHandler}
 */
BasicAuthHandler.createInstance = function() {
    return new BasicAuthHandler();
};

if (typeof exports !== 'undefined') {
    module.exports.BasicAuthHandler = BasicAuthHandler;
    module.exports.createInstance = BasicAuthHandler.createInstance;
}

