/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var Args = require('@themost/common/utils').Args;
var AbstractClassError = require('@themost/common/errors').AbstractClassError;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;
var Symbol = require('symbol');
var applicationProperty = Symbol('application');

/**
 * @classdesc An abstract class that represents an HTTP Handler
 * @class
 * @abstract
 * @constructor
 * @memberOf module:@themost/web/common
 */
function HttpHandler() {
    Args.check((this.constructor.name !== 'HttpHandler'), new AbstractClassError());
}

/**
 * @type {string[]}
 */
HttpHandler.Events = ['beginRequest', 'validateRequest', 'authenticateRequest',
    'authorizeRequest', 'mapRequest', 'postMapRequest', 'preExecuteResult', 'postExecuteResult', 'endRequest'];

/**
 * Occurs as the first event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.beginRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when a handler is going to validate current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.validateRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when a handler is going to set current user identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.authenticateRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when a handler has established the identity of the current user.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.postAuthenticateRequest = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/


/**
 * Occurs when a handler has verified user authorization.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.authorizeRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when the handler is selected to respond to the request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.mapRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when application has mapped the current request to the appropriate handler.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.postMapRequest = function(context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs just before application starts executing a handler.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.preRequestHandlerExecute = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/

/**
 * Occurs when application starts processing current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.processRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when application starts executing an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.preExecuteResult = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when application was successfully executes an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.postExecuteResult = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * Occurs when the handler finishes execution.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.postRequestHandlerExecute = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/

/**
 * Occurs as the last event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.endRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};



/**
 * @class
 * @classdesc Abstract class that represents a data context
 * @constructor
 * @abstract
 * @memberOf module:@themost/web/common
 */
function HttpDataContext() {
    Args.check((this.constructor.name !== 'HttpHandler'), new AbstractClassError());
}
/**
 * @returns {*}
 * @abstract
 */
HttpDataContext.prototype.db = function () {
    throw new AbstractMethodError();
};

/**
 * @param {string} name
 * @returns {DataModel}
 * @abstract
 */
HttpDataContext.prototype.model = function (name) {
    throw new AbstractMethodError();
};

/**
 * @param {string} type
 * @returns {*}
 * @abstract
 */
HttpDataContext.prototype.dataTypes = function (type) {
    throw new AbstractMethodError();
};


/**
 * @classdesc HttpRoute class provides routing functionality to HTTP requests
 * @class
 * @constructor
 * @param {string|*=} route - A formatted string or an object which represents an HTTP route response url (e.g. /pages/:name.html, /user/edit.html).
 * @memberOf module:@themost/web/common
 * */
function HttpRoute(route) {
    if (typeof route === 'string') {
        this.route = { url:route };
    }
    else if (typeof route === 'object') {
        this.route = route;
    }
    this.routeData = { };

    this.patterns = {
        int:function() {
            return "^[1-9]([0-9]*)$";
        },
        boolean:function() {
            return "^true|false$"
        },
        decimal:function() {
            return "^\d*\.?\d*$";
        },
        float:function() {
            return "^\d*\.?\d*$";
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
HttpRoute.prototype.isMatch = function (urlToMatch) {
    var self = this;
    if (typeof self.route === 'undefined' || self.route===null) {
        throw new Error("Route may not be null");
    }
    self.routeData = self.routeData || { };
    if (typeof urlToMatch !== 'string')
        return false;
    if (urlToMatch.length === 0)
        return false;
    var str1 = urlToMatch, patternMatch;
    var k = urlToMatch.indexOf('?');
    if (k >= 0)
        str1 = urlToMatch.substr(0, k);
    var re = /(\{([\w\[\]]+)(?::\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*})+))?})|((:)([\w\[\]]+))/ig;
    var match = re.exec(this.route.url), params = [];
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
    var str = this.route.url.replace(re, "([\\w-]+)"),
        matcher = new RegExp("^" + str + "$", "ig");
    match = matcher.exec(str1);
    if (typeof match === 'undefined' || match === null) {
        return false;
    }
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        if (typeof param.pattern !== 'undefined') {
            if (!param.pattern.test(match[i+1])) {
                return false;
            }
        }
        param.value = match[i+1];
    }
    params.forEach(function(x) {
        self.routeData[x.name] = x.value;
    });
    if (self.route.hasOwnProperty("controller")) { self.routeData["controller"] = self.route["controller"]; }
    if (self.route.hasOwnProperty("action")) { self.routeData["action"] = self.route["action"]; }
    return true;
};

/**
 * @class
 * @param {HttpApplication} app
 * @constructor
 * @abstract
 * @memberOf module:@themost/web/common
 */
function HttpApplicationStrategy(app) {
    Args.check((this.constructor.name !== 'HtttApplicationStrategy'), new AbstractClassError());
    Args.notNull(app, 'HTTP Application');
    this[applicationProperty] = app;
}

/**
 * @returns {HttpApplication}
 */
HttpApplicationStrategy.prototype.getApplication = function() {
    return this[applicationProperty];
};


if (typeof exports !== 'undefined') {

    /** @module @themost/web/common */
    module.exports.HttpHandler = HttpHandler;
    module.exports.HttpDataContext = HttpDataContext;
    module.exports.HttpRoute = HttpRoute;
    module.exports.HttpApplicationStrategy = HttpApplicationStrategy;
}

