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
 * @class
 * @param {*} $context
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

        $context.application.executeRequest(config, function(err, response) {
            if (err) {
                deferred.reject({ data: err.message, status:500, headers:{} });
            }
            else {
                response.status = response.statusCode;
                response.data = response.body;
                deferred.resolve(response);
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
 * @augments HttpHandler
 */
export default class DirectiveHandler {
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
                callback();
                return;
            }
            //ensure view
            if (typeof view === 'undefined' || view === null) {
                callback();
                return;
            }
            //ensure view content type (text/html)
            if (!/^text\/html/.test(view.contentType)) {
                callback();
                return;
            }
            //ensure view result data
            if (typeof view.result !== 'string') {
                callback();
                return;
            }
            //process result
            const document = context.application.document(view.result);
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
            Object.keys(context.application.module.directives).forEach(function(name) {
                app.directive(name, context.application.module.directives[name]);
            });
            //copy application services
            Object.keys(context.application.module.services).forEach(function(name) {
                app.service(name, context.application.module.services[name]);
            });
            //copy application filters
            Object.keys(context.application.module.filters).forEach(function(name) {
                app.filter(name, context.application.module.filters[name]);
            });
            //copy application controllers
            Object.keys(context.application.module.controllers).forEach(function(name) {
                app.controller(name, context.application.module.controllers[name]);
            });

            //get application element
            const appElement = angular.element(document).find('*[ejs-app=\'server\']').get(0);
            if (appElement) {
                //get $q
                const $q = angular.injector(['ng']).get('$q');
                //initialize app element
                angular.bootstrap(appElement, ['server']);
                //wait for promises
                $q.all(promises).then(function() {
                    view.result = document.innerHTML;
                    callback();
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
