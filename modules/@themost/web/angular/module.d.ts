/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpApplicationService} from "../types";
import * as angular from "angular";
import IModule = angular.IModule;

export declare class AngularServerModule extends HttpApplicationService {

    defaults: any;
    useBootstrapModule(modulePath: string): AngularServerModule;
    bootstrap(bootstrapFunc: (angular: angular.IAngularStatic)=> IModule): AngularServerModule;
    service(name: string, ctor: any): AngularServerModule;
    directive(name: string, ctor: any): AngularServerModule;
    filter(name: string, ctor: any): AngularServerModule;
    controller(name: string, ctor: any): AngularServerModule;
    createDocument(s: string): HTMLDocument;

}
