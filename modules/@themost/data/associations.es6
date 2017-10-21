/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import async from 'async';
import {ParserUtils, DataAssociationMapping} from './types';
import _ from 'lodash';
import {DataQueryable} from './queryable';
import {Args} from "@themost/common/utils";
import {QueryExpression, QueryFieldUtils} from "@themost/query/query";
import {AbstractMethodError,AbstractClassError, DataError, DataNotFoundError} from '@themost/common/errors';

const parentProperty = Symbol('parent');
const modelProperty = Symbol('model');
const baseModelProperty = Symbol('basemodel');
const mappingProperty = Symbol('model');
const queryProperty = Symbol('query');
/**
 * @class
 * @abstract
 * @augments DataQueryable
 */
export class HasAssociation extends DataQueryable {
    constructor(obj, associationMapping) {
        super();
        Args.check(new.target !== HasAssociation, new AbstractClassError());
        //validate parent object
        Args.notNull(obj,'Parent object');
        //set parent
        this[parentProperty] = obj;

        if (_.isString(associationMapping)) {
            //query mapping based on the given name
            if (_.isObject(this.getParent())) {
                const model = this.getParent().getModel();
                if (_.isObject(model))
                    this[mappingProperty] = model.inferMapping(associationMapping);
            }
        }
        else if (_.isObject(associationMapping)) {
            //get the specified mapping
            if (associationMapping instanceof DataAssociationMapping)
                this[mappingProperty] = associationMapping;
            else
                this[mappingProperty] = _.assign(new DataAssociationMapping(), associationMapping);
        }
    }

    /**
     * Gets the source object of this association.
     * @returns {DataObject|*}
     */
    getParent() {
        return this[parentProperty];
    }

    /**
     * Gets the definition of this association.
     * @returns {DataAssociationMapping}
     */
    getMapping() {
        return this[mappingProperty];
    }

    /**
     * @abstract
     */
    get query() {
        throw new AbstractMethodError();
    }

    /**
     * @abstract
     */
    get model() {
        throw new AbstractMethodError();
    }

}

/**
 * @class
 */
