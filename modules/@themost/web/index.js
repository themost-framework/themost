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

var _auth = require('./handlers/auth');
var _basic_auth = require('./handlers/basic-auth');
var _cors = require('./handlers/cors');
var _directive = require('./handlers/directive');
var _json = require('./handlers/json');
var _multipart = require('./handlers/multipart');
var _node_modules = require('./handlers/node-modules');
var _noop = require('./handlers/noop');
var _post = require('./handlers/post');
var _querystring = require('./handlers/querystring');
var _restrict_access = require('./handlers/restrict-access');
var _route_params = require('./handlers/route-params');
var _static = require('./handlers/static');
var _view = require('./handlers/view');
var _xml = require('./handlers/xml');
var _consumers = require('./consumers');
var _localization = require('./localization');
var _http_route = require('./http-route');
var _helpers = require('./helpers');
var _files = require('./files');
var _cache = require('./cache');

var _ejs = require('./engines/ejs');
var _jade = require('./engines/jade');
var _md = require('./engines/md');
var _ng = require('./engines/ng');
var _vash = require('./engines/vash');

var _module = require('./angular/module');

var _odata = require('./odata');
var _service_configuration = require('./services-configuration');

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

    //export * from './handlers/auth'
    module.exports.AuthHandler = _auth.AuthHandler;
    module.exports.AuthStrategy = _auth.AuthStrategy;
    module.exports.DefaultAuthStrategy = _auth.DefaultAuthStrategy;
    module.exports.EncryptionStrategy = _auth.EncryptionStrategy;
    module.exports.DefaultEncryptionStrategy = _auth.DefaultEncryptionStrategy;

    module.exports.BasicAuthHandler = _basic_auth.BasicAuthHandler;
    module.exports.CorsHandler = _cors.CorsHandler;
    module.exports.DirectiveEngine = _directive.DirectiveEngine;
    module.exports.JsonHandler = _json.JsonHandler;
    module.exports.MultipartHandler = _multipart.MultipartHandler;
    module.exports.NodeModulesHandler = _node_modules.NodeModulesHandler;
    module.exports.NoopHandler = _noop.NoopHandler;
    module.exports.PostHandler = _post.PostHandler;
    module.exports.QuerystringHandler = _querystring.QuerystringHandler;
    module.exports.RestrictAccess = _restrict_access.RestrictAccess;
    module.exports.RouteParams = _route_params.RouteParams;
    module.exports.StaticHandler = _static.StaticHandler;
    module.exports.ViewHandler = _view.ViewHandler;
    module.exports.XmlHandler = _xml.XmlHandler;

    module.exports.HttpConsumer = _consumers.HttpConsumer;
    module.exports.LocalizationStrategy = _localization.LocalizationStrategy;
    module.exports.DefaultLocalizationStrategy = _localization.DefaultLocalizationStrategy;
    module.exports.I18nLocalizationStrategy = _localization.I18nLocalizationStrategy;

    module.exports.HttpRoute = _http_route.HttpRoute;

    module.exports.HtmlViewHelper = _helpers.HtmlViewHelper;

    module.exports.FileStorage = _files.FileStorage;
    module.exports.AttachmentFileSystemStorage = _files.AttachmentFileSystemStorage;

    module.exports.CacheStrategy = _cache.CacheStrategy;
    module.exports.DefaultCacheStrategy = _cache.DefaultCacheStrategy;

    module.exports.EjsEngine = _ejs.EjsEngine;
    module.exports.MarkdownEngine = _md.MarkdownEngine;
    module.exports.NgEngine = _ng.NgEngine;
    module.exports.JadeEngine = _jade.JadeEngine;
    module.exports.VashEngine = _vash.VashEngine;

    module.exports.AngularServerModule = _module.AngularServerModule;

    module.exports.ODataModelBuilderConfiguration = _odata.ODataModelBuilderConfiguration;
    module.exports.ODataJsonResult = _odata.ODataJsonResult;

    module.exports.ServicesConfiguration = _service_configuration.ServicesConfiguration;

    module.exports.runtime = function() {
        return _app.HttpApplication.getCurrent().runtime();
    }
}