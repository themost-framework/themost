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
exports.default = undefined;

var _data = require('./data');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @ignore
 * @constructor
 */
var HttpLookupController = function (_HttpDataController) {
  _inherits(HttpLookupController, _HttpDataController);

  /**
   * @constructor
   * @param {HttpContext} context
   */
  function HttpLookupController(context) {
    _classCallCheck(this, HttpLookupController);

    return _possibleConstructorReturn(this, (HttpLookupController.__proto__ || Object.getPrototypeOf(HttpLookupController)).call(this, context));
  }

  return HttpLookupController;
}(_data.HttpDataController);

exports.default = HttpLookupController;
//# sourceMappingURL=lookup.js.map
