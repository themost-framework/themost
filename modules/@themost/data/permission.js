/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DataPermissionEventListener = exports.DataPermissionEventArgs = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _utils = require('@themost/common/utils');

var RandomUtils = _utils.RandomUtils;

var _errors = require('@themost/common/errors');

var AccessDeniedError = _errors.AccessDeniedError;

var _query = require('./node_modules/@themost/query/query');

var QueryExpression = _query.QueryExpression;

var _query2 = require('@themost/query/query');

var QueryEntity = _query2.QueryEntity;

var _cache = require('./cache');

var DataCache = _cache.DataCache;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @private
 * @ignore
 */
var EachSeriesCancelled = function EachSeriesCancelled() {
    _classCallCheck(this, EachSeriesCancelled);
};

/**
 * @class
 */
var DataPermissionEventArgs = exports.DataPermissionEventArgs = function DataPermissionEventArgs() {
    _classCallCheck(this, DataPermissionEventArgs);

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
};
/**
 * An enumeration of the available permission masks
 * @enum {number}
 */


var PermissionMask = {
    /**
     * Read Access Mask (1)
     */
    Read: 1,
    /**
     * Create Access Mask (2)
     */
    Create: 2,
    /**
     * Update Access Mask (4)
     */
    Update: 4,
    /**
     * Delete Access Mask (8)
     */
    Delete: 8,
    /**
     * Execute Access Mask (16)
     */
    Execute: 16,
    /**
     * Full Access Mask (31)
     */
    Owner: 31
};

/**
 * @class
 */

