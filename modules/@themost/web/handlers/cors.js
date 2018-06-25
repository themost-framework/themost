/**
 * jshint es5:true
 */
/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2017-11-20
 */
/**
 * @class
 * @constructor
 * @implements PostMapRequestHandler
 */
function CorsHandler() {

}

/**
 * @param {HttpContext} context
 * @param {Function} callback
 */
CorsHandler.prototype.postMapRequest = function(context, callback) {

    var allowCredentials = true;
    var allowOrigin = "*";
    var allowHeaders = "Origin, X-Requested-With, Content-Type, Content-Language, Accept, Accept-Language, Authorization";
    var allowMethods = "GET, OPTIONS, PUT, POST, PATCH, DELETE";
    /**
     * @private
     * @type {{allowOrigin:string,allowHeaders:string,allowCredentials:Boolean,allowMethods:string,allow:string}|*}
     */
    var route = context.request.route;
    if (route) {
        if (typeof route.allowOrigin !== 'undefined')
            allowOrigin = route.allowOrigin;
        if (typeof route.allowHeaders !== 'undefined')
            allowHeaders = route.allowHeaders;
        if (typeof route.allowCredentials !== 'undefined')
            allowCredentials = route.allowCredentials;
        if ((typeof route.allowMethods !== 'undefined') || (typeof route.allow !== 'undefined'))
            allowMethods = route.allow || route.allowMethods;
    }
    //ensure header names
    var headerNames = context.response["_headerNames"] || { };
    //1. Access-Control-Allow-Origin
    if (typeof headerNames["access-control-allow-origin"] === 'undefined') {
        //if request contains origin header
        if (context.request.headers.origin) {
            if (allowOrigin === "*") {
                //set access-control-allow-origin header equal to request origin header
                context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
            }
            else if (allowOrigin.indexOf(context.request.headers.origin)>-1) {
                context.response.setHeader("Access-Control-Allow-Origin", context.request.headers.origin);
            }
        }
        else {
            //set access-control-allow-origin header equal to the predefined origin header
            context.response.setHeader("Access-Control-Allow-Origin", "*");
        }
    }
    //2. Access-Control-Allow-Credentials
    if (typeof headerNames["access-control-allow-credentials"] === 'undefined') {
        context.response.setHeader("Access-Control-Allow-Credentials", allowCredentials);
    }

    //3. Access-Control-Allow-Headers
    if (typeof headerNames["access-control-allow-headers"] === 'undefined') {
        context.response.setHeader("Access-Control-Allow-Headers", allowHeaders);
    }

    //4. Access-Control-Allow-Methods
    if (typeof headerNames["access-control-allow-methods"] === 'undefined') {
        context.response.setHeader("Access-Control-Allow-Methods", allowMethods);
    }
    return callback();
};

CorsHandler.createInstance = function() {
    return new CorsHandler();
};


if (typeof module !== 'undefined') {
    module.exports.CorsHandler = CorsHandler.CorsHandler;
    module.exports.createInstance = CorsHandler.createInstance;
}