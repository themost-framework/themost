/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2014-06-19.
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
 * @private
 */
var util=require('util'),
    qry = require('most-query'),
    async = require('async'),
    types = require('./types'),
    _ = require("lodash"),
    dataCache = require('./data-cache'),
    common = require('./data-common');

/**
 * @class
 * @constructor
 * @private
 * @ignore
 */
function EachSeriesCancelled() {
    //
}

/**
 * @class
 * @constructor
 */
function DataPermissionEventArgs() {
    /**
     * The target data model
     * @type {DataModel}
     */
    this.model = null;
    /**
     * The underlying query expression
     * @type {QueryExpression}
     */
    this.query = null;
    /**
     * The permission mask
     * @type {Number}
     */
    this.mask = null;
    /**
     * The query type
     * @type {String}
     */
    this.type = null;
    /**
     * The query type
     * @type {String}
     */
    this.privilege = null;
    /**
     * The data queryable object that emits the event.
     * @type {DataQueryable|*}
     */
    this.emitter = null;
}
/**
 * An enumeration of the available permission masks
 * @enum {number}
 */
var PermissionMask = {
    /**
     * Read Access Mask (1)
     */
    Read:1,
    /**
     * Create Access Mask (2)
     */
    Create:2,
    /**
     * Update Access Mask (4)
     */
    Update:4,
    /**
     * Delete Access Mask (8)
     */
    Delete:8,
    /**
     * Execute Access Mask (16)
     */
    Execute:16,
    /**
     * Full Access Mask (31)
     */
    Owner:31
};

/**
 * @class
 * @constructor
 */
function DataPermissionEventListener() {
    //
}
/**
 * Occurs before creating or updating a data object.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataPermissionEventListener.prototype.beforeSave = function(e, callback)
{
    DataPermissionEventListener.prototype.validate(e, callback);
};
/**
 * Occurs before removing a data object.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 * @returns {DataEventListener}
 */