var DataPermissionEventListener = exports.DataPermissionEventListener = function () {
    function DataPermissionEventListener() {
        _classCallCheck(this, DataPermissionEventListener);
    }

    _createClass(DataPermissionEventListener, [{
        key: 'beforeSave',

        /**
         * Occurs before creating or updating a data object.
         * @param {DataEventArgs} e - An object that represents the event arguments passed to this operation.
         * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
         */
        value: function beforeSave(e, callback) {
            DataPermissionEventListener.prototype.validate(e, callback);
        }

        /**
         * Occurs before removing a data object.
         * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
         * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
         * @returns {DataEventListener}
         */

    }, {
        key: 'beforeRemove',
        value: function beforeRemove(event, callback) {
            DataPermissionEventListener.prototype.validate(event, callback);
        }

        /**
         * Validates permissions against the event arguments provided.
         * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
         * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
         */

    }, {
        key: 'validate',
        value: function validate(event, callback) {
            var model = event.model;
            var context = event.model.context;
            var requestMask = 1;
            var workspace = 1;
            //ensure silent operation
            if (event.model && event.model.$silent) {
                callback();
                return;
            }
            if (event.state == 0) requestMask = PermissionMask.Read;else if (event.state == 1) requestMask = PermissionMask.Create;else if (event.state == 2) requestMask = PermissionMask.Update;else if (event.state == 4) requestMask = PermissionMask.Delete;else if (event.state == 16) requestMask = PermissionMask.Execute;else {
                return callback(new Error('Target object has an invalid state.'));
            }
            //validate throwError
            if (typeof event.throwError === 'undefined') event.throwError = true;
            context.user = context.user || { name: 'anonymous', authenticationType: 'None' };
            //change: 2-May 2015
            //description: Use unattended execution account as an escape permission check account
            var authSettings = context.getConfiguration().getAuthSettings();
            if (authSettings) {
                var unattendedExecutionAccount = authSettings.unattendedExecutionAccount;
                if ((typeof unattendedExecutionAccount !== 'undefined' || unattendedExecutionAccount != null) && unattendedExecutionAccount === context.user.name) {
                    event.result = true;
                    return callback();
                }
            }
            //get user key
            var users = context.model('User'),
                permissions = context.model('Permission');
            if (_.isNil(users)) {
                //do nothing
                return callback();
            }
            if (_.isNil(permissions)) {
                //do nothing
                return callback();
            }

            effectiveAccounts(context, function (err, accounts) {
                if (err) {
                    callback(err);return;
                }

                var permEnabled = model.privileges.filter(function (x) {
                    return !x.disabled;
                }, model.privileges).length > 0;
                //get all enabled privileges
                var privileges = model.privileges.filter(function (x) {
                    return !x.disabled && (x.mask & requestMask) == requestMask;
                });
                if (privileges.length == 0) {
                    if (event.throwError) {
                        //if the target model has privileges but it has no privileges with the requested mask
                        if (permEnabled) {
                            //throw error
                            var error = new Error('Access denied.');
                            error.status = 401;
                            callback(error);
                        } else {
                            //do nothing
                            return callback();
                        }
                    } else {
                        //set result to false (or true if model has no privileges at all)
                        event.result = !permEnabled;
                        //and exit
                        return callback();
                    }
                } else {
                    (function () {
                        var cancel = false;
                        event.result = false;
                        //enumerate privileges
                        async.eachSeries(privileges, function (item, cb) {
                            if (cancel) {
                                cb(null);
                                return;
                            }
                            //global
                            if (item.type == 'global') {
                                if (typeof item.account !== 'undefined') {
                                    //check if a privilege is assigned by the model
                                    if (item.account === '*') {
                                        //get permission and exit
                                        cancel = true;
                                        event.result = true;
                                        return cb();
                                    } else if (item.hasOwnProperty("account")) {
                                        if (accounts.findIndex(function (x) {
                                            return x.name === item.account;
                                        }) >= 0) {
                                            cancel = true;
                                            event.result = true;
                                            return cb();
                                        }
                                    }
                                }
                                //try to find user has global permissions assigned
                                permissions.where('privilege').equal(model.name).and('parentPrivilege').equal(null).and('target').equal('0').and('workspace').equal(workspace).and('account').in(accounts.map(function (x) {
                                    return x.id;
                                })).and('mask').bit(requestMask).silent().count(function (err, count) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        if (count >= 1) {
                                            cancel = true;
                                            event.result = true;
                                        }
                                        cb(null);
                                    }
                                });
                            } else if (item.type == 'parent') {
                                var _ret2 = function () {
                                    var mapping = model.inferMapping(item.property);
                                    if (!mapping) {
                                        cb(null);
                                        return {
                                            v: void 0
                                        };
                                    }
                                    if (requestMask == PermissionMask.Create) {
                                        permissions.where('privilege').equal(mapping.childModel).and('parentPrivilege').equal(mapping.parentModel).and('target').equal(event.target[mapping.childField]).and('workspace').equal(workspace).and('account').in(accounts.map(function (x) {
                                            return x.id;
                                        })).and('mask').bit(requestMask).silent().count(function (err, count) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                if (count >= 1) {
                                                    cancel = true;
                                                    event.result = true;
                                                }
                                                cb(null);
                                            }
                                        });
                                    } else {
                                        //get original value
                                        model.where(model.primaryKey).equal(event.target[model.primaryKey]).select(mapping.childField).first(function (err, result) {
                                            if (err) {
                                                cb(err);
                                            } else if (result) {
                                                permissions.where('privilege').equal(mapping.childModel).and('parentPrivilege').equal(mapping.parentModel).and('target').equal(result[mapping.childField]).and('workspace').equal(workspace).and('account').in(accounts.map(function (x) {
                                                    return x.id;
                                                })).and('mask').bit(requestMask).silent().count(function (err, count) {
                                                    if (err) {
                                                        cb(err);
                                                    } else {
                                                        if (count >= 1) {
                                                            cancel = true;
                                                            event.result = true;
                                                        }
                                                        cb(null);
                                                    }
                                                });
                                            } else {
                                                cb(null);
                                            }
                                        });
                                    }
                                }();

                                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
                            } else if (item.type == 'item') {
                                //if target object is a new object
                                if (requestMask == PermissionMask.Create) {
                                    //do nothing
                                    cb(null);return;
                                }
                                permissions.where('privilege').equal(model.name).and('parentPrivilege').equal(null).and('target').equal(event.target[model.primaryKey]).and('workspace').equal(workspace).and('account').in(accounts.map(function (x) {
                                    return x.id;
                                })).and('mask').bit(requestMask).silent().count(function (err, count) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        if (count >= 1) {
                                            cancel = true;
                                            event.result = true;
                                        }
                                        cb(null);
                                    }
                                });
                            } else if (item.type == 'self') {
                                if (requestMask == PermissionMask.Create) {
                                    (function () {
                                        var query = QueryExpression.create(model.viewAdapter);
                                        var fields = [];
                                        var field = void 0;

                                        //cast target
                                        var name = void 0;

                                        var obj = event.target;
                                        model.attributes.forEach(function (x) {
                                            name = obj.hasOwnProperty(x.property) ? x.property : x.name;
                                            if (obj.hasOwnProperty(name)) {
                                                var mapping = model.inferMapping(name);
                                                if (_.isNil(mapping)) {
                                                    field = {};
                                                    field[x.name] = { $value: obj[name] };
                                                    fields.push(field);
                                                } else if (mapping.associationType === 'association' && mapping.childModel === model.name) {
                                                    if (_typeof(obj[name]) === 'object') {
                                                        //set associated key value (e.g. primary key value)
                                                        field = {};
                                                        field[x.name] = { $value: obj[name][mapping.parentField] };
                                                        fields.push(field);
                                                    } else {
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
                                        model.filter(item.filter, function (err, q) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                //set where from DataQueryable.query
                                                query.$where = q.query.$prepared;
                                                model.context.db.execute(query, null, function (err, result) {
                                                    if (err) {
                                                        cb(err);
                                                    } else {
                                                        if (result.length == 1) {
                                                            cancel = true;
                                                            event.result = true;
                                                        }
                                                        cb(null);
                                                    }
                                                });
                                            }
                                        });
                                    })();
                                } else {
                                    //get privilege filter
                                    model.filter(item.filter, function (err, q) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            //prepare query and append primary key expression
                                            q.where(model.primaryKey).equal(event.target[model.primaryKey]).silent().count(function (err, count) {
                                                if (err) {
                                                    cb(err);return;
                                                }
                                                if (count >= 1) {
                                                    cancel = true;
                                                    event.result = true;
                                                }
                                                cb(null);
                                            });
                                        }
                                    });
                                }
                            } else {
                                //do nothing (unknown permission)
                                cb(null);
                            }
                        }, function (err) {
                            if (err) {
                                callback(err);
                            } else {
                                if (event.throwError && !event.result) {
                                    var _error = new AccessDeniedError();
                                    _error.model = model.name;
                                    callback(_error);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    })();
                }
            });
        }

        /**
         * Occurs before executing a data operation.
         * @param {DataEventArgs} event - An object that represents the event arguments passed to this operation.
         * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
         */

    }, {
        key: 'beforeExecute',
        value: function beforeExecute(event, callback) {
            if (_.isNil(event.model)) {
                return callback();
            }
            //ensure silent query operation
            if (event.emitter && event.emitter.$silent) {
                return callback();
            }
            var model = event.model;
            var context = event.model.context;
            var requestMask = 1;
            var workspace = 1;
            var privilege = model.name;
            var parentPrivilege = null;
            //get privilege from event arguments if it's defined (e.g. the operation requests execute permission User.ChangePassword where
            // privilege=ChangePassword and parentPrivilege=User)
            if (event.privilege) {
                //event argument is the privilege
                privilege = event.privilege;
                //and model is the parent privilege
                parentPrivilege = model.name;
            }
            //do not check permissions if the target model has no privileges defined
            if (model.privileges.filter(function (x) {
                return !x.disabled;
            }, model.privileges).length == 0) {
                return callback();
            }
            //infer permission mask
            if (typeof event.mask !== 'undefined') {
                requestMask = event.mask;
            } else {
                if (event.query) {
                    //infer mask from query type
                    if (event.query.$select)
                        //read permissions
                        requestMask = 1;else if (event.query.$insert)
                        //create permissions
                        requestMask = 2;else if (event.query.$update)
                        //update permissions
                        requestMask = 4;else if (event.query.$delete)
                        //delete permissions
                        requestMask = 8;
                }
            }
            //ensure context user
            context.user = context.user || { name: 'anonymous', authenticationType: 'None' };
            //change: 2-May 2015
            //description: Use unattended execution account as an escape permission check account
            var authSettings = context.getConfiguration().getAuthSettings();
            if (authSettings) {
                var unattendedExecutionAccount = authSettings.unattendedExecutionAccount;
                if ((typeof unattendedExecutionAccount !== 'undefined' || unattendedExecutionAccount != null) && unattendedExecutionAccount === context.user.name) {
                    return callback();
                }
            }
            if (event.query) {
                var _ret4 = function () {

                    //get user key
                    var users = context.model('User'),
                        permissions = context.model('Permission');
                    if (_.isNil(users)) {
                        //do nothing
                        return {
                            v: callback()
                        };
                    }
                    if (_.isNil(permissions)) {
                        //do nothing
                        return {
                            v: callback()
                        };
                    }
                    //get model privileges
                    var modelPrivileges = model.privileges || [];
                    //if model has no privileges defined
                    if (modelPrivileges.length == 0) {
                        //do nothing
                        return {
                            v: callback()
                        };
                    }
                    //tuning up operation
                    //validate request mask permissions against all users privilege { mask:<requestMask>,disabled:false,account:"*" }
                    var allUsersPrivilege = modelPrivileges.find(function (x) {
                        return (x.mask & requestMask) == requestMask && !x.disabled && x.account === '*';
                    });
                    if (typeof allUsersPrivilege !== 'undefined') {
                        //do nothing
                        return {
                            v: callback()
                        };
                    }

                    effectiveAccounts(context, function (err, accounts) {
                        if (err) {
                            callback(err);return;
                        }
                        //get all enabled privileges
                        var privileges = modelPrivileges.filter(function (x) {
                            return !x.disabled && (x.mask & requestMask) == requestMask;
                        });

                        var cancel = false;
                        var assigned = false;
                        var entity = QueryEntity.create(model.viewAdapter);
                        var expand = null;
                        var perms1 = QueryEntity.create(permissions.viewAdapter).as('p0');
                        var expr = null;
                        async.eachSeries(privileges, function (item, cb) {
                            if (cancel) {
                                return cb();
                            }
                            try {
                                if (item.type == 'global') {
                                    //check if a privilege is assigned by the model
                                    if (item.account === '*') {
                                        //get permission and exit
                                        assigned = true;
                                        return cb(new EachSeriesCancelled());
                                    } else if (item.hasOwnProperty("account")) {
                                        if (accounts.findIndex(function (x) {
                                            return x.name === item.account;
                                        }) >= 0) {
                                            assigned = true;
                                            return cb(new EachSeriesCancelled());
                                        }
                                    }
                                    //try to find user has global permissions assigned
                                    permissions.where('privilege').equal(model.name).and('parentPrivilege').equal(null).and('target').equal('0').and('workspace').equal(1).and('account').in(accounts.map(function (x) {
                                        return x.id;
                                    })).and('mask').bit(requestMask).silent().count(function (err, count) {
                                        if (err) {
                                            cb(err);
                                        } else {
                                            if (count >= 1) {
                                                assigned = true;
                                                return cb(new EachSeriesCancelled());
                                            }
                                            cb();
                                        }
                                    });
                                } else if (item.type == 'parent') {
                                    //get field mapping
                                    var mapping = model.inferMapping(item.property);
                                    if (!mapping) {
                                        return cb();
                                    }
                                    if (expr == null) expr = QueryExpression.create();
                                    expr.where(entity.select(mapping.childField)).equal(perms1.select('target')).and(perms1.select('privilege')).equal(mapping.childModel).and(perms1.select('parentPrivilege')).equal(mapping.parentModel).and(perms1.select('workspace')).equal(workspace).and(perms1.select('mask')).bit(requestMask).and(perms1.select('account')).in(accounts.map(function (x) {
                                        return x.id;
                                    })).prepare(true);
                                    assigned = true;
                                    cb();
                                } else if (item.type == 'item') {
                                    if (expr == null) expr = QueryExpression.create();
                                    expr.where(entity.select(model.primaryKey)).equal(perms1.select('target')).and(perms1.select('privilege')).equal(model.name).and(perms1.select('parentPrivilege')).equal(null).and(perms1.select('workspace')).equal(workspace).and(perms1.select('mask')).bit(requestMask).and(perms1.select('account')).in(accounts.map(function (x) {
                                        return x.id;
                                    })).prepare(true);
                                    assigned = true;
                                    cb();
                                } else if (item.type == 'self') {
                                    if (typeof item.filter === 'string') {
                                        model.filter(item.filter, function (err, q) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                if (q.query.$prepared) {
                                                    if (expr == null) expr = QueryExpression.create();
                                                    expr.$where = q.query.$prepared;
                                                    if (q.query.$expand) {
                                                        expand = q.query.$expand;
                                                    }
                                                    expr.prepare(true);
                                                    assigned = true;
                                                    cb();
                                                } else cb();
                                            }
                                        });
                                    } else {
                                        cb();
                                    }
                                } else {
                                    cb();
                                }
                            } catch (err) {
                                cb(err);
                            }
                        }, function (err) {
                            if (err) {
                                cancel = err instanceof EachSeriesCancelled;
                                if (!cancel) {
                                    return callback(err);
                                }
                            }
                            if (!assigned) {
                                //prepare no access query
                                event.query.prepare();
                                //add no record parameter
                                event.query.where(event.model.resolveField(event.model.primaryKey)).equal(null).prepare();
                                return callback();
                            } else if (expr) {
                                return context.model("Permission").migrate(function (err) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    var q = QueryExpression.create(model.viewAdapter).select(model.primaryKey).distinct();
                                    if (expand) {
                                        q.join(expand[0].$entity).with(expand[0].$with);
                                    }
                                    q.join(perms1).with(expr);
                                    var pqAlias = 'pq' + RandomUtils.randomInt(100000, 999999).toString();
                                    event.query.join(q.as(pqAlias)).with(QueryExpression.create().where(entity.select(model.primaryKey)).equal(QueryEntity.entity(pqAlias).select(model.primaryKey)));
                                    return callback();
                                });
                            }
                            return callback();
                        });
                    });
                }();

                if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
            } else {
                callback();
            }
        }
    }]);

    return DataPermissionEventListener;
}();

