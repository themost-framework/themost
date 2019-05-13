/**
 * @licence
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-11-10
 *
 */
///
var LangUtils = require('@themost/common/utils').LangUtils;
var Q = require('q');
var _ = require('lodash');
var HttpResult = require('./mvc').HttpResult;
var ODataModelConventionBuilder = require('@themost/data/odata').ODataConventionModelBuilder;
var ODataModelBuilder = require('@themost/data/odata').ODataModelBuilder;
var DataConfiguration = require('@themost/data/data-configuration').DataConfiguration;

/**
 * @class
 * @constructor
 * @param {*=} data
 * @extends {HttpResult}
 * @property {EntitySetConfiguration} entitySet
 */
function ODataJsonResult(data) {
    ODataJsonResult.super_.bind(this)();
    this.data = data;
    this.contentType = 'application/json;charset=utf-8';
    this.contentEncoding = 'utf8';
}
LangUtils.inherits(ODataJsonResult,HttpResult);

ODataJsonResult.prototype.execute = function(context, callback) {
    var res = context.response;
    if (_.isNil(this.data)) {
        res.writeHead(204);
        return callback();
    }
};

/**
 * @class
 * @constructor
 */
function ODataModelBuilderConfiguration() {
    //
}

/**
 *
 * @param {HttpApplication} app
 * @returns Promise<ODataModelBuilder|TypeError>
 */
ODataModelBuilderConfiguration.config = function(app) {
    if (typeof app === 'undefined' || app === null) {
        return Q.reject(new TypeError('Application may not be null'))
    }
    //create by default a new model convention builder
    var builder = new ODataModelConventionBuilder(new DataConfiguration(app.getConfigurationPath()));
    //initialize builder
    return builder.initialize().then(function() {
        //register service
        app.useStrategy(ODataModelBuilder, function() {
            return builder;
        });
        //return newly created builder for further processing
        return Q.resolve(builder);
    });
};

ODataModelBuilderConfiguration.configSync = function(app) {
    if (typeof app === 'undefined' || app === null) {
        return Q.reject(new TypeError('Application may not be null'))
    }
    //create by default a new model convention builder
    var builder = new ODataModelConventionBuilder(new DataConfiguration(app.getConfigurationPath()));
    //initialize builder
    builder.initializeSync();
    //register service
    app.useStrategy(ODataModelBuilder, function() {
        return builder;
    });
    //return newly created builder for further processing
    return builder;
};

if (typeof module !== 'undefined') {
    module.exports.ODataModelBuilderConfiguration = ODataModelBuilderConfiguration;
    module.exports.ODataJsonResult = ODataJsonResult;
}
