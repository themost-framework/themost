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
exports.DataObject = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _emitter = require('@themost/common/emitter');

var SequentialEventEmitter = _emitter.SequentialEventEmitter;

var _errors = require('@themost/common/errors');

var DataError = _errors.DataError;

var _associations = require('./associations');

var HasManyToOneAssociation = _associations.HasManyToOneAssociation;
var HasOneToManyAssociation = _associations.HasOneToManyAssociation;
var HasManyToManyAssociation = _associations.HasManyToManyAssociation;
var HasTagAssociation = _associations.HasTagAssociation;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @ignore
 */
var STR_MISSING_CALLBACK_ARGUMENT = 'Missing argument. Callback function expected.',
    STR_MISSING_ARGUMENT_CODE = 'EARGM';

var typeProperty = Symbol('type');
var modelProperty = Symbol('model');
var contextProperty = Symbol('context');
var selectorsProperty = Symbol('selectors');

/**
 * @class
 * @classdesc Represents a data object associated with a data model.
 * DataObject class may be inherited by other classes that are defined as DataObjectClass of a data model.
 * @augments SequentialEventEmitter
 * @property {DataContext}  context - An instance of DataContext class associated with this object.
 * @property {*} selectors - An object that represents a collection of selectors associated with this data object e.g is(':new'), is(':valid'), is(':enabled') etc
 */

