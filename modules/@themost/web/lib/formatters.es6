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
import {HttpApplicationService} from "./interfaces";
import {AbstractClassError, AbstractMethodError} from "@themost/common/errors";
import {Args} from "@themost/common/utils";
import {_} from 'lodash';
import Rx from 'rx';
import accepts from 'accepts';
import xml from 'most-xml';

const formattersProperty = Symbol('formatters');

export class FormatterStrategy extends HttpApplicationService {
    constructor(app) {
        Args.check(new.target !== FormatterStrategy, new AbstractClassError());
        super(app);
        this[formattersProperty] = { };
    }

    /**
     * Adds a formatter to the collection of application formatters
     * @param {Function} formatterCtor
     */
    addFormatter(formatterCtor) {
        Args.check(typeof formatterCtor === 'function', 'Formatter constructor mub be a function');
        this[formattersProperty][`${formatterCtor.name}`] = new formatterCtor();
    }

    /**
     * Gets a formatter based on the given type
     * @param {Function} formatterCtor
     */
    getFormatter(formatterCtor) {
        Args.check(typeof formatterCtor === 'function', 'Formatter constructor mub be a function');
        return this[formattersProperty][`${formatterCtor.name}`] = new formatterCtor();
    }

    /**
     * Finds a formatter for the given HTTP context
     * @param context
     * @returns {OutputFormatter}
     */
    findFormatter(context) {
        const formatters = this[formattersProperty];
        for (let key in formatters) {
            if (formatters.hasOwnProperty(key)) {
                if (formatters[key].isMatch(context)) {
                    return formatters[key];
                }
            }
        }
    }

}

export class DefaultFormatterStrategy extends FormatterStrategy {
    constructor(app) {
        super(app);
        this.addFormatter(HtmlOutputFormatter);
        this.addFormatter(JsonOutputFormatter);
        this.addFormatter(XmlOutputFormatter);
    }

}
/**
 * @class
 */
export class OutputFormatter {
    constructor() {
        Args.check(new.target !== OutputFormatter, new AbstractClassError());
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */
    getMediaType() {
        throw new AbstractMethodError();
    }

    /**
     * Gets the content type associated with an output formatter
     * @returns {string}
     */
    getContentType() {
        throw new AbstractMethodError();
    }

    /**
     * Gets the type associated with an output formatter
     * @returns {string}
     */
    getType() {
        throw new AbstractMethodError();
    }

    /**
     * Check if the given HTTP context accepts formatting
     * @param {HttpContext} context
     */
    isMatch(context) {
        let accept = accepts(context.request);
        return accept.type([this.getType()])
    }

    /**
     * Executes formatter against the given HTTP context
     * @param {HttpContext} context
     * @param {*} data
     * @returns {Observable}
     */
    execute(context, data) {
        throw new AbstractMethodError();
    }
}

/**
 * @param {string} key
 * @param {*} value
 * @returns {*}
 * @private
 */
function _json_ignore_null_replacer(key, value) {
    if (value == null)
        return undefined;
    return value;
}


export class JsonOutputFormatter extends OutputFormatter {

    constructor() {
        super();
        this.options = {
            "ignoreNullValues": true
        }
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */
    getMediaType() {
        return 'application/json';
    }

    /**
     * Gets the content type associated with an output formatter
     * @returns {string}
     */
    getContentType() {
        return 'application/json;charset=utf-8';
    }

    /**
     * Gets the type associated with an output formatter
     * @returns {string}
     */
    getType() {
        return 'json';
    }

    /**
     *
     * @param {HttpContext} context
     * @param {*} data
     * @returns {Observable}
     */
    execute(context, data) {
        return Rx.Observable.fromNodeCallback((callback) => {
            if (_.isNil(data)) {
                //return 204 (no content)
                context.response.writeHead(204);
                return callback();
            }
            if (data instanceof Error) {
                //send error in JSON format
                context.response.writeHead(data.status || 500, { "Content-Type": this.getContentType()});
            }
            else {
                context.response.writeHead(200, { "Content-Type": this.getContentType()});
            }
            if (this.options.ignoreNullValues) {
                context.response.write(JSON.stringify(data,_json_ignore_null_replacer), 'utf8');
            }
            else {
                context.response.write(JSON.stringify(data), 'utf8');
            }
            return callback();
        })();
    }
}

export class XmlOutputFormatter extends OutputFormatter {

    constructor() {
        super();
        this.options = {
            "ignoreNullValues": true
        }
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */
    getMediaType() {
        return 'application/xml';
    }
    /**
     * Gets the type associated with an output formatter
     * @returns {string}
     */
    getType() {
        return 'xml';
    }

    /**
     * Gets the content type associated with an output formatter
     * @returns {string}
     */
    getContentType() {
        return 'application/xml;charset=utf-8';
    }

    /**
     * Executes formatter against the given HTTP context
     * @param {HttpContext} context
     * @param {*} data
     * @returns {Observable}
     */
    execute(context, data) {
        return Rx.Observable.fromNodeCallback((callback) => {
            if (_.isNil(data)) {
                //return 204 (no content)
                context.response.writeHead(204);
                return callback();
            }
            if (data instanceof Error) {
                //send error in JSON format
                context.response.writeHead(data.status || 500, { "Content-Type": this.getContentType()});
            }
            else {
                context.response.writeHead(200, { "Content-Type": this.getContentType()});
            }
            context.response.write(xml.serialize(data).outerXML(), 'utf8');
            return callback();
        })();
    }
}

export class HtmlOutputFormatter extends OutputFormatter {

    constructor() {
        super();
        this.options = {
            "ignoreNullValues": true
        }
    }
    /**
     * Gets the media type associated with an output formatter
     * @returns {string}
     */
    getMediaType() {
        return 'text/html';
    }
    /**
     * Gets the type associated with an output formatter
     * @returns {string}
     */
    getType() {
        return 'html';
    }

    /**
     * Gets the content type associated with an output formatter
     * @returns {string}
     */
    getContentType() {
        return 'text/html;charset=utf-8';
    }

    /**
     * Executes formatter against the given HTTP context
     * @param {HttpContext} context
     * @param {*} data
     * @returns {Observable}
     */
    execute(context, data) {
        return Rx.Observable.fromNodeCallback((callback) => {
            if (_.isNil(data)) {
                //return 204 (no content)
                context.response.writeHead(204);
                return callback();
            }
            if (data instanceof Error) {
                const statusCode = data.status || 500;
                //send error in JSON format
                context.response.writeHead(statusCode, { "Content-Type": this.getContentType()});
                context.response.write(statusCode + ' ' + data.message, 'utf8');
            }
            else {
                const HttpViewResult = require('./mvc').HttpViewResult;
                const result = new HttpViewResult(null, data);
                return result.execute(context, function(err) {
                    return callback(err);
                });
            }
            return callback();
        })();
    }
}