export class DataObjectAssociationListener {
    /**
     *
     * @param {DataEventArgs} e
     * @param {Function} callback
     */
    beforeSave(e, callback) {
        try {
            if (_.isNil(e.target)) {
                return callback();
            }
            else {
                const keys = Object.keys(e.target);
                const mappings = [];
                keys.forEach(function(x) {
                    if (e.target.hasOwnProperty(x) && typeof e.target[x] === 'object' && e.target[x] !== null) {
                        //try to find field mapping, if any
                        const mapping = e.model.inferMapping(x);
                        if (mapping && mapping.associationType==='association' && mapping.childModel===e.model.name)
                            mappings.push(mapping);
                    }
                });
                async.eachSeries(mappings,
                    /**
                     * @param {DataAssociationMapping} mapping
                     * @param {Function} cb
                     */
                    function(mapping, cb) {
                        if (mapping.associationType==='association' && mapping.childModel===e.model.name) {
                            /**
                           * @type {DataField|*}
                           */
                            const field = e.model.field(mapping.childField);
                            const childField = field.property || field.name;
                            //foreign key association
                            if (typeof e.target[childField] !== 'object') {
                                return cb();
                            }
                            if (e.target[childField].hasOwnProperty(mapping.parentField)) {
                                return cb();
                            }
                            //change:21-Mar 2016
                            //description: check if association belongs to this model or it's inherited from any base model
                            //if current association belongs to base model
                            if ((e.model.name !== field.model) && (!ParserUtils.parseBoolean(field.cloned))) {
                                //do nothing and exit
                                return cb();
                            }

                            //get associated mode
                            const associatedModel = e.model.context.model(mapping.parentModel);

                            let er;
                            associatedModel.find(e.target[childField]).select(mapping.parentField).silent().flatten().take(1).list(function(err, result) {
                                if (err) {
                                    cb(err);
                                }
                                else if (_.isNil(result)) {
                                    er = new Error('An associated object cannot be found.');er.code = 'EDATA';er.model = associatedModel.name;
                                    cb(er);
                                }
                                else if (result.total===0) {
                                    er = new Error('An associated object cannot be found.');er.code = 'EDATA';er.model = associatedModel.name;
                                    cb(er);
                                }
                                else if (result.total>1) {
                                    er = new Error('An associated object is defined more than once and cannot be bound.'); er.code = 'EDATA';er.model = associatedModel.name;
                                    cb(er);
                                }
                                else {
                                    e.target[childField][mapping.parentField]=result.records[0][mapping.parentField];
                                    cb();
                                }
                            });
                        }
                        else {
                            cb();
                        }

                    }, function(err) {
                        callback(err);
                    });
            }
        }
        catch (e) {
            callback(e);
        }

    }

    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    afterSave(event, callback) {
        try {
            if (typeof event.target === 'undefined' || event.target === null) {
                callback(null);
            }
            else {
                const keys = Object.keys(event.target);
                const mappings = [];
                keys.forEach(function(x) {
                    if (event.target.hasOwnProperty(x)) {
                        /**
                         * @type DataAssociationMapping
                         */
                        const mapping = event.model.inferMapping(x);
                        if (mapping)
                            if (mapping.associationType==='junction') {
                                mappings.push({ name:x, mapping:mapping });
                            }
                    }
                });
                async.eachSeries(mappings,
                    /**
                     * @param {{name:string,mapping:DataAssociationMapping}} x
                     * @param {Function} cb
                     */
                    function(x, cb) {
                        if (x.mapping.associationType==='junction') {
                            const obj = event.model.convert(event.target);

                            /**
                             * @type {*}
                             */
                            const childs = obj[x.name];

                            let junction;
                            if (!_.isArray(childs)) { return cb(); }
                            if (x.mapping.childModel===event.model.name) {
                                junction = new HasManyToManyAssociation(obj, x.mapping);
                                if (event.model.$silent) {
                                    junction.getBaseModel().silent();
                                }
                                if (event.state===1 || event.state===2) {
                                    const toBeRemoved = [], toBeInserted = [];
                                    _.forEach(childs, function(x) {
                                        if (x.$state === 4) {
                                            toBeRemoved.push(x);
                                        }
                                        else {
                                            toBeInserted.push(x);
                                        }
                                    });
                                    junction.insert(toBeInserted, function(err) {
                                        if (err) { return cb(err); }
                                        junction.remove(toBeRemoved, function(err) {
                                            if (err) { return cb(err); }
                                            return cb();
                                        });
                                    });
                                }
                                else  {
                                    return cb();
                                }
                            }
                            else if (x.mapping.parentModel===event.model.name) {

                                if (event.state===1 || event.state===2) {
                                    if (typeof x.mapping.childModel === 'undefined') {
                                        /**
                                         * @type {HasTagAssociation}
                                         */
                                        const tags = new HasTagAssociation(obj, x.mapping);
                                        if (event.model.$silent) { tags.getBaseModel().silent(); }
                                        return tags.silent().all().then(function(result) {

                                            const toBeRemoved = _.filter(result,function(x) {
                                                return childs.indexOf(x)<0;
                                            });
                                            const toBeInserted = _.filter(childs, function(x) {
                                                return result.indexOf(x)<0;
                                            });
                                            if (toBeRemoved.length>0) {
                                                return tags.remove(toBeRemoved).then(function() {
                                                    if (toBeInserted.length===0) { return cb(); }
                                                    return tags.insert(toBeInserted).then(function() {
                                                        return cb();
                                                    });
                                                }).catch(function (err) {
                                                    return cb(err);
                                                });
                                            }
                                            if (toBeInserted.length===0) { return cb(); }
                                            return tags.insert(toBeInserted).then(function() {
                                                return cb();
                                            });
                                        }).catch(function (err) {
                                            return cb(err);
                                        });
                                    }
                                    else {
                                        junction = new HasManyToManyAssociation(obj, x.mapping);
                                        if (event.model.$silent) { junction.getBaseModel().silent(); }
                                        junction.insert(childs, function(err) {
                                            if (err) { return cb(err); }
                                            const toBeRemoved = [], toBeInserted = [];
                                            _.forEach(childs, function(x) {
                                                if (x.$state === 4) {
                                                    toBeRemoved.push(x);
                                                }
                                                else {
                                                    toBeInserted.push(x);
                                                }
                                            });
                                            junction.insert(toBeInserted, function(err) {
                                                if (err) { return cb(err); }
                                                junction.remove(toBeRemoved, function(err) {
                                                    if (err) { return cb(err); }
                                                    return cb();
                                                });
                                            });
                                        });
                                    }
                                }
                                else  {
                                    cb();
                                }
                            }
                            else {
                                cb();
                            }
                        }
                        else
                            cb(null);

                    }, function(err) {
                        callback(err);
                    });
            }
        }
        catch (err) {
            callback(err);
        }
    }
}

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
 HasOneToManyAssociation class inherits DataQueryable class for filtering, paging, grouping or orderind child items.
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
 * @augments DataQueryable
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */
export class HasOneToManyAssociation extends HasAssociation {
    /**
     * @constructor
     * @param {DataObject} obj - An instance of DataObject class which represents the parent data object
     * @param {string|*} associationMapping - A string that represents the name of the field which holds association mapping or the association mapping itself.
     */
    constructor(obj, associationMapping) {
        super(obj, associationMapping);
    }

