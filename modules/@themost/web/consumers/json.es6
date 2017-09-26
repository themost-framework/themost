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
import {HttpConsumer} from '../consumers';
import Q from 'q';
import bodyParser from 'body-parser';
import {HttpNextResult} from '../results';

let jsonParser;
/**
 * @classdesc Default JSON content handler (as it had been implemented for version 1.x of MOST Web Framework)
 * @class
 * @private
 */
class JsonHandler {
    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    beginRequest(context, callback) {
        const request = context.request,
            response = context.response;
        request.headers = request.headers || {};
        const contentType = request.headers['content-type'];
        if (/^application\/json/i.test(contentType)) {
            //change: 15-Feb 2016
            //description get json body limit from application configuration (settings#json.limit)
            if (typeof jsonParser === 'undefined') {
                //ensure settings
                let conf = context.getApplication().getConfiguration();
                conf.settings = conf.settings || { };
                //ensure json settings (the default limit is 100kb)
                conf.settings.json = conf.settings.json || { limit:102400 };
                //get json parser
                jsonParser = bodyParser.json(conf.settings.json);
            }
            //parse request data
            jsonParser(request, response , function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    try {
                        if (request.body) {
                            //try parse
                            if (request.body instanceof Buffer) {
                                context.params.data = JSON.parse(request.body);
                            }
                            else if (typeof request.body === 'object') {
                                context.params.data = request.body;
                            }
                            callback();
                        }
                    }
                    catch(err) {
                        callback(err);
                    }

                }
            });
        }
        else {
            callback();
        }
    }
}


/**
 * @class
 */
export class JsonContentConsumer extends HttpConsumer {
    constructor() {
        super(function() {
            /**
             * @type {HttpContext}
             */
            const context = this;
            try {
                let handler = new JsonHandler();
                return Q.nfbind(handler.beginRequest)(context)
                    .then(()=> {
                    return HttpNextResult.create().toPromise();
                });
            }
            catch(err) {
                return Q.reject(err);
            }
        });
    }
}