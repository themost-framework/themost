'use strict';
import Rx from 'rx';
import {Args} from '@themost/common/utils';
/**
 * @class
 * @abstract
 */
export class HttpResult {
    /**
     * @constructor
     */
    constructor() {

        if (new.target === HttpResult) {
            throw new TypeError("Cannot construct abstract instances directly");
        }
    }

    toObservable() {
        return Rx.Observable.return(this);
    }

}

/**
 * @class
 */
export class HttpAnyResult extends HttpResult {
    /**
     * @constructor
     * @param {*} data
     */
    constructor(data) {
        super();
        this.data = data;
    }

    /**
     * Creates an instance of HTTP next result
     * @param {*} data
     * @returns {HttpAnyResult}
     */
    static create(data) {
        Args.check(!(data instanceof Error), "Invalid argument. Data may not be an instance of Error class.");
        return new HttpAnyResult(data);
    }

}

/**
 * @class
 */
export class HttpNextResult extends HttpResult {
    /**
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Creates an instance of HTTP next result
     * @returns {HttpNextResult}
     */
    static create() {
        return new HttpNextResult();
    }

}

/**
 * @class
 */
export class HttpEndResult extends HttpResult {
    /**
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Creates an instance of HTTP next result
     * @returns {HttpEndResult}
     */
    static create() {
        return new HttpEndResult();
    }
}

/**
 * @class
 */
export class HttpErrorResult extends HttpResult {
    /**
     * @constructor
     */
    constructor(statusCode) {
        super();
    }

    /**
     * Creates an instance of HTTP next result
     * @param {number} statusCode
     * @returns {HttpErrorResult}
     */
    static create(statusCode) {
        return new HttpErrorResult(statusCode);
    }
}
