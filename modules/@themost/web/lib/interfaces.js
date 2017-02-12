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
exports.HttpApplicationService = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

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
//# sourceMappingURL=interfaces.js.map
