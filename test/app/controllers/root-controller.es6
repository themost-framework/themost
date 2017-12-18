/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import Q from 'q';
import {HttpController} from '../../../modules/@themost/web/mvc';
import {httpAction, httpGet, httpParam, httpController} from '../../../modules/@themost/web/decorators';
import {HttpConsumer} from "../../../modules/@themost/web/consumers";
import {HttpError} from "../../../modules/@themost/common/errors";

function httpNotImplemented() {
    return function (target, key, descriptor) {
        descriptor.value.notImplemented = new HttpConsumer(()=> {
            return Q.reject(new HttpError(501));
        });
        return descriptor;
    }
}

@httpController()
/**
 * @class
 * @augments HttpController
 */
class RootController extends HttpController {

    constructor() {
        super();
    }

    @httpGet()
    index() {
        return Q({
            title:"MOST Web Framework Codename Blueshift v2"
        });
    }

    @httpGet()
    app() {
        return Q();
    }

    @httpGet()
    message() {
        return Q();
    }

}

//noinspection JSUnusedGlobalSymbols
export default RootController;