/**
 * @private
 * @type {string}
 */


var ANONYMOUS_USER_CACHE_PATH = '/User/anonymous';
/**
 * @param {DataContext} context
 * @param {Function} callback
 * @private
 */
function anonymousUser(context, callback) {
    queryUser(context, 'anonymous', function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result || { id: 0, name: 'anonymous', groups: [], enabled: false });
        }
    });
}
/**
 *
 * @param {DataContext} context
 * @param {string} username
 * @param {Function} callback
 * @private
 */
function queryUser(context, username, callback) {
    try {
        if (_.isNil(context)) {
            return callback();
        } else {
            var _ret5 = function () {
                //get user key
                var users = context.model('User');
                if (_.isNil(users)) {
                    return {
                        v: callback()
                    };
                }
                users.where('name').equal(username).silent().select('id', 'name').first(function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        var _ret6 = function () {
                            //if anonymous user was not found
                            if (_.isNil(result)) {
                                return {
                                    v: callback()
                                };
                            }
                            //get anonymous user object
                            var user = users.convert(result);
                            //get user groups
                            user.property('groups').select('id', 'name').silent().all(function (err, groups) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                //set anonymous user groups
                                user.groups = groups || [];
                                //return user
                                callback(null, user);
                            });
                        }();

                        if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
                    }
                });
            }();

            if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
        }
    } catch (e) {
        callback(e);
    }
}
/**
 * @param {DataContext} context
 * @param {function(Error=,Array=)} callback
 * @private
 */
