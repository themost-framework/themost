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
export class AbstractMethodError extends TypeError {
    constructor(message) {
        super(message || 'Class does not implement inherited abstract method.');
    }
}

/**
 * @classdesc Abstract Class Exception
 * @class
 * @augments Error
 * */
export class AbstractClassError extends TypeError {
    constructor(message) {
        super(message || 'An abstract class cannot be instantiated.');
    }
}

/**
 * @class
 * @augments Error
 */
export class FileNotFoundError extends Error {
    constructor(message) {
        super(message || 'File not found');
    }
}

/**
 * @class
 * @augments Error
 */
export class HttpError extends Error {
    /**
     * @constructor
     * @param {number=} status
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(status, message, innerMessage) {
        super(message);
        const errors = require('./resources/http-error-codes.json');
        const hstatus = (typeof status==='undefined' || status == null) ? 500 : parseInt(status);
        const err = errors.find(function(x) { return x.status === hstatus; });
        if (err) {
            this.title = err.title;
            this.message = message || err.message;
            this.status = err.status;
        }
        else {
            this.title = 'Internal Server Error';
            this.message = message || 'The server encountered an internal error and was unable to complete the request.';
            this.status = hstatus
        }
        this.innerMessage = innerMessage;
    }

    /**
     * @param {Error} err
     * @returns {Error|HttpError}
     */
    static create(err) {
        if (typeof err === 'undefined' || err==null)
            return new HttpError();
        else {
            if (err.status)
                return new HttpError(err.status, err.message);
            else
                return new HttpError(500, err.message);
        }
    }
}

/**
 * @classdesc HTTP 400 Bad Request exception class
 * @class
 * */
export class HttpBadRequestError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message, innerMessage) {
        super(400, message , innerMessage);
    }
}

/**
 * @classdesc HTTP 404 Not Found Exception class
 * @class
 * @augments HttpError
 * */
export class HttpNotFoundError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message, innerMessage) {
        super(404, message , innerMessage);
    }
}

/**
 * @classdesc HTTP 405 Method Not Allowed exception class
 * @class
 * @augments HttpError
 * */
export class HttpMethodNotAllowedError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message, innerMessage) {
        super(405, message , innerMessage);
    }
}

/**
 * @classdesc HTTP 401 Unauthorized Exception class
 * @class
 * @augments HttpError
 * */
export class HttpUnauthorizedError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message, innerMessage) {
        super(401, message , innerMessage);
    }
}

/**
 * HTTP 403 Forbidden Exception class
 * @class
 * @param {string=} message
 * @param {string=} innerMessage
 * @augments HttpError
 * */
export class HttpForbiddenError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message, innerMessage) {
        super(403, message , innerMessage);
    }
}

/**
 * @classdesc HTTP 500 Internal Server Error Exception class
 * @class
 * @augments HttpError
 * */
export class HttpServerError extends HttpError {
    /**
     * @constructor
     * @param {string=} message
     * @param {string=} innerMessage
     */
    constructor(message, innerMessage) {
        super(500, message , innerMessage);
    }
}