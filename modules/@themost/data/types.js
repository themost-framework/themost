/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var sprintf = require('sprintf').sprintf;
var _ = require('lodash');
var SequentialEventEmitter = require("@themost/common/emitter").SequentialEventEmitter;
var LangUtils = require("@themost/common/utils").LangUtils;
var AbstractClassError = require('@themost/common/errors').AbstractClassError;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;

var types = { };

/**
 * @classdesc Represents an abstract data connector to a database
 * @description
 * <p>
 There are several data adapters for connections to common database engines:
 </p>
 <ul>
    <li>MOST Web Framework MySQL Adapter for connecting with MySQL Database Server
    <p>Install the data adapter:<p>
    <pre class="prettyprint"><code>npm install most-data-mysql</code></pre>
    <p>Append the adapter type in application configuration (app.json#adapterTypes):<p>
    <pre class="prettyprint"><code>
 ...
 "adapterTypes": [
 ...
 { "name":"MySQL Data Adapter", "invariantName": "mysql", "type":"most-data-mysql" }
 ...
 ]
 </code></pre>
 <p>Register an adapter in application configuration (app.json#adapters):<p>
 <pre class="prettyprint"><code>
 adapters: [
 ...
 { "name":"development", "invariantName":"mysql", "default":true,
     "options": {
       "host":"localhost",
       "port":3306,
       "user":"user",
       "password":"password",
       "database":"test"
     }
 }
 ...
 ]
 </code></pre>
 </li>
    <li>MOST Web Framework MSSQL Adapter for connecting with Microsoft SQL Database Server
 <p>Install the data adapter:<p>
 <pre class="prettyprint"><code>npm install most-data-mssql</code></pre>
 <p>Append the adapter type in application configuration (app.json#adapterTypes):<p>
 <pre class="prettyprint"><code>
 ...
 "adapterTypes": [
 ...
 { "name":"MSSQL Data Adapter", "invariantName": "mssql", "type":"most-data-mssql" }
 ...
 ]
 </code></pre>
 <p>Register an adapter in application configuration (app.json#adapters):<p>
 <pre class="prettyprint"><code>
 adapters: [
 ...
 { "name":"development", "invariantName":"mssql", "default":true,
        "options": {
          "server":"localhost",
          "user":"user",
          "password":"password",
          "database":"test"
        }
    }
 ...
 ]
 </code></pre>
 </li>
    <li>MOST Web Framework PostgreSQL Adapter for connecting with PostgreSQL Database Server
 <p>Install the data adapter:<p>
 <pre class="prettyprint"><code>npm install most-data-pg</code></pre>
 <p>Append the adapter type in application configuration (app.json#adapterTypes):<p>
 <pre class="prettyprint"><code>
 ...
 "adapterTypes": [
 ...
 { "name":"PostgreSQL Data Adapter", "invariantName": "postgres", "type":"most-data-pg" }
 ...
 ]
 </code></pre>
 <p>Register an adapter in application configuration (app.json#adapters):<p>
 <pre class="prettyprint"><code>
 adapters: [
 ...
 { "name":"development", "invariantName":"postgres", "default":true,
        "options": {
          "host":"localhost",
          "post":5432,
          "user":"user",
          "password":"password",
          "database":"db"
        }
    }
 ...
 ]
 </code></pre>
 </li>
    <li>MOST Web Framework Oracle Adapter for connecting with Oracle Database Server
 <p>Install the data adapter:<p>
 <pre class="prettyprint"><code>npm install most-data-oracle</code></pre>
 <p>Append the adapter type in application configuration (app.json#adapterTypes):<p>
 <pre class="prettyprint"><code>
 ...
 "adapterTypes": [
 ...
 { "name":"Oracle Data Adapter", "invariantName": "oracle", "type":"most-data-oracle" }
 ...
 ]
 </code></pre>
 <p>Register an adapter in application configuration (app.json#adapters):<p>
 <pre class="prettyprint"><code>
 adapters: [
 ...
 { "name":"development", "invariantName":"oracle", "default":true,
        "options": {
          "host":"localhost",
          "port":1521,
          "user":"user",
          "password":"password",
          "service":"orcl",
          "schema":"PUBLIC"
        }
    }
 ...
 ]
 </code></pre>
 </li>
    <li>MOST Web Framework SQLite Adapter for connecting with Sqlite Databases
 <p>Install the data adapter:<p>
 <pre class="prettyprint"><code>npm install most-data-sqlite</code></pre>
 <p>Append the adapter type in application configuration (app.json#adapterTypes):<p>
 <pre class="prettyprint"><code>
 ...
 "adapterTypes": [
 ...
 { "name":"SQLite Data Adapter", "invariantName": "sqlite", "type":"most-data-sqlite" }
 ...
 ]
 </code></pre>
 <p>Register an adapter in application configuration (app.json#adapters):<p>
 <pre class="prettyprint"><code>
 adapters: [
 ...
 { "name":"development", "invariantName":"sqlite", "default":true,
        "options": {
            database:"db/local.db"
        }
    }
 ...
 ]
 </code></pre>
 </li>
    <li>MOST Web Framework Data Pool Adapter for connection pooling
 <p>Install the data adapter:<p>
 <pre class="prettyprint"><code>npm install most-data-pool</code></pre>
 <p>Append the adapter type in application configuration (app.json#adapterTypes):<p>
 <pre class="prettyprint"><code>
 ...
 "adapterTypes": [
 ...
 { "name":"Pool Data Adapter", "invariantName": "pool", "type":"most-data-pool" }
 { "name":"...", "invariantName": "...", "type":"..." }
 ...
 ]
 </code></pre>
 <p>Register an adapter in application configuration (app.json#adapters):<p>
 <pre class="prettyprint"><code>
 adapters: [
 { "name":"development", "invariantName":"...", "default":false,
    "options": {
      "server":"localhost",
      "user":"user",
      "password":"password",
      "database":"test"
    }
},
 { "name":"development_with_pool", "invariantName":"pool", "default":true,
    "options": {
      "adapter":"development"
    }
}
 ...
 ]
 </code></pre>
 </li>
 </ul>
 * @class
 * @constructor
 * @param {*} options - The database connection options
 * @abstract
 * @property {*} rawConnection - Gets or sets the native database connection
 * @property {*} options - Gets or sets the database connection options
 */