    /**
     * @returns {DataModel}
     */
    get model() {
        if (_.isNil(this[modelProperty])) {
            const mapping = this.getMapping();
            Args.check(_.isObject(mapping),new DataError('Data association mapping cannot be empty at this context.'));
            this[modelProperty] = this.getParent().getContext().model(mapping.childModel);
        }
        return this[modelProperty];
    }

    /**
     * @returns {QueryExpression}
     */
    get query() {
        if (_.isNil(this[queryProperty])) {
            const mapping = this.getMapping();
            Args.check(_.isObject(mapping),new DataError('Data association cannot be empty at this context.'));
            //prepare query by selecting the foreign key of the related object
            const parent = this.getParent();
            Args.check(_.isObject(parent),new DataError('Parent object cannot be empty at this context.'));
            this[queryProperty] = QueryExpression.create(this.model.getViewAdapter())
                .where(mapping.childField)
                .equal(parent[mapping.parentField]).prepare();
        }
        return this[queryProperty];
    }

}


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
 HasManyToOneAssociation class inherits DataQueryable class for selecting the associated item.
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
 * @augments DataQueryable
 */
export class HasManyToOneAssociation extends HasAssociation {
    /**
     * @constructor
     * @param {DataObject} obj - An instance of DataObject class that represents the parent data object
     * @param {string|*} associationMapping A string that represents the name of the field which holds association mapping or the association mapping itself.
     */
    constructor(obj, associationMapping) {
        super(obj, associationMapping);
    }

    /**
     * @returns {QueryExpression}
     */
    get query() {
        if (_.isNil(this[queryProperty])) {
            const mapping = this.getMapping();
            Args.check(_.isObject(mapping), new DataError('Data association cannot be empty at this context.'));
            //prepare query by selecting the foreign key of the related object
            const parent = this.getParent();
            Args.check(_.isObject(parent),new DataError('Parent object cannot be empty at this context.'));
            this[queryProperty] = QueryExpression.create(this.model.getViewAdapter())
                .where(mapping.parentField)
                .equal(parent[mapping.childField]).prepare();
        }
        return this[queryProperty];
    }

    /**
     * @returns {DataModel}
     */
    get model() {
        if (_.isNil(this[modelProperty])) {
            const mapping = this.getMapping();
            Args.check(_.isObject(mapping),new DataError('Data association mapping cannot be empty at this context.'));
            this[modelProperty] = this.getParent().getContext().model(mapping.parentModel);
        }
        return this[modelProperty];
    }
}