var DataObject = function (_SequentialEventEmitt) {
    _inherits(DataObject, _SequentialEventEmitt);

    /**
     *
     * @param {string=} type
     * @param {*=} obj
     */
    function DataObject(type, obj) {
        _classCallCheck(this, DataObject);

        //initialize object type
        var _this = _possibleConstructorReturn(this, (DataObject.__proto__ || Object.getPrototypeOf(DataObject)).call(this));

        if (type) _this[typeProperty] = type;else {
            //get type from constructor name
            if (/Model$/.test(_this.constructor.name)) {
                _this[typeProperty] = _this.constructor.name.replace(/Model$/, '');
            } else {
                if (_this.constructor.name !== 'DataObject') _this[typeProperty] = _this.constructor.name;
            }
        }
        _this[selectorsProperty] = {};

        _this.selector('new', function (callback) {
            if (typeof callback !== 'function') {
                return new Error(STR_MISSING_CALLBACK_ARGUMENT, STR_MISSING_ARGUMENT_CODE);
            }
            var self = this,
                model = self.getModel();
            model.inferState(self, function (err, state) {
                if (err) {
                    return callback(err);
                }
                callback(null, state == 1);
            });
        }).selector('live', function (callback) {
            if (typeof callback !== 'function') {
                return new Error(STR_MISSING_CALLBACK_ARGUMENT, STR_MISSING_ARGUMENT_CODE);
            }
            var self = this,
                model = self.getModel();
            model.inferState(self, function (err, state) {
                if (err) {
                    return callback(err);
                }
                callback(null, state == 2);
            });
        });

        if (typeof obj !== 'undefined' && obj != null) {
            _.assign(_this, obj);
        }

        return _this;
    }

    /**
     * Gets the identifier of this DataObject instance.
     * @returns {*}
     */


    _createClass(DataObject, [{
        key: 'getId',
        value: function getId() {
            var model = this.getModel();
            if (_.isNil(model)) {
                return this['id'];
            }
            return this[model.getPrimaryKey()];
        }

        /**
         * @returns {DataContext|*}
         */

    }, {
        key: 'getContext',


        /**
         * Gets the current context
         * @returns {DataContext|*}
         */
        value: function getContext() {
            return this[contextProperty];
        }

        /**
         * Gets the object type, typically the name of the parent model
         * @returns {*}
         */

    }, {
        key: 'getType',
        value: function getType() {
            return this[typeProperty];
        }

        /**
         * Registers a selector for the current data object
         * @param {string} name
         * @param {function=} selector
         * @example
         //retrieve a user, register a selector for enabled and check if user is enabled or not
         var users = context.model('User');
         users.where('name').equal('admin@example.com')
         .first().then(function(result) {
                var user = users.convert(result);
                //register a selector to check whether a user is enabled or not
                user.selector('enabled', function(callback) {
                    this.getModel().where('id').equal(this.id).select('enabled').value(callback);
                });
                user.is(":enabled").then(function(result) {
                    if (result) {
                        console.log('User is enabled');
                    }
                    done();
                }).catch(function(err) {
                    done(null, err);
                });
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'selector',
        value: function selector(name, _selector) {
            if (typeof name !== 'string') {
                return new Error('Invalid argument. String expected.', 'EARG');
            }
            if (typeof _selector === 'undefined') {
                return this[selectorsProperty][name];
            }
            //get arguments
            this[selectorsProperty][name] = _selector;
            return this;
        }

        /**
         * Executes a selector and returns the result. DataObject class has default selectors for common operations.
         * The ":new" selector checks whether current data object is new or not. The ":live" selector checks whether current data object already exists or not.
         * @param {string} selector - A string that represents an already registered selector
         * @returns {Promise<T>|*}
         * @example
         //retrieve a user, and execute :live selector
         var users = context.model('User');
         users.where('name').equal('admin@example.com')
         .first().then(function(result) {
                var user = users.convert(result);
                user.is(":live").then(function(result) {
                    if (result) {
                        console.log('User already exists');
                    }
                    done();
                }).catch(function(err) {
                    done(null, err);
                });
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'is',
        value: function is(selector) {
            if (!/^:\w+$/.test(selector)) {
                throw new Error('Invalid selector. A valid selector should always start with : e.g. :new or :live.');
            }
            /**
             * @type {Function}
             */
            var selectorFunc = this[selectorsProperty][selector.substr(1)];
            if (typeof selectorFunc !== 'function') {
                throw new Error('The specified selector is no associated with this object.', 'EUNDEF');
            }
            var Q = require('q'),
                deferred = Q.defer();
            selectorFunc.call(this, function (err, result) {
                if (err) {
                    return deferred.reject(err);
                }
                deferred.resolve(result);
            });
            return deferred.promise;
        }

        /**
         * Gets the associated data model
         * @returns {DataModel|undefined}
         */

    }, {
        key: 'getModel',
        value: function getModel() {
            if (_.isNil(this.getType())) return;
            if (this[modelProperty]) {
                return this[modelProperty];
            }
            if (this.getContext()) {
                this[modelProperty] = this.getContext().model(this.getType());
            }
            return this[modelProperty];
        }

        /**
         * @param name
         * @returns {DataObject}
         * @deprecated
         * @ignore
         */

    }, {
        key: 'removeProperty',
        value: function removeProperty(name) {
            var model = this.getModel(),
                field = model.field(name);
            if (_.isNil(field)) {
                var er = new Error('The specified field cannot be found.');er.code = 'EDATA';
                throw er;
            }
            //safe delete property
            delete this[name];
            return this;
        }

        /**
         * @param {String} name The relation name
         * @returns {DataQueryable|HasAssociation|{value:Function}}
         */

    }, {
        key: 'property',
        value: function property(name) {
            if (typeof name !== 'string') return null;
            var self = this;
            var er = void 0;
            //validate relation based on the given name
            var model = self.getModel(),
                field = model.field(name);
            if (_.isNil(field)) {
                er = new Error('The specified field cannot be found.');er.code = 'EDATA';
                throw er;
            }
            var mapping = model.inferMapping(field.name);
            if (_.isNil(mapping)) {
                //return queryable field value
                return {
                    value: function value(callback) {
                        //if object has already an attribute with this name
                        if (self.hasOwnProperty(name)) {
                            //return attribute
                            return callback(null, self[name]);
                        } else {
                            //otherwise get attribute value
                            if (self.hasOwnProperty(model.primaryKey)) {
                                model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).value(function (err, value) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    callback(null, value);
                                });
                            } else {
                                model.inferState(self, function (err, state) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    if (state == 2) {
                                        model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).value(function (err, value) {
                                            if (err) {
                                                return callback(err);
                                            }
                                            callback(null, value);
                                        });
                                    } else {
                                        er = new Error('Object identity cannot be found due to missing primary key or unique constraint filter.');er.code = 'EDATA';
                                        callback(er);
                                    }
                                });
                            }
                        }
                    }
                };
            }
            //validate field association
            if (mapping.associationType == 'association') {
                if (mapping.parentModel == model.name) return new HasOneToManyAssociation(self, mapping);else return new HasManyToOneAssociation(self, mapping);
            } else if (mapping.associationType == 'junction') {
                if (mapping.parentModel === model.name) {
                    if (typeof mapping.childModel === 'undefined') {
                        return new HasTagAssociation(self, mapping);
                    } else {
                        return new HasManyToManyAssociation(self, mapping);
                    }
                } else {
                    return new HasManyToManyAssociation(self, mapping);
                }
            } else {
                er = new Error('The association which is specified for the given field is not implemented.');er.code = 'EDATA';
                throw er;
            }
        }

        /**
         * Gets the value of the specified attribute.
         * If the object has already a property with the specified name and the property does not have
         * an association mapping then returns the property value.
         * Otherwise if attribute has an association mapping (it defines an association with another model) then
         * returns the foreign key value
         *
         * @param {string} name - The name of the attribute to retrieve
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
         * @returns {Promise<T>|*} If callback is missing then returns a promise.
         */

    }, {
        key: 'attrOf',
        value: function attrOf(name, callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    attrOf_.call(self, name, function (err, result) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(result);
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } else {
                return attrOf_.call(self, name, callback);
            }
        }

        /**
         * @param {String} name
         * @param {Function} callback
         */

    }, {
        key: 'attr',
        value: function attr(name, callback) {
            var _this2 = this;

            if (this.hasOwnProperty(name)) {
                callback(null, this[name]);
            } else {
                (function () {
                    var self = _this2,
                        model = self.getModel(),
                        field = model.field(name);
                    if (field) {
                        var mapping = model.inferMapping(field.name);
                        if (_.isNil(mapping)) {
                            if (self[model.primaryKey]) {
                                model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).first(function (err, result) {
                                    if (err) {
                                        callback(err);return;
                                    }
                                    var value = null;
                                    if (result) {
                                        value = result[name];
                                    }
                                    self[name] = value;
                                    callback(null, value);
                                });
                            } else {
                                if (model.constraints.length == 0) {
                                    callback(new Error(sprintf.sprintf('The value of property [%s] cannot be retrieved. The target data model has no constraints defined.', name)));
                                } else {
                                    var arr = _.filter(model.constraints, function (x) {
                                        var valid = true;
                                        if (x.fields.length == 0) return false;
                                        for (var i = 0; i < x.fields.length; i++) {
                                            var _field = x.fields[i];
                                            if (self.hasOwnProperty(_field) == false) {
                                                valid = false;
                                                break;
                                            }
                                        }
                                        return valid;
                                    });
                                    if (arr.length == 0) {
                                        callback(new Error(sprintf.sprintf('The value of property [%s] cannot be retrieved. The target data model has constraints but the required properties are missing.', name)));
                                    } else {
                                        //get first constraint
                                        var constraint = arr[0];

                                        var q = null;
                                        for (var i = 0; i < constraint.fields.length; i++) {
                                            var attr = constraint.fields[i];
                                            var value = self[attr];
                                            if (q == null) q = model.where(attr).equal(value);else q.and(attr).equal(value);
                                        }
                                        q.select(name).first(function (err, result) {
                                            if (err) {
                                                callback(err);return;
                                            }
                                            var value = null;
                                            if (result) {
                                                value = result[name];
                                            }
                                            self[name] = value;
                                            callback(null, value);
                                        });
                                    }
                                }
                            }
                        } else {
                            callback(null, self.property(name));
                        }
                    } else {
                        callback(new Error('The specified field cannot be found.'));
                    }
                })();
            }
        }

        /**
         *
         * @param {DataContext} context The current data context
         * @param {Function} fn - A function that represents the code to be invoked
         * @ignore
         */

    }, {
        key: 'execute',
        value: function execute(context, fn) {
            var self = this;
            self.context = context;
            fn = fn || function () {};
            fn.call(self);
        }

        /**
         * Gets a DataQueryable object that is going to be used in order to get related items.
         * @param attr {string} A string that contains the relation attribute
         * @returns {DataQueryable}
         */

    }, {
        key: 'query',
        value: function query(attr) {
            var mapping = this.getModel().inferMapping(attr);
            if (_.isNil(mapping)) {
                new DataError('EASSOCIATION', 'The given attribute does not define an association of any type.');
            }
            return this.property(attr);
        }

        /**
         * Saves the current data object.
         * @param {DataContext=}  context - The current data context.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         * @example
         //retrieve an order and change paymentDue date
         var orders = context.model('Order');
         orders.where('id').equal(46)
         .first().then(function(result) {
                var order = orders.convert(result);
                order.paymentDue = moment().add(7, 'days').toDate();
                order.save().then(function() {
                    done(null, order);
                }).catch(function(err) {
                    done(err);
                });
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'save',
        value: function save(context, callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret3 = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    save_.call(self, context || self.context, function (err) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve(null);
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
            } else {
                return save_.call(self, context || self.context, callback);
            }
        }

        /**
         * Deletes the current data object.
         * @param {DataContext=} context - The current data context.
         * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
         * @returns {Promise<T>|*} - If callback parameter is missing then returns a Promise object.
         * @example
         //retrieve a order, and remove it
         var orders = context.model('Order');
         orders.where('id').equal(4)
         .first().then(function(result) {
                var order = orders.convert(result);
                order.remove().then(function() {
                    done();
                }).catch(function(err) {
                    done(err);
                });
            }).catch(function(err) {
                done(err);
            });
         */

    }, {
        key: 'remove',
        value: function remove(context, callback) {
            var self = this;
            if (typeof callback !== 'function') {
                var _ret4 = function () {
                    var Q = require('q'),
                        deferred = Q.defer();
                    remove_.call(self, context || self.context, function (err) {
                        if (err) {
                            return deferred.reject(err);
                        }
                        deferred.resolve();
                    });
                    return {
                        v: deferred.promise
                    };
                }();

                if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
            } else {
                return remove_.call(self, context || self.context, callback);
            }
        }

        /*
         * Gets an instance of a DataModel class which represents the additional model that has been set in additionalType attribute of this data object.
         * @returns {Promise<DataModel>}
         */

    }, {
        key: 'getAdditionalModel',
        value: function getAdditionalModel() {
            var self = this;
            var Q = require('q'),
                deferred = Q.defer();
            process.nextTick(function () {
                try {
                    var _ret5 = function () {
                        var model = self.getModel();
                        var attr = self.getModel().attributes.find(function (x) {
                            return x.name === "additionalType";
                        });
                        if (typeof attr === 'undefined') {
                            return {
                                v: deferred.resolve()
                            };
                        }
                        var attrName = attr.property || attr.name;
                        self.attr(attrName, function (err, additionalType) {
                            try {
                                if (err) {
                                    return deferred.reject(err);
                                }
                                //if additional type is undefined
                                if (_.isNil(additionalType)) {
                                    //return nothing
                                    return deferred.resolve();
                                }
                                //if additional type is equal to current model
                                if (additionalType === model.name) {
                                    //return nothing
                                    return deferred.resolve(model);
                                }
                                return deferred.resolve(self.context.model(additionalType));
                            } catch (e) {
                                return deferred.reject(e);
                            }
                        });
                    }();

                    if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
                } catch (e) {
                    return deferred.reject(e);
                }
            });
            return deferred.promise;
        }

        /**
         * Gets an instance of data object which represents the additional typed object as this is defined in additionalType attribute.
         * @returns {Promise<DataObject>}
         * @example
         //get a place and afterwards get the country associated with it
         var places = context.model("Place");
         places.silent().where("name").equal("France").first().then(function(result) {
            if (result) {
                var place = places.convert(result);
                return place.getAdditionalObject().then(function(result) {
                    //place your code here
                    return done();
                });
            }
            return done();
        }).catch(function (err) {
            return done(err);
        });
         */

    }, {
        key: 'getAdditionalObject',
        value: function getAdditionalObject() {
            var self = this;
            var Q = require('q'),
                deferred = Q.defer();
            process.nextTick(function () {
                try {
                    self.getAdditionalModel().then(function (additionalModel) {
                        try {
                            if (_.isNil(additionalModel)) {
                                return deferred.resolve();
                            }
                            //if additional type is equal to current model
                            if (additionalModel.name === self.getModel().name) {
                                //return nothing
                                return deferred.resolve();
                            }
                            if (self.getModel().$silent) {
                                additionalModel.silent();
                            }
                            additionalModel.where(self.getModel().getPrimaryKey()).equal(self.getId()).first().then(function (result) {
                                if (result) {
                                    return deferred.resolve(additionalModel.convert(result));
                                }
                                return deferred.resolve();
                            }).catch(function (err) {
                                return deferred.reject(err);
                            });
                        } catch (e) {
                            return deferred.reject(e);
                        }
                    }).catch(function (err) {
                        return deferred.reject(err);
                    });
                } catch (e) {
                    return deferred.reject(e);
                }
            });
            return deferred.promise;
        }

        /**
         * Sets a boolean which indicates whether the next data operation will be executed in silent mode.
         * @param {boolean=} value
         * @returns DataObject
         * @example
         context.model("Person").where("email").equal("alexis.rees@example.com").getTypedItem()
                .then(function(person) {
                    //...
                    return person.silent().save().then(function() {
                        return done();
                    });
                }).catch(function(err) {
                    return done(err);
                });
         */

    }, {
        key: 'silent',
        value: function silent(value) {
            this.getModel().silent(value);
            return this;
        }
    }, {
        key: 'context',
        get: function get() {
            return this[contextProperty];
        }

        /**
         * 
         * @param {DataContext|*} value
         */
        ,
        set: function set(value) {
            this[contextProperty] = value;
        }
    }]);

    return DataObject;
}(SequentialEventEmitter);

/**
 * @memberOf DataObject
 * @function
 * @param {string} name - The name of the attribute
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 * @private
 */


exports.DataObject = DataObject;
function attrOf_(name, callback) {
    var self = this,
        model = this.getModel(),
        mapping = model.inferMapping(name);
    if (_.isNil(mapping)) {
        if (self.hasOwnProperty(name)) {
            return callback(null, self[name]);
        } else {
            return model.where(model.primaryKey).equal(self[model.primaryKey]).select(name).value(function (err, result) {
                if (err) {
                    return callback(err);
                }
                self[name] = result;
                return callback(null, result);
            });
        }
    }
    //if mapping association defines foreign key association
    if (mapping.associationType === 'association' && mapping.childModel === model.name) {
        //if object has already this property
        if (self.hasOwnProperty(name)) {
            //if property is an object
            if (_typeof(self[name]) === 'object' && self[name] != null) {
                //return the defined parent field
                callback(null, self[name][mapping.parentField]);
            } else if (self[name] == null) {
                callback();
            } else {
                callback(null, self[name]);
            }
        } else {
            //otherwise get value from db
            model.where(model.primaryKey).equal(this[model.primaryKey]).select(mapping.childField).flatten().value(function (err, result) {
                if (err) {
                    return callback(err);
                }
                self[name] = result;
                return callback(null, result);
            });
        }
    } else {
        return callback();
    }
}

