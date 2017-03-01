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
exports.DataModelView = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _types = require('./types');

var DataField = _types.DataField;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modelProperty = Symbol('model');

/**
 * @class
 * @property {string} title - Gets or sets the title of the current view
 * @property {string} name - Gets or sets the name of the current data view
 * @property {boolean} public - Gets or sets a boolean that indicates whether this data view is public or not.The default value is true.
 * @property {boolean} sealed - Gets or sets a boolean that indicates whether this data view is sealed or not. The default value is true.
 * @property {string|QueryExpression|*} filter - Gets or sets an open data formatted filter string or a query expression object associated with this view.
 * @property {string|*} order - Gets or sets an open data formatted order string or an order expression object associated with this view.
 * @property {string|*} group - Gets or sets an open data formatted group string or a group expression object associated with this view.
 * @property {Array} fields - Gets or sets the collection of data view's fields
 * @property {DataModel} model - Gets a DataModel instance that represents the parent model of the current view
 * @property {Array} attributes - A readonly collection of DataField instances
 */

var DataModelView = exports.DataModelView = function () {
    /**
     * @constructor
     * @param {DataModel} model - The parent model associated with this view
     */
    function DataModelView(model) {
        _classCallCheck(this, DataModelView);

        this.public = true;
        this.sealed = true;
        this.fields = [];
        this[modelProperty] = model;
    }

    /**
     * @returns {DataModel}
     */


    _createClass(DataModelView, [{
        key: 'cast',


        /**
         * Casts an object or an array of objects based on view's field collection.
         * @param {Array|*} obj
         * @returns {Array|*}
         */
        value: function cast(obj) {
            var self = this;
            var res = void 0;
            var localFields = _.filter(self.fields, function (y) {
                return !_.isNil(self.model.field(y.name));
            });
            if (_.isArray(obj)) {
                var _ret = function () {
                    var arr = [];
                    _.forEach(obj, function (x) {
                        res = {};
                        _.forEach(localFields, function (y) {
                            if (typeof x[y.name] !== 'undefined') res[y.name] = x[y.name];
                        });
                        arr.push(res);
                    });
                    return {
                        v: arr
                    };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } else {
                res = {};
                _.forEach(localFields, function (y) {
                    if (typeof obj[y.name] !== 'undefined') res[y.name] = obj[y.name];
                });
                return res;
            }
        }
    }, {
        key: 'model',
        get: function get() {
            return this[modelProperty];
        }

        /**
         * @returns {Array};
         */

    }, {
        key: 'attributes',
        get: function get() {
            var self = this;
            var attrs = [];
            _.forEach(this.fields, function (x) {
                if (self.model) {
                    var field = _.assign(new DataField(), self.model.field(x.name));
                    if (field) attrs.push(_.assign(field, x));else attrs.push(_.assign({}, x));
                } else attrs.push(_.assign({}, x));
            });
            return attrs;
        }
    }]);

    return DataModelView;
}();
//# sourceMappingURL=view.js.map
