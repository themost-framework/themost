/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var AbstractMethodError = require("./errors").AbstractMethodError;
var AbstractClassError = require("./errors").AbstractClassError;
var LangUtils = require("./utils").LangUtils;
var Symbol = require('symbol');

/**
 *
 * @class
 * @abstract
 * @param {string=} configPath
 */
// eslint-disable-next-line no-unused-vars
function IApplication(configPath) {
    if (this.constructor === IApplication.prototype.constructor) {
        throw new AbstractClassError();
    }
}

/**
 * Registers an application strategy e.g. an singleton service which to be used in application contextr
 * @param {Function} serviceCtor
 * @param {Function} strategyCtor
 * @returns IApplication
 */
// eslint-disable-next-line no-unused-vars
IApplication.prototype.useStrategy = function(serviceCtor, strategyCtor) {
    throw new AbstractMethodError();
};

/**
* @param {Function} serviceCtor
* @returns {boolean}
*/
// eslint-disable-next-line no-unused-vars
IApplication.prototype.hasStrategy = function(serviceCtor) {
    throw new AbstractMethodError();
};

/**
 * Gets an application strategy based on the given base service type
 * @param {Function} serviceCtor
 * @return {*}
 */
// eslint-disable-next-line no-unused-vars
IApplication.prototype.getStrategy = function(serviceCtor) {
    throw new AbstractMethodError();
};
/**
 * @returns {ConfigurationBase}
 */
IApplication.prototype.getConfiguration = function() {
    throw new AbstractMethodError();
};


/**
 *
 * @class
 * @abstract
 * @param {IApplication} app
 */
// eslint-disable-next-line no-unused-vars
function IApplicationService(app) {
    if (this.constructor === IApplicationService.prototype.constructor) {
        throw new AbstractClassError();
    }
}

/**
 * @returns {IApplication}
 */
IApplicationService.prototype.getApplication = function() {
    throw new AbstractMethodError();
};
var applicationProperty = Symbol('application');
/**
 *
 * @class
 * @constructor
 * @param {IApplication} app
 */
// eslint-disable-next-line no-unused-vars
function ApplicationService(app) {
    ApplicationService.super_.bind(this)(app);
    this[applicationProperty] = app;
}
LangUtils.inherits(ApplicationService,IApplicationService);
/**
 * @returns {IApplication}
 */
ApplicationService.prototype.getApplication = function() {
    return this[applicationProperty];
};

module.exports.IApplication = IApplication;
module.exports.IApplicationService = IApplicationService;
module.exports.ApplicationService = ApplicationService;
