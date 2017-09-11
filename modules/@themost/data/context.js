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
var util = require('util'),
    _ = require("lodash"),
    dataCommon = require('./common'),
    types = require('./types'),
    cfg = require('./configuration');
/**
 * @classdesc Represents the default data context of MOST Data Applications.
 * The default data context uses the adapter which is registered as the default adapter in application configuration.
 <pre class="prettyprint"><code>
 adapters: [
 ...
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
 * @class
 * @constructor
 * @augments DataContext
 * @property {DataAdapter} db - Gets a data adapter based on the current configuration settings.
 */
function DefaultDataContext()
{
    /**
     * @type {types.DataAdapter|DataAdapter}
     * @private
     */
    var db_= null;
    /**
     * @private
     */
    this.finalize_ = function() {
        if (db_)
            db_.close();
        db_=null;
    };
    var self = this;

    self.getDb = function() {

        if (db_)
            return db_;
        var er;
        //otherwise load database options from configuration
        var adapter = _.find(self.getConfiguration().adapters, function(x) {
            return x["default"];
        });
        if (_.isNil(adapter)) {
            er = new Error('The default data adapter is missing.'); er.code = 'EADAPTER';
            throw er;
        }
        /**
         * @type {{createInstance:Function}|*}
         */
        var adapterType = self.getConfiguration().adapterTypes[adapter.invariantName];
        //validate data adapter type
        if (_.isNil(adapterType)) {
            er = new Error('Invalid adapter type.'); er.code = 'EADAPTER';
            throw er;
        }
        if (typeof adapterType.createInstance !== 'function') {
            er= new Error('Invalid adapter type. Adapter initialization method is missing.'); er.code = 'EADAPTER';
            throw er;
        }
        //otherwise load adapter
        db_ = adapterType.createInstance(adapter.options);
        return db_;
    };

    self.setDb = function(value) {
        db_ = value;
    };

    delete self.db;

    Object.defineProperty(self, 'db', {
        get: function() {
            return self.getDb();
        },
        set: function(value) {
            self.setDb(value);
        },
        configurable: true,
        enumerable:false });
}

util.inherits(DefaultDataContext, types.DataContext);

/**
 * Gets an instance of DataConfiguration class which is associated with this data context
 * @returns {DataConfiguration}
 */
DefaultDataContext.prototype.getConfiguration = function() {
    return cfg.current;
};

/**
 * Gets an instance of DataModel class based on the given name.
 * @param name {string} - A string that represents the model name.
 * @returns {DataModel} - An instance of DataModel class associated with this data context.
 */
DefaultDataContext.prototype.model = function(name) {
    var self = this;
    if ((name === null) || (name === undefined))
        return null;
    var obj = self.getConfiguration().model(name);
    if (_.isNil(obj))
        return null;
    var DataModel = require('./model').DataModel,
        model = new DataModel(obj);
    //set model context
    model.context = self;
    //return model
    return model;
};
/**
 * Finalizes the current data context
 * @param {Function} cb - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 */
DefaultDataContext.prototype.finalize = function(cb) {
    cb = cb || function () {};
    this.finalize_();
    cb.call(this);
};


/**
 * @classdesc Represents a data context based on a data adapter's name.
 * The specified adapter name must be registered in application configuration.
 * @class
 * @constructor
 * @augments DataContext
 * @property {DataAdapter} db - Gets a data adapter based on the given adapter's name.
 */
function NamedDataContext(name)
{
    NamedDataContext.super_.call();
    /**
     * @type {DataAdapter}
     * @private
     */
    var db_;
    /**
     * @private
     */
    this.finalize_ = function() {
        try {
            if (db_)
                db_.close();
        }
        catch(e) {
            dataCommon.debug('An error occure while closing the underlying database context.');
            dataCommon.debug(e);
        }
        db_ = null;
    };
    //set the name specified
    var self = this, name_ = name;

    self.getDb = function() {
        if (db_)
            return db_;
        //otherwise load database options from configuration
        var adapter = self.getConfiguration().adapters.find(function(x) {
            return x.name === name_;
        });
        var er;
        if (typeof adapter ==='undefined' || adapter===null) {
            er = new Error('The specified data adapter is missing.'); er.code = 'EADAPTER';
            throw er;
        }
        //get data adapter type
        var adapterType = self.getConfiguration().adapterTypes[adapter.invariantName];
        //validate data adapter type
        if (_.isNil(adapterType)) {
            er = new Error('Invalid adapter type.'); er.code = 'EADAPTER';
            throw er;
        }
        if (typeof adapterType.createInstance !== 'function') {
            er= new Error('Invalid adapter type. Adapter initialization method is missing.'); er.code = 'EADAPTER';
            throw er;
        }
        //otherwise load adapter
        db_ = adapterType.createInstance(adapter.options);
        return db_;
    };

    self.setDb = function(value) {
        db_ = value;
    };

    /**
     * Gets an instance of DataConfiguration class which is associated with this data context
     * @returns {DataConfiguration}
     */
    this.getConfiguration = function() {
        return cfg.getNamedConfiguration(name_);
    };

    delete self.db;

    Object.defineProperty(self, 'db', {
        get : function() {
            return self.getDb();
        },
        set : function(value) {
            self.setDb(value);
        },
        configurable : true,
        enumerable:false });

}
util.inherits(NamedDataContext, types.DataContext);

/**
 * Gets an instance of DataModel class based on the given name.
 * @param name {string} - A string that represents the model name.
 * @returns {DataModel} - An instance of DataModel class associated with this data context.
 */
NamedDataContext.prototype.model = function(name) {
    var self = this;
    if ((name === null) || (name === undefined))
        return null;
    var obj = self.getConfiguration().model(name);
    if (_.isNil(obj))
        return null;
    var DataModel = require('./model').DataModel;
    var model = new DataModel(obj);
    //set model context
    model.context = self;
    //return model
    return model;
};

NamedDataContext.prototype.finalize = function(cb) {
    cb = cb || function () {};
    this.finalize_();
    cb.call(this);
};


if (typeof exports !== 'undefined')
{
    module.exports = {
        DefaultDataContext:DefaultDataContext,
        NamedDataContext:NamedDataContext

    };
}