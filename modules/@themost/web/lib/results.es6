'use strict';
import Rx from 'rx';
import {Args} from '@themost/common/utils';
import {_} from 'lodash';
import {FormatterStrategy} from "./formatters";
import {HttpMethodNotAllowedError} from "@themost/common/errors";
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
        this.contentType = 'text/html';
        this.contentEncoding = 'utf8';
    }

    /**
     * Creates an instance of HTTP next result
     * @param {*} data
     * @returns {HttpAnyResult}
     */
    static create(data) {
        return new HttpAnyResult(data);
    }

    /**
     * Executes an HttpResult instance against an existing HttpContext.
     * @param {HttpContext} context
     * @returns {Observable}
     * */
    execute(context) {
        const self = this;
        return Rx.Observable.fromNodeCallback(function(callback) {
            try {
                /**
                 * @type {FormatterStrategy}
                 */
                const formatterStrategy = context.getApplication().getService(FormatterStrategy),
                    /**
                     * @type {ServerResponse}
                     */
                    response = context.response;

                if (_.isNil(self.data)) {
                    response.writeHead(204);
                    return callback();
                }

                if (_.isNil(formatterStrategy)) {
                    return callback(new HttpMethodNotAllowedError());
                }

                const formatter = formatterStrategy.findFormatter(context);
                if (_.isNil(formatter)) {
                    return callback(new HttpMethodNotAllowedError());
                }
                return formatter.execute(context, self.data).subscribe(()=>{
                   return callback();
                }, (err) => {
                    return callback(err);
                });
            }
            catch(err) {
                callback(err);
            }
        })();
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
