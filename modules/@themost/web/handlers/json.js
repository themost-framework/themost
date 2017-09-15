/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var bodyParser = require('body-parser'), jsonParser;
var _ = require('lodash');
/**
 * @class
 * @constructor
 * @extends HttpHandler
 */
function JsonHandler() {
    //
}

/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
JsonHandler.prototype.beginRequest = function(context, callback) {
    var request = context.request, response = context.response;
    request.headers = request.headers || {};
    var contentType = request.headers['content-type'];
    if (/^application\/json/i.test(contentType)) {
        try {
            //get json body limit from application configuration (settings#json.limit)
            if (typeof jsonParser === 'undefined') {
                //ensure settings
                if (_.isNil(context.application.getConfiguration().getSourceAt('settings/json'))) {
                    context.application.getConfiguration().setSourceAt('settings/json', { limit:102400 })
                }
                //get json parser
                jsonParser = bodyParser.json(context.application.getConfiguration().getSourceAt('settings/json'));
            }
            //parse request data
            return jsonParser(request, response , function(err) {
                if (err) {
                    return callback(err);
                }
                try {
                    if (request.body) {
                        //try parse
                        if (request.body instanceof Buffer) {
                            context.params.data = JSON.parse(request.body);
                        }
                        else if (typeof request.body === 'object') {
                            context.params.data = request.body;
                        }
                    }
                }
                catch(err) {
                    return callback(err);
                }
                return callback();
            });
        }
        catch(err) {
            return callback(err);
        }
    }
    else {
        callback();
    }
};
if (typeof exports !== 'undefined') {
    module.exports.JsonHandler = JsonHandler;
    /**
     * @returns {JsonHandler}
     */
    module.exports.createInstance = function() {
        return  new JsonHandler();
    };
}