function effectiveAccounts(context, callback) {
    if (_.isNil(context)) {
        //push no account
        return callback(null, [{ id: 0 }]);
    }
    /**
     * Gets or sets an object that represents the user of the current data context.
     * @property {*|{name: string, authenticationType: string}}
     * @name DataContext#user
     * @memberof DataContext
     */
    context.user = context.user || { name: 'anonymous', authenticationType: 'None' };
    context.user.name = context.user.name || 'anonymous';
    //if the current user is anonymous
    if (context.user.name === 'anonymous') {
        //get anonymous user data
        return DataCache.getCurrent().getOrDefault('/User/anonymous', function (cb) {
            anonymousUser(context, function (err, result) {
                cb(err, result);
            });
        }).subscribe(function (result) {
            var arr = [];
            if (result) {
                arr.push({ "id": result.id, "name": result.name });
                result.groups = result.groups || [];
                result.groups.forEach(function (x) {
                    arr.push({ "id": x.id, "name": x.name });
                });
            }
            if (arr.length == 0) arr.push({ id: 0 });
            return callback(null, arr);
        }, function (err) {
            return callback(err);
        });
    } else {
        return DataCache.getCurrent().getOrDefault('/User/{context.user.name}', function (cb) {
            queryUser(context, context.user.name, cb);
        }).subscribe(function (user) {
            DataCache.getCurrent().getOrDefault('/User/anonymous', function (cb) {
                anonymousUser(context, cb);
            }).subscribe(function (anonymous) {
                var arr = [];
                if (user) {
                    arr.push({ "id": user.id, "name": user.name });
                    if (_.isArray(user.groups)) user.groups.forEach(function (x) {
                        arr.push({ "id": x.id, "name": x.name });
                    });
                }
                if (anonymous) {
                    arr.push({ "id": anonymous.id, "name": "anonymous" });
                    if (_.isArray(anonymous.groups)) anonymous.groups.forEach(function (x) {
                        arr.push({ "id": x.id, "name": x.name });
                    });
                }
                if (arr.length == 0) arr.push({ id: 0 });
                callback(null, arr);
            }, function (err) {
                return callback(err);
            });
        }, function (err) {
            return callback(err);
        });
    }
}
//# sourceMappingURL=permission.js.map
