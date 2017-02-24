'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueryUtils = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _utils = require('./utils');

Object.keys(_utils).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _utils[key];
    }
  });
});

var _expressions = require('./expressions');

Object.keys(_expressions).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _expressions[key];
    }
  });
});

var _odata = require('./odata');

Object.keys(_odata).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _odata[key];
    }
  });
});

var _formatter = require('./formatter');

Object.keys(_formatter).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _formatter[key];
    }
  });
});

var _query = require('./query');

Object.keys(_query).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _query[key];
    }
  });
});
var QueryExpression = _query.QueryExpression;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QueryUtils = exports.QueryUtils = function () {
  function QueryUtils() {
    _classCallCheck(this, QueryUtils);
  }

  _createClass(QueryUtils, null, [{
    key: 'query',

    /**
     * Initializes a select query expression by specifying the entity name
     * @param {string|*} entity - The name of the entity
     */
    value: function query(entity) {
      return QueryExpression.create(entity);
    }
    /**
     * Initializes a select query expression
     * @param {*...} fields
     */

  }, {
    key: 'select',
    value: function select(fields) {
      var q = new QueryExpression();
      return q.select.apply(q, fields);
    }
    /**
     * Initializes an insert query expression
     * @param {*} obj - The object to insert
     */

  }, {
    key: 'insert',
    value: function insert(obj) {
      var q = new QueryExpression();
      return q.insert(obj);
    }

    /**
     * Initializes an update query expression
     * @param {string|*} entity - The name of the entity
     */

  }, {
    key: 'update',
    value: function update(entity) {
      var q = new QueryExpression();
      return q.update(entity);
    }

    /**
     * Initializes a delete query expression
     * @param {string} entity - The name of the entity
     */

  }, {
    key: 'delete',
    value: function _delete(entity) {
      var q = new QueryExpression();
      return q.delete(entity);
    }
  }]);

  return QueryUtils;
}();
//# sourceMappingURL=index.js.map
