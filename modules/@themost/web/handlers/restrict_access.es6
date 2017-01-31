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
import {HttpUnauthorizedError,HttpBadRequestError} from '@themost/common/errors';
import {TraceUtils} from '@themost/common/utils';
import {_} from 'lodash';
import url from 'url';

/**
 * @class
 * @property {string} description - Gets or sets a string that represents the description of this object
 * @property {*} path - Gets or sets a string that represents the target path associated with access settings.
 * @property {string} allow - Gets or sets a comma delimited string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
 * @property {string} deny - Gets or sets a string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
 */
class LocationSetting {
    constructor() {
        //
    }
}

/**
 * @class
 * @augments HttpHandler
 */
export default class RestrictHandler {
    /**
     * Authenticates an HTTP request and sets user or anonymous identity.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    authorizeRequest(context, callback) {
        try {
            if (context.is('OPTIONS')) { return callback(); }
            if (context.user.name=='anonymous')
            {
                RestrictHandler.prototype.isRestricted(context, function(err, result) {
                    if (err) {
                        TraceUtils.log(err);
                        callback(new HttpUnauthorizedError('Access denied'));
                    }
                    else if (result) {
                        const er = new HttpUnauthorizedError();
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
    }

    isNotRestricted(context, callback) {
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
            const loginPage = context.application.config.settings.auth.loginPage || '/login.html', requestUrl = url.parse(context.request.url), locations = context.application.config.settings.auth.locations || [];
            if (requestUrl.pathname===loginPage) {
                return callback(null, true);
            }
            for (let i = 0; i < locations.length; i++) {
                /**
                 * @type {*|LocationSetting}
                 */
                const location = locations[i];
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
            TraceUtils.log(e);
            return callback(null, false);
        }

    }

    isRestricted(context, callback) {
        RestrictHandler.prototype.isNotRestricted(context, function(err, result) {
            if (err) { return callback(err); }
            callback(null, !result);
        });
    }

}