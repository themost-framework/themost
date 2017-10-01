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
        if (_.isNil(builder)) {
            return Q.reject(new DataError("ENOENT","Data model builder strategy is not defined."));
        }
        const res = this.context.response;
        if (_.isNil(res)) {
            return Q.reject(new TypeError('HTTP response object may not be null'));
        }
        const req = this.context.request;
        if (_.isNil(req)) {
            return Q.reject(new TypeError('HTTP request object may not be null'));
        }
        return builder.getEdm().then(function(result) {
            const httpResult = new HttpJsonResult({
                "@odata.context":`http://${req.headers.host}${urljoin(req.url,'$metadata')}`,
                "value":result.entityContainer.entitySet
            });
            httpResult.contentType = 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8';
            return Q(httpResult);
        });
    }

    @httpGet()
    @httpAction("$metadata")
    getMetadata() {
        /**
         * @type {ODataModelBuilder|*}
         */
        const builder = this.context.getApplication().getConfiguration().getStrategy(ODataModelBuilder);
        if (_.isNil(builder)) {
            return Q.reject(new DataError("ENOENT","Data model builder strategy is not defined."));
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
            const httpResult = new HttpXmlResult(result.outerXML());
            httpResult.contentType = 'application/xml;charset=utf-8';
            return Q(httpResult);
        });
    }

}