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
import {_} from 'lodash';
import url from 'url';
import path from 'path';
import {HttpViewContext} from './mvc';
import {Args,TraceUtils} from '@themost/common/utils';
import {HttpBadRequestError} from '@themost/common/errors';
import {LocalizationStrategy} from './localization';

function parseCookies(request) {
    let list = {};
    if (request && request.headers && request.headers.cookie) {
        let rc = request.headers.cookie;
        if (!_.isEmpty(rc)) {
            _.forEach(rc.split(';'), (cookie) => {
                let parts = cookie.split('=');
                list[parts.shift().trim()] = unescape(parts.join('='));
            });
        }
    }
    return list;
}

const cultureProperty = Symbol('culture');
const applicationProperty = Symbol('application');

/**
 * @class
 * @property {*} params
 * @property {ClientRequest} request - Gets or sets the HTTP request of the current context
 * @property {ServerResponse} response - Gets or sets the HTTP response of the current context
 * @augments HttpContext
 */
export class HttpContext {
    /**
     *
     * @constructor
     * @param {HttpApplication2} app
     * @param {ClientRequest} request
     * @param {ServerResponse} response
     */
    constructor(app, request, response) {
        this[applicationProperty] = app;
        /**
         * Gets or sets the HTTP request of the current context
         * @type {ClientRequest}
         */
        this.request = request;
        /**
         * Gets or sets the HTTP response of the current context
         * @type {ServerResponse}
         */
        this.response = response;
    }

    getApplication() {
        return this[applicationProperty];
    }

    /**
     * Gets the MIME extension of the current HTTP request
     * @returns {*}
     */
    getFormat() {
        let uri = url.parse(this.request.url);
        let result = path.extname(uri.pathname);
        if (result) {
            return result.substr(1).toLowerCase();
        }
        else {
            //get mime type
            let mime = self.mime;
            if (mime) {
                //and return the extension associated with this mime
                return mime.extension.substr(1).toLowerCase();
            }
        }
    }

    /**
     * Creates a new instance of HttpViewContext class based on this HttpContext instance.
     * @returns {HttpViewContext}
     */
    createViewContext() {
        return new HttpViewContext(this);
    }

    /**
     * Gets an HTTP request cookie with the specified name
     * @param {string} name
     * @returns {*}
     */
    getCookie(name) {
        Args.notNull(this.request,"HTTP Request");
        const cookies = parseCookies(this.request);
        if (_.isNil(cookies)) { return; }
        return cookies[name];
    }

    /**
     * Sets a cookie with the specified name and value. If the value is missing or is null the cookie will be removed.
     * @param {string} name
     * @param {*=} value
     * @param {Date=} expires
     * @param {string=} domain
     * @param {string=} cookiePath
     */
    setCookie(name, value, expires, domain, cookiePath) {
        Args.notEmpty(name,'Name');
        Args.notNull(this.response,'HTTP Response');
        let cookieValue;
        if (!_.isNil(value)) {
            cookieValue = `{name}={value.toString()}`;
            if (expires instanceof Date)
                cookieValue += `;expires={expires.toUTCString()}`;
        }
        else {
            cookieValue = `{name}=;expires={new Date('1970-01-01').toUTCString()}`;
        }
        //set default cookie path to root
        cookiePath = cookiePath || '/';
        //set cookie domain
        if (_.isString(domain))
            cookieValue += `;domain={domain}`;
        //set cookie path
        if (_.isString(cookiePath))
            cookieValue += `;path={cookiePath}`;
        //set cookie
        this.response.setHeader('Set-Cookie',cookieValue);
    }

    /**
     * Set a permanent cookie for user preferred language
     * @param lang - A string which represents the user preferred language e.g. en-US, en-GB etc
     */
    setLangCookie(lang) {
        this.setCookie(".LANG", lang);
    }

    /**
     * Checks whether the HTTP method of the current request is equal or not to the given parameter.
     * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, OPTIONS, HEAD)
     * */
    is(method) {
        Args.notNull(this.request,'HTTP Request');
        if (_.isNil(method)) { return false; }
        Args.notString(this.request,'HTTP Method');
        return (this.request.method.toUpperCase() == method.toUpperCase());
    }
    /**
     * Gets the current culture
     */
    getCulture() {
        if (this[cultureProperty])
            return this[cultureProperty];
        /**
         * @type {LocalizationStrategy}
         */
        const localizationStrategy = this.getApplication().getService(LocalizationStrategy);
        if (_.isNil(localizationStrategy)) {
            return 'en-us';
        }
        let lang = localizationStrategy.getDefaultCulture();
        //1. Check HTTP cookie .LANG value
        if (typeof this.getCookie(".LANG") === "string") {
            lang = this.getCookie(".LANG");
        }
        //2. Check [lang] HTTP request param
        else if (this.params && this.params.lang) {
            lang = this.params.lang;
        }
        //2. Check request HTTP header [accept-language]
        else if (this.request && this.request.headers && this.request.headers['accept-language']) {
            const langs = this.request.headers['accept-language'].split(';');
            if (langs.length>0) {
                lang = langs[0].split(',')[0] || localizationStrategy.getDefaultCulture();
            }
        }
        if (lang) {
            //search application cultures
            const obj = _.find(localizationStrategy.getCultures(), function(x) {
                return (x == lang.toLowerCase()) || (x.substr(0,2) == lang.toLowerCase().substr(0,2));
            });
            //if user culture is valid for this application
            if (obj) {
                //set context culture
                this[cultureProperty]=obj;
                return this[cultureProperty];
            }
        }
        //otherwise use default culture
        this[cultureProperty] = localizationStrategy.getDefaultCulture();
        return this[cultureProperty];
    }

