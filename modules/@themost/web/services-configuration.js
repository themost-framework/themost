/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var ModuleLoaderStrategy = require('@themost/common/config').ModuleLoaderStrategy;
var _ = require('lodash');

/**
 * @interface
 * @property {string} serviceType
 * @property {string} strategyType
 */
function ServiceConfigurationElement() {
    //
}

/**
 * @class
 * @constructor
 */
function ServicesConfiguration() {
    //
}

/**
 * Adds application services as they are defined in application configuration services section
 * @example
 * # config/app.json
 * {
 *      "services": [
 *          { "serviceType":"./services/my-service#MyService" },
 *          { "strategyType":"./services/my-service#MyStrategy", "serviceType":"./services/my-service#MyService" }
 *      ]
 * }
 *
 * @param {HttpApplication} app
 */
ServicesConfiguration.config = function(app) {
    /**
     * @type {Array<ServiceConfigurationElement>}
     */
    var services = app.getConfiguration().getSourceAt('services');
    if (_.isArray(services)) {
        _.forEach(services,
            /**
             * @param {ServiceConfigurationElement} x
             */
            function(x) {
                if (typeof x.serviceType === 'undefined' || x.serviceType === null) {
                    throw new Error('Invalid configuration. Service type cannot be empty at this context.');
                }
                var strategyType = x.strategyType || x.serviceType;
                var StrategyCtor;
                var ServiceCtor;
                var typeModule;
                var typeCtor;
                var hashIndex = strategyType.indexOf('#');
                if (hashIndex>-1) {
                    typeModule = app.getConfiguration().getStrategy(ModuleLoaderStrategy).require(strategyType.substr(0,hashIndex));
                    typeCtor = strategyType.substr(hashIndex+1,strategyType.length-hashIndex);
                    StrategyCtor = typeModule[typeCtor];
                }
                else {
                    StrategyCtor = app.getConfiguration().getStrategy(ModuleLoaderStrategy).require(strategyType);
                }
                hashIndex = x.serviceType.indexOf('#');
                if (hashIndex>-1) {
                    typeModule = app.getConfiguration().getStrategy(ModuleLoaderStrategy).require(x.serviceType.substr(0,hashIndex));
                    typeCtor = x.serviceType.substr(hashIndex+1,x.serviceType.length-hashIndex);
                    ServiceCtor = typeModule[typeCtor];
                }
                else {
                    ServiceCtor = app.getConfiguration().getStrategy(ModuleLoaderStrategy).require(x.serviceType);
                }
                app.useStrategy(StrategyCtor, ServiceCtor);
        });
    }
};


if (typeof exports !== 'undefined')
{
    module.exports.ServiceConfigurationElement = ServiceConfigurationElement;
    module.exports.ServicesConfiguration = ServicesConfiguration;
}