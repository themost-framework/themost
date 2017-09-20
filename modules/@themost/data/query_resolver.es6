/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

'use strict';
import _ from 'lodash';
import Q from 'q';
import {Args} from "@themost/common/utils";
import {LangUtils} from "../common/utils";

const TopQueryOption = "$top";

export class QueryOptionsResolver {

    /**
     * @param {DataQueryable} q
     * @param {*} option
     * @returns Promise
     */
    static resolveTopQueryOption(q, option) {
        if (_.isNil(option)) {
            return Q();
        }
        return Q.promise((resolve)=> {
            Args.check(/^[+-]?[0-9]*$/.test(option), new TypeError('Top query option must be an integer'));
            const $top = LangUtils.parseInt(option);
            q.take($top<=0 ? -1 : $top);
            return resolve()
        });
    }

    /**
     * @param {DataQueryable} q
     * @param {*} option
     */
    static resolveSkipQueryOption(q, option) {
        if (_.isNil(option)) {
            return Q();
        }
        return Q.promise((resolve)=> {
            Args.check(/^[+]?[0-9]*$/.test(option),new TypeError('Skip query option must be a positive integer'));
            q.skip(LangUtils.parseInt(option));
            return resolve()
        });
    }

    /**
     * @param {DataQueryable} q
     * @param params
     */
    static resolveCountQueryOption(q, params) {

    }

}