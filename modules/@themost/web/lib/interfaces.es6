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
import {_} from 'lodash';
import {Args} from '@themost/common/utils';
import {AbstractMethodError,AbstractClassError} from '@themost/common/errors';

const applicationProperty = Symbol('application');
/**
 * @classdesc An abstract class which represents an HTTP application service
 * @class
 *
 */
export class HttpApplicationService {
    /**
     * @param {HttpApplication2} app
     */
    constructor(app) {
        Args.check(new.target !== HttpApplicationService, new AbstractClassError());
        Args.notNull(app, 'HTTP Application');
        this[applicationProperty] = app;
    }
    /**
     * @returns {HttpApplication2}
     */
    getApplication() {
        return this[applicationProperty];
    }
}