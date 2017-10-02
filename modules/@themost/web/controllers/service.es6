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
import {httpAction,httpGet} from "../decorators";
import _ from 'lodash';
import Q from 'q';
import urljoin from 'url-join';
import {HttpNextResult} from "../results";
import {ODataJsonResult} from "../odata";
export default class DataServiceController extends HttpController {
    constructor(context) {
        super(context);
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
                contentType:'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8'
            }));
        });
    }

    @httpGet()
    @httpAction("metadata")
    getMetadata() {
        /**
         * @type {ODataModelBuilder|*}
         */
        const builder = this.context.getApplication().getConfiguration().getStrategy(ODataModelBuilder);
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
        return builder.getEdmDocument().then((result) => {
            return Q(_.assign(new HttpXmlResult(result.outerXML()), {
                contentType:'application/xml;charset=utf-8'
            }));
        });
    }

    @httpGet()
    @httpAction("items")
    getItems(entity) {
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
            model.filter(params, (err, q) => {
                if (err) {
                    return reject(err);
                }
                if (/true/i.test(params.$inlinecount) || /true/i.test(params.$count)) {
                    return q.getList().then((result) => {
                        return resolve(new ODataJsonResult({
                            "@odata.context": entitySet.getContextLink(context),
                            "@odata.count": result.total,
                            "value": result.records
                        }, entitySet));
                    }).catch((err) => {
                        return reject(err);
                    });
                }
                return q.getItems().then((result) => {
                    return resolve(new ODataJsonResult({
                        "@odata.context": entitySet.getContextLink(context),
                            "value": result
                    }, entitySet));
                }).catch((err) => {
                    return reject(err);
                });
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
}