function DataAdapter(options) {
    if (this.constructor === DataAdapter.prototype.constructor) {
        throw new AbstractClassError();
    }
    this.rawConnection=null;
    this.options = options;
}

// noinspection JSUnusedLocalSymbols
/**
 * Opens the underlying database connection
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataAdapter.prototype.open = function(callback) {
    throw new AbstractMethodError();
};
// noinspection JSUnusedLocalSymbols
/**
 * Closes the underlying database connection
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataAdapter.prototype.close = function(callback) {
    throw new AbstractMethodError();
};
// noinspection JSUnusedLocalSymbols
/**
 * Executes the given query against the underlying database.
 * @param {string|*} query - A string or a query expression to execute.
 * @param {*} values - An object which represents the named parameters that are going to used during query parsing
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise. The second argument will contain the result.
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataAdapter.prototype.execute = function(query, values, callback) {
    throw new AbstractMethodError();
};
// noinspection JSUnusedLocalSymbols
/**
 * Produces a new identity value for the given entity and attribute.
 * @param {string} entity - A string that represents the target entity name
 * @param {string} attribute - A string that represents the target attribute name
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise. The second argument will contain the result.
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataAdapter.prototype.selectIdentity = function(entity, attribute , callback) {
    throw new AbstractMethodError();
};
// noinspection JSUnusedLocalSymbols
/**
 * Begins a transactional operation and executes the given function
 * @param {Function} fn - The function to execute
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise. The second argument will contain the result.
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataAdapter.prototype.executeInTransaction = function(fn, callback) {
    throw new AbstractMethodError();
};
// noinspection JSUnusedLocalSymbols
/**
 * A helper method for creating a database view if the current data adapter supports views
 * @param {string} name - A string that represents the name of the view to be created
 * @param {QueryExpression|*} query - A query expression that represents the database view
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise.
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataAdapter.prototype.createView = function(name, query, callback) {
    throw new AbstractMethodError();
};

/**
 * @classdesc Represents the event arguments of a data model listener.
 * @class
 * @constructor
 * @property {DataModel|*} model - Represents the underlying model.
 * @property {DataObject|*} target - Represents the underlying data object.
 * @property {Number|*} state - Represents the operation state (Update, Insert, Delete).
 * @property {DataQueryable|*} emitter - Represents the event emitter, normally a DataQueryable object instance.
 * @property {*} query - Represents the underlying query expression. This property may be null.
 * @property {DataObject|*} previous - Represents the underlying data object.
 */
