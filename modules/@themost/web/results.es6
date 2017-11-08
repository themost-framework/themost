/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import Q from 'q';
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
        this.headers = {};
    }

    /**
     * @param {string} name
     * @param {string} value
     * @returns {HttpResult|*}
     */
    setHeader(name, value) {
        this.headers[name] = value;
        return this;
    }

    /**
     * @returns {*|Q.Promise<HttpResult>|Q.Promise<any>}
     */
    toPromise() {
        return Q(this);
    }

    /**
     * @returns {*|Q.Promise<HttpNextResult>}
     */
    static next() {
        return HttpNextResult.create().toPromise();
    }

    /**
     * @returns {*|Q.Promise<HttpEndResult>}
     */
    static end() {
        return HttpEndResult.create().toPromise();
    }

    /**
     * @param {number} status
     * @returns {*|Q.Promise<HttpErrorResult>}
     */
    static error(status) {
        return HttpErrorResult.create(status).toPromise();
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
     * @returns {Promise}
     * */
    execute(context) {
        const self = this;
        return Q.nfbind(function(callback) {
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

                const formatter = formatterStrategy.find(context);
                if (_.isNil(formatter)) {
                    return callback(new HttpMethodNotAllowedError());
                }
                return formatter.execute(context, self.data).then(()=>{
                    return callback();
                }).catch((err) => {
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
