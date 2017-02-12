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
import {HttpError,HttpNotFoundError} from '@themost/common/errors';
import {TraceUtils, LangUtils} from '@themost/common/utils';
import {HttpNextResult, HttpEndResult} from './results';
import {HttpConsumer} from './consumers';
import {_} from 'lodash';
import url from 'url';
import util from 'util';
import fs from 'fs';
import path from 'path';
import xml from 'most-xml';
import Rx from 'rx';


if (typeof _.dasherize != 'function') {
    /**
     * @param {string} s
     * @returns string
     */
    _.dasherize = function (s) {
        if (_.isString(s))
            return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
        return s;
    }
}

const STR_CONTROLLERS_FOLDER = 'controllers';
const STR_CONTROLLER_FILE = 'controllers/%s-controller.js';
const STR_CONTROLLER_RELPATH = 'controllers/%s-controller.js';

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

        if (typeof controllerName === 'undefined' || controllerName==null) {
            callback();
        }
        else {
            //get controller class path and model (if any)
            let controllerPath = context.getApplication().mapExecutionPath(util.format(STR_CONTROLLER_RELPATH, _.dasherize(controllerName)));
            const controllerModel = context.model(controllerName);
            //if controller does not exists
            fs.exists(controllerPath, function(exists){
                try {
                    //if controller class file does not exist in /controllers/ folder
                    if (!exists) {
                        //try to find if current controller has a model defined
                        if (controllerModel) {
                            const controllerType = controllerModel.type || 'data';
                            //try to find controller based on the model's type in controllers folder (e.g. /library-controller.js)
                            controllerPath = context.getApplication().mapExecutionPath(util.format(STR_CONTROLLER_RELPATH, controllerType));
                            fs.exists(controllerPath, function(exists) {
                               if (!exists) {
                                   //get controller path according to related model's type (e.g ./data-controller)
                                   controllerPath = util.format(STR_CONTROLLER_FILE, controllerType);
                                   //if controller does not exist
                                   controllerPath = path.join(__dirname, controllerPath);
                                   fs.exists(controllerPath, function(exists) {
                                       if (!exists)
                                           callback(null, require('./../controllers/base'));
                                       else
                                           callback(null, require(controllerPath));
                                   });
                               }
                               else {
                                   callback(null, require(controllerPath));
                               }
                            });
                        }
                        else {
                            const ControllerCtor = context.getApplication().getConfiguration().controllers[controllerName] || require('./../controllers/base').default;
                            callback(null, ControllerCtor);
                        }
                    }
                    else {
                        //return controller class
                        callback(null, require(controllerPath));
                    }
                }
                catch (err) {
                    callback(err);
                }
            });
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
            const controllerName = currentRoute["controller"] || currentRoute.routeData["controller"] || queryController(requestUri);
            if (typeof controllerName === 'undefined' || controllerName == null) {
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
                    if (context.format=='xml') {
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
                    else if (context.format=='json') {
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
                const action = context.request.routeData["action"];
                if (action) {
                    //execute action
                    let fn = controller[action];
                    if (typeof fn !== 'function') {
                        fn = controller[_.camelCase(action)];
                        if (typeof fn !== 'function')
                            fn = controller.action;
                    }
                    if (typeof fn !== 'function') {
                        return callback(new HttpNotFoundError());
                    }
                    //enumerate params
                    const methodParams = LangUtils.getFunctionParams(fn), params = [];
                    /*
                    * so if method has more than one parameter
                    * enumerate method parameters and check if a parameter with the same name
                    * exists in request's parameters.
                    * note: the last parameter (in this version) must be a callback function
                    * */
                    if (methodParams.length>1) {
                        let k=0;
                        while (k<methodParams.length-1) {
                            //get context parameter
                            params.push(context.params.attr(methodParams[k]));
                            k++;
                        }
                    }
                    //and finally push callback function parameter
                    /**
                     * @type HttpResult
                     * */
                    params.push(function (err, result) {
                        if (err) {
                            //throw error
                            return callback(err);
                        }
                        else {
                            //execute http result
                            result.execute(context, function(err) {
                                if (err) {
                                    return callback(err);
                                }
                                return callback(null, HttpEndResult.create());
                            });
                        }
                    });
                    //invoke controller method
                    return fn.apply(controller, params);
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
        if (segments.length == 2)
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
                return Rx.Observable.fromNodeCallback(handler.mapRequest, handler)(context)
                    .flatMap(()=> {
                        //if request has been mapped
                        if (context.request.currentHandler instanceof ViewHandler) {
                            //execute post map request
                            return Rx.Observable.fromNodeCallback(handler.postMapRequest, handler)(context);
                        }
                        //otherwise return next result
                        return Rx.Observable.return(new HttpNextResult());
                    }).flatMap(()=> {
                        //if current handler is an instance of ViewHandler
                        if (context.request.currentHandler instanceof ViewHandler) {
                            //process request
                            return Rx.Observable.fromNodeCallback(handler.processRequest, handler)(context).flatMap((res)=> {
                                if (res instanceof HttpEndResult) {
                                    return res.toObservable();
                                }
                                return Rx.Observable.return(new HttpNextResult());
                            });
                        }
                        return Rx.Observable.return(new HttpNextResult());
                    });
            }
            catch(err) {
                return Rx.Observable.throw(err);
            }
        });
    }
}


