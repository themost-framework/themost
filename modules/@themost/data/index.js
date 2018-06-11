/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var model = require('./data-model');
var _ = require('lodash');
var types = require('./types');
var cfg = require('./data-configuration');
var validators = require('./data-validator');
var dataCache = require('./data-cache');
var dataClasses = require("./data-classes");
var DefaultDataContext = require('./data-context').DefaultDataContext;
var NamedDataContext = require('./data-context').NamedDataContext;
var most = { };

most.cfg = cfg;
most.types = types;
most.cache = dataCache;
most.validators = validators;
most.classes = dataClasses;
/**
 * @ignore
 * @deprecated - DataObject constructor will be removed. Use most.classes.DataObject.
 */
most.DataObject = require('./data-object').DataObject;
/**
 * Creates an instance of DataContext class which represents the default data context. If parameter [name] is specified, returns the named data context specified in application configuration.
 * @param {string=} name
 * @returns {DataContext}
 */
most.createContext = function(name) {
    if (_.isNil(name))
        return new DefaultDataContext();
    else
        return new NamedDataContext(name);
};
/**
 * @param {function(DataContext)} fn - A function fn(context) that is going to be invoked in current context
 */
most.execute = function(fn)
{
    fn = fn || function() {};
    var ctx = new DefaultDataContext();
    fn.call(null, ctx);
};
/**
 * @param {string} userName
 * @param {function(DataContext)} fn - A function fn(context) that is going to be invoked in current context
 */
most.executeAs = function(userName, fn)
{
    fn = fn || function() {};
    var ctx = new DefaultDataContext();
    ctx.user = { name:userName, authenticationType:'Basic' };
    fn.call(null, ctx);
};

module.exports = most;
