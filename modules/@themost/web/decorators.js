/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var TraceUtils = require('@themost/common/utils').TraceUtils;
var LangUtils = require('@themost/common/utils').LangUtils;
var HttpBadRequestError = require('@themost/common/errors').HttpBadRequestError;
var HttpUnauthorizedError = require('@themost/common/errors').HttpUnauthorizedError;
var HttpConsumer = require('./consumers').HttpConsumer;
var DataTypeValidator = require('@themost/data/data-validator').DataTypeValidator;
var MinLengthValidator = require('@themost/data/data-validator').MinLengthValidator;
var MaxLengthValidator = require('@themost/data/data-validator').MaxLengthValidator;
var MinValueValidator = require('@themost/data/data-validator').MinValueValidator;
var MaxValueValidator = require('@themost/data/data-validator').MaxValueValidator;
var RequiredValidator = require('@themost/data/data-validator').RequiredValidator;
var PatternValidator = require('@themost/data/data-validator').PatternValidator;

/**
 * @class
 * @constructor
 * @extends Error
 * @augments Error
 */
function DecoratorError() {
    DecoratorError.super_.call(this, 'Decorator is not valid on this declaration type.');
}
LangUtils.inherits(DecoratorError, Error);

/**
 * @param {string} name
 * @returns {Function}
 */
function httpController(name) {
    return function (target, key, descriptor) {
        if (typeof target === 'function') {
            target.httpController = true;
        }
        // define controller name
        Object.defineProperty(target, 'httpControllerName', {
            value: name,
            configurable: false,
            enumerable: true,
            writable: true
        });
        return descriptor;
    }
}

function httpGet() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpGet = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpAny() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpGet = true;
            descriptor.value.httpPost = true;
            descriptor.value.httpPut = true;
            descriptor.value.httpDelete = true;
            descriptor.value.httpOptions = true;
            descriptor.value.httpHead = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpPost() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpPost = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpPatch() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpPatch = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpPut() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpPut = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpDelete() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpDelete = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpOptions() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpOptions = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpHead() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpHead = true;
        }
        return descriptor;
    }
}
/**
 * @returns {Function}
 */
function httpAction(name) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        descriptor.value.httpAction = name;
        return descriptor;
    }
}
/**
 *
 * @param {string} name
 * @param {string} alias
 * @returns {Function}
 */
function httpParamAlias(name, alias) {
    if (typeof name !== 'string') {
        throw new TypeError('Parameter name must be a string');
    }
    if (typeof alias !== 'string') {
        throw new TypeError('Parameter alias must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        descriptor.value.httpParamAlias = descriptor.value.httpParamAlias || { };
        descriptor.value.httpParamAlias[name] = alias;
        return descriptor;
    }
}
/**
 * @class
 * @abstract
 * @property {string} name
 * @property {string} type
 * @property {RegExp|string} pattern
 * @property {date|number|*} minValue
 * @property {date|number|*} maxValue
 * @property {number} minLength
 * @property {number} maxLength
 * @property {boolean} required
 * @property {string} message
 * @constructor
 */
// eslint-disable-next-line no-unused-vars
function HttpParamAttributeOptions() {

}

/**
 * @param {HttpParamAttributeOptions|*=} options
 * @returns {Function}
 */
function httpParam(options) {
    if (typeof options !== 'object') { throw new TypeError('Parameter options must be an object'); }
    if (typeof options.name !== 'string') { throw new TypeError('Parameter name must be a string'); }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }

        descriptor.value.httpParams = descriptor.value.httpParams || { };
        descriptor.value.httpParams[options.name] = Object.assign({"type":"Text"}, options);
        if (typeof descriptor.value.httpParam === 'undefined') {
            descriptor.value.httpParam = new HttpConsumer(function (context) {
                var httpParamValidationFailedCallback = function httpParamValidationFailedCallback(context, httpParam, validationResult) {
                    TraceUtils.log(Object.assign(validationResult, {
                        "param":httpParam,
                        "request": {
                            "url":context.request.url,
                            "method":context.request.method
                        }
                    }));
                    return Promise.reject(new HttpBadRequestError('Bad request parameter', httpParam.message || validationResult.message));
                };
                var methodParams = LangUtils.getFunctionParams(descriptor.value);
                var httpParams = descriptor.value.httpParams;
                if (methodParams.length>0) {
                    var k = 0, httpParam, validator, validationResult, functionParam, contextParam;
                    while (k < methodParams.length) {
                        functionParam = methodParams[k];
                        if (typeof context.getParam === 'function') {
                            contextParam = context.getParam(functionParam);
                        }
                        else {
                            contextParam = context.params[functionParam];
                        }
                        if (httpParams) {
                            httpParam = httpParams[functionParam];
                            if (httpParam) {
                                if (typeof httpParam.type === 'string') {
                                    //--validate type
                                    validator = new DataTypeValidator(httpParam.type);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, httpParam, validationResult);
                                    }
                                }
                                if (httpParam.pattern instanceof RegExp) {
                                    //--validate pattern
                                    validator = new PatternValidator(httpParam.pattern);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, httpParam, validationResult);
                                    }
                                }
                                if (typeof httpParam.minLength === 'number') {
                                    //--validate min length
                                    validator = new MinLengthValidator(httpParam.minLength);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, httpParam, validationResult);
                                    }
                                }
                                if (typeof httpParam.maxLength === 'number') {
                                    //--validate max length
                                    validator = new MaxLengthValidator(httpParam.maxLength);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, httpParam, validationResult);
                                    }
                                }
                                if (typeof httpParam.minValue !== 'undefined') {
                                    //--validate min value
                                    validator = new MinValueValidator(httpParam.minValue);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, httpParam, validationResult);
                                    }
                                }
                                if (typeof httpParam.maxValue !== 'undefined') {
                                    //--validate max value
                                    validator = new MaxValueValidator(httpParam.required);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, httpParam, validationResult);
                                    }
                                }

                                if ((typeof httpParam.required !== 'undefined') && (httpParam.required === true)) {
                                    //--validate required value
                                    validator = new RequiredValidator();
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, httpParam, validationResult);
                                    }
                                }
                            }
                        }
                        k += 1;
                    }
                }
                return Promise.resolve();
            });
        }
        return descriptor;
    }
}

