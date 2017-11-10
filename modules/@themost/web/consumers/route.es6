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
import {Args} from '@themost/common/utils';
import {AbstractMethodError,AbstractClassError} from '@themost/common/errors';
import _ from 'lodash';
import url from 'url';
import {HttpApplicationService} from '../interfaces';
import {HttpConsumer} from '../consumers';
import Q from 'q';
import {HttpNextResult} from '../results';

/**
 * @classdesc HttpRoute class provides routing functionality to HTTP requests
 * @class
 * */
export class HttpRoute {
    /**
     * @constructor
     * @param {string|*=} route - A formatted string or an object which represents an HTTP route response url (e.g. /pages/:name.html, /user/edit.html).
     */
    constructor(route) {
        if (typeof route === 'string') {
            this.route = { url:route };
        }
        else if (typeof route === 'object') {
            this.route = route;
        }
        this.routeData = { };

        this.patterns = {
            int:function() {
                return "^[+-]?[1-9]([0-9]*)$";
            },
            boolean:function() {
                return "^true|false$"
            },
            decimal:function() {
                return "^[+-]?\\d*\\.?\\d*$";
            },
            float:function() {
                return "^[+-]?\\d*\\.?\\*$";
            },
            guid:function() {
                return "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$";
            }
        }

    }

    /**
     * @param {string} urlToMatch
     * @return {boolean}
     */
    isMatch(urlToMatch) {
        const self = this;
        if (typeof self.route === 'undefined' || self.route===null) {
            throw new Error("Route may not be null");
        }
        self.routeData = self.routeData || { };
        if (typeof urlToMatch !== 'string')
            return false;
        if (urlToMatch.length === 0)
            return false;
        let str1 = urlToMatch, patternMatch;
        const k = urlToMatch.indexOf('?');
        if (k >= 0)
            str1 = urlToMatch.substr(0, k);
        const re = /(\{([\w[\]]+)(?::\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*})+))?})|((:)([\w[\]]+))/ig;
        let match = re.exec(this.route.url);
        const params = [];
        while(match) {
            if (typeof match[2] === 'undefined') {
                //parameter with colon (e.g. :id)
                params.push({
                    name: match[6]
                });
            }
            else if (typeof match[3] !== 'undefined') {
                //common expressions
                patternMatch = match[3];
                if (typeof self.patterns[match[3]] === 'function') {
                    patternMatch = self.patterns[match[3]]();
                }
                params.push({
                    name: match[2],
                    pattern: new RegExp(patternMatch, "ig")
                });
            }
            else {
                params.push({
                    name: match[2]
                });
            }
            match = re.exec(this.route.url);
        }
        const str = this.route.url.replace(re, "([\\$_\\-%0-9\\w-]+)"), matcher = new RegExp("^" + str + "$", "ig");
        match = matcher.exec(str1);
        if (typeof match === 'undefined' || match === null) {
            return false;
        }
        let decodedMatch;
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            if (typeof param.pattern !== 'undefined') {
                if (!param.pattern.test(match[i+1])) {
                    return false;
                }
            }
            decodedMatch = decodeURIComponent(match[i+1]);
            param.value = (match[i+1] !== decodedMatch) ? decodedMatch : match[i+1];
        }
        params.forEach(function(x) {
            self.routeData[x.name] = x.value;
        });
        if (self.route.hasOwnProperty("controller")) { self.routeData["controller"] = self.route["controller"]; }
        if (self.route.hasOwnProperty("action")) { self.routeData["action"] = self.route["action"]; }
        if (self.route.hasOwnProperty("model")) { self.routeData["model"] = self.route["model"]; }
        return true;
    }

    /**
     * @param {string|*=} route - A formatted string or an object which represents an HTTP route response url (e.g. /pages/:name.html, /user/edit.html).
     * @returns {HttpRoute}
     */
    static create(route) {
        return new HttpRoute(route);
    }

}

/**
 * @classdesc Extends context parameters by adding the context params that are defined on the current route, if any (implemented on version 1.x of MOST Web Framework)
 * @class
 */
class RouteHandler {
    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    mapRequest(context, callback) {
        if (_.isNil(context.request)) {
            return callback();
        }
        /**
         * @type {RoutingStrategy}
         */
        const routeStrategy = context.getApplication().getService(RoutingStrategy);
        if (_.isNil(routeStrategy)) {
            return callback();
        }
        const route = routeStrategy.exec(context.request.url);
        if (_.isNil(route)) {
            return callback();
        }
        //extend params
        context.params = context.params || {};
        //assign route to current request for further execution
        context.request.route = route;
        //assign route data to current request for further execution
        context.request.routeData = route.routeData || {};

        if (_.isObject(route.route)) {
            //assign route params
            _.assign(context.params, route.route.params);
        }
        //assign route data to params (override any existed property)
        if (_.isObject(context.request.routeData)) {
            _.assign(context.params, context.request.routeData)
        }
        return callback();
    }
}
/**
 * @classdesc An abstract class which represents the route strategy of an HTTP application.
 * @class
 */
export class RoutingStrategy extends HttpApplicationService {
    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
        Args.check(new.target !== RoutingStrategy, new AbstractClassError());
        super(app)
    }

    /**
     * @abstract
     * @returns {Array}
     */
    getRoutes() {
        throw new AbstractMethodError();
    }

    /**
     *
     * @param {string} requestURL
     * @returns {*}
     */
    isMatch(requestURL) {
        return this.exec(requestURL) instanceof HttpRoute;
    }
    /**
     * Returns the HTTP route that matches the given URL
     * @param {string} requestURL
     * @returns {*}
     */
    exec(requestURL) {
        if (_.isNil(requestURL)) {
            return;
        }
        let uri = url.parse(requestURL);
        const routes = this.getRoutes();
        if (_.isArray(routes) && (routes.length>0)) {
            //enumerate registered routes
            const httpRoute = new HttpRoute();
            for (let i = 0; i < routes.length; i++) {
                httpRoute.route = routes[i];
                //if uri path is matched
                if (httpRoute.isMatch(uri.pathname)) {
                    return httpRoute;
                }
            }
        }
    }
}

const routesProperty = Symbol('routes');

/**
 * @classdesc Represents the default route strategy of an HTTP application.
 */
export class DefaultRoutingStrategy extends RoutingStrategy {
    /**
     * @param {HttpApplication} app
     */
    constructor(app) {
        super(app);
        this[routesProperty] = this.getApplication().getConfiguration().routes || [];
    }

    /**
     * @returns {Array}
     */
    getRoutes() {
        return this[routesProperty];
    }
}


/**
 * @class
 */
export class RouteConsumer extends HttpConsumer {
    constructor() {
        super(function(context) {
            try {
                let handler = new RouteHandler();
                return Q.nfbind(handler.mapRequest)(context)
                    .then(()=> {
                        return HttpNextResult.create().toPromise();
                    });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}