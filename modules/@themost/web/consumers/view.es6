/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import 'source-map-support/register';
import {TraceUtils, LangUtils} from '@themost/common/utils';
import {HttpNextResult, HttpEndResult} from '../results';
import {HttpConsumer} from '../consumers';
import _ from 'lodash';
import url from 'url';
import xml from 'most-xml';
import Q from 'q';
import async from 'async';
import {ModuleLoaderStrategy} from "@themost/common/config";


function getOwnPropertyNames_(obj) {
    if (typeof obj === 'undefined' || obj === null) {
        return [];
    }
    const ownPropertyNames = [];
    let proto = Object.getPrototypeOf(obj);
    while(proto) {
        ownPropertyNames.push.apply(ownPropertyNames, Object.getOwnPropertyNames(proto));
        proto = Object.getPrototypeOf(proto);
    }
    return ownPropertyNames;
}

/**
 *
 * @param s
 * @returns {*}
 * @private
 */
function _dasherize(s) {
    if (_.isString(s))
        return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
    return s;
}
function _isPromise(f) {
    if (typeof f !== 'object') {
        return false;
    }
    return (typeof f.then === 'function') && (typeof f.catch === 'function');
}

/**
 * @method dasherize
 * @memberOf _
 */

/**
 * @method isPromise
 * @memberOf _
 */

if (typeof _.dasherize !== 'function') {
    _.mixin({'dasherize' : _dasherize});
}

if (typeof _.isPromise !== 'function') {
    _.mixin({'isPromise' : _isPromise});
}

/**
 * @classdesc Default view handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 */
