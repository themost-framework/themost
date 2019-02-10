/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var AbstractMethodError = require("../common/errors").AbstractMethodError;
var AbstractClassError = require("../common/errors").AbstractClassError;
var LangUtils = require('@themost/common/utils').LangUtils;
var Args = require('@themost/common/utils').Args;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var path = require('path');
var HttpApplicationService = require('./types').HttpApplicationService;
var _ = require('lodash');
var  Symbol = require('symbol');
var sprintf = require('sprintf').sprintf;
var i18n = require('i18n');
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
 * @param {...string} str - The string or key which is going to be localized
 * @abstract
 * @returns {*}
 */
// eslint-disable-next-line no-unused-vars
LocalizationStrategy.prototype.getLocaleString = function(locale, str) {
    throw new AbstractMethodError();
};
/**
 * Sets localization data for the specified locale
 * @param {string} locale - A string which represents the target locale
 * @param {Object} data - An object which represents a collection of value-key pairs that are going to be used as localization data
 * @param {boolean=} shouldMerge - A boolean value which indicates whether the specified localization data will be appended to existing localization data or not.
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
LocalizationStrategy.prototype.setLocaleString = function(locale, data, shouldMerge) {
    throw new AbstractMethodError();
};

var culturesProperty = Symbol('cultures');
var defaultCultureProperty = Symbol('defaultCulture');
var librariesProperty = Symbol('libraries');
var defaultLibProperty = "global";

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
 * Resolves localization file path based on the given locale
 * @param {string} locale
 */
DefaultLocalizationStrategy.prototype.resolveLocalePath = function(locale) {
    return path.resolve(this.getApplication().getExecutionPath(),_.template('locales/global.${locale}.json')({ locale:locale }));
};

/**
 * Returns the localized string of the given string
 * @param {string} locale - The target locale
 * @param {...*} str - The string or key which is going to be localized
 * @abstract
 * @returns {*}
 */
// eslint-disable-next-line no-unused-vars
DefaultLocalizationStrategy.prototype.getLocaleString = function(locale, str) {
    var lib = 'global';
    var libraries = this[librariesProperty];
    var locLibrary;
    var locText;
    var args;
    if (libraries.hasOwnProperty(lib)) {
        locLibrary = libraries[lib];
        if (locLibrary.hasOwnProperty(locale)) {
            // get localized text
            locText =  locLibrary[locale][str] || str;
            // get arguments for final text
            args = Array.prototype.slice.call(arguments, 1);
            // replace the first arguments with the localized text
            args[0] = locText;
            // format text
            return sprintf.apply(sprintf, args);
        }
    }
    var libraryFile;
    try {
        libraryFile = this.resolveLocalePath(locale);
    }
    catch(err) {
        if (err.code === 'ENOENT' || err.code === 'MODULE_NOT_FOUND') {
            TraceUtils.debug('Cannot find localization module' + libraryFile + '.');
            return str;
        }
        throw err;
    }
    try {

        if (libraries.hasOwnProperty(lib))
            locLibrary = libraries[lib];
        else
            locLibrary = libraries[lib] = { };
        locLibrary[locale] = require(libraryFile);
        // get localized text
        locText = locLibrary[locale][str] || str;
        // get arguments for final text
        args = Array.prototype.slice.call(arguments, 1);
        // replace the first arguments with the localized text
        args[0] = locText;
        // format text
        return sprintf.apply(sprintf, args);
    }
    catch (err) {
        if (err.code === 'ENOENT' || err.code === 'MODULE_NOT_FOUND') {
            TraceUtils.debug('Cannot find localization module' + libraryFile + '.');
            return str;
        }
        throw err;
    }
};

/**
 * Sets localization data for the specified locale
 * @param {string} locale - A string which represents the target locale
 * @param {Object} data - An object which represents a collection of value-key pairs that are going to be used as localization data
 * @param {boolean=} shouldMerge - A boolean value which indicates whether the specified localization data will be appended to existing localization data or not.
 * If parameter is missing the specified data will be merged.
 */
DefaultLocalizationStrategy.prototype.setLocaleString = function(locale, data, shouldMerge) {
    var libraries = this[librariesProperty];
    //check if the given locale exists in application locales
    if (this.getCultures().indexOf(locale)<0) {
        throw new Error('Invalid locale. The specified locale does not exist in application locales.');
    }
    //validate locale data libraries["global"]["en-us"]
    libraries[defaultLibProperty] = libraries[defaultLibProperty] || {};
    libraries[defaultLibProperty][locale] = libraries[defaultLibProperty][locale] || {};
    if (typeof shouldMerge === 'undefined' || shouldMerge) {
        _.assign(libraries[defaultLibProperty][locale], data);
    }
    else {
        libraries[defaultLibProperty][locale] = data;
    }
};

/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @augments LocalizationStrategy
 */
function I18nLocalizationStrategy(app) {
    I18nLocalizationStrategy.super_.bind(this)(app);
    // get application locales and default locales
    var configuration = this.getApplication().getConfiguration();
    // get i18n options
    var options = _.assign({
        "locales": [ "en" ],
        "defaultLocale": "en",
        "directory": path.resolve(this.getApplication().getExecutionPath(),'i18n'),
        "autoReload": false
    }, configuration.getSourceAt('settings/i18n'));

    i18n.configure(options);
}
LangUtils.inherits(I18nLocalizationStrategy, DefaultLocalizationStrategy);

/**
 * Returns the localized string of the given string
 * @param {string} locale - The target locale
 * @param {...*} str - The string or key which is going to be localized
 * @abstract
 * @returns {string}
 */
/* eslint-disable-next-line no-unused-vars */
I18nLocalizationStrategy.prototype.getLocaleString = function(locale, str) {
    return i18n.__.apply({
        locale: locale
    }, Array.prototype.slice.call(arguments, 1));
};

I18nLocalizationStrategy.prototype.resolveLocalePath = function(locale) {
    if (typeof locale !== 'string') {
        throw new Error('Invalid locale parameter. Expected string.');
    }
    return path.resolve(this.getApplication().getExecutionPath(),_.template('i18n/${locale}.json')({ locale:locale.substr(0,2) }));
};
/**
 * Gets an array of strings which represents the available cultures
 * @returns {Array<string>}
 */
I18nLocalizationStrategy.prototype.getCultures = function() {
    return i18n.getLocales();
};

/**
 * Sets localization data for the specified locale
 * @param {string} locale - A string which represents the target locale
 * @param {Object} data - An object which represents a collection of value-key pairs that are going to be used as localization data
 * @param {boolean=} shouldMerge - A boolean value which indicates whether the specified localization data will be appended to existing localization data or not.
 * If parameter is missing the specified data will be merged.
 */
I18nLocalizationStrategy.prototype.setLocaleString = function(locale, data, shouldMerge) {
    // get catalog
    var catalog = i18n.getCatalog(locale);
    // if data should be merged
    if (typeof shouldMerge === 'undefined' || shouldMerge) {
        _.assign(catalog, data);
    }
    else {
        _.assign(catalog, data);
    }
};

if (typeof exports !== 'undefined')
{
    module.exports.LocalizationStrategy = LocalizationStrategy;
    module.exports.DefaultLocalizationStrategy = DefaultLocalizationStrategy;
    module.exports.I18nLocalizationStrategy = I18nLocalizationStrategy;
}
