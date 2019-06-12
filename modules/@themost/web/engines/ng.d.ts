/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpContext} from "../context";
import {HttpViewEngine} from "../types";
import {IncomingMessage, ServerResponse} from "http";
import * as angular from "angular";
import IModule = angular.IModule;

export declare class NgApplication {
    useService(serviceCtor: Function): NgApplication;
    hasService(serviceCtor: Function): any;
    getService(serviceCtor: Function): any;
}

export declare class NgContext {
    application: NgApplication;
    request: IncomingMessage;
    response: ServerResponse;
    getApplication(): NgApplication;
}

export declare class NgEngine extends HttpViewEngine {
    constructor(context: HttpContext);

    context: HttpContext;
    getContext(): HttpContext;
    render(filename: string, data: any, callback: (err?: Error, res?: string) => void);
    renderString(str: string, data?: any): Promise<any>;
    bootstrap(bootstrapFunc: (angular: angular.IAngularStatic) => IModule): NgEngine;

}

export declare function createInstance(): NgEngine;
