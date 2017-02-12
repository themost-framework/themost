/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DefaultLocalizationStrategy = exports.LocalizationStrategy = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _interfaces = require('./interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _errors = require('@themost/common/errors');

var AbstractClassError = _errors.AbstractClassError;
var AbstractMethodError = _errors.AbstractMethodError;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;
var TraceUtils = _utils.TraceUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @classdesc Represents the culture strategy of an HTTP application
 * @class
 * @abstract
 */
var LocalizationStrategy = exports.LocalizationStrategy = function (_HttpApplicationServi) {
    _inherits(LocalizationStrategy, _HttpApplicationServi);

    /**
     *
     * @param {HttpApplication} app
     */
    function LocalizationStrategy(app) {
        _classCallCheck(this, LocalizationStrategy);

        Args.check(new.target !== LocalizationStrategy, new AbstractClassError());
        return _possibleConstructorReturn(this, (LocalizationStrategy.__proto__ || Object.getPrototypeOf(LocalizationStrategy)).call(this, app));
    }

    /**
     * Gets a collection of available cultures
     * @abstract
     * @public
     */


    _createClass(LocalizationStrategy, [{
        key: 'getCultures',
        value: function getCultures() {
            throw new AbstractMethodError();
        }

        /**
         * Gets the default culture of an HTTP application
         * @abstract
         * @public
         */

    }, {
        key: 'getDefaultCulture',
        value: function getDefaultCulture() {
            throw new AbstractMethodError();
        }

        /**
         * Returns true if the given culture exists in available cultures
         * @param {string} culture
         */

    }, {
        key: 'hasCulture',
        value: function hasCulture(culture) {
            Args.notString(culture, 'Culture');
            return typeof _.find(this.getCultures(), function (x) {
                return x == culture;
            }) === 'string';
        }

        /**
         * Returns the localized string of the given string
         * @param {string} locale - The target locale
         * @param {string} str - The string or key which is going to be localized
         * @param {string=} library - The library which contains the given text
         */

    }, {
        key: 'getLocaleString',
        value: function getLocaleString(locale, str, library) {
            throw new AbstractMethodError();
        }
    }]);

    return LocalizationStrategy;
}(HttpApplicationService);

var culturesProperty = Symbol('cultures');
var defaultCultureProperty = Symbol('cultures');
var librariesProperty = Symbol();

var DefaultLocalizationStrategy = exports.DefaultLocalizationStrategy = function (_LocalizationStrategy) {
    _inherits(DefaultLocalizationStrategy, _LocalizationStrategy);

    /**
     *
     * @param {HttpApplication} app
     */
    function DefaultLocalizationStrategy(app) {
        _classCallCheck(this, DefaultLocalizationStrategy);

        var _this2 = _possibleConstructorReturn(this, (DefaultLocalizationStrategy.__proto__ || Object.getPrototypeOf(DefaultLocalizationStrategy)).call(this, app));

        var config = _this2.getApplication().getConfiguration();
        _this2[culturesProperty] = ['en-us'];
        _this2[defaultCultureProperty] = ['en-us'];
        _this2[librariesProperty] = {};
        if (config.settings) {
            if (config.settings && config.settings.hasOwnProperty('localization')) {
                /**
                 * @type {{cultures:Array,default:string}}
                 */
                var localization = config.settings['localization'];
                if (_.isArray(localization.cultures)) _this2[culturesProperty] = localization.cultures;
                if (_.isString(localization.default)) _this2[defaultCultureProperty] = localization.default;
            }
        }
        return _this2;
    }
    /**
     * Gets a collection of available cultures
     */


    _createClass(DefaultLocalizationStrategy, [{
        key: 'getCultures',
        value: function getCultures() {
            return this[culturesProperty];
        }

        /**
         * Gets the default culture of an HTTP application
         */

    }, {
        key: 'getDefaultCulture',
        value: function getDefaultCulture() {
            return this[defaultCultureProperty];
        }

        /**
         * Returns the localized string of the given string
         * @param {string} locale - The target locale
         * @param {string} text - The string or key which is going to be localized
         * @param {string=} library - The library which contains the given text
         */

    }, {
        key: 'getLocaleString',
        value: function getLocaleString(locale, text, library) {
            var lib = 'global';
            if (library) lib = library;
            var libraries = this[librariesProperty];
            var locLibrary = void 0;
            if (libraries.hasOwnProperty(lib)) {
                locLibrary = libraries[lib];
                if (locLibrary.hasOwnProperty(locale)) {
                    return locLibrary[locale][text];
                }
            }
            var libraryFile = path.resolve(this.getApplication().executionPath, 'locales/'.concat(lib, '.', locale, '.json'));
            try {
                if (libraries.hasOwnProperty(lib)) locLibrary = libraries[lib];else locLibrary = libraries[lib] = {};
                locLibrary[locale] = require(libraryFile);
                return locLibrary[locale][text];
            } catch (err) {
                if (err.code === 'ENOENT') {
                    TraceUtils.error(err);
                    return text;
                }
                throw err;
            }
        }
    }]);

    return DefaultLocalizationStrategy;
}(LocalizationStrategy);
//# sourceMappingURL=localization.js.map
