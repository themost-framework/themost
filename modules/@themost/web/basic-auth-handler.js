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
var web = require('./index');
/**
 * @class BasicAuthHandler
 * @constructor
 * @augments HttpHandler
 */
function BasicAuthHandler() {
    //
}

/**
 * @param {string} s
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
    catch(e) {
        util.log(e);
    }
};

BasicAuthHandler.USERNAME_REGEXP = /^[a-zA-Z0-9\.\@_-]{1,255}$/;

BasicAuthHandler.prototype.authenticateRequest = function (context, callback) {
    callback = callback || function() {};
    try {
        /**
         * @type {{userName: string, userPassword: string}|*}
         */
        var authorizationArgs = BasicAuthHandler.parseBasicAuthorization(context.request.headers['authorization']);
        if (typeof authorizationArgs !== 'undefined') {
            //ensure settings
            context.application.config.settings.auth = context.application.config.settings.auth || { };
            var providerPath = context.application.config.settings.auth.provider || './auth-service';
            //get auth provider
            var svc;
            if (/^\//.test(providerPath)) {
                svc = require(context.application.mapPath(providerPath));
            }
            else {
                svc = require(providerPath);
            }
            if (typeof svc.createInstance === 'function') {
                //create provider instance
                var provider = svc.createInstance(context);
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
};

/**
 * Creates a new instance of BasicAuthHandler class
 * @returns {BasicAuthHandler}
 */
BasicAuthHandler.createInstance = function() {
    return new BasicAuthHandler();
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = BasicAuthHandler.createInstance;
}

