/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpApplication} from "./app";
import {HttpJsonResult} from "./mvc";
import {ODataModelBuilder} from "@themost/data";

export declare class ODataModelBuilderConfiguration {
    static config(app: HttpApplication): Promise<any>;
    static configSync(app: HttpApplication): ODataModelBuilder;
}

export declare class ODataJsonResult extends HttpJsonResult {
    entitySet: any;
}
