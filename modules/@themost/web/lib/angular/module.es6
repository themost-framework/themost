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
import {HttpApplicationService} from "../interfaces";
import {AngularServerModuleDefaults} from './directives';
/**
 * Represents Angular JS Server module
 * @class
 * @property {*} directives
 * @property {*} controllers
 * @property {*} filters
 * @property {angular} angular
 * @property {jQuery} jQuery
 */
export class AngularServerModule extends HttpApplicationService {

    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
        super(app);
        this.directives = { };
        this.filters = { };
        this.controllers = { };
        this.services = { };
        this.angular = ng.angular;
        this.jQuery = ng.jQuery;
        AngularServerModuleDefaults.applyDirectives(this);
    }

    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    service(name, ctor) {
        if (typeof ctor === 'undefined')
            return this.services[name];
        this.services[name] = ctor;
        return this;
    }

    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    directive(name, ctor) {
        if (typeof ctor === 'undefined')
            return this.directives[name];
        this.directives[name] = ctor;
        return this;
    }

    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    filter(name, ctor) {
        if (typeof ctor === 'undefined')
            return this.filters[name];
        this.filters[name] = ctor;
        return this;
    }

    /**
     * @param {string} name
     * @param {function|Array|*=} ctor
     * @returns AngularServerModule|function
     */
    controller(name, ctor) {
        if (typeof ctor === 'undefined')
            return this.controllers[name];
        this.controllers[name] = ctor;
        return this;
    }

    /**
     * Create an HTML document
     * @param {string} s A string which represents the HTML markup of the document
     * @returns {HTMLDocument}
     */
    createDocument(s) {
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
    }

}

const ng = { };

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

/**
 * @class
 * @param {HttpContext|*} $context
 * @param {*} $qs
 * @returns {$http}
 * @constructor
 * @private
 */
function HttpInternalProvider($context, $qs) {

    function $http(requestConfig) {
        const config = {
            method: 'get',
            cookie: $context.request.headers.cookie
        };
        angular.extend(config, requestConfig);
        const deferred = $qs.defer(), promise = deferred.promise;
        promise.success = function(fn) {
            promise.then(function(response) {
                fn(response.data, response.status, response.headers, config);
            });
            return promise;
        };
        promise.error = function(fn) {
            promise.then(null, function(response) {
                fn(response.data, response.status, response.headers, config);
            });
            return promise;
        };

        $context.getApplication().executeRequest(config).subscribe((response)=> {
            response.status = response.statusCode;
            response.data = response.body;
            deferred.resolve(response);
        }, (err)=> {
            if (err) {
                deferred.reject({ data: err.message, status:500, headers:{} });
            }
        });

        return promise;

    }

    ['get', 'delete', 'head', 'jsonp'].forEach(function(name) {
        $http[name] = function(url, config) {
            return $http(angular.extend(config || {}, {
                method: name,
                url: url
            }));
        };
    });

    ['post', 'put'].forEach(function(name) {
        $http[name] = function(url, data, config) {
            return $http(angular.extend(config || {}, {
                method: name,
                url: url,
                data: data
            }));
        };
    });

    return $http;
}

/**
 * @class
 */
export class DirectiveHandler {
    /**
     * @param {{context: HttpContext, target: HttpResult}} args
     * @param callback
     */
    postExecuteResult(args, callback) {
        try {

            callback = callback || function() {};
            //get context and view
            const context = args.context, view = args.target;
            //ensure context
            if (typeof context === 'undefined' || context === null) {
                return callback();
            }
            //ensure view
            if (typeof view === 'undefined' || view === null) {
                return callback();
            }
            //ensure view result data
            if (typeof view.body !== 'string') {
                return callback();
            }

            if (!args.context.getApplication().hasService(AngularServerModule)) {
                args.context.getApplication().useService(AngularServerModule);
            }
            /**
             * @type {AngularServerModule}
             */
            const angularServer = args.context.getApplication().getService(AngularServerModule);

            //process result
            const document = angularServer.createDocument(view.body);
            //create server module
            const angular = document.parentWindow.angular;
            const app = angular.module('server',[]), promises = [];

            app.config(function($sceDelegateProvider) {
                $sceDelegateProvider.resourceUrlWhitelist([
                    '/templates/server/*.html'
                ]);
            });

            app.service('$context', function() {
                return context;
            }).service('$qs', function($q) {
                return {
                    /**
                     * @ngdoc method
                     * @name $qs#defer
                     * @kind function
                     * @returns {Deferred}
                     */
                    defer :function() {
                        const deferred = $q.defer();
                        promises.push(deferred.promise);
                        return deferred;
                    },
                    /**
                     * @ngdoc method
                     * @name $qs#when
                     * @kind function
                     * @param {*} value
                     * @returns {Promise}
                     */
                    when:  $q.when,
                    /**
                     * @ngdoc method
                     * @name $qs#all
                     * @kind function
                     * @param {Array.<Promise>|Object.<Promise>} promises
                     * @returns {Promise}
                     */
                    all: $q.all,
                    /**
                     * @ngdoc method
                     * @name $q#reject
                     * @kind function
                     * @param {*} reason
                     * @returns {Promise}
                     */
                    reject: $q.reject
                }
            }).service('$angular', function() {
                return angular;
            });

            app.service('$http', HttpInternalProvider);

            //copy application directives
            Object.keys(angularServer.directives).forEach(function(name) {
                app.directive(name, angularServer.directives[name]);
            });
            //copy application services
            Object.keys(angularServer.services).forEach(function(name) {
                app.service(name, angularServer.services[name]);
            });
            //copy application filters
            Object.keys(angularServer.filters).forEach(function(name) {
                app.filter(name, angularServer.filters[name]);
            });
            //copy application controllers
            Object.keys(angularServer.controllers).forEach(function(name) {
                app.controller(name, angularServer.controllers[name]);
            });

            //get application element
            const appElement = angular.element(document).find('*[server-app=\'server\']').get(0);
            if (appElement) {
                //get $q
                const $q = angular.injector(['ng']).get('$q');
                //initialize app element
                angular.bootstrap(appElement, ['server']);
                //wait for promises
                $q.all(promises).then(function() {
                    view.body = document.innerHTML;
                    return callback();
                }, function(reason) {
                    //throw exception
                    callback(new Error(reason));
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

