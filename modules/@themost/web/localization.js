/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var AbstractMethodError = require("../common/errors").AbstractMethodError;
var AbstractClassError = require("../common/errors").AbstractClassError;
var LangUtils = require('@themost/common/utils').LangUtils;
var Args = require('@themost/common/utils').Args;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var path = require('path');
var HttpApplicationService = require('./types').HttpApplicationService;
var _ = require('lodash');
var  Symbol = require('symbol');
/**
 * @abstract
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @augments HttpApplicationService
 */
function LocalizationStrategy(app) {
    LocalizationStrategy.super_.bind(this)(app);
    if (this.constructor === LocalizationStrategy.prototype.constructor) {
        throw new AbstractClassError();
    }
}
LangUtils.inherits(LocalizationStrategy, HttpApplicationService);

/**
 * Gets a collection of available cultures
 * @abstract
 * @public
 * @returns {Array.<string>}
 */
LocalizationStrategy.prototype.getCultures = function() {
    throw new AbstractMethodError();
};

/**
 * Gets the default culture of an HTTP application
 * @abstract
 * @public
 * @returns {string}
 */
LocalizationStrategy.prototype.getDefaultCulture = function() {
    throw new AbstractMethodError();
};

/**
 * Returns true if the given culture exists in available cultures
 * @param {string} culture
 * @returns {boolean}
 */
LocalizationStrategy.prototype.hasCulture = function(culture) {
    Args.notString(culture,'Culture');
    return typeof _.find(this.getCultures(), function(x) {
        return x===culture;
    }) === 'string';
};

/**
 * Returns the localized string of the given string
 * @param {string} locale - The target locale
 * @param {string} str - The string or key which is going to be localized
 * @param {string=} library - The library which contains the given text
 * @abstract
 * @returns {*}
 */
// eslint-disable-next-line no-unused-vars
LocalizationStrategy.prototype.getLocaleString = function(locale, str, library) {
    throw new AbstractMethodError();
};

var culturesProperty = Symbol('cultures');
var defaultCultureProperty = Symbol('defaultCulture');
var librariesProperty = Symbol('libraries');

/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @augments LocalizationStrategy
 */
function DefaultLocalizationStrategy(app) {
    DefaultLocalizationStrategy.super_.bind(this)(app);
    var configuration = this.getApplication().getConfiguration();
    this[culturesProperty] = ['en-us'];
    this[defaultCultureProperty] = 'en-us';
    this[librariesProperty] = {};
    if (configuration.settings) {
        if (configuration.settings && configuration.settings.hasOwnProperty('localization')) {
            /**
             * @type {{cultures:Array,default:string}}
             */
            var localization = configuration.settings['localization'];
            if (_.isArray(localization.cultures))
                this[culturesProperty] = localization.cultures;
            if (_.isString(localization.default))
                this[defaultCultureProperty] = localization.default;
        }
    }

}
LangUtils.inherits(DefaultLocalizationStrategy, LocalizationStrategy);

/**
 * Gets a collection of available cultures
 * @public
 * @returns {Array.<string>}
 */
DefaultLocalizationStrategy.prototype.getCultures = function() {
    return this[culturesProperty];
};

/**
 * Gets the default culture of an HTTP application
 * @abstract
 * @public
 * @returns {string}
 */
DefaultLocalizationStrategy.prototype.getDefaultCulture = function() {
    return this[defaultCultureProperty];
};

/**
 * Returns the localized string of the given string
 * @param {string} locale - The target locale
 * @param {string} text - The string or key which is going to be localized
 * @param {string=} library - The library which contains the given text
 * @abstract
 * @returns {*}
 */
// eslint-disable-next-line no-unused-vars
DefaultLocalizationStrategy.prototype.getLocaleString = function(locale, text, library) {
    var lib = 'global';
    if (library)
        lib = library;
    var libraries = this[librariesProperty];
    var locLibrary;
    if (libraries.hasOwnProperty(lib)) {
        locLibrary = libraries[lib];
        if (locLibrary.hasOwnProperty(locale)) {
            return locLibrary[locale][text];
        }
    }
    var libraryFile = path.resolve(this.getApplication().getExecutionPath(),'locales/'.concat(lib,'.',locale,'.json'));
    try {
        if (libraries.hasOwnProperty(lib))
            locLibrary = libraries[lib];
        else
            locLibrary = libraries[lib] = { };
        locLibrary[locale] = require(libraryFile);
        return locLibrary[locale][text];
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            TraceUtils.error(err);
            return text;
        }
        throw err;
    }
};


if (typeof exports !== 'undefined')
{
    module.exports.LocalizationStrategy = LocalizationStrategy;
    module.exports.DefaulLocalizationStrategy = DefaultLocalizationStrategy;
}