/**
 * @classdesc Represents a many-to-many association between two data models.
 * <p>
 *     This association may be defined in a field of a child model as follows:
 * </p>
 * <pre class="prettyprint"><code>
 {
     "name": "User", "id": 90, "title": "Users", "inherits": "Account", "hidden": false, "sealed": false, "abstract": false, "version": "1.4",
     "fields": [
        ...
        {
			"name": "groups", "title": "User Groups", "description": "A collection of groups where user belongs.",
			"type": "Group",
			"expandable": true,
			"mapping": {
				"associationAdapter": "GroupMembers", "parentModel": "Group",
				"parentField": "id", "childModel": "User", "childField": "id",
				"associationType": "junction", "cascade": "delete",
				"select": [
					"id",
					"name",
					"alternateName"
				]
			}
		}
        ...
     ]
     }
 </code></pre>
 <p>
 where model [User] has a many-to-many association with model [Group] in order to define the groups where a user belongs.
 This association will produce a database table with name of the specified association adapter name. If this name is missing
 then it will produce a table with a default name which comes of the concatenation of the model and the associated model.
 </p>
 <p>
 An instance of HasParentJunction class overrides DataQueryable methods for filtering associated objects:
 </p>
 <pre class="prettyprint"><code>
 //check if the selected user belongs to Administrators group by querying user groups
 var users = context.model('User');
 users.where('name').equal('alexis.rees@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        user.property('groups').where('name').equal('Users').count().then(function(result) {
            done(null, result);
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 <p>
 Connects two objects (by inserting an association between parent and child object):
 </p>
 <pre class="prettyprint"><code>
 //add the selected user to Administrators
 var users = context.model('User');
 users.where('name').equal('alexis.rees@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        user.property('groups').insert({ name:"Administrators" }).then(function(result) {
            done(null, result);
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 <p>
 Disconnects two objects (by removing an existing association):
 </p>
 <pre class="prettyprint"><code>
 //remove the selected user from Administrators group
 var users = context.model('User');
 users.where('name').equal('alexis.rees@example.com')
 .first().then(function(result) {
        var user = users.convert(result);
        user.property('groups').remove({ name:"Administrators" }).then(function(result) {
            done(null, result);
        });
    }).catch(function(err) {
        done(err);
    });
 </code></pre>
 * @class
 * @constructor
 * @augments DataQueryable
 * @param {DataObject} obj The parent data object reference
 * @param {string|*} association - A string that represents the name of the field which holds association mapping or the association mapping itself.
 * @property {DataModel} baseModel - The model associated with this data object junction
 * @property {DataObject} parent - Gets or sets the parent data object associated with this instance of DataObjectJunction class.
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */
export class HasManyToManyAssociation extends HasAssociation {
    constructor(obj, association) {
        super(obj, association);
    }

    /**
     * @returns {DataModel}
     */
    get model() {
        if (_.isNil(this[modelProperty])) {
            const mapping = this.getMapping(),
                parentObjectModel = this.getParent().getModel();
            if (mapping.parentModel === parentObjectModel.name) {
                this[modelProperty] = this.getParent().getContext().model(mapping.childModel);
            }
            else if(mapping.childModel === parentObjectModel.name) {
                this[modelProperty] = this.getParent().getContext().model(mapping.parentModel);
            }
            else {
                //throw association error
                throw new DataError('Data association model cannot be found or is mispelled');
            }
        }
        return this[modelProperty];
    }

    get query() {
        if (_.isNil(this[queryProperty])) {
            const mapping = this.getMapping(),
                parentObject = this.getParent(),
                parentObjectModel = parentObject.getModel();
            Args.check(_.isObject(mapping), new DataError('Data association mapping cannot be empty at this context'));
            //initialize query
            this[queryProperty] = QueryExpression.create(this.model.getViewAdapter());
            //get association adapter
            const baseModelAdapter = this.baseModel.getViewAdapter();
            //get model adapter
            const modelAdapter = this.model.getViewAdapter();
            const left = {}, right={};
            const parentField = QueryFieldUtils.select('parentId').from(baseModelAdapter).getName(),
                childField = QueryFieldUtils.select('valueId').from(baseModelAdapter).getName();
            //find parent field
            if (mapping.parentModel === parentObjectModel.name) {
                left[modelAdapter] = [ mapping.childField ];
                right[baseModelAdapter] = [childField];
                this[queryProperty].join(baseModelAdapter, [])
                    .with([left, right])
                    .where(parentField).equal(parentObject[mapping.parentField]).prepare();
                return this[queryProperty];
            }
            else if (mapping.childModel === parentObjectModel.name) {
                left[modelAdapter] = [ mapping.parentField ];
                right[baseModelAdapter] = [parentField];
                this[queryProperty].join(baseModelAdapter, [])
                    .with([left, right])
                    .where(childField).equal(parentObject[mapping.childField]).prepare();
                return this[queryProperty];
            }
            //throw association error
            throw new DataError('Data association model cannot be found or is mispelled');
        }
        return this[queryProperty];
    }

    /**
     * Overrides DataQueryable.execute() method
     * @param callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     * @ignore
     */
    execute(callback) {
        const executeFunc = super.prototype.execute;
        const self = this;
        self.migrate(function(err) {
            if (err) { return callback(err); }
            executeFunc.bind(self)(callback);
        });
    }

