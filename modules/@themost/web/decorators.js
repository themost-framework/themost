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
exports.httpGet = httpGet;
exports.httpPost = httpPost;
exports.httpPut = httpPut;
exports.httpDelete = httpDelete;
exports.httpAction = httpAction;
exports.httpParam = httpParam;
exports.httpAuthorize = httpAuthorize;

require('source-map-support/register');

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
 *
 * @param {string} name
 * @param {Function} parser
 * @returns {Function}
 */
function httpParam(name, parser) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        descriptor.value.httpParam = { name: name, parser: parser };
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
        if (typeof descriptor.value !== 'function') {
            throw new DecoratorError();
        }
        if (typeof value === 'undefined') {
            descriptor.value.authorize = true;
        } else if (typeof value === 'boolean') {
            descriptor.value.authorize = value;
        } else {
            throw new TypeError('Authorization flag must be a boolean');
        }
        return descriptor;
    };
}
//# sourceMappingURL=decorators.js.map
