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
import {_} from 'lodash';
import {DataField} from './types';

const modelProperty = Symbol('model');

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
export class DataModelView {
    /**
     * @constructor
     * @param {DataModel} model - The parent model associated with this view
     */
    constructor(model) {

        this.public = true;
        this.sealed = true;
        this.fields = [];
        this[modelProperty] = model;
    }

    /**
     * @returns {DataModel}
     */
    get model() {
        return this[modelProperty];
    }

    /**
     * @returns {Array};
     */
    get attributes() {
        const self = this;
        const attrs = [];
        _.forEach(this.fields, function(x) {
            if (self.model) {
                const field = _.assign(new DataField(), self.model.field(x.name));
                if (field)
                    attrs.push(_.assign(field, x));
                else
                    attrs.push(_.assign({}, x));
            }
            else
                attrs.push(_.assign({}, x));
        });
        return attrs;
    }



    /**
     * Casts an object or an array of objects based on view's field collection.
     * @param {Array|*} obj
     * @returns {Array|*}
     */
    cast(obj) {
        const self = this;
        let res;
        const localFields = _.filter(self.fields, function(y) {
            return !_.isNil(self.model.field(y.name));
        });
        if (_.isArray(obj)) {
            const arr = [];
            _.forEach(obj, function(x) {
                res = {};
                _.forEach(localFields, function(y) {
                    if (typeof x[y.name] !== 'undefined')
                        res[y.name] = x[y.name];
                });
                arr.push(res);
            });
            return arr;
        }
        else {
            res = { };
            _.forEach(localFields, function(y) {
                if (typeof obj[y.name] !== 'undefined')
                    res[y.name] = obj[y.name];
            });
            return res;
        }
    }
}