class ViewHandler {
    /**
     *
     * @param {string} controllerName
     * @param {HttpContext} context
     * @param {Function} callback
     */
    static queryControllerClass(controllerName, context, callback) {

        if (_.isNil(controllerName)) {
            callback();
        }
        else {
            const moduleLoader = context.getApplication().getConfiguration().getStrategy(ModuleLoaderStrategy);
            //get dasherized controller path e.g. ./controllers/user-controller.js
            let controllerPath = `./controllers/${_.dasherize(controllerName)}-controller.js`;
            //try to load controller
            try {
                return callback(null, moduleLoader.require(controllerPath));
            }
            catch(err) {
                if (err.code === 'MODULE_NOT_FOUND') {
                    const controllerModel = context.model(controllerName);
                    //module not found so try to find it if current controller has a model defined
                    if (_.isNil(controllerModel)) {
                        return callback(null,context.getApplication().getConfiguration().controllers[controllerName] || require('../controllers/base'));
                    }
                    //get controller path based on controller's type e.g. ./controllers/lookup-controller.js
                    controllerPath = `./controllers/${_.dasherize(controllerModel.type || 'data')}-controller.js`;
                    try {
                        return callback(null, moduleLoader.require(controllerPath));
                    }
                    catch (err) {
                        if (err.code === 'MODULE_NOT_FOUND') {
                            //get controller relative path based on controller's type e.g. ./controllers/lookup-controller.js
                            controllerPath = `../controllers/${ _.dasherize(controllerModel.type || 'data')}.js`;
                            try {
                                return callback(null, require(controllerPath));
                            }
                            catch (err) {
                                if (err.code === 'MODULE_NOT_FOUND') {
                                    return callback(null, require('../controllers/base'));
                                }
                                return callback(err);
                            }
                        }
                        return callback(err);
                    }
                }
                return callback(err);
            }
        }
    }

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    mapRequest(context, callback) {
        const self = this;
        callback = callback || function () { };
        //try to map request
        try {
            //first of all check if a request handler is already defined
            if (typeof context.request.currentHandler !== 'undefined') {
                //do nothing (exit mapping)
                return callback();
            }
            const requestUri = url.parse(context.request.url);
            /**
             * find route by querying application routes
             * @type {HttpRoute}
             */
            const currentRoute = context.request.route;
            if (_.isNil(currentRoute)) {
                return callback();
            }
            //query controller
            const controllerName = currentRoute["controller"] || currentRoute.routeData.controller || queryController(requestUri);
            if (typeof controllerName === 'undefined' || controllerName === null) {
                return callback();
            }
            //try to find controller class
            ViewHandler.queryControllerClass(controllerName, context, function(err, ControllerClass) {
                if (err) {
                    return callback(err);
                }
                try {
                    //initialize controller
                    const controller = new ControllerClass();
                    //set controller's name
                    controller.name = controllerName.toLowerCase();
                    //set controller's context
                    controller.context = context;
                    //set request handler
                    self.controller = controller;
                    context.request.currentHandler = self;
                    return callback(null, true);
                }
                catch(err) {
                    return callback(err);
                }
            });

        }
        catch (err) {
            callback(err);
        }

    }

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    postMapRequest(context, callback) {
        try {
            ViewHandler.prototype.preflightRequest.call(this, context, function(err) {
                if (err) { return callback(err); }
                let obj;
                if (context.is('POST')) {
                    if (context.getFormat()==='xml') {
                        //get current model
                        if (context.request.body) {
                            //load xml
                            try {
                                const doc = xml.loadXML(context.request.body);
                                obj = xml.deserialize(doc.documentElement);
                                context.params.data = obj;
                            }
                            catch (err) {
                                return callback(err);
                            }
                        }
                    }
                    else if (context.getFormat()==='json') {
                        if (typeof context.request.body === 'string') {
                            //parse json data
                            try {
                                obj = JSON.parse(context.request.body);
                                //set context data
                                context.params.data = obj;
                            }
                            catch(e) {
                                //otherwise raise error
                                TraceUtils.log(e);
                                return callback(new Error('Invalid JSON data.'));
                            }
                        }
                    }
                }
                return callback();
            });
        }
        catch(err) {
            callback(err);
        }
    }

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    preflightRequest(context, callback) {
        try {
            if (context && (context.request.currentHandler instanceof ViewHandler)) {
                //set the default origin (with wildcard)
                let allowCredentials = true, allowOrigin="*", allowHeaders = "Origin, X-Requested-With, Content-Type, Content-Language, Accept, Accept-Language, Authorization", allowMethods = "GET, OPTIONS, PUT, POST, DELETE";
                /**
                 * @private
                 * @type {{allowOrigin:string,allowHeaders:string,allowCredentials:Boolean,allowMethods:string,allow:string}|*}
                 */
                const route = context.request.route;
                if (route) {
                    if (typeof route.allowOrigin !== 'undefined')
                        allowOrigin = route.allowOrigin;
                    if (typeof route.allowHeaders !== 'undefined')
                        allowHeaders = route.allowHeaders;
                    if (typeof route.allowCredentials !== 'undefined')
                        allowCredentials = route.allowCredentials;
                    if ((typeof route.allowMethods !== 'undefined') || (typeof route.allow !== 'undefined'))
                        allowMethods = route.allow || route.allowMethods;
                }
                //ensure header names
                const headerNames = context.response["_headerNames"] || { };
                //1. Access-Control-Allow-Origin
                if (typeof headerNames["access-control-allow-origin"] === 'undefined') {
                    //if request contains origin header
                    if (context.request.headers.origin) {
                        if (allowOrigin === "*") {
                            //set access-control-allow-origin header equal to request origin header
                            context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                        }
                        else if (allowOrigin.indexOf(context.request.headers.origin)>-1) {
                            context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
                        }
                    }
                    else {
                        //set access-control-allow-origin header equal to the predefined origin header
                        context.response.setHeader("Access-Control-Allow-Origin", "*");
                    }
                }
                //2. Access-Control-Allow-Origin
                if (typeof headerNames["access-control-allow-credentials"] === 'undefined') {
                    context.response.setHeader("Access-Control-Allow-Credentials", allowCredentials);
                }

                //3. Access-Control-Allow-Headers
                if (typeof headerNames["access-control-allow-headers"] === 'undefined') {
                    context.response.setHeader("Access-Control-Allow-Headers", allowHeaders);
                }

                //4. Access-Control-Allow-Methods
                if (typeof headerNames["access-control-allow-methods"] === 'undefined') {
                    context.response.setHeader("Access-Control-Allow-Methods", allowMethods);
                }
            }
            if (typeof callback === 'undefined') { return; }
            return callback();
        }
        catch(e) {
            if (typeof callback === 'undefined') { throw e; }
            callback(e);
        }

    }

    /**
     * @param {HttpContext} context
     * @param {*} controller
     * @param {string} action
     * @returns {boolean}
     */
    static isValidControllerAction(context, controller, action) {
        const httpMethodDecorator = _.camelCase('http-' + context.request.method);
        if (typeof controller[action] === 'function') {
            //get httpAction decorator
            if ((typeof controller[action].httpAction === 'undefined') ||
                (controller[action].httpAction===action)) {
                //and supports current request method (see http decorators)
                if (controller[action][httpMethodDecorator]) {
                    //return this action
                    return true;
                }
            }
        }
        return false;
    }

    /**
     *
     * @param {HttpContext} context
     * @param {*} controller
     * @param {string} action
     * @returns {*}
     */
    queryControllerAction(context, controller, action) {
        //get current http decorator name (e.g. httpGet, httpPost etc)
        const httpMethodDecorator = _.camelCase('http-' + context.request.method);
        //get camel cased action name (e.g. test-action as testAction)
        const method = _.camelCase(action);
        //get controller prototype
        const controllerPrototype = Object.getPrototypeOf(controller);
        if (controllerPrototype) {
            //query controller methods that support current http request
            let protoActionMethod = _.find(getOwnPropertyNames_(controller), function(x) {
                return (typeof controller[x] === 'function') &&
                    (controller[x].httpAction === action) &&
                    (controller[x][httpMethodDecorator] === true);
            });
            //if an action was found for the given criteria
            if (protoActionMethod) {
                return controller[protoActionMethod];
            }
        }
        //if an action with the given name is a method of current controller
        if (ViewHandler.isValidControllerAction(context, controller, action)) {
            return controller[action];
        }
        //if an camel cased action with the given name is a method of current controller
        if (ViewHandler.isValidControllerAction(context, controller, method)) {
            return controller[method];
        }
    }

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    processRequest(context, callback) {
        const self = this;
        callback = callback || function () { };
        try {
            if (context.is('OPTIONS')) {
                //do nothing
                return callback();
            }
            //validate request controller
            const controller = self.controller;
            if (controller) {
                /**
                 * try to find action
                 * @type {String}
                 */
                const action = context.request.routeData.action;
                if (action) {
                    //query controller action
                    let actionMethod = self.queryControllerAction(context, controller, action);
                    if (typeof actionMethod !== 'function') {
                        return callback(null, new HttpNextResult());
                    }
                    //enumerate params
                    const methodParams = LangUtils.getFunctionParams(actionMethod), params = [];
                    //execute action handler decorators
                    const actionConsumers = _.filter(_.keys(actionMethod), (x) => {
                        return (actionMethod[x] instanceof HttpConsumer);
                    });
                    return async.eachSeries(actionConsumers, (actionConsumer, cb) => {
                        try {
                            const source = actionMethod[actionConsumer].run(context);
                            if (!_.isPromise(source)) {
                                return cb(new Error("Invalid type. Action consumer result must be a promise."));
                            }
                            return source.then(()=> {
                                return cb();
                            }).catch((err)=> {
                                return cb(err);
                            });
                        }
                        catch(err) {
                            return cb(err);
                        }
                    }, (err)=> {
                        if (err) {
                            return callback(err);
                        }
                        try {
                            if (methodParams.length>0) {
                                let k = 0;
                                while (k < methodParams.length) {
                                    if (typeof context.getParam === 'function') {
                                        params.push(context.getParam(methodParams[k]));
                                    }
                                    else {
                                        params.push(context.params[methodParams[k]]);
                                    }
                                    k+=1;
                                }
                            }
                            //execute method
                            const source = actionMethod.apply(controller, params);
                            return source.then((result) => {
                                return callback(null, result);
                            }).catch((err) => {
                                return callback(err);
                            });
                        }
                        catch(err) {
                            return callback(err);
                        }
                    });
                }
            }
            return callback();
        }
        catch (err) {
            return callback(err);
        }
    }

}




/**
 * Gets the controller of the given url
 * @param {string|*} requestUri - A string that represents the url we want to parse.
 * @private
 * */
function queryController(requestUri) {
    try {
        if (requestUri === undefined)
            return null;
        //split path
        const segments = requestUri.pathname.split('/');
        //put an exception for root controller
        //maybe this is unnecessary exception but we need to search for root controller e.g. /index.html, /about.html
        if (segments.length === 2)
            return 'root';
        else
        //e.g /pages/about where segments are ['','pages','about']
        //and the controller of course is always the second segment.
            return segments[1];

    }
    catch (err) {
        throw err;
    }
}


export class ViewConsumer extends HttpConsumer {
    constructor() {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new ViewHandler();
                //execute mapRequest
                return Q.nfbind(handler.mapRequest.bind(handler))(context)
                    .then(()=> {
                        //if request has been mapped
                        if (context.request.currentHandler instanceof ViewHandler) {
                            //execute post map request
                            return Q.nfbind(handler.postMapRequest.bind(handler))(context);
                        }
                        //otherwise return next result
                        return Q(new HttpNextResult());
                    }).then(()=> {
                        //if current handler is an instance of ViewHandler
                        if (context.request.currentHandler instanceof ViewHandler) {
                            //process request
                            return Q.nfbind(handler.processRequest.bind(handler))(context).then((res)=> {
                                if (res instanceof HttpEndResult) {
                                    return res.toPromise();
                                }
                                return Q(res);
                            });
                        }
                        return Q(new HttpNextResult());
                    });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}


