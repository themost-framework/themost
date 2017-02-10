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
exports.HttpErrorConsumer = exports.HttpRouteConsumer = exports.HttpConsumer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HttpConsumer = exports.HttpConsumer = function () {
  /**
   * @param {Function} callable
   * @param {*=} params
   */
  function HttpConsumer(callable, params) {
    _classCallCheck(this, HttpConsumer);

    Args.check(_.isFunction(callable), 'Consumer must be a function');
    /**
     * @type {Function}
     */
    this.callable = callable;
    /**
     * Gets or sets the parameters associated with this consumer
     */
    this.params = params;
  }

  /**
   * @param {*} context
   * @param {...*} args
   */


  _createClass(HttpConsumer, [{
    key: 'run',
    value: function run(context, args) {
      this.callable.apply(context, args);
    }
  }]);

  return HttpConsumer;
}();

var HttpRouteConsumer = exports.HttpRouteConsumer = function (_HttpConsumer) {
  _inherits(HttpRouteConsumer, _HttpConsumer);

  /**
   * @param {string} route
   * @param {Function} callable
   * @param {*=} params
   */
  function HttpRouteConsumer(route, callable, params) {
    _classCallCheck(this, HttpRouteConsumer);

    Args.notEmpty(route, 'Consumer URI');

    var _this = _possibleConstructorReturn(this, (HttpRouteConsumer.__proto__ || Object.getPrototypeOf(HttpRouteConsumer)).call(this, callable, params));

    _this.route = route;
    return _this;
  }

  return HttpRouteConsumer;
}(HttpConsumer);

var HttpErrorConsumer = exports.HttpErrorConsumer = function () {
  /**
   * @param {Function} callable
   * @param {*=} params
   */
  function HttpErrorConsumer(callable, params) {
    _classCallCheck(this, HttpErrorConsumer);

    Args.check(_.isFunction(callable), 'Consumer must be a function');
    /**
     * @type {Function}
     */
    this.callable = callable;
    /**
     * Gets or sets the parameters associated with this consumer
     */
    this.params = params;
  }

  /**
   * @param {*} context
   * @param {Error|*} err
   */


  _createClass(HttpErrorConsumer, [{
    key: 'run',
    value: function run(context, err) {
      this.callable.call(context, err);
    }
  }]);

  return HttpErrorConsumer;
}();
//# sourceMappingURL=consumers.js.map
