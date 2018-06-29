/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpApplicationService} from "../types";

export declare class AngularServerModule extends HttpApplicationService {

    useBootstrapModule(modulePath: string): AngularServerModule;
    bootstrap(bootstrapFunc: (angular:any)=> void);
    service(name: string, ctor: Function): AngularServerModule;
    directive(name: string, ctor: Function): AngularServerModule;
    filter(name: string, ctor: Function): AngularServerModule;
    controller(name: string, ctor: Function): AngularServerModule;
    createDocument(s: string): HTMLDocument;

}