function DataEventArgs() {
    //
}

/**
 * @classdesc Represents the main data context.
 * @class
 * @augments SequentialEventEmitter
 * @constructor
 * @abstract
 */
function DataContext() {
    DataContext.super_.bind(this)();
    //throw abstract class error
    if (this.constructor === DataContext.prototype.constructor) {
        throw new AbstractClassError();
    }
    /**
     * @property db
     * @description Gets the current database adapter
     * @type {DataAdapter}
     * @memberOf DataContext#
     */
    Object.defineProperty(this, 'db', {
        get : function() {
            return null;
        },
        configurable : true,
        enumerable:false });
}
// noinspection JSUnusedLocalSymbols
/**
 * Gets a data model based on the given data context
 * @param name {string} A string that represents the model to be loaded.
 * @returns {DataModel}
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataContext.prototype.model = function(name) {
    throw new AbstractMethodError();
};

/**
 * Gets an instance of DataConfiguration class which is associated with this data context
 * @returns {ConfigurationBase}
 * @abstract
 */
DataContext.prototype.getConfiguration = function() {
    throw new AbstractMethodError();
};
// noinspection JSUnusedLocalSymbols
/**
 * @param {Function} callback
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
DataContext.prototype.finalize = function(callback) {
    throw new AbstractMethodError();
};
LangUtils.inherits(DataContext, SequentialEventEmitter);

/**
 * @classdesc Represents a data model's listener
 * @class
 * @constructor
 * @abstract
  */
function DataEventListener() {
    //do nothing
}
/**
 * Occurs before executing a data operation. The event arguments contain the query that is going to be executed.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
// eslint-disable-next-line no-unused-vars
DataEventListener.prototype.beforeExecute = function(e, cb) {
    return cb();
};
/**
 * Occurs after executing a data operation. The event arguments contain the executed query.
 * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
// eslint-disable-next-line no-unused-vars
DataEventListener.prototype.afterExecute = function(event, cb) {
    return cb();
};
/**
 * Occurs before creating or updating a data object.
 * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
// eslint-disable-next-line no-unused-vars
DataEventListener.prototype.beforeSave = function(event, cb) {
    return cb();
};
/**
 * Occurs after creating or updating a data object.
 * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
// eslint-disable-next-line no-unused-vars
DataEventListener.prototype.afterSave = function(event, cb) {
    return cb();
};
/**
 * Occurs before removing a data object.
 * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 * @returns {DataEventListener}
 */
// eslint-disable-next-line no-unused-vars
DataEventListener.prototype.beforeRemove = function(event, cb) {
    return cb();
};
/**
 * Occurs after removing a data object.
 * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
// eslint-disable-next-line no-unused-vars
DataEventListener.prototype.afterRemove = function(event, cb) {
    return cb();
};

/**
 * Occurs after upgrading a data model.
 * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
// eslint-disable-next-line no-unused-vars
DataEventListener.prototype.afterUpgrade = function(event, cb) {
    return cb();
};

var DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g;
var BooleanTrueRegex = /^true$/ig;
var BooleanFalseRegex = /^false$/ig;
/*
var NullRegex = /^null$/ig;
var UndefinedRegex = /^undefined$/ig;
*/
var IntegerRegex =/^[-+]?\d+$/g;
var FloatRegex =/^[+-]?\d+(\.\d+)?$/g;


/**
 * Represents a model migration scheme against data adapters
 * @class
 * @constructor
 * @ignore
 */
function DataModelMigration() {
    /**
     * Gets an array that contains the definition of fields that are going to be added
     * @type {Array}
     */
    this.add = [];
    /**
     * Gets an array that contains a collection of constraints which are going to be added
     * @type {Array}
     */
    this.constraints = [];
    /**
     * Gets an array that contains a collection of indexes which are going to be added or updated
     * @type {Array}
     */
    this.indexes = [];
    /**
     * Gets an array that contains the definition of fields that are going to be deleted
     * @type {Array}
     */
    this.remove = [];
    /**
     * Gets an array that contains the definition of fields that are going to be changed
     * @type {Array}
     */
    this.change = [];
    /**
     * Gets or sets a string that contains the internal version of this migration. This property cannot be null.
     * @type {string}
     */
    this.version = '0.0';
    /**
     * Gets or sets a string that represents a short description of this migration
     * @type {string}
     */
    this.description = null;
    /**
     * Gets or sets a string that represents the adapter that is going to be migrated through this operation.
     * This property cannot be null.
     */
    this.appliesTo = null;
    /**
     * Gets or sets a string that represents the model that is going to be migrated through this operation.
     * This property may be null.
     */
    this.model = null;
}