    /**
     * Gets an instance of DataModel which represents the data model where this association stores data.
     * @returns {DataModel}
     */
    get baseModel() {
        if (_.isNil(this[baseModelProperty])) {
            const conf = this.getParent().getContext().getConfiguration();
            const mapping = this.getMapping();
            Args.check(_.isObject(mapping), new DataError('Data association mapping cannot be empty at this context'));
            //search in cache (configuration.current.cache)
            const baseModelDefinition = conf.getModelDefinition(mapping.associationAdapter);
            if (_.isObject(baseModelDefinition)) {
                this[baseModelProperty] = this.getParent().getContext().model(this.getMapping().associationAdapter);
                return this[baseModelProperty];
            }
            //otherwise create model
            const parentModel = this.getParent().getModel();
            const parentField = parentModel.field(mapping.parentField);
            const childModel = this.getParent().getContext().model(mapping.childModel);
            const childField = childModel.field(mapping.childField);
            const adapter = mapping.associationAdapter;
            //set model definition
            conf.setModelDefinition({
                name: adapter, title: adapter, sealed: false, hidden: true, type: "hidden",
                source: adapter, view: adapter, version: '1.0',
                fields: [
                    {name: "id", type: "Counter", primary: true},
                    {
                        name: 'parentId',
                        indexed: true,
                        nullable: false,
                        type: (parentField.type === 'Counter') ? 'Integer' : parentField.type
                    },
                    {
                        name: 'valueId',
                        indexed: true,
                        nullable: false,
                        type: (childField.type === 'Counter') ? 'Integer' : childField.type
                    }],
                constraints: [
                    {
                        type: "unique",
                        fields: ['parentId', 'valueId']
                    }
                ],
                "privileges": [
                    {"mask": 15, "type": "global"}
                ]
            });
            this[baseModelProperty] = this.getParent().getContext().model(mapping.associationAdapter);
        }
        return this[baseModelProperty];
    }

    getBaseModel() {
        return this.baseModel;
    }

    /**
     * Inserts an association between parent object and the given object or array of objects.
     * @param {*|Array} obj - An object or an array of objects to be related with parent object
     * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
     * @example
     //add the selected user to Administrators
     var users = context.model('User');
     users.where('name').equal('alexis.rees@example.com')
     .first().then(function(result) {
            var user = users.convert(result);
            user.property('groups').insert({ name:"Administrators" }).then(function(result) {
                done(null, result);
            });
        }).catch(function(err) {
            done(err);
        });
     */
    insert(obj, callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            insert_.bind(self)(obj, function(err) {
                if (err) { return deferred.reject(err); }
                deferred.resolve(null);
            });
            return deferred.promise;
        }
        else {
            return insert_.call(self, obj, callback);
        }
    }

    /**
     * Removes the association between parent object and the given object or array of objects.
     * @param {*|Array} obj - An object or an array of objects to be disconnected from parent object
     * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
     * @example
     //remove the selected user from Administrators group
     var users = context.model('User');
     users.where('name').equal('alexis.rees@example.com')
     .first().then(function(result) {
            var user = users.convert(result);
            user.property('groups').remove({ name:"Administrators" }).then(function(result) {
                done(null, result);
            });
        }).catch(function(err) {
            done(err);
        });
     */
    remove(obj, callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            remove_.bind(self)(obj, function(err) {
                if (err) { return deferred.reject(err); }
                deferred.resolve(null);
            });
            return deferred.promise;
        }
        else {
            return remove_.call(self, obj, callback);
        }
    }

    migrate(callback) {
        this.baseModel.migrate(callback);
    }
}


/**
 * @function
 * @memberOf HasManyToManyAssociation
 * Inserts a new association between a parent and a child object.
 * @param {DataObject|*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */
function insertSingleObject_(obj, callback) {
    /**
     * @type {HasManyToManyAssociation|*}
     */
    // eslint-disable-next-line no-invalid-this
    const self = this;
    const mapping = self.getMapping();
    const parent = self.getParent();

    if (self.model.name === mapping.parentModel) {
        //get parent id
        return parent.property(mapping.parentField).value().then(function(parentId) {
            
            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'))
            }
            //get child id
            return obj.property(mapping.childField).value().then(function(valueId) {
                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'))
                }
                const newItem = { };
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.insert(newItem, callback);
            });
        });
    }
    else if (self.model.name === mapping.childModel) {
        return obj.property(mapping.parentField).value().then(function(parentId) {
            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'))
            }
            return parent.property(mapping.childField).value().then(function(valueId) {
                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'))
                }
                const newItem = { };
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.insert(newItem, callback);
            });
        });
    }
    else {
        return callback(new DataError('Data association mapping cannot be resolved.'));
    }
}
/**
 * @memberOf HasManyToManyAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function insert_(obj, callback) {
    /**
     *
     * @type {HasAssociation|*}
     */
    // eslint-disable-next-line no-invalid-this
    const self = this;
    const mapping = self.getMapping();
    let arr = [];
    if (_.isArray(obj))
        arr = obj;
    else {
        arr.push(obj);
    }
    self.migrate(function(err) {
        if (err)
            callback(err);
        else {
            //get other model
            let otherModel;
            if (self.model.name === mapping.parentModel) {
                otherModel = self.getParent().getContext().model(mapping.childModel);
            }
            else if (self.model.name === mapping.childModel) {
                otherModel = self.getParent().getContext().model(mapping.parentModel);
            }
            async.eachSeries(arr, function(item, cb) {
                return insertSingleObject_.call(self,otherModel.convert(item), cb)
            }, callback);
        }
    });
}

