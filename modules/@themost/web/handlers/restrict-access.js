/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2015-03-12.
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 Anthi Oikonomou anthioikonomou@gmail.com
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of MOST Web Framework nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * Created by Kyriakos on 25/9/2014.
 */
var common = require('@themost/common'),
    _ = require('lodash'),
    url = require('url');
/**
 * @class LocationSetting
 * @constructor
 */
function LocationSetting() {
    /**
     * Gets or sets a string that represents the description of this object
     * @type {string}
     */
    this.description = null;
    /**
     * Gets or sets a string that represents the target path associated with access settings.
     * @type {*}
     */
    this.path = null;
    /**
     * Gets or sets a comma delimited string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
     * @type {*}
     */
    this.allow = null;
    /**
     * Gets or sets a string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
     * @type {*}
     */
    this.deny = null;
}
/**
 * @class RestrictHandler
 * @constructor
 * @augments HttpHandler
 */
function RestrictHandler() {
    //
}
/**
 * Authenticates an HTTP request and sets user or anonymous identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
RestrictHandler.prototype.authorizeRequest = function (context, callback) {
    try {
        if (context.is('OPTIONS')) { return callback(); }
        if (context.user.name=='anonymous')
        {
            RestrictHandler.prototype.isRestricted(context, function(err, result) {
                if (err) {
                    common.log(err);
                    callback(new common.HttpUnauthorizedException('Access denied'));
                }
                else if (result) {
                    var er = new common.HttpUnauthorizedException();
                    context.application.errors.unauthorized(context,er,function(err) {
                        if (err) {
                            return callback(err);
                        }
                        context.response.end();
                        return callback(er);
                    });
                }
                else {
                    callback();
                }
            });
        }
        else {
            callback();
        }
    }
    catch (e) {
        callback(e);
    }
};

RestrictHandler.prototype.isNotRestricted = function(context, callback) {
    try {
        if (_.isNil(context)) {
            return callback(new common.HttpBadRequest());
        }
        if (_.isNil(context.request)) {
            return callback(new common.HttpBadRequest());
        }
        //ensure settings (and auth settings)
        context.application.config.settings = context.application.config.settings || {};
        /**
         * @type {{loginPage:string=,locations:Array}|*}
         */
        context.application.config.settings.auth = context.application.config.settings.auth || {};
        //get login page, request url and locations
        var loginPage = context.application.config.settings.auth.loginPage || '/login.html',
            requestUrl = url.parse(context.request.url),
            locations = context.application.config.settings.auth.locations || [];
        if (requestUrl.pathname===loginPage) {
            return callback(null, true);
        }
        for (var i = 0; i < locations.length; i++) {
            /**
             * @type {*|LocationSetting}
             */
            var location = locations[i];
            if (/\*$/.test(location.path)) {
                //wildcard search /something/*
                if ((requestUrl.pathname.indexOf(location.path.replace(/\*$/,''))==0) && (location.allow=='*')) {
                    return callback(null, true);
                }
            }
            else {
                if ((requestUrl.pathname===location.path) && (location.allow=='*')) {
                    return callback(null, true);
                }
            }
        }
        return callback(null, false);
    }
    catch(e) {
        common.log(e);
        return callback(null, false);
    }

};

RestrictHandler.prototype.isRestricted = function(context, callback) {
    RestrictHandler.prototype.isNotRestricted(context, function(err, result) {
        if (err) { return callback(err); }
        callback(null, !result);
    });
};

/**
 * Creates a new instance of AuthHandler class
 * @returns {RestrictHandler}
 */
RestrictHandler.createInstance = function() {
    return new RestrictHandler();
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = RestrictHandler.createInstance;
    /**
     * @constructs {RestrictHandler}
     */
    module.exports.RestrictHandler = RestrictHandler;
}