    /**
     * Sets the current culture
     * @param value
     */
    setCulture(value) {
        Args.notEmpty(value,'culture');
        this[cultureProperty] = value;
    }

    /**
     * Performs cross-site request forgery validation against the specified token
     * @param {string=} csrfToken
     */
    validateAntiForgeryToken(csrfToken) {
        const self = this;
        if (typeof csrfToken === 'undefined') {
            //try to get token from params
            if (typeof self.params !== 'undefined')
                csrfToken = self.params['_CSRFToken'];
        }
        if (typeof csrfToken !== 'string')
            throw new HttpBadRequestError('Bad request. Invalid cross-site request forgery token.');
        if (csrfToken.length==0)
            throw new HttpBadRequestError('Bad request. Empty cross-site request forgery token.');
            const cookies = self.cookies;
            let csrfCookieToken;
            let csrfRequestToken;
            if (cookies['.CSRF']) {
                //try to decrypt cookie token
                try {
                    csrfCookieToken = JSON.parse(self.getApplication().decrypt(cookies['.CSRF']));
                }
                catch(e) {
                    throw new HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
                }
                //then try to decrypt the token provided
                try {
                    csrfRequestToken = JSON.parse(self.application.decrypt(csrfToken));
                }
                catch(e) {
                    throw new HttpBadRequestError('Bad request.Invalid cross-site request forgery data.');
                }
                if ((typeof csrfCookieToken === 'object') && (typeof csrfRequestToken === 'object')) {

                    let valid = true, tokenExpiration = 60;
                    //1. validate token equality
                    for(const key in csrfCookieToken) {
                        if (csrfCookieToken.hasOwnProperty(key)) {
                            if (csrfCookieToken[key]!==csrfRequestToken[key]) {
                                valid = false;
                                break;
                            }
                        }
                    }
                    if (valid==true) {
                        //2. validate timestamp
                        const timestamp = new Date(csrfCookieToken.date);
                        const diff = Math.abs((new Date())-timestamp);
                        if (diff<0) {
                            valid=false;
                        }
                        if (valid) {
                            if (self.application.config.settings)
                                if (self.application.config.settings.auth)
                                    if (self.application.config.settings.auth['csrfExpiration'])
                                        tokenExpiration = parseInt(self.application.config.settings.auth['csrfExpiration']);
                            if (diff>tokenExpiration*60*1000)
                                valid=false;
                        }
                    }
                    if (valid)
                        return;

                }
                throw new HttpBadRequestError('Bad request. A cross-site request forgery was detected.');
            }
            else {
                throw new HttpBadRequestError('Bad request.Missing cross-site request forgery data.');
            }
    }

    /**
     * Translates the given string to the language specified in this context
     * @param {string} text - The string to translate
     * @param {string=} lib - A string that represents the library which contains the source string. This arguments is optional. If this argument is missing, then the operation will use the default (global) library.
     * @returns {*}
     */
    getLocaleString(text, lib) {
        /**
         * @type {LocalizationStrategy}
         */
        const localizationStrategy = this.getApplication().getService(LocalizationStrategy);
        if (_.isNil(localizationStrategy)) {
            TraceUtils.warn('The current application does not have a valid localization strategy. Define one in order to properly use localization methods.');
            return text;
        }
        localizationStrategy.getLocaleString(this.getCulture(),text,lib);
    }

    /**
     * Executes the specified code in unattended mode.
     * @param {Function} fn
     * @param {Function} callback
     */
    unattended(fn, callback) {
        const self = this;
        let interactiveUser;
        callback = callback || function() {};
        fn = fn || function() {};
        if (self._unattended) {
            try {
                fn.call(self, function(err, result) {
                    callback(err, result);
                });
            }
            catch(e) {
                callback(e);
            }
            return;
        }
        //get unattended execution account
        const config = self.getApplication().getConfiguration();
        config.settings.auth = config.settings.auth || {};
        const account = config.settings.auth.unattendedExecutionAccount;
        //get interactive user
        if (this.user) {
            interactiveUser = { name:this.user.name,authenticationType: this.user.authenticationType };
            //setting interactive user
            self.interactiveUser = interactiveUser;
        }
        if (account) {
            self.user = { name:account, authenticationType:'Basic' };
        }
        try {
            self._unattended = true;
            fn.call(self, function(err, result) {
                //restore user
                if (interactiveUser) {
                    self.user = _.assign({ }, interactiveUser);
                }
                delete self.interactiveUser;
                delete self._unattended;
                callback(err, result);
            });
        }
        catch(e) {
            //restore user
            if (interactiveUser) {
                self.user = _.assign({ }, interactiveUser);
            }
            delete self.interactiveUser;
            delete self._unattended;
            callback(e);
        }
    }

}