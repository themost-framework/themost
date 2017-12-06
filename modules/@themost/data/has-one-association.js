/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var LangUtils = require('@themost/common/utils').LangUtils;
var _ = require('lodash');
var QueryUtils = require('@themost/query/utils').QueryUtils;
var DataAssociationMapping = require('./types').DataAssociationMapping;
var DataQueryable = require('./data-queryable').DataQueryable;
/**
 * @classdesc Represents a foreign key association between two models.
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
 where model Order has a foreign key association with model Party (Person or Organization).
 HasOneAssociation class inherits DataQueryable class for selecting the associated item.
 </p>
 <pre class="prettyprint"><code>
 var orders = context.model('Order');
 orders.where('id').equal(145).first().then(function(result) {
        var order = orders.convert(result);
        order.property('customer')
            .first().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 * @class
 * @constructor
 * @augments DataQueryable
 * @param {DataObject} obj - An instance of DataObject class that represents the parent data object
 * @param {string|*} association A string that represents the name of the field which holds association mapping or the association mapping itself.
 * @property {DataObject} parent Gets or sets the parent data object
 */
function HasOneAssociation(obj, association)
{
    /**
     * @type {DataObject}
     * @private
     */
    var parent = obj;
    /**
     * Gets or sets the parent data object
     * @type DataObject
     */
    Object.defineProperty(this, 'parent', { get: function () {
        return parent;
    }, set: function (value) {
        parent = value;
    }, configurable: false, enumerable: false});
    var self = this;
    /**
     * @type {DataAssociationMapping}
     */
    this.mapping = undefined;
    if (typeof association === 'string') {
        //infer mapping from field name
        //set relation mapping
        if (self.parent!==null) {
            var model = self.parent.getModel();
            if (model!==null)
                self.mapping = model.inferMapping(association);
        }
    }
    else if (typeof association === 'object' && association !==null) {
        //get the specified mapping
        if (association instanceof DataAssociationMapping)
            self.mapping = association;
        else
            self.mapping = _.assign(new DataAssociationMapping(), association);
    }

    var q = null;
    //override query property
    Object.defineProperty(this, 'query', {
        get:function() {
            //if query is already defined
            if (q!==null)
            //return this query
                return q;
            if (typeof self.mapping === 'undefined' || self.mapping===null)
                throw new Error('Data association mapping cannot be empty at this context.');
            //prepare query by selecting the foreign key of the related object
            var associatedObject = self.parent[self.mapping.childField], associatedValue;
            if (associatedObject.hasOwnProperty(self.mapping.parentField)) {
                associatedValue = associatedObject[self.mapping.parentField];
            }
            else {
                associatedValue = associatedObject;
            }
            q = QueryUtils.query(self.model.viewAdapter).where(self.mapping.parentField).equal(associatedValue).prepare();
            return q;
        }, configurable:false, enumerable:false
    });

    var m = null;
    //override model property
    Object.defineProperty(this, 'model', {
        get:function() {
            //if query is already defined
            if (m!==null)
            //return this query
                return m;
            m = self.parent.context.model(self.mapping.parentModel);
            return m;
        }, configurable:false, enumerable:false
    });


}
LangUtils.inherits(HasOneAssociation, DataQueryable);

if (typeof exports !== 'undefined')
{
    module.exports.HasOneAssociation = HasOneAssociation;
}
