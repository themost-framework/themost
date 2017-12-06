/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var _ = require('lodash');
var TraceUtils = require('@themost/common/utils').TraceUtils;
var HttpUnauthorizedError = require('@themost/common/errors').HttpUnauthorizedError;
var HttpBadRequestError = require('@themost/common/errors').HttpBadRequestError;
var url = require('url');
/**
 * @class
 * @constructor
 */
// eslint-disable-next-line no-unused-vars
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
 * @class
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
        if (context.user.name === 'anonymous')
        {
            RestrictHandler.prototype.isRestricted(context, function(err, result) {
                if (err) {
                    TraceUtils.error(err);
                    callback(new HttpUnauthorizedError('Access denied'));
                }
                else if (result) {
                    var er = new HttpUnauthorizedError();
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
            return callback(new HttpBadRequestError());
        }
        if (_.isNil(context.request)) {
            return callback(new HttpBadRequestError());
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
                if ((requestUrl.pathname.indexOf(location.path.replace(/\*$/,'')) === 0) && (location.allow === '*')) {
                    return callback(null, true);
                }
            }
            else {
                if ((requestUrl.pathname===location.path) && (location.allow === '*')) {
                    return callback(null, true);
                }
            }
        }
        return callback(null, false);
    }
    catch(err) {
        TraceUtils.error(err);
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