/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var _ = require('lodash');

/**
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
 */
function httpController() {
    return function (target, key, descriptor) {
        if (typeof target === 'function') {
            target.httpController = true;
        }
        return descriptor;
    }
}

/**
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
 */
function httpGet() {
    return function (target, key, descriptor) {
        if (typeof descriptor.value === 'function') {
            descriptor.value.httpGet = true;
        }
        return descriptor;
    }
}

/**
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
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
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
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
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
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
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
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
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
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
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
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
 *
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
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
 * @memberOf module:@themost/web/decorators
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
 * @memberOf module:@themost/web/decorators
 */
function HttpParamAttributeOptions() {
    "use strict";
}

/**
 * @param {HttpParamAttributeOptions|*=} options
 * @returns {Function}
 * @memberOf module:@themost/web/decorators
 */
function httpParam(options) {
    if (typeof options !== 'object') { throw new TypeError('Parameter options must be an object'); }
    if (typeof options.name !== 'string') { throw new TypeError('Parameter name must be a string'); }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        descriptor.value.httpParam = descriptor.value.httpParam || { };
        descriptor.value.httpParam[options.name] = _.extend({"type":"Text"}, options);
        return descriptor;
    }
}

if (typeof exports !== 'undefined') {
    /**
     * @module @themost/web/decorators
     */
    module.exports.httpGet = httpGet;
    module.exports.httpAny = httpAny;
    module.exports.httpPost = httpPost;
    module.exports.httpPut = httpPut;
    module.exports.httpDelete = httpDelete;
    module.exports.httpOptions = httpOptions;
    module.exports.httpHead = httpHead;
    module.exports.httpAction = httpAction;
    module.exports.httpController = httpController;
    module.exports.httpParamAlias = httpParamAlias;
    module.exports.httpParam = httpParam;
}
