/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import HttpBaseController from "./base";
import {HttpJsonResult} from "../mvc";
import {HttpApplication} from "../app";

declare class HttpServiceController extends HttpBaseController {
    static configure(app: HttpApplication): void;
    getMetadata():Promise<string>;
    getIndex():Promise<any>;
    getItems(entitySet: string): Promise<any>;
    postItems(entitySet: string): Promise<any>;
    deleteItems(entitySet: string): Promise<any>;
    getItem(entitySet: string, id: any): Promise<any>;
    patchItem(entitySet: string, id: any): Promise<any>;
    deleteItem(entitySet: string, id: any): Promise<any>;
    postItem(entitySet: string, id: any): Promise<any>;
    getNavigationProperty(entitySet: string, navigationProperty: string, id: any): Promise<any>;
    getEntityFunction(entitySet: string, entityFunction: string, id: any): Promise<any>;
    getEntitySetFunction(entitySet: string, entityFunction: string, navigationProperty?: string): Promise<any>;
    postEntityAction(entitySet: string, entityAction: string, id: any): Promise<any>;
    postEntitySetAction(entitySet: string, entityAction: string): Promise<any>;
    postEntitySetFunction(eentitySet: string, entitySetFunction: string, entityAction: string): Promise<any>;
    getBuilder():any;

}

export default HttpServiceController;
