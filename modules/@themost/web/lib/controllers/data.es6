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

import util from 'util';
import Rx from 'rx';
import {_} from 'lodash';
import xml from 'most-xml';
import {HttpController} from './../mvc';
import {httpGet,httpAction} from './../decorators';
import {HttpError,HttpMethodNotAllowedError,HttpBadRequestError,HttpNotFoundError,HttpServerError} from '@themost/common/errors';
import {TraceUtils} from '@themost/common/utils';
import {httpPut, httpPost, httpDelete} from "../decorators";


/**
 * @classdesc HttpDataController class describes a common MOST Web Framework data controller.
 * This controller is inherited by default from all data models. It offers a set of basic actions for CRUD operations against data objects
 * and allows filtering, paging, sorting and grouping data objects with options similar to [OData]{@link http://www.odata.org/}.
 <h2>Basic Features</h2>
 <h3>Data Filtering ($filter query option)</h3>
 <p>Logical Operators</p>
 <p>The following table contains the logical operators supported in the query language:</p>
  <table class="table-flat">
    <thead><tr><th>Operator</th><th>Description</th><th>Example</th></tr></thead>
    <tbody>
        <tr><td>eq</td><td>Equal</td><td>/Order/index.json?$filter=customer eq 353</td></tr>
        <tr><td>ne</td><td>Not Equal</td><td>/Order/index.json?$filter=orderStatus/alternateName ne 'OrderDelivered'</td></tr>
        <tr><td>gt</td><td>Greater than</td><td>/Order/index.json?$filter=orderedItem/price gt 1000</td></tr>
        <tr><td>ge</td><td>Greater than or equal</td><td>/Order/index.json?$filter=orderedItem/price ge 500</td></tr>
        <tr><td>lt</td><td>Lower than</td><td>/Order/index.json?$filter=orderedItem/price lt 500</td></tr>
        <tr><td>le</td><td>Lower than or equal</td><td>/Order/index.json?$filter=orderedItem/price le 1000</td></tr>
        <tr><td>and</td><td>Logical and</td><td>/Order/index.json?$filter=orderedItem/price gt 1000 and orderStatus/alternateName eq 'OrderPickup'</td></tr>
        <tr><td>or</td><td>Logical or</td><td>/Order/index.json?$filter=orderStatus/alternateName eq 'OrderPickup' or orderStatus/alternateName eq 'OrderProcessing'</td></tr>
    </tbody>
 </table>
 <p>Arithmetic Operators</p>
 <p>The following table contains the arithmetic operators supported in the query language:</p>
 <table class="table-flat">
     <thead><tr><th>Operator</th><th>Description</th><th>Example</th></tr></thead>
     <tbody>
     <tr><td>add</td><td>Addition</td><td>/Order/index.json?$filter=(orderedItem/price add 10) gt 1560</td></tr>
     <tr><td>sub</td><td>Subtraction</td><td>/Order/index.json?$filter=(orderedItem/price sub 10) gt 1540</td></tr>
     <tr><td>mul</td><td>Multiplication</td><td>/Order/index.json?$filter=(orderedItem/price mul 1.20) gt 1000</td></tr>
     <tr><td>div</td><td>Division</td><td>/Order/index.json?$filter=(orderedItem/price div 2) le 500</td></tr>
     <tr><td>mod</td><td>Modulo</td><td>/Order/index.json?$filter=(orderedItem/price mod 2) eq 0</td></tr>
     </tbody>
 </table>
 <p>Functions</p>
 <p>A set of functions are also defined for use in $filter query option:</p>
 <table class="table-flat">
     <thead><tr><th>Function</th><th>Example</th></tr></thead>
     <tbody>
        <tr><td colspan="2"><b>String Functions</b></td></tr>
        <tr><td>startswith(field,string)</td><td>/Product/index.json?$filter=startswith(name,'Apple') eq true</td></tr>
        <tr><td>endswith(field,string)</td><td>/Product/index.json?$filter=endswith(name,'Workstation') eq true</td></tr>
        <tr><td>contains(field,string)</td><td>/Product/index.json?$filter=contains(name,'MacBook') eq true</td></tr>
         <tr><td>length(field)</td><td>/Product/index.json?$filter=length(name) gt 40</td></tr>
         <tr><td>indexof(field,string)</td><td>/Product/index.json?$filter=indexof(name,'Air') gt 1</td></tr>
         <tr><td>substring(field,number)</td><td>/Product/index.json?$filter=substring(category,1) eq 'aptops'</td></tr>
         <tr><td>substring(field,number,number)</td><td>/Product/index.json?$filter=substring(category,1,2) eq 'ap'</td></tr>
         <tr><td>tolower(field)</td><td>/Product/index.json?$filter=tolower(category) eq 'laptops'</td></tr>
         <tr><td>toupper(field)</td><td>/Product/index.json?$filter=toupper(category) eq 'LAPTOPS'</td></tr>
         <tr><td>trim(field)</td><td>/Product/index.json?$filter=trim(category) eq 'Laptops'</td></tr>
 <tr><td colspan="2"><b>Date Functions</b></td></tr>
 <tr><td>day(field)</td><td>/Order/index.json?$filter=day(orderDate) eq 4</td></tr>
 <tr><td>month(field)</td><td>/Order/index.json?$filter=month(orderDate) eq 6</td></tr>
 <tr><td>year(field)</td><td>/Order/index.json?$filter=year(orderDate) ge 2014</td></tr>
 <tr><td>hour(field)</td><td>/Order/index.json?$filter=hour(orderDate) ge 12 and hour(orderDate) lt 14</td></tr>
 <tr><td>minute(field)</td><td>/Order/index.json?$filter=minute(orderDate) gt 15 and minute(orderDate) le 30</td></tr>
 <tr><td>second(field)</td><td>/Order/index.json?$filter=second(orderDate) ge 0 and second(orderDate) le 45</td></tr>
 <tr><td>date(field)</td><td>/Order/index.json?$filter=date(orderDate) eq '2015-03-20'</td></tr>
 <tr><td colspan="2"><b>Math Functions</b></td></tr>
 <tr><td>round(field)</td><td>/Product/index.json?$filter=round(price) le 389</td></tr>
 <tr><td>floor(field)</td><td>/Product/index.json?$filter=floor(price) eq 389</td></tr>
 <tr><td>ceiling(field)</td><td>/Product/index.json?$filter=ceiling(price) eq 390</td></tr>
      </tbody>
 </table>
 <h3>Attribute Selection ($select query option)</h3>
 <p>The following table contains attribute selection expressions supported in the query language:</p>
 <table class="table-flat">
     <thead><tr><th>Description</th><th>Example</th></tr></thead>
     <tbody>
     <tr><td>Select attribute</td><td>/Order/index.json?$select=id,customer,orderStatus</td></tr>
     <tr><td>Select attribute with alias</td><td>/Order/index.json?$select=id,customer/description as customerName,orderStatus/name as orderStatusName</td></tr>
     <tr><td>Select attribute with aggregation</td><td>/Order/index.json?$select=count(id) as totalCount&$filter=orderStatus/alternateName eq 'OrderProcessing'</td></tr>
     <tr><td>&nbsp;</td><td>/Product/index.json?$select=max(price) as maxPrice&$filter=category eq 'Laptops'</td></tr>
     <tr><td>&nbsp;</td><td>/Product/index.json?$select=min(price) as minPrice&$filter=category eq 'Laptops'</td></tr>
 </tbody>
 </table>
 <h3>Data Sorting ($orderby or $order query options)</h3>
 <table class="table-flat">
     <thead><tr><th>Description</th><th>Example</th></tr></thead>
     <tbody>
        <tr><td>Ascending order</td><td>/Product/index.json?$orderby=name</td></tr>
        <tr><td>Descending order</td><td>/Product/index.json?$orderby=category desc,name desc</td></tr>
     </tbody>
 </table>
  <h3>Data Paging ($top, $skip and $inlinecount query options)</h3>
 <p>The $top query option allows developers to apply paging in the result-set by giving the max number of records for each page. The default value is 25.
 The $skip query option provides a way to skip a number of records. The default value is 0.
 The $inlinecount query option includes in the result-set the total number of records of the query expression provided:
 <pre class="prettyprint"><code>
 {
     "total": 94,
     "records": [ ... ]
 }
  </code></pre>
 <p>The default value is false.</p>
  </p>
   <table class="table-flat">
      <thead><tr><th>Description</th><th>Example</th></tr></thead>
      <tbody>
      <tr><td>Limit records</td><td>/Product/index.json?$top=5</td></tr>
      <tr><td>Skip records</td><td>/Product/index.json?$top=5&$skip=5</td></tr>
      <tr><td>Paged records</td><td>/Product/index.json?$top=5&$skip=5&$inlinecount=true</td></tr>
      </tbody>
  </table>
  <h3>Data Grouping ($groupby or $group query options)</h3>
  <p>The $groupby query option allows developers to group the result-set by one or more attributes</p>
  <table class="table-flat">
  <thead><tr><th>Description</th><th>Example</th></tr></thead>
  <tbody>
  <tr><td>group</td><td>/Product/index.json?$select=count(id) as totalCount,category&$groupby=category</td></tr>
  <tr><td>group and sort</td><td>/Product/index.json?$select=count(id) as totalCount,category&$groupby=category&$orderby=count(id) desc</td></tr>
  </tbody>
  </table>
 <h3>Data Expanding ($expand)</h3>
 <p>The $expand query option forces response to include associated objects which are not marked as expandable by default.</p>
 <table class="table-flat">
     <thead><tr><th>Description</th><th>Example</th></tr></thead>
     <tbody>
     <tr><td>expand</td><td>/Order/index.json?$filter=orderStatus/alternateName eq 'OrderProcessing'&$expand=customer</td></tr>
     </tbody>
 </table>
 <p>The $expand option is optional for a <a href="https://docs.themost.io/most-data/DataField.html">DataField</a> marked as expandable.</p>
 * @class
 * @constructor
 * @augments HttpController
 * @property {DataModel} model - Gets or sets the current data model.
 * @memberOf module:most-web.controllers
 */
