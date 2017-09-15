/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var HttpApplication  = require('./app').HttpApplication;
var HttpContext = require('./http-context').HttpContext;
var common = require('./common');
var HttpError = require('@themost/common/errors').HttpError;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var files = require('./files');
var _ = require('lodash');
var mvc = require('./mvc');
var html = require('./html');
var path = require("path");
var fs = require("fs");
var decorators = require('./decorators');
var HttpHiddenController = require('./controllers/hidden');
var HttpBaseController = require('./controllers/base');
var HttpDataController = require('./controllers/data');
var HttpLookupController = require('./controllers/lookup');
var EjsEngine = require('./engines/ejs').EjsEngine;
var JadeEngine = require('./engines/jade').JadeEngine;

var web = { };


/** @module @themost/web */

/**
 * Expression handler for Access Denied HTTP errors (401).
 * @param {*=} options
 */
web.unauthorized = function(options) {
    return function(err, req, res, next)
    {
        try {
            if (err.status===401)  {
                if (/text\/html/g.test(req.get('accept'))) {
                    if (web.current.config.settings) {
                        if (web.current.config.settings.auth) {
                            var page = web.current.config.settings.auth.loginPage || '/login.html';
                            res.set('Location', page.concat('?returnUrl=', encodeURIComponent(req.url)));
                            res.status(302).end();
                            return;
                        }
                    }
                }
            }
            next(err);
        }
        catch(e) {
            console.log(e);
            next(err);
        }
    };
};
/**
 * Expression handler for HTTP errors.
 */
web.error = function() {
    return function(err, request, response, next)
    {
        try {
            var ejs = require('ejs');
            if (_.isNil(response) || _.isNil(request)) {
                next(err);
            }
            if (!/text\/html/g.test(request.get('accept'))) {
                next(err);
            }
            else {
                if (response._headerSent) {
                    next(err);
                    return;
                }
                fs.readFile(path.join(__dirname, './http-error.html.ejs'), 'utf8', function (readErr, data) {
                    if (readErr) {
                        //log process error
                        TraceUtils.log(readErr);
                        next(err);
                        return;
                    }
                    //compile data
                    var str;
                    try {
                        if (err instanceof HttpError) {
                            str = ejs.render(data, { error:err });
                        }
                        else {
                            var httpErr = new HttpError(500, null, err.message);
                            httpErr.stack = err.stack;
                            str = ejs.render(data, {error: httpErr});
                        }
                    }
                    catch (e) {
                        TraceUtils.log(e);
                        next(err);
                        return;
                    }
                    //write status header
                    response.writeHead(err.status || 500 , { "Content-Type": "text/html" });
                    response.write(str);
                    response.end();
                });
            }
        }
        catch(e) {
            console.log(e);
            next(err);
        }
    };
};


if (typeof exports !== 'undefined')
{
    //controllers
    module.exports.HttpBaseController = HttpBaseController;
    module.exports.HttpDataController = HttpDataController;
    module.exports.HttpLookupController = HttpLookupController;
    module.exports.HttpHiddenController = HttpHiddenController;
    //engines
    module.exports.EjsEngine = EjsEngine;
    module.exports.JadeEngine = JadeEngine;


    module.exports.HttpApplication = HttpApplication;
    module.exports.HttpContext = HttpContext;
}