/**
 * @classdesc DataAssociationMapping class describes the association between two models.
 * <p>
 *     An association between two models is described in field attributes. For example
 *     model Order may have an association with model Party (Person or Organization) through the field Order.customer:
 * </p>
 <pre class="prettyprint"><code>
   { "name": "Order",
     "fields": [
    ...
   {
        "name": "customer",
        "title": "Customer",
        "description": "Party placing the order.",
        "type": "Party"
    }
    ...]
    }
 </code></pre>
 <p>
      This association is equivalent with the following DataAssociationMapping instance:
 </p>
 <pre class="prettyprint"><code>
 "mapping": {
    "cascade": "null",
    "associationType": "association",
    "select": [],
    "childField": "customer",
    "childModel": "Order",
    "parentField": "id",
    "parentModel": "Party"
}
 </code></pre>
  <p>
 The above association mapping was auto-generated from the field definition of Order.customer where the field type (Party)
 actually defines the association between these models.
 </p>
 <p>
 Another example of an association between two models is a many-to-many association. User model has a many-to-many association (for user groups) with Group model:
 </p>
 <pre class="prettyprint"><code>
 { "name": "User",
   "fields": [
  ...
 {
    "name": "groups",
    "title": "User Groups",
    "description": "A collection of groups where user belongs.",
    "type": "Group",
    "expandable": true,
    "mapping": {
        "associationAdapter": "GroupMembers",
        "parentModel": "Group",
        "parentField": "id",
        "childModel": "User",
        "childField": "id",
        "associationType": "junction",
        "cascade": "delete"
    }
}
  ...]
  }
 </code></pre>
 <p>This association may also be defined in Group model:</p>
 <pre class="prettyprint"><code>
 { "name": "Group",
   "fields": [
  ...
 {
    "name": "members",
    "title": "Group Members",
    "description": "Contains the collection of group members (users or groups).",
    "type": "Account",
    "many":true
}
  ...]
  }
 </code></pre>
 *
 * @class
 * @property {string} associationAdapter - Gets or sets the association database object
 * @property {string} parentModel - Gets or sets the parent model name
 * @property {string} childModel - Gets or sets the child model name
 * @property {string} parentField - Gets or sets the parent field name
 * @property {string} childField - Gets or sets the child field name
 * @property {string} associationObjectField - Gets or sets the name of the parent field as it is defined in association adapter. This attribute is optional but it is required for many-to-many associations where parent and child model are the same.
 * @property {string} associationValueField - Gets or sets the name of the child field as it is defined in association adapter. This attribute is optional but it is required for many-to-many associations where parent and child model are the same.
 * @property {string} refersTo - Gets or sets the parent property where this association refers to
 * @property {string} parentLabel - Gets or sets the parent field that is going to be used as label for this association
 * @property {string} cascade - Gets or sets the action that occurs when parent item is going to be deleted (all|none|null|delete). The default value is 'none'.
 * @property {string} associationType - Gets or sets the type of this association (junction|association). The default value is 'association'.
 * @property {Array<DataModelPrivilege>} privilege - Gets or sets a collection of privileges which are going to be attached in a many-to-many association
 * @property {string[]} select - Gets or sets an array of fields to select from associated model. If this property is empty then all associated model fields will be selected.
 * @property {*} options - Gets or sets a set of default options which are going to be used while expanding results based on this data association.
 * @param {*=} obj - An object that contains relation mapping attributes
 * @constructor
 */
function DataAssociationMapping(obj) {
    this.cascade = 'none';
    this.associationType = 'association';
    //this.select = [];
    if (typeof obj === 'object') { _.assign(this, obj); }
}


