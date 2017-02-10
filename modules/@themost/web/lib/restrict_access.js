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
exports.RestrictAccessConsumer = exports.RestrictAccessService = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('@themost/common/errors');

var HttpUnauthorizedError = _errors.HttpUnauthorizedError;
var HttpBadRequestError = _errors.HttpBadRequestError;

var _utils = require('@themost/common/utils');

var TraceUtils = _utils.TraceUtils;

var _interfaces = require('./interfaces');

var HttpApplicationService = _interfaces.HttpApplicationService;

var _results = require('./results');

var HttpNextResult = _results.HttpNextResult;

var _consumers = require('./consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _lodash = require('lodash');

var _ = _lodash._;

var _rx = require('rx');

var Rx = _rx.Rx;

var _url = require('url');

var url = _interopRequireDefault(_url).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @property {string} description - Gets or sets a string that represents the description of this object
 * @property {*} path - Gets or sets a string that represents the target path associated with access settings.
 * @property {string} allow - Gets or sets a comma delimited string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
 * @property {string} deny - Gets or sets a string that represents the collection of users or groups where this access setting will be applied. A wildcard (*) may be used.
 */
var LocationSetting = function LocationSetting() {
    //

    _classCallCheck(this, LocationSetting);
};

var applicationProperty = Symbol('application');

var RestrictAccessService = exports.RestrictAccessService = function (_HttpApplicationServi) {
    _inherits(RestrictAccessService, _HttpApplicationServi);

    /**
     * @param {HttpApplication2} app
     */
    function RestrictAccessService(app) {
        _classCallCheck(this, RestrictAccessService);

        return _possibleConstructorReturn(this, (RestrictAccessService.__proto__ || Object.getPrototypeOf(RestrictAccessService)).call(this, app));
    }

    /**
     * @param {string} requestURL
     * @returns {Observable}
     */


    _createClass(RestrictAccessService, [{
        key: 'isNotRestricted',
        value: function isNotRestricted(requestURL) {
            try {
                if (_.isNil(requestURL)) {
                    return Rx.Observable.return(true);
                }
                var uri = url.parse(requestURL);
                var conf = this.getApplication().getConfiguration();
                if (_.isObject(conf.settings) && _.isObject(conf.settings.auth) && _.isArray(conf.settings.auth.locations)) {
                    /**
                     * @type {Array}
                     */
                    var locations = conf.settings.auth.locations;
                    for (var i = 0; i < locations.length; i++) {
                        /**
                         * @type {*|LocationSetting}
                         */
                        var location = locations[i];
                        if (/\*$/.test(location.path)) {
                            //wildcard search /something/*
                            if (uri.pathname.indexOf(location.path.replace(/\*$/, '')) == 0 && location.allow == '*') {
                                return Rx.Observable.return(true);
                            }
                        } else {
                            if (uri.pathname === location.path && location.allow == '*') {
                                return Rx.Observable.return(true);
                            }
                        }
                    }
                    return Rx.Observable.return(false);
                }
                return Rx.Observable.return(true);
            } catch (err) {
                return Rx.Observable.throw(err);
            }
        }
        /**
         * @param {string} requestURL
         * @returns {Observable}
         */

    }, {
        key: 'isRestricted',
        value: function isRestricted(requestURL) {
            return this.isNotRestricted(requestURL).flatMap(function (res) {
                return Rx.Observable.return(!res);
            });
        }
    }]);

    return RestrictAccessService;
}(HttpApplicationService);

/**
 * @class
 * @augments HttpHandler
 */


var RestrictHandler = function () {
    function RestrictHandler() {
        _classCallCheck(this, RestrictHandler);
    }

    _createClass(RestrictHandler, [{
        key: 'authorizeRequest',

        /**
         * Authenticates an HTTP request and sets user or anonymous identity.
         * @param {HttpContext} context
         * @param {Function} callback
         */
        value: function authorizeRequest(context, callback) {
            try {
                if (context.is('OPTIONS')) {
                    return callback();
                }
                if (context.user.name == 'anonymous') {
                    /**
                     * @type RestrictAccessService;
                     */
                    var svc = context.getApplication().getService(RestrictAccessService);
                    if (_.isNil(svc)) {
                        return callback();
                    }
                    svc.isRestricted(context.request.url).subscribe(function (res) {
                        if (res) {
                            return callback(new HttpUnauthorizedError());
                        }
                        return callback();
                    }, function (err) {
                        TraceUtils.log(err);
                        return callback(new HttpUnauthorizedError());
                    });
                } else {
                    callback();
                }
            } catch (e) {
                callback(e);
            }
        }
    }]);

    return RestrictHandler;
}();

var RestrictAccessConsumer = exports.RestrictAccessConsumer = function (_HttpConsumer) {
    _inherits(RestrictAccessConsumer, _HttpConsumer);

    function RestrictAccessConsumer() {
        _classCallCheck(this, RestrictAccessConsumer);

        return _possibleConstructorReturn(this, (RestrictAccessConsumer.__proto__ || Object.getPrototypeOf(RestrictAccessConsumer)).call(this, function () {
            /**
             * @type {HttpContext}
             */
            var context = this;
            try {
                var handler = new RestrictHandler();
                return Rx.Observable.fromNodeCallback(handler.authorizeRequest)(context).flatMap(function () {
                    return HttpNextResult.create().toObservable();
                });
            } catch (err) {
                return Rx.Observable.throw(err);
            }
        }));
    }

    return RestrictAccessConsumer;
}(HttpConsumer);
//# sourceMappingURL=restrict_access.js.map
