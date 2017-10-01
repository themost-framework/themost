/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import {_} from 'lodash';
import path from 'path';
import {HttpApplicationService} from './interfaces';
import {AbstractClassError,AbstractMethodError} from '@themost/common/errors';
import {Args,TraceUtils} from '@themost/common/utils';
/**
 * @classdesc Represents the culture strategy of an HTTP application
 * @class
 * @abstract
 */
export class LocalizationStrategy extends HttpApplicationService {
    /**
     *
     * @param {HttpApplication} app
     */
    constructor(app) {
        Args.check(new.target !== LocalizationStrategy, new AbstractClassError());
        super(app);
    }

    /**
     * Gets a collection of available cultures
     * @abstract
     * @public
     */
    getCultures() {
        throw new AbstractMethodError();
    }

    /**
     * Gets the default culture of an HTTP application
     * @abstract
     * @public
     */
    getDefaultCulture() {
        throw new AbstractMethodError();
    }

    /**
     * Returns true if the given culture exists in available cultures
     * @param {string} culture
     */
    hasCulture(culture) {
        Args.notString(culture,'Culture');
        return typeof _.find(this.getCultures(), function(x) {
            return x===culture;
        }) === 'string';
    }

    /**
     * Returns the localized string of the given string
     * @param {string} locale - The target locale
     * @param {string} str - The string or key which is going to be localized
     * @param {string=} library - The library which contains the given text
     * @abstract
     */
    getLocaleString(locale, str, library) {
        throw new AbstractMethodError();
    }
}

const culturesProperty = Symbol('cultures');
const defaultCultureProperty = Symbol('cultures');
const librariesProperty = Symbol();

export class DefaultLocalizationStrategy extends LocalizationStrategy {
    /**
     *
     * @param {HttpApplication} app
     */
    constructor(app) {
        super(app);
        const config = this.getApplication().getConfiguration();
        this[culturesProperty] = ['en-us'];
        this[defaultCultureProperty] = ['en-us'];
        this[librariesProperty] = {};
        if (config.settings) {
            if (config.settings && config.settings.hasOwnProperty('localization')) {
                /**
                 * @type {{cultures:Array,default:string}}
                 */
                const localization = config.settings['localization'];
                if (_.isArray(localization.cultures))
                    this[culturesProperty] = localization.cultures;
                if (_.isString(localization.default))
                    this[defaultCultureProperty] = localization.default;
            }
        }
    }
    /**
     * Gets a collection of available cultures
     */
    getCultures() {
        return this[culturesProperty];
    }

    /**
     * Gets the default culture of an HTTP application
     */
    getDefaultCulture() {
        return this[defaultCultureProperty];
    }

    /**
     * Returns the localized string of the given string
     * @param {string} locale - The target locale
     * @param {string} text - The string or key which is going to be localized
     * @param {string=} library - The library which contains the given text
     */
    getLocaleString(locale, text, library) {
        let lib = 'global';
        if (library)
            lib = library;
        const libraries = this[librariesProperty];
        let locLibrary;
        if (libraries.hasOwnProperty(lib)) {
            locLibrary = libraries[lib];
            if (locLibrary.hasOwnProperty(locale)) {
                return locLibrary[locale][text];
            }
        }
        let libraryFile = path.resolve(this.getApplication().executionPath,'locales/'.concat(lib,'.',locale,'.json'));
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

    }
}