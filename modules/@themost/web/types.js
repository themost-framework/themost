/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var Args = require('@themost/common/utils').Args;
var LangUtils = require('@themost/common/utils').LangUtils;
var SequentialEventEmitter = require('@themost/common/emitter').SequentialEventEmitter;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;
var AbstractClassError = require('@themost/common/errors').AbstractClassError;
var Symbol = require('symbol');
var applicationProperty = Symbol('application');
var IApplicationService = require('@themost/common/app').IApplicationService;

/**
 * @abstract
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @augments IApplicationService
 */
function HttpApplicationService(app) {
    if (this.constructor === HttpApplicationService.prototype.constructor) {
        throw new AbstractClassError();
    }
    Args.notNull(app, 'HTTP Application');
    this[applicationProperty] = app;
}
LangUtils.inherits(HttpApplicationService,IApplicationService);
/**
 * @returns {HttpApplication}
 */
HttpApplicationService.prototype.getApplication = function() {
    return this[applicationProperty];
};

/**
 * Abstract view engine class
 * @class HttpViewEngine
 * @param {HttpContext} context
 * @constructor
 * @augments {SequentialEventEmitter}
 */
function HttpViewEngine(context) {
    if (this.constructor === HttpViewEngine.prototype.constructor) {
        throw new AbstractClassError();
    }
    /**
     * @name HttpViewEngine#context
     * @type HttpContext
     * @description Gets or sets an instance of HttpContext that represents the current HTTP context.
     */
    /**
     * @type {HttpContext}
     */
    var ctx = context;
    Object.defineProperty(this,'context', {
        get: function() {
            return ctx;
        },
        set: function(value) {
            ctx = value;
        },
        configurable:false,
        enumerable:false
    });
}
LangUtils.inherits(HttpViewEngine, SequentialEventEmitter);
/**
 * @returns {HttpContext}
 */
HttpViewEngine.prototype.getContext = function() {
    return this.context;
};

/**
 * @abstract
 * @description Renders the specified view with the options provided
 * @param {string} file
 * @param {*} data
 * @param {Function} callback
 */
// eslint-disable-next-line no-unused-vars
HttpViewEngine.prototype.render = function(file, data, callback) {
    throw new AbstractMethodError();
};

/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function BeginRequestHandler() {
    if (this.constructor === BeginRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs as the first event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
BeginRequestHandler.prototype.beginRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function ValidateRequestHandler() {
    if (this.constructor === ValidateRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs when a handler is going to validate current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
ValidateRequestHandler.prototype.validateRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function AuthenticateRequestHandler() {
    if (this.constructor === AuthenticateRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs when a handler is going to set current user identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
AuthenticateRequestHandler.prototype.authenticateRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function AuthorizeRequestHandler() {
    if (this.constructor === AuthorizeRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs when a handler has verified user authorization.
 * @param {HttpContext} context
 * @param {Function} callback
 */
AuthorizeRequestHandler.prototype.authorizeRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};
/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function MapRequestHandler() {
    if (this.constructor === MapRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs when the handler is selected to respond to the request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
MapRequestHandler.prototype.mapRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};
/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function PostMapRequestHandler() {
    if (this.constructor === PostMapRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}

/**
 * Occurs when application has mapped the current request to the appropriate handler.
 * @param {HttpContext} context
 * @param {Function} callback
 */
PostMapRequestHandler.prototype.postMapRequest = function(context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function ProcessRequestHandler() {
    if (this.constructor === ProcessRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs when application starts processing current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
ProcessRequestHandler.prototype.processRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function PreExecuteResultHandler() {
    if (this.constructor === PreExecuteResultHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs when application starts executing an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
PreExecuteResultHandler.prototype.preExecuteResult = function (context, callback) {
    callback = callback || function () { };
    return callback();
};
/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function PostExecuteResultHandler() {
    if (this.constructor === PreExecuteResultHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs when application was successfully executes an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
PostExecuteResultHandler.prototype.postExecuteResult = function (context, callback) {
    callback = callback || function () { };
    return callback();
};


/**
 * @class
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
function EndRequestHandler() {
    if (this.constructor === EndRequestHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}
/**
 * Occurs as the first event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
EndRequestHandler.prototype.beginRequest = function (context, callback) {
    callback = callback || function () { };
    return callback();
};

/**
 * @classdesc An abstract class that represents an HTTP Handler
 * @class
 * @abstract
 * @constructor
 */
function HttpHandler() {
    if (this.constructor === HttpHandler.prototype.constructor) {
        throw new AbstractClassError();
    }
}

/**
 * Gets an array of strings which represent the collection of events of an HttpHandler instance
 * @type {Array.<string>}
 */
HttpHandler.Events = [
    'beginRequest',
    'validateRequest',
    'authenticateRequest',
    'authorizeRequest',
    'mapRequest',
    'postMapRequest',
    'preExecuteResult',
    'postExecuteResult',
    'endRequest'
];

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


if (typeof exports !== 'undefined')
{
    module.exports.HttpApplicationService = HttpApplicationService;
    module.exports.HttpViewEngine = HttpViewEngine;
    module.exports.BeginRequestHandler = BeginRequestHandler;
    module.exports.AuthenticateRequestHandler = AuthenticateRequestHandler;
    module.exports.AuthorizeRequestHandler = AuthorizeRequestHandler;
    module.exports.MapRequestHandler = MapRequestHandler;
    module.exports.PostMapRequestHandler = PostMapRequestHandler;
    module.exports.ProcessRequestHandler = ProcessRequestHandler;
    module.exports.PreExecuteResultHandler = PreExecuteResultHandler;
    module.exports.PostExecuteResultHandler = PostExecuteResultHandler;
    module.exports.EndRequestHandler = EndRequestHandler;
    module.exports.HttpHandler = HttpHandler;
}

