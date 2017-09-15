/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2014-02-03.
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
var model = require('./model'),
    _ = require('lodash'),
    types = require('./types'),
    cfg = require('./config'),
    validators = require('./data-validator'),
    dataCache = require('./cache'),
    dataCommon = require('./common'),
    dataClasses = require("./classes"),
    DefaultDataContext = require('./context').DefaultDataContext,
    NamedDataContext = require('./context').NamedDataContext;

var most = { };

most.cfg = cfg;
most.common = dataCommon;
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
