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

/**
 * @module @themost/common
 */

/**
 * @classdesc Abstract Method Exception
 * @class
 * @augments Error
 * */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _extendableBuiltin5(cls) {
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

function _extendableBuiltin3(cls) {
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AbstractMethodError = exports.AbstractMethodError = function (_TypeError) {
    _inherits(AbstractMethodError, _TypeError);

    function AbstractMethodError(message) {
        _classCallCheck(this, AbstractMethodError);

        return _possibleConstructorReturn(this, (AbstractMethodError.__proto__ || Object.getPrototypeOf(AbstractMethodError)).call(this, message || 'Class does not implement inherited abstract method.'));
    }

    return AbstractMethodError;
}(TypeError);

/**
 * @classdesc Abstract Class Exception
 * @class
 * @augments Error
 * */


var AbstractClassError = exports.AbstractClassError = function (_TypeError2) {
    _inherits(AbstractClassError, _TypeError2);

    function AbstractClassError(message) {
        _classCallCheck(this, AbstractClassError);

        return _possibleConstructorReturn(this, (AbstractClassError.__proto__ || Object.getPrototypeOf(AbstractClassError)).call(this, message || 'An abstract class cannot be instantiated.'));
    }

    return AbstractClassError;
}(TypeError);

/**
 * @class
 * @augments Error
 */


var FileNotFoundError = exports.FileNotFoundError = function (_extendableBuiltin2) {
    _inherits(FileNotFoundError, _extendableBuiltin2);

    function FileNotFoundError(message) {
        _classCallCheck(this, FileNotFoundError);

        return _possibleConstructorReturn(this, (FileNotFoundError.__proto__ || Object.getPrototypeOf(FileNotFoundError)).call(this, message || 'File not found'));
    }

    return FileNotFoundError;
}(_extendableBuiltin(Error));

/**
 * @class
 * @augments Error
 */


var HttpError = exports.HttpError = function (_extendableBuiltin4) {
    _inherits(HttpError, _extendableBuiltin4);

    /**
     * @constructor
     * @param {number=} status
     * @param {string=} message
     * @param {string=} innerMessage
     */
    function HttpError(status, message, innerMessage) {
        _classCallCheck(this, HttpError);

        var _this4 = _possibleConstructorReturn(this, (HttpError.__proto__ || Object.getPrototypeOf(HttpError)).call(this, message));

        var errors = require('./resources/http-error-codes.json');
        var hstatus = typeof status === 'undefined' || status == null ? 500 : parseInt(status);
        var err = errors.find(function (x) {
            return x.status === hstatus;
        });
        if (err) {
            _this4.title = err.title;
            _this4.message = message || err.message;
            _this4.status = err.status;
        } else {
            _this4.title = 'Internal Server Error';
            _this4.message = message || 'The server encountered an internal error and was unable to complete the request.';
            _this4.status = hstatus;
        }
        _this4.innerMessage = innerMessage;
        return _this4;
    }

    /**
     * @param {Error} err
     * @returns {Error|HttpError}
     */


    _createClass(HttpError, null, [{
        key: 'create',
        value: function create(err) {
            if (typeof err === 'undefined' || err == null) return new HttpError();else {
                if (err.status) return new HttpError(err.status, err.message);else return new HttpError(500, err.message);
            }
        }
    }]);

    return HttpError;
}(_extendableBuiltin3(Error));

/**
 * @classdesc HTTP 400 Bad Request exception class
 * @class
 * */


var HttpBadRequestError = exports.HttpBadRequestError = function (_HttpError) {
    _inherits(HttpBadRequestError, _HttpError);

    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    function HttpBadRequestError(message, innerMessage) {
        _classCallCheck(this, HttpBadRequestError);

        return _possibleConstructorReturn(this, (HttpBadRequestError.__proto__ || Object.getPrototypeOf(HttpBadRequestError)).call(this, 400, message, innerMessage));
    }

    return HttpBadRequestError;
}(HttpError);

/**
 * @classdesc HTTP 404 Not Found Exception class
 * @class
 * @augments HttpError
 * */


var HttpNotFoundError = exports.HttpNotFoundError = function (_HttpError2) {
    _inherits(HttpNotFoundError, _HttpError2);

    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    function HttpNotFoundError(message, innerMessage) {
        _classCallCheck(this, HttpNotFoundError);

        return _possibleConstructorReturn(this, (HttpNotFoundError.__proto__ || Object.getPrototypeOf(HttpNotFoundError)).call(this, 404, message, innerMessage));
    }

    return HttpNotFoundError;
}(HttpError);

/**
 * @classdesc HTTP 405 Method Not Allowed exception class
 * @class
 * @augments HttpError
 * */


var HttpMethodNotAllowedError = exports.HttpMethodNotAllowedError = function (_HttpError3) {
    _inherits(HttpMethodNotAllowedError, _HttpError3);

    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    function HttpMethodNotAllowedError(message, innerMessage) {
        _classCallCheck(this, HttpMethodNotAllowedError);

        return _possibleConstructorReturn(this, (HttpMethodNotAllowedError.__proto__ || Object.getPrototypeOf(HttpMethodNotAllowedError)).call(this, 405, message, innerMessage));
    }

    return HttpMethodNotAllowedError;
}(HttpError);

/**
 * @classdesc HTTP 401 Unauthorized Exception class
 * @class
 * @augments HttpError
 * */


var HttpUnauthorizedError = exports.HttpUnauthorizedError = function (_HttpError4) {
    _inherits(HttpUnauthorizedError, _HttpError4);

    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    function HttpUnauthorizedError(message, innerMessage) {
        _classCallCheck(this, HttpUnauthorizedError);

        return _possibleConstructorReturn(this, (HttpUnauthorizedError.__proto__ || Object.getPrototypeOf(HttpUnauthorizedError)).call(this, 401, message, innerMessage));
    }

    return HttpUnauthorizedError;
}(HttpError);

/**
 * HTTP 403 Forbidden Exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @augments HttpError
 * */


var HttpForbiddenError = exports.HttpForbiddenError = function (_HttpError5) {
    _inherits(HttpForbiddenError, _HttpError5);

    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    function HttpForbiddenError(message, innerMessage) {
        _classCallCheck(this, HttpForbiddenError);

        return _possibleConstructorReturn(this, (HttpForbiddenError.__proto__ || Object.getPrototypeOf(HttpForbiddenError)).call(this, 403, message, innerMessage));
    }

    return HttpForbiddenError;
}(HttpError);

/**
 * @classdesc HTTP 500 Internal Server Error Exception class
 * @class
 * @augments HttpError
 * */


var HttpServerError = exports.HttpServerError = function (_HttpError6) {
    _inherits(HttpServerError, _HttpError6);

    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    function HttpServerError(message, innerMessage) {
        _classCallCheck(this, HttpServerError);

        return _possibleConstructorReturn(this, (HttpServerError.__proto__ || Object.getPrototypeOf(HttpServerError)).call(this, 500, message, innerMessage));
    }

    return HttpServerError;
}(HttpError);

/**
 * @classdesc Extends Error object for throwing exceptions on data operations
 * @class
 * @property {string} code - A string that represents an error code e.g. EDATA
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error.
 * @augments Error
 */


var DataError = exports.DataError = function (_extendableBuiltin6) {
    _inherits(DataError, _extendableBuiltin6);

    /* @constructor
     * @param {string=} code - A string that represents an error code
     * @param {string=} message - The error message
     * @param {string=} innerMessage - The error inner message
     * @param {string=} model - The target model
     * @param {string=} field - The target field
     */
    function DataError(code, message, innerMessage, model, field) {
        _classCallCheck(this, DataError);

        var _this11 = _possibleConstructorReturn(this, (DataError.__proto__ || Object.getPrototypeOf(DataError)).call(this));

        _this11.code = code || 'EDATA';
        if (model) _this11.model = model;
        if (field) _this11.field = field;
        _this11.message = message || 'A general data error occured.';
        if (innerMessage) _this11.innerMessage = innerMessage;
        return _this11;
    }

    return DataError;
}(_extendableBuiltin5(Error));

/**
 * @classdesc Extends Error object for throwing not null exceptions.
 * @class
 * @property {string} code - A string that represents an error code. The default error code is ENULL.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error. The default status is 409 (Conflict)
 * @property {string} model - The target model name
 * @property {string} field - The target field name
 * @augments DataError
 */


var NotNullError = exports.NotNullError = function (_DataError) {
    _inherits(NotNullError, _DataError);

    /**
     * @constructor
     * @param {string=} message - The error message
     * @param {string=} innerMessage - The error inner message
     * @param {string=} model - The target model
     * @param {string=} field - The target field
     */
    function NotNullError(message, innerMessage, model, field) {
        _classCallCheck(this, NotNullError);

        var _this12 = _possibleConstructorReturn(this, (NotNullError.__proto__ || Object.getPrototypeOf(NotNullError)).call(this, 'ENULL', message || 'A value is required', innerMessage, model, field));

        _this12.status = 409;
        return _this12;
    }

    return NotNullError;
}(DataError);

/**
 * @classdesc Extends Error object for throwing not found exceptions.
 * @class
 * @property {string} code - A string that represents an error code. The default error code is EFOUND.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error. The default status is 404 (Conflict)
 * @property {string} model - The target model name
 * @augments DataError
 */


var DataNotFoundError = exports.DataNotFoundError = function (_DataError2) {
    _inherits(DataNotFoundError, _DataError2);

    /**
     * @constructor
     * @param {string=} message - The error message
     * @param {string=} innerMessage - The error inner message
     * @param {string=} model - The target model
     */
    function DataNotFoundError(message, innerMessage, model) {
        _classCallCheck(this, DataNotFoundError);

        var _this13 = _possibleConstructorReturn(this, (DataNotFoundError.__proto__ || Object.getPrototypeOf(DataNotFoundError)).call(this, 'EFOUND', message || 'The requested data was not found.', innerMessage, model));

        _this13.status = 404;
        return _this13;
    }

    return DataNotFoundError;
}(DataError);

/**
 * @classdesc Extends Error object for throwing unique constraint exceptions.
 * @class
 * @property {string} code - A string that represents an error code. The default error code is ENULL.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error. The default status is 409 (Conflict)
 * @property {string} model - The target model name
 * @property {string} constraint - The target constraint name
 * @augments DataError
 */


var UniqueConstraintError = exports.UniqueConstraintError = function (_DataError3) {
    _inherits(UniqueConstraintError, _DataError3);

    /* @constructor
     * @param {string=} message - The error message
     * @param {string=} innerMessage - The error inner message
     * @param {string=} model - The target model
     * @param {string=} constraint - The target constraint
     */
    function UniqueConstraintError(message, innerMessage, model, constraint) {
        _classCallCheck(this, UniqueConstraintError);

        var _this14 = _possibleConstructorReturn(this, (UniqueConstraintError.__proto__ || Object.getPrototypeOf(UniqueConstraintError)).call(this, 'EUNQ', message || 'A unique constraint violated', innerMessage, model));

        if (constraint) _this14.constraint = constraint;
        _this14.status = 409;
        return _this14;
    }

    return UniqueConstraintError;
}(DataError);

/**
 * @classdesc Represents an access denied data exception.
 * @class
 *
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @property {string} code - A string that represents an error code. The error code is EACCESS.
 * @property {number} status - A number that represents an error status. The error status is 401.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @augments DataError
 */


var AccessDeniedError = exports.AccessDeniedError = function (_DataError4) {
    _inherits(AccessDeniedError, _DataError4);

    /* @constructor
     * @param {string=} message - The error message
     * @param {string=} innerMessage - The error inner message
     */
    function AccessDeniedError(message, innerMessage) {
        _classCallCheck(this, AccessDeniedError);

        var _this15 = _possibleConstructorReturn(this, (AccessDeniedError.__proto__ || Object.getPrototypeOf(AccessDeniedError)).call(this, 'EACCESS', 'Access Denied' || message, innerMessage));

        _this15.status = 401;
        return _this15;
    }

    return AccessDeniedError;
}(DataError);
//# sourceMappingURL=errors.js.map
