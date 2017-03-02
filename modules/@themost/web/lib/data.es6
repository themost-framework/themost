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
import {DataConfiguration} from '@themost/data/config';
import {HttpApplicationService} from "./interfaces";
import {Args} from "@themost/common/utils";
import {AbstractClassError, AbstractMethodError} from "@themost/common/errors";
/**
 * @class
 */
export class DataConfigurationStrategy extends HttpApplicationService {
    /**
     * @constructor
     * @param {HttpApplication} app
     */
    constructor(app) {
        Args.check(new.target !== DataConfigurationStrategy, new AbstractClassError());
        super(app)
    }

    /**
     * @returns DataConfiguration
     */
    getConfiguration() {
        throw new AbstractMethodError();
    }

}

const configurationProperty  = Symbol('config');
/**
 * @class
 */
export class DefaultDataConfigurationStrategy extends DataConfigurationStrategy {

    /**
     * @constructor
     * @param {HttpApplication} app
     */
    constructor(app) {
        super(app);
    }

    /**
     * @returns DataConfiguration
     */
    getConfiguration() {
        if (typeof this[configurationProperty] === 'undefined')
            this[configurationProperty] = new DataConfiguration(this.getApplication().getConfigurationPath());
        return this[configurationProperty];
    }

}