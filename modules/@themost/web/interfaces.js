'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpViewEngine = exports.HttpApplicationService = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


require('source-map-support/register');

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

var _errors = require('@themost/common/errors');

var AbstractMethodError = _errors.AbstractMethodError;
var AbstractClassError = _errors.AbstractClassError;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var applicationProperty = Symbol('application');
/**
 * @classdesc An abstract class which represents an HTTP application service
 * @class
 *
 */

var HttpApplicationService = exports.HttpApplicationService = function () {
  /**
   * @param {HttpApplication} app
   */
  function HttpApplicationService(app) {
    _classCallCheck(this, HttpApplicationService);

    Args.check(new.target !== HttpApplicationService, new AbstractClassError());
    Args.notNull(app, 'HTTP Application');
    this[applicationProperty] = app;
  }
  /**
   * @returns {HttpApplication}
   */


  _createClass(HttpApplicationService, [{
    key: 'getApplication',
    value: function getApplication() {
      return this[applicationProperty];
    }
  }]);

  return HttpApplicationService;
}();

var contextProperty = Symbol('context');

/**
 * @classdesc An abstract class which represents an HTTP application service
 * @class
 *
 */

var HttpViewEngine = exports.HttpViewEngine = function () {
  /**
   * @param {HttpContext} context
   */
  function HttpViewEngine(context) {
    _classCallCheck(this, HttpViewEngine);

    Args.check(new.target !== HttpViewEngine, new AbstractClassError());
    Args.notNull(context, 'HTTP context');
    this[contextProperty] = context;
  }
  /**
   * @returns {HttpContext}
   */


  _createClass(HttpViewEngine, [{
    key: 'getContext',
    value: function getContext() {
      return this[contextProperty];
    }

    /**
     * Renders the specified view with the options provided
     * @param {string} url
     * @param {*} options
     * @param {Function} callback
     */

  }, {
    key: 'render',
    value: function render(url, options, callback) {
      callback(new AbstractMethodError());
    }
  }]);

  return HttpViewEngine;
}();
//# sourceMappingURL=interfaces.js.map