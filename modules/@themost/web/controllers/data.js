/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var sprintf = require('sprintf').sprintf;
var HttpController = require('../http-mvc').HttpController;
var _ = require('lodash');
var pluralize = require('pluralize');
var TraceUtils = require('@themost/common/utils').TraceUtils;
var LangUtils = require('@themost/common/utils').LangUtils;
var HttpError = require('@themost/common/errors').HttpError;
var HttpServerError = require('@themost/common/errors').HttpServerError;
var HttpMethodNotAllowedError = require('@themost/common/errors').HttpMethodNotAllowedError;
var HttpBadRequestError = require('@themost/common/errors').HttpBadRequestError;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;

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
 */
function HttpDataController()
{
    var model_;
    var self = this;
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
LangUtils.inherits(HttpDataController, HttpController);

/**
 * Handles data object creation (e.g. /user/1/new.html, /user/1/new.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.new = function (callback) {
    try {
        var self = this,
            context = self.context;
        context.handle(['GET'],function() {
            callback(null, self.result());
        }).handle(['POST', 'PUT'],function() {
            var target = self.model.convert(context.params[self.model.name] || context.params.data, true);
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
};
/**
 * Handles data object edit (e.g. /user/1/edit.html, /user/1/edit.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.edit = function (callback) {
    try {
        var self = this,
            context = self.context;
        context.handle(['POST', 'PUT'], function() {
            //get context param
            var target = self.model.convert(context.params[self.model.name] || context.params.data, true);
            if (target) {
                self.model.save(target, function(err)
                {
                    if (err) {
                        TraceUtils.log(err);
                        TraceUtils.log(err.stack);
                        callback(HttpError.create(err));
                    }
                    else {
                        if (context.params.attr('returnUrl'))
                            callback(null, context.params.attr('returnUrl'));
                        callback(null, self.result(target));
                    }
                });
            }
            else {
                callback(new HttpBadRequestError());
            }
        }).handle('DELETE', function() {
            //get context param
            var target = context.params[self.model.name] || context.params.data;
            if (target) {
                self.model.remove(target, function(err)
                {
                    if (err) {
                        callback(HttpError.create(err));
                    }
                    else {
                        if (context.params.attr('returnUrl'))
                            callback(null, context.params.attr('returnUrl'));
                        callback(null, self.result(null));
                    }
                });
            }
            else {
                callback(new HttpBadRequestError());
            }
        }).handle('GET', function() {
            if (context.request.route) {
                if (context.request.route.static) {
                    callback(null, self.result());
                    return;
                }
            }
            //get context param (id)
            var filter = null, id = context.params.attr('id');
            if (id) {
                //create the equivalent open data filter
                return self.model.where(self.model.primaryKey).equal(id).getItem().then(function(result) {
                    if (_.isNil(result)) {
                        return callback(null, self.result());
                    }
                    return callback(null, self.result([result]));
                }).catch(function(err) {
                    return callback(err);
                });
            }
            else {
                //get the requested open data filter
                filter = context.params.attr('$filter');
            }
            if (filter) {
                self.model.filter(filter, function(err, q) {
                    if (err) {
                        callback(HttpError.create(err));
                        return;
                    }
                    q.take(1, function (err, result) {
                        try {
                            if (err) {
                                callback(err);
                            }
                            else {
                                if (result.length>0)
                                    callback(null, self.result(result));
                                else
                                    callback(null, self.result(null));
                            }
                        }
                        catch (e) {
                            callback(HttpError.create(e));
                        }
                    });
                });
            }
            else {
                callback(new HttpBadRequestError());
            }

        }).unhandle(function() {
            callback(new HttpMethodNotAllowedError());
        });

    }
    catch (e) {
        callback(HttpError.create(e));
    }

};

HttpDataController.prototype.schema = function (callback) {
    var self = this, context = self.context;
    context.handle('GET', function() {
        if (self.model) {
            //prepare client model
            var clone = JSON.parse(JSON.stringify(self.model));
            var m = _.assign({}, clone);
            //delete private properties
            var keys = Object.keys(m);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
               if (key.indexOf("_") === 0)
                   delete m[key];
            }
            //delete other server properties
            delete m.view;
            delete m.source;
            delete m.fields;
            delete m.privileges;
            delete m.constraints;
            delete m.eventListeners;
            //set fields equal attributes
            m.attributes = JSON.parse(JSON.stringify(self.model.attributes));
            m.attributes.forEach(function(x) {
                var mapping = self.model.inferMapping(x.name);
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
                                var name = field.name;
                                var mField = m.attributes.filter(function(y) {
                                    return (y.name==name);
                                })[0];
                                if (mField) {
                                    for (var key in mField) {
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
            callback(null, self.result(m));
        }
        else {
            callback(new HttpNotFoundError());
        }

    }).unhandle(function() {
        callback(new HttpMethodNotAllowedError());
    });
};

/**
 * Handles data object display (e.g. /user/1/show.html, /user/1/show.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.show = function (callback) {
    try {
        var self = this, context = self.context;
        context.handle('GET', function() {
            if (context.request.route) {
                if (context.request.route.static) {
                    callback(null, self.result());
                    return;
                }
            }
            var filter = null, id = context.params.attr('id');
            if (id) {
                //create the equivalent open data filter
                filter = sprintf('%s eq %s',self.model.primaryKey,id);
            }
            else {
                //get the requested open data filter
                filter = context.params.attr('$filter');
            }
            self.model.filter(filter, function(err, q) {
                if (err) {
                    callback(HttpError.create(err));
                    return;
                }
                q.take(1, function (err, result) {
                    try {
                        if (err) {
                            callback(HttpError.create(err));
                        }
                        else {
                            if (result.length>0)
                                callback(null, self.result(result));
                            else
                                callback(new HttpNotFoundError('Item Not Found'));
                        }
                    }
                    catch (e) {
                        callback(HttpError.create(e));
                    }
                });
            });
        }).unhandle(function() {
            callback(new HttpMethodNotAllowedError());
        });
    }
    catch (e) {
        callback(e);
    }
};
/**
 * Handles data object deletion (e.g. /user/1/remove.html, /user/1/remove.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.remove = function (callback) {
    try {
        var self = this, context = self.context;
        context.handle(['POST','DELETE'], function() {
            var target = context.params[self.model.name] || context.params.data;
            if (target) {
                self.model.remove(target, function(err)
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
            }
            else {
                callback(new HttpBadRequestError());
            }
        }).unhandle(function() {
            callback(new HttpMethodNotAllowedError());
        });
    }
    catch (e) {
        callback(HttpError.create(e))
    }
};

/**
 * @param {Function} callback
 * @private
 */
HttpDataController.prototype.filter = function (callback) {

    var self = this, params = self.context.params;
    if (typeof self.model !== 'object' || self.model === null) {
        callback(new Error('Model is of the wrong type or undefined.'));
        return;
    }

    var filter = params.$filter,
        select = params.$select,
        search = params.$search,
        skip = params.$skip || 0,
        levels = parseInt(params.$levels),
        orderBy = params.$order || params.$orderby,
        groupBy = params.$group || params.$groupby,
        expand = params.$expand;

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
                        var resolver = require("@themost/data/data-expand-resolver");
                        var matches = resolver.testExpandExpression(expand);
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
};
/**
 *
 * @param {Function} callback
 */
HttpDataController.prototype.index = function(callback)
{

    try {
        var self = this, context = self.context,
            top = parseInt(context.params.attr('$top')),
            take = top > 0 ? top : (top === -1 ? top : 25);
        var count = /^true$/ig.test(context.params.attr('$inlinecount')) || false,
            first = /^true$/ig.test(context.params.attr('$first')) || false,
            asArray = /^true$/ig.test(context.params.attr('$array')) || false;
        TraceUtils.debug(context.request.url);
        context.handle('GET', function() {
            if (context.request.route) {
                if (context.request.route.static) {
                    callback(null, self.result([]));
                    return;
                }
            }
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
                            return callback(null, self.result(result));
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
                                return callback(null, self.result(result));
                            }
                        }).catch(function(err) {
                            return callback(HttpError.create(err));
                        });
                    }
                    else {
                        if (count) {
                            return q.take(take).list().then(function(result) {
                                return callback(null, self.result(result));
                            }).catch(function(err) {
                                return callback(HttpError.create(err));
                            });
                        }
                        else {
                            return q.take(take).getItems().then(function(result) {
                                return callback(null, self.result(result));
                            }).catch(function(err) {
                                return callback(HttpError.create(err));
                            });
                        }
                    }
                }
                catch (e) {
                    return callback(e);
                }
            });
        }).handle(['POST', 'PUT'], function() {
            var target;
            try {
                target = self.model.convert(context.params[self.model.name] || context.params.data, true);
            }
            catch(err) {
                TraceUtils.log(err);
                var er = new HttpError(422, "An error occured while converting data objects.", err.message);
                er.code = 'EDATA';
                return callback(er);
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
        }).handle('DELETE', function() {
            //get data
            var target;
            try {
                target = self.model.convert(context.params[self.model.name] || context.params.data, true);
            }
            catch(err) {
                TraceUtils.log(err);
                var er = new HttpError(422, "An error occured while converting data objects.", err.message);
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
        }).unhandle(function() {
            return callback(new HttpMethodNotAllowedError());
        });
    }
    catch (e) {
        callback(HttpError.create(e));
    }
};
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
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 */
HttpDataController.prototype.association = function(callback) {
    try {
        var self = this,
            parent = self.context.params.parent,
            model = self.context.params.model;
        if (_.isNil(parent) || _.isNil(model)) {
            return callback(new HttpBadRequestError());
        }
        return self.model.where(self.model.primaryKey).equal(parent).select(self.model.primaryKey).getTypedItem()
            .then(function(obj) {
                if (_.isNil(obj)) {
                    return callback(new HttpNotFoundError());
                }
                //get primary key
                var key = obj[self.model.primaryKey];
                //get mapping
                var mapping = self.model.inferMapping(model);
                //get count parameter
                var count = LangUtils.parseBoolean(self.context.params.$inlinecount);
                if (_.isNil(mapping)) {
                    //try to find associated model
                    //get singular model name
                    var otherModelName = pluralize.singular(model);
                    //search for model with this name
                    var otherModel = self.context.model(otherModelName);
                    if (otherModel) {
                        var otherFields = _.filter(otherModel.attributes, function(x) {
                            return x.type === self.model.name;
                        });
                        if (otherFields.length>1) {
                            return callback(new HttpMethodNotAllowedError("Multiple associations found"));
                        }
                        else if (otherFields.length === 1) {
                            var otherField = otherFields[0];
                            mapping = otherModel.inferMapping(otherField.name);
                            if (mapping && mapping.associationType === 'junction') {
                                var attr;
                                //search model for attribute that has an association of type junction with child model
                                if (mapping.parentModel === otherModel.name) {
                                    attr = _.find(otherModel.attributes, function(x) {
                                        return x.name === otherField.name;
                                    });
                                }
                                else {
                                    attr = _.find(self.model.attributes, function(x) {
                                        return x.type === otherModel.name;
                                    });
                                }
                                if (_.isNil(attr)) {
                                    return callback(new HttpNotFoundError("Association not found"));
                                }
                                if (attr) {
                                    model = attr.name;
                                    mapping = self.model.inferMapping(attr.name);
                                }
                            }
                        }
                    }
                    if (_.isNil(mapping)) {
                        return callback(new HttpNotFoundError("Association not found"));
                    }
                }
                if (mapping.associationType === 'junction') {
                    /**
                     * @type {DataQueryable}
                     */
                    var junction = obj.property(model);
                    return junction.model.filter(self.context.params, function (err, q) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            //merge properties
                            if (q.query.$select) {
                                junction.query.$select = q.query.$select;
                            }
                            if (q.$expand) {
                                junction.$expand = q.$expand;
                            }
                            if (q.query.$group) {
                                junction.query.$group = q.query.$group;
                            }
                            if (q.query.$order) {
                                junction.query.$order = q.query.$order;
                            }
                            if (q.query.$prepared) {
                                junction.query.$where = q.query.$prepared;
                            }
                            if (q.query.$skip) {
                                junction.query.$skip = q.query.$skip;
                            }
                            if (q.query.$take) {
                                junction.query.$take = q.query.$take;
                            }
                            if (count) {
                                junction.list(function (err, result) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null, self.result(result));
                                });
                            }
                            else {
                                junction.getItems().then(function (result) {
                                    return callback(null, self.result(result));
                                }).catch(function (err) {
                                    return callback(err);
                                });
                            }

                        }
                    });
                }
                else if (mapping.parentModel === self.model.name && mapping.associationType === 'association') {
                    //get associated model
                    var associatedModel = self.context.model(mapping.childModel);
                    if (_.isNil(associatedModel)) {
                        return callback(new HttpNotFoundError("Associated model not found"));
                    }
                    return associatedModel.filter(self.context.params,
                        /**
                         * @param {Error} err
                         * @param {DataQueryable} q
                         * @returns {*}
                         */
                        function (err, q) {
                            if (err) {
                                return callback(err);
                            }
                            if (count) {
                                q.where(mapping.childField).equal(key).list(function (err, result) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null, self.result(result));
                                });
                            }
                            else {
                                q.where(mapping.childField).equal(key).getItems().then(function (result) {
                                    return callback(null, self.result(result));
                                }).catch(function (err) {
                                    return callback(err);
                                });
                            }
                        });
                }
                else {
                    return callback(new HttpNotFoundError());
                }
            
        }).catch(function (err) {
                return callback(err);
            });
    }
    catch(err) {
        TraceUtils.log(err);
        callback(err, new HttpServerError());
    }
};

if (typeof module !== 'undefined') {
    module.exports = HttpDataController;
}