/**
 * @class
 * @constructor
 * @property {string} name - Gets or sets the internal name of this field.
 * @property {string} property - Gets or sets the property name for this field.
 * @property {string} title - Gets or sets the title of this field.
 * @property {boolean} nullable - Gets or sets a boolean that indicates whether field is nullable or not.
 * @property {string} type - Gets or sets the type of this field.
 * @property {boolean} primary - Gets or sets a boolean that indicates whether field is primary key or not.
 * @property {boolean} many - Gets or sets a boolean that indicates whether field defines an one-to-many relationship between models.
 * @property {boolean} model - Gets or sets the parent model of this field.
 * @property {*} value - Gets or sets the default value of this field.
 * @property {*} calculation - Gets or sets the calculated value of this field.
 * @property {boolean} readonly - Gets or sets a boolean which indicates whether a field is readonly.
 * @property {boolean} editable - Gets or sets a boolean which indicates whether a field is available for edit. The default value is true.
 * @property {DataAssociationMapping} mapping - Get or sets a relation mapping for this field.
 * @property {string} coltype - Gets or sets a string that indicates the data field's column type. This attribute is used in data view definition
 * @property {boolean} expandable - Get or sets whether the current field defines an association mapping and the associated data object(s) must be included while getting data.
 * @property {string} section - Gets or sets the section where the field belongs.
 * @property {boolean} nested - Gets or sets a boolean which indicates whether this field allows object(s) to be nested and updatable during an insert or update operation
 * @property {string} description - Gets or sets a short description for this field.
 * @property {string} help - Gets or sets a short help for this field.
 * @property {string} appearance - Gets or sets the appearance template of this field, if any.
 * @property {{type:string,custom:string,minValue:*,maxValue:*,minLength:number,maxLength:number,pattern:string,patternMessage:string}|*} validation - Gets or sets data validation attributes.
 * @property {*} options - Gets or sets the available options for this field.
 * @property {boolean} virtual - Gets or sets a boolean that indicates whether this field is a view only field or not.
 * @property {boolean} indexed - Gets or sets a boolean which indicates whether this field will be indexed for searching items. The default value is false.
  */
function DataField() {
    this.nullable = true;
    this.primary = false;
    this.indexed = false;
    this.readonly = false;
    this.expandable = false;
    this.virtual = false;
    this.editable = true;
}

// noinspection JSUnusedGlobalSymbols
DataField.prototype.getName = function() {
  return this.property || this.name;
};

/**
 * @class
 * @constructor
 * @property {string} name - Gets or sets a short description for this listener
 * @property {string} type - Gets or sets a string which is the path of the module that exports this listener.
 * @property {boolean} disabled - Gets or sets a boolean value that indicates whether this listener is disabled or not. The default value is false.
 * @description
 * <p>
 * A data model uses event listeners as triggers which are automatically executed after data operations.
 * Those listeners are defined in [eventListeners] section of a model's schema.
 * </p>
 * <pre class="prettyprint">
 *<code>
*     {
*          ...
*          "fields": [ ... ],
*          ...
*          "eventListeners": [
*              { "name":"Update Listener", "type":"/app/controllers/an-update-listener.js" },
*              { "name":"Another Update Listener", "type":"module-a/lib/listener" }
*          ]
*          ...
*     }
 *</code>
 * </pre>
 * @example
 * // A simple DataEventListener that sends a message to sales users after new order was arrived.
 * var web = require("most-web");
 exports.afterSave = function(event, callback) {
    //exit if state is other than [Insert]
    if (event.state != 1) { return callback() }
    //initialize web mailer
    var mm = require("most-web-mailer"), context = event.model.context;
    //send new order mail template by passing new item data
    mm.mailer(context).to("sales@example.com")
        .cc("supervisor@example.com")
        .subject("New Order")
        .template("new-order").send(event.target, function(err) {
        if (err) { return web.common.log(err); }
        return callback();
    });
};
 *
 */
function DataModelEventListener() {

}
/**
 * An enumeration of tha available privilege types
 * @enum
 */
var PrivilegeType = {
    /**
     * Self Privilege (self).
     * @type {string}
     */
    Self: "self",
    /**
     * Parent Privilege (parent)
     * @type {string}
     */
    Parent: "parent",
    /**
     * Item Privilege (child)
     * @type {string}
     */
    Item: "item",
    /**
     * Global Privilege (global)
     * @type {string}
     */
    Global: "global"
};

/**
 * @classdesc Represents a privilege which is defined in a data model and it may be given in users and groups
 * @class
 * @constructor
 * @property {PermissionMask} mask - Gets or sets the set of permissions which may be given with this privilege.
 * @property {PrivilegeType|string} type - Gets or sets the type of this privilege (global|parent|item|self).
 * @property {string} filter - Gets or sets a filter expression which is going to be used for self privileges.
 * The defined set of permissions are automatically assigned if the requested objects fulfill filter criteria.
 * (e.g. read-write permissions for a user's associated person through the following expression:"user eq me()")
 * @property {string} account - Gets or sets a wildcard (*) expression for global privileges only.
 * The defined set of permissions are automatically assigned to all users (e.g. read permissions for all users)
 */
