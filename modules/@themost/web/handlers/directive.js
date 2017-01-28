/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-09
 */
/**
 * Created by kbarbounakis on 9/6/2014.
 */
/**
 * @ignore
 */
var fs = require("fs"),
    url = require("url"),
    util = require("util"),
    path = require("path"),
    ejs = require("ejs"),
    async = require("async");


/**
 * @class DirectiveEngine
 * @constructor
 * @augments HttpHandler
 */
function DirectiveEngine() {
    //
}
/**
 * @param {{context: HttpContext, target: HttpResult}} args
 * @param callback
 */
DirectiveEngine.prototype.postExecuteResult = function(args, callback) {
    try {
        callback = callback || function() {};
        //get context and view
        var context = args.context,
            view = args.target;
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
        var document = context.application.document(view.result);
        //create server module
        var angular = document.parentWindow.angular;
        var app = angular.module('server',[]), promises = [];

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
                    var deferred = $q.defer();
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

        /**
         * @class HttpInternalProvider
         * @param $context
         * @param $qs
         * @returns {$http}
         * @constructor
         * @private
         */
        function HttpInternalProvider($context, $qs) {

            function $http(requestConfig) {
                var config = {
                    method: 'get',
                    cookie: $context.request.headers.cookie
                };
                angular.extend(config, requestConfig);
                var deferred = $qs.defer(), promise = deferred.promise;
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
        var appElement = angular.element(document).find('*[ejs-app=\'server\']').get(0);
        if (appElement) {
            //get $q
            var $q = angular.injector(['ng']).get('$q');
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
    //module.exports.DirectiveEngine = DirectiveEngine;
}