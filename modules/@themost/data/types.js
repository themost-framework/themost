/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2014-01-25.
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
var events = require('events'),
    sprintf = require('sprintf'),
    _ = require('lodash'),
    util = require('util'),
    async = require('async'),
    qry = require('most-query');

var types = { };

/**
 * @classdesc Represents an abstract data connector to a database
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

    this.rawConnection=null;
    this.options = options;
}

/**
 * Opens the underlying database connection
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 */
DataAdapter.prototype.open = function(callback) {
    //
};

/**
 * Closes the underlying database connection
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 */
DataAdapter.prototype.close = function(callback) {
    //
};

/**
 * Executes the given query against the underlying database.
 * @param {string|*} query - A string or a query expression to execute.
 * @param {*} values - An object which represents the named parameters that are going to used during query parsing
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 */
DataAdapter.prototype.execute = function(query, values, callback) {
    //
};
/**
 * Executes a batch query expression and returns the result.
 * @param {DataModelBatch} batch - The batch query expression to execute
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 * @deprecated This method is deprecated.
 */
DataAdapter.prototype.executeBatch = function(batch, callback) {
    //
};

/**
 * Produces a new identity value for the given entity and attribute.
 * @param {string} entity - A string that represents the target entity name
 * @param {string} attribute - A string that represents the target attribute name
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 */
DataAdapter.prototype.selectIdentity = function(entity, attribute , callback) {
    //
};

/**
 * Begins a transactional operation and executes the given function
 * @param {Function} fn - The function to execute
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 */
DataAdapter.prototype.executeInTransaction = function(fn, callback) {
    //
};
/**
 * A helper method for creating a database view if the current data adapter supports views
 * @param {string} name - A string that represents the name of the view to be created
 * @param {QueryExpression|*} query - A query expression that represents the database view
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 */
DataAdapter.prototype.createView = function(name, query, callback) {
    //
};

/**
 * @classdesc EventEmitter2 class is an extension of node.js EventEmitter class where listeners are excuting in series.
 * @class
 * @augments EventEmitter
 * @constructor
 */
function EventEmitter2() {
    //
}
util.inherits(EventEmitter2, events.EventEmitter);
/**
 * Raises the specified event and executes event listeners in series.
 * @param {String} event - The event that is going to be raised.
 * @param {*} args - An object that contains the event arguments.
 * @param {Function} callback - A callback function to be invoked after the execution.
 */
EventEmitter2.prototype.emit = function(event, args, callback)
{
    var self = this;
    ////example: call super class function
    //EventEmitter2.super_.emit.call(this);
    //ensure callback
    callback = callback || function() {};
    //get listeners
    if (typeof this.listeners !== 'function') {
        console.log('undefined listeners');
    }
    var listeners = this.listeners(event);
    //validate listeners
    if (listeners.length===0) {
        //exit emitter
        callback.call(self, null);
        return;
    }
    /*
     An EventEmitter2 listener must be a function with args and a callback e.g.
     function(e, cb) {
     //do some code
     ...
     //finalize event
     cb(null);
     //or
     cb(err)
     }
     */
    //get event arguments
    var e = args;
    //apply each series
    async.applyEachSeries(listeners, e, function(err) {
        callback.call(self, err);
    });
};

