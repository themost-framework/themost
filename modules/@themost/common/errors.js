/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var LangUtils = require("./utils").LangUtils;
var _ = require('lodash');
var errors = require('./http-error-codes').Errors;


/**
 * @classdesc Thrown when an application tries to call an abstract method.
 * @class
 * @param {string=} msg
 * @constructor
 * @augments Error
 */
function AbstractMethodError(msg) {
    AbstractMethodError.super_.bind(this)(msg);
    this.message = msg || 'Class does not implement inherited abstract method.';
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
    }
}
LangUtils.inherits(AbstractMethodError, Error);

/**
 * @classdesc Thrown when an application tries to instantiate an abstract class.
 * @class
 * @param {string=} msg
 * @constructor
 * @extends Error
 */
function AbstractClassError(msg) {
    AbstractClassError.super_.bind(this)(msg);
    this.message = msg || 'An abstract class cannot be instantiated.';
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
    }
}
LangUtils.inherits(AbstractClassError, Error);

/**
 * @classdesc Represents an error with a code.
 * @class
 * @param {string} msg
 * @param {string} code
 * @constructor
 * @extends Error
 */
function CodedError(msg, code) {
    CodedError.super_.bind(this)(msg);
    this.message = msg;
    this.code = code;
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
    }
}
LangUtils.inherits(CodedError, Error);

/**
 * @classdesc Thrown when an application tries to access a file which does not exist.
 * @class
 * @param {string=} msg
 * @constructor
 * @extends CodedError
 */
function FileNotFoundError(msg) {
    FileNotFoundError.super_.bind(this)(msg, "EFOUND");
}
LangUtils.inherits(FileNotFoundError, CodedError);

/**
 * @classdesc Represents an HTTP error.
 * @class
 * @param {number} status
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends CodedError
 */
function HttpError(status, message, innerMessage) {
    HttpError.super_.bind(this)(message, "EHTTP");
    var hstatus = _.isNumber(status) ? status : 500;
    var err = _.find(errors, function(x) {
        return x.statusCode === hstatus;
    });
    if (err) {
        this.title = err.title;
        this.message = message || err.message;
        this.statusCode = err.statusCode;
    }
    else {
        this.title = 'Internal Server Error';
        this.message = message || 'The server encountered an internal error and was unable to complete the request.';
        this.statusCode = hstatus
    }
    if (typeof innerMessage !== 'undefined') {
        this.innerMessage = innerMessage;
    }
}
LangUtils.inherits(HttpError, CodedError);

/**
 * @param {Error} err
 * @returns {Error|HttpError}
 */
HttpError.create = function(err) {
    if (_.isNil(err)) {
        return new HttpError(500);
    }
    if (err.hasOwnProperty('statusCode')) {
        return _.assign(new HttpError(err.statusCode, err.message), err);
    }
    else {
        return _.assign(new HttpError(500, err.message), err);
    }
};

/**
 * @classdesc Represents a 400 HTTP Bad Request error.
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpBadRequestError(message, innerMessage) {
    HttpBadRequestError.super_.bind(this)(400, message, innerMessage);
}
LangUtils.inherits(HttpBadRequestError, HttpError);

/**
 * @classdesc Represents a 404 HTTP Not Found error.
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @property {string} resource - Gets or sets the requested resource which could not to be found
 * @extends HttpError
 */
function HttpNotFoundError(message, innerMessage) {
    HttpNotFoundError.super_.bind(this)(404, message, innerMessage);
}
LangUtils.inherits(HttpNotFoundError, HttpError);

/**
 * @classdesc Represents a 405 HTTP Method Not Allowed error.
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpMethodNotAllowedError(message, innerMessage) {
    HttpMethodNotAllowedError.super_.bind(this)(405, message, innerMessage);
}
LangUtils.inherits(HttpMethodNotAllowedError, HttpError);

/**
 * @classdesc Represents a 401 HTTP Unauthorized error.
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpUnauthorizedError(message, innerMessage) {
    HttpUnauthorizedError.super_.bind(this)(401, message, innerMessage);
}
LangUtils.inherits(HttpUnauthorizedError, HttpError);

/**
 * @classdesc HTTP 406 Not Acceptable exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpNotAcceptableError(message, innerMessage) {
    HttpNotAcceptableError.super_.bind(this)(406, message, innerMessage);
}
LangUtils.inherits(HttpNotAcceptableError, HttpError);

/**
 * @classdesc HTTP 408 RequestTimeout exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpRequestTimeoutError(message, innerMessage) {
    HttpRequestTimeoutError.super_.bind(this)(408, message, innerMessage);
}
LangUtils.inherits(HttpRequestTimeoutError, HttpError);

/**
 * @classdesc HTTP 409 Conflict exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpConflictError(message, innerMessage) {
    HttpConflictError.super_.bind(this)(409, message, innerMessage);
}
LangUtils.inherits(HttpConflictError, HttpError);

/**
 * @classdesc HTTP 498 Token Expired exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpTokenExpiredError(message, innerMessage) {
    HttpTokenExpiredError.super_.bind(this)(498, message, innerMessage);
}
LangUtils.inherits(HttpTokenExpiredError, HttpError);

/**
 * @classdesc HTTP 499 Token Required exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpTokenRequiredError(message, innerMessage) {
    HttpTokenRequiredError.super_.bind(this)(498, message, innerMessage);
}
LangUtils.inherits(HttpTokenRequiredError, HttpError);

/**
 * @classdesc Represents a 403 HTTP Forbidden error.
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpForbiddenError(message, innerMessage) {
    HttpForbiddenError.super_.bind(this)(403, message, innerMessage);
}
LangUtils.inherits(HttpForbiddenError, HttpError);

/**
 * @classdesc Represents a 500 HTTP Internal Server error.
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @constructor
 * @extends HttpError
 */
