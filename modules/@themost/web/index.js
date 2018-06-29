/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _mvc = require('./mvc');
var _app = require('./app');
var _context = require('./context');
var _config = require('./config');
var _types = require('./types');
var HttpBaseController = require('./controllers/base');
var HttpDataController = require('./controllers/data');
var HttpDataModelController = require('./controllers/model');
var HttpServiceController = require('./controllers/service');
var HttpLookupController = require('./controllers/lookup');
var HttpHiddenController = require('./controllers/hidden');

if (typeof exports !== 'undefined')
{
    //export * from './types'
    module.exports.HttpHandler = _types.HttpHandler;
    module.exports.HttpApplicationService = _types.HttpApplicationService;
    module.exports.HttpViewEngine = _types.HttpViewEngine;
    //export * from './config'
    module.exports.HttpConfiguration = _config.HttpConfiguration;
    module.exports.HttpHandlerConfiguration = _config.HttpHandlerConfiguration;
    module.exports.HttpRouteConfiguration = _config.HttpRouteConfiguration;
    module.exports.HttpViewEngineConfiguration = _config.HttpViewEngineConfiguration;
    module.exports.MimeTypeConfiguration = _config.MimeTypeConfiguration;
    //export * from './app'
    module.exports.HttpApplication = _app.HttpApplication;
    //export * from './http-mvc'
    module.exports.HttpController = _mvc.HttpController;
    module.exports.HttpContentResult = _mvc.HttpContentResult;
    module.exports.HttpEmptyResult = _mvc.HttpEmptyResult;
    module.exports.HttpFileResult = _mvc.HttpFileResult;
    module.exports.HttpJsonResult = _mvc.HttpJsonResult;
    module.exports.HttpRedirectResult = _mvc.HttpRedirectResult;
    module.exports.HttpResult = _mvc.HttpResult;
    module.exports.HttpViewResult = _mvc.HttpViewResult;
    module.exports.HttpXmlResult = _mvc.HttpXmlResult;
    //export * from './http-context'
    module.exports.HttpContext = _context.HttpContext;
    //export * from './controllers/base'
    module.exports.HttpBaseController = HttpBaseController;
    //export * from './controllers/data'
    module.exports.HttpDataController = HttpDataController;
    //export * from './controllers/service'
    module.exports.HttpServiceController = HttpServiceController;
    //export * from './controllers/model'
    module.exports.HttpDataModelController = HttpDataModelController;

    module.exports.HttpLookupController = HttpLookupController;

    module.exports.HttpHiddenController = HttpHiddenController;

    module.exports.runtime = function() {
        return _app.HttpApplication.getCurrent().runtime();
    }
}