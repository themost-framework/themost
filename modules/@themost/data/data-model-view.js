/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2014-10-13.
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 Anthi Oikonomou anthioikonomou@gmail.com
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of MOST Web Framework nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @ignore
 */
var _ = require('lodash'),
    types = require('./types'),
    DataField = types.DataField;

/**
 * @class DataModelView
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
 * @param {DataModel} model - The parent model associated with this view
 * @constructor
 */
function DataModelView(model) {

    this.public = true;
    this.sealed = true;
    this.fields = [];
    var _model = model;
    Object.defineProperty(this,'model', {
        get: function() {
            return _model;
        }, configurable:false, enumerable: false
    });
    var self = this;
    Object.defineProperty(this,'attributes', {
        get: function() {
            var attrs = [];
            self.fields.forEach(function(x) {
                if (self.model) {
                    var field = _.assign(new DataField(), self.model.field(x.name));
                    if (field)
                        attrs.push(_.assign(field, x));
                    else
                        attrs.push(_.assign({}, x));
                }
                else
                //unbound view (?)
                    attrs.push(_.assign({}, x));

            });
            return attrs;
        }, configurable:false, enumerable: false
    });
}
/**
 * Casts an object or an array of objects based on view's field collection.
 * @param {Array|*} obj
 * @returns {Array|*}
 */
DataModelView.prototype.cast = function(obj) {
    var self = this, res;
    var localFields = this.fields.filter(function(y) {
        return !_.isNil(self.model.field(y.name));
    });
    if (_.isArray(obj)) {
        var arr = [];
        obj.forEach(function(x) {
            res = {};
            localFields.forEach(function(y) {
                if (typeof x[y.name] !== 'undefined')
                    res[y.name] = x[y.name];
            });
            arr.push(res);
        });
        return arr;
    }
    else {
        res = { };
        localFields.forEach(function(y) {
            if (typeof obj[y.name] !== 'undefined')
                res[y.name] = obj[y.name];
        });
        return res;
    }
};

if (typeof exports !== 'undefined')
{
    module.exports = {
        /**
         * @constructs DataModelView
         */
        DataModelView:DataModelView

    };
}