export default class HttpDataController extends HttpController {
    /**
     * @constructor
     * @param {HttpContext} context
     */
    constructor(context) {
        super(context);
        let model_;
        const self = this;
        Object.defineProperty(this, 'model', {
            get: function() {
                if (model_)
                    return model_;
                model_ = self.context.model(self.name);
                return model_;
            },
            set: function(value) {
                model_ = value;
            }, configurable:false, enumerable:false
        });
    }

    /**
     * Handles data object creation (e.g. /user/new.html, /user/new.json etc)
     * @returns {Observable}
     */
    @httpGet()
    @httpAction('new')
    getNewItem() {

        return Rx.Observable.fromNodeCallback(function(callback) {
            callback(null, {});
        })();

        try {
            const self = this, context = self.context;
            context.handle(['GET'],function() {
                callback(null, self.result());
            }).handle(['POST', 'PUT'],function() {
                const target = self.model.convert(context.params[self.model.name] || context.params.data, true);
                self.model.save(target, function(err)
                {
                    if (err) {
                        callback(HttpError.create(err));
                    }
                    else {
                        if (context.params.attr('returnUrl'))
                            callback(null, context.params.attr('returnUrl'));
                        callback(null, self.result(target));
                    }
                });
            }).unhandle(function() {
                callback(new HttpMethodNotAllowedError());
            });
        }
        catch (e) {
            callback(HttpError.create(e));
        }
    }

