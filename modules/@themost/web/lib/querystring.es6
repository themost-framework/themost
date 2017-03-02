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
import {_} from 'lodash';
import querystring from 'querystring';
import {HttpConsumer} from './consumers';
import Rx from 'rxjs';
import {HttpNextResult} from './results';

/**
 * Provides a case insensitive attribute getter
 * @param name
 * @returns {*}
 * @private
 */
function caseInsensitiveAttribute(name) {
    if (typeof name === 'string') {
        if (this[name])
            return this[name];
        //otherwise make a case insensitive search
        const re = new RegExp('^' + name + '$','i');
        const p = Object.keys(this).filter(function(x) { return re.test(x); })[0];
        if (p)
            return this[p];
    }
    return null;
}
/**
 * @classdesc @classdesc Default querystring handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
 */
class QuerystringHandler {
    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    beginRequest(context, callback) {
        context = context || {};
        callback = callback || function() {};
        const request = context.request;
        if (typeof request === 'undefined') {
            callback();
            return;
        }
        try {
            context.params = context.params || {};
            //apply case insensitivity search in params object
            context.params.attr = caseInsensitiveAttribute;
            //add query string params
            if (request.url.indexOf('?') > 0)
                _.assign(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
            callback();
        }
        catch(e) {
            callback(e);
        }
    }
}


export class QuerystringConsumer extends HttpConsumer {
    constructor() {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new QuerystringHandler();
                return Rx.Observable.bindNodeCallback(handler.beginRequest)(context)
                    .flatMap(()=> {
                        return HttpNextResult.create().toObservable();
                    });
            }
            catch(err) {
                return Rx.Observable['throw'](err);
            }
        });
    }
}