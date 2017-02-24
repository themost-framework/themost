/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import async from 'async';
import {ParserUtils} from './types';
import {_} from 'lodash';

/**
 * @class
 */
export class DataObjectAssociationListener {
    /**
     *
     * @param {DataEventArgs} e
     * @param {function(Error=)} callback
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
                    if (e.target.hasOwnProperty(x) && typeof e.target[x] === 'object' && e.target[x] != null) {
                            //try to find field mapping, if any
                            const mapping = e.model.inferMapping(x);
                            if (mapping && mapping.associationType==='association' && mapping.childModel===e.model.name)
                                mappings.push(mapping);
                    }
                });
                async.eachSeries(mappings,
                    /**
                     * @param {DataAssociationMapping} mapping
                     * @param {function(Error=)} cb
                     */
                    function(mapping, cb) {
                        if (mapping.associationType==='association' && mapping.childModel===e.model.name) {
                            /**
                             * @type {DataField|*}
                             */
                            const field = e.model.field(mapping.childField), childField = field.property || field.name;
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
                                else if (result.total==0) {
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
     * @param {function(Error=)} callback
     */
    afterSave(event, callback) {
        try {
            if (typeof event.target === 'undefined' || event.target==null) {
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
                            if (mapping.associationType=='junction') {
                                mappings.push({ name:x, mapping:mapping });
                            }
                    }
                });
                async.eachSeries(mappings,
                    /**
                     * @param {{name:string,mapping:DataAssociationMapping}} x
                     * @param {function(Error=)} cb
                     */
                    function(x, cb) {
                        if (x.mapping.associationType=='junction') {
                            const obj = event.model.convert(event.target);

                            /**
                             * @type {*|{deleted:Array}}
                             */
                            const childs = obj[x.name];

                            let junction;
                            if (!_.isArray(childs)) { return cb(); }
                            if (x.mapping.childModel===event.model.name) {
                                const HasParentJunction = require('./has-parent-junction').HasParentJunction;
                                junction = new HasParentJunction(obj, x.mapping);
                                if (event.model.$silent) {
                                    junction.getBaseModel().silent();
                                }
                                if (event.state==1 || event.state==2) {
                                    const toBeRemoved = [], toBeInserted = [];
                                    _.forEach(childs, function(x) {
                                        if (x.$state == 4) {
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

                                if (event.state==1 || event.state==2) {
                                    const DataObjectJunction = require('./data-object-junction').DataObjectJunction, DataObjectTag = require('./data-object-tag').DataObjectTag;

                                    if (typeof x.mapping.childModel === 'undefined') {
                                        /**
                                         * @type {DataObjectTag}
                                         */
                                        const tags = new DataObjectTag(obj, x.mapping);
                                        if (event.model.$silent) { tags.getBaseModel().silent(); }
                                        return tags.silent().all().then(function(result) {
                                            const toBeRemoved = result.filter(function(x) { return childs.indexOf(x)<0; });
                                            const toBeInserted = childs.filter(function(x) { return result.indexOf(x)<0; });
                                            if (toBeRemoved.length>0) {
                                                return tags.remove(toBeRemoved).then(function() {
                                                    if (toBeInserted.length==0) { return cb(); }
                                                    return tags.insert(toBeInserted).then(function() {
                                                        return cb();
                                                    });
                                                }).catch(function (err) {
                                                    return cb(err);
                                                });
                                            }
                                            if (toBeInserted.length==0) { return cb(); }
                                            return tags.insert(toBeInserted).then(function() {
                                                return cb();
                                            });
                                        }).catch(function (err) {
                                            return cb(err);
                                        });
                                    }
                                    else {
                                        junction = new DataObjectJunction(obj, x.mapping);
                                        if (event.model.$silent) { junction.getBaseModel().silent(); }
                                        junction.insert(childs, function(err) {
                                            if (err) { return cb(err); }
                                            const toBeRemoved = [], toBeInserted = [];
                                            _.forEach(childs, function(x) {
                                                if (x.$state == 4) {
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