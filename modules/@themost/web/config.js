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
exports.HttpConfiguration = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _config = require('@themost/common/config');

var ConfigurationStrategy = _config.ConfigurationStrategy;
var ConfigurationBase = _config.ConfigurationBase;

var _utils = require('@themost/common/utils');

var PathUtils = _utils.PathUtils;
var TraceUtils = _utils.TraceUtils;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var routesProperty = Symbol('routes');

var HttpConfiguration = exports.HttpConfiguration = function (_ConfigurationBase) {
    _inherits(HttpConfiguration, _ConfigurationBase);

    /**
     * @param {string} configPath
     */
    function HttpConfiguration(configPath) {
        _classCallCheck(this, HttpConfiguration);

        var _this = _possibleConstructorReturn(this, (HttpConfiguration.__proto__ || Object.getPrototypeOf(HttpConfiguration)).call(this, configPath));

        if (!_this.hasSourceAt('mimes')) {
            _this.setSourceAt('mimes', []);
        }
        if (!_this.hasSourceAt('engines')) {
            _this.setSourceAt('engines', []);
        }
        if (!_this.hasSourceAt('controllers')) {
            _this.setSourceAt('controllers', []);
        }
        try {
            _this[routesProperty] = require(PathUtils.join(_this.getConfigurationPath(), 'routes.json'));
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                _this[routesProperty] = require('./resources/routes.json');
            } else {
                TraceUtils.error('An error occurred while loading routes collection');
                TraceUtils.error(err);
            }
        }
        return _this;
    }

    /**
     * Gets a collection of mime types registered for the current application
     * @returns {Array}
     */


    _createClass(HttpConfiguration, [{
        key: 'getMimeType',


        /**
         * Gets a mime type based on the given extension
         * @param {string} extension
         * @returns {T}
         */
        value: function getMimeType(extension) {
            return _.find(this.mimes, function (x) {
                return x.extension === extension || x.extension === '.' + extension;
            });
        }
    }, {
        key: 'mimes',
        get: function get() {
            return this.getSourceAt('mimes');
        }

        /**
         * Gets a collection of mime types registered for the current application
         * @returns {Array}
         */

    }, {
        key: 'engines',
        get: function get() {
            return this.getSourceAt('engines');
        }

        /**
         * Gets a collection of mime types registered for the current application
         * @returns {Array}
         */

    }, {
        key: 'controllers',
        get: function get() {
            return this.getSourceAt('controllers');
        }

        /**
         * Gets a collection of routes registered for the current application
         * @returns {Array}
         */

    }, {
        key: 'routes',
        get: function get() {
            return this[routesProperty];
        }
    }]);

    return HttpConfiguration;
}(ConfigurationBase);
//# sourceMappingURL=config.js.map
