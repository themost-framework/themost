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
import util from 'util';
import http from 'http';
import path from 'path';
import fs from 'fs';
import url from 'url';
import async from 'async';
import querystring from 'querystring';
import crypto from 'crypto';
import {SequentialEventEmitter} from '@themost/common/emitter';
import {TraceUtils,RandomUtils,LangUtils} from '@themost/common/utils';
import {HttpError,HttpServerError,HttpNotFoundError} from '@themost/common/errors';
import {HttpContext} from './context';
import da from 'most-data';


const HTTP_SERVER_DEFAULT_BIND = '127.0.0.1';
const HTTP_SERVER_DEFAULT_PORT = 3000;


/**
 * @class
 * @classdesc Abstract class that represents a data context
 * @abstract
 */
export class HttpDataContext {
    /**
     * @returns {AbstractAdapter}
     */
    db() {
        return null;
    }

    /**
     * @param {string} name
     * @returns {DataModel}
     */
    model(name) {
        return null;
    }

    /**
     * @param {string} type
     * @returns {*}
     */
    dataTypes(type) {
        return null;
    }
}



/**
 * @class
 * @property {string} executionPath - Gets or sets a string which represents the current execution path
 * @property {string} configPath - Gets or sets a string which represents the current configuration path
 * @augments EventEmitter
 */
export class HttpApplication1 extends SequentialEventEmitter {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.executionPath = path.join(process.cwd(), 'app');
        /**
         * Gets the current application configuration path
         * @type {*}
         */
        this.configPath = path.join(process.cwd(), 'app');
        /**
         * Gets or sets application configuration settings
         * @type {ApplicationConfig}
         */
        this.config = null;
        /**
         * Gets or sets a collection of application handlers
         * @type {Array}
         */
        this.handlers = [];

        //initialize angular server module
        const ng = require('./angular/server_module');
        /**
         * @type {AngularServerModule}
         */
        this.module = null;
        //init module
        ng.init(this);
        //register auth service
        const self = this;
        self.module.service('$auth', function($context) {
            try {
                //ensure settings
                self.config.settings.auth = self.config.settings.auth || { };
                let providerPath = self.config.settings.auth.provider || './services/auth';
                //get auth provider
                if (providerPath.indexOf('/')==0)
                    providerPath = self.mapPath(providerPath);
                const svc = require(providerPath);
                if (typeof svc.createInstance !== 'function')
                    throw new Error('Invalid authentication provider module.');
                return svc.createInstance($context);
            }
            catch (e) {
                throw e;
            }
        });
        /**
         *
         * @type {{html, text, json, unauthorized}|*}
         */
        this.errors = httpApplicationErrors(this);

    }

    /**
     * @param request {String|IncomingMessage}
     * */
    resolveMime(request) {
        if (typeof request=== 'string') {
            //get file extension
            var extensionName = path.extname(request);
            var arr = this.config.mimes.filter(function(x) {
                return (x.extension == extensionName);
            });
            if (arr.length>0)
                return arr[0];
            return null;
        }
        else if (typeof request=== 'object') {
            //get file extension
            var extensionName = path.extname(request.url);
            var arr = this.config.mimes.filter(function(x) {
                return (x.extension == extensionName);
            });
            if (arr.length>0)
                return arr[0];
            return null;
        }
    }


    /**
     * Gets the default data context based on the current configuration
     * @returns {AbstractAdapter}
     */
    db() {
        if ((this.config.adapters == null) || (this.config.adapters.length == 0))
            throw new Error('Data adapters configuration settings are missing or cannot be accessed.');
        let adapter = null;
        if (this.config.adapters.length == 1) {
            //there is only one adapter so try to instantiate it
            adapter = this.config.adapters[0];
        }
        else {
            adapter = _.find(this.config.adapters, function (x) {
                return x.default;
            });
        }
        if (_.isEmpty(adapter))
            throw new Error('There is no default data adapter or the configuration is incorrect.');
        //try to instantiate adapter
        if (!adapter.invariantName)
            throw new Error('The default data adapter has no invariant name.');
        const adapterType = this.config.adapterTypes[adapter.invariantName];
        if (adapterType == null)
            throw new Error('The default data adapter type cannot be found.');
        if (typeof adapterType.createInstance === 'function') {
            return adapterType.createInstance(adapter.options);
        }
        else if (adapterType.require) {
            const m = require(adapterType.require);
            if (typeof m.createInstance === 'function') {
                return m.createInstance(adapter.options);
            }
            throw new Error('The default data adapter cannot be instantiated. The module provided does not export a function called createInstance().')
        }
    }




    /**
     *
     * @param {*|string} options
     * @param {Function} callback
     */
    executeRequest(options, callback) {
        const opts = { };
        if (typeof options === 'string') {
            util._extend(opts, { url:options });
        }
        else {
            util._extend(opts, options);
        }
        const request = createRequestInternal.call(this,opts), response = createResponseInternal.call(this,request);
        if (!opts.url) {
            callback(new Error('Internal request url cannot be empty at this context.'));
            return;
        }
        if (opts.url.indexOf('/')!=0)
        {
            const uri = url.parse(opts.url);
            opts.host = uri.host;
            opts.hostname = uri.hostname;
            opts.path = uri.path;
            opts.port = uri.port;
            //execute external request
            this.executeExternalRequest(opts,null, callback);
        }
        else {
            //todo::set cookie header (for internal requests)
            /*
             IMPORTANT: set response Content-Length to -1 in order to force the default HTTP response format.
             if the content length is unknown (server response does not have this header)
             in earlier version of node.js <0.11.9 the response contains by default a hexademical number that
             represents the content length. This number appears exactly after response headers and before response body.
             If the content length is defined the operation omits this hexademical value
             e.g. the wrong or custom formatted response
             HTTP 1.1 Status OK
             Content-Type: text/html
             ...
             Connection: keep-alive

             6b8

             <html><body>
             ...
             </body></html>
             e.g. the standard format
             HTTP 1.1 Status OK
             Content-Type: text/html
             ...
             Connection: keep-alive


             <html><body>
             ...
             </body></html>
             */
            response.setHeader('Content-Length',-1);
            handleRequestInternal.call(this, request, response, function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    try {
                        //get statusCode
                        const statusCode = response.statusCode;
                        //get headers
                        const headers = {};
                        if (response._header) {
                            const arr = response._header.split('\r\n');
                            for (let i = 0; i < arr.length; i++) {
                                const header = arr[i];
                                if (header) {
                                    const k = header.indexOf(':');
                                    if (k>0) {
                                        headers[header.substr(0,k)] = header.substr(k+1);
                                    }
                                }
                            }
                        }
                        //get body
                        let body = null;
                        let encoding = null;
                        if (util.isArray(response.output)) {
                            if (response.output.length>0) {
                                body = response.output[0].substr(response._header.length);
                                encoding = response.outputEncodings[0];
                            }
                        }
                        //build result (something like ServerResponse)
                        const result = {
                            statusCode: statusCode,
                            headers: headers,
                            body:body,
                            encoding:encoding
                        };
                        callback(null, result);
                    }
                    catch (e) {
                        callback(e);
                    }
                }
            });
        }
    }


}
