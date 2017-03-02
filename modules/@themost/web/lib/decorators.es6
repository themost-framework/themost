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
import 'source-map-support/register';

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
 *
 * @param {string} name
 * @param {Function} parser
 * @returns {Function}
 */
export function httpParam(name, parser) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpParam = { name:name, parser:parser };
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
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        if (typeof value === 'undefined') {
            descriptor.value.authorize = true;
        }
        else if (typeof value === 'boolean') {
            descriptor.value.authorize = value;
        }
        else {
            throw new TypeError('Authorization flag must be a boolean');
        }
        return descriptor;
    }
}