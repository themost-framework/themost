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
import HttpDataController from '../../../modules/@themost/web/controllers/data';
import {httpAction, httpGet, httpController} from '../../../modules/@themost/web/decorators';
import url from 'url';
import {LangUtils} from '../../../modules/@themost/common/utils'
import {TraceUtils} from "../../../modules/@themost/common";

@httpController()
export default class OrderController extends HttpDataController {

    constructor(context) {
        super(context);
    }

    getNextLink(result) {
        if (result.hasOwnProperty("total")) {
            const urlObject = url.parse(this.context.request.url, true);
            //get next link
            const $skip = LangUtils.parseInt(urlObject.query.$skip);
            const $top = LangUtils.parseInt(urlObject.query.$top) || 25;
            if (result.total>=$skip+$top) {
                urlObject.query.$skip = $skip+$top;
                urlObject.query.$top = $top;
                urlObject.query.$count = true;
                delete urlObject.search;
                return url.format(urlObject);
            }
        }
    }

    getPrevLink(result) {
        if (result.hasOwnProperty("total")) {
            const urlObject = url.parse(this.context.request.url, true);
            //get next link
            const $skip = LangUtils.parseInt(urlObject.query.$skip);
            const $top = LangUtils.parseInt(urlObject.query.$top) || 25;
            if ($skip-$top>=0) {
                urlObject.query.$skip = $skip-$top;
                urlObject.query.$top = $top;
                urlObject.query.$count = true;
                delete urlObject.search;
                return url.format(urlObject);
            }
        }
    }

    mapResult(result) {
        _.assign({
            total:result.total,
            skip:result.skip,
            nextLink:this.getNextLink(result),
            prevLink:this.getPrevLink(result)
        }, {
            value:result.value
        });
    }

    @httpGet()
    @httpAction('index')
    getItems() {
        return Q.nbind(super.index, this)();
    }

}