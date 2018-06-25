/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {AuthenticateRequestHandler} from "../types";
import {HttpContext} from "../context";

export declare class BasicAuthHandler implements AuthenticateRequestHandler {
    authenticateRequest(context: HttpContext, callback: (err?: Error) => void);
}

export declare function createInstance(): BasicAuthHandler;