/**
 * @param {boolean=} value
 * @returns {Function}
 */
function httpAuthorize(value) {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        var authorize = true;
        if (typeof value === 'boolean') {
            authorize = value;
        }
        if (authorize) {
            descriptor.value.authorize = new HttpConsumer(function (context) {
                if (context.user && context.user.name !== 'anonymous') {
                    return Promise.resolve();
                }
                return Promise.reject(new HttpUnauthorizedError());
            });
        }
        return descriptor;
    };
}

/**
 *
 * @param {Object|Function} proto - The constructor function of a class or the prototype of a class
 * @param {string} key - The name of the property or method where the decorator will be included
 * @param {Function} decorator - The decorator to be included
 */
function defineDecorator(proto, key, decorator) {
    if ((typeof proto !== 'object') && (typeof proto !== 'function')) {
        throw new DecoratorError('Invalid prototype. Expected object or function.');
    }
    if (typeof key !== 'string') {
        throw new DecoratorError('Invalid property name. Expected string.');
    }
    if (typeof decorator !== 'function') {
        throw new DecoratorError('Invalid decorator. Expected function.');
    }
    decorator(proto, key, Object.getOwnPropertyDescriptor(proto, key));
}

/**
 * @param {string} name
 * @param {Function|HttpConsumer} consumer
 * @returns {Function}
 */
function httpActionConsumer(name, consumer) {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        if (consumer instanceof HttpConsumer) {
            //set consumer
            descriptor.value[name] = consumer;
            //and exit
            return descriptor;
        }
        //validate consumer function
        if (typeof consumer !== 'function') {
            throw new Error('Consumer may be a function.');
        }
        descriptor.value[name] = new HttpConsumer(consumer);
        return descriptor;
    };
}

/**
 * Defines an http route that is going to be registered by an http controller
 * @param {string} url
 * @param {string=} format
 * @param {number=} index
 * @returns {Function}
 */
function httpRoute(url, format, index) {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            Object.defineProperty(descriptor.value, 'httpRoute', {
               get: function () {
                   /**
                    * @type {HttpRouteConfiguration}
                    */
                   var route = {
                       url: url,
                       controller: target.httpControllerName || target.name,
                       action: descriptor.value.httpAction,
                       format: format
                   };
                   if (descriptor.value.hasOwnProperty('httpAny') === false) {
                       // set httpHead if does not exists
                       if (descriptor.value.hasOwnProperty('httpHead') === false) {
                           descriptor.value.httpHead = true;
                       }
                       // set httpOptions if does not exists
                       if (descriptor.value.hasOwnProperty('httpOptions') === false) {
                           descriptor.value.httpOptions = true;
                       }
                       // enumerate http methods and format allow attribute
                       var allowString = [
                           'httpGet',
                           'httpHead',
                           'httpOptions',
                           'httpPost',
                           'httpPut',
                           'httpDelete',
                           'httpPatch' ].filter( function(httpKey) {
                           return descriptor.value.hasOwnProperty(httpKey) && descriptor.value[httpKey];
                       }).map(function(httpKey) {
                           return httpKey.replace(/^http/,'').toUpperCase();
                       }).join(',');
                       // set allow attribute
                       Object.assign(route, {
                           allow: allowString
                       });
                   }
                   return route;
               },
                configurable: false,
                enumerable: true
            });
            // set route index
            Object.defineProperty(descriptor.value, 'httpRouteIndex', {
                value: index || 0
            });
        }
        return descriptor;
    }
}

//extend object
if (typeof Object.defineDecorator === 'undefined') {
    /**
     * @function defineDecorator
     * @param {Object|Function} proto - The constructor function of a class or the prototype of a class
     * @param {string} key - The name of the property or method where the decorator will be included
     * @param {Function} decorator - The decorator to be included
     * @memberOf Object
     * @static
     */
    Object.defineDecorator = defineDecorator;
}

module.exports.DecoratorError = DecoratorError;
module.exports.httpGet = httpGet;
module.exports.httpAny = httpAny;
module.exports.httpPost = httpPost;
module.exports.httpPut = httpPut;
module.exports.httpPatch = httpPatch;
module.exports.httpDelete = httpDelete;
module.exports.httpOptions = httpOptions;
module.exports.httpHead = httpHead;
module.exports.httpAction = httpAction;
module.exports.httpRoute = httpRoute;
module.exports.httpController = httpController;
module.exports.httpParamAlias = httpParamAlias;
module.exports.httpParam = httpParam;
module.exports.httpAuthorize = httpAuthorize;
module.exports.defineDecorator = defineDecorator;
module.exports.httpActionConsumer = httpActionConsumer;