EventEmitter2.prototype.once = function(type, listener) {
    var self = this;
    if (typeof listener !== 'function')
        throw TypeError('listener must be a function');
    var fired = false;
    function g() {
        self.removeListener(type, g);
        if (!fired) {
            fired = true;
            listener.apply(this, arguments);
        }
    }
    g.listener = listener;
    this.on(type, g);
    return this;
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
 */
function DataEventArgs() {
    //
}

/**
 * @classdesc Represents the main data context.
 * @class
 * @augments EventEmitter2
 * @constructor
 */
function DataContext() {
    /**
     * Gets the current database adapter
     * @type {DataAdapter}
     */
    this.db = undefined;
    Object.defineProperty(this, 'db', {
        get : function() {
            return null;
        },
        configurable : true,
        enumerable:false });
}

/**
 * Gets a data model based on the given data context
 * @param name {string} A string that represents the model to be loaded.
 * @returns {DataModel}
 */
// eslint-disable-next-line no-unused-vars
DataContext.prototype.model = function(name) {
    return null;
};

/**
 * Gets an instance of DataConfiguration class which is associated with this data context
 * @returns {DataConfiguration}
 */
DataContext.prototype.getConfiguration = function() {
    return null;
};

/**
 * @param cb {Function}
 */
DataContext.prototype.finalize = function(cb) {
    //
};
//set EventEmitter2 inheritance
util.inherits(DataContext, EventEmitter2);

/**
 * @classdesc Represents a data model's listener
 * @class
 * @constructor
 * @abstract
  */
function DataEventListener() {
    //
}
/**
 * Occurs before executing a data operation. The event arguments contain the query that is going to be executed.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataEventListener.prototype.beforeExecute = function(e, cb) {
    return this;
};
/**
 * Occurs after executing a data operation. The event arguments contain the executed query.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataEventListener.prototype.afterExecute = function(e, cb) {
    return this;
};
/**
 * Occurs before creating or updating a data object.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataEventListener.prototype.beforeSave = function(e, cb) {
    return this;
};
/**
 * Occurs after creating or updating a data object.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataEventListener.prototype.afterSave = function(e, cb) {
    return this;
};
/**
 * Occurs before removing a data object.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 * @returns {DataEventListener}
 */
DataEventListener.prototype.beforeRemove = function(e, cb) {
    return this;
};
/**
 * Occurs after removing a data object.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataEventListener.prototype.afterRemove = function(e, cb) {
    return this;
};

/**
 * Occurs after upgrading a data model.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} cb - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataEventListener.prototype.afterUpgrade = function(e, cb) {
    return this;
};

var DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g;
var BooleanTrueRegex = /^true$/ig;
var BooleanFalseRegex = /^false$/ig;
var NullRegex = /^null$/ig;
var UndefinedRegex = /^undefined$/ig;
var IntegerRegex =/^[-+]?\d+$/g;
var FloatRegex =/^[+-]?\d+(\.\d+)?$/g;

/*
 * EXCEPTIONS
 */

/**
 * @classdesc Extends Error object for throwing exceptions on data operations
 * @class
 * @param {string=} code - A string that represents an error code
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @param {string=} model - The target model
 * @param {string=} field - The target field
 * @param {*} additionalData - Additional data associated with this error
 * @constructor
 * @property {string} code - A string that represents an error code e.g. EDATA
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error.
 * @property {*} additionalData - Additional data associated with this error
 * @augments Error
 */
function DataException(code, message, innerMessage, model, field, additionalData) {
    this.code  = code || 'EDATA';
    if (model)
        this.model = model;
    if (field)
        this.field = field;
    this.message = message || 'A general data error occured.';
    if (innerMessage)
        this.innerMessage = innerMessage;
    this.additionalData = additionalData;
}
util.inherits(DataException, Error);

/**
 * @classdesc Extends Error object for throwing not null exceptions.
 * @class
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @constructor
 * @property {string} code - A string that represents an error code. The default error code is ENULL.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error. The default status is 409 (Conflict)
 * @property {string} model - The target model name
 * @property {string} field - The target field name
 * @augments Error
  */
function NotNullException(message, innerMessage, model, field) {
    NotNullException.super_.call(this, 'ENULL', message || 'A value is required', innerMessage, model, field);
    this.status = 409;
}
util.inherits(NotNullException, DataException);

/**
 * @classdesc Extends Error object for throwing not found exceptions.
 * @class
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @constructor
 * @property {string} code - A string that represents an error code. The default error code is EFOUND.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error. The default status is 404 (Conflict)
 * @property {string} model - The target model name
 * @augments Error
 */
function DataNotFoundException(message, innerMessage, model) {
    DataNotFoundException.super_.call(this, 'EFOUND', message || 'The requested data was not found.', innerMessage, model);
    this.status = 404;
}
util.inherits(DataNotFoundException, DataException);

/**
 * @classdesc Extends Error object for throwing unique constraint exceptions.
 * @class
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @constructor
 * @property {string} code - A string that represents an error code. The default error code is ENULL.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @property {number} status - A number that represents an error status. This error status may be used for throwing the approriate HTTP error. The default status is 409 (Conflict)
 * @property {string} model - The target model name
 * @property {string} constraint - The target constraint name
 * @augments Error
 */
function UniqueConstraintException(message, innerMessage, model, constraint) {
    UniqueConstraintException.super_.call(this, 'EUNQ', message || 'A unique constraint violated', innerMessage, model);
    if (constraint)
        this.constraint = constraint;
    this.status = 409;
}
util.inherits(UniqueConstraintException, DataException);

/**
 * @classdesc Represents an access denied data exception.
 * @class
 *
 * @param {string=} message - The error message
 * @param {string=} innerMessage - The error inner message
 * @property {string} code - A string that represents an error code. The error code is EACCESS.
 * @property {number} status - A number that represents an error status. The error status is 401.
 * @property {string} message -  The error message.
 * @property {string} innerMessage - The error inner message.
 * @augments DataException
 * @constructor
 */
function AccessDeniedException(message, innerMessage) {
    AccessDeniedException.super_.call(this, 'EACCESS', ('Access Denied' || message) , innerMessage);
    this.status = 401;
}
util.inherits(AccessDeniedException, DataException);

/**
 * @ignore
 * @class
 * @param name
 * @constructor
 */
function DataQueryableField(name) {
    if (typeof name !== 'string') {
        throw new Error('Invalid argument type. Expected string.')
    }
    this.name = name;
}

/**
 * @returns {DataQueryableField}
 */
DataQueryableField.prototype.as = function(s) {
    if (_.isNil(s)) {
        delete this.$as;
        return this;
    }
    /**
     * @private
     * @type {string}
     */
    this.$as = s;
    return this;
};

/**
 * Returns the alias expression, if any.
 * @returns {string}
 * @private
 */
DataQueryableField.prototype._as = function() {
    return (typeof this.$as !== 'undefined' && this.$as != null) ? ' as ' + this.$as : '';
};

DataQueryableField.prototype.toString = function() {
    return this.name + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.max = function() {
    return sprintf.sprintf('max(%s)', this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.min = function() {
    return sprintf.sprintf('min(%s)', this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.count = function() {
    return sprintf.sprintf('count(%s)', this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.average = function() {
    return sprintf.sprintf('avg(%s)', this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.length = function() {
    return sprintf.sprintf('length(%s)', this.name) + this._as();
};

///**
// * @param {String} s
// * @returns {string}
// */
//DataQueryableField.prototype.indexOf = function(s) {
//    return sprintf.sprintf('indexof(%s,%s)', this.name, qry.escape(s)) + this._as();
//};

/**
 * @param {number} pos
 * @param {number} length
 * @returns {string}
 */
DataQueryableField.prototype.substr = function(pos, length) {
    return sprintf.sprintf('substring(%s,%s,%s)',this.name, pos, length) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.floor = function() {
    return sprintf.sprintf('floor(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.round = function() {
    return sprintf.sprintf('round(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.getYear = function() {
    return sprintf.sprintf('year(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.getDay = function() {
    return sprintf.sprintf('day(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.getMonth = function() {
    return sprintf.sprintf('month(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.getMinutes = function() {
    return sprintf.sprintf('minute(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.getHours = function() {
    return sprintf.sprintf('hour(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.getSeconds = function() {
    return sprintf.sprintf('second(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.getDate = function() {
    return sprintf.sprintf('date(%s)',this.name) + this._as();
};

///**
// * @returns {string}
// */
//DataQueryableField.prototype.ceil = function() {
//    return util('ceil(%s)',this.name);
//};

/**
 * @returns {string}
 */
DataQueryableField.prototype.toLocaleLowerCase = function() {
    return sprintf.sprintf('tolower(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.toLowerCase = function() {
    return sprintf.sprintf('tolower(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.toLocaleUpperCase = function() {
    return sprintf.sprintf('toupper(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.toUpperCase = function() {
    return sprintf.sprintf('toupper(%s)',this.name) + this._as();
};

/**
 * @returns {string}
 */
DataQueryableField.prototype.trim = function() {
    return sprintf.sprintf('trim(%s)',this.name) + this._as();
};

/** native extensions **/
if (typeof String.prototype.fieldOf === 'undefined')
{
    /**
     * @returns {DataQueryableField}
     * @private
     */
    var fnFieldOf = function() {
        if (this == null) {
            throw new TypeError('String.prototype.fieldOf called on null or undefined');
        }
        return new DataQueryableField(this.toString());
    };
    if (!String.prototype.fieldOf) { String.prototype.fieldOf = fnFieldOf; }
}


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
 * @ignore
 * @deprecated
 * @class
 * @constructor
 */
function DataModelBatch() {
    /**
     * Gets or sets a string that represents the data table that is going to be used in this operation.
     * This property cannot be null.
     */
    this.appliesTo = null;
    /**
     * Gets an array that contains the items to be added
     */
    this.add = [];
    /**
     * Gets an array that contains the items to be updated
     */
    this.change = [];
    /**
     * Gets an array that contains the items to be updated
     */
    this.remove = [];
    /**
     * Gets or sets the target model
     * @type {DataModel}
     */
    this.model = null;
}
/**
 * @param {*} obj
 */
DataModelBatch.prototype.prepare = function(obj) {
    var self = this;
    if (self.model==null)
        throw new Error('The model of a batch operation cannot be empty at this context.');
    var key = self.model.key();
    if (!obj)
        return;
    var items = _.isArray(obj) ? obj : [obj];
    array(items).each(function(x) {
        if (x[key.name]!=null) {
            //state is modified
            self.change = self.change || [];
            self.change.push(x);
        }
        else {
            //state is added
            self.add = self.add || [];
            self.add.push(x);
        }
    });
};

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
 * @property {string} refersTo - Gets or sets the parent property where this association refers to
 * @property {string} parentLabel - Gets or sets the parent field that is going to be used as label for this association
 * @property {string} cascade - Gets or sets the action that occurs when parent item is going to be deleted (all|none|null|delete). The default value is 'none'.
 * @property {string} associationType - Gets or sets the type of this association (junction|association). The default value is 'association'.
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
 * @property {Array} records - An array of objects which represents the query results.
 * @constructor
  */
function DataResultSet() {
    this.total = 0;
    this.skip = 0;
    this.records = [];
}

/**
 * @abstract
 * @constructor
 * @ignore
 */
function DataContextEmitter() {
    //
}
DataContextEmitter.prototype.ensureContext = function() {
    return null;
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
types.DataQueryableField = DataQueryableField;
types.DataAdapter = DataAdapter;
types.DataContext = DataContext;
types.DataContextEmitter = DataContextEmitter;
types.EventEmitter2 = EventEmitter2;
types.DataEventArgs = DataEventArgs;
types.DataEventListener = DataEventListener;
types.DataModelMigration = DataModelMigration;
types.DataAssociationMapping = DataAssociationMapping;
types.DataModelBatch = DataModelBatch;
types.DataException=DataException;
types.NotNullException=NotNullException;
types.UniqueConstraintException=UniqueConstraintException;
types.AccessDeniedException=AccessDeniedException;
types.DataNotFoundException=DataNotFoundException;
types.DataField=DataField;
types.DataResultSet=DataResultSet;
types.DataModelEventListener=DataModelEventListener;
types.DataModelPrivilege=DataModelPrivilege;
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