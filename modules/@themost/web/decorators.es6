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
import _ from 'lodash';
import Q from 'q';
import {HttpBadRequestError} from '@themost/common/errors';
import {HttpConsumer} from './consumers';
import {HttpUnauthorizedError} from "@themost/common/errors";
import {TraceUtils} from "@themost/common/utils";
import {LangUtils} from "@themost/common/utils";
import {DataTypeValidator,MinValueValidator, MaxValueValidator,MaxLengthValidator,MinLengthValidator,PatternValidator,RequiredValidator} from '@themost/data/validators';
import {Args} from "@themost/common/utils";

/**
 * @class
 * @extends Error
 */
export class DecoratorError extends Error {
    constructor() {
        super('Decorator is not valid on this declaration type.');
    }
}

export function httpGet() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpGet = true;
        }
        return descriptor;
    }
}

export function httpPost() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpPost = true;
        return descriptor;
    }
}

export function httpPut() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpPut = true;
        return descriptor;
    }
}

export function httpDelete() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpDelete = true;
        return descriptor;
    }
}
/**
 *
 * @param {string} name
 * @returns {Function}
 */
export function httpAction(name) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpAction = name;
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
function HttpParamAttributeOptions() {
    //
}

/**
 * @param {*=} options
 * @returns {Function}
 */
export function httpParam(options) {
    if (typeof options !== 'object') { throw new TypeError('Parameter options must be an object'); }
    if (typeof options.name !== 'string') { throw new TypeError('Parameter name must be a string'); }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }

        descriptor.value.httpParams = descriptor.value.httpParams || { };
        descriptor.value.httpParams[options.name] = _.extend({"type":"Text"}, options);
        if (typeof descriptor.value.httpParam === 'undefined') {
            descriptor.value.httpParam = new HttpConsumer((context)=> {
                const httpParamValidationFailedCallback = function httpParamValidationFailedCallback(context, httpParam, validationResult) {
                    TraceUtils.log(_.assign(validationResult, {
                        "param":httpParam,
                        "request": {
                            "url":context.request.url,
                            "method":context.request.method
                        }
                    }));
                    return Q.reject(new HttpBadRequestError('Bad request parameter', httpParam.message || validationResult.message));
                };
                const methodParams = LangUtils.getFunctionParams(descriptor.value);
                const httpParams = descriptor.value.httpParams;
                if (methodParams.length>0) {
                    let k = 0, httpParam, validator, validationResult, functionParam, contextParam;
                    while (k < methodParams.length) {
                        functionParam = methodParams[k];
                        if (typeof context.getParam === 'function') {
                            contextParam = context.getParam(functionParam);
                        }
                        else {
                            contextParam = context.params[functionParam];
                        }
                        if (_.isObject(httpParams)) {
                            httpParam = httpParams[functionParam];
                            if (_.isObject(httpParam)) {
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
                return Q();
            });
        }
        return descriptor;
    }
}
/**
 *
 * @param {boolean=} value
 * @returns {Function}
 */
export function httpAuthorize(value) {
    return function (target, key, descriptor) {
        Args.check(typeof descriptor.value === 'function', new DecoratorError());
        let authorize = true;
        if (typeof value === 'boolean') {
            authorize = value;
        }
        if (authorize) {
            descriptor.value.authorize = new HttpConsumer((context) => {
                if (context.user && context.user.name !== 'anonymous') {
                    return Q();
                }
                return Q.reject(new HttpUnauthorizedError());
            });
        }
        return descriptor;
    }
}