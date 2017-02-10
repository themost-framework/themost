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

import domino from 'domino';

/**
 * @class
 * @property {*} directives
 * @property {*} controllers
 * @property {*} filters
 * @property {*} services
 * @private
 */
class AngularServerModule {
    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    service(name, ctor) { }

    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    directive(name, ctor) { }

    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    filter(name, ctor) { }

    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    controller(name, ctor) { }
}

const ng = {
    /**
     * @function
     */
    angular: null,
    /**
     * @function
     */
    jQuery: null,
    /**
     * @param {string=} s
     * @returns {HTMLDocument}
     */
    createDocument: function(s) {
        s = s || '<html/>';
        const window = domino.createWindow(s);
        window.setTimeout = setTimeout;
        window.clearTimeout = clearTimeout;
        //define parent window property
        Object.defineProperty(window.document, 'parentWindow', { get: function(){
            return window;
        }, configurable:false, enumerable:false });
        window.location.href = "/";
        if (typeof global.jQuery !== 'function')
            throw new Error('jQuery object cannot be instantiated due to missing constructor.');
        global.jQuery(window);
        //extend jQuery
        const ext = require('./../jquery/server_extensions');
        ext.extend(window.jQuery);
        if (typeof global.angular !== 'function')
            throw new Error('Angular JS object cannot be instantiated due to missing constructor.');
        //initialize angular
        global.angular(window, window.document);
        /**
         * @param {string|*} s
         * @returns {HTMLElement|*}
         */
        window.document.element = function(s) {
            return this.parentWindow.$(s);
        };
        return window.document;
    },
    /**
     * @param {*} app
     */
    init: function (app) {
        if (typeof app.module === 'undefined' || app.module===null) {

            /**
             * @function
             * @memberof HttpApplication
             * @param {string=} s
             * @returns {HTMLDocument}
             */
            app.document = ng.createDocument;
            /**
             * @type {{directive: directive, directives: {}, service: service, services: {}, filter: filter, filters: {}, controller: controller, controllers: {}}}
             * @memberOf HttpApplication
             */
            app.module = {
                /**
                 * @param {string} name
                 * @param {function=} ctor
                 * @returns {*}
                 */
                directive: function(name, ctor) {
                    if (typeof ctor === 'undefined')
                        return this.directives[name];
                    this.directives[name] = ctor;
                    return this;
                },
                directives: {},
                /**
                 * @param {string} name
                 * @param {function=} ctor
                 * @returns {*}
                 */
                service: function(name, ctor) {
                    if (typeof ctor === 'undefined')
                        return this.services[name];
                    this.services[name] = ctor;
                    return this;
                },
                services: {},
                /**
                 * @param {string} name
                 * @param {function=} ctor
                 * @returns {*}
                 */
                filter: function(name, ctor) {
                    if (typeof ctor === 'undefined')
                        return this.filters[name];
                    this.filters[name] = ctor;
                    return this;
                },
                filters:{},
                /**
                 * @param {string} name
                 * @param {function=} ctor
                 * @returns {*}
                 */
                controller: function(name, ctor) {
                    if (typeof ctor === 'undefined')
                        return this.controllers[name];
                    this.controllers[name] = ctor;
                    return this;
                },
                controllers:{}
            }
        }
    }
};

if (typeof ng.angular === 'undefined' || ng.angular=== null) {
    global.window = domino.createWindow('<html />');
    global.window.location.href = "/";
    global.document = global.window.document;
    global.navigator = { appCodeName:"Mozilla",
        appVersion:"AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36",
        cookieEnabled: false,
        hardwareConcurrency:4,
        language:"en-US",
        platform:"Win32",
        product:"Gecko",
        userAgent:"Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"
    };
    //call jQuery initialization
    require('./../jquery/jquery');
    //call angular initialization
    require('./angular');
    //delete dummy property
    delete global.window;
    delete global.document;
    //set methods
    ng.angular = global.angular;
    ng.jQuery = global.jQuery;
}
module.exports = ng;