/**
 * @memberOf HasManyToManyAssociation
 * Removes a relation between a parent and a child object.
 * @param {*} obj An object or an identifier that represents the child object
 * @param {Function} callback
 * @private
 */
function removeSingleObject_(obj, callback) {
    /**
     * @type {HasManyToManyAssociation|*}
     */
// eslint-disable-next-line no-invalid-this
    const self = this;
    const mapping = self.getMapping();
    const parent = self.getParent();

    if (self.model.name === mapping.parentModel) {
        //get parent id
        return parent.property(mapping.parentField).value().then(function(parentId) {
            
            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'))
            }
            //get child id
            return obj.property(mapping.childField).value().then(function(valueId) {
                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'))
                }
                const newItem = { };
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.remove(newItem, callback);
            });
        });
    }
    else if (self.model.name === mapping.childModel) {
        return obj.property(mapping.parentField).value().then(function(parentId) {
            if (_.isNil(parentId)) {
                return callback(new DataNotFoundError('Parent object cannot be found.'))
            }
            return parent.property(mapping.childField).value().then(function(valueId) {
                
                if (_.isNil(parentId)) {
                    return callback(new DataNotFoundError('Child object cannot be found.'))
                }
                const newItem = { };
                newItem['parentId'] = parentId;
                newItem['valueId'] = valueId;
                self.baseModel.remove(newItem, callback);
            });
        });
    }
    else {
        return callback(new DataError('Data association mapping cannot be resolved.'));
    }
}
/**
 * @memberOf HasManyToManyAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function remove_(obj, callback) {
    /**
     *
     * @type {HasAssociation|*}
     */
// eslint-disable-next-line no-invalid-this
    const self = this;
    const mapping = self.getMapping();
    let arr = [];
    if (_.isArray(obj))
        arr = obj;
    else {
        arr.push(obj);
    }
    self.migrate(function(err) {
        if (err)
            callback(err);
        else {
            //get other model
            let otherModel;
            if (self.model.name === mapping.parentModel) {
                otherModel = self.getParent().getContext().model(mapping.childModel);
            }
            else if (self.model.name === mapping.childModel) {
                otherModel = self.getParent().getContext().model(mapping.parentModel);
            }
            async.eachSeries(arr, function(item, cb) {
                return removeSingleObject_.call(self,otherModel.convert(item), cb)
            }, callback);
        }
    });
}

/**
 * @classdesc Represents a collection of values associated with a data object e.g. a collection of tags of an article, a set of skills of a person etc.
 * <p>
 *     This association may be defined in a field of a data model as follows:
 * </p>
 * <pre class="prettyprint"><code>
 {
     "name": "Person", "title": "Persons", "inherits":"Party", "version": "1.1",
     "fields": [
        ...
        {
            "@id": "https://themost.io/skills",
            "name": "skills",
            "title": "Skills",
            "description": "A collection of skills of this person.",
            "many": true,
            "type": "Text"
        }
        ...
     ]
     }
 </code></pre>
 <p>
 where model [Person] has a one-to-many association with a collection of strings in order to define the skills of a person.
 </p>
 <p>
 An instance of HasTagAssociation class overrides DataQueryable methods for filtering associated values:
 </p>
 <pre class="prettyprint"><code>
 var persons = context.model('Person');
 persons.where('email').equal('veronica.fletcher@example.com')
 .getTypedItem().then(function(person) {
            person.property('skills').all().then(function(result) {
                return done(null, result);
            });
        }).catch(function(err) {
            return done(err);
        });
 </code></pre>
 <p>
 Insert item(s):
 </p>
 <pre class="prettyprint"><code>
 var persons = context.model('Person');
 persons.where('email').equal('veronica.fletcher@example.com')
 .getTypedItem().then(function(person) {
                person.property('skills').insert([
                    "node.js",
                    "C#.NET",
                    "PHP"
                ]).then(function() {
                    return done();
                });
            }).catch(function(err) {
                return done(err);
            });
 </code></pre>
 <p>
 Remove item(s):
 </p>
 <pre class="prettyprint"><code>
 var persons = context.model('Person');
 persons.where('email').equal('veronica.fletcher@example.com')
 .getTypedItem().then(function(person) {
                person.property('skills').remove([
                    "C#.NET"
                ]).then(function() {
                    return done();
                });
            }).catch(function(err) {
                return done(err);
            });
 </code></pre>
 * @class
 * @augments DataQueryable
 * @property {DataModel} baseModel - The model associated with this data object junction
 * @property {DataObject} parent - Gets or sets the parent data object associated with this instance of HasTagAssociation class.
 * @property {DataAssociationMapping} mapping - Gets or sets the mapping definition of this data object association.
 */
