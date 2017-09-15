/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var _ = require('lodash');
var ConfigurationBase  = require('@themost/common/config').ConfigurationBase;
var LangUtils  = require('@themost/common/utils').LangUtils;
var PathUtils  = require('@themost/common/utils').PathUtils;
var sprintf  = require('sprintf').sprintf;
var TraceUtils  = require('@themost/common/utils').TraceUtils;
var Symbol = require('symbol');
var routesProperty = Symbol('routes');
/**
 * @class
 * @constructor
 * @param {string} configPath
 * @extends ConfigurationBase
 * @property {Array} mimes
 * @property {Array} engines
 * @property {*} controllers
 * @property {Array} routes
 */
function HttpConfiguration(configPath) {
    HttpConfiguration.super_.bind(this)(configPath);
    if (!this.hasSourceAt('mimes')) { this.setSourceAt('mimes',[]); }
    if (!this.hasSourceAt('engines')) { this.setSourceAt('engines',[]); }
    if (!this.hasSourceAt('controllers')) { this.setSourceAt('controllers',{}); }
    if (!this.hasSourceAt('handlers')) { this.setSourceAt('handlers',[]); }
    if (!this.hasSourceAt('settings')) { this.setSourceAt('settings',[]); }
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

    var self = this;
    Object.defineProperty(self, 'handlers', {
        get: function() {
            return self.getSourceAt('handlers');
        }, configurable:false, enumerable:false
    });
    //process handlers
    var handlers = this.getSourceAt('handlers'),
        defaultApplicationConfig = require('./resources/app.json');
    //default handlers
    var defaultHandlers = defaultApplicationConfig.handlers;
    for (var i = 0; i < defaultHandlers.length; i++) {
        (function(item) {
            if (typeof handlers.filter(function(x) { return x.name === item.name; })[0] === 'undefined') {
                handlers.push(item);
            }
        })(defaultHandlers[i]);
    }
    _.forEach(handlers,function (h) {
        try {
            var handlerPath = h.type;
            if (handlerPath.indexOf('/') === 0) {
                handlerPath = self.mapPath(handlerPath);
            }
            var handlerModule = require(handlerPath), handler = null;
            if (handlerModule) {
                if (typeof handlerModule.createInstance !== 'function') {
                    TraceUtils.log('The specified handler (%s) cannot be instantiated. The module does not export createInstance() function.', h.name);
                    return;
                }
                handler = handlerModule.createInstance();
                if (handler)
                    self.handlers.push(handler);
            }
        }
        catch (e) {
            throw new Error(sprintf('The specified handler (%s) cannot be loaded. %s', h.name, e.message));
        }
    });

    Object.defineProperty(self, 'mimes', {
        get: function() {
            return self.getSourceAt('mimes');
        }, configurable:false, enumerable:false
    });

    Object.defineProperty(self, 'engines', {
        get: function() {
            return self.getSourceAt('engines');
        }, configurable:false, enumerable:false
    });

    Object.defineProperty(self, 'controllers', {
        get: function() {
            return self.getSourceAt('controllers');
        }, configurable:false, enumerable:false
    });

    Object.defineProperty(self, 'routes', {
        get: function() {
            return self[routesProperty];
        }, configurable:false, enumerable:false
    });

}
LangUtils.inherits(HttpConfiguration, ConfigurationBase);

/**
 * Gets a mime type based on the given extension
 * @param {string} extension
 * @returns {T}
 */
HttpConfiguration.prototype.getMimeType = function(extension) {
    return _.find(this.mimes,function(x) {
        return (x.extension===extension) || (x.extension==='.'+extension);
    });
};

if (typeof exports !== 'undefined') {
    module.exports.HttpConfiguration = HttpConfiguration;
}