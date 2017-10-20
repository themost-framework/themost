/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import {HttpController, HttpJsonResult, HttpXmlResult} from '../mvc';
import {ODataModelBuilder} from "@themost/data/odata";
import {DataError} from "@themost/common/errors";
import {httpAction,httpGet,httpPost,httpPut,httpDelete} from "../decorators";
import _ from 'lodash';
import Q from 'q';
import urljoin from 'url-join';
import {HttpNextResult} from "../results";
import {ODataJsonResult} from "../odata";
import {LangUtils,Args} from "@themost/common/utils";
import {HttpNotFoundError} from "@themost/common/errors";
import {EntitySetConfiguration, EntityTypeConfiguration} from "../../data/odata";
import {AttachmentFileSystemStorage} from "../files";

export default class DataServiceController extends HttpController {
    constructor(context) {
        super(context);
    }

    /**
     * Gets the current entity set, if any
     * @returns {EntitySetConfiguration}
     */
    getEntitySet() {
        if (this.context.request && this.context.request.routeData && this.context.request.routeData.entity) {
            /**
             * @type {ODataModelBuilder|*}
             */
            const builder = this.getBuilder();
            if (_.isNil(builder)) {
                return Q.reject(new DataError("ENOENT", "Data model builder strategy is not defined."));
            }
            return builder.getEntitySet(this.context.request.routeData.entity);
        }
    }