DataPermissionEventListener.prototype.beforeRemove = function(e, callback)
{
    DataPermissionEventListener.prototype.validate(e, callback);
};
/**
 * Validates permissions against the event arguments provided.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataPermissionEventListener.prototype.validate = function(e, callback) {
    var model = e.model,
        context = e.model.context,
        requestMask = 1,
        workspace = 1;
    //ensure silent operation
    if (e.model && e.model.$silent) {
        callback();
        return;
    }
    if (e.state == 0)
        requestMask = PermissionMask.Read;
    else if (e.state==1)
        requestMask = PermissionMask.Create;
    else if (e.state==2)
        requestMask = PermissionMask.Update;
    else if (e.state==4)
        requestMask = PermissionMask.Delete;
    else if (e.state==16)
        requestMask = PermissionMask.Execute;
    else {
        callback(new Error('Target object has an invalid state.'));
        return;
    }
    //validate throwError
    if (typeof e.throwError === 'undefined')
        e.throwError = true;
    context.user = context.user || { name:'anonymous',authenticationType:'None' };
    //change: 2-May 2015
    //description: Use unattended execution account as an escape permission check account
    var authSettings = context.getConfiguration().getAuthSettings();
    if (authSettings)
    {
        var unattendedExecutionAccount=authSettings.unattendedExecutionAccount;
        if ((typeof unattendedExecutionAccount !== 'undefined'
            || unattendedExecutionAccount != null)
            && (unattendedExecutionAccount===context.user.name))
        {
            e.result = true;
            callback();
            return;
        }
    }
    //get user key
    var users = context.model('User'), permissions = context.model('Permission');
    if (_.isNil(users)) {
        //do nothing
        callback();
        return;
    }
    if (_.isNil(permissions)) {
        //do nothing
        callback();
        return;
    }

    effectiveAccounts(context, function(err, accounts) {
        if (err) { callback(err); return; }

        var permEnabled = model.privileges.filter(function(x) { return !x.disabled; }, model.privileges).length>0;
        //get all enabled privileges
        var privileges = model.privileges.filter(function(x) { return !x.disabled && ((x.mask & requestMask) == requestMask) });
        if (privileges.length==0) {
            if (e.throwError) {
                //if the target model has privileges but it has no privileges with the requested mask
                if (permEnabled) {
                    //throw error
                    var error = new Error('Access denied.');
                    error.status = 401;
                    callback(error);
                }
                else {
                    //do nothing
                    callback(null);
                }
            }
            else {
                //set result to false (or true if model has no privileges at all)
                e.result = !permEnabled;
                //and exit
                callback(null);
            }
        }
        else {
            var cancel = false;
            e.result = false;
            //enumerate privileges
            async.eachSeries(privileges, function(item, cb) {
                if (cancel) {
                    cb(null);
                    return;
                }
                //global
                if (item.type=='global') {
                    if (typeof item.account !== 'undefined') {
                        //check if a privilege is assigned by the model
                        if (item.account==='*') {
                            //get permission and exit
                            cancel=true;
                            e.result = true;
                            return cb();
                        }
                        else if (item.hasOwnProperty("account")) {
                            if (accounts.findIndex(function(x) { return x.name === item.account })>=0) {
                                cancel=true;
                                e.result = true;
                                return cb();
                            }
                        }
                    }
                    //try to find user has global permissions assigned
                    permissions.where('privilege').equal(model.name).
                        and('parentPrivilege').equal(null).
                        and('target').equal('0').
                        and('workspace').equal(workspace).
                        and('account').in(accounts.map(function(x) { return x.id; })).
                        and('mask').bit(requestMask).silent().count(function(err, count) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                if (count>=1) {
                                    cancel=true;
                                    e.result = true;
                                }
                                cb(null);
                            }
                        });
                }
                else if (item.type=='parent') {
                    var mapping = model.inferMapping(item.property);
                    if (!mapping) {
                        cb(null);
                        return;
                    }
                    if (requestMask==PermissionMask.Create) {
                        permissions.where('privilege').equal(mapping.childModel).
                            and('parentPrivilege').equal(mapping.parentModel).
                            and('target').equal(e.target[mapping.childField]).
                            and('workspace').equal(workspace).
                            and('account').in(accounts.map(function(x) { return x.id; })).
                            and('mask').bit(requestMask).silent().count(function(err, count) {
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (count>=1) {
                                        cancel=true;
                                        e.result = true;
                                    }
                                    cb(null);
                                }
                            });
                    }
                    else {
                        //get original value
                        model.where(model.primaryKey).equal(e.target[model.primaryKey]).select(mapping.childField).first(function(err, result) {
                            if (err) {
                                cb(err);
                            }
                            else if (result) {
                                permissions.where('privilege').equal(mapping.childModel).
                                    and('parentPrivilege').equal(mapping.parentModel).
                                    and('target').equal(result[mapping.childField]).
                                    and('workspace').equal(workspace).
                                    and('account').in(accounts.map(function(x) { return x.id; })).
                                    and('mask').bit(requestMask).silent().count(function(err, count) {
                                        if (err) {
                                            cb(err);
                                        }
                                        else {
                                            if (count>=1) {
                                                cancel=true;
                                                e.result = true;
                                            }
                                            cb(null);
                                        }
                                    });
                            }
                            else {
                                cb(null);
                            }
                        });
                    }
                }
                else if (item.type=='item') {
                    //if target object is a new object
                    if (requestMask==PermissionMask.Create) {
                        //do nothing
                        cb(null); return;
                    }
                    permissions.where('privilege').equal(model.name).
                        and('parentPrivilege').equal(null).
                        and('target').equal(e.target[model.primaryKey]).
                        and('workspace').equal(workspace).
                        and('account').in(accounts.map(function(x) { return x.id; })).
                        and('mask').bit(requestMask).silent().count(function(err, count) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                if (count>=1) {
                                    cancel=true;
                                    e.result = true;
                                }
                                cb(null);
                            }
                        });
                }
                else if (item.type=='self') {
                    if (requestMask==PermissionMask.Create) {
                        var query = qry.query(model.viewAdapter);
                        var fields=[], field;
                        //cast target
                        var name, obj = e.target;
                        model.attributes.forEach(function(x) {
                            name = obj.hasOwnProperty(x.property) ? x.property : x.name;
                            if (obj.hasOwnProperty(name))
                            {
                                var mapping = model.inferMapping(name);
                                if (_.isNil(mapping)) {
                                    field = {};
                                    field[x.name] = { $value: obj[name] };
                                    fields.push(field);
                                }
                                else if ((mapping.associationType==='association') && (mapping.childModel===model.name)) {
                                    if (typeof obj[name] === 'object') {
                                        //set associated key value (e.g. primary key value)
                                        field = {};
                                        field[x.name] = { $value: obj[name][mapping.parentField] };
                                        fields.push(field);
                                    }
                                    else {
                                        //set raw value
                                        field = {};
                                        field[x.name] = { $value: obj[name] };
                                        fields.push(field);
                                    }
                                }
                            }
                        });
                        //add fields
                        query.select(fields);
                        //set fixed query
                        query.$fixed = true;
                        model.filter(item.filter, function(err, q) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                //set where from DataQueryable.query
                                query.$where = q.query.$prepared;
                                model.context.db.execute(query,null, function(err, result) {
                                    if (err) {
                                        cb(err);
                                    }
                                    else {
                                        if (result.length==1) {
                                            cancel=true;
                                            e.result = true;
                                        }
                                        cb(null);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        //get privilege filter
                        model.filter(item.filter, function(err, q) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                //prepare query and append primary key expression
                                q.where(model.primaryKey).equal(e.target[model.primaryKey]).silent().count(function(err, count) {
                                    if (err) { cb(err); return; }
                                    if (count>=1) {
                                        cancel=true;
                                        e.result = true;
                                    }
                                    cb(null);
                                })
                            }
                        });
                    }
                }
                else {
                    //do nothing (unknown permission)
                    cb(null);
                }

            }, function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    if (e.throwError && !e.result) {
                        var error = new types.AccessDeniedException();
                        error.model = model.name;
                        callback(error);
                    }
                    else {
                        callback(null);
                    }
                }
            });
        }

    });
};
/**
 * @private
 * @type {string}
 */
