/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-09-06
 */
/**
 * @ignore
 */
var web = require('./index');
/**
 * @class AuthHandler
 * @constructor
 */
function AuthHandler() {
    //
}
/**
  * @param {IncomingMessage|ClientRequest} request
 * @returns {*}
 */
AuthHandler.parseCookies = function(request) {
    var list = {},
        rc = request.headers.cookie;
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });
    return list;
};

AuthHandler.ANONYMOUS_IDENTITY = { name: 'anonymous', authenticationType:'None' };

/**
 * Authenticates an HTTP request and sets user or anonymous identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
AuthHandler.prototype.authenticateRequest = function (context, callback) {
    try {
        callback = callback || function() {};
        var cookies = {}, model = context.model('User');
        var settings = web.current.config.settings ? (web.current.config.settings.auth || { }) : { } ;
        settings.name = settings.name || '.MAUTH';
        if (context && context.request)
            cookies = AuthHandler.parseCookies(context.request);
        if (cookies[settings.name]) {
            var str = null;
            try {
                str = web.current.decrypt(cookies[settings.name]);
            }
            catch (e) {
                //log error (on bad cookie)
                console.log(e);
            }
            //and continue
            var userName = null;
            if (str) {
                var authCookie = JSON.parse(str);
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
                //todo::validate that user exists
                //set user identity
                context.user = model.convert({ name: userName, authenticationType:'Basic' });
                callback(null);
            }
            else {
                //an auth cookie was found but user data or user model does not exist
                //set anonymous identity
                context.user = model.convert(AuthHandler.ANONYMOUS_IDENTITY);
                callback(null);
            }
        }
        else {
            //set anonymous identity
            if (model)
                context.user = model.convert(AuthHandler.ANONYMOUS_IDENTITY);
            else
                context.user = AuthHandler.ANONYMOUS_IDENTITY;
            //no auth cookie was found on request
            callback(null);
        }
    }
    catch (e) {
        callback(e);
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