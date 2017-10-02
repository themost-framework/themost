/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import Q from 'q';
import _ from 'lodash';
import moment from 'moment';
import {HttpResult} from "./results";
import {EntitySetConfiguration} from "@themost/data/odata";
import {Args,LangUtils} from "@themost/common/utils";
import {EdmType} from "@themost/data/odata";



/**
 * @class
 * @extends HttpResult
 */
export class ODataJsonResult extends HttpResult {
    constructor(data, entitySet) {
        super();
        this.entitySet = entitySet;
        Args.check(entitySet instanceof EntitySetConfiguration, new TypeError('EntitySet must be an instance of EntitySetConfiguration class'));
        this.data = data;
        this.contentType = 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8';
        this.contentEncoding = 'utf8';
        this.headers = {
                'Cache': 'no-cache',
                'OData-Version': '4.0'
        }
    }

    /**
     *
     * @param {HttpContext} context
     * @returns {Promise}
     */
    execute(context) {
        const data = this.data;
        const headers = this.headers;
        const contentEncoding = this.contentEncoding;
        const contentType = this.contentType;
        /**
         * @type {EntitySetConfiguration}
         */
        const entitySet = this.entitySet;
        if (_.isNil(context)) {
            return Q.reject('HTTP context may not be null');
        }
        const req = context.request;
        if (_.isNil(req)) {
            return Q.reject('HTTP request may not be null');
        }
        const res = context.response;
        if (_.isNil(res)) {
            return Q.reject('HTTP response may not be null');
        }
        return Q.promise(function(resolve, reject) {
            if (_.isNil(data)) {
                res.writeHead(204);
                return resolve();
            }
            const eachValue = function(x) {
                //add id link
                if (typeof entitySet.getIdLink === 'function') {
                    const idLink = entitySet.getIdLink(context, x);
                    if (idLink) {
                        x["@odata.id"] = idLink;
                    }
                }
                //add edit link
                if (typeof entitySet.getEditLink === 'function') {
                    const editLink = entitySet.getEditLink(context, x);
                    if (editLink) {
                        x["@odata.editLink"] = editLink;
                    }
                }
                //add read link
                if (typeof entitySet.getReadLink === 'function') {
                    const readLink = entitySet.getReadLink(context, x);
                    if (readLink) {
                        x["@odata.readLink"] = readLink;
                    }
                }
                return x;
            };
            const json_odata_replacer = function(key, value) {
                if (value===null)
                    return undefined;
                /*eslint-disable no-invalid-this*/
                const entityProperty = this[key];
                /*eslint-enable no-invalid-this*/
                if (entityProperty) {
                    if (entityProperty.type === EdmType.EdmBoolean) {
                        return LangUtils.parseBoolean(value);
                    }
                    else if (entityProperty.type === EdmType.EdmDate) {
                        return moment(value).format('YYYY-MM-DD');
                    }
                    else if (entityProperty.type === EdmType.EdmDateTimeOffset) {
                        return moment(value).format('YYYY-MM-DDTHH:mm:ssZ');
                    }
                }
                if (value instanceof Date) {
                    return moment(value).format('YYYY-MM-DDTHH:mm:ss');
                }
                return value;
            };
            const entityProperties = {};
            _.forEach(entitySet.getEntityTypeProperty(), function(x) {
                entityProperties[x.name] = x;
            });
            let contextLink;
            if (data && data.hasOwnProperty('value')) {
                res.writeHead(200, _.assign(headers, { 'Content-Type': contentType }));
                //search for boolean
                if (_.isArray(data.value)) {
                    //map array
                    _.forEach(data.value, eachValue);
                }
                else {
                    eachValue(data);
                    //add context attribute
                    contextLink = entitySet.getContextLink(context);
                    if (contextLink) {
                        data["@odata.context"] = contextLink.concat("/$entity");
                    }
                }
            }
            else if (_.isObject(data)) {
                eachValue(data);
                //add context attribute
                contextLink = entitySet.getContextLink(context);
                if (contextLink) {
                    data["@odata.context"] = contextLink.concat("/$entity");
                }
            }
            res.write(JSON.stringify(data, json_odata_replacer.bind(entityProperties)),contentEncoding, function(err) {
                return resolve(err);
            });

        });
    }

}