function HttpServerError(message, innerMessage) {
    HttpServerError.super_.bind(this)(500, message, innerMessage);
}
LangUtils.inherits(HttpServerError, HttpError);

/**
 * @classdesc Extends Error object for throwing exceptions on data operations
 * @class
 * @param {string=} code - A string that represents an error code
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @param {string=} model - The target model
 * @param {string=} field - The target field
 * @param {*} additionalData - Additional data associated with this error
 * @constructor
 * @property {string} code - A string that represents an error code e.g. EDATA
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the appropriate HTTP error.
 * @property {*} additionalData - Additional data associated with this error
 * @augments CodedError
 */
function DataError(code, message, innerMessage, model, field, additionalData) {
    DataError.super_.bind(this)(message, code);
    this.code  = code || 'EDATA';
    if (typeof model !== 'undefined') {
        this.model = model;
    }
    if (typeof field !== 'undefined') {
        this.field = field;
    }
    this.message = message || 'A general data error occured.';
    if (typeof innerMessage !== 'undefined') {
        this.innerMessage = innerMessage;
    }
    this.additionalData = additionalData;
}
LangUtils.inherits(DataError, CodedError);




/**
 * Thrown when an application attempts to access a data object that cannot be found.
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @param {string=} model - The target model
 * @param {string=} field - The target field
 * @constructor
 * @extends DataError
 */
function NotNullError(message, innerMessage, model,field) {
    NotNullError.super_.bind(this)('ENULL', message || 'A value is required.', innerMessage, model,field);
    this.statusCode = 409;
}
LangUtils.inherits(NotNullError, DataError);

/**
 * Thrown when an application attempts to access a data object that cannot be found.
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @param {string=} model - The target model
 * @constructor
 * @extends DataError
 */
function DataNotFoundError(message, innerMessage, model) {
    DataNotFoundError.super_.bind(this)('EFOUND', message || 'The requested data was not found.', innerMessage, model);
    this.statusCode = 404;
}
LangUtils.inherits(DataNotFoundError, DataError);

/**
 * Thrown when a data object operation is denied
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @param {string=} model - The target model
 * @constructor
 * @extends DataError
 */
function AccessDeniedError(message, innerMessage, model) {
    AccessDeniedError.super_.bind(this)('EACCESS', ('Access Denied' || message) , innerMessage, model);
    this.statusCode = 401;
}
LangUtils.inherits(AccessDeniedError, DataError);

/**
 * Thrown when a unique constraint is being violated
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @param {string=} model - The target model
 * @constructor
 * @extends DataError
 */
function UniqueConstraintError(message, innerMessage, model) {
    UniqueConstraintError.super_.bind(this)('EUNQ', message || 'A unique constraint violated', innerMessage, model);
}
LangUtils.inherits(UniqueConstraintError, DataError);


if (typeof exports !== 'undefined') {
    module.exports.AbstractMethodError = AbstractMethodError;
    module.exports.AbstractClassError = AbstractClassError;
    module.exports.FileNotFoundError = FileNotFoundError;
    module.exports.HttpError = HttpError;
    module.exports.HttpBadRequestError = HttpBadRequestError;
    module.exports.HttpNotFoundError = HttpNotFoundError;
    module.exports.HttpMethodNotAllowedError = HttpMethodNotAllowedError;
    module.exports.HttpNotAcceptableError = HttpNotAcceptableError;
    module.exports.HttpConflictError = HttpConflictError;
    module.exports.HttpRequestTimeoutError = HttpRequestTimeoutError;
    module.exports.HttpTokenExpiredError = HttpTokenExpiredError;
    module.exports.HttpTokenRequiredError = HttpTokenRequiredError;
    module.exports.HttpUnauthorizedError = HttpUnauthorizedError;
    module.exports.HttpForbiddenError = HttpForbiddenError;
    module.exports.HttpServerError = HttpServerError;
    module.exports.DataError = DataError;
    module.exports.DataNotFoundError = DataNotFoundError;
    module.exports.NotNullError = NotNullError;
    module.exports.AccessDeniedError = AccessDeniedError;
    module.exports.UniqueConstraintError = UniqueConstraintError;
}