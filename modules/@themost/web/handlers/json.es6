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
import bodyParser from 'body-parser';

let jsonParser;
/**
 * @class
 * @augments HttpHandler
 */
export default class JsonHandler {
    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    beginRequest(context, callback) {
        const request = context.request, response = context.response;
        request.headers = request.headers || {};
        const contentType = request.headers['content-type'];
        if (/^application\/json/i.test(contentType)) {
            //change: 15-Feb 2016
            //description get json body limit from application configuration (settings#json.limit)
            if (typeof jsonParser === 'undefined') {
                //ensure settings
                context.application.config.settings = context.application.config.settings || { };
                //ensure json settings (the default limit is 100kb)
                context.application.config.settings.json = context.application.config.settings.json || { limit:102400 };
                //get json parser
                jsonParser = bodyParser.json(context.application.config.settings.json);
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
                    catch(e) {
                        callback(e);
                    }

                }
            });
        }
        else {
            callback();
        }
    }
}