export class HasTagAssociation extends HasAssociation {
    /**
     * @constructor
     * @param {DataObject} obj An object which represents the parent data object
     * @param {String|*} association A string that represents the name of the field which holds association mapping or the association mapping itself.
     */
    constructor(obj, association) {
        super(obj, association);
    }
    /**
     * @returns {DataModel}
     */
    get model() {
        return this.baseModel;
    }

    /**
     * @returns {DataModel}
     */
    get baseModel() {

        if (_.isNil(this[baseModelProperty])) {
            const conf = this.getParent().getContext().getConfiguration();
            const mapping = this.getMapping();
            Args.check(_.isObject(mapping), new DataError('Data association mapping cannot be empty at this context'));
            //search in cache (configuration.current.cache)
            const baseModelDefinition = conf.getModelDefinition(mapping.associationAdapter);
            if (_.isObject(baseModelDefinition)) {
                this[baseModelProperty] = this.getParent().getContext().model(mapping.associationAdapter);
                return this[baseModelProperty];
            }
            //otherwise create model
            const parentModel = this.getParent().getModel();
            const refersToType = parentModel.getAttribute(mapping.refersTo).type;
            let parentFieldType = parentModel.getAttribute(mapping.parentField).type;
            if (parentFieldType === 'Counter') { parentFieldType = 'Integer'; }
            const definition = {
                "name": mapping.associationAdapter,
                "hidden": true,
                "source": mapping.associationAdapter,
                "view": mapping.associationAdapter,
                "version": "1.0",
                "fields": [
                    {
                        "name": "id", "type": "Counter", "nullable": false, "primary": true
                    },
                    {
                        "name": "object", "type": parentFieldType, "nullable": false, "many": false
                    },
                    {
                        "name": "value", "type": refersToType, "nullable": false
                    }
                ],
                "constraints": [
                    { "type":"unique", "fields": [ "object", "value" ] }
                ],
                "privileges": [
                    {
                        "mask": 15, "type": "global"
                    }
                ]
            };
            conf.setModelDefinition(definition);

            this[baseModelProperty] = this.getParent().getContext().model(mapping.associationAdapter);
        }
        return this[baseModelProperty];
    }

    getBaseModel() {
        return this.baseModel;
    }

    get query() {
        if (_.isNil(this[queryProperty])) {
            const mapping = this.getMapping(),
                parentObject = this.getParent();
            Args.check(_.isObject(mapping), new DataError('Data association mapping cannot be empty at this context'));
            //get model adapter
            const modelAdapter = this.model.getViewAdapter();
            //initialize query
            this[queryProperty] = QueryExpression.create(this.model.getViewAdapter());
            //add select
            this.select("value").asArray();
            //modify query (add join)
            const left = {}, right = {};
            //get parent object adapter
            const parentAdapter = parentObject.getModel().getViewAdapter();
            left[ parentAdapter ] = [ mapping.parentField ];
            right[ modelAdapter ] = [ QueryFieldUtils.select("object").from(modelAdapter).getName() ];
            const objectField = QueryFieldUtils.select("object").from(modelAdapter).$name;
            this[queryProperty].join(parentAdapter, []).with([left, right]).where(objectField).equal(parentObject[mapping.parentField]).prepare(false);
        }
        return this[queryProperty];
    }

    /**
     * Migrates the underlying data association adapter.
     * @param callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     */
    migrate(callback) {
        this.baseModel.migrate(callback);
    }

