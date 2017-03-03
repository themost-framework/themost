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
import {ConfigurationStrategy,ConfigurationBase} from '@themost/common/config';
import {PathUtils} from "@themost/common/utils";
import {TraceUtils} from "@themost/common/utils";

const routesProperty  = Symbol('routes');

export class HttpConfiguration extends ConfigurationBase {
    /**
     * @param {string} configPath
     */
    constructor(configPath) {
        super(configPath);
        if (!this.hasSourceAt('mimes')) {
            this.setSourceAt('mimes',[]);
        }
        if (!this.hasSourceAt('engines')) {
            this.setSourceAt('engines',[]);
        }
        try {
            this[routesProperty] = require(PathUtils.join(this.getConfigurationPath(),'routes.json'))
        }
        catch(err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                this[routesProperty] = require('./resources/routes.json');
            }
            else {
                TraceUtils.error('An error occurred while loading routes collection');
                TraceUtils.error(err);
            }

        }
    }

    /**
     * Gets a collection of mime types registered for the current application
     * @returns {Array}
     */
    get mimeTypes() {
        this.getSourceAt('mimes');
    }

    /**
     * Gets a collection of mime types registered for the current application
     * @returns {Array}
     */
    get engines() {
        this.getSourceAt('engines');
    }

    /**
     * Gets a collection of routes registered for the current application
     * @returns {Array}
     */
    get routes() {
        return this[routesProperty];
    }

    /**
     * Gets a mime type based on the given extension
     * @param {string} extension
     * @returns {T}
     */
    getMimeType(extension) {
        return _.find(this.mimeTypes,function(x) {
            return (x.extension===extension) || (x.extension==='.'+extension);
        });
    }

}