/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpController} from "../mvc";
declare class HttpDataController extends HttpController {
    model: any;
    new(callback: (err?: Error, res?: any) => void):void;
    edit(callback: (err?: Error, res?: any) => void):void;
    schema(callback: (err?: Error, res?: any) => void):void;
    show(callback: (err?: Error, res?: any) => void):void;
    remove(callback: (err?: Error, res?: any) => void):void;
    filter(callback: (err?: Error, res?: any) => void):void;
    index(callback: (err?: Error, res?: any) => void):void;
    association(callback: (err?: Error, res?: any) => void):void;
}

export default HttpDataController;
