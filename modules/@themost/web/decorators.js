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
exports.DecoratorError = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.httpGet = httpGet;
exports.httpPost = httpPost;
exports.httpPut = httpPut;
exports.httpDelete = httpDelete;
exports.httpAction = httpAction;
exports.httpParam = httpParam;
exports.httpAuthorize = httpAuthorize;

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _errors = require('@themost/common/errors');

var HttpBadRequestError = _errors.HttpBadRequestError;
var HttpUnauthorizedError = _errors.HttpUnauthorizedError;

var _consumers = require('./consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;
var LangUtils = _utils.LangUtils;
var Args = _utils.Args;

var _validators = require('@themost/data/validators');

var DataTypeValidator = _validators.DataTypeValidator;
var MaxLengthValidator = _validators.MaxLengthValidator;
var MinLengthValidator = _validators.MinLengthValidator;
var PatternValidator = _validators.PatternValidator;
var RequiredValidator = _validators.RequiredValidator;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _extendableBuiltin(cls) {
    function ExtendableBuiltin() {
        var instance = Reflect.construct(cls, Array.from(arguments));
        Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
        return instance;
    }

    ExtendableBuiltin.prototype = Object.create(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

/**
 * @class
 * @extends Error
 */
var DecoratorError = exports.DecoratorError = function (_extendableBuiltin2) {
    _inherits(DecoratorError, _extendableBuiltin2);

    function DecoratorError() {
        _classCallCheck(this, DecoratorError);

        return _possibleConstructorReturn(this, (DecoratorError.__proto__ || Object.getPrototypeOf(DecoratorError)).call(this, 'Decorator is not valid on this declaration type.'));
    }

    return DecoratorError;
}(_extendableBuiltin(Error));

function httpGet() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpGet = true;
        }
        return descriptor;
    };
}

function httpPost() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpPost = true;
        return descriptor;
    };
}

function httpPut() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpPut = true;
        return descriptor;
    };
}

function httpDelete() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpDelete = true;
        return descriptor;
    };
}
/**
 *
 * @param {string} name
 * @returns {Function}
 */
function httpAction(name) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpAction = name;
        return descriptor;
    };
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
    "use strict";
}

/**
 * @param {*=} options
 * @returns {Function}
 */
function httpParam(options) {
    if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
        throw new TypeError('Parameter options must be an object');
    }
    if (typeof options.name !== 'string') {
        throw new TypeError('Parameter name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }

        descriptor.value.httpParams = descriptor.value.httpParams || {};
        descriptor.value.httpParams[options.name] = _.extend({ "type": "Text" }, options);
        if (typeof descriptor.value.httpParam === 'undefined') {
            descriptor.value.httpParam = new HttpConsumer(function (context) {
                var httpParamValidationFailedCallback = function httpParamValidationFailedCallback(context, httpParam, validationResult) {
                    "use strict";

                    TraceUtils.log(_.assign(validationResult, {
                        "param": httpParam,
                        "request": {
                            "url": context.request.url,
                            "method": context.request.method
                        }
                    }));
                    return Q.reject(new HttpBadRequestError('Bad request parameter', httpParam.message || validationResult.message));
                };
                var methodParams = LangUtils.getFunctionParams(descriptor.value);
                var httpParams = descriptor.value.httpParams;
                if (methodParams.length > 0) {
                    var k = 0,
                        _httpParam = void 0,
                        validator = void 0,
                        validationResult = void 0,
                        functionParam = void 0,
                        contextParam = void 0;
                    while (k < methodParams.length) {
                        functionParam = methodParams[k];
                        if (typeof context.getParam === 'function') {
                            contextParam = context.getParam(functionParam);
                        } else {
                            contextParam = context.params[functionParam];
                        }
                        if (_.isObject(httpParams)) {
                            _httpParam = httpParams[functionParam];
                            if (_.isObject(_httpParam)) {
                                if (typeof _httpParam.type === 'string') {
                                    //--validate type
                                    validator = new DataTypeValidator(_httpParam.type);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, _httpParam, validationResult);
                                    }
                                }
                                if (_httpParam.pattern instanceof RegExp) {
                                    //--validate pattern
                                    validator = new PatternValidator(_httpParam.pattern);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, _httpParam, validationResult);
                                    }
                                }
                                if (typeof _httpParam.minLength === 'number') {
                                    //--validate min length
                                    validator = new MinLengthValidator(_httpParam.minLength);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, _httpParam, validationResult);
                                    }
                                }
                                if (typeof _httpParam.maxLength === 'number') {
                                    //--validate max length
                                    validator = new MaxLengthValidator(_httpParam.maxLength);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, _httpParam, validationResult);
                                    }
                                }
                                if (typeof _httpParam.minValue !== 'undefined') {
                                    //--validate min value
                                    validator = new MinValueValidator(_httpParam.minValue);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, _httpParam, validationResult);
                                    }
                                }
                                if (typeof _httpParam.maxValue !== 'undefined') {
                                    //--validate max value
                                    validator = new MaxValueValidator(_httpParam.required);
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, _httpParam, validationResult);
                                    }
                                }

                                if (typeof _httpParam.required !== 'undefined' && _httpParam.required === true) {
                                    //--validate required value
                                    validator = new RequiredValidator();
                                    validator.setContext(context);
                                    validationResult = validator.validateSync(contextParam);
                                    if (validationResult) {
                                        return httpParamValidationFailedCallback(context, _httpParam, validationResult);
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
    };
}
/**
 *
 * @param {boolean=} value
 * @returns {Function}
 */
function httpAuthorize(value) {
    return function (target, key, descriptor) {
        Args.check(typeof descriptor.value === 'function', new DecoratorError());
        var authorize = true;
        if (typeof value === 'boolean') {
            authorize = value;
        }
        if (authorize) {
            descriptor.value.authorize = new HttpConsumer(function (context) {
                if (context.user && context.user.name !== 'anonymous') {
                    return Q();
                }
                return Q.reject(new HttpUnauthorizedError());
            });
        }
        return descriptor;
    };
}
//# sourceMappingURL=decorators.js.map
