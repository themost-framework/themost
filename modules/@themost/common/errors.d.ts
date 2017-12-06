export interface IHttpErrorCode {
    title: string;
    status: number;
    message: string;
}
export interface IStatusError {
    statusCode: number;
}
export interface ICodeError {
    code: string;
}
/**
 * @class
 * @augments TypeError
 */
export declare class AbstractMethodError extends TypeError {
    constructor(message?: string);
}
/**
 * @classdesc Abstract Class Exception
 * @class
 * @augments Error
 *
 */
export declare class AbstractClassError extends TypeError {
    constructor(message?: string);
}
/**
 * @class
 * @augments Error
 */
export declare class FileNotFoundError extends Error {
    constructor(message?: string);
}
/**
 * @class
 * @augments Error
 */
export declare class HttpError extends Error implements IStatusError {
    /**
     * @param {Error} err
     * @returns {HttpError}
     */
    static create(err: any): HttpError;
    /**
     * Gets or sets a short title for this HTTP error (e.g. Not Found, Bad Request)
     */
    title: string;
    /**
     * Gets or sets the status code if this HTTP error
     */
    statusCode: number;
    /**
     * Gets or sets an inner message for this HTTP error.
     */
    innerMessage: string;
    /**
     * @constructor
     * @param {number=} status
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(status?: number, message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 400 Bad Request exception class
 * @class
 */
export declare class HttpBadRequestError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 404 Not Found Exception class
 * @class
 * @augments HttpError
 */
export declare class HttpNotFoundError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
    /**
     * Gets or sets the resource which could not to be found
     */
    resource: string;
}
/**
 * @classdesc HTTP 405 Method Not Allowed exception class
 * @class
 * @augments HttpError
 */
export declare class HttpMethodNotAllowedError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 406 Not Acceptable exception class
 * @class
 * @augments HttpError
 */
export declare class HttpNotAcceptableError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 408 RequestTimeout exception class
 * @class
 * @augments HttpError
 */
export declare class HttpRequestTimeoutError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 409 Conflict exception class
 * @class
 * @augments HttpError
 */
export declare class HttpConflictError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 498 Token Expired exception class
 * @class
 * @augments HttpError
 */
export declare class HttpTokenExpiredError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 499 Token Required exception class
 * @class
 * @augments HttpError
 */
export declare class HttpTokenRequiredError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 401 Unauthorized Exception class
 * @class
 * @augments HttpError
 */
export declare class HttpUnauthorizedError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * HTTP 403 Forbidden Exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @augments HttpError
 */
export declare class HttpForbiddenError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc HTTP 500 Internal Server Error Exception class
 * @class
 * @augments HttpError
 */
export declare class HttpServerError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message?: string, innerMessage?: string);
}
/**
 * @classdesc Extends Error object for throwing exceptions on data operations
 * @class
 * @property {string} code - A string that represents an error code e.g. EDATA
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the appropriate HTTP error.
 * @augments Error
 */
export declare class DataError extends Error implements IStatusError, ICodeError {
    /**
     * Gets or sets a string which may be used to identify this error e.g. EDATA, EVIOLATION etc
     */
    statusCode: number;
    /**
     * Gets or sets a string which may be used to identify this error e.g. EDATA, EVIOLATION etc
     */
    code: string;
    /**
     * Gets or sets a string which represents the target data model, if any
     */
    model: string;
    /**
     * Gets or sets a string which represents the target data field, if any
     */
    field: string;
    /**
     * Gets or sets an inner message for this error.
     */
    innerMessage: string;
    constructor(code?: string, message?: string, innerMessage?: string, model?: string, field?: string);
}
/**
 * @classdesc Extends Error object for throwing not null exceptions.
 * @class
 * @property {string} code - A string that represents an error code. The default error code is ENULL.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the appropriate HTTP error. The default status is 409 (Conflict)
 * @property {string} model - The target model name
 * @property {string} field - The target field name
 * @augments DataError
 */
export declare class NotNullError extends DataError {
    /**
     * @constructor
     * @param {string=} message - The error message
     * @param {string=} innerMessage - The error inner message
     * @param {string=} model - The target model
     * @param {string=} field - The target field
     */
    constructor(message?: string, innerMessage?: string, model?: string, field?: string);
}
/**
 * @classdesc Extends Error object for throwing not found exceptions.
 * @class
 * @property {string} code - A string that represents an error code. The default error code is EFOUND.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the appropriate HTTP error. The default status is 404 (Conflict)
 * @property {string} model - The target model name
 * @augments DataError
 */
export declare class DataNotFoundError extends DataError {
    /**
     * @constructor
     * @param {string=} message - The error message
     * @param {string=} innerMessage - The error inner message
     * @param {string=} model - The target model
     */
    constructor(message?: string, innerMessage?: string, model?: string);
}
/**
 * @classdesc Extends Error object for throwing unique constraint exceptions.
 * @class
 * @property {string} code - A string that represents an error code. The default error code is ENULL.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the appropriate HTTP error. The default status is 409 (Conflict)
 * @property {string} model - The target model name
 * @property {string} constraint - The target constraint name
 * @augments DataError
 */
export declare class UniqueConstraintError extends DataError {
    /**
     * Gets or sets the name of the violated constraint
     */
    constraint: string;
    constructor(message?: string, innerMessage?: string, model?: string, constraint?: string);
}
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
export declare class AccessDeniedError extends DataError {
    constructor(message?: string, innerMessage?: string);
}
