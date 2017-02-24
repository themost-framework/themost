/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import {QueryExpression} from './query';

export * from './utils';
export * from './expressions';
export * from './odata';
export * from './formatter';
export * from './query';

export class QueryUtils {
    /**
     * Initializes a select query expression by specifying the entity name
     * @param {string|*} entity - The name of the entity
     */
    static query(entity) {
        return QueryExpression.create(entity);
    }
    /**
     * Initializes a select query expression
     * @param {*...} fields
     */
    static select(fields) {
        const q = new QueryExpression();
        return q.select.apply(q,fields);
    }
    /**
     * Initializes an insert query expression
     * @param {*} obj - The object to insert
     */
    static insert(obj) {
        const q = new QueryExpression();
        return q.insert(obj);
    }

    /**
     * Initializes an update query expression
     * @param {string|*} entity - The name of the entity
     */
    static update(entity) {
        const q = new QueryExpression();
        return q.update(entity);
    }

    /**
     * Initializes a delete query expression
     * @param {string} entity - The name of the entity
     */
    static delete(entity) {
        const q = new QueryExpression();
        return q.delete(entity);
    }


}