    /**
     * Overrides DataQueryable.execute() method
     * @param callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
     * @ignore
     */
    execute(callback) {
        const executeFunc = super.prototype.execute;
        const self = this;
        self.migrate(function(err) {
            if (err) { return callback(err); }
            executeFunc.call(self, callback);
        });
    }

    /**
     * Inserts an array of values
     * @param {*} obj
     * @param {Function=} callback
     * @example
     context.model('Person').where('email').equal('veronica.fletcher@example.com')
     .getTypedItem().then(function(person) {
            person.property('skills').insert([
                "node.js",
                "C#.NET"
            ]).then(function() {
                return done();
            });
        }).catch(function(err) {
            return done(err);
        });
     *
     */
    insert(obj, callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            HasTagAssociation_Insert_.call(self, obj, function(err) {
                if (err) { return deferred.reject(err); }
                deferred.resolve(null);
            });
            return deferred.promise;
        }
        else {
            return HasTagAssociation_Insert_.call(self, obj, callback);
        }
    }

    /**
     * Removes all values
     * @param {Function=} callback
     * @deprecated - This method is deprecated. Use removeAll() method instead
     */
    clear(callback) {
        return this.removeAll(callback);
    }

    /**
     * Removes all values
     * @param {Function=} callback
     * @example
     context.model('Person').where('email').equal('veronica.fletcher@example.com')
     .getTypedItem().then(function(person) {
            person.property('skills').removeAll().then(function() {
                return done();
            });
        }).catch(function(err) {
            return done(err);
        });
     *
     */
    removeAll(callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            HasTagAssociation_Clear_.bind(self)(function(err) {
                if (err) { return deferred.reject(err); }
                deferred.resolve();
            });
            return deferred.promise;
        }
        else {
            return HasTagAssociation_Clear_.call(self, callback);
        }
    }

    /**
     * Removes a value or an array of values
     * @param {Array|*} obj
     * @param {Function=} callback
     * @example
     context.model('Person').where('email').equal('veronica.fletcher@example.com')
     .getTypedItem().then(function(person) {
            person.property('skills').remove([
                "node.js"
            ]).then(function() {
                return done();
            });
        }).catch(function(err) {
            return done(err);
        });
     *
     */
    remove(obj, callback) {
        const self = this;
        if (typeof callback !== 'function') {
            const Q = require('q'), deferred = Q.defer();
            HasTagAssociation_Remove_.call(self, obj, function(err) {
                if (err) { return deferred.reject(err); }
                deferred.resolve(null);
            });
            return deferred.promise;
        }
        else {
            return HasTagAssociation_Remove_.call(self, obj, callback);
        }
    }
}
/**
 * @memberOf HasTagAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function HasTagAssociation_Insert_(obj, callback) {
    const self = this;
    let arr = [];
    if (_.isArray(obj))
        arr = obj;
    else {
        arr.push(obj);
    }
    self.migrate(function(err) {
        if (err)
            return callback(err);

        const items = arr.map(function (x) {
            return {
                "object": self.parent[self.mapping.parentField],
                "value": x
            }
        });
        if (self.$silent) { self.getBaseModel().silent(); }
        return self.getBaseModel().save(items, callback);
    });
}
/**
 * @memberOf HasTagAssociation
 * @param {Function} callback
 * @private
 */
function HasTagAssociation_Clear_(callback) {
    const self = this;
    self.migrate(function(err) {
        if (err) {
            return callback(err);
        }
        if (self.$silent) { self.getBaseModel().silent(); }
        self.getBaseModel().where("object").equal(self.parent[self.mapping.parentField]).select("id").all().then(function(result) {
            if (result.length===0) { return callback(); }
            return self.getBaseModel().remove(result).then(function () {
                return callback();
            });
        }).catch(function(err) {
            return callback(err);
        });
    });
}
/**
 * @memberOf HasTagAssociation
 * @param {*} obj
 * @param {Function} callback
 * @private
 */
function HasTagAssociation_Remove_(obj, callback) {
    const self = this;
    let arr = [];
    if (_.isArray(obj))
        arr = obj;
    else {
        arr.push(obj);
    }
    self.migrate(function(err) {
        if (err) {
            return callback(err);
        }
        const items = arr.map(function (x) {
            return {
                "object": self.parent[self.mapping.parentField],
                "value": x
            }
        });
        if (self.$silent) { self.getBaseModel().silent(); }
        return self.getBaseModel().remove(items, callback);
    });
}