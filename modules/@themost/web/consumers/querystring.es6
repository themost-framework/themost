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
import {HttpConsumer} from '../consumers';
import Rx from 'rxjs';
import {HttpNextResult} from '../results';

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
        callback = callback || function() {};
        if (_.isNil(context)) {
            return callback();
        }
        try {
            const request = context.request;
            if (_.isNil(request)) {
                return callback();
            }
            //add query string params
            if (request.url.indexOf('?') > 0) {
                _.assign(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
            }
        }
        catch(err) {
            return callback(err);
        }
        return callback();
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