    /**
     *
     * @param {EntitySetConfiguration} entitySet
     * @returns Promise<DataQueryable>
     */
    getQueryable(entitySet) {

        if (!(entitySet instanceof EntitySetConfiguration)) {
            return Q.reject(new TypeError("Entity Set must be an instance of EntitySetConfiguration class."));
        }
        const context = this.context;
        const model = context.model(entitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new TypeError("Data model may not be null."));
        }
        return Q.nfbind(model.filter.bind(model))(this.context.params);
    }

    /**
     *
     * @return {ODataModelBuilder|*}
     */
    getBuilder() {
        return this.context.getApplication().getConfiguration().getStrategy(ODataModelBuilder);
    }

    @httpGet()
    @httpAction("index")
    getService() {
        /**
         * @type {ODataModelBuilder|*}
         */
        const builder = this.context.getApplication().getConfiguration().getStrategy(ODataModelBuilder);
        const context = this.context;
        if (_.isNil(builder)) {
            return Q.reject(new DataError("ENOENT", "Data model builder strategy is not defined."));
        }
        const res = this.context.response;
        if (_.isNil(res)) {
            return Q.reject(new TypeError('HTTP response object may not be null'));
        }
        const req = this.context.request;
        if (_.isNil(req)) {
            return Q.reject(new TypeError('HTTP request object may not be null'));
        }
        return builder.getEdm().then(function (result) {
            return Q(_.assign(new HttpJsonResult({
                "@odata.context": builder.getContextLink(context).concat("$metadata"),
                "value": result.entityContainer.entitySet
            }), {
                contentType:'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8',
                headers: {
                    'OData-Version': '4.0'
                }
            }));
        });
    }

    @httpGet()
    @httpAction("metadata")
    getMetadata() {
        /**
         * @type {ODataModelBuilder|*}
         */
        const builder = this.getBuilder();
        const res = this.context.response;
        if (_.isNil(res)) {
            return Q.reject(new TypeError('HTTP response object may not be null'));
        }
        const req = this.context.request;
        if (_.isNil(req)) {
            return Q.reject(new TypeError('HTTP request object may not be null'));
        }
        return builder.getEdmDocument().then((result) => {
            return Q(_.assign(new HttpXmlResult(result.outerXML()), {
                contentType:'application/xml;charset=utf-8'
            }));
        });
    }

    @httpGet()
    @httpAction("items")
    getItems() {
        const self = this;
        const context = this.context;
        const entitySet = this.getEntitySet();
        if (_.isNil(entitySet)) {
            return Q(new HttpNextResult());
        }
        const params = this.context.params;
        return Q.promise(function(resolve, reject) {
            self.getQueryable(entitySet).then(function(q) {
                const $top = /^[+-]?[0-9]+$/.test(params.$top) ? LangUtils.parseInt(params.$top) : 25;
                if (/true/i.test(params.$count)) {
                    return q.take($top).getList().then((result) => {
                        return resolve(entitySet.getBuilder().jsonFormatter(context, entitySet, result.records));
                    });
                }
                return q.take($top).getItems().then((result) => {
                    return resolve(entitySet.getBuilder().jsonFormatter(context, entitySet, result));
                });

            }).catch(function(err) {
                return reject(err);
            });
        });
    }

    @httpGet()
    @httpAction("item")
    getItem(entity, id) {
        /**
         * @type {ODataModelBuilder|*}
         */
        const builder = this.context.getApplication().getConfiguration().getStrategy(ODataModelBuilder);
        const context = this.context;
        if (_.isNil(builder)) {
            return Q.reject(new DataError("ENOENT", "Data model builder strategy is not defined."));
        }
        const entitySet = builder.getEntitySet(entity);
        if (_.isNil(entitySet)) {
            return Q(new HttpNextResult());
        }
        /**
         * @type {DataModel}
         */
        const model = this.context.model(entitySet.entityType.name);
        if (_.isNil(model)) {
            return Q(new HttpNextResult());
        }
        const params = this.context.params;
        return Q.promise(function(resolve, reject) {
            return model.where(model.primaryKey).equal(id).getItem().then((result) => {
                return resolve(new ODataJsonResult(result, entitySet));
            }).catch((err) => {
                return reject(err);
            });
        });
    }

    @httpGet()
    @httpAction("property")
    getProperty(entity, property, id) {
        const self = this, context = self.context;
        const entitySet = this.getEntitySet(entity);
        if (_.isNil(entitySet)) {
            return Q(new HttpNextResult());
        }
        let entityProperty = entitySet.getEntityTypeProperty(property);
        let isNavigable = false;
        if (_.isNil(entityProperty)) {
            entityProperty = entitySet.getEntityTypeNavigationProperty(property);
            if (_.isNil(entityProperty)) {
                return Q.reject(new HttpNotFoundError());
            }
            isNavigable = true;
        }
        //validate request property
        /**
         * @type {DataModel}
         */
        const model = this.context.model(entitySet.entityType.name);
        if (_.isNil(model)) {
            return Q(new HttpNextResult());
        }
        const params = this.context.params;
        return Q.promise(function(resolve, reject) {
            if (isNavigable) {
                return model.where(model.primaryKey).equal(id).getTypedItem().then((result) => {
                    if (_.isNil(result)) {
                        return reject(new HttpNotFoundError());
                    }
                    /**
                     * @type {DataQueryable|*}
                     */
                    const q = result.property(entityProperty.name);
                    let contextLink;
                    const navigationEntitySet = self.getBuilder().getEntityTypeEntitySet(q.model.name);

                    if (/^Collection\(/.test(entityProperty.type)) {
                        const $top = /^[+-]?[0-9]+$/.test(params.$top) ? LangUtils.parseInt(params.$top) : 25;
                        if (/true/i.test(params.$count)) {
                            return q.take($top).getList().then((result) => {
                                return resolve(new ODataJsonResult({
                                    "@odata.context": navigationEntitySet.getContextLink(context),
                                    "@odata.count": result.total,
                                    "value": result.records
                                }, navigationEntitySet));
                            }).catch((err) => {
                                return reject(err);
                            });
                        }
                        return q.take($top).getItems().then((result) => {
                            return resolve(new ODataJsonResult({
                                "@odata.context": navigationEntitySet.getContextLink(context),
                                "value": result
                            }, navigationEntitySet));
                        }).catch((err) => {
                            return reject(err);
                        });
                    }
                    else {
                        return q.getItem().then((result) => {

                            return resolve(new ODataJsonResult({
                                "@odata.context": navigationEntitySet.getContextLink(context),
                                "value": result
                            }, navigationEntitySet));
                        }).catch((err) => {
                            return reject(err);
                        });
                    }
                }).catch((err) => {
                    return reject(err);
                });
            }
            else {
                return model.where(model.primaryKey).equal(id).select(entityProperty.name).value().then((result) => {
                    return resolve(new ODataJsonResult({
                        "value":result
                    }, entitySet));
                }).catch((err) => {
                    return reject(err);
                });
            }

        });
    }



}