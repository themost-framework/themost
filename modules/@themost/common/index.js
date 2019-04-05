/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _utils  = require('./utils');
var _errors  = require('./errors');
var _emitter  = require('./emitter');
var _config  = require('./config');
var _html  = require('./html');
var _app  = require('./app');

if (typeof exports !== 'undefined') {

    module.exports.Args  = _utils.Args;
    module.exports.UnknownPropertyDescriptor  = _utils.UnknownPropertyDescriptor;
    module.exports.LangUtils  = _utils.LangUtils;
    module.exports.NumberUtils  = _utils.NumberUtils;
    module.exports.RandomUtils  = _utils.RandomUtils;
    module.exports.TraceUtils  = _utils.TraceUtils;
    module.exports.TextUtils  = _utils.TextUtils;
    module.exports.PathUtils  = _utils.PathUtils;
    module.exports.ArgumentError  = _utils.ArgumentError;
    module.exports.Guid  = _utils.Guid;
    module.exports.Base26Number  = _utils.Base26Number;
    
    module.exports.AbstractMethodError  = _errors.AbstractMethodError;
    module.exports.AbstractClassError  = _errors.AbstractClassError;
    module.exports.FileNotFoundError  = _errors.FileNotFoundError;
    module.exports.HttpError  = _errors.HttpError;
    module.exports.HttpBadRequestError  = _errors.HttpBadRequestError;
    module.exports.HttpNotFoundError  = _errors.HttpNotFoundError;
    module.exports.HttpMethodNotAllowedError  = _errors.HttpMethodNotAllowedError;
    module.exports.HttpUnauthorizedError  = _errors.HttpUnauthorizedError;
    module.exports.HttpForbiddenError  = _errors.HttpForbiddenError;
    module.exports.HttpServerError  = _errors.HttpServerError;
    module.exports.DataError  = _errors.DataError;
    module.exports.NotNullError  = _errors.NotNullError;
    module.exports.DataNotFoundError  = _errors.DataNotFoundError;
    module.exports.AccessDeniedError  = _errors.AccessDeniedError;
    module.exports.UniqueConstraintError  = _errors.UniqueConstraintError;
    module.exports.HttpNotAcceptableError = _errors.HttpNotAcceptableError;
    module.exports.HttpConflictError = _errors.HttpConflictError;
    module.exports.HttpRequestTimeoutError = _errors.HttpRequestTimeoutError;
    module.exports.HttpTokenExpiredError = _errors.HttpTokenExpiredError;
    module.exports.HttpTokenRequiredError = _errors.HttpTokenRequiredError;


    module.exports.SequentialEventEmitter  = _emitter.SequentialEventEmitter;

    module.exports.HtmlWriter  = _html.HtmlWriter;

    module.exports.ConfigurationBase  = _config.ConfigurationBase;
    module.exports.ConfigurationStrategy  = _config.ConfigurationStrategy;
    module.exports.ModuleLoaderStrategy  = _config.ModuleLoaderStrategy;
    module.exports.DefaultModuleLoaderStrategy  = _config.DefaultModuleLoaderStrategy;

    module.exports.IApplication = _app.IApplication;
    module.exports.IApplicationService = _app.IApplicationService;
    module.exports.ApplicationService = _app.ApplicationService;
    
}