    /**
     * Handles data object insertion (e.g. /user/new.html, /user/new.json etc)
     * @returns {Observable}
     */
    @httpPost()
    @httpAction('new')
    postNewItem(data) {
        const self = this;
        return Rx.Observable.fromNodeCallback(function(callback) {
            if (_.isArray(data)) {
                return callback(new HttpBadRequestError());
            }
            const target = self.model.convert(data, true);
            self.model.insert(target, function(err)
            {
                if (err) {
                    callback(HttpError.create(err));
                }
                else {
                    callback(null, target);
                }
            });
        })();
    }

    /**
     * Handles data object insertion (e.g. /user/new.html, /user/new.json etc)
     * @returns {Observable}
     */
    @httpPut()
    @httpAction('new')
    putNewItem(data) {
        return this.postNewItem(data);
    }

    @httpGet()
    @httpAction('schema')
    getSchema() {
        const self = this, context = self.context;
        return Rx.Observable.fromNodeCallback(function(callback) {
            if (self.model) {
                //prepare client model
                const clone = JSON.parse(JSON.stringify(self.model));
                const m = util._extend({}, clone);
                //delete private properties
                const keys = Object.keys(m);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (key.indexOf("_")==0)
                        delete m[key];
                }
                //delete other server properties
                delete m.mappings_;
                delete m.view;
                delete m.source;
                delete m.fields;
                delete m.privileges;
                delete m.constraints;
                delete m.eventListeners;
                //set fields equal attributes
                m.attributes = JSON.parse(JSON.stringify(self.model.attributes));
                m.attributes.forEach(function(x) {
                    const mapping = self.model.inferMapping(x.name);
                    if (mapping)
                        x.mapping = JSON.parse(JSON.stringify(mapping));
                    //delete private properties
                    delete x.value;
                    delete x.calculation;
                });
                //prepare views and view fields
                if (m.views) {
                    m.views.forEach(function(view) {
                        if (view.fields) {
                            view.fields.forEach(function(field) {
                                if (/\./.test(field.name)==false) {
                                    //extend view field
                                    const name = field.name;
                                    const mField = m.attributes.filter(function(y) {
                                        return (y.name==name);
                                    })[0];
                                    if (mField) {
                                        for (const key in mField) {
                                            if (mField.hasOwnProperty(key) && !field.hasOwnProperty(key)) {
                                                field[key] = mField[key];
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
                callback(null, m);
            }
            else {
                callback(new HttpNotFoundError());
            }
        })();

    }

    /**
     * Handles data object display (e.g. /user/1/edit.html, /user/1/edit.json etc)
     * @param {*} id
     * @returns {Observable}
     */
    @httpGet()
    @httpAction('edit')
    editItem(id) {
        return this.getItem(id);
    }

    /**
     * Handles data object post (e.g. /user/1/edit.html, /user/1/edit.json etc)
     * @param {*} id
     * @returns {Observable|*}
     */
    @httpPost()
    @httpAction('edit')
    postItem(id) {
        const self = this;
        return Rx.Observable.fromNodeCallback(function(callback) {
            const target = self.model.convert(data, true);
            if (target) {
                self.model.save(target, function(err)
                {
                    if (err) {
                        callback(HttpError.create(err));
                    }
                    else {
                        return callback(null, target);
                    }
                });
            }
            else {
                callback(new HttpBadRequestError());
            }
        })();
    }

    /**
     * Handles data object put (e.g. /user/1/edit.html, /user/1/edit.json etc)
     * @param {*} id
     * @returns {Observable|*}
     */
    @httpPut()
    @httpAction('edit')
    putItem(id) {
        return this.postItem(id);
    }

    /**
     * Handles data object post (e.g. /user/1/edit.html, /user/1/edit.json etc)
     * @param {*} id
     * @returns {Observable|*}
     */
    @httpDelete()
    @httpAction('edit')
    deleteItem(id) {
        const self = this;
        return Rx.Observable.fromPromise(function(id) {
                return self.model.where(self.model.getPrimaryKey()).equal(id).first().then(function(item) {
                    if (_.isNil(item)) {
                        throw new HttpNotFoundError();
                    }
                    return self.model.remove(item);
                });
            })(id);
    }

    /**
     * Handles data object display (e.g. /user/1/show.html, /user/1/show.json etc)
     * @param {*} id
     * @returns {Observable|*}
     */
    @httpGet()
    @httpAction('show')
    getItem(id) {
        return Rx.Observable.fromPromise(this.model.where(this.model.getPrimaryKey()).equal(id).first)(id);
    }
    /**
     * @param {Function} callback
     * @private
     */
    filter(callback) {

        const self = this, params = self.context.params;

        if (typeof self.model !== 'object' || self.model == null) {
            callback(new Error('Model is of the wrong type or undefined.'));
            return;
        }

        const filter = params.$filter, select = params.$select, search = params.$search, skip = params.$skip || 0, levels = parseInt(params.$levels), orderBy = params.$order || params.$orderby, groupBy = params.$group || params.$groupby, expand = params.$expand;

        self.model.filter(filter,
            /**
             * @param {Error} err
             * @param {DataQueryable} q
             */
             function (err, q) {
                try {
                    if (err) {
                        return callback(err);
                    }
                    else {
                        if ((typeof search === 'string') && (search.length>0)) {
                            q.search(search);
                        }
                        //set $groupby
                        if (groupBy) {
                            q.groupBy.apply(q, groupBy.split(',').map(function(x) {
                                return x.replace(/^\s+|\s+$/g, '');
                            }));
                        }
                        //set $select
                        if (select) {
                            q.select.apply(q, select.split(',').map(function(x) {
                                return x.replace(/^\s+|\s+$/g, '');
                            }));
                        }
                        //set $skip
                        if (!/^\d+$/.test(skip)) {
                            return callback(new HttpBadRequestError("Skip may be a non-negative integer."))
                        }
                        //set expandable levels
                        if (!isNaN(levels)) {
                            q.levels(levels);
                        }
                        q.skip(skip);
                        //set $orderby
                        if (orderBy) {
                            orderBy.split(',').map(function(x) {
                                return x.replace(/^\s+|\s+$/g, '');
                            }).forEach(function(x) {
                                if (/\s+desc$/i.test(x)) {
                                    q.orderByDescending(x.replace(/\s+desc$/i, ''));
                                }
                                else if (/\s+asc/i.test(x)) {
                                    q.orderBy(x.replace(/\s+asc/i, ''));
                                }
                                else {
                                    q.orderBy(x);
                                }
                            });
                        }
                        if (expand) {
                            const resolver = require("most-data/data-expand-resolver");
                            const matches = resolver.testExpandExpression(expand);
                            if (matches && matches.length>0) {
                                q.expand.apply(q, matches);
                            }
                        }
                        //return
                        callback(null, q);
                    }
                }
                catch (e) {
                   callback(e);
                }
            });
    }

    @httpGet()
    @httpAction('index')
    getItems() {
        const self = this, context = self.context;
        return Rx.Observable.fromNodeCallback(function(callback) {

            const top = parseInt(context.params.attr('$top')),
                take = top > 0 ? top : (top == -1 ? top : 25),
                count = /^true$/ig.test(context.params.attr('$inlinecount')) || false,
                first = /^true$/ig.test(context.params.attr('$first')) || false,
                asArray = /^true$/ig.test(context.params.attr('$array')) || false;

            self.filter(
                /**
                 * @param {Error} err
                 * @param {DataQueryable=} q
                 */
                function(err, q) {
                    try {
                        if (err) {
                            return callback(HttpError.create(err));
                        }
                        //apply as array parameter
                        q.asArray(asArray);
                         if (first) {
                            return q.first().then(function(result) {
                                return callback(null, result);
                            }).catch(function(err) {
                                return callback(HttpError.create(err));
                            });
                        }

                        if (take<0) {
                            return q.all().then(function(result) {
                                if (count) {
                                    return callback(null, self.result({
                                        records:result,
                                        total:result.length
                                    }));
                                }
                                else {
                                    return callback(null, result);
                                }
                            }).catch(function(err) {
                                return callback(HttpError.create(err));
                            });
                        }
                        else {
                            if (count) {
                                return q.take(take).list().then(function(result) {
                                    return callback(null, result);
                                }).catch(function(err) {
                                    return callback(HttpError.create(err));
                                });
                            }
                            else {
                                return q.take(take).getItems().then(function(result) {
                                    return callback(null, result);
                                }).catch(function(err) {
                                    return callback(HttpError.create(err));
                                });
                            }
                        }
                    }
                    catch (err) {
                        return callback(err);
                    }
                });
        })();
    }
    /**
     * @param {*} data
     */
    @httpPut()
    @httpAction('index')
    putItems(data) {
        return this.postItems(data);
    }

    /**
     * @param {*} data
     */
    @httpPost()
    @httpAction('index')
    postItems(data) {
        const self = this;
        return Rx.Observable.fromNodeCallback(function(callback) {
            let target;
            try {
                target = self.model.convert(data, true);
            }
            catch(err) {
                TraceUtils.log(err);
                const err1 = new HttpError(422, "An error occured while converting data objects.", err.message);
                err1.code = 'EDATA';
                return callback(err1);
            }
            if (target) {
                self.model.save(target, function(err)
                {
                    if (err) {
                        TraceUtils.log(err);
                        callback(HttpError.create(err));
                    }
                    else {
                        callback(null, self.result(target));
                    }
                });
            }
            else {
                return callback(new HttpBadRequestError());
            }
        })();
    }

    @httpDelete()
    @httpAction('index')
    deleteItems(data) {
        const self = this;
        return Rx.Observable.fromNodeCallback(function(callback) {
            //get data
            let target;
            try {
                target = self.model.convert(data, true);
            }
            catch(err) {
                TraceUtils.log(err);
                const er = new HttpError(422, "An error occured while converting data objects.", err.message);
                er.code = 'EDATA';
                return callback(er);
            }
            if (target) {
                self.model.remove(target, function(err)
                {
                    if (err) {
                        callback(HttpError.create(err));
                    }
                    else {
                        callback(null, self.result(target));
                    }
                });
            }
            else {
                return callback(new HttpBadRequestError());
            }
        })();
    }

    /**
     * Returns an instance of HttpResult class which contains a collection of items based on the specified association.
     * This association should be a one-to-many association or many-many association.
     * A routing for this action may be:
     <pre class="prettyprint"><code>
     { "url":"/:controller/:parent/:model/index.json", "mime":"application/json", "action":"association" }
     </code></pre>
     <p>
     or
     </p>
     <pre class="prettyprint"><code>
     { "url":"/:controller/:parent/:model/index.html", "mime":"text/html", "action":"association" }
     </code></pre>
      <pre class="prettyprint"><code>
     //get orders in JSON format
     /GET /Party/353/Order/index.json
     </code></pre>
     <p>
     This action supports common query options like $filter, $order, $top, $skip etc.
     The result will be a result-set with associated items:
     </p>
     <pre class="prettyprint"><code>
        //JSON Results:
     {
            "total": 8,
            "skip": 0,
            "records": [
                {
                "id": 37,
                "customer": 353,
                "orderDate": "2015-05-05 01:19:34.000+03:00",
                "orderedItem": {
                    "id": 407,
                    "additionalType": "Product",
                    "category": "PC Components",
                    "price": 1625.49,
                    "model": "HR5845",
                    "releaseDate": "2015-09-20 03:35:33.000+03:00",
                    "name": "Nvidia GeForce GTX 650 Ti Boost",
                    "dateCreated": "2015-11-23 14:53:04.884+02:00",
                    "dateModified": "2015-11-23 14:53:04.887+02:00"
                },
                "orderNumber": "OFV804",
                "orderStatus": {
                    "id": 1,
                    "name": "Delivered",
                    "alternateName": "OrderDelivered",
                    "description": "Representing the successful delivery of an order."
                },
                "paymentDue": "2015-05-25 01:19:34.000+03:00",
                "paymentMethod": {
                    "id": 6,
                    "name": "Direct Debit",
                    "alternateName": "DirectDebit",
                    "description": "Payment by direct debit"
                },
                "additionalType": "Order",
                "dateCreated": "2015-11-23 21:00:18.264+02:00",
                "dateModified": "2015-11-23 21:00:18.266+02:00"
                }
            ...]
       ...
    }
    </code></pre>
     *@returns {Observable}
     */
    @httpGet()
    @httpAction('association')
    getAssociatedItems(parent, model) {
        const self = this;
        return Rx.Observable.fromNodeCallback(function(callback) {
            if (_.isNil(parent) || _.isNil(model)) {
                return callback(new HttpBadRequestError());
            }
            self.model.where(self.model.primaryKey).equal(parent).select([self.model.primaryKey]).first(function(err, result) {
                if (err) {
                    TraceUtils.log(err);
                    callback(new HttpServerError());
                    return;
                }
                if (_.isNil(result)) {
                    callback(new HttpNotFoundError());
                    return;
                }
                //get parent object (DataObject)
                const obj = self.model.convert(result);
                const associatedModel = self.context.model(model);
                if (_.isNil(associatedModel)) {
                    callback(new HttpNotFoundError());
                    return;
                }
                /**
                 * Search for object junction
                 */
                let field = self.model.attributes.filter(function(x) { return x.type === associatedModel.name; })[0], mapping;
                if (field) {
                    /**
                     * Get association mapping fo this field
                     * @type {DataAssociationMapping}
                     */
                    mapping = self.model.inferMapping(field.name);
                    if (mapping) {
                        if ((mapping.parentModel===self.model.name) && (mapping.associationType==='junction')) {
                            /**
                             * @type {DataQueryable}
                             */
                            const junction = obj.property(field.name);
                            junction.model.filter(self.context.params, function(err, q) {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    //merge properties
                                    if (q.query.$select) { junction.query.$select = q.query.$select; }
                                    if (q.query.$group) { junction.query.$group = q.query.$group; }
                                    if (q.query.$order) { junction.query.$order = q.query.$order; }
                                    if (q.query.$prepared) { junction.query.$where = q.query.$prepared; }
                                    if (q.query.$skip) { junction.query.$skip = q.query.$skip; }
                                    if (q.query.$take) { junction.query.$take = q.query.$take; }
                                    junction.list(function(err, result) {
                                        callback(err, self.result(result));
                                    });
                                }
                            });
                            return;
                        }
                    }
                }
                field = associatedModel.attributes.filter(function(x) { return x.type === self.model.name; })[0];
                if (_.isNil(field)) {
                    callback(new HttpNotFoundError());
                    return;
                }
                //get field mapping
                mapping = associatedModel.inferMapping(field.name);
                associatedModel.filter(self.context.params, function(err, q) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        q.where(mapping.childField).equal(parent).list(function(err, result) {
                            callback(err, self.result(result));
                        });
                    }
                });
            });
        })();
    }
}
