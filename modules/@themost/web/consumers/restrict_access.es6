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
import 'source-map-support/register';
import {HttpUnauthorizedError,HttpBadRequestError} from '@themost/common/errors';
import {TraceUtils} from '@themost/common/utils';
import {HttpApplicationService} from '../interfaces';
import {HttpNextResult} from '../results';
import {HttpConsumer} from '../consumers';
import {_} from 'lodash';
import Q from 'q';
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

const applicationProperty = Symbol('application');


/**
 * @class
 */
export class RestrictAccessService extends HttpApplicationService{
    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
       super(app);
    }

    /**
     * @param {string} requestURL
     * @returns {Promise}
     */
    isNotRestricted(requestURL) {
       try {
           if (_.isNil(requestURL)) {
               return Q(true);
           }
           const uri = url.parse(requestURL);
           const conf = this.getApplication().getConfiguration();
           if (_.isObject(conf.settings)
               && _.isObject(conf.settings.auth)
               && _.isArray(conf.settings.auth.locations)) {
               /**
                * @type {Array}
                */
               const locations = conf.settings.auth.locations;
               for (let i = 0; i < locations.length; i++) {
                   /**
                    * @type {*|LocationSetting}
                    */
                   const location = locations[i];
                   if (/\*$/.test(location.path)) {
                       //wildcard search /something/*
                       if ((uri.pathname.indexOf(location.path.replace(/\*$/,''))===0) && (location.allow==='*')) {
                           return Q(true);
                       }
                   }
                   else {
                       if ((uri.pathname===location.path) && (location.allow==='*')) {
                           return Q(true);
                       }
                   }
               }
               return Q(false);
           }
           return Q(true);
       }
       catch(err) {
           return Q.reject(err);
       }
    }
    /**
     * @param {string} requestURL
     * @returns {Promise}
     */
    isRestricted(requestURL) {
        return this.isNotRestricted(requestURL).then((res)=> {
           return Q(!res);
        });
    }
}

/**
 * @class
 * @augments HttpHandler
 */
class RestrictHandler {
    /**
     * Authenticates an HTTP request and sets user or anonymous identity.
     * @param {HttpContext} context
     * @param {Function} callback
     */
    authorizeRequest(context, callback) {
        try {
            if (context.is('OPTIONS')) { return callback(); }
            if (context.user.name==='anonymous')
            {
                /**
                 * @type RestrictAccessService;
                 */
                const svc = context.getApplication().getService(RestrictAccessService);
                if (_.isNil(svc)) {
                    return callback();
                }
                svc.isRestricted(context.request.url).then((res)=> {
                    if (res) {
                        return callback(new HttpUnauthorizedError());
                    }
                    return callback();
                }).catch((err)=> {
                    TraceUtils.log(err);
                    return callback(new HttpUnauthorizedError());
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
}

export class RestrictAccessConsumer extends HttpConsumer {
    constructor() {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new RestrictHandler();
                return Q.nfbind(handler.authorizeRequest)(context)
                    .then(()=> {
                        return HttpNextResult.create().toPromise();
                    });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}