/**
 * @memberOf DataObject
 * @function
 * @param {DataContext} context - The underlying data context
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 * @private
 */
function save_(context, callback) {
    var self = this;
    //get current application
    var model = self.getModel();
    if (_.isNil(model)) {
        return callback.call(self, new DataError('EMODEL', 'Data model cannot be found.'));
    }
    var i = void 0;
    //register before listeners
    var beforeListeners = self.listeners('before.save');
    for (i = 0; i < beforeListeners.length; i++) {
        var beforeListener = beforeListeners[i];
        model.once('before.save', beforeListener);
    }
    //register after listeners
    var afterListeners = self.listeners('after.save');
    for (i = 0; i < afterListeners.length; i++) {
        var afterListener = afterListeners[i];
        model.once('after.save', afterListener);
    }
    model.save(self, callback);
}

/**
 * @memberOf DataObject
 * @function
 * @param {DataContext} context
 * @param {Function} callback
 * @private
 */
function remove_(context, callback) {
    var self = this;
    //get current application
    var model = self.getModel();
    if (_.isNil(model)) {
        return callback.call(self, new DataError('EMODEL', 'Data model cannot be found.'));
    }
    //register before listeners
    var beforeListeners = self.listeners('before.remove');
    for (var i = 0; i < beforeListeners.length; i++) {
        var beforeListener = beforeListeners[i];
        model.once('before.remove', beforeListener);
    }
    //register after listeners
    var afterListeners = self.listeners('after.remove');
    for (var j = 0; j < afterListeners.length; j++) {
        var afterListener = afterListeners[j];
        model.once('after.remove', afterListener);
    }
    model.remove(self, callback);
}
//# sourceMappingURL=object.js.map
