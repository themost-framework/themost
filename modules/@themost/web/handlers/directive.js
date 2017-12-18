/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var HttpError = require('@themost/common/errors').HttpError;
var AngularServerModule = require('./../angular/module').AngularServerModule;
var _ = require('lodash');

/**
 * @interface
 * @constructor
 */
function PostExecuteResultArgs() {
    /**
     * @property
     * @name PostExecuteResultArgs#context
     * @type {HttpContext}
     */

    /**
     * @property
     * @name PostExecuteResultArgs#target
     * @type {*}
     */

}

/**
 * @class
 * @param {HttpContext|*} $context
 * @param {*} $async
 * @param {*} $q
 * @returns {$http}
 * @constructor
 * @private
 */
function HttpInternalProvider($context, $async, $q) {

    function $http(requestConfig) {
        var config = {
            method: 'get',
            cookie: $context.request.headers.cookie
        };
        _.assign(config, requestConfig);
        var deferred = $q.defer(), promise = deferred.promise;

        $async(function(resolve, reject) {

            promise.success = function(fn) {
                promise.then(function(response) {
                    fn(response.data, response.status, response.headers, config);
                    resolve();
                });
                return promise;
            };
            promise.error = function(fn) {
                promise.then(null, function(response) {
                    fn(response.data, response.status, response.headers, config);
                    reject(new HttpError(response.status));
                });
                return promise;
            };

            $context.getApplication().executeRequest(config).then(function(response) {
                response.status = response.statusCode;
            response.data = response.body;
            deferred.resolve(response);
        }).catch(function(err) {
                if (err) {
                    deferred.reject({ data: err.message, status:500, headers:{} });
                }
            });
        });
        return promise;

    }

    ['get', 'delete', 'head', 'jsonp'].forEach(function(name) {
        $http[name] = function(url, config) {
            return $http(_.assign(config || {}, {
                method: name,
                url: url
            }));
        };
    });

    ['post', 'put'].forEach(function(name) {
        $http[name] = function(url, data, config) {
            return $http(_.assign(config || {}, {
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
 * @constructor
 * @augments HttpHandler
 */
function DirectiveEngine() {
    //
}
/**
 * @param {PostExecuteResultArgs|*} args
 * @param callback
 */
DirectiveEngine.prototype.postExecuteResult = function(args, callback) {
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

        const app = angularServer.doBootstrap(angular);
        /**
         * @type {Array}
         */

        const promises = [];
        app.config(function($sceDelegateProvider) {
            /**
             * @method resourceUrlWhitelist
             * @param {Array} whiteList
             * @methodOf $sceDelegateProvider
             */
            $sceDelegateProvider.resourceUrlWhitelist([
                '/templates/server/*.html'
            ]);
        });
        app.service('$context', function() {
            return context;
        }).service('$async', function($q) {
            /**
             * @param {Function} fn
             */
            return function $async(fn) {
                const deferred = $q.defer();
                promises.push(deferred.promise);
                try {
                    fn.call(document.parentWindow,function() {
                        deferred.resolve();
                }, function(err) {
                        deferred.reject(err);
                    });
                }
                catch(err) {
                    deferred.reject(err);
                }
            };
        });
        app.service('$http', HttpInternalProvider);
        //copy application directives

        _.forEach(_.keys(angularServer.directives), function(name) {
            app.directive(name, angularServer.directives[name]);
        });
        //copy application services
        _.forEach(_.keys(angularServer.services), function(name) {
            app.service(name, angularServer.services[name]);
        });
        //copy application filters
        _.forEach(_.keys(angularServer.filters), function(name) {
            app.filter(name, angularServer.filters[name]);
        });
        //copy application controllers
        _.forEach(_.keys(angularServer.controllers), function(name) {
            app.controller(name, angularServer.controllers[name]);
        });
        //get application element
        var appElement = angular.element(document).find('*[server-app=\'server\']').get(0);
        if (typeof appElement === 'undefined') {
            appElement = angular.element(document).find('body').get(0);
        }
        if (appElement) {
            //get $q
            var $q = angular.injector(['ng']).get('$q');
            //set $rootScope
            app.run(function($rootScope) {
                if (_.isObject(view.data)) {
                    _.assign($rootScope, view.data);
                }
            });
            //initialize app element
            angular.bootstrap(appElement, ['server']);
            //wait for promises
            $q.all(promises).then(function() {
                view.body = document.innerHTML;
                return callback();
            }, function(reason) {
                callback(new Error(reason));
            });
        }
        else {
            return callback();
        }
    }
    catch (e) {
        callback(e);
    }
};
/**
 * Creates a new instance of AuthHandler class
 * @returns {DirectiveEngine}
 */
DirectiveEngine.createInstance = function() {
    return new DirectiveEngine();
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = DirectiveEngine.createInstance;
    module.exports.DirectiveEngine = DirectiveEngine;
    module.exports.PostExecuteResultArgs = PostExecuteResultArgs;
}