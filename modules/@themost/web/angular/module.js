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

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DirectiveHandler = exports.AngularServerModule = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _domino = require('domino');

var domino = _interopRequireDefault(_domino).default;

var _lodash = require('lodash');

var _ = _lodash._;

var _interfaces = require('../interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _directives = require('./directives');

var AngularServerModuleDefaults = _directives.AngularServerModuleDefaults;

var _errors = require('@themost/common/errors');

var HttpError = _errors.HttpError;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var bootstrapMethod = Symbol('bootstrap');

/**
 * Represents Angular JS Server module
 * @class
 * @property {*} directives
 * @property {*} controllers
 * @property {*} filters
 * @property {angular} angular
 * @property {jQuery} jQuery
 */

var AngularServerModule = exports.AngularServerModule = function (_HttpApplicationServi) {
    _inherits(AngularServerModule, _HttpApplicationServi);

    /**
     * @param {HttpApplication} app
     */
    function AngularServerModule(app) {
        _classCallCheck(this, AngularServerModule);

        var _this = _possibleConstructorReturn(this, (AngularServerModule.__proto__ || Object.getPrototypeOf(AngularServerModule)).call(this, app));

        _this.directives = {};
        _this.filters = {};
        _this.controllers = {};
        _this.services = {};
        _this.modules = {};
        _this.angular = ng.angular;
        _this.jQuery = ng.jQuery;
        AngularServerModuleDefaults.applyDirectives(_this);
        _this[bootstrapMethod] = function (angular) {
            return angular.module('server', []);
        };
        return _this;
    }

    /**
     * Bootstraps angular server module.
     * @param {Function} fn
     * @returns {module}
     */


    _createClass(AngularServerModule, [{
        key: 'bootstrap',
        value: function bootstrap(fn) {
            this[bootstrapMethod] = fn;
        }

        /**
         * Bootstraps angular server module by loading and executing the given module
         * @param {string} file
         * @example
         *   'use strict';
         *   import {HttpApplication} from './../modules/@themost/web/index';
         *   import {AngularServerModule} from "../modules/@themost/web/lib/angular/module";
         *   //instantiate application
         *   let app = new HttpApplication();
         *   //set execution path
         *   app.setExecutionPath('./test-app')
         *   //use angular server module
         *   .useService(AngularServerModule)
         *   .getService(AngularServerModule)
         *   //and set bootstrap module
         *   .useBootstrapModule(app.mapExecutionPath('./modules/server-app'));
         * @example
         * //#server-app.js
         *   'use strict';
         *   export function bootstrap(angular) {
         *       //initialize extensions module
         *       const extensions = angular.module('server-extensions',[]);
         *       //add a simple directive
         *       extensions.directive('helloText', function() {
         *               return {
         *                   restrict:'EA',
         *                   link: function(scope, element) {
         *                       element.text('Hello User!!');
         *                   }
         *              }
         *           });
         *           //and return server module by adding server-extensions dependency
         *           return angular.module('server',['server-extensions']);
         *   }
         *
         *
         */

    }, {
        key: 'useBootstrapModule',
        value: function useBootstrapModule(file) {
            var self = this;
            Args.notString(file, 'Module');

            var removeModule = function removeModule(moduleName) {
                var solvedName = require.resolve(moduleName),
                    nodeModule = require.cache[solvedName];
                if (nodeModule) {
                    for (var i = 0; i < nodeModule.children.length; i++) {
                        var child = nodeModule.children[i];
                        removeModule(child.filename);
                    }
                    delete require.cache[solvedName];
                }
            };

            this[bootstrapMethod] = function (angular) {
                var module = require(file);
                var keys = _.keys(module);
                if (keys.length === 0) {
                    throw new Error('Module export is missing or is inaccesible.');
                }
                var bootstrapFunc = module[keys[0]];
                if (typeof bootstrapFunc !== 'function') {
                    throw new Error('Module export invalid. Expected function.');
                }
                var app = bootstrapFunc.call(self, angular);
                if (process.env.NODE_ENV === 'development') removeModule(file);
                return app;
            };
            return this;
        }

        /**
         * @param {string} name
         * @param {function|Array|*=} ctor
         * @returns AngularServerModule|function
         */

    }, {
        key: 'service',
        value: function service(name, ctor) {
            if (typeof ctor === 'undefined') return this.services[name];
            this.services[name] = ctor;
            return this;
        }

        /**
         * @param {string} name
         * @param {function|Array|*=} ctor
         * @returns AngularServerModule|function
         */

    }, {
        key: 'directive',
        value: function directive(name, ctor) {
            if (typeof ctor === 'undefined') return this.directives[name];
            this.directives[name] = ctor;
            return this;
        }

        /**
         * @param {string} name
         * @param {function|Array|*=} ctor
         * @returns AngularServerModule|function
         */

    }, {
        key: 'filter',
        value: function filter(name, ctor) {
            if (typeof ctor === 'undefined') return this.filters[name];
            this.filters[name] = ctor;
            return this;
        }

        /**
         * @param {string} name
         * @param {function|Array|*=} ctor
         * @returns AngularServerModule|function
         */

    }, {
        key: 'controller',
        value: function controller(name, ctor) {
            if (typeof ctor === 'undefined') return this.controllers[name];
            this.controllers[name] = ctor;
            return this;
        }

        /**
         * Create an HTML document
         * @param {string} s A string which represents the HTML markup of the document
         * @returns {HTMLDocument}
         */

    }, {
        key: 'createDocument',
        value: function createDocument(s) {
            s = s || '<html/>';
            var window = domino.createWindow(s);
            window.setTimeout = setTimeout;
            window.clearTimeout = clearTimeout;
            //define parent window property
            Object.defineProperty(window.document, 'parentWindow', { get: function get() {
                    return window;
                }, configurable: false, enumerable: false });
            window.location.href = "/";
            if (typeof global.jQuery !== 'function') throw new Error('jQuery object cannot be instantiated due to missing constructor.');
            global.jQuery(window);
            //extend jQuery
            var ext = require('../jquery/server_extensions');
            ext.extend(window.jQuery);
            if (typeof global.angular !== 'function') throw new Error('Angular JS object cannot be instantiated due to missing constructor.');
            //initialize angular
            global.angular(window, window.document);
            /**
             * @param {string|*} s
             * @returns {HTMLElement|*}
             */
            window.document.element = function (s) {
                return this.parentWindow.$(s);
            };
            return window.document;
        }
    }]);

    return AngularServerModule;
}(HttpApplicationService);

var ng = {};

if (typeof ng.angular === 'undefined' || ng.angular === null) {
    global.window = domino.createWindow('<html />');
    global.window.location.href = "/";
    global.document = global.window.document;
    global.navigator = { appCodeName: "Mozilla",
        appVersion: "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36",
        cookieEnabled: false,
        hardwareConcurrency: 4,
        language: "en-US",
        platform: "Win32",
        product: "Gecko",
        userAgent: "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"
    };
    //call jQuery initialization
    require('../jquery/jquery');
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
        angular.extend(config, requestConfig);
        var deferred = $q.defer(),
            promise = deferred.promise;

        $async(function (resolve, reject) {

            promise.success = function (fn) {
                promise.then(function (response) {
                    fn(response.data, response.status, response.headers, config);
                    resolve();
                });
                return promise;
            };
            promise.error = function (fn) {
                promise.then(null, function (response) {
                    fn(response.data, response.status, response.headers, config);
                    reject(new HttpError(response.status));
                });
                return promise;
            };

            $context.getApplication().executeRequest(config).subscribe(function (response) {
                response.status = response.statusCode;
                response.data = response.body;
                deferred.resolve(response);
            }, function (err) {
                if (err) {
                    deferred.reject({ data: err.message, status: 500, headers: {} });
                }
            });
        });
        return promise;
    }

    ['get', 'delete', 'head', 'jsonp'].forEach(function (name) {
        $http[name] = function (url, config) {
            return $http(angular.extend(config || {}, {
                method: name,
                url: url
            }));
        };
    });

    ['post', 'put'].forEach(function (name) {
        $http[name] = function (url, data, config) {
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

var DirectiveHandler = exports.DirectiveHandler = function () {
    function DirectiveHandler() {
        _classCallCheck(this, DirectiveHandler);
    }

    _createClass(DirectiveHandler, [{
        key: 'postExecuteResult',

        /**
         * @param {{context: HttpContext, target: HttpResult}} args
         * @param callback
         */
        value: function postExecuteResult(args, callback) {
            try {

                callback = callback || function () {};
                //get context and view
                var context = args.context,
                    view = args.target;
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
                var angularServer = args.context.getApplication().getService(AngularServerModule);

                //process result
                var document = angularServer.createDocument(view.body);
                //create server module
                var _angular = document.parentWindow.angular;

                var app = angularServer[bootstrapMethod](_angular);

                /**
                 * @type {Array}
                 */

                var promises = [];
                app.config(function ($sceDelegateProvider) {
                    /**
                     * @method resourceUrlWhitelist
                     * @param {Array} whiteList
                     * @methodOf $sceDelegateProvider
                     */
                    $sceDelegateProvider.resourceUrlWhitelist(['/templates/server/*.html']);
                });
                app.service('$context', function () {
                    return context;
                }).service('$async', function ($q) {
                    /**
                     * @param {Function} fn
                     */
                    return function $async(fn) {
                        var deferred = $q.defer();
                        promises.push(deferred.promise);
                        try {
                            fn.call(document.parentWindow, function () {
                                deferred.resolve();
                            }, function (err) {
                                deferred.reject(err);
                            });
                        } catch (err) {
                            deferred.reject(err);
                        }
                    };
                });
                app.service('$http', HttpInternalProvider);
                //copy application directives
                Object.keys(angularServer.directives).forEach(function (name) {
                    app.directive(name, angularServer.directives[name]);
                });
                //copy application services
                Object.keys(angularServer.services).forEach(function (name) {
                    app.service(name, angularServer.services[name]);
                });
                //copy application filters
                Object.keys(angularServer.filters).forEach(function (name) {
                    app.filter(name, angularServer.filters[name]);
                });
                //copy application controllers
                Object.keys(angularServer.controllers).forEach(function (name) {
                    app.controller(name, angularServer.controllers[name]);
                });
                //get application element
                var appElement = _angular.element(document).find('*[server-app=\'server\']').get(0);
                if (appElement) {
                    //get $q
                    var $q = _angular.injector(['ng']).get('$q');
                    //initialize app element
                    _angular.bootstrap(appElement, ['server']);
                    //wait for promises
                    $q.all(promises).then(function () {
                        view.body = document.innerHTML;
                        return callback();
                    }, function (reason) {
                        //throw exception
                        callback(new Error(reason));
                    });
                } else {
                    return callback();
                }
            } catch (e) {
                callback(e);
            }
        }
    }]);

    return DirectiveHandler;
}();
//# sourceMappingURL=module.js.map
