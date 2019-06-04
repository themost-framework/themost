/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var domino = require("domino");
var LangUtils = require('@themost/common/utils').LangUtils;
var Args = require('@themost/common/utils').Args;
var HttpApplicationService = require('../types').HttpApplicationService;
var applyDirectives = require('./directives').apply;
var Symbom = require('symbol');
var _  = require('lodash');
var bootstrapMethod = Symbom('bootstrap');
var vm = require('vm');
var fs = require('fs');
var path = require('path');
var jQueryModulePath = path.resolve(__dirname, '../jquery/jquery.js');
var jQueryScript = fs.readFileSync(jQueryModulePath, 'utf8');
var jQueryExtensionsScript = fs.readFileSync(path.resolve(__dirname, '../jquery/extensions.js'), 'utf8');
var angularModulePath = path.resolve(__dirname, './1.6.10/angular.js');
var angularScript = fs.readFileSync(angularModulePath, 'utf8');
// noinspection JSClosureCompilerSyntax
/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @augments HttpApplicationService
 */
function AngularServerModule(app) {
    AngularServerModule.super_.bind(this)(app);
    this.directives = { };
    this.filters = { };
    this.controllers = { };
    this.services = { };
    this.modules = { };
    this.defaults = {
        interpolation: {
            startSymbol: '{{=',
            endSymbol: '}}'
        }
    };
    //this.angular = ng.angular;
    //this.jQuery = ng.jQuery;
    applyDirectives(this);
    this[bootstrapMethod] = function (angular) {
        return angular.module('server',[]);
    };
}
LangUtils.inherits(AngularServerModule, HttpApplicationService);
/**
 * Bootstraps angular server module.
 * @param {Function} bootstrapFunc
 * @returns {AngularServerModule}
 */
AngularServerModule.prototype.bootstrap = function(bootstrapFunc) {
    this[bootstrapMethod] = bootstrapFunc;
    return this;
};

AngularServerModule.prototype.doBootstrap = function(angular) {
    return this[bootstrapMethod](angular);
};

/**
 * Bootstraps angular server module by loading and executing the given module
 * @param {string} modulePath
 * @example
 *   'use strict';
 *   import {HttpApplication} from '@themost/web/app';
 *   import {AngularServerModule} from "@themost/web/lib/angular/module";
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
 * //#server.js
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
AngularServerModule.prototype.useBootstrapModule = function(modulePath) {
    var self = this;
    Args.notString(modulePath,'Module');

    var removeModule = function (moduleName) {
        var solvedName = require.resolve(moduleName);
        var nodeModule = require.cache[solvedName];
        if (nodeModule) {
            for (var i = 0; i < nodeModule.children.length; i++) {
                var child = nodeModule.children[i];
                removeModule(child.filename);
            }
            delete require.cache[solvedName];
        }
    };

    this[bootstrapMethod] = function(angular) {
        var module = require(modulePath);
        var keys = _.keys(module);
        if (keys.length===0) {
            throw new Error('Module export is missing or is inaccesible.');
        }
        var bootstrapFunc = module[keys[0]];
        if (typeof bootstrapFunc !== 'function') {
            throw new Error('Module export invalid. Expected function.');
        }
        var app = bootstrapFunc.call(self, angular);
        return app;
    };
    return this;
};

/**
 * @param {string} name
 * @param {*=} ctor
 * @returns AngularServerModule|Function
 */
// eslint-disable-next-line no-unused-vars
AngularServerModule.prototype.service = function(name, ctor) {
    if (typeof ctor === 'undefined')
        return this.services[name];
    this.services[name] = ctor;
    return this;
};
/**
 * @param {string} name
 * @param {*=} ctor
 * @returns AngularServerModule|Function
 */
// eslint-disable-next-line no-unused-vars
AngularServerModule.prototype.directive = function(name, ctor) {
    if (typeof ctor === 'undefined')
        return this.directives[name];
    this.directives[name] = ctor;
    return this;
};
/**
 * @param {string} name
 * @param {*=} ctor
 * @returns AngularServerModule|Function
 */
// eslint-disable-next-line no-unused-vars
AngularServerModule.prototype.filter = function(name, ctor) {
    if (typeof ctor === 'undefined')
        return this.filters[name];
    this.filters[name] = ctor;
    return this;
};
/**
 * @param {string} name
 * @param {function|Array|*=} ctor
 * @returns AngularServerModule|function
 */
// eslint-disable-next-line no-unused-vars
AngularServerModule.prototype.controller = function(name, ctor) {
    if (typeof ctor === 'undefined')
        return this.controllers[name];
    this.controllers[name] = ctor;
    return this;
};

/**
 * Create an HTML document
 * @param {string=} s A string which represents the HTML markup of the document
 * @returns {HTMLDocument|*}
 */
AngularServerModule.prototype.createDocument = function(s) {
    s = s || '<html/>';
    var window = domino.createWindow(s);
    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;
    //define parent window property
    Object.defineProperty(window.document, 'parentWindow', {
        get: function () {
            return window;
        }, configurable: false, enumerable: false
    });
    window.location.href = "/";
    //set window.jQuery
    var sandbox = vm.createContext({
        window: window,
        document: window.document,
        navigator : {
            appCodeName:"Mozilla",
            appVersion:"AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36",
            cookieEnabled: false,
            hardwareConcurrency:4,
            language:"en-US",
            platform:"Win32",
            product:"Gecko",
            userAgent:"Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"
        }
    });
    vm.runInContext(jQueryScript, sandbox, {
        filename: jQueryModulePath
    });
    vm.runInContext(jQueryExtensionsScript, sandbox);
    vm.runInContext(angularScript, sandbox, {
        filename: angularModulePath
    });
    sandbox = null;
    /**
     * @param {string|*} s
     * @returns {HTMLElement|*}
     */
    window.document.element = function(s) {
        return this.parentWindow.$(s);
    };
    return window.document;
};

if (typeof exports !== 'undefined') {
    module.exports.AngularServerModule = AngularServerModule;
}
