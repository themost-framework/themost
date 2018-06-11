/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var LangUtils = require('@themost/common/utils').LangUtils;
var _ = require('lodash');
var QueryUtils = require('@themost/query/utils').QueryUtils;
var types = require('./types');
var DataQueryable = require('./data-queryable').DataQueryable;


/**
 * @classdesc Represents a one-to-many association between two models.
 <p>
     This association may be defined in a field of a data model as follows:
 </p>
 <pre class="prettyprint"><code>
 {
    "name": "Order", "id": 449, "title": "Order", "hidden": false, "sealed": false,
    "abstract": false, "version": "1.0",
    "fields": [
        ...
        {
            "name": "customer",
            "title": "Customer",
            "description": "Party placing the order.",
            "type": "Party"
        }
        ...
    ]
 }
 </code></pre>
 <p>
 where model Party has a one-to-many association with model Order.
 This association may also be defined in parent data model (Party) as follows:
 </p>
 <pre class="prettyprint"><code>
 {
    "name": "Party", ...,
    "fields": [
        ...
        {
            "name": "orders",
            "title": "Orders",
            "description": "A collection of orders made by the party (Persor or Organization).",
            "type": "Order",
            "many":true
        }
        ...
    ]
 }
 </code></pre>
 <p>
 where property orders of Party model defines an one-to-many association between Party and Order.
 HasManyAssociation class inherits DataQueryable class for filtering, paging, grouping or orderind child items.
 </p>
 <pre class="prettyprint"><code>
 var parties = context.model('Party');
 parties.where('id').equal(327).first().then(function(result) {
        var party = parties.convert(result);
        party.property('orders')
            .select('id','orderedItem/name as productName','paymentDue')
            .where('paymentMethod/alternateName').equal('DirectDebit')
            .list().then(function(result) {
               done();
            }).catch(function(err) {
               done(err);
            });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 <pre class="prettyprint"><code>
 //Results:
 id  productName           paymentDue
 --  --------------------  -----------------------------
 6   Alienware X51 (2013)  2015-10-06 18:08:10.000+03:00
 7   LaCie Blade Runner    2015-06-16 22:38:52.000+03:00
 </code></pre>
 * @class
 * @constructor
 * @augments DataQueryable
 * @param {DataObject} obj - A DataObject instance that represents the parent data object
 * @param {string|*} association - A string that represents the name of the field which holds association mapping or the association mapping itself.
 * @property {DataObject} parent - Gets or sets the parent data object
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */
function HasManyAssociation(obj, association)
{
    /**
     * @type {DataObject}
     * @private
     */
    var parent_ = obj;
    /**
     * Gets or sets the parent data object
     * @type DataObject
     */
    Object.defineProperty(this, 'parent', { get: function () {
        return parent_;
    }, set: function (value) {
        parent_ = value;
    }, configurable: false, enumerable: false});
    var self = this;

    if (typeof association === 'string') {
        //infer mapping from field name
        //set relation mapping
        if (self.parent!=null) {
            var model = self.parent.getModel();
            if (model!=null)
                self.mapping = model.inferMapping(association);
        }
    }
    else if (typeof association === 'object' && association !=null) {
        //get the specified mapping
        if (association instanceof types.DataAssociationMapping)
            self.mapping = association;
        else
            self.mapping = _.assign(new types.DataAssociationMapping(), association);
    }

    var q = null;
    //override query property
    Object.defineProperty(this, 'query', {
        get:function() {
            //if query is already defined
            if (q!=null)
            //return this query
                return q;
            if (typeof self.mapping === 'undefined' || self.mapping==null)
                throw new Error('Data association mapping cannot be empty at this context.');
            //prepare query by selecting the foreign key of the related object
            q = QueryUtils.query(self.model.viewAdapter).where(self.mapping.childField).equal(self.parent[self.mapping.parentField]).prepare();
            return q;
        }, configurable:false, enumerable:false
    });

    var m = null;
    //override model property
    Object.defineProperty(this, 'model', {
        get:function() {
            //if query is already defined
            if (m!=null)
            //return this query
                return m;
            m = self.parent.context.model(self.mapping.childModel);
            return m;
        }, configurable:false, enumerable:false
    });
}
LangUtils.inherits(HasManyAssociation, DataQueryable);

if (typeof exports !== 'undefined')
{
    module.exports = {
        HasManyAssociation:HasManyAssociation
    };
}

