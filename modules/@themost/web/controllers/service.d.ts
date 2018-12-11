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

declare class HttpServiceController extends HttpBaseController {
    getMetadata():Promise<string>;
    getIndex():Promise<HttpJsonResult>;
    getItems(entitySet: string): Promise<HttpJsonResult>;
    postItems(entitySet: string): Promise<HttpJsonResult>;
    getItem(entitySet: string, id: any): Promise<HttpJsonResult>;
    patchItem(entitySet: string, id: any): Promise<HttpJsonResult>;
    deleteItem(entitySet: string, id: any): Promise<HttpJsonResult>;
    postItem(entitySet: string, id: any): Promise<HttpJsonResult>;
    getNavigationProperty(entitySet: string, navigationProperty: string, id: any): Promise<HttpJsonResult>;
    getEntityAction(entitySet: string, entityAction: string, navigationProperty: string): Promise<HttpJsonResult>;
    getEntitySetFunction(entitySet: string, entityFunction: string, navigationProperty: string): Promise<HttpJsonResult>;
    postEntityAction(entitySet: string, entityAction: string, id: any): Promise<HttpJsonResult>;
    postEntitySetAction(entitySet: string, entityAction: string): Promise<HttpJsonResult>;
    getBuilder():any;

}

export default HttpServiceController;