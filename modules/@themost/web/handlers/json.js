/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-12-02
 */
/**
 * @ignore
 */
var bodyParser = require('body-parser'), jsonParser;
var _ = require('lodash');
function JsonHandler() {

}
var DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?([+-](\d+):(\d+))?$/g;
function reviveDates(key, value){
    if (typeof value === "string" && DateTimeRegex.test(value) ) {
        return new Date(value);
    }
    return value;
}

JsonHandler.prototype.beginRequest = function(context, callback) {
    var request = context.request, response = context.response;
    request.headers = request.headers || {};
    var contentType = request.headers['content-type'];
    if (/^application\/json/i.test(contentType)) {
        //change: 15-Feb 2016
        //description get json body limit from application configuration (settings#json.limit)
        if (typeof jsonParser === 'undefined') {
            //get application settings
            var settings = context.getApplication().getConfiguration().settings;
            //ensure json settings (the default limit is 100kb)
            settings.json = settings.json || { limit:102400 };
            //get json parser
            jsonParser = bodyParser.json(_.assign(settings.json, {
                reviver:reviveDates
            }));
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
};
if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new JsonHandler();  };
}