var ANONYMOUS_USER_CACHE_PATH = '/User/anonymous';
/**
 * @param {DataContext} context
 * @param {function(Error=,*=)} callback
 * @private
 */
function anonymousUser(context, callback) {
    queryUser(context, 'anonymous', function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, result || { id:0, name:'anonymous', groups:[], enabled:false});
        }
    });
};
/**
 *
 * @param {DataContext} context
 * @param {string} username
 * @param {function(Error=,*=)} callback
 * @private
 */
function queryUser(context, username, callback) {
    try {
        if (_.isNil(context)) {
            return callback();
        }
        else {
            //get user key
            var users = context.model('User');
            if (_.isNil(users)) {
                return callback();
            }
            users.where('name').equal(username).silent().select('id', 'name').first(function(err, result) {
                if (err) {
                    callback(err);
                }
                else {
                    //if anonymous user was not found
                    if (_.isNil(result)) {
                        return callback();
                    }
                    //get anonymous user object
                    var user = users.convert(result);
                    //get user groups
                    user.property('groups').select('id', 'name').silent().all(function(err, groups) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        //set anonymous user groups
                        user.groups = groups || [];
                        //return user
                        callback(null, user);
                    });
                }
            });
        }
    }
    catch (e) {
        callback(e);
    }
};
/**
 * @param {DataContext} context
 * @param {function(Error=,Array=)} callback
 * @private
 */
function effectiveAccounts(context, callback) {
    if (_.isNil(context)) {
        //push no account
        return callback(null, [ { id: 0 } ]);
    }
    /**
     * Gets or sets an object that represents the user of the current data context.
     * @property {*|{name: string, authenticationType: string}}
     * @name DataContext#user
     * @memberof DataContext
     */
    context.user = context.user || { name:'anonymous',authenticationType:'None' };
    context.user.name = context.user.name || 'anonymous';
    //if the current user is anonymous
    if (context.user.name === 'anonymous') {
        //get anonymous user data
        dataCache.current.ensure(ANONYMOUS_USER_CACHE_PATH, function(cb) {
            anonymousUser(context, function(err, result) {
                cb(err, result);
            });
        }, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                var arr = [];
                if (result) {
                    arr.push({ "id": result.id, "name": result.name });
                    result.groups = result.groups || [];
                    result.groups.forEach(function(x) { arr.push({ "id": x.id, "name": x.name }); });
                }
                if (arr.length==0)
                    arr.push({ id: 0 });
                callback(null, arr);
            }
        });
    }
    else {
        //try to get data from cache
        var USER_CACHE_PATH = '/User/' + context.user.name;
        dataCache.current.ensure(USER_CACHE_PATH, function(cb) {
            queryUser(context, context.user.name, cb);
        }, function(err, user) {
            if (err) { callback(err); return; }
            dataCache.current.ensure(ANONYMOUS_USER_CACHE_PATH, function(cb) {
                anonymousUser(context, cb);
            }, function(err, anonymous) {
                if (err) { callback(err); return; }
                var arr = [ ];
                if (user) {
                    arr.push({ "id": user.id, "name": user.name });
                    if (_.isArray(user.groups))
                        user.groups.forEach(function(x) { arr.push({ "id": x.id, "name": x.name }); });
                }
                if (anonymous) {
                    arr.push({ "id": anonymous.id, "name": "anonymous" });
                    if (_.isArray(anonymous.groups))
                        anonymous.groups.forEach(function(x) { arr.push({ "id": x.id, "name": x.name }); });
                }
                if (arr.length==0)
                    arr.push({ id: 0 });
                callback(null, arr);
            });
        });
    }
}

/**
 * Occurs before executing a data operation.
 * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
 */
DataPermissionEventListener.prototype.beforeExecute = function(e, callback)
{
    if (_.isNil(e.model)) {
        return callback();
    }
    //ensure silent query operation
    if (e.emitter && e.emitter.$silent) {
        callback();
        return;
    }
    var model= e.model, context = e.model.context, requestMask = 1, workspace = 1, privilege = model.name, parentPrivilege=null;
    //get privilege from event arguments if it's defined (e.g. the operation requests execute permission User.ChangePassword where
    // privilege=ChangePassword and parentPrivilege=User)
    if (e.privilege) {
        //event argument is the privilege
        privilege = e.privilege;
        //and model is the parent privilege
        parentPrivilege = model.name;
    }
    //do not check permissions if the target model has no privileges defined
    if (model.privileges.filter(function(x) { return !x.disabled; }, model.privileges).length==0) {
        callback(null);
        return;
    }
    //infer permission mask
    if (typeof e.mask !== 'undefined') {
        requestMask = e.mask;
    }
    else {
        if (e.query) {
            //infer mask from query type
            if (e.query.$select)
            //read permissions
                requestMask=1;
            else if (e.query.$insert)
            //create permissions
                requestMask=2;
            else if (e.query.$update)
            //update permissions
                requestMask=4;
            else if (e.query.$delete)
            //delete permissions
                requestMask=8;
        }
    }
    //ensure context user
    context.user = context.user || { name:'anonymous',authenticationType:'None' };
    //change: 2-May 2015
    //description: Use unattended execution account as an escape permission check account
    var authSettings = context.getConfiguration().getAuthSettings();
    if (authSettings)
    {
        var unattendedExecutionAccount=authSettings.unattendedExecutionAccount;
        if ((typeof unattendedExecutionAccount !== 'undefined'
            || unattendedExecutionAccount != null)
            && (unattendedExecutionAccount===context.user.name))
        {
            callback();
            return;
        }
    }
    if (e.query) {

        //get user key
        var users = context.model('User'), permissions = context.model('Permission');
        if (_.isNil(users)) {
            //do nothing
            callback(null);
            return;
        }
        if (_.isNil(permissions)) {
            //do nothing
            callback(null);
            return;
        }
        //get model privileges
        var modelPrivileges = model.privileges || [];
        //if model has no privileges defined
        if (modelPrivileges.length==0) {
            //do nothing
            callback(null);
            //and exit
            return;
        }
        //tuning up operation
        //validate request mask permissions against all users privilege { mask:<requestMask>,disabled:false,account:"*" }
        var allUsersPrivilege = modelPrivileges.find(function(x) {
            return (((x.mask & requestMask)==requestMask) && !x.disabled && (x.account==='*'));
        });
        if (typeof allUsersPrivilege !== 'undefined') {
            //do nothing
            callback(null);
            //and exit
            return;
        }

        effectiveAccounts(context, function(err, accounts) {
            if (err) { callback(err); return; }
            //get all enabled privileges
            var privileges = modelPrivileges.filter(function(x) {
                return !x.disabled && ((x.mask & requestMask) == requestMask);
            });

            var cancel = false, assigned = false, entity = qry.entity(model.viewAdapter), expand = null,
                perms1 = qry.entity(permissions.viewAdapter).as('p0'), expr = null;
            async.eachSeries(privileges, function(item, cb) {
                if (cancel) {
                    return cb();
                }
                try {
                    if (item.type=='global') {
                        //check if a privilege is assigned by the model
                        if (item.account==='*') {
                            //get permission and exit
                            assigned=true;
                            return cb(new EachSeriesCancelled());
                        }
                        else if (item.hasOwnProperty("account")) {
                            if (accounts.findIndex(function(x) { return x.name === item.account })>=0) {
                                assigned=true;
                                return cb(new EachSeriesCancelled());
                            }
                        }
                        //try to find user has global permissions assigned
                        permissions.where('privilege').equal(model.name).
                            and('parentPrivilege').equal(null).
                            and('target').equal('0').
                            and('workspace').equal(1).
                            and('account').in(accounts.map(function(x) { return x.id; })).
                            and('mask').bit(requestMask).silent().count(function(err, count) {
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (count>=1) {
                                        assigned=true;
                                        return cb(new EachSeriesCancelled());
                                    }
                                    cb();
                                }
                            });
                    }
                    else if (item.type=='parent') {
                        //get field mapping
                        var mapping = model.inferMapping(item.property);
                        if (!mapping) {
                            return cb();
                        }
                        if (expr==null)
                            expr = qry.query();
                        expr.where(entity.select(mapping.childField)).equal(perms1.select('target')).
                            and(perms1.select('privilege')).equal(mapping.childModel).
                            and(perms1.select('parentPrivilege')).equal(mapping.parentModel).
                            and(perms1.select('workspace')).equal(workspace).
                            and(perms1.select('mask')).bit(requestMask).
                            and(perms1.select('account')).in(accounts.map(function(x) { return x.id; })).prepare(true);
                        assigned=true;
                        cb();
                    }
                    else if (item.type=='item') {
                        if (expr==null)
                            expr = qry.query();
                        expr.where(entity.select(model.primaryKey)).equal(perms1.select('target')).
                            and(perms1.select('privilege')).equal(model.name).
                            and(perms1.select('parentPrivilege')).equal(null).
                            and(perms1.select('workspace')).equal(workspace).
                            and(perms1.select('mask')).bit(requestMask).
                            and(perms1.select('account')).in(accounts.map(function(x) { return x.id; })).prepare(true);
                        assigned=true;
                        cb();
                    }
                    else if (item.type=='self') {
                        if (typeof item.filter === 'string' ) {
                            model.filter(item.filter, function(err, q) {
                                if (err) {
                                    cb(err);
                                }
                                else {
                                    if (q.query.$prepared) {
                                        if (expr==null)
                                            expr = qry.query();
                                        expr.$where = q.query.$prepared;
                                        if (q.query.$expand) { expand = q.query.$expand; }
                                        expr.prepare(true);
                                        assigned=true;
                                        cb();
                                    }
                                    else
                                        cb();
                                }
                            });
                        }
                        else {
                            cb();
                        }
                    }
                    else {
                        cb();
                    }
                }
                catch (e) {
                    cb(e);
                }
            }, function(err) {
                if (err) {
                    cancel = (err instanceof EachSeriesCancelled);
                    if (!cancel) {
                        return callback(err);
                    }
                }
                if (!assigned) {
                    //prepare no access query
                    e.query.prepare();
                    //add no record parameter
                    e.query.where(e.model.fieldOf(e.model.primaryKey)).equal(null).prepare();
                    return callback();
                }
                else if (expr) {
                    return context.model("Permission").migrate(function(err) {
                        if (err) { return callback(err); }
                        var q = qry.query(model.viewAdapter).select([model.primaryKey]).distinct();
                        if (expand) {
                            q.join(expand[0].$entity).with(expand[0].$with);
                        }
                        q.join(perms1).with(expr);
                        var pqAlias = 'pq' + common.randomInt(100000,999999).toString();
                        e.query.join(q.as(pqAlias)).with(qry.where(entity.select(model.primaryKey)).equal(qry.entity(pqAlias).select(model.primaryKey)));
                        return callback();
                    });
                }
                return callback();

            });
        });

    }
    else {
        callback();
    }
};

var perms = {
    DataPermissionEventArgs:DataPermissionEventArgs,
    DataPermissionEventListener:DataPermissionEventListener,
    PermissionMask:PermissionMask
};

if (typeof exports !== 'undefined') {
    module.exports = perms;
}

