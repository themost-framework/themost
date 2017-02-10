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

/**
 * @classdesc ApplicationOptions class describes the startup options of a MOST Web Framework application.
 * @class
 * @property {number} port - The HTTP binding port number.
 * The default value is either PORT environment variable or 3000.
 * @property {string} bind - The HTTP binding ip address or hostname.
 * The default value is either IP environment variable or 127.0.0.1.
 * @property {number|string} cluster - A number which represents the number of clustered applications.
 * The default value is zero (no clustering). If cluster is 'auto' then the number of clustered applications
 * depends on hardware capabilities (number of CPUs).
 @example
 import {HttpApplication} from '@themost/web/app';
 var app = new HttpApplication();
 app.start({ port:80, bind:"0.0.0.0",cluster:'auto' });
 @example
 //Environment variables already set: IP=198.51.100.0 PORT=80
 import {HttpApplication} from '@themost/web/app';
 var app = new HttpApplication();
 app.start();
 */
export class HttpApplicationOptions {
    constructor() {
        if (process.NODE_ENV === 'development')
        this.port = 80;
        this.bind = '0.0.0.0';
        this.cluster = 0;
    }
}


/**
 * @classdesc Represents HttpApplication configuration
 * @class
 */
export class HttpApplicationConfig {
    constructor() {
        /**
         * Gets an array of data adapters.
         * @type {Array}
         */
        this.adapters = [];
        /**
         * Gets an array of HTTP view engines configuration
         * @type {Array}
         */
        this.engines = [];
        /**
         *  Gets an array of all registered MIME types
         * @type {Array}
         */
        this.mimes = [];
        /**
         * Gets an array of all registered HTTP handlers.
         * @type {Array}
         */
        this.handlers = [];
        /**
         * Gets an array of all registered HTTP routes.
         * @type {Array}
         */
        this.routes = [];
        /**
         * Gets or sets a collection of data adapter types that are going to be use in data operation
         * @type {Array}
         */
        this.adapterTypes = null;
        /**
         * Gets or sets a collection of data types that are going to be use in data operation
         * @type {Array}
         */
        this.dataTypes = null;
        /**
         * Gets or sets an object that holds application settings
         * @type {Array}
         */
        this.settings = { };
        /**
         * Gets or sets an object that holds application locales
         * @type {*}
         */
        this.locales = { };
    }
}


