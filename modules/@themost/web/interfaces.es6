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
import 'source-map-support/register';
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
     * @param {HttpApplication} app
     */
    constructor(app) {
        Args.check(new.target !== HttpApplicationService, new AbstractClassError());
        Args.notNull(app, 'HTTP Application');
        this[applicationProperty] = app;
    }
    /**
     * @returns {HttpApplication}
     */
    getApplication() {
        return this[applicationProperty];
    }
}

const contextProperty = Symbol('context');

/**
 * @classdesc An abstract class which represents an HTTP application service
 * @class
 *
 */
export class HttpViewEngine {
    /**
     * @param {HttpContext} context
     */
    constructor(context) {
        Args.check(new.target !== HttpViewEngine, new AbstractClassError());
        Args.notNull(context, 'HTTP context');
        this[contextProperty] = context;
    }
    /**
     * @returns {HttpContext}
     */
    getContext() {
        return this[contextProperty];
    }

    /**
     * Renders the specified view with the options provided
     * @param {string} url
     * @param {*} options
     * @param {Function} callback
     */
    render(url, options, callback) {
        throw new AbstractMethodError();
    }

}