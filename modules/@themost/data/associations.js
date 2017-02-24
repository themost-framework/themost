'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DataObjectAssociationListener = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _types = require('./types');

var ParserUtils = _types.ParserUtils;

var _lodash = require('lodash');

var _ = _lodash._;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 */
var DataObjectAssociationListener = exports.DataObjectAssociationListener = function () {
    function DataObjectAssociationListener() {
        _classCallCheck(this, DataObjectAssociationListener);
    }

    _createClass(DataObjectAssociationListener, [{
        key: 'beforeSave',

        /**
         *
         * @param {DataEventArgs} e
         * @param {function(Error=)} callback
         */
        value: function beforeSave(e, callback) {
            try {
                if (_.isNil(e.target)) {
                    return callback();
                } else {
                    (function () {
                        var keys = Object.keys(e.target);
                        var mappings = [];
                        keys.forEach(function (x) {
                            if (e.target.hasOwnProperty(x) && _typeof(e.target[x]) === 'object' && e.target[x] != null) {
                                //try to find field mapping, if any
                                var mapping = e.model.inferMapping(x);
                                if (mapping && mapping.associationType === 'association' && mapping.childModel === e.model.name) mappings.push(mapping);
                            }
                        });
                        async.eachSeries(mappings,
                        /**
                         * @param {DataAssociationMapping} mapping
                         * @param {function(Error=)} cb
                         */
                        function (mapping, cb) {
                            if (mapping.associationType === 'association' && mapping.childModel === e.model.name) {
                                var _ret2 = function () {
                                    /**
                                     * @type {DataField|*}
                                     */
                                    var field = e.model.field(mapping.childField),
                                        childField = field.property || field.name;
                                    //foreign key association
                                    if (_typeof(e.target[childField]) !== 'object') {
                                        return {
                                            v: cb()
                                        };
                                    }
                                    if (e.target[childField].hasOwnProperty(mapping.parentField)) {
                                        return {
                                            v: cb()
                                        };
                                    }
                                    //change:21-Mar 2016
                                    //description: check if association belongs to this model or it's inherited from any base model
                                    //if current association belongs to base model
                                    if (e.model.name !== field.model && !ParserUtils.parseBoolean(field.cloned)) {
                                        //do nothing and exit
                                        return {
                                            v: cb()
                                        };
                                    }

                                    //get associated mode
                                    var associatedModel = e.model.context.model(mapping.parentModel);

                                    var er = void 0;
                                    associatedModel.find(e.target[childField]).select(mapping.parentField).silent().flatten().take(1).list(function (err, result) {
                                        if (err) {
                                            cb(err);
                                        } else if (_.isNil(result)) {
                                            er = new Error('An associated object cannot be found.');er.code = 'EDATA';er.model = associatedModel.name;
                                            cb(er);
                                        } else if (result.total == 0) {
                                            er = new Error('An associated object cannot be found.');er.code = 'EDATA';er.model = associatedModel.name;
                                            cb(er);
                                        } else if (result.total > 1) {
                                            er = new Error('An associated object is defined more than once and cannot be bound.');er.code = 'EDATA';er.model = associatedModel.name;
                                            cb(er);
                                        } else {
                                            e.target[childField][mapping.parentField] = result.records[0][mapping.parentField];
                                            cb();
                                        }
                                    });
                                }();

                                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
                            } else {
                                cb();
                            }
                        }, function (err) {
                            callback(err);
                        });
                    })();
                }
            } catch (e) {
                callback(e);
            }
        }

        /**
         *
         * @param {DataEventArgs} event
         * @param {function(Error=)} callback
         */

    }, {
        key: 'afterSave',
        value: function afterSave(event, callback) {
            try {
                if (typeof event.target === 'undefined' || event.target == null) {
                    callback(null);
                } else {
                    (function () {
                        var keys = Object.keys(event.target);
                        var mappings = [];
                        keys.forEach(function (x) {
                            if (event.target.hasOwnProperty(x)) {
                                /**
                                 * @type DataAssociationMapping
                                 */
                                var mapping = event.model.inferMapping(x);
                                if (mapping) if (mapping.associationType == 'junction') {
                                    mappings.push({ name: x, mapping: mapping });
                                }
                            }
                        });
                        async.eachSeries(mappings,
                        /**
                         * @param {{name:string,mapping:DataAssociationMapping}} x
                         * @param {function(Error=)} cb
                         */
                        function (x, cb) {
                            if (x.mapping.associationType == 'junction') {
                                var _ret4 = function () {
                                    var obj = event.model.convert(event.target);

                                    /**
                                     * @type {*|{deleted:Array}}
                                     */
                                    var childs = obj[x.name];

                                    var junction = void 0;
                                    if (!_.isArray(childs)) {
                                        return {
                                            v: cb()
                                        };
                                    }
                                    if (x.mapping.childModel === event.model.name) {
                                        var HasParentJunction = require('./has-parent-junction').HasParentJunction;
                                        junction = new HasParentJunction(obj, x.mapping);
                                        if (event.model.$silent) {
                                            junction.getBaseModel().silent();
                                        }
                                        if (event.state == 1 || event.state == 2) {
                                            (function () {
                                                var toBeRemoved = [],
                                                    toBeInserted = [];
                                                _.forEach(childs, function (x) {
                                                    if (x.$state == 4) {
                                                        toBeRemoved.push(x);
                                                    } else {
                                                        toBeInserted.push(x);
                                                    }
                                                });
                                                junction.insert(toBeInserted, function (err) {
                                                    if (err) {
                                                        return cb(err);
                                                    }
                                                    junction.remove(toBeRemoved, function (err) {
                                                        if (err) {
                                                            return cb(err);
                                                        }
                                                        return cb();
                                                    });
                                                });
                                            })();
                                        } else {
                                            return {
                                                v: cb()
                                            };
                                        }
                                    } else if (x.mapping.parentModel === event.model.name) {

                                        if (event.state == 1 || event.state == 2) {
                                            var DataObjectJunction = require('./data-object-junction').DataObjectJunction,
                                                DataObjectTag = require('./data-object-tag').DataObjectTag;

                                            if (typeof x.mapping.childModel === 'undefined') {
                                                var _ret6 = function () {
                                                    /**
                                                     * @type {DataObjectTag}
                                                     */
                                                    var tags = new DataObjectTag(obj, x.mapping);
                                                    if (event.model.$silent) {
                                                        tags.getBaseModel().silent();
                                                    }
                                                    return {
                                                        v: {
                                                            v: tags.silent().all().then(function (result) {
                                                                var toBeRemoved = result.filter(function (x) {
                                                                    return childs.indexOf(x) < 0;
                                                                });
                                                                var toBeInserted = childs.filter(function (x) {
                                                                    return result.indexOf(x) < 0;
                                                                });
                                                                if (toBeRemoved.length > 0) {
                                                                    return tags.remove(toBeRemoved).then(function () {
                                                                        if (toBeInserted.length == 0) {
                                                                            return cb();
                                                                        }
                                                                        return tags.insert(toBeInserted).then(function () {
                                                                            return cb();
                                                                        });
                                                                    }).catch(function (err) {
                                                                        return cb(err);
                                                                    });
                                                                }
                                                                if (toBeInserted.length == 0) {
                                                                    return cb();
                                                                }
                                                                return tags.insert(toBeInserted).then(function () {
                                                                    return cb();
                                                                });
                                                            }).catch(function (err) {
                                                                return cb(err);
                                                            })
                                                        }
                                                    };
                                                }();

                                                if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
                                            } else {
                                                junction = new DataObjectJunction(obj, x.mapping);
                                                if (event.model.$silent) {
                                                    junction.getBaseModel().silent();
                                                }
                                                junction.insert(childs, function (err) {
                                                    if (err) {
                                                        return cb(err);
                                                    }
                                                    var toBeRemoved = [],
                                                        toBeInserted = [];
                                                    _.forEach(childs, function (x) {
                                                        if (x.$state == 4) {
                                                            toBeRemoved.push(x);
                                                        } else {
                                                            toBeInserted.push(x);
                                                        }
                                                    });
                                                    junction.insert(toBeInserted, function (err) {
                                                        if (err) {
                                                            return cb(err);
                                                        }
                                                        junction.remove(toBeRemoved, function (err) {
                                                            if (err) {
                                                                return cb(err);
                                                            }
                                                            return cb();
                                                        });
                                                    });
                                                });
                                            }
                                        } else {
                                            cb();
                                        }
                                    } else {
                                        cb();
                                    }
                                }();

                                if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
                            } else cb(null);
                        }, function (err) {
                            callback(err);
                        });
                    })();
                }
            } catch (err) {
                callback(err);
            }
        }
    }]);

    return DataObjectAssociationListener;
}();
//# sourceMappingURL=associations.js.map
