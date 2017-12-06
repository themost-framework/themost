/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var ConfigurationBase = require('@themost/common/config').ConfigurationBase;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var PathUtils = require('@themost/common/utils').PathUtils;
var LangUtils = require('@themost/common/utils').LangUtils;
var Symbol = require('symbol');
var _ = require('lodash');

var routesProperty = Symbol('routes');

/**
 * Defines an HTTP view engine in application configuration
 * @class
 * @constructor
 */
function HttpViewEngineConfiguration()
{

    /**
     * @property
     * @type {string}
     * @name HttpViewEngineConfiguration#type
     * @description Gets or sets the class associated with an HTTP view engine
     *
     */

    /**
     * @property
     * @type {string}
     * @name HttpViewEngineConfiguration#name
     * @description Gets or sets a string which represents the name of an HTTP view engine
     */

    /** @property
     * @type {string}
     * @name HttpViewEngineConfiguration#extension
     * @description Gets or sets or sets a string which represents the extension associated with an HTTP view engine e.g. ejs, md etc
     */
}

/**
 * @class
 * @constructor
 */
function MimeTypeConfiguration() {
    /**
     * @property
     * @name MimeTypeConfiguration#extension
     * @type {string}
     * @description Gets or sets a string which represents an extension associated with this mime type e.g. .css, .html, .json etc
     */

    /**
     * @property
     * @name MimeTypeConfiguration#type
     * @type {string}
     * @description Gets or sets a string which represents a media type e.g. application/json, text/html etc.
     */
}

/**
 * @class
 * @constructor
 */
function HttpHandlerConfiguration() {
    /**
     * @property
     * @name HttpHandlerConfiguration#name
     * @type {string}
     * @description Gets or sets a string which represents a name for this HTTP handler e.g. auth, basic-auth, post, restrict-access etc
     */

    /**
     * @property
     * @name HttpHandlerConfiguration#type
     * @type {string}
     * @description Gets or sets a string which represents the module path of this HTTP handler.
     */
}

/**
 * @class
 * @constructor
 */
function HttpRouteConfiguration() {
    /**
     * @property
     * @name HttpRouteConfiguration#url
     * @type {string}
     * @description Gets or sets a string which the url pattern of an HTTP route e.g. /:controller/:action, /:controller/:id/:action etc
     */

    /**
     * @property
     * @name HttpRouteConfiguration#controller
     * @type {string}
     * @description Gets or sets a string which defines the controller associated with an HTTP route
     */

    /**
     * @property
     * @name HttpRouteConfiguration#action
     * @type {string}
     * @description Gets or sets a string which defines the action of an HTTP route
     */

    /**
     * @property
     * @name HttpRouteConfiguration#format
     * @type {string}
     * @description Gets or sets a string which represents a media type etc. json, html etc
     */

    /**
     * @property
     * @name HttpRouteConfiguration#mime
     * @type {string}
     * @description Gets or sets a string which represents mime type etc. application/json, text/html etc
     */

    /**
     * @property
     * @name HttpRouteConfiguration#params
     * @type {*}
     * @description Gets or sets a set of parameters associated with an HTTP route e.g. static query parameters
     */
}

/**
 * @class
 * @constructor
 * @param {string} configPath
 * @augments ConfigurationBase
 */
function HttpConfiguration(configPath) {
    HttpConfiguration.super_.bind(this)(configPath);
    if (!this.hasSourceAt('mimes')) { this.setSourceAt('mimes',[]); }
    if (!this.hasSourceAt('engines')) { this.setSourceAt('engines',[]); }
    if (!this.hasSourceAt('controllers')) { this.setSourceAt('controllers',[]); }
    try {
        this[routesProperty] = require(PathUtils.join(this.getConfigurationPath(),'routes.json'))
    }
    catch(err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            this[routesProperty] = require('./resources/routes.json');
        }
        else {
            TraceUtils.error('An error occurred while loading routes collection');
            TraceUtils.error(err);
        }
    }

    /**
     * @property
     * @name HttpConfiguration#engines
     * @type {Array.<HttpViewEngineConfiguration>}
     */

    Object.defineProperty(this, 'engines', {
        get:function() {
            return this.getSourceAt('engines');
        }
    });

    /**
     * @property
     * @name HttpConfiguration#mimes
     * @type {Array.<MimeTypeConfiguration>}
     */

    Object.defineProperty(this, 'mimes', {
        get:function() {
            return this.getSourceAt('mimes');
        }
    });

    /**
     * @property
     * @name HttpConfiguration#routes
     * @type {Array.<HttpRouteConfiguration>}
     */

    Object.defineProperty(this, 'routes', {
        get:function() {
            return this[routesProperty];
        }
    });

    /**
     * @property
     * @name HttpConfiguration#controllers
     * @type {Array}
     */

    Object.defineProperty(this, 'controllers', {
        get:function() {
            return this.getSourceAt('controllers');
        }
    });

    /**
     * @property
     * @name HttpConfiguration#handlers
     * @type {Array.<HttpHandlerConfiguration>}
     */

    Object.defineProperty(this, 'handlers', {
        get:function() {
            return this.getSourceAt('handlers');
        }
    });

}
LangUtils.inherits(HttpConfiguration, ConfigurationBase);

/**
 * Gets a mime type based on the given extension
 * @param {string} extension
 * @returns {*}
 */
HttpConfiguration.prototype.getMimeType = function(extension) {
    return _.find(this.mimes,function(x) {
        return (x.extension===extension) || (x.extension==='.'+extension);
    });
};

if (typeof exports !== 'undefined') {
    module.exports.HttpConfiguration = HttpConfiguration;
    module.exports.HttpViewEngineConfiguration = HttpViewEngineConfiguration;
    module.exports.MimeTypeConfiguration = MimeTypeConfiguration;
    module.exports.HttpRouteConfiguration = HttpRouteConfiguration;
    module.exports.HttpHandlerConfiguration = HttpHandlerConfiguration;
}