function DataModelPrivilege() {

}



/**
 * Represents a query result when this query uses paging parameters.
 * @class
 * @property {number} total - The total number of records
 * @property {number} skip - The number of skipped records
 * @property {Array} value - An array of objects which represents the query results.
 * @constructor
  */
function DataResultSet() {
    this.total = 0;
    this.skip = 0;
    this.value = [];
}

/**
 * @abstract
 * @constructor
 * @ignore
 */
function DataContextEmitter() {
    if (this.constructor === DataContextEmitter.prototype.constructor) {
        throw new AbstractClassError();
    }
}

/**
 * @abstract
 */
DataContextEmitter.prototype.ensureContext = function() {
    throw new AbstractMethodError();
};

/**
 * An enumeration of the available data object states
 * @enum {number}
 */
var DataObjectState = {
    /**
     * Insert State (1)
     */
    Insert:1,
    /**
     * Update State (2)
     */
    Update:2,
    /**
     * Delete State (4)
     */
    Delete:4
};

/**
 * An enumeration of the available data caching types
 * @enum {string}
 */
var DataCachingType = {
    /**
     * Data will never be cached (none)
     */
    None: 'none',
    /**
     * Data will always be cached (always)
     */
    Always: 'always',
    /**
     * Data will conditionally be cached (conditional)
     */
    Conditional: 'conditional'
};

types.PrivilegeType = PrivilegeType;
types.DataObjectState = DataObjectState;
types.DataCachingType = DataCachingType;
types.DataAdapter = DataAdapter;
types.DataContext = DataContext;
types.DataContextEmitter = DataContextEmitter;
types.DataEventArgs = DataEventArgs;
types.DataEventListener = DataEventListener;
types.DataModelMigration = DataModelMigration;
types.DataAssociationMapping = DataAssociationMapping;
types.DataField=DataField;
types.DataResultSet=DataResultSet;
types.DataModelEventListener=DataModelEventListener;
types.DataModelPrivilege=DataModelPrivilege;
// noinspection JSUnusedGlobalSymbols
types.parsers = {
    parseInteger: function(val) {
        if (_.isNil(val))
            return 0;
        else if (typeof val === 'number')
            return val;
        else if (typeof val === 'string') {
            if (val.match(IntegerRegex) || val.match(FloatRegex)) {
                return parseInt(val, 10);
            }
            else if (val.match(BooleanTrueRegex))
                return 1;
            else if (val.match(BooleanFalseRegex))
                return 0;
        }
        else if (typeof val === 'boolean')
            return val===true ? 1 : 0;
        else {
            return parseInt(val) || 0;
        }
    },
    parseCounter: function(val) {
        return types.parsers.parseInteger(val);
    },
    parseFloat: function(val) {
        if (_.isNil(val))
            return 0;
        else if (typeof val === 'number')
            return val;
        else if (typeof val === 'string') {
            if (val.match(IntegerRegex) || val.match(FloatRegex)) {
                return parseFloat(val);
            }
            else if (val.match(BooleanTrueRegex))
                return 1;
        }
        else if (typeof val === 'boolean')
            return val===true ? 1 : 0;
        else {
            return parseFloat(val);
        }
    },
    parseNumber: function(val) {
        return types.parsers.parseFloat(val);
    },
    parseDateTime: function(val) {
        if (_.isNil(val))
            return null;
        if (val instanceof Date)
            return val;
        if (typeof val === 'string') {
            if (val.match(DateTimeRegex))
                return new Date(Date.parse(val));
        }
        else if (typeof val === 'number') {
            return new Date(val);
        }
        return null;
    },
    parseDate: function(val) {
        var res = types.parsers.parseDateTime(val);
        if (res instanceof Date) {
            res.setHours(0,0,0,0);
            return res;
        }
        return res;
    },
    parseBoolean: function(val) {
        return (types.parsers.parseInteger(val)!==0);
    },
    parseText: function(val) {
        if (_.isNil(val))
            return val;
        else if (typeof val === 'string') {
            return val;
        }
        else {
            return val.toString();
